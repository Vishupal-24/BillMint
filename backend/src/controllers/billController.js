import RecurringBill from "../models/RecurringBill.js";
import Notification from "../models/Notification.js";

/**
 * Recurring Bill Controller
 * 
 * WHY THIS APPROACH:
 * - All operations are scoped to the authenticated user
 * - Smart date calculations handle edge cases (month-end, timezones)
 * - Soft delete (status: 'deleted') preserves history
 * - Mark as paid skips reminders for the current cycle
 */

/**
 * Create a new recurring bill
 * POST /api/bills
 */
export const createBill = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      description,
      amount,
      currency,
      category,
      billCycle,
      dueDay,
      customIntervalDays,
      reminderOffsets,
      startDate,
      endDate,
      timezone,
      isAutoPay,
      notes,
    } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Bill name is required" });
    }

    if (!billCycle) {
      return res.status(400).json({ message: "Bill cycle is required" });
    }

    // Create start date (default to today if not provided)
    const parsedStartDate = startDate ? new Date(startDate) : new Date();
    if (isNaN(parsedStartDate.getTime())) {
      return res.status(400).json({ message: "Invalid start date" });
    }

    // Validate custom interval if cycle is custom
    if (billCycle === "custom" && (!customIntervalDays || customIntervalDays < 1)) {
      return res.status(400).json({ message: "Custom interval days required for custom cycle" });
    }

    // Create the bill
    const bill = new RecurringBill({
      userId,
      name: name.trim(),
      description: description?.trim() || "",
      amount: amount ? parseFloat(amount) : null,
      currency: currency || "INR",
      category: category || "other",
      billCycle,
      dueDay: dueDay ? parseInt(dueDay) : 1,
      customIntervalDays: customIntervalDays ? parseInt(customIntervalDays) : null,
      reminderOffsets: reminderOffsets || [3, 1],
      startDate: parsedStartDate,
      endDate: endDate ? new Date(endDate) : null,
      timezone: timezone || "Asia/Kolkata",
      isAutoPay: isAutoPay || false,
      notes: notes?.trim() || "",
      status: "active",
    });

    await bill.save();

    // Calculate next due date for response
    const nextDueDate = bill.calculateNextDueDate();

    res.status(201).json({
      message: "Recurring bill created successfully",
      bill: {
        ...bill.toObject(),
        nextDueDate,
      },
    });
  } catch (error) {
    console.error("[Bills] Create error:", error);
    res.status(500).json({ message: "Failed to create recurring bill" });
  }
};

/**
 * Get all recurring bills for the user
 * GET /api/bills
 */
export const getBills = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status = "active", category, page = 1, limit = 50 } = req.query;

    const query = { userId };
    
    // Filter by status (don't show deleted by default)
    if (status === "all") {
      query.status = { $ne: "deleted" };
    } else {
      query.status = status;
    }

    if (category) {
      query.category = category;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [bills, total] = await Promise.all([
      RecurringBill.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      RecurringBill.countDocuments(query),
    ]);

    // Add computed fields to each bill
    const billsWithDates = bills.map(bill => {
      const billDoc = new RecurringBill(bill);
      const nextDueDate = billDoc.calculateNextDueDate();
      const upcomingDueDates = billDoc.getUpcomingDueDates(3);
      
      // Calculate days until next due
      const now = new Date();
      const daysUntilDue = Math.ceil((nextDueDate - now) / (1000 * 60 * 60 * 24));
      
      return {
        ...bill,
        nextDueDate,
        upcomingDueDates,
        daysUntilDue,
        isOverdue: daysUntilDue < 0,
        isDueSoon: daysUntilDue >= 0 && daysUntilDue <= 3,
      };
    });

    res.json({
      bills: billsWithDates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("[Bills] Get error:", error);
    res.status(500).json({ message: "Failed to fetch recurring bills" });
  }
};

/**
 * Get a single recurring bill by ID
 * GET /api/bills/:id
 */
export const getBillById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const bill = await RecurringBill.findOne({ _id: id, userId });

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    const nextDueDate = bill.calculateNextDueDate();
    const upcomingDueDates = bill.getUpcomingDueDates(6);
    
    const now = new Date();
    const daysUntilDue = Math.ceil((nextDueDate - now) / (1000 * 60 * 60 * 24));

    res.json({
      bill: {
        ...bill.toObject(),
        nextDueDate,
        upcomingDueDates,
        daysUntilDue,
        isOverdue: daysUntilDue < 0,
        isDueSoon: daysUntilDue >= 0 && daysUntilDue <= 3,
      },
    });
  } catch (error) {
    console.error("[Bills] Get by ID error:", error);
    res.status(500).json({ message: "Failed to fetch bill" });
  }
};

/**
 * Update a recurring bill
 * PATCH /api/bills/:id
 */
export const updateBill = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updates = req.body;

    // Find the bill first
    const bill = await RecurringBill.findOne({ _id: id, userId });

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    if (bill.status === "deleted") {
      return res.status(400).json({ message: "Cannot update a deleted bill" });
    }

    // Allowed update fields
    const allowedFields = [
      "name",
      "description",
      "amount",
      "currency",
      "category",
      "billCycle",
      "dueDay",
      "customIntervalDays",
      "reminderOffsets",
      "startDate",
      "endDate",
      "timezone",
      "isAutoPay",
      "notes",
      "status",
    ];

    // Apply updates
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        if (field === "startDate" || field === "endDate") {
          bill[field] = updates[field] ? new Date(updates[field]) : null;
        } else if (field === "amount") {
          bill[field] = updates[field] ? parseFloat(updates[field]) : null;
        } else if (field === "dueDay" || field === "customIntervalDays") {
          bill[field] = updates[field] ? parseInt(updates[field]) : bill[field];
        } else {
          bill[field] = updates[field];
        }
      }
    }

    await bill.save();

    const nextDueDate = bill.calculateNextDueDate();

    res.json({
      message: "Bill updated successfully",
      bill: {
        ...bill.toObject(),
        nextDueDate,
      },
    });
  } catch (error) {
    console.error("[Bills] Update error:", error);
    res.status(500).json({ message: "Failed to update bill" });
  }
};

/**
 * Toggle bill status (pause/resume)
 * PATCH /api/bills/:id/status
 */
export const toggleBillStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "paused"].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Use 'active' or 'paused'" });
    }

    const bill = await RecurringBill.findOneAndUpdate(
      { _id: id, userId, status: { $ne: "deleted" } },
      { status },
      { new: true }
    );

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    res.json({
      message: `Bill ${status === "active" ? "resumed" : "paused"} successfully`,
      bill,
    });
  } catch (error) {
    console.error("[Bills] Toggle status error:", error);
    res.status(500).json({ message: "Failed to update bill status" });
  }
};

/**
 * Mark bill as paid for current cycle
 * POST /api/bills/:id/mark-paid
 */
export const markBillPaid = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const bill = await RecurringBill.findOne({ _id: id, userId });

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    // Calculate next due date and set markedPaidUntil to skip reminders
    const nextDueDate = bill.calculateNextDueDate();
    
    // Set paid until the day after due date (so reminders for this cycle are skipped)
    const paidUntil = new Date(nextDueDate);
    paidUntil.setDate(paidUntil.getDate() + 1);
    
    bill.markedPaidUntil = paidUntil;
    await bill.save();

    res.json({
      message: "Bill marked as paid for this cycle",
      bill: {
        ...bill.toObject(),
        nextDueDate: bill.calculateNextDueDate(paidUntil), // Next cycle's due date
      },
    });
  } catch (error) {
    console.error("[Bills] Mark paid error:", error);
    res.status(500).json({ message: "Failed to mark bill as paid" });
  }
};

/**
 * Delete a recurring bill (soft delete)
 * DELETE /api/bills/:id
 */
export const deleteBill = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { permanent = false } = req.query;

    if (permanent === "true" || permanent === true) {
      // Hard delete
      const result = await RecurringBill.deleteOne({ _id: id, userId });
      
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: "Bill not found" });
      }

      // Also delete related notifications
      await Notification.deleteMany({ 
        sourceType: "recurring_bill", 
        sourceId: id 
      });

      return res.json({ message: "Bill permanently deleted" });
    }

    // Soft delete
    const bill = await RecurringBill.findOneAndUpdate(
      { _id: id, userId },
      { status: "deleted" },
      { new: true }
    );

    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }

    res.json({ message: "Bill deleted successfully" });
  } catch (error) {
    console.error("[Bills] Delete error:", error);
    res.status(500).json({ message: "Failed to delete bill" });
  }
};

/**
 * Get upcoming bills summary (for dashboard widget)
 * GET /api/bills/upcoming
 */
export const getUpcomingBills = async (req, res) => {
  try {
    const userId = req.user.id;
    const { days = 7 } = req.query;

    const bills = await RecurringBill.find({
      userId,
      status: "active",
    }).lean();

    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + parseInt(days));

    // Filter and sort by next due date
    const upcomingBills = bills
      .map(bill => {
        const billDoc = new RecurringBill(bill);
        const nextDueDate = billDoc.calculateNextDueDate();
        const daysUntilDue = Math.ceil((nextDueDate - now) / (1000 * 60 * 60 * 24));
        
        return {
          ...bill,
          nextDueDate,
          daysUntilDue,
          isOverdue: daysUntilDue < 0,
          isDueSoon: daysUntilDue >= 0 && daysUntilDue <= 3,
          isPaidThisCycle: bill.markedPaidUntil && new Date(bill.markedPaidUntil) > now,
        };
      })
      .filter(bill => {
        // Include bills due within the specified days, or overdue
        return bill.nextDueDate <= cutoff || bill.isOverdue;
      })
      .sort((a, b) => a.nextDueDate - b.nextDueDate);

    // Summary stats
    const totalAmount = upcomingBills.reduce((sum, bill) => sum + (bill.amount || 0), 0);
    const overdueCount = upcomingBills.filter(b => b.isOverdue && !b.isPaidThisCycle).length;
    const dueSoonCount = upcomingBills.filter(b => b.isDueSoon && !b.isPaidThisCycle).length;

    res.json({
      bills: upcomingBills,
      summary: {
        totalBills: upcomingBills.length,
        totalAmount,
        overdueCount,
        dueSoonCount,
        currency: upcomingBills[0]?.currency || "INR",
      },
    });
  } catch (error) {
    console.error("[Bills] Upcoming error:", error);
    res.status(500).json({ message: "Failed to fetch upcoming bills" });
  }
};

/**
 * Get bill categories with counts
 * GET /api/bills/categories
 */
export const getBillCategories = async (req, res) => {
  try {
    const userId = req.user.id;

    const categories = await RecurringBill.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), status: { $ne: "deleted" } } },
      { $group: { _id: "$category", count: { $sum: 1 }, totalAmount: { $sum: "$amount" } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      categories: categories.map(c => ({
        name: c._id,
        count: c.count,
        totalAmount: c.totalAmount || 0,
      })),
    });
  } catch (error) {
    console.error("[Bills] Categories error:", error);
    res.status(500).json({ message: "Failed to fetch bill categories" });
  }
};

// Need to import mongoose for ObjectId in aggregation
import mongoose from "mongoose";
