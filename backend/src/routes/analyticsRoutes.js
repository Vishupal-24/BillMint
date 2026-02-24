import express from "express";
import {
  getCustomerAnalytics,
  getMerchantAnalytics,
} from "../controllers/analyticsController.js";
import { protect, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/customer", protect, requireRole("customer"), getCustomerAnalytics);
router.get("/merchant", protect, requireRole("merchant"), getMerchantAnalytics);

export default router;
