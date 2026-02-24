import express from "express";
import {
  createReceipt,
  getCustomerReceipts,
  getMerchantReceipts,
  getReceiptById,
} from "../controllers/receiptController.js";
import { protect, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, requireRole("merchant"), createReceipt);
router.get("/customer", protect, requireRole("customer"), getCustomerReceipts);
router.get("/merchant", protect, requireRole("merchant"), getMerchantReceipts);
router.get("/:id", protect, getReceiptById);

export default router;
