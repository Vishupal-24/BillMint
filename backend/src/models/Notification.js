import mongoose from "mongoose";

/**
 * Notification Schema
 * 
 * WHY THIS DESIGN:
 * - Unified notification model for all notification types (bill reminders, system alerts, etc.)
 * - idempotencyKey prevents duplicate notifications from scheduler retries
 * - sourceId links back to the originating entity (bill, receipt, etc.)
 * - actionUrl allows CTAs like "View Bill" or "Mark as Paid"
 * - expiresAt enables auto-cleanup of old notifications
 */

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "bill_reminder",      // Recurring bill due soon
        "bill_due_today",     // Bill due today
        "bill_overdue",       // Bill past due date
        "warranty",           // Warranty expiring
        "budget",             // Budget alert
        "eco",                // Eco milestone
        "return",             // Return window closing
        "system",             // System notifications
        "promo",              // Promotional (opt-in)
        // Khata (pending dues) types
        "pending_created",    // New pending bill created for customer
        "payment_reminder",   // Merchant sent payment reminder
        "pending_paid",       // Customer paid pending dues
      ],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    // Reference to source entity (bill, receipt, etc.)
    sourceType: {
      type: String,
      enum: ["recurring_bill", "receipt", "pending_receipt", "system", "other"],
      default: "other",
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "sourceType",
      default: null,
    },
    // Additional data for rich notifications
    metadata: {
      billName: String,
      amount: Number,
      dueDate: Date,
      category: String,
      daysUntilDue: Number,
      currency: String,
    },
    // CTA button configuration
    actionUrl: {
      type: String,
      default: null,
    },
    actionLabel: {
      type: String,
      default: null,
    },
    // Read/dismissed state
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    isDismissed: {
      type: Boolean,
      default: false,
    },
    dismissedAt: {
      type: Date,
      default: null,
    },
    // Idempotency key to prevent duplicate notifications
    // Format: {type}:{sourceId}:{dateKey}:{offset}
    // Example: "bill_reminder:abc123:2026-01-15:3"
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
    },
    // Priority for sorting (higher = more important)
    priority: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    // Channel tracking
    channels: {
      inApp: { type: Boolean, default: true },
      email: { type: Boolean, default: false },
      emailSentAt: { type: Date, default: null },
    },
    // Auto-expire old notifications
    expiresAt: {
      type: Date,
      default: function() {
        // Default: expire after 30 days
        const date = new Date();
        date.setDate(date.getDate() + 30);
        return date;
      },
      index: { expireAfterSeconds: 0 }, // TTL index
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isDismissed: 1, createdAt: -1 });

// Virtual for time ago formatting
notificationSchema.virtual("timeAgo").get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return days === 1 ? "Yesterday" : `${days} days ago`;
  }
  if (hours > 0) {
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  }
  if (minutes > 0) {
    return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
  }
  return "Just now";
});

// Include virtuals in JSON output
notificationSchema.set("toJSON", { virtuals: true });
notificationSchema.set("toObject", { virtuals: true });

/**
 * Static method to create notification with idempotency check
 * Returns existing notification if duplicate, otherwise creates new one
 */
notificationSchema.statics.createIfNotExists = async function(notificationData) {
  const { idempotencyKey } = notificationData;
  
  if (!idempotencyKey) {
    throw new Error("idempotencyKey is required for createIfNotExists");
  }
  
  try {
    // Try to create - will fail if duplicate key
    const notification = await this.create(notificationData);
    return { notification, created: true };
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key - return existing
      const existing = await this.findOne({ idempotencyKey });
      return { notification: existing, created: false };
    }
    throw error;
  }
};

/**
 * Static method to get unread count for a user
 */
notificationSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({ 
    userId, 
    isRead: false,
    isDismissed: false
  });
};

/**
 * Static method to get notifications for a user with pagination
 */
notificationSchema.statics.getForUser = async function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    type = null,
    unreadOnly = false,
  } = options;
  
  const query = { userId, isDismissed: false };
  
  if (type) {
    query.type = type;
  }
  
  if (unreadOnly) {
    query.isRead = false;
  }
  
  const skip = (page - 1) * limit;
  
  const [notifications, total] = await Promise.all([
    this.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments(query),
  ]);
  
  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Mark notification as read
 */
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

/**
 * Dismiss notification (soft delete)
 */
notificationSchema.methods.dismiss = function() {
  this.isDismissed = true;
  this.dismissedAt = new Date();
  return this.save();
};

export default mongoose.model("Notification", notificationSchema);
