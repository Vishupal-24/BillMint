import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createBill,
  getBills,
  getBillById,
  updateBill,
  toggleBillStatus,
  markBillPaid,
  deleteBill,
  getUpcomingBills,
  getBillCategories,
} from "../controllers/billController.js";

const router = Router();

/**
 * Bill Routes
 * 
 * All routes require authentication.
 * Bills are scoped to the authenticated user.
 */

// Get upcoming bills summary (dashboard widget)
router.get("/upcoming", protect, getUpcomingBills);

// Get bill categories with counts
router.get("/categories", protect, getBillCategories);

// CRUD operations
router.post("/", protect, createBill);
router.get("/", protect, getBills);
router.get("/:id", protect, getBillById);
router.patch("/:id", protect, updateBill);
router.delete("/:id", protect, deleteBill);

// Status operations
router.patch("/:id/status", protect, toggleBillStatus);
router.post("/:id/mark-paid", protect, markBillPaid);

export default router;
