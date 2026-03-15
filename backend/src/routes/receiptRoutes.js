import express from "express";
import rateLimit from "express-rate-limit";
import {
  createReceipt,
  getCustomerReceipts,
  getMerchantReceipts,
  getReceiptById,
  claimReceipt,
  markReceiptPaid,
  updateReceipt,
  deleteReceipt,
  // Khata (Pending) APIs
  getMerchantPendingReceipts,
  getCustomerPendingReceipts,
  sendPaymentReminder,
  markPendingAsPaid,
  payPendingBill,
  getMerchantPendingSummary,
  getCustomerPendingSummary,
  // Receipt Acknowledgment Flow APIs
  getPublicReceiptById,
  acknowledgeReceipt,
  getMerchantAwaitingVerification,
  verifyReceiptPayment,
  getMerchantVerificationSummary,
} from "../controllers/receiptController.js";
import { protect, requireRole } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { 
  createReceiptSchema, 
  receiptIdParamSchema, 
  claimReceiptSchema, 
  updateReceiptSchema, 
  markPaidSchema,
  sendReminderSchema,
  payPendingSchema,
} from "../validators/receiptSchemas.js";

const router = express.Router();

const receiptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Too many receipt requests, please try again later" },
});

const createReceiptLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { message: "Too many receipts created, please slow down" },
});

const reminderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Max 10 reminders per hour across all receipts
  message: { message: "Too many reminders sent. Please try again later." },
});

router.use(receiptLimiter);

// ==========================================
// PUBLIC ROUTES (No auth required)
// ==========================================
// Public receipt view (for QR code scanning)
router.get("/public/:id", getPublicReceiptById);

// ==========================================
// RECEIPT ACKNOWLEDGMENT FLOW ROUTES
// (Clean receipt-only system)
// ==========================================
// Customer acknowledges receipt (taps "I received the bill")
router.post("/acknowledge", protect, requireRole("customer"), acknowledgeReceipt);

// Merchant verification routes
router.get("/merchant/awaiting-verification", protect, requireRole("merchant"), getMerchantAwaitingVerification);
router.get("/merchant/verification-summary", protect, requireRole("merchant"), getMerchantVerificationSummary);
router.post("/:id/verify", protect, requireRole("merchant"), verifyReceiptPayment);

// ==========================================
// STANDARD RECEIPT ROUTES
// ==========================================
router.post("/", protect, requireRole("merchant", "customer"), createReceiptLimiter, validate(createReceiptSchema), createReceipt);
router.get("/customer", protect, requireRole("customer"), getCustomerReceipts);
router.get("/merchant", protect, requireRole("merchant"), getMerchantReceipts);
router.post("/claim", protect, requireRole("customer"), validate(claimReceiptSchema), claimReceipt);
router.patch("/:id/mark-paid", protect, requireRole("merchant"), validate(markPaidSchema), markReceiptPaid);
router.patch("/:id", protect, validate(updateReceiptSchema), updateReceipt);
router.delete("/:id", protect, validate(receiptIdParamSchema), deleteReceipt);

// Khata (Pending) routes - Merchant
router.get("/merchant/pending", protect, requireRole("merchant"), getMerchantPendingReceipts);
router.get("/merchant/pending/summary", protect, requireRole("merchant"), getMerchantPendingSummary);
router.post("/:id/send-reminder", protect, requireRole("merchant"), reminderLimiter, validate(sendReminderSchema), sendPaymentReminder);
router.post("/:id/mark-paid-manual", protect, requireRole("merchant"), validate(markPaidSchema), markPendingAsPaid);

// Khata (Pending) routes - Customer
router.get("/customer/pending", protect, requireRole("customer"), getCustomerPendingReceipts);
router.get("/customer/pending/summary", protect, requireRole("customer"), getCustomerPendingSummary);
router.post("/:id/pay-pending", protect, requireRole("customer"), validate(payPendingSchema), payPendingBill);

// IMPORTANT: Keep "/:id" at the end so it doesn't shadow more specific routes like "/merchant/pending".
router.get("/:id", protect, validate(receiptIdParamSchema), getReceiptById);

export default router;
