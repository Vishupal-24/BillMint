import { Router } from "express";
import express from "express";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  handleRazorpayWebhook,
  getPaymentStatus,
} from "../controllers/paymentController.js";

const router = Router();

/**
 * Payment Routes - Razorpay Payment Gateway Integration
 * 
 * These routes handle the Zomato-style payment flow:
 * 1. Customer scans QR → opens /pay/:billId page
 * 2. Frontend calls POST /api/payments/create-order/:billId
 * 3. Backend creates Razorpay order and returns order_id + key
 * 4. Frontend opens Razorpay Checkout (UPI only)
 * 5. Customer completes UPI payment
 * 6. Frontend receives success → calls POST /api/payments/verify
 * 7. Webhook (payment.captured) also confirms payment
 * 8. Bill is marked PAID and receipt is generated
 * 
 * SECURITY NOTES:
 * - create-order endpoint is PUBLIC (no auth) since customers scanning QR aren't logged in
 * - However, it only creates orders for existing bills (which were created by authenticated merchants)
 * - verify endpoint validates Razorpay signature using HMAC-SHA256
 * - Webhook endpoint uses raw body parser for signature verification
 * - Payment confirmation requires BOTH signature verification AND webhook
 */

// ==========================================
// PUBLIC ROUTES (No Auth Required)
// These are called by the payment page after QR scan
// ==========================================

/**
 * POST /api/payments/create-order/:billId
 * Create a Razorpay order for the bill
 * 
 * Called when customer clicks "Pay via UPI" on payment page
 * Returns order_id and key_id for Razorpay Checkout
 */
router.post("/create-order/:billId", createRazorpayOrder);

/**
 * POST /api/payments/verify
 * Verify Razorpay payment signature
 * 
 * Called by frontend after Razorpay Checkout returns success
 * Verifies signature using HMAC-SHA256 and marks bill as PAID
 */
router.post("/verify", verifyRazorpayPayment);

/**
 * GET /api/payments/status/:billId
 * Get payment status for a bill
 * 
 * Used by frontend to poll for payment completion
 * Optional ?verify=true to verify with Razorpay API
 */
router.get("/status/:billId", getPaymentStatus);

/**
 * POST /api/payments/webhook
 * Razorpay webhook endpoint
 * 
 * CRITICAL: This route uses raw body parser (not JSON)
 * This is required for HMAC signature verification
 * 
 * Events handled:
 * - payment.captured: Main success event
 * - payment.failed: Payment failed
 * - order.paid: Order fully paid
 * 
 * The raw body parser is applied in server.js BEFORE
 * the regular JSON body parser, specifically for this route
 */
router.post(
  "/webhook",
  // Raw body parser is applied at server.js level
  // This middleware just ensures raw body exists
  (req, res, next) => {
    if (!Buffer.isBuffer(req.body)) {
      // If body is not raw, the route-specific middleware wasn't applied
      console.error("[Razorpay Webhook] Body is not raw buffer");
      return res.status(400).json({ message: "Invalid webhook format" });
    }
    next();
  },
  handleRazorpayWebhook
);

export default router;
