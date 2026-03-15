import RecurringBill from "../models/RecurringBill.js";
import Notification from "../models/Notification.js";
import { sendEmail } from "../utils/sendEmail.js";

/**
 * Bill Reminder Scheduler
 * 
 * WHY THIS DESIGN:
 * 1. IDEMPOTENCY: Uses idempotencyKey to prevent duplicate notifications
 * 2. TIMEZONE AWARE: Calculates due dates in user's timezone
 * 3. EDGE CASE HANDLING: Handles month-end, missed schedules, server restarts
 * 4. GRACEFUL: Catches errors per-bill so one failure doesn't block others
 * 5. EFFICIENT: Batch processes bills, uses indexed queries
 * 
 * SCHEDULING STRATEGY:
 * - Run every hour (handles timezone differences across users)
 * - For each active bill, check if any reminder should be sent today
 * - Use idempotency key to prevent duplicates even if scheduler runs multiple times
 */

/**
 * Calculate which reminders need to be sent for a bill
 * Returns array of { offset, dueDate } for reminders that should be sent
 */
const getRemindersToSend = (bill, now = new Date()) => {
  const remindersToSend = [];
  
  // Skip if bill is paused
  if (bill.status !== "active") {
    return remindersToSend;
  }
  
  // Calculate next due date
  const nextDueDate = bill.calculateNextDueDate(now);
  
  // Skip if bill is marked as paid for this cycle
  if (bill.markedPaidUntil && new Date(bill.markedPaidUntil) > now) {
    return remindersToSend;
  }
  
  // Skip if past end date
  if (bill.endDate && new Date(bill.endDate) < now) {
    return remindersToSend;
  }
  
  // Check each reminder offset
  for (const offset of bill.reminderOffsets) {
    // Calculate when this reminder should trigger
    const reminderDate = new Date(nextDueDate);
    reminderDate.setDate(reminderDate.getDate() - offset);
    
    // Reminder should trigger if we're on or past the reminder date
    // but not yet past the due date + 1 day (grace period for missed schedules)
    const reminderDateStr = reminderDate.toISOString().split('T')[0];
    const nowStr = now.toISOString().split('T')[0];
    const dueDateStr = nextDueDate.toISOString().split('T')[0];
    
    // Check if reminder should be sent today (or was missed and should be sent)
    if (nowStr >= reminderDateStr && nowStr <= dueDateStr) {
      // Check if already sent using idempotency tracking
      if (!bill.wasReminderSent(nextDueDate, offset)) {
        remindersToSend.push({
          offset,
          dueDate: nextDueDate,
          dueDateStr,
        });
      }
    }
  }
  
  return remindersToSend;
};

/**
 * Generate notification content based on reminder type
 */
const generateNotificationContent = (bill, offset, dueDate) => {
  const dueDateFormatted = dueDate.toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  
  const amountText = bill.amount 
    ? ` of ${bill.currency} ${bill.amount.toLocaleString("en-IN")}` 
    : "";
  
  let title, message, type, priority;
  
  if (offset === 0) {
    // Due today
    type = "bill_due_today";
    title = `${bill.name} is due today!`;
    message = `Your ${bill.name} bill${amountText} is due today (${dueDateFormatted}). Don't forget to pay!`;
    priority = 8;
  } else if (offset === 1) {
    // Due tomorrow
    type = "bill_reminder";
    title = `${bill.name} due tomorrow`;
    message = `Your ${bill.name} bill${amountText} is due tomorrow (${dueDateFormatted}).`;
    priority = 6;
  } else {
    // X days before
    type = "bill_reminder";
    title = `${bill.name} due in ${offset} days`;
    message = `Your ${bill.name} bill${amountText} is due on ${dueDateFormatted}. Plan ahead!`;
    priority = 4;
  }
  
  return { title, message, type, priority };
};

/**
 * Generate email content for bill reminder
 */
const generateReminderEmailHtml = (bill, offset, dueDate) => {
  const dueDateFormatted = dueDate.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  
  const amountText = bill.amount 
    ? `${bill.currency} ${bill.amount.toLocaleString("en-IN")}` 
    : "Variable amount";
  
  const urgencyColor = offset === 0 ? "#ef4444" : offset <= 2 ? "#f59e0b" : "#10b981";
  const urgencyText = offset === 0 ? "Due Today!" : offset === 1 ? "Due Tomorrow" : `Due in ${offset} days`;
  
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">
          🌱 GreenReceipt
        </h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">
          Bill Reminder
        </p>
      </div>
      
      <!-- Content -->
      <div style="padding: 40px 30px; background: #ffffff;">
        <!-- Urgency Badge -->
        <div style="text-align: center; margin-bottom: 30px;">
          <span style="display: inline-block; background: ${urgencyColor}; color: white; padding: 8px 20px; border-radius: 20px; font-weight: 600; font-size: 14px;">
            ⏰ ${urgencyText}
          </span>
        </div>
        
        <!-- Bill Details Card -->
        <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 30px;">
          <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 22px;">
            ${bill.name}
          </h2>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
            <span style="color: #64748b;">Amount:</span>
            <span style="color: #1e293b; font-weight: 600;">${amountText}</span>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
            <span style="color: #64748b;">Due Date:</span>
            <span style="color: #1e293b; font-weight: 600;">${dueDateFormatted}</span>
          </div>
          
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #64748b;">Category:</span>
            <span style="color: #1e293b; font-weight: 600; text-transform: capitalize;">${bill.category.replace("_", " ")}</span>
          </div>
          
          ${bill.notes ? `
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
              <span style="color: #64748b; font-size: 13px;">Notes:</span>
              <p style="color: #475569; margin: 4px 0 0 0; font-size: 14px;">${bill.notes}</p>
            </div>
          ` : ""}
        </div>
        
        <!-- CTA Button -->
        <div style="text-align: center;">
          <a href="${process.env.CLIENT_URL || "https://green-recipt.vercel.app"}/customer/bills" 
             style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
            View My Bills →
          </a>
        </div>
      </div>
      
      <!-- Footer -->
      <div style="background: #f8fafc; padding: 24px 30px; text-align: center; border-radius: 0 0 12px 12px;">
        <p style="color: #64748b; margin: 0; font-size: 13px;">
          You're receiving this because you have bill reminders enabled for ${bill.name}.
        </p>
        <p style="color: #94a3b8; margin: 10px 0 0 0; font-size: 12px;">
          © ${new Date().getFullYear()} GreenReceipt - Go Paperless
        </p>
      </div>
    </div>
  `;
};

/**
 * Send reminder notification and optionally email
 */
const sendReminder = async (bill, offset, dueDate, user) => {
  const { title, message, type, priority } = generateNotificationContent(bill, offset, dueDate);
  const dueDateStr = dueDate.toISOString().split('T')[0];
  
  // Create idempotency key to prevent duplicates
  const idempotencyKey = `${type}:${bill._id}:${dueDateStr}:${offset}`;
  
  try {
    // Create in-app notification with idempotency check
    const { notification, created } = await Notification.createIfNotExists({
      userId: bill.userId,
      type,
      title,
      message,
      sourceType: "recurring_bill",
      sourceId: bill._id,
      metadata: {
        billName: bill.name,
        amount: bill.amount,
        dueDate,
        category: bill.category,
        daysUntilDue: offset,
        currency: bill.currency,
      },
      actionUrl: "/bills",
      actionLabel: "View Bills",
      idempotencyKey,
      priority,
      channels: {
        inApp: true,
        email: false, // Will update if email sent
      },
    });
    
    if (!created) {
      console.log(`[Scheduler] Skipped duplicate reminder: ${idempotencyKey}`);
      return { skipped: true };
    }
    
    // Mark reminder as sent on the bill
    bill.markReminderSent(dueDate, offset);
    await bill.save();
    
    console.log(`[Scheduler] ✅ Sent reminder: ${bill.name} (${offset} days before ${dueDateStr})`);
    
    // Send email if configured (non-blocking)
    // For now, only send email for due-today reminders
    if (offset === 0 && user?.email && process.env.SENDGRID_API_KEY) {
      try {
        const emailHtml = generateReminderEmailHtml(bill, offset, dueDate);
        await sendEmail({
          to: user.email,
          subject: `⏰ ${bill.name} is due today!`,
          html: emailHtml,
        });
        
        // Update notification to mark email as sent
        notification.channels.email = true;
        notification.channels.emailSentAt = new Date();
        await notification.save();
        
        console.log(`[Scheduler] ✉️ Email sent for: ${bill.name}`);
      } catch (emailError) {
        // Email failure shouldn't block the reminder
        console.error(`[Scheduler] Email failed for ${bill.name}:`, emailError.message);
      }
    }
    
    return { sent: true, notification };
  } catch (error) {
    console.error(`[Scheduler] Error sending reminder for ${bill.name}:`, error.message);
    return { error: error.message };
  }
};

/**
 * Main scheduler function - processes all active bills
 */
export const processReminders = async () => {
  const startTime = Date.now();
  console.log("[Scheduler] 🔄 Starting reminder processing...");
  
  try {
    // Get all active bills with populated user (for email)
    const bills = await RecurringBill.find({ status: "active" }).populate({
      path: "userId",
      select: "email name",
    });
    
    if (bills.length === 0) {
      console.log("[Scheduler] No active bills to process");
      return { processed: 0, sent: 0, skipped: 0, errors: 0 };
    }
    
    const now = new Date();
    let sent = 0;
    let skipped = 0;
    let errors = 0;
    
    // Process each bill
    for (const bill of bills) {
      try {
        // Clean up old reminder tracking (runs occasionally)
        if (Math.random() < 0.1) {
          bill.cleanupOldReminders();
        }
        
        // Get reminders that need to be sent
        const remindersToSend = getRemindersToSend(bill, now);
        
        if (remindersToSend.length === 0) {
          continue;
        }
        
        // Send each reminder
        for (const { offset, dueDate } of remindersToSend) {
          const result = await sendReminder(bill, offset, dueDate, bill.userId);
          
          if (result.sent) {
            sent++;
          } else if (result.skipped) {
            skipped++;
          } else if (result.error) {
            errors++;
          }
        }
      } catch (billError) {
        console.error(`[Scheduler] Error processing bill ${bill._id}:`, billError.message);
        errors++;
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(`[Scheduler] ✅ Completed in ${duration}ms - Processed: ${bills.length}, Sent: ${sent}, Skipped: ${skipped}, Errors: ${errors}`);
    
    return { processed: bills.length, sent, skipped, errors, duration };
  } catch (error) {
    console.error("[Scheduler] Fatal error:", error);
    throw error;
  }
};

/**
 * Handle missed schedules (e.g., after server restart)
 * Checks for any reminders that should have been sent but weren't
 */
export const processMissedReminders = async () => {
  console.log("[Scheduler] 🔍 Checking for missed reminders...");
  
  // This is essentially the same as processReminders
  // The idempotency key ensures we don't send duplicates
  // The reminder date calculation handles missed schedules
  return processReminders();
};

/**
 * Schedule cleanup of old notifications
 */
export const cleanupOldNotifications = async () => {
  console.log("[Scheduler] 🧹 Cleaning up old notifications...");
  
  try {
    // Delete notifications older than 90 days that are already dismissed
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    
    const result = await Notification.deleteMany({
      isDismissed: true,
      createdAt: { $lt: cutoff },
    });
    
    console.log(`[Scheduler] Cleaned up ${result.deletedCount} old notifications`);
    return result.deletedCount;
  } catch (error) {
    console.error("[Scheduler] Cleanup error:", error);
    return 0;
  }
};

/**
 * Initialize the scheduler
 * Call this from server.js after DB connection
 */
let schedulerInterval = null;
let cleanupInterval = null;

export const startScheduler = () => {
  // Process reminders every hour
  const REMINDER_INTERVAL = 60 * 60 * 1000; // 1 hour
  
  // Run immediately on start (catch any missed reminders)
  setTimeout(() => {
    processMissedReminders().catch(console.error);
  }, 5000); // 5 second delay after server start
  
  // Then run on interval
  schedulerInterval = setInterval(() => {
    processReminders().catch(console.error);
  }, REMINDER_INTERVAL);
  
  // Cleanup old notifications once a day
  const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
  cleanupInterval = setInterval(() => {
    cleanupOldNotifications().catch(console.error);
  }, CLEANUP_INTERVAL);
  
  console.log("[Scheduler] 🚀 Reminder scheduler started (runs every hour)");
};

export const stopScheduler = () => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
  console.log("[Scheduler] Scheduler stopped");
};

export default {
  processReminders,
  processMissedReminders,
  cleanupOldNotifications,
  startScheduler,
  stopScheduler,
};
