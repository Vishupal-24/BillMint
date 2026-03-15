import Notification from "../models/Notification.js";

/**
 * Notification Controller
 * 
 * WHY THIS APPROACH:
 * - Efficient batch operations (mark all as read)
 * - Pagination prevents loading too many notifications
 * - Filters allow focusing on specific notification types
 */

/**
 * Get notifications for the authenticated user
 * GET /api/notifications
 */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      page = 1, 
      limit = 20, 
      type = null, 
      unreadOnly = false 
    } = req.query;

    const result = await Notification.getForUser(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      type: type || null,
      unreadOnly: unreadOnly === "true" || unreadOnly === true,
    });

    // Get unread count for badge
    const unreadCount = await Notification.getUnreadCount(userId);

    res.json({
      ...result,
      unreadCount,
    });
  } catch (error) {
    console.error("[Notifications] Get error:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
};

/**
 * Get unread notification count
 * GET /api/notifications/count
 */
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Notification.getUnreadCount(userId);
    
    res.json({ count });
  } catch (error) {
    console.error("[Notifications] Count error:", error);
    res.status(500).json({ message: "Failed to get notification count" });
  }
};

/**
 * Mark a single notification as read
 * PATCH /api/notifications/:id/read
 */
export const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await Notification.findOne({ _id: id, userId });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (!notification.isRead) {
      await notification.markAsRead();
    }

    res.json({ 
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("[Notifications] Mark read error:", error);
    res.status(500).json({ message: "Failed to mark notification as read" });
  }
};

/**
 * Mark all notifications as read
 * POST /api/notifications/mark-all-read
 */
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = null } = req.body;

    const query = { userId, isRead: false };
    if (type) {
      query.type = type;
    }

    const result = await Notification.updateMany(query, {
      isRead: true,
      readAt: new Date(),
    });

    res.json({
      message: "All notifications marked as read",
      count: result.modifiedCount,
    });
  } catch (error) {
    console.error("[Notifications] Mark all read error:", error);
    res.status(500).json({ message: "Failed to mark notifications as read" });
  }
};

/**
 * Dismiss a notification (soft delete)
 * DELETE /api/notifications/:id
 */
export const dismissNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await Notification.findOne({ _id: id, userId });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    await notification.dismiss();

    res.json({ message: "Notification dismissed" });
  } catch (error) {
    console.error("[Notifications] Dismiss error:", error);
    res.status(500).json({ message: "Failed to dismiss notification" });
  }
};

/**
 * Dismiss all notifications
 * POST /api/notifications/dismiss-all
 */
export const dismissAllNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = null } = req.body;

    const query = { userId, isDismissed: false };
    if (type) {
      query.type = type;
    }

    const result = await Notification.updateMany(query, {
      isDismissed: true,
      dismissedAt: new Date(),
    });

    res.json({
      message: "All notifications dismissed",
      count: result.modifiedCount,
    });
  } catch (error) {
    console.error("[Notifications] Dismiss all error:", error);
    res.status(500).json({ message: "Failed to dismiss notifications" });
  }
};

/**
 * Get notification preferences (placeholder for future)
 * GET /api/notifications/preferences
 */
export const getPreferences = async (req, res) => {
  try {
    // For now, return default preferences
    // In future, this could be stored in user settings
    res.json({
      preferences: {
        inApp: true,
        email: false,
        billReminders: true,
        budgetAlerts: true,
        warrantyAlerts: true,
        ecoMilestones: true,
        promos: false,
      },
    });
  } catch (error) {
    console.error("[Notifications] Get preferences error:", error);
    res.status(500).json({ message: "Failed to get preferences" });
  }
};
