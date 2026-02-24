import mongoose from "mongoose";
import Receipt from "../models/Receipt.js";

export const getCustomerAnalytics = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const categoryBreakdown = await Receipt.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: "$category",
          totalSpent: { $sum: "$total" },
          count: { $sum: 1 },
        },
      },
    ]);

    const total = await Receipt.aggregate([
      { $match: { userId } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);

    res.json({
      totalSpent: total[0]?.total || 0,
      categories: categoryBreakdown.map((c) => ({
        category: c._id,
        totalSpent: c.totalSpent,
        count: c.count,
      })),
    });
  } catch (error) {
    console.error("getCustomerAnalytics error", error);
    res.status(500).json({ message: "Failed to load analytics" });
  }
};

export const getMerchantAnalytics = async (req, res) => {
  try {
    const merchantId = new mongoose.Types.ObjectId(req.user.id);

    const breakdown = await Receipt.aggregate([
      { $match: { merchantId } },
      {
        $group: {
          _id: "$category",
          totalSales: { $sum: "$total" },
          receipts: { $sum: 1 },
        },
      },
    ]);

    const total = await Receipt.aggregate([
      { $match: { merchantId } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);

    res.json({
      totalSales: total[0]?.total || 0,
      categories: breakdown.map((b) => ({
        category: b._id,
        totalSales: b.totalSales,
        receipts: b.receipts,
      })),
    });
  } catch (error) {
    console.error("getMerchantAnalytics error", error);
    res.status(500).json({ message: "Failed to load analytics" });
  }
};
