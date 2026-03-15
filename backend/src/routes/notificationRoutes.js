import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  dismissNotification,
  dismissAllNotifications,
  getPreferences,
} from "../controllers/notificationController.js";

const router = Router();

/**
 * Notification Routes
 * 
 * All routes require authentication.
 * Notifications are scoped to the authenticated user.
 */

// Get notifications with pagination and filters
router.get("/", protect, getNotifications);

// Get unread count (for badge)
router.get("/count", protect, getUnreadCount);

// Get notification preferences
router.get("/preferences", protect, getPreferences);

// Mark single notification as read
router.patch("/:id/read", protect, markAsRead);

// Mark all notifications as read
router.post("/mark-all-read", protect, markAllAsRead);

// Dismiss single notification
router.delete("/:id", protect, dismissNotification);

// Dismiss all notifications
router.post("/dismiss-all", protect, dismissAllNotifications);

export default router;
