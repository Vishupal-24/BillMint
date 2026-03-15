import express from "express";
import rateLimit from "express-rate-limit";
import {
  getCustomerAnalytics,
  getMerchantAnalytics,
} from "../controllers/analyticsController.js";
import { protect, requireRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// Tighter limit - analytics queries are expensive
const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: { message: "Too many analytics requests, please try again later" },
});

router.use(analyticsLimiter);

router.get("/customer", protect, requireRole("customer"), getCustomerAnalytics);
router.get("/merchant", protect, requireRole("merchant"), getMerchantAnalytics);

export default router;
