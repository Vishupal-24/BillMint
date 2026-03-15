import POSBill from "../models/POSBill.js";
import Receipt from "../models/Receipt.js";
import Merchant from "../models/Merchant.js";
import { finalizeBillAndCreateReceipt } from "../services/receiptFinalizer.js";
import { assertTransitionAllowed } from "../utils/billStateMachine.js";

/**
 * POS Controller - Merchant-Confirmed UPI Payment System
 * 
 * This implements a bank-grade POS flow:
 * - No webhooks, no payment gateway
 * - UPI deep links for payment
 * - Merchant is the ONLY source of payment truth
 * 
 * Used by: BharatPe POS, PhonePe Soundbox, Zomato Pay (QR mode)
 */

/**
 * POST /api/pos/bills
 * Create a new POS bill and generate UPI QR data
 * 
 * Request body:
 * {
 *   items: [{ name: string, price: number, quantity: number }],
 *   customerPhone?: string,
 *   customerName?: string,
 *   expiryMinutes?: number (default 10)
 * }
 */
export const createBill = async (req, res) => {
  try {
    const merchantId = req.user.id;
    const { items, customerPhone, customerName, expiryMinutes = 10 } = req.body;

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Bill must have at least one item" });
    }

    // Validate each item
    for (const item of items) {
      if (!item.name || typeof item.price !== "number" || item.price < 0) {
        return res.status(400).json({ message: "Each item must have a name and valid price" });
      }
    }

    // Calculate total
    const total = items.reduce((sum, item) => {
      const qty = item.quantity || 1;
      return sum + (item.price * qty);
    }, 0);

    if (total <= 0) {
      return res.status(400).json({ message: "Bill total must be greater than 0" });
    }

    // Get merchant details for UPI
    const merchant = await Merchant.findById(merchantId).select("shopName upiId upiName isUpiVerified merchantCode upiType");
    
    if (!merchant) {
      return res.status(404).json({ message: "Merchant not found" });
    }

    // Check if merchant has UPI configured
    if (!merchant.upiId) {
      return res.status(400).json({ 
        message: "UPI ID not configured. Please set up your UPI ID in profile settings.",
        code: "UPI_NOT_CONFIGURED"
      });
    }

    // Create bill
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
    
    const bill = await POSBill.create({
      merchantId,
      items: items.map(item => ({
        name: item.name.trim(),
        price: item.price,
        quantity: item.quantity || 1,
      })),
      total,
      status: "AWAITING_PAYMENT",
      expiresAt,
      customerPhone: customerPhone?.trim() || null,
      customerName: customerName?.trim() || null,
    });

    // Generate UPI intent URL
    const upiPayeeName = merchant.upiName || merchant.shopName || "Merchant";
    const upiLink = buildUPILink({
      pa: merchant.upiId,
      pn: upiPayeeName,
      am: total,
      cu: "INR",
      tn: bill.upiNote,
      upiType: merchant.upiType || "PERSONAL", // Default to PERSONAL for safety
    });

    res.status(201).json({
      message: "Bill created successfully",
      bill: {
        id: bill._id,
        billId: bill._id,
        upiNote: bill.upiNote,
        total: bill.total,
        items: bill.items,
        status: bill.status,
        expiresAt: bill.expiresAt,
        createdAt: bill.createdAt,
      },
      upi: {
        link: upiLink,
        payeeId: merchant.upiId,
        payeeName: upiPayeeName,
        amount: total,
        note: bill.upiNote,
      },
      merchant: {
        name: merchant.shopName,
        code: merchant.merchantCode,
      },
    });
  } catch (error) {
    console.error("[POS] Create bill error:", error);
    res.status(500).json({ message: "Failed to create bill" });
  }
};

/**
 * POST /api/pos/bills/:billId/confirm
 * Merchant confirms payment received
 * 
 * This is the ONLY way to mark a bill as PAID.
 * The merchant is the source of truth.
 */
export const confirmPayment = async (req, res) => {
  try {
    const merchantId = req.user.id;
    const { billId } = req.params;
    const { customerPhone, customerName, paymentMethod } = req.body;

    // Validate payment method upfront
    if (paymentMethod && !['cash', 'upi', 'other', 'khata'].includes(paymentMethod)) {
      return res.status(400).json({
        message: "Invalid payment method. Use 'cash', 'upi', 'other', or 'khata'",
        code: "INVALID_PAYMENT_METHOD",
      });
    }

    // Phase 3: Fetch bill first to check status & transitions
    const bill = await POSBill.findOne({ _id: billId, merchantId });

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    // Check expiry for AWAITING_PAYMENT bills first
    if (bill.status === "AWAITING_PAYMENT") {
      const isExpired = await bill.checkAndExpire();
      if (isExpired) {
        return res.status(400).json({ 
          message: "Bill has expired",
          code: "BILL_EXPIRED" 
        });
      }
    }

    const isKhata = paymentMethod === 'khata' || (!paymentMethod && (bill.paymentMethod === 'khata' || bill.paymentMethod === 'pending'));
    const targetStatus = isKhata ? "PENDING_KHATA" : "PAID";

    // Enforce strict transitions (Phase 3.2)
    try {
      assertTransitionAllowed(bill.status, targetStatus);
    } catch (error) {
      return res.status(400).json({ 
        message: error.message,
        code: "INVALID_STATE_TRANSITION"
      });
    }

    // Update bill
    bill.status = targetStatus;
    if (targetStatus === "PAID") {
      bill.paidAt = new Date();
    }

    if (paymentMethod) {
      bill.paymentMethod = paymentMethod;
      bill.customerSelected = true;
    } else if (bill.paymentMethod === 'pending') {
      // Legacy fallback
      bill.paymentMethod = 'khata';
    }

    if (customerPhone) bill.customerPhone = customerPhone.trim();
    if (customerName) bill.customerName = customerName.trim();

    await bill.save();

    // Create receipt (idempotent + centralized)
    const receipt = await finalizeBillAndCreateReceipt(bill._id, "merchant-confirm");

    res.json({
      message: "Payment confirmed successfully",
      bill: {
        id: bill._id,
        upiNote: bill.upiNote,
        total: bill.total,
        status: bill.status,
        paidAt: bill.paidAt,
        paymentMethod: bill.paymentMethod || null,
      },
      receipt: receipt
        ? {
            id: receipt._id,
            reference: bill.upiNote,
            total: receipt.total,
            issuedAt: receipt.createdAt,
          }
        : null,
    });
  } catch (error) {
    console.error("[POS] Confirm payment error:", error);
    res.status(500).json({ message: "Failed to confirm payment" });
  }
};

/**
 * POST /api/pos/bills/:billId/cancel
 * Merchant cancels an unpaid bill
 */
export const cancelBill = async (req, res) => {
  try {
    const merchantId = req.user.id;
    const { billId } = req.params;

    const bill = await POSBill.findOne({ _id: billId, merchantId });
    
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    try {
      assertTransitionAllowed(bill.status, "CANCELLED");
    } catch (error) {
      return res.status(400).json({ 
        message: error.message,
        code: "INVALID_STATE_TRANSITION"
      });
    }

    bill.status = "CANCELLED";
    await bill.save();

    res.json({
      message: "Bill cancelled successfully",
      bill: {
        id: bill._id,
        upiNote: bill.upiNote,
        status: bill.status,
      },
    });
  } catch (error) {
    console.error("[POS] Cancel bill error:", error);
    res.status(500).json({ message: "Failed to cancel bill" });
  }
};

/**
 * GET /api/pos/bills/:billId
 * Get bill details
 */
export const getBillById = async (req, res) => {
  try {
    const merchantId = req.user.id;
    const { billId } = req.params;

    const bill = await POSBill.findOne({ _id: billId, merchantId })
      .populate("receiptId");
    
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    // Check and update expiry if needed
    if (bill.status === "AWAITING_PAYMENT") {
      await bill.checkAndExpire();
    }

    const merchant = await Merchant.findById(merchantId).select("shopName upiId upiName merchantCode upiType");

    // Generate UPI link if still awaiting payment
    let upiData = null;
    if (bill.status === "AWAITING_PAYMENT") {
      const upiPayeeName = merchant?.upiName || merchant?.shopName || "Merchant";
      upiData = {
        link: buildUPILink({
          pa: merchant?.upiId,
          pn: upiPayeeName,
          am: bill.total,
          cu: "INR",
          tn: bill.upiNote,
          upiType: merchant?.upiType || "PERSONAL",
        }),
        payeeId: merchant?.upiId,
        payeeName: upiPayeeName,
        amount: bill.total,
        note: bill.upiNote,
      };
    }

    res.json({
      bill: {
        id: bill._id,
        upiNote: bill.upiNote,
        items: bill.items,
        total: bill.total,
        status: bill.status,
        expiresAt: bill.expiresAt,
        paidAt: bill.paidAt,
        createdAt: bill.createdAt,
        customerPhone: bill.customerPhone,
        customerName: bill.customerName,
        receipt: bill.receiptId,
      },
      upi: upiData,
      merchant: {
        name: merchant?.shopName,
        code: merchant?.merchantCode,
      },
    });
  } catch (error) {
    console.error("[POS] Get bill error:", error);
    res.status(500).json({ message: "Failed to get bill" });
  }
};

/**
 * GET /api/pos/bills
 * Get merchant's POS bills with filtering
 */
export const getBills = async (req, res) => {
  try {
    const merchantId = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;

    const query = { merchantId };
    
    if (status) {
      query.status = status.toUpperCase();
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [bills, total] = await Promise.all([
      POSBill.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("receiptId", "total status paidAt"),
      POSBill.countDocuments(query),
    ]);

    // Check and expire awaiting bills
    const awaitingBills = bills.filter(b => b.status === "AWAITING_PAYMENT");
    for (const bill of awaitingBills) {
      await bill.checkAndExpire();
    }

    res.json({
      bills: bills.map(bill => ({
        id: bill._id,
        upiNote: bill.upiNote,
        total: bill.total,
        items: bill.items,
        status: bill.status,
        expiresAt: bill.expiresAt,
        paidAt: bill.paidAt,
        createdAt: bill.createdAt,
        receiptId: bill.receiptId?._id,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("[POS] Get bills error:", error);
    res.status(500).json({ message: "Failed to get bills" });
  }
};

/**
 * GET /api/pos/bills/active
 * Get currently active (awaiting payment) bills
 */
export const getActiveBills = async (req, res) => {
  try {
    const merchantId = req.user.id;

    // First, expire old bills
    await POSBill.expireOldBills();

    const bills = await POSBill.find({
      merchantId,
      status: "AWAITING_PAYMENT",
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .limit(10);

    const merchant = await Merchant.findById(merchantId).select("shopName upiId upiName merchantCode upiType");
    const upiPayeeName = merchant?.upiName || merchant?.shopName || "Merchant";

    res.json({
      bills: bills.map(bill => ({
        id: bill._id,
        upiNote: bill.upiNote,
        total: bill.total,
        items: bill.items,
        status: bill.status,
        expiresAt: bill.expiresAt,
        createdAt: bill.createdAt,
        timeRemaining: Math.max(0, Math.floor((bill.expiresAt - new Date()) / 1000)),
        upi: {
          link: buildUPILink({
            pa: merchant?.upiId,
            pn: upiPayeeName,
            am: bill.total,
            cu: "INR",
            tn: bill.upiNote,
            upiType: merchant?.upiType || "PERSONAL",
          }),
          note: bill.upiNote,
        },
      })),
      count: bills.length,
    });
  } catch (error) {
    console.error("[POS] Get active bills error:", error);
    res.status(500).json({ message: "Failed to get active bills" });
  }
};

/**
 * GET /api/pos/stats
 * Get POS statistics for merchant dashboard
 */
export const getPOSStats = async (req, res) => {
  try {
    const merchantId = req.user.id;
    const { period = "today" } = req.query;

    // Calculate date range
    let startDate;
    const now = new Date();
    
    switch (period) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    const stats = await POSBill.aggregate([
      {
        $match: {
          merchantId: new mongoose.Types.ObjectId(merchantId),
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          total: { $sum: "$total" },
        },
      },
    ]);

    // Format stats
    const result = {
      period,
      paid: { count: 0, total: 0 },
      awaiting: { count: 0, total: 0 },
      expired: { count: 0, total: 0 },
      cancelled: { count: 0, total: 0 },
    };

    for (const stat of stats) {
      const key = stat._id.toLowerCase().replace("_payment", "").replace("awaiting", "awaiting");
      if (stat._id === "PAID") result.paid = { count: stat.count, total: stat.total };
      if (stat._id === "AWAITING_PAYMENT") result.awaiting = { count: stat.count, total: stat.total };
      if (stat._id === "EXPIRED") result.expired = { count: stat.count, total: stat.total };
      if (stat._id === "CANCELLED") result.cancelled = { count: stat.count, total: stat.total };
    }

    res.json(result);
  } catch (error) {
    console.error("[POS] Get stats error:", error);
    res.status(500).json({ message: "Failed to get statistics" });
  }
};

// ==========================================
// PUBLIC ENDPOINTS (No Auth Required)
// For customer payment flow
// ==========================================

/**
 * GET /api/pos/public/bills/:billId
 * Public endpoint - Get bill details for customer payment page
 * No authentication required
 */
export const getPublicBill = async (req, res) => {
  try {
    const { billId } = req.params;

    const bill = await POSBill.findById(billId).lean();
    
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    // Check and update expired status
    if (bill.status === "AWAITING_PAYMENT" && new Date(bill.expiresAt) < new Date()) {
      await POSBill.findByIdAndUpdate(billId, { status: "EXPIRED" });
      bill.status = "EXPIRED";
    }

    // Get merchant details (including personal UPI QR image for P2P payments)
    const merchant = await Merchant.findById(bill.merchantId).select(
      "shopName addressLine upiId upiName merchantCode upiType personalUpiQrImage"
    ).lean();

    res.json({
      id: bill._id,
      billId: bill._id,
      upiNote: bill.upiNote,
      total: bill.total,
      items: bill.items,
      status: bill.status,
      expiresAt: bill.expiresAt,
      createdAt: bill.createdAt,
      paymentMethod: bill.paymentMethod || null,
      customerSelected: bill.customerSelected || false,
      merchant: {
        shopName: merchant?.shopName || "Merchant",
        address: merchant?.addressLine || "",
        upiId: merchant?.upiId || null,
        upiName: merchant?.upiName || merchant?.shopName,
        upiType: merchant?.upiType || "PERSONAL",
        code: merchant?.merchantCode,
        // Personal UPI QR image (base64) for P2P payments - customer scans this manually
        personalUpiQrImage: merchant?.personalUpiQrImage || null,
      },
    });
  } catch (error) {
    console.error("[POS] Get public bill error:", error);
    res.status(500).json({ message: "Failed to fetch bill" });
  }
};

/**
 * POST /api/pos/public/bills/:billId/select-payment
 * Public endpoint - Customer selects payment method (cash or upi)
 * No authentication required
 * 
 * Request body:
 * {
 *   method: "cash" | "upi",
 *   customerName?: string,
 *   customerPhone?: string
 * }
 */
export const selectPaymentMethod = async (req, res) => {
  try {
    const { billId } = req.params;
    const { method, customerName, customerPhone, customerId } = req.body;

    // Validate method - now includes 'other' and 'khata' options
    if (!method || !["cash", "upi", "other", "khata"].includes(method)) {
      return res.status(400).json({ message: "Invalid payment method. Use 'cash', 'upi', 'other', or 'khata'" });
    }

    const bill = await POSBill.findById(billId);
    
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    // Check status
    if (bill.status !== "AWAITING_PAYMENT") {
      return res.status(400).json({ 
        message: `Bill is ${bill.status.toLowerCase()}. Cannot process payment.`,
        code: "INVALID_STATUS"
      });
    }

    // Check expiry
    if (new Date(bill.expiresAt) < new Date()) {
      bill.status = "EXPIRED";
      await bill.save();
      return res.status(400).json({ 
        message: "Bill has expired",
        code: "BILL_EXPIRED"
      });
    }

    // Handle Khata (Pay Later) - mark as pending
    if (method === 'khata') {
      // Khata requires customer to be logged in
      if (!customerId) {
        return res.status(400).json({ 
          message: "Please login to use Pay Later (Khata)",
          code: "LOGIN_REQUIRED"
        });
      }

      // Require customer identity details so merchant can review before confirming
      if (!customerPhone) {
        return res.status(400).json({
          message: "Phone number is required for Khata. Please update your profile.",
          code: "PHONE_REQUIRED",
        });
      }

      // IMPORTANT:
      // Do NOT create a Receipt and do NOT finalize Khata here.
      // This endpoint is public and should only capture customer's intent.
      // The merchant must confirm Khata separately.

      // Phase 3: Enforce strict transition
      try {
        assertTransitionAllowed(bill.status, "PENDING_KHATA");
      } catch (err) {
        return res.status(400).json({ 
          message: err.message, 
          code: "INVALID_STATE_TRANSITION" 
        });
      }

      bill.status = 'PENDING_KHATA'; // Explicit status for Khata
      bill.paymentMethod = 'khata'; // Explicit method
      bill.customerSelected = true;
      bill.customerId = customerId; // Link customer to bill for later confirmation & reminders
      if (customerName) bill.customerName = customerName.trim();
      if (customerPhone) bill.customerPhone = customerPhone.trim();
      await bill.save();

      return res.json({
        message: "Khata request recorded. Waiting for merchant confirmation.",
        bill: {
          id: bill._id,
          upiNote: bill.upiNote,
          total: bill.total,
          status: bill.status,
          paymentMethod: bill.paymentMethod,
          customerName: bill.customerName,
          customerPhone: bill.customerPhone,
          customerId: bill.customerId,
        },
      });
    }

    // Update bill with customer's choice (for cash, upi, other)
    bill.paymentMethod = method;
    bill.customerSelected = true;
    if (customerName) bill.customerName = customerName.trim();
    if (customerPhone) bill.customerPhone = customerPhone.trim();
    await bill.save();

    res.json({
      message: `Payment method '${method}' selected`,
      bill: {
        id: bill._id,
        upiNote: bill.upiNote,
        total: bill.total,
        status: bill.status,
        paymentMethod: method,
      },
    });
  } catch (error) {
    console.error("[POS] Select payment method error:", error);
    res.status(500).json({ message: "Failed to process payment selection" });
  }
};

// ==========================================
// CUSTOMER AUTH ROUTES
// For logged-in customers to claim receipts
// ==========================================

/**
 * POST /api/pos/bills/:billId/claim
 * Customer claims a POS receipt and links it to their account
 * 
 * This allows customers to:
 * 1. Scan a QR, make payment
 * 2. After merchant confirms, save receipt to their account
 * 
 * Request: Auth token required (customer)
 * URL Params: billId
 */
export const claimReceipt = async (req, res) => {
  try {
    const { billId } = req.params;
    const customerId = req.user.id; // From auth middleware

    // Find the POS bill
    const bill = await POSBill.findById(billId);
    
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    // Bill must be PAID to claim
    if (bill.status !== "PAID") {
      return res.status(400).json({ 
        message: "Bill has not been paid yet. Cannot claim receipt.",
        code: "BILL_NOT_PAID"
      });
    }

    // Bill must have a receipt
    if (!bill.receiptId) {
      return res.status(400).json({ 
        message: "No receipt found for this bill",
        code: "NO_RECEIPT"
      });
    }

    // Find the receipt
    const receipt = await Receipt.findById(bill.receiptId);
    
    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    // Check if receipt is already claimed by someone
    if (receipt.userId) {
      // Check if it's the same user
      if (receipt.userId.toString() === customerId.toString()) {
        return res.status(200).json({ 
          message: "Receipt already saved to your account",
          receipt: {
            id: receipt._id,
            total: receipt.total,
            transactionDate: receipt.transactionDate,
          }
        });
      }
      // Different user - this shouldn't happen normally
      return res.status(400).json({ 
        message: "This receipt has already been claimed",
        code: "ALREADY_CLAIMED"
      });
    }

    // Link receipt to customer
    receipt.userId = customerId;
    await receipt.save();

    // Also update bill with customer reference
    bill.customerId = customerId;
    await bill.save();

    console.log(`[POS] Receipt ${receipt._id} claimed by customer ${customerId}`);

    res.json({
      message: "Receipt saved to your account!",
      receipt: {
        id: receipt._id,
        total: receipt.total,
        transactionDate: receipt.transactionDate,
        merchantSnapshot: receipt.merchantSnapshot,
        items: receipt.items,
      }
    });
  } catch (error) {
    console.error("[POS] Claim receipt error:", error);
    res.status(500).json({ message: "Failed to claim receipt" });
  }
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Build UPI deep link URL
 * Format: upi://pay?pa=xxx&pn=xxx&am=xxx&cu=INR&tn=xxx
 * 
 * For PERSONAL UPI type: Amount is NOT included to avoid "merchant not verified" errors.
 * Customer will enter amount manually in the UPI app (P2P transfer).
 * 
 * For MERCHANT UPI type: Amount is included for faster checkout.
 */
function buildUPILink({ pa, pn, am, cu = "INR", tn, upiType = "PERSONAL" }) {
  const params = new URLSearchParams({
    pa, // Payee VPA (UPI ID)
    pn, // Payee Name
    cu, // Currency
  });

  if (typeof tn === "string" && tn.trim()) {
    params.set("tn", tn);
  }

  // IMPORTANT: For PERSONAL UPI type, we do NOT include amount.
  // This ensures P2P transfer and avoids "merchant not verified" errors.
  // Customer enters amount manually in the UPI app.
  if (upiType !== "PERSONAL" && typeof am === "number" && Number.isFinite(am)) {
    params.set("am", am.toFixed(2));
    // Secure QR/Intent mode (commonly used for P2M)
    params.set("mode", "02");
  }

  return `upi://pay?${params.toString()}`;
}

// Import mongoose for ObjectId
import mongoose from "mongoose";
