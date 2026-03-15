import crypto from "crypto";
import Razorpay from "razorpay";
import POSBill from "../models/POSBill.js";
import { finalizeBillAndCreateReceipt } from "../services/receiptFinalizer.js";

/**
 * Payment Controller - Razorpay Payment Gateway Integration
 * 
 * This implements Razorpay's checkout flow (Zomato-style):
 * - Smart QR contains ONLY a URL (no UPI intent)
 * - Customer scans QR → opens payment page
 * - Backend creates Razorpay order (server-side using secret key)
 * - Frontend opens Razorpay Checkout (UPI only)
 * - Customer completes UPI payment
 * - Frontend receives success callback → verifies with backend
 * - Webhook confirms payment (source of truth)
 * 
 * WHY Razorpay instead of raw UPI links?
 * - Higher success rate across all UPI apps
 * - Merchant KYC compliance (no "merchant not verified" errors)
 * - TEST MODE for development (simulates UPI without real money)
 * - Reliable webhooks for payment confirmation
 * - Works consistently on iOS and Android
 * - Easy switch from TEST to LIVE by just changing env keys
 */

// ==========================================
// RAZORPAY CONFIGURATION
// ==========================================

// Razorpay key ID (safe to expose to frontend)
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;

// Razorpay secret key (NEVER expose to frontend)
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

// Webhook secret (configured in Razorpay Dashboard)
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

// Initialize Razorpay instance with TEST/LIVE keys from environment
// IMPORTANT: Use rzp_test_* keys for testing, rzp_live_* for production
let razorpay = null;
const getRazorpayInstance = () => {
  if (!razorpay && RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
};

/**
 * POST /api/payments/create-order/:billId
 * Create a Razorpay order for a bill
 * 
 * This endpoint is called when customer clicks "Pay via UPI" on the payment page.
 * It creates a Razorpay order and returns the order_id for Razorpay Checkout.
 * 
 * IMPORTANT:
 * - Amount must be in PAISE (multiply by 100)
 * - Order ID is used to track payment status
 * - Receipt field links Razorpay order to our bill
 * 
 * SECURITY: 
 * - Secret key is used server-side only
 * - Frontend only receives order_id and key_id (safe to expose)
 */
export const createRazorpayOrder = async (req, res) => {
  try {
    const { billId } = req.params;
    const { customerPhone, customerEmail, customerName } = req.body;
    
    // Validate Razorpay configuration
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      console.error("[Razorpay] Missing API credentials in environment");
      return res.status(500).json({ 
        message: "Payment gateway not configured",
        code: "GATEWAY_NOT_CONFIGURED"
      });
    }
    
    const razorpayInstance = getRazorpayInstance();
    if (!razorpayInstance) {
      return res.status(500).json({ 
        message: "Payment gateway initialization failed",
        code: "GATEWAY_INIT_FAILED"
      });
    }
    
    // Find the bill
    const bill = await POSBill.findById(billId).populate("merchantId", "shopName merchantCode");
    
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }
    
    // Validate bill state
    if (bill.status === "PAID") {
      return res.status(400).json({ 
        message: "Bill is already paid",
        code: "ALREADY_PAID"
      });
    }
    
    if (bill.status === "EXPIRED") {
      return res.status(400).json({ 
        message: "Bill has expired",
        code: "BILL_EXPIRED"
      });
    }
    
    if (bill.status === "CANCELLED") {
      return res.status(400).json({ 
        message: "Bill was cancelled",
        code: "BILL_CANCELLED"
      });
    }
    
    // Check expiry
    if (new Date() > bill.expiresAt) {
      bill.status = "EXPIRED";
      await bill.save();
      return res.status(400).json({ 
        message: "Bill has expired",
        code: "BILL_EXPIRED"
      });
    }
    
    // IDEMPOTENCY: If order already created and not paid, return existing order
    // This prevents multiple Razorpay orders for the same bill
    if (bill.razorpayOrderId && bill.razorpayOrderStatus !== "paid") {
      console.log("[Razorpay] Returning existing order for bill:", billId);
      return res.json({
        success: true,
        orderId: bill.razorpayOrderId,
        keyId: RAZORPAY_KEY_ID,
        amount: bill.total * 100, // paise
        currency: "INR",
        billId: bill._id,
        merchantName: bill.merchantId?.shopName || "GreenReceipt",
        message: "Existing order returned"
      });
    }
    
    // Create Razorpay order
    // Reference: https://razorpay.com/docs/api/orders/
    const orderOptions = {
      // Amount in PAISE (100 paise = 1 INR)
      // CRITICAL: Razorpay requires amount in smallest currency unit
      amount: Math.round(bill.total * 100),
      
      // Currency code
      currency: "INR",
      
      // Receipt - links Razorpay order to our bill
      // Max 40 characters, must be unique
      receipt: `GR_${bill._id}`,
      
      // Payment capture mode
      // 1 = auto-capture (recommended for UPI)
      // 0 = manual capture (for card pre-auth scenarios)
      payment_capture: 1,
      
      // Notes - additional data stored with order (visible in dashboard)
      notes: {
        billId: bill._id.toString(),
        merchantId: bill.merchantId?._id?.toString() || "",
        upiNote: bill.upiNote || "",
        customerPhone: customerPhone || bill.customerPhone || "",
        customerName: customerName || bill.customerName || "",
      },
    };
    
    console.log("[Razorpay] Creating order:", {
      amount: orderOptions.amount,
      receipt: orderOptions.receipt,
    });
    
    // Create order via Razorpay API
    const order = await razorpayInstance.orders.create(orderOptions);
    
    console.log("[Razorpay] Order created successfully:", {
      order_id: order.id,
      amount: order.amount,
      status: order.status,
    });
    
    // Update bill with Razorpay order details
    bill.razorpayOrderId = order.id;
    bill.razorpayOrderStatus = order.status; // "created"
    bill.isRazorpayPayment = true;
    bill.paymentMethod = "upi";
    bill.customerSelected = true;
    
    // Update customer details if provided
    if (customerPhone) bill.customerPhone = customerPhone;
    if (customerName) bill.customerName = customerName;
    
    await bill.save();
    
    // Return response to frontend
    // Frontend will use these to initialize Razorpay Checkout
    res.json({
      success: true,
      orderId: order.id,
      keyId: RAZORPAY_KEY_ID, // Safe to expose - this is the public key
      amount: order.amount, // Already in paise
      currency: order.currency,
      billId: bill._id,
      merchantName: bill.merchantId?.shopName || "GreenReceipt",
      description: `Bill Payment - ${bill.upiNote || bill._id}`,
      prefill: {
        contact: customerPhone || bill.customerPhone || "",
        email: customerEmail || "",
        name: customerName || bill.customerName || "",
      },
    });
    
  } catch (error) {
    console.error("[Razorpay] Create order error:", error);
    res.status(500).json({ 
      message: "Failed to create payment order",
      error: error.message,
      code: "ORDER_CREATION_FAILED"
    });
  }
};

/**
 * POST /api/payments/verify
 * Verify Razorpay payment signature
 * 
 * This endpoint is called by frontend after Razorpay Checkout returns success.
 * We MUST verify the signature to prevent fake success callbacks.
 * 
 * SIGNATURE VERIFICATION:
 * 1. Concatenate: razorpay_order_id + "|" + razorpay_payment_id
 * 2. Compute HMAC-SHA256 using secret key
 * 3. Compare with razorpay_signature
 * 
 * WHY verify signature?
 * - Prevents attackers from sending fake success callbacks
 * - Ensures payment actually went through Razorpay
 * - Mandatory for production compliance
 * 
 * NOTE: Even after successful verification, webhook is the ultimate source of truth
 */
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      billId,
    } = req.body;
    
    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment details",
        code: "MISSING_FIELDS"
      });
    }
    
    console.log("[Razorpay] Verifying payment:", {
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
    });
    
    // Signature verification
    // Format: HMAC-SHA256(order_id + "|" + payment_id, secret_key)
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");
    
    const isValid = expectedSignature === razorpay_signature;
    
    if (!isValid) {
      console.error("[Razorpay] Invalid signature:", {
        expected: expectedSignature,
        received: razorpay_signature,
      });
      return res.status(400).json({
        success: false,
        message: "Payment verification failed - invalid signature",
        code: "INVALID_SIGNATURE"
      });
    }
    
    console.log("[Razorpay] Signature verified successfully");
    
    // Find bill by Razorpay order ID
    const bill = await POSBill.findOne({ razorpayOrderId: razorpay_order_id });
    
    if (!bill) {
      console.error("[Razorpay] Bill not found for order:", razorpay_order_id);
      return res.status(404).json({
        success: false,
        message: "Bill not found for this payment",
        code: "BILL_NOT_FOUND"
      });
    }
    
    // Store verified payment details (do NOT mark PAID here)
    bill.razorpayPaymentId = razorpay_payment_id;
    bill.razorpaySignature = razorpay_signature;
    bill.razorpayOrderStatus = "paid";
    await bill.save();
    
    console.log("[Razorpay] Payment verified, bill marked PAID:", bill._id);
    
    res.json({
      success: true,
      message: "Payment verified successfully",
      billId: bill._id,
      receiptId: bill.receiptId || null,
    });
    
  } catch (error) {
    console.error("[Razorpay] Verify payment error:", error);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error.message,
      code: "VERIFICATION_FAILED"
    });
  }
};

/**
 * POST /api/payments/webhook
 * Razorpay webhook handler
 * 
 * This is the SOURCE OF TRUTH for payment confirmation.
 * Webhooks are more reliable than frontend callbacks because:
 * - User may close browser/app before callback completes
 * - Network issues may prevent callback
 * - Webhook retries on failure
 * 
 * IMPORTANT: Verify webhook signature to prevent fake webhooks
 * 
 * Events handled:
 * - payment.captured: Payment successful (main event)
 * - payment.failed: Payment failed
 * - order.paid: Order fully paid
 * 
 * Reference: https://razorpay.com/docs/webhooks/
 */
export const handleRazorpayWebhook = async (req, res) => {
  try {
    // Raw body is required for signature verification
    const rawBody = req.body;
    
    if (!Buffer.isBuffer(rawBody)) {
      console.error("[Razorpay Webhook] Body is not raw buffer - check middleware");
      return res.status(400).json({ message: "Invalid request body format" });
    }
    
    // Extract signature from headers
    const signature = req.headers["x-razorpay-signature"];
    
    if (!signature) {
      console.error("[Razorpay Webhook] Missing signature header");
      return res.status(400).json({ message: "Missing webhook signature" });
    }
    
    // Verify webhook signature
    // HMAC-SHA256(raw_body, webhook_secret)
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");
    
    if (expectedSignature !== signature) {
      console.error("[Razorpay Webhook] Invalid signature:", {
        expected: expectedSignature,
        received: signature,
      });
      return res.status(401).json({ message: "Invalid webhook signature" });
    }
    
    // Signature valid - parse payload
    const payload = JSON.parse(rawBody.toString("utf8"));
    const event = payload.event;
    
    console.log("[Razorpay Webhook] Received event:", event);
    
    // Handle payment.captured event (main success event)
    if (event === "payment.captured" || event === "order.paid") {
      const payment = payload.payload?.payment?.entity;
      const order = payload.payload?.order?.entity;
      
      const orderId = payment?.order_id || order?.id;
      const paymentId = payment?.id;
      
      if (!orderId) {
        console.warn("[Razorpay Webhook] No order_id in payload");
        return res.status(200).json({ message: "No action needed" });
      }
      
      // Find bill by Razorpay order ID
      const bill = await POSBill.findOne({ razorpayOrderId: orderId });
      
      if (!bill) {
        console.warn("[Razorpay Webhook] Bill not found for order:", orderId);
        return res.status(200).json({ message: "Bill not found" });
      }
      
      // IDEMPOTENCY: Check if already processed
      if (bill.status === "PAID" && bill.razorpayPaymentId) {
        console.log("[Razorpay Webhook] Bill already marked PAID, skipping");
        return res.status(200).json({ message: "Already processed" });
      }
      
      // Store raw webhook payload for debugging
      bill.razorpayWebhookPayload = payload;
      
      // Mark bill as PAID
      bill.status = "PAID";
      bill.paidAt = new Date();
      bill.razorpayPaymentId = paymentId;
      bill.razorpayOrderStatus = "paid";
      
      await bill.save();
      
      // Generate receipt (idempotent)
      await finalizeBillAndCreateReceipt(bill._id, "razorpay-webhook");
      
      console.log("[Razorpay Webhook] Bill marked PAID via webhook:", bill._id);
      
      // TODO: Send notification to merchant
      // TODO: Send receipt to customer email
      
    } else if (event === "payment.failed") {
      // Payment failed - log for debugging
      const payment = payload.payload?.payment?.entity;
      const orderId = payment?.order_id;
      
      console.log("[Razorpay Webhook] Payment failed for order:", orderId);
      
      // Optionally update bill status
      if (orderId) {
        const bill = await POSBill.findOne({ razorpayOrderId: orderId });
        if (bill && bill.status !== "PAID") {
          bill.razorpayOrderStatus = "attempted";
          bill.razorpayWebhookPayload = payload;
          await bill.save();
        }
      }
    }
    
    // Always return 200 to acknowledge webhook
    // Razorpay will retry on non-200 responses
    res.status(200).json({ status: "ok" });
    
  } catch (error) {
    console.error("[Razorpay Webhook] Error:", error);
    // Return 200 even on error to prevent infinite retries
    res.status(200).json({ message: "Error logged" });
  }
};

/**
 * GET /api/payments/status/:billId
 * Get payment status for a bill
 * 
 * Used by frontend to poll for payment completion
 * Also optionally fetches real-time status from Razorpay API
 */
export const getPaymentStatus = async (req, res) => {
  try {
    const { billId } = req.params;
    
    const bill = await POSBill.findById(billId)
      .populate("merchantId", "shopName merchantCode")
      .populate("receiptId");
    
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }
    
    // Optional verification removed from this public endpoint to keep it read-only.
    
    res.json({
      billId: bill._id,
      status: bill.status,
      paymentMethod: bill.paymentMethod,
      amount: bill.total,
      paidAt: bill.paidAt,
      razorpayOrderId: bill.razorpayOrderId,
      razorpayPaymentId: bill.razorpayPaymentId,
      razorpayOrderStatus: bill.razorpayOrderStatus,
      receiptId: bill.receiptId?._id,
      merchant: {
        name: bill.merchantId?.shopName,
        code: bill.merchantId?.merchantCode,
      },
    });
    
  } catch (error) {
    console.error("[Payment Status] Error:", error);
    res.status(500).json({ message: "Failed to get payment status" });
  }
};

/**
 * Helper: Generate receipt from a paid bill
 * Called after payment is verified (via callback or webhook)
 */
const generateReceiptFromBill = async (bill) => {
  try {
    return await finalizeBillAndCreateReceipt(bill._id, "razorpay-webhook");
    
  } catch (error) {
    console.error("[Receipt] Failed to generate receipt:", error);
    throw error;
  }
};

export default {
  createRazorpayOrder,
  verifyRazorpayPayment,
  handleRazorpayWebhook,
  getPaymentStatus,
};
