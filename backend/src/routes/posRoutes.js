import { Router } from "express";
import { protect, requireRole } from "../middleware/authMiddleware.js";
import {
  createBill,
  confirmPayment,
  cancelBill,
  getBillById,
  getBills,
  getActiveBills,
  getPOSStats,
  getPublicBill,
  selectPaymentMethod,
  claimReceipt,
} from "../controllers/posController.js";

const router = Router();

/**
 * POS Routes - Merchant-Confirmed UPI Payment System
 * 
 * Flow:
 * 1. POST /bills - Merchant creates bill, gets QR with payment URL
 * 2. Customer scans QR, opens /pay/:billId page
 * 3. Customer chooses Cash or UPI
 * 4. If UPI: Customer redirected to UPI app, pays
 * 5. POST /bills/:billId/confirm - Merchant confirms payment
 * 6. Receipt auto-generated
 * 7. Customer can claim receipt to link to their account
 */

// ==========================================
// PUBLIC ROUTES (No Auth Required)
// For customer payment flow
// ==========================================
router.get("/public/bills/:billId", getPublicBill);
router.post("/public/bills/:billId/select-payment", selectPaymentMethod);

// ==========================================
// CUSTOMER ROUTES (Customer Auth Required)
// For logged-in customers to claim receipts
// ==========================================
router.post("/bills/:billId/claim", protect, requireRole("customer"), claimReceipt);

// ==========================================
// MERCHANT ROUTES (Merchant Auth Required)
// ==========================================
router.use(protect);
router.use(requireRole("merchant"));

// Stats & active bills (dashboard)
router.get("/stats", getPOSStats);
router.get("/bills/active", getActiveBills);

// Bill CRUD
router.post("/bills", createBill);
router.get("/bills", getBills);
router.get("/bills/:billId", getBillById);

// Payment operations
router.post("/bills/:billId/confirm", confirmPayment);
router.post("/bills/:billId/cancel", cancelBill);

export default router;
