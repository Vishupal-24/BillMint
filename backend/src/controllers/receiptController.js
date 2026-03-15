import Receipt from "../models/Receipt.js";
import Merchant from "../models/Merchant.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import POSBill from "../models/POSBill.js";
import { getNowIST, normalizeToIST, formatISTDate, formatISTTime } from "../utils/timezone.js";
import { clearAnalyticsCache } from "./analyticsController.js";
import { sendReceiptEmail } from "../utils/sendEmail.js";
import { assertTransitionAllowed } from "../utils/billStateMachine.js";

const normalizeItems = (items = []) =>
  items.map((item) => ({
    name: item.name || item.n || "Unknown",
    unitPrice:
      typeof item.unitPrice === "number"
        ? item.unitPrice
        : typeof item.price === "number"
        ? item.price
        : Number(item.p) || 0,
    quantity:
      typeof item.quantity === "number"
        ? item.quantity
        : typeof item.qty === "number"
        ? item.qty
        : Number(item.q) || 1,
  }));

const computeTotal = (items) =>
  items.reduce((sum, item) => sum + (item.unitPrice || 0) * (item.quantity || 0), 0);

const mapReceiptToClient = (receipt) => {
  const transactionInstant = receipt.transactionDate || receipt.createdAt;
  const isoDate = formatISTDate(transactionInstant);
  const time = formatISTTime(transactionInstant);

  // Use receipt category first, fall back to merchant's businessCategory, then "general"
  const resolvedCategory = receipt.category || receipt.merchantSnapshot?.businessCategory || "general";

  return {
    id: receipt._id,
    merchant: receipt.merchantSnapshot?.shopName,
    merchantCode: receipt.merchantSnapshot?.merchantCode,
    merchantSnapshot: receipt.merchantSnapshot || null,
    businessCategory: receipt.merchantSnapshot?.businessCategory || null,
    customerName: receipt.customerSnapshot?.name || null,
    customerEmail: receipt.customerSnapshot?.email || null,
    customerPhone: receipt.customerSnapshot?.phone || null,
    claimedByCustomer: Boolean(receipt.userId),
    customerPaymentIntent: receipt.customerPaymentIntent || null,
    amount: receipt.total,
    pendingAmount: receipt.pendingAmount || 0,
    lastReminderSentAt: receipt.lastReminderSentAt ? new Date(receipt.lastReminderSentAt).toISOString() : null,
    subtotal: receipt.subtotal || 0,
    discount: receipt.discount || 0,
    transactionDate: receipt.transactionDate ? new Date(receipt.transactionDate).toISOString() : null,
    date: isoDate,
    time,
    type: receipt.source,
    items: (receipt.items || []).map((item) => ({
      name: item.name,
      qty: item.quantity,
      price: item.unitPrice,
    })),
    image: receipt.imageUrl,
    note: receipt.note,
    category: resolvedCategory,
    excludeFromStats: receipt.excludeFromStats,
    footer: receipt.footer || receipt.merchantSnapshot?.receiptFooter || "",
    status: receipt.status,
    paymentMethod: receipt.paymentMethod,
    paidAt: receipt.paidAt ? new Date(receipt.paidAt).toISOString() : null,
    // Receipt acknowledgment flow timestamps
    acknowledgedAt: receipt.acknowledgedAt ? new Date(receipt.acknowledgedAt).toISOString() : null,
    verifiedAt: receipt.verifiedAt ? new Date(receipt.verifiedAt).toISOString() : null,
    createdAt: receipt.createdAt ? new Date(receipt.createdAt).toISOString() : null,
    updatedAt: receipt.updatedAt ? new Date(receipt.updatedAt).toISOString() : null,
  };
};

export const createReceipt = async (req, res) => {
  try {
    const {
      userId: bodyUserId = null,
      merchantId: bodyMerchantId = null,
      merchantCode = null,
      mid = null,
      items: rawItems = [],
      source = "qr",
      paymentMethod = "upi",
      transactionDate,
      note = "",
      imageUrl = null,
      excludeFromStats = false,
      footer = "",
      category = "general",
      total: providedTotal,
      subtotal: providedSubtotal,
      discount: providedDiscount = 0,
      status = "completed",
      receiptId = null,
      // For customer uploads without merchant
      merchantName = null,
      // For pending (khata) receipts - customer info from merchant
      customerName: providedCustomerName = null,
      customerPhone: providedCustomerPhone = null,
    } = req.body;

    const resolvedMerchantId = req.user.role === "merchant" ? req.user.id : bodyMerchantId;
    const resolvedMerchantCode = merchantCode || mid;

    const userId = req.user.role === "customer" ? req.user.id : bodyUserId;

    const items = normalizeItems(rawItems);
    const computedTotal = computeTotal(items);

    // Handle discount calculations
    const discount = typeof providedDiscount === "number" ? Math.max(0, providedDiscount) : 0;
    const subtotal = typeof providedSubtotal === "number" ? providedSubtotal : computedTotal;
    
    // Final total should be subtotal minus discount
    let finalTotal;
    if (typeof providedTotal === "number") {
      finalTotal = providedTotal;
    } else if (subtotal > 0 && discount > 0) {
      finalTotal = Math.max(0, subtotal - discount);
    } else {
      finalTotal = computedTotal;
    }

    // For uploads without items, use provided total
    // For QR scans, also allow provided total if items are empty or total is explicitly provided
    if ((source === "upload" || source === "qr") && typeof providedTotal === "number") {
      finalTotal = providedTotal;
    }

    // Only validate total vs items for manual entries (not QR or upload)
    // QR codes may have pre-calculated totals that include taxes/discounts not in items
    if (source === "manual" && typeof providedTotal === "number" && items.length > 0) {
      const expectedTotal = Math.max(0, (typeof providedSubtotal === "number" ? providedSubtotal : computedTotal) - discount);
      if (Math.abs(providedTotal - expectedTotal) > 0.01) {
        return res.status(400).json({
          message: "Total does not match items sum (after discount)",
        });
      }
    }

    let merchant = null;
    // Try to find merchant in database if we have an ID or code
    if (resolvedMerchantId || resolvedMerchantCode) {
      if (resolvedMerchantId) {
        merchant = await Merchant.findById(resolvedMerchantId).lean();
      } else if (resolvedMerchantCode) {
        merchant = await Merchant.findOne({ merchantCode: resolvedMerchantCode }).lean();
      }
    }
    
    // For QR scans, we allow saving even if merchant is not found in our system
    // The customer can still record their transaction with merchantName from QR
    // Only merchants creating receipts MUST be registered
    if (!merchant && req.user.role === "merchant" && source !== "upload") {
      return res.status(400).json({ message: "Merchant not found" });
    }

    // Build customer snapshot - don't fail if user lookup fails
    // If user is authenticated (passed protect middleware), they are valid
    let customerSnapshot = null;
    if (userId) {
      try {
        const user = await User.findById(userId).lean();
        if (user) {
          customerSnapshot = { name: user.name, email: user.email, phone: user.phone || null };
        } else {
          // User authenticated but not found in DB - create minimal snapshot
          // This can happen in edge cases, but we should still save the receipt
          customerSnapshot = { name: "Customer", email: null, phone: null };
          console.log(`Warning: Customer ${userId} not found in DB but authenticated`);
        }
      } catch (lookupError) {
        // Database error during lookup - proceed with minimal snapshot
        console.error("Customer lookup error:", lookupError.message);
        customerSnapshot = { name: "Customer", email: null, phone: null };
      }
    }
    
    // For pending (khata) receipts, use customer info provided by merchant
    if (status === "pending" && (providedCustomerName || providedCustomerPhone)) {
      customerSnapshot = {
        name: providedCustomerName || customerSnapshot?.name || "Customer",
        email: customerSnapshot?.email || null,
        phone: providedCustomerPhone || customerSnapshot?.phone || null,
      };
    }

    // Snapshot merchant data (or use provided name from QR code)
    const merchantSnapshot = merchant 
      ? {
          shopName: merchant.shopName,
          merchantCode: merchant.merchantCode,
          address: merchant.addressLine || (merchant.address ? `${merchant.address.street || ''}, ${merchant.address.city || ''}`.trim().replace(/^,\s*|,\s*$/g, '') : null),
          phone: merchant.phone,
          logoUrl: merchant.logoUrl,
          receiptHeader: merchant.receiptHeader || "",
          receiptFooter: merchant.receiptFooter || "Thank you! Visit again.",
          brandColor: merchant.brandColor || "#10b981",
          businessCategory: merchant.businessCategory || "general",
        }
      : merchantName 
        ? { 
            shopName: merchantName, 
            merchantCode: resolvedMerchantCode || null, 
            address: null, 
            phone: null, 
            logoUrl: null, 
            receiptHeader: "", 
            receiptFooter: footer || "Thank you!", 
            brandColor: "#10b981", 
            businessCategory: category || "general" 
          }
        : { 
            shopName: "Unknown Merchant", 
            merchantCode: null, 
            address: null, 
            phone: null, 
            logoUrl: null, 
            receiptHeader: "", 
            receiptFooter: "", 
            brandColor: "#10b981", 
            businessCategory: "general" 
          };

    const resolvedCategory = category || merchant?.businessCategory || "general";

    const receipt = await Receipt.create({
      _id: receiptId || undefined,
      merchantId: merchant?._id || null,
      merchantCode: merchant?.merchantCode || null,
      userId,
      items,
      total: finalTotal,
      subtotal,
      discount,
      source,
      paymentMethod,
      status,
      // For pending receipts, set pendingAmount to total
      pendingAmount: status === "pending" ? finalTotal : 0,
      // Normalize to IST
      transactionDate: normalizeToIST(transactionDate),
      note,
      imageUrl,
      excludeFromStats: Boolean(excludeFromStats),
      footer: footer || merchant?.receiptFooter || "",
      category: resolvedCategory,
      merchantSnapshot,
      customerSnapshot,
    });

    // If pending receipt created, try to notify customer if they exist in system
    if (status === "pending" && providedCustomerPhone) {
      try {
        // Find customer by phone number
        const customer = await User.findOne({ phone: providedCustomerPhone }).lean();
        if (customer) {
          // Create notification for customer
          await Notification.createIfNotExists({
            userId: customer._id,
            type: "pending_created",
            title: "New Pending Bill",
            message: `You have a pending bill of ₹${finalTotal} at ${merchantSnapshot.shopName}`,
            sourceType: "pending_receipt",
            sourceId: receipt._id,
            metadata: {
              amount: finalTotal,
              billName: merchantSnapshot.shopName,
              currency: "INR",
            },
            actionUrl: `/pending/${receipt._id}`,
            actionLabel: "View Bill",
            idempotencyKey: `pending_created:${receipt._id}`,
            priority: 5,
          });
        }
      } catch (notifError) {
        // Don't fail receipt creation if notification fails
        console.error("Failed to create pending notification:", notifError.message);
      }
    }

    // Update analytics cache
    if (merchant?._id) {
      clearAnalyticsCache(merchant._id.toString());
    }
    if (userId) {
      clearAnalyticsCache(userId.toString());
    }

    res.status(201).json(mapReceiptToClient(receipt.toObject()));
  } catch (error) {
    console.error("createReceipt error:", error.message);
    console.error("createReceipt error details:", error);
    
    // Return more specific error messages
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ message: `Validation error: ${messages}` });
    }
    
    res.status(500).json({ message: error.message || "Failed to create receipt" });
  }
};

export const getCustomerReceipts = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const filter = { userId: req.user.id };

    const [receipts, total] = await Promise.all([
      Receipt.find(filter)
        .sort({ transactionDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Receipt.countDocuments(filter),
    ]);

    res.json({
      receipts: receipts.map(mapReceiptToClient),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("getCustomerReceipts error", error);
    res.status(500).json({ message: "Failed to load receipts" });
  }
};

export const claimReceipt = async (req, res) => {
  try {
    const { receiptId, paymentIntent = null } = req.body;
    
    // Check if receipt exists and is not already claimed by someone else
    const receiptCheck = await Receipt.findById(receiptId);
    if (!receiptCheck) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    if (receiptCheck.userId && receiptCheck.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Receipt already claimed" });
    }

    // Prepare customer snapshot (include phone for khata/pending flows)
    const user = await User.findById(req.user.id).lean();
    const customerSnapshot = user
      ? { name: user.name, email: user.email, phone: user.phone || null }
      : null;

    const intent = ["upi", "cash", "khata"].includes(paymentIntent) ? paymentIntent : null;

    // Use atomic update to avoid race conditions with markReceiptPaid
    const receipt = await Receipt.findByIdAndUpdate(
      receiptId,
      {
        $set: {
          userId: req.user.id,
          customerSnapshot: customerSnapshot,
          customerPaymentIntent: intent,
          customerPaymentIntentAt: intent ? getNowIST() : null,
        }
      },
      { new: true }
    );
    
    // Send receipt email to customer (async, don't await - don't block claim)
    if (user?.email && receipt) {
      const receiptForEmail = receipt.toObject();
      sendReceiptEmail({
        to: user.email,
        customerName: user.name || "Customer",
        merchantName: receiptForEmail.merchantSnapshot?.shopName || "Merchant",
        total: receiptForEmail.total || 0,
        date: formatISTDate(receiptForEmail.transactionDate || receiptForEmail.createdAt),
        items: receiptForEmail.items || [],
        paymentMethod: receiptForEmail.paymentMethod || "N/A"
      }).catch((err) => {
        console.error("[Receipt] Email failed:", err.message);
      });
    }

    res.json(mapReceiptToClient(receipt.toObject()));
  } catch (error) {
    console.error("claimReceipt error", error);
    res.status(500).json({ message: "Failed to claim receipt" });
  }
};

export const markReceiptPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, customerName, customerPhone } = req.body; // Accept payment method and optional customer info
    
    // Use atomic update to avoid race conditions with customer claim
    // We first check authorization in the query itself or separate check
    
    const receiptCheck = await Receipt.findById(id);
    if (!receiptCheck) {
      return res.status(404).json({ message: "Receipt not found" });
    }
    if (!receiptCheck.merchantId || receiptCheck.merchantId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update receipt" });
    }

    // Determine the payment method to set
    const currentMethod = receiptCheck.paymentMethod;
    const isGeneric = !currentMethod || currentMethod === 'other';
    let newPaymentMethod = currentMethod;

    // Check if this is a "pending" (khata) action
    const isPendingAction = paymentMethod === 'pending' || paymentMethod === 'khata';

    if (isPendingAction) {
      // Mark as pending (khata) - keep status as "pending", store customer info
      const updateData = {
        status: "pending",
        paymentMethod: "khata", // Explicitly mark as khata
        pendingAmount: receiptCheck.total,
        paidAt: null,
      };

      // Add customer info if provided
      if (customerName) {
        updateData["customerSnapshot.name"] = customerName;
      }
      if (customerPhone) {
        updateData["customerSnapshot.phone"] = customerPhone;
      }

      const receipt = await Receipt.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true }
      );

      // Create notification for customer:
      // - Preferred: receipt already linked via claimReceipt (receipt.userId)
      // - Fallback: merchant provided customerPhone
      try {
        let targetUserId = receipt?.userId || null;

        if (!targetUserId && customerPhone) {
          const matchedUser = await User.findOne({ phone: customerPhone, role: "customer" }).lean();
          if (matchedUser?._id) {
            targetUserId = matchedUser._id;
            // Link the receipt to the user if we found a match
            await Receipt.findByIdAndUpdate(id, { $set: { userId: matchedUser._id } });
          }
        }

        if (targetUserId) {
          await Notification.create({
            userId: targetUserId,
            type: "pending_created",
            title: "New Pending Bill",
            message: `You have a pending bill of ₹${receipt.total} from ${req.user.shopName || "Merchant"}`,
            sourceType: "pending_receipt",
            sourceId: receipt._id,
            idempotencyKey: `pending_created:${receipt._id}`,
          });
        }
      } catch (notifErr) {
        console.warn("Failed to create pending notification:", notifErr);
      }

      return res.json(mapReceiptToClient(receipt.toObject()));
    }

    // Regular paid action
    if (paymentMethod && ["upi", "cash", "card", "other"].includes(paymentMethod)) {
       // Allow overwrite if current is generic OR we want to trust the merchant's explicit action
       // The merchant's "Paid via Cash" or "Paid via UPI" button is a strong signal of what actually happened at the counter.
       // So we should probably prefer the merchant's input if they are explicitly marking it.
       newPaymentMethod = paymentMethod;
    }

    if (!paymentMethod && (currentMethod === 'khata' || currentMethod === 'pending')) {
      newPaymentMethod = 'other';
    }

    const receipt = await Receipt.findByIdAndUpdate(
      id,
      {
        $set: {
            status: "completed",
            paymentMethod: newPaymentMethod,
            paidAt: getNowIST(),
            pendingAmount: 0, // Clear pending amount when paid
        }
      },
      { new: true } // Return updated doc
    );

    // Invalidate cache
    clearAnalyticsCache(req.user.id);
    if (receipt.userId) {
      clearAnalyticsCache(receipt.userId.toString());
    }

    res.json(mapReceiptToClient(receipt.toObject()));
  } catch (error) {
    console.error("markReceiptPaid error", error);
    res.status(500).json({ message: "Failed to update receipt" });
  }
};

export const getMerchantReceipts = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const filter = { merchantId: req.user.id };

    const [receipts, total] = await Promise.all([
      Receipt.find(filter)
        .sort({ transactionDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Receipt.countDocuments(filter),
    ]);

    res.json({
      receipts: receipts.map(mapReceiptToClient),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("getMerchantReceipts error", error);
    res.status(500).json({ message: "Failed to load receipts" });
  }
};

export const getReceiptById = async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id).lean();

    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    const isOwner =
      (req.user.role === "customer" && receipt.userId?.toString() === req.user.id) ||
      (req.user.role === "merchant" && receipt.merchantId.toString() === req.user.id);

    if (!isOwner) {
      return res.status(403).json({ message: "Not authorized to view this receipt" });
    }

    res.json(mapReceiptToClient(receipt));
  } catch (error) {
    console.error("getReceiptById error", error);
    res.status(500).json({ message: "Failed to load receipt" });
  }
};

export const updateReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, status, note, excludeFromStats, category } = req.body;

    // Check strict ownership first
    const receiptCheck = await Receipt.findById(id);
    if (!receiptCheck) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    const isOwner =
      (req.user.role === "customer" && receiptCheck.userId?.toString() === req.user.id) ||
      (req.user.role === "merchant" && receiptCheck.merchantId?.toString() === req.user.id);

    if (!isOwner) {
      return res.status(403).json({ message: "Not authorized to update this receipt" });
    }

    // Build update object dynamically
    const updateFields = {};
    if (paymentMethod !== undefined) updateFields.paymentMethod = paymentMethod;
    if (status !== undefined) updateFields.status = status;
    if (note !== undefined) updateFields.note = note;
    if (excludeFromStats !== undefined) updateFields.excludeFromStats = Boolean(excludeFromStats);
    if (category !== undefined) updateFields.category = category;

    // Atomic update
    const receipt = await Receipt.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    );

    res.json(mapReceiptToClient(receipt.toObject()));
  } catch (error) {
    console.error("updateReceipt error", error);
    res.status(500).json({ message: "Failed to update receipt" });
  }
};

export const deleteReceipt = async (req, res) => {
  try {
    const { id } = req.params;

    const receipt = await Receipt.findById(id);
    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    // Check ownership - customers can delete their receipts, merchants can delete their receipts
    const isOwner =
      (req.user.role === "customer" && receipt.userId?.toString() === req.user.id) ||
      (req.user.role === "merchant" && receipt.merchantId?.toString() === req.user.id);

    if (!isOwner) {
      return res.status(403).json({ message: "Not authorized to delete this receipt" });
    }

    await Receipt.findByIdAndDelete(id);
    res.json({ message: "Receipt deleted successfully" });
  } catch (error) {
    console.error("deleteReceipt error", error);
    res.status(500).json({ message: "Failed to delete receipt" });
  }
};

// ==========================================
// KHATA (PENDING DUES) APIs
// ==========================================

/**
 * Get all pending receipts for merchant (Khata page)
 * GET /api/receipts/merchant/pending
 * Returns oldest first for follow-up priority
 */
export const getMerchantPendingReceipts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const filter = { 
      merchantId: req.user.id, 
      status: "pending",
      pendingAmount: { $gt: 0 }
    };

    const [receipts, total, totalPendingAmount] = await Promise.all([
      Receipt.find(filter)
        .sort({ transactionDate: 1 }) // Oldest first
        .skip(skip)
        .limit(limit)
        .lean(),
      Receipt.countDocuments(filter),
      Receipt.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: "$pendingAmount" } } }
      ]),
    ]);

    res.json({
      receipts: receipts.map(mapReceiptToClient),
      totalPendingAmount: totalPendingAmount[0]?.total || 0,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("getMerchantPendingReceipts error", error);
    res.status(500).json({ message: "Failed to load pending receipts" });
  }
};

/**
 * Get all pending receipts for customer
 * GET /api/receipts/customer/pending
 */
export const getCustomerPendingReceipts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Get customer's phone from their profile
    const customer = await User.findById(req.user.id).lean();
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Find pending receipts either by userId or by phone number in customerSnapshot
    const filter = { 
      status: "pending",
      pendingAmount: { $gt: 0 },
      $or: [
        { userId: req.user.id },
        ...(customer.phone ? [{ "customerSnapshot.phone": customer.phone }] : [])
      ]
    };

    const [receipts, total, totalPendingAmount] = await Promise.all([
      Receipt.find(filter)
        .sort({ transactionDate: 1 }) // Oldest first
        .skip(skip)
        .limit(limit)
        .lean(),
      Receipt.countDocuments(filter),
      Receipt.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: "$pendingAmount" } } }
      ]),
    ]);

    res.json({
      receipts: receipts.map(mapReceiptToClient),
      totalPendingAmount: totalPendingAmount[0]?.total || 0,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("getCustomerPendingReceipts error", error);
    res.status(500).json({ message: "Failed to load pending receipts" });
  }
};

/**
 * Send payment reminder to customer
 * POST /api/receipts/:id/send-reminder
 * Merchant only - 1 reminder per 24 hours
 */
export const sendPaymentReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const REMINDER_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

    const receipt = await Receipt.findById(id);
    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    // Check merchant owns this receipt
    if (!receipt.merchantId || receipt.merchantId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to send reminder for this receipt" });
    }

    // Check receipt is pending
    if (receipt.status !== "pending") {
      return res.status(400).json({ message: "Can only send reminders for pending receipts" });
    }

    // Check 24-hour cooldown
    if (receipt.lastReminderSentAt) {
      const timeSinceLastReminder = Date.now() - new Date(receipt.lastReminderSentAt).getTime();
      if (timeSinceLastReminder < REMINDER_COOLDOWN_MS) {
        const hoursRemaining = Math.ceil((REMINDER_COOLDOWN_MS - timeSinceLastReminder) / (60 * 60 * 1000));
        return res.status(429).json({ 
          message: `Please wait ${hoursRemaining} hour(s) before sending another reminder`,
          nextReminderAt: new Date(new Date(receipt.lastReminderSentAt).getTime() + REMINDER_COOLDOWN_MS).toISOString()
        });
      }
    }

    // Find customer to send notification
    let customerId = receipt.userId;
    if (!customerId && receipt.customerSnapshot?.phone) {
      const customer = await User.findOne({ phone: receipt.customerSnapshot.phone }).lean();
      if (customer) {
        customerId = customer._id;
      }
    }

    if (!customerId) {
      return res.status(400).json({ message: "No customer linked to this receipt. Cannot send reminder." });
    }

    // Create notification
    const merchantName = receipt.merchantSnapshot?.shopName || "Merchant";
    const reminderMessage = `You have ₹${receipt.pendingAmount} pending at ${merchantName}. Please clear your dues.`;

    await Notification.createIfNotExists({
      userId: customerId,
      type: "payment_reminder",
      title: "Payment Reminder",
      message: reminderMessage,
      sourceType: "pending_receipt",
      sourceId: receipt._id,
      metadata: {
        amount: receipt.pendingAmount,
        billName: merchantName,
        currency: "INR",
      },
      actionUrl: `/pending/${receipt._id}`,
      actionLabel: "Pay Now",
      idempotencyKey: `payment_reminder:${receipt._id}:${Date.now()}`,
      priority: 7,
    });

    // Update lastReminderSentAt
    const updatedReceipt = await Receipt.findByIdAndUpdate(
      id,
      { $set: { lastReminderSentAt: getNowIST() } },
      { new: true }
    );

    res.json({ 
      message: "Reminder sent successfully",
      receipt: mapReceiptToClient(updatedReceipt.toObject())
    });
  } catch (error) {
    console.error("sendPaymentReminder error", error);
    res.status(500).json({ message: "Failed to send reminder" });
  }
};

/**
 * Mark pending receipt as paid (manual) - Merchant only
 * POST /api/receipts/:id/mark-paid-manual
 */
export const markPendingAsPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod = "cash" } = req.body;

    const receipt = await Receipt.findById(id);
    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    // Check merchant owns this receipt
    if (!receipt.merchantId || receipt.merchantId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update this receipt" });
    }

    // Check receipt is pending
    if (receipt.status !== "pending") {
      return res.status(400).json({ message: "Receipt is not pending" });
    }

    // Sync with POS Bill if exists (Phase 3: Enforce strict transitions)
    if (receipt.billId) {
      const bill = await POSBill.findById(receipt.billId);
      if (bill) {
        try {
          if (bill.status === "AWAITING_PAYMENT") {
            await bill.checkAndExpire();
          }
          assertTransitionAllowed(bill.status, "PAID");
          
          bill.status = "PAID";
          bill.paidAt = getNowIST();
          if (paymentMethod) bill.paymentMethod = paymentMethod;
          await bill.save();
        } catch (err) {
          return res.status(400).json({ 
            message: `Bill update failed: ${err.message}`, 
            code: "BILL_TRANSITION_FAILED" 
          });
        }
      }
    }

    // Update receipt to paid
    const updatedReceipt = await Receipt.findByIdAndUpdate(
      id,
      { 
        $set: { 
          status: "completed",
          pendingAmount: 0,
          lastReminderSentAt: null,
          paymentMethod,
          paidAt: getNowIST()
        } 
      },
      { new: true }
    );

    // Notify customer that their pending bill is cleared
    let customerId = receipt.userId;
    if (!customerId && receipt.customerSnapshot?.phone) {
      const customer = await User.findOne({ phone: receipt.customerSnapshot.phone }).lean();
      if (customer) {
        customerId = customer._id;
      }
    }

    if (customerId) {
      try {
        const merchantName = receipt.merchantSnapshot?.shopName || "Merchant";
        await Notification.createIfNotExists({
          userId: customerId,
          type: "pending_paid",
          title: "Payment Confirmed",
          message: `Your pending bill of ₹${receipt.total} at ${merchantName} has been marked as paid.`,
          sourceType: "pending_receipt",
          sourceId: receipt._id,
          metadata: {
            amount: receipt.total,
            billName: merchantName,
            currency: "INR",
          },
          idempotencyKey: `pending_paid:${receipt._id}`,
          priority: 5,
        });
      } catch (notifError) {
        console.error("Failed to create paid notification:", notifError.message);
      }
    }

    // Invalidate analytics cache
    clearAnalyticsCache(req.user.id);
    if (receipt.userId) {
      clearAnalyticsCache(receipt.userId.toString());
    }

    res.json({ 
      message: "Receipt marked as paid",
      receipt: mapReceiptToClient(updatedReceipt.toObject())
    });
  } catch (error) {
    console.error("markPendingAsPaid error", error);
    res.status(500).json({ message: "Failed to mark receipt as paid" });
  }
};

/**
 * Customer pays pending bill
 * POST /api/receipts/:id/pay-pending
 */
export const payPendingBill = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod = "upi" } = req.body;

    const receipt = await Receipt.findById(id);
    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    // Check receipt is pending
    if (receipt.status !== "pending") {
      return res.status(400).json({ message: "Receipt is not pending" });
    }

    // Verify customer is authorized (either by userId or phone)
    const customer = await User.findById(req.user.id).lean();
    const isAuthorized = 
      (receipt.userId && receipt.userId.toString() === req.user.id) ||
      (customer?.phone && receipt.customerSnapshot?.phone === customer.phone);

    if (!isAuthorized) {
      return res.status(403).json({ message: "Not authorized to pay this receipt" });
    }

    // Update receipt to paid
    const updatedReceipt = await Receipt.findByIdAndUpdate(
      id,
      { 
        $set: { 
          status: "completed",
          pendingAmount: 0,
          lastReminderSentAt: null,
          paymentMethod,
          paidAt: getNowIST(),
          userId: req.user.id, // Link to customer if not already
          customerSnapshot: {
            name: customer?.name || receipt.customerSnapshot?.name,
            email: customer?.email || receipt.customerSnapshot?.email,
            phone: customer?.phone || receipt.customerSnapshot?.phone,
          }
        } 
      },
      { new: true }
    );

    // Notify merchant that payment was received
    if (receipt.merchantId) {
      try {
        const customerName = customer?.name || receipt.customerSnapshot?.name || "Customer";
        await Notification.createIfNotExists({
          userId: receipt.merchantId,
          type: "pending_paid",
          title: "Payment Received",
          message: `${customerName} has paid their pending bill of ₹${receipt.total}`,
          sourceType: "pending_receipt",
          sourceId: receipt._id,
          metadata: {
            amount: receipt.total,
            billName: customerName,
            currency: "INR",
          },
          idempotencyKey: `pending_paid_merchant:${receipt._id}`,
          priority: 5,
        });
      } catch (notifError) {
        console.error("Failed to create merchant notification:", notifError.message);
      }
    }

    // Invalidate analytics cache
    if (receipt.merchantId) {
      clearAnalyticsCache(receipt.merchantId.toString());
    }
    clearAnalyticsCache(req.user.id);

    res.json({ 
      message: "Payment successful",
      receipt: mapReceiptToClient(updatedReceipt.toObject())
    });
  } catch (error) {
    console.error("payPendingBill error", error);
    res.status(500).json({ message: "Failed to process payment" });
  }
};

/**
 * Get pending summary for merchant dashboard
 * GET /api/receipts/merchant/pending/summary
 */
export const getMerchantPendingSummary = async (req, res) => {
  try {
    const filter = { 
      merchantId: req.user.id, 
      status: "pending",
      pendingAmount: { $gt: 0 }
    };

    const [summary] = await Receipt.aggregate([
      { $match: filter },
      { 
        $group: { 
          _id: null, 
          totalAmount: { $sum: "$pendingAmount" },
          count: { $sum: 1 }
        } 
      }
    ]);

    res.json({
      totalPendingAmount: summary?.totalAmount || 0,
      pendingCount: summary?.count || 0,
    });
  } catch (error) {
    console.error("getMerchantPendingSummary error", error);
    res.status(500).json({ message: "Failed to load pending summary" });
  }
};

/**
 * Get pending summary for customer dashboard
 * GET /api/receipts/customer/pending/summary
 */
export const getCustomerPendingSummary = async (req, res) => {
  try {
    const customer = await User.findById(req.user.id).lean();
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const filter = { 
      status: "pending",
      pendingAmount: { $gt: 0 },
      $or: [
        { userId: req.user.id },
        ...(customer.phone ? [{ "customerSnapshot.phone": customer.phone }] : [])
      ]
    };

    const [summary] = await Receipt.aggregate([
      { $match: filter },
      { 
        $group: { 
          _id: null, 
          totalAmount: { $sum: "$pendingAmount" },
          count: { $sum: 1 }
        } 
      }
    ]);

    res.json({
      totalPendingAmount: summary?.totalAmount || 0,
      pendingCount: summary?.count || 0,
    });
  } catch (error) {
    console.error("getCustomerPendingSummary error", error);
    res.status(500).json({ message: "Failed to load pending summary" });
  }
};

// ==========================================
// RECEIPT ACKNOWLEDGMENT FLOW APIs
// (Clean receipt-only system - no payment processing)
// ==========================================

/**
 * Get receipt by ID (PUBLIC - No auth required)
 * GET /api/receipts/public/:id
 * Used when customer scans QR code to view receipt
 */
export const getPublicReceiptById = async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id).lean();

    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    // Return limited public data
    res.json({
      id: receipt._id,
      merchant: receipt.merchantSnapshot?.shopName || "Unknown Merchant",
      merchantCode: receipt.merchantSnapshot?.merchantCode || null,
      merchantLogo: receipt.merchantSnapshot?.logoUrl || null,
      brandColor: receipt.merchantSnapshot?.brandColor || "#10b981",
      items: (receipt.items || []).map((item) => ({
        name: item.name,
        qty: item.quantity,
        price: item.unitPrice,
      })),
      total: receipt.total,
      subtotal: receipt.subtotal || receipt.total,
      discount: receipt.discount || 0,
      transactionDate: receipt.transactionDate ? new Date(receipt.transactionDate).toISOString() : null,
      status: receipt.status,
      footer: receipt.footer || receipt.merchantSnapshot?.receiptFooter || "Thank you!",
      // Indicate if already claimed by someone
      isClaimed: Boolean(receipt.userId),
      // Show verification status for transparency
      isVerified: receipt.status === "completed" || receipt.status === "pending",
    });
  } catch (error) {
    console.error("getPublicReceiptById error", error);
    res.status(500).json({ message: "Failed to load receipt" });
  }
};

/**
 * Acknowledge receipt (Customer saves receipt to their account)
 * POST /api/receipts/acknowledge
 * This is the key step - user taps "I received the bill"
 * Receipt is linked to user, status becomes WAITING_FOR_MERCHANT
 */
export const acknowledgeReceipt = async (req, res) => {
  try {
    const { receiptId } = req.body;
    const userId = req.user.id;

    if (!receiptId) {
      return res.status(400).json({ message: "Receipt ID is required" });
    }

    // Find the receipt
    const receipt = await Receipt.findById(receiptId);
    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    // Check if already acknowledged by someone else
    if (receipt.userId && receipt.userId.toString() !== userId) {
      return res.status(403).json({ message: "Receipt already claimed by another user" });
    }

    // If already acknowledged by same user, just return success
    if (receipt.userId?.toString() === userId && receipt.status === "waiting_for_merchant") {
      return res.json({
        success: true,
        message: "Receipt already saved",
        receipt: mapReceiptToClient(receipt.toObject()),
      });
    }

    // Get customer info for snapshot
    const user = await User.findById(userId).lean();
    const customerSnapshot = user
      ? { name: user.name, email: user.email, phone: user.phone || null }
      : { name: "Customer", email: null, phone: null };

    // Update receipt - link to user and set status to waiting for merchant verification
    const updatedReceipt = await Receipt.findByIdAndUpdate(
      receiptId,
      {
        $set: {
          userId: userId,
          customerSnapshot: customerSnapshot,
          status: "waiting_for_merchant",
          acknowledgedAt: getNowIST(),
        }
      },
      { new: true }
    );

    // Send email notification to customer (async, don't block)
    if (user?.email && updatedReceipt) {
      sendReceiptEmail({
        to: user.email,
        customerName: user.name || "Customer",
        merchantName: updatedReceipt.merchantSnapshot?.shopName || "Merchant",
        total: updatedReceipt.total || 0,
        date: formatISTDate(updatedReceipt.transactionDate || updatedReceipt.createdAt),
        items: updatedReceipt.items || [],
        paymentMethod: "Pending Verification"
      }).catch((err) => {
        console.error("[Receipt] Email failed:", err.message);
      });
    }

    // Notify merchant about new receipt to verify (optional)
    if (updatedReceipt.merchantId) {
      try {
        await Notification.create({
          userId: updatedReceipt.merchantId,
          type: "receipt_acknowledged",
          title: "New Receipt to Verify",
          message: `${customerSnapshot.name} acknowledged a receipt for ₹${updatedReceipt.total}`,
          sourceType: "receipt",
          sourceId: updatedReceipt._id,
          idempotencyKey: `receipt_acknowledged:${updatedReceipt._id}`,
          actionUrl: `/merchant/verify`,
          actionLabel: "Verify Payment",
        });
      } catch (notifErr) {
        console.warn("Failed to create merchant notification:", notifErr);
      }
    }

    res.json({
      success: true,
      message: "Receipt saved successfully",
      receipt: mapReceiptToClient(updatedReceipt.toObject()),
    });
  } catch (error) {
    console.error("acknowledgeReceipt error", error);
    res.status(500).json({ message: "Failed to save receipt" });
  }
};

/**
 * Get all receipts waiting for merchant verification
 * GET /api/receipts/merchant/awaiting-verification
 * Merchant's dashboard to verify payments
 */
export const getMerchantAwaitingVerification = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const filter = { 
      merchantId: req.user.id, 
      status: "waiting_for_merchant"
    };

    const [receipts, total] = await Promise.all([
      Receipt.find(filter)
        .sort({ acknowledgedAt: -1 }) // Most recent first
        .skip(skip)
        .limit(limit)
        .lean(),
      Receipt.countDocuments(filter),
    ]);

    res.json({
      receipts: receipts.map(mapReceiptToClient),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("getMerchantAwaitingVerification error", error);
    res.status(500).json({ message: "Failed to load receipts awaiting verification" });
  }
};

/**
 * Verify receipt payment (Merchant confirms payment was received)
 * POST /api/receipts/:id/verify
 * Merchant checks their UPI app/cash box and marks as PAID or UNPAID
 */
export const verifyReceiptPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, paymentMethod } = req.body; // status: "paid" or "unpaid"

    if (!["paid", "unpaid"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'paid' or 'unpaid'" });
    }

    // Find and verify ownership
    const receipt = await Receipt.findById(id);
    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found" });
    }

    if (!receipt.merchantId || receipt.merchantId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to verify this receipt" });
    }

    // Update receipt based on verification
    const updateData = {
      verifiedAt: getNowIST(),
    };

    if (status === "paid") {
      updateData.status = "completed";
      updateData.paidAt = getNowIST();
      updateData.pendingAmount = 0;
      if (paymentMethod && ["upi", "cash", "card", "other"].includes(paymentMethod)) {
        updateData.paymentMethod = paymentMethod;
      } else if (receipt.paymentMethod === 'khata' || receipt.paymentMethod === 'pending') {
        updateData.paymentMethod = 'other';
      }
    } else {
      // Mark as unpaid/pending - customer didn't actually pay
      updateData.status = "pending";
      updateData.pendingAmount = receipt.total;
      updateData.paymentMethod = "khata";
    }

    const updatedReceipt = await Receipt.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    // Notify customer about verification result
    if (receipt.userId) {
      try {
        const notifTitle = status === "paid" 
          ? "Payment Verified ✅" 
          : "Payment Not Received";
        const notifMessage = status === "paid"
          ? `Your payment of ₹${receipt.total} at ${receipt.merchantSnapshot?.shopName || 'Merchant'} has been verified!`
          : `Payment of ₹${receipt.total} at ${receipt.merchantSnapshot?.shopName || 'Merchant'} was not received. Please contact the merchant.`;

        await Notification.create({
          userId: receipt.userId,
          type: status === "paid" ? "payment_verified" : "payment_not_received",
          title: notifTitle,
          message: notifMessage,
          sourceType: "receipt",
          sourceId: receipt._id,
          idempotencyKey: `payment_verified:${receipt._id}:${status}`,
        });
      } catch (notifErr) {
        console.warn("Failed to create customer notification:", notifErr);
      }
    }

    // Clear analytics cache
    clearAnalyticsCache(req.user.id);
    if (receipt.userId) {
      clearAnalyticsCache(receipt.userId.toString());
    }

    res.json({
      success: true,
      message: status === "paid" ? "Payment verified successfully" : "Marked as unpaid",
      receipt: mapReceiptToClient(updatedReceipt.toObject()),
    });
  } catch (error) {
    console.error("verifyReceiptPayment error", error);
    res.status(500).json({ message: "Failed to verify payment" });
  }
};

/**
 * Get verification summary for merchant dashboard
 * GET /api/receipts/merchant/verification-summary
 */
export const getMerchantVerificationSummary = async (req, res) => {
  try {
    const filter = { 
      merchantId: req.user.id, 
      status: "waiting_for_merchant"
    };

    const [summary] = await Receipt.aggregate([
      { $match: filter },
      { 
        $group: { 
          _id: null, 
          totalAmount: { $sum: "$total" },
          count: { $sum: 1 }
        } 
      }
    ]);

    res.json({
      totalAwaitingAmount: summary?.totalAmount || 0,
      awaitingCount: summary?.count || 0,
    });
  } catch (error) {
    console.error("getMerchantVerificationSummary error", error);
    res.status(500).json({ message: "Failed to load verification summary" });
  }
};