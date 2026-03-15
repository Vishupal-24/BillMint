import mongoose from "mongoose";

/**
 * RecurringBill Schema
 * 
 * WHY THIS DESIGN:
 * - billCycle supports common patterns (weekly, monthly, quarterly, yearly, custom)
 * - dueDay handles month-end edge cases (28/29/30/31 → last day of month)
 * - reminderOffsets array allows multiple reminders per bill (e.g., 7d, 3d, 1d before)
 * - lastReminderSent prevents duplicate reminders via idempotent scheduling
 * - markedPaidUntil allows skipping reminders when bill is already paid
 * - timezone ensures reminders fire at appropriate local times
 */

const recurringBillSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    amount: {
      type: Number,
      min: 0,
      default: null, // Optional - some bills have variable amounts
    },
    currency: {
      type: String,
      default: "INR",
      trim: true,
    },
    category: {
      type: String,
      enum: ["utilities", "subscriptions", "insurance", "rent", "loan", "credit_card", "phone", "internet", "other"],
      default: "other",
    },
    billCycle: {
      type: String,
      enum: ["weekly", "biweekly", "monthly", "quarterly", "yearly", "custom"],
      default: "monthly",
      required: true,
    },
    // For monthly: 1-31 (31 = last day of month)
    // For weekly: 0-6 (0 = Sunday, 6 = Saturday)
    // For custom: ignored (uses customIntervalDays)
    dueDay: {
      type: Number,
      min: 0,
      max: 31,
      default: 1,
    },
    // For custom cycle only
    customIntervalDays: {
      type: Number,
      min: 1,
      max: 365,
      default: null,
    },
    // Array of days before due date to send reminders
    // e.g., [7, 3, 1, 0] means reminders 7 days, 3 days, 1 day before, and on due date
    reminderOffsets: {
      type: [Number],
      default: [3, 1], // Default: 3 days and 1 day before
      validate: {
        validator: function(arr) {
          return arr.length > 0 && arr.length <= 5 && arr.every(n => n >= 0 && n <= 30);
        },
        message: "reminderOffsets must have 1-5 values between 0-30 days"
      }
    },
    // Track which reminders have been sent to prevent duplicates
    // Format: { "2026-01-15": [3, 1], "2026-02-15": [3] }
    // Key = due date, Value = array of offsets already sent
    remindersSent: {
      type: Map,
      of: [Number],
      default: () => new Map(),
    },
    // If user marks bill as paid, skip reminders until this date
    // Set to the next due date when marked paid
    markedPaidUntil: {
      type: Date,
      default: null,
    },
    // User's timezone for accurate reminder timing
    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },
    status: {
      type: String,
      enum: ["active", "paused", "deleted"],
      default: "active",
      index: true,
    },
    // For auto-pay linked bills (info only, doesn't affect reminders)
    isAutoPay: {
      type: Boolean,
      default: false,
    },
    // Notes or payment instructions
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    // Optional: link to merchant if bill is from a known merchant
    merchantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Merchant",
      default: null,
    },
    // Reference date for calculating next due date
    // For new bills, this is the first due date
    startDate: {
      type: Date,
      required: true,
    },
    // Optional end date for finite subscriptions
    endDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
recurringBillSchema.index({ userId: 1, status: 1 });
recurringBillSchema.index({ status: 1, startDate: 1 });

/**
 * Calculate the next due date from a reference date
 * Handles month-end edge cases (e.g., dueDay=31 in February → Feb 28/29)
 */
recurringBillSchema.methods.calculateNextDueDate = function(fromDate = new Date()) {
  const { billCycle, dueDay, customIntervalDays, startDate, timezone } = this;
  
  // Use Intl to get current date in user's timezone
  const getLocalDate = (date) => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    
    const map = Object.fromEntries(parts.filter(p => p.type !== "literal").map(p => [p.type, p.value]));
    return { year: parseInt(map.year), month: parseInt(map.month) - 1, day: parseInt(map.day) };
  };
  
  const local = getLocalDate(fromDate);
  let nextDue;
  
  switch (billCycle) {
    case "weekly": {
      // dueDay is 0-6 (Sunday-Saturday)
      const currentDay = new Date(fromDate).getDay();
      let daysUntil = dueDay - currentDay;
      if (daysUntil <= 0) daysUntil += 7;
      nextDue = new Date(fromDate);
      nextDue.setDate(nextDue.getDate() + daysUntil);
      break;
    }
    
    case "biweekly": {
      // Every 2 weeks from start date
      const start = new Date(startDate);
      const daysDiff = Math.floor((fromDate - start) / (1000 * 60 * 60 * 24));
      const weeksCompleted = Math.floor(daysDiff / 14);
      nextDue = new Date(start);
      nextDue.setDate(start.getDate() + (weeksCompleted + 1) * 14);
      break;
    }
    
    case "monthly": {
      // Handle month-end edge cases
      let targetMonth = local.month;
      let targetYear = local.year;
      
      // If we're past the due day this month, go to next month
      if (local.day >= dueDay) {
        targetMonth++;
        if (targetMonth > 11) {
          targetMonth = 0;
          targetYear++;
        }
      }
      
      // Get last day of target month
      const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
      const actualDay = Math.min(dueDay, lastDay);
      
      nextDue = new Date(targetYear, targetMonth, actualDay);
      break;
    }
    
    case "quarterly": {
      let targetMonth = local.month;
      let targetYear = local.year;
      
      // Find next quarter month (0, 3, 6, 9)
      const quarterMonth = Math.floor(targetMonth / 3) * 3;
      if (targetMonth === quarterMonth && local.day < dueDay) {
        // Still in quarter month and before due day
        targetMonth = quarterMonth;
      } else {
        // Move to next quarter
        targetMonth = quarterMonth + 3;
        if (targetMonth > 11) {
          targetMonth = targetMonth - 12;
          targetYear++;
        }
      }
      
      const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
      const actualDay = Math.min(dueDay, lastDay);
      
      nextDue = new Date(targetYear, targetMonth, actualDay);
      break;
    }
    
    case "yearly": {
      let targetYear = local.year;
      const startLocal = getLocalDate(startDate);
      
      // Use start date's month for yearly bills
      let targetMonth = startLocal.month;
      
      // If this year's date has passed, go to next year
      if (local.month > targetMonth || (local.month === targetMonth && local.day >= dueDay)) {
        targetYear++;
      }
      
      const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
      const actualDay = Math.min(dueDay, lastDay);
      
      nextDue = new Date(targetYear, targetMonth, actualDay);
      break;
    }
    
    case "custom": {
      if (!customIntervalDays) {
        // Fallback to monthly
        return this.calculateNextDueDate(fromDate);
      }
      
      const start = new Date(startDate);
      const daysDiff = Math.floor((fromDate - start) / (1000 * 60 * 60 * 24));
      const intervalsCompleted = Math.floor(daysDiff / customIntervalDays);
      nextDue = new Date(start);
      nextDue.setDate(start.getDate() + (intervalsCompleted + 1) * customIntervalDays);
      break;
    }
    
    default:
      nextDue = new Date(fromDate);
      nextDue.setMonth(nextDue.getMonth() + 1);
  }
  
  // Set to start of day in user's timezone (approximation)
  nextDue.setHours(0, 0, 0, 0);
  
  return nextDue;
};

/**
 * Get upcoming due dates within a range
 */
recurringBillSchema.methods.getUpcomingDueDates = function(count = 3) {
  const dates = [];
  let current = new Date();
  
  for (let i = 0; i < count; i++) {
    const nextDue = this.calculateNextDueDate(current);
    dates.push(nextDue);
    // Move to day after due date to find next one
    current = new Date(nextDue);
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
};

/**
 * Check if reminder was already sent for a specific due date and offset
 */
recurringBillSchema.methods.wasReminderSent = function(dueDate, offset) {
  const dateKey = dueDate.toISOString().split('T')[0]; // YYYY-MM-DD
  const sentOffsets = this.remindersSent.get(dateKey) || [];
  return sentOffsets.includes(offset);
};

/**
 * Mark a reminder as sent (prevents duplicates)
 */
recurringBillSchema.methods.markReminderSent = function(dueDate, offset) {
  const dateKey = dueDate.toISOString().split('T')[0];
  const sentOffsets = this.remindersSent.get(dateKey) || [];
  if (!sentOffsets.includes(offset)) {
    sentOffsets.push(offset);
    this.remindersSent.set(dateKey, sentOffsets);
  }
};

/**
 * Clean up old reminder tracking entries (older than 90 days)
 */
recurringBillSchema.methods.cleanupOldReminders = function() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  
  for (const [dateKey] of this.remindersSent) {
    if (dateKey < cutoffStr) {
      this.remindersSent.delete(dateKey);
    }
  }
};

/**
 * Check if bill is due within a certain number of days
 */
recurringBillSchema.methods.isDueWithin = function(days) {
  const nextDue = this.calculateNextDueDate();
  const now = new Date();
  const diffDays = Math.ceil((nextDue - now) / (1000 * 60 * 60 * 24));
  return diffDays <= days;
};

export default mongoose.model("RecurringBill", recurringBillSchema);
