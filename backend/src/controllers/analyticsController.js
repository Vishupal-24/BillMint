import mongoose from "mongoose";
import Receipt from "../models/Receipt.js";
import {
  getISTDateRanges,
  getNowIST,
  formatISTDateTime,
  getISTCalendarParts,
  getDaysInISTMonth,
  getStartOfISTMonthMonthsAgo,
} from "../utils/timezone.js";

const IST_TIMEZONE = "Asia/Kolkata";

// In-memory cache (swap for Redis in production)
const analyticsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 min

const getCachedOrFetch = async (cacheKey, fetchFn) => {
  const cached = analyticsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const data = await fetchFn();
  analyticsCache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
};

// Invalidate cache after receipt creation
export const clearAnalyticsCache = (userId) => {
  analyticsCache.delete(`customer_${userId}`);
  analyticsCache.delete(`merchant_${userId}`);
};

// All date ranges are IST
const getDateRanges = () => {
  return getISTDateRanges();
};

export const getCustomerAnalytics = async (req, res) => {
  try {
    const cacheKey = `customer_${req.user.id}`;
    
    // Allow ?refresh=true to bypass cache
    const forceRefresh = req.query.refresh === 'true';
    if (forceRefresh) {
      analyticsCache.delete(cacheKey);
    }
    
    const analytics = await getCachedOrFetch(cacheKey, async () => {
      const userId = new mongoose.Types.ObjectId(req.user.id);
      const { startOfMonth, startOfLastMonth, endOfLastMonth, startOfYear, startOfWeek, startOfLastWeek, endOfLastWeek, now } = getDateRanges();

    const baseMatch = { 
      userId, 
      $or: [{ excludeFromStats: { $exists: false } }, { excludeFromStats: false }] 
    };

    // Parallel queries for performance
    const [
      totalAll,
      thisMonth,
      lastMonth,
      thisWeek,
      lastWeek,
      thisYear,
      categoryBreakdown,
      paymentMethodBreakdown,
      merchantBreakdown,
      dailySpending,
      monthlyTrend,
      recentReceipts,
      topItems,
    ] = await Promise.all([
      // Total all time
      Receipt.aggregate([
        { $match: baseMatch },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),

      // This month
      Receipt.aggregate([
        { $match: { ...baseMatch, transactionDate: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),

      // Last month
      Receipt.aggregate([
        { $match: { ...baseMatch, transactionDate: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),

      // This week
      Receipt.aggregate([
        { $match: { ...baseMatch, transactionDate: { $gte: startOfWeek } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),

      // Last week
      Receipt.aggregate([
        { $match: { ...baseMatch, transactionDate: { $gte: startOfLastWeek, $lte: endOfLastWeek } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),

      // This year
      Receipt.aggregate([
        { $match: { ...baseMatch, transactionDate: { $gte: startOfYear } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),

      // Category breakdown - falls back to merchant category
      Receipt.aggregate([
        { $match: { ...baseMatch, transactionDate: { $gte: startOfMonth } } },
        {
          $addFields: {
            // Prefer receipt category, fall back to merchant category
            resolvedCategory: {
              $cond: {
                if: { $and: [{ $ne: ["$category", null] }, { $ne: ["$category", ""] }, { $ne: ["$category", "general"] }] },
                then: "$category",
                else: { $ifNull: ["$merchantSnapshot.businessCategory", "general"] }
              }
            }
          }
        },
        {
          $group: {
            _id: "$resolvedCategory",
            totalSpent: { $sum: "$total" },
            count: { $sum: 1 },
            avgTransaction: { $avg: "$total" },
          },
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 10 },
      ]),

      // Payment methods
      Receipt.aggregate([
        { $match: { ...baseMatch, transactionDate: { $gte: startOfMonth } } },
        {
          $group: {
            _id: "$paymentMethod",
            total: { $sum: "$total" },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]),

      // Top merchants this month
      Receipt.aggregate([
        { $match: { ...baseMatch, transactionDate: { $gte: startOfMonth } } },
        {
          $group: {
            _id: {
              shopName: "$merchantSnapshot.shopName",
              businessCategory: "$merchantSnapshot.businessCategory",
            },
            totalSpent: { $sum: "$total" },
            count: { $sum: 1 },
            lastVisit: { $max: "$transactionDate" },
          },
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 5 },
      ]),

      // Daily spending (30 days)
      Receipt.aggregate([
        { 
          $match: { 
            ...baseMatch, 
            transactionDate: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } 
          } 
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$transactionDate", timezone: IST_TIMEZONE } },
            total: { $sum: "$total" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Monthly trend (6 months)
      Receipt.aggregate([
        { 
          $match: { 
            ...baseMatch, 
            transactionDate: { $gte: getStartOfISTMonthMonthsAgo(5, now) } 
          } 
        },
        {
          $group: {
            _id: { 
              year: { $year: { date: "$transactionDate", timezone: IST_TIMEZONE } }, 
              month: { $month: { date: "$transactionDate", timezone: IST_TIMEZONE } } 
            },
            total: { $sum: "$total" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      // Recent activity
      Receipt.find(baseMatch)
        .sort({ transactionDate: -1 })
        .limit(5)
        .select("merchantSnapshot.shopName merchantSnapshot.businessCategory total transactionDate category paymentMethod")
        .lean(),

      // Top items this month
      Receipt.aggregate([
        { $match: { ...baseMatch, transactionDate: { $gte: startOfMonth } } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.name",
            totalSpent: { $sum: { $multiply: ["$items.unitPrice", "$items.quantity"] } },
            totalQuantity: { $sum: "$items.quantity" },
            avgPrice: { $avg: "$items.unitPrice" },
          },
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 10 },
      ]),
    ]);

    // Calculate derived metrics
    const thisMonthTotal = thisMonth[0]?.total || 0;
    const lastMonthTotal = lastMonth[0]?.total || 0;
    const thisWeekTotal = thisWeek[0]?.total || 0;
    const lastWeekTotal = lastWeek[0]?.total || 0;
    const nowParts = getISTCalendarParts(now);
    const dayOfMonth = nowParts?.day || 1;
    const daysInMonth = getDaysInISTMonth(now);
    const avgPerDay = dayOfMonth > 0 ? Math.round(thisMonthTotal / dayOfMonth) : 0;
    
    // Period comparisons
    const monthOverMonthChange = lastMonthTotal > 0 
      ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100) 
      : 0;
    const weekOverWeekChange = lastWeekTotal > 0 
      ? Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100) 
      : 0;

    // Month-end projection
    const projectedMonthEnd = avgPerDay * daysInMonth;

    return {
      // Summary stats
      summary: {
        totalAllTime: totalAll[0]?.total || 0,
        totalReceiptsAllTime: totalAll[0]?.count || 0,
        thisMonth: {
          total: thisMonthTotal,
          count: thisMonth[0]?.count || 0,
          avgPerDay,
          projectedTotal: projectedMonthEnd,
        },
        lastMonth: {
          total: lastMonthTotal,
          count: lastMonth[0]?.count || 0,
        },
        thisWeek: {
          total: thisWeekTotal,
          count: thisWeek[0]?.count || 0,
        },
        lastWeek: {
          total: lastWeekTotal,
          count: lastWeek[0]?.count || 0,
        },
        thisYear: {
          total: thisYear[0]?.total || 0,
          count: thisYear[0]?.count || 0,
        },
        changes: {
          monthOverMonth: monthOverMonthChange,
          weekOverWeek: weekOverWeekChange,
        },
      },

      // Category breakdown
      categories: categoryBreakdown.map((c) => ({
        category: c._id || "Uncategorized",
        totalSpent: c.totalSpent,
        count: c.count,
        avgTransaction: Math.round(c.avgTransaction || 0),
        percentage: thisMonthTotal > 0 ? Math.round((c.totalSpent / thisMonthTotal) * 100) : 0,
      })),

      // Payment methods
      paymentMethods: paymentMethodBreakdown.map((p) => ({
        method: p._id || "other",
        total: p.total,
        count: p.count,
        percentage: thisMonthTotal > 0 ? Math.round((p.total / thisMonthTotal) * 100) : 0,
      })),

      // Top merchants
      topMerchants: merchantBreakdown.map((m) => ({
        name: m._id?.shopName || "Unknown",
        businessCategory: m._id?.businessCategory || "general",
        totalSpent: m.totalSpent,
        visits: m.count,
        lastVisit: m.lastVisit,
      })),

      // Spending trends
      trends: {
        daily: dailySpending.map((d) => ({
          date: d._id,
          total: d.total,
          count: d.count,
        })),
        monthly: monthlyTrend.map((m) => ({
          year: m._id.year,
          month: m._id.month,
          total: m.total,
          count: m.count,
        })),
      },

      // Recent activity
      recentActivity: recentReceipts.map((r) => ({
        merchant: r.merchantSnapshot?.shopName || "Unknown",
        businessCategory: r.merchantSnapshot?.businessCategory || r.category || "general",
        amount: r.total,
        date: r.transactionDate,
        category: r.category || r.merchantSnapshot?.businessCategory || "general",
        paymentMethod: r.paymentMethod,
      })),

      // Top items
      topItems: topItems.map((item) => ({
        name: item._id || "Unknown",
        totalSpent: Math.round(item.totalSpent),
        quantity: item.totalQuantity,
        avgPrice: Math.round(item.avgPrice || 0),
      })),

      // Insights metadata - ALL TIMESTAMPS IN IST
      meta: {
        generatedAt: formatISTDateTime(getNowIST()),
        periodStart: formatISTDateTime(startOfMonth),
        periodEnd: formatISTDateTime(now),
        timezone: "IST (UTC+05:30)",
      },
    };
    }); // End of getCachedOrFetch
    
    res.json(analytics);
  } catch (error) {
    console.error("getCustomerAnalytics error", error);
    res.status(500).json({ message: "Failed to load analytics" });
  }
};

export const getMerchantAnalytics = async (req, res) => {
  try {
    const cacheKey = `merchant_${req.user.id}`;
    
    // Allow ?refresh=true to bypass cache
    const forceRefresh = req.query.refresh === 'true';
    if (forceRefresh) {
      analyticsCache.delete(cacheKey);
    }
    
    const analytics = await getCachedOrFetch(cacheKey, async () => {
      const merchantId = new mongoose.Types.ObjectId(req.user.id);
      const { startOfMonth, startOfLastMonth, endOfLastMonth, startOfYear, startOfWeek, startOfLastWeek, endOfLastWeek, now } = getDateRanges();

      const baseMatch = { 
        merchantId, 
        $or: [{ excludeFromStats: { $exists: false } }, { excludeFromStats: false }] 
      };

    const [
      totalAll,
      thisMonth,
      lastMonth,
      thisWeek,
      lastWeek,
      thisYear,
      categoryBreakdown,
      paymentMethodBreakdown,
      dailySales,
      hourlySales,
      weekdaySales,
      topCustomers,
      topItems,
      recentReceipts,
      monthlyTrend,
    ] = await Promise.all([
      // Total all time
      Receipt.aggregate([
        { $match: baseMatch },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),

      // This month
      Receipt.aggregate([
        { $match: { ...baseMatch, transactionDate: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),

      // Last month
      Receipt.aggregate([
        { $match: { ...baseMatch, transactionDate: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),

      // This week
      Receipt.aggregate([
        { $match: { ...baseMatch, transactionDate: { $gte: startOfWeek } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),

      // Last week
      Receipt.aggregate([
        { $match: { ...baseMatch, transactionDate: { $gte: startOfLastWeek, $lte: endOfLastWeek } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),

      // This year
      Receipt.aggregate([
        { $match: { ...baseMatch, transactionDate: { $gte: startOfYear } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]),

      // Category breakdown
      Receipt.aggregate([
        { $match: { ...baseMatch, transactionDate: { $gte: startOfMonth } } },
        {
          $group: {
            _id: "$category",
            totalSales: { $sum: "$total" },
            receipts: { $sum: 1 },
          },
        },
        { $sort: { totalSales: -1 } },
      ]),

      // Payment methods
      Receipt.aggregate([
        { $match: { ...baseMatch, transactionDate: { $gte: startOfMonth } } },
        {
          $group: {
            _id: "$paymentMethod",
            total: { $sum: "$total" },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]),

      // Daily sales (last 30 days)
      Receipt.aggregate([
        { 
          $match: { 
            ...baseMatch, 
            transactionDate: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } 
          } 
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$transactionDate", timezone: IST_TIMEZONE } },
            total: { $sum: "$total" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Hourly sales distribution (for peak time analysis)
      Receipt.aggregate([
        { $match: { ...baseMatch, transactionDate: { $gte: startOfMonth } } },
        {
          $group: {
            _id: { $hour: { date: "$transactionDate", timezone: IST_TIMEZONE } },
            total: { $sum: "$total" },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),

      // Weekday sales distribution (for slowest day analysis)
      Receipt.aggregate([
        { $match: { ...baseMatch, transactionDate: { $gte: startOfMonth } } },
        {
          $group: {
            _id: { $dayOfWeek: { date: "$transactionDate", timezone: IST_TIMEZONE } }, // 1=Sunday, 2=Monday, etc.
            total: { $sum: "$total" },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: 1 } }, // Sort ascending to get slowest first
      ]),

      // Top customers
      Receipt.aggregate([
        { $match: { ...baseMatch, userId: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: "$userId",
            totalSpent: { $sum: "$total" },
            visits: { $sum: 1 },
            customerName: { $first: "$customerSnapshot.name" },
            lastVisit: { $max: "$transactionDate" },
          },
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 5 },
      ]),

      // Top selling items
      Receipt.aggregate([
        { $match: { ...baseMatch, transactionDate: { $gte: startOfMonth } } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.name",
            totalRevenue: { $sum: { $multiply: ["$items.unitPrice", "$items.quantity"] } },
            totalQuantity: { $sum: "$items.quantity" },
            avgPrice: { $avg: "$items.unitPrice" },
          },
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 },
      ]),

      // Recent receipts
      Receipt.find(baseMatch)
        .sort({ transactionDate: -1 })
        .limit(5)
        .select("total transactionDate category paymentMethod customerSnapshot items")
        .lean(),

      // Monthly trend (last 6 months)
      Receipt.aggregate([
        { 
          $match: { 
            ...baseMatch, 
            transactionDate: { $gte: getStartOfISTMonthMonthsAgo(5, now) } 
          } 
        },
        {
          $group: {
            _id: { 
              year: { $year: { date: "$transactionDate", timezone: IST_TIMEZONE } }, 
              month: { $month: { date: "$transactionDate", timezone: IST_TIMEZONE } } 
            },
            total: { $sum: "$total" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
    ]);

    // Calculate derived metrics
    const thisMonthTotal = thisMonth[0]?.total || 0;
    const lastMonthTotal = lastMonth[0]?.total || 0;
    const thisWeekTotal = thisWeek[0]?.total || 0;
    const lastWeekTotal = lastWeek[0]?.total || 0;
    const nowParts = getISTCalendarParts(now);
    const dayOfMonth = nowParts?.day || 1;
    const avgPerDay = dayOfMonth > 0 ? Math.round(thisMonthTotal / dayOfMonth) : 0;
    const totalReceiptsThisMonth = thisMonth[0]?.count || 0;

    const monthOverMonthChange = lastMonthTotal > 0 
      ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100) 
      : (thisMonthTotal > 0 ? 100 : 0);
    const weekOverWeekChange = lastWeekTotal > 0 
      ? Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100) 
      : (thisWeekTotal > 0 ? 100 : 0);

    // Format hour for display (IST format)
    const formatHour = (h) => {
      if (h === 0) return "12:00 AM";
      if (h === 12) return "12:00 PM";
      return h < 12 ? `${h}:00 AM` : `${h - 12}:00 PM`;
    };

    // Weekday names for display
    const weekdayNames = ["", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    // Peak hour analysis - ONLY from actual data, null if no sales
    // hourlySales is sorted by count DESC, so first item is peak
    const hasSalesData = totalReceiptsThisMonth > 0;
    const peakHourData = hourlySales.length > 0 ? hourlySales[0] : null;
    
    // Slowest/Busiest day analysis - ONLY from actual data
    // weekdaySales is sorted by count ASC, so first is slowest, last is busiest
    const slowestDayData = weekdaySales.length > 0 ? weekdaySales[0] : null;
    const busiestDayData = weekdaySales.length > 0 ? weekdaySales[weekdaySales.length - 1] : null;

    // Calculate time range with most/least sales for hourly distribution
    const getTimeRange = (hour) => {
      if (hour === null || hour === undefined) return null;
      const endHour = (hour + 1) % 24;
      return `${formatHour(hour)} - ${formatHour(endHour)}`;
    };

    // Calculate top item percentage for progress bars
    const maxItemQuantity = topItems[0]?.totalQuantity || 1;

    return {
      summary: {
        totalAllTime: totalAll[0]?.total || 0,
        totalReceiptsAllTime: totalAll[0]?.count || 0,
        thisMonth: {
          total: thisMonthTotal,
          count: thisMonth[0]?.count || 0,
          avgPerDay,
        },
        lastMonth: {
          total: lastMonthTotal,
          count: lastMonth[0]?.count || 0,
        },
        thisWeek: {
          total: thisWeekTotal,
          count: thisWeek[0]?.count || 0,
        },
        lastWeek: {
          total: lastWeekTotal,
          count: lastWeek[0]?.count || 0,
        },
        thisYear: {
          total: thisYear[0]?.total || 0,
          count: thisYear[0]?.count || 0,
        },
        changes: {
          monthOverMonth: monthOverMonthChange,
          weekOverWeek: weekOverWeekChange,
        },
      },

      // Insights - Only populated when actual data exists
      insights: {
        // Peak hour - null if no sales data exists
        peakHour: peakHourData ? {
          hour: peakHourData._id,
          formatted: formatHour(peakHourData._id),
          timeRange: getTimeRange(peakHourData._id),
          salesCount: peakHourData.count,
          totalRevenue: peakHourData.total,
        } : null,
        
        // Slowest day - null if no weekday sales distribution exists
        slowestDay: slowestDayData ? {
          dayOfWeek: slowestDayData._id,
          name: weekdayNames[slowestDayData._id] || "Unknown",
          salesCount: slowestDayData.count,
          totalRevenue: slowestDayData.total,
        } : null,
        
        // Busiest day - null if no weekday sales distribution exists
        busiestDay: busiestDayData ? {
          dayOfWeek: busiestDayData._id,
          name: weekdayNames[busiestDayData._id] || "Unknown",
          salesCount: busiestDayData.count,
          totalRevenue: busiestDayData.total,
        } : null,
        
        // Hourly distribution - only actual hours with sales
        hourlyDistribution: hourlySales.map((h) => ({
          hour: h._id,
          formatted: formatHour(h._id),
          timeRange: getTimeRange(h._id),
          count: h.count,
          total: h.total,
        })),
        
        // Weekday distribution - only actual days with sales
        weekdayDistribution: weekdaySales.map((w) => ({
          dayOfWeek: w._id,
          name: weekdayNames[w._id] || "Unknown",
          count: w.count,
          total: w.total,
        })),
        
        // Metadata about data sufficiency
        hasData: hasSalesData,
        dataPoints: {
          totalReceipts: totalReceiptsThisMonth,
          daysWithSales: weekdaySales.length,
          hoursWithSales: hourlySales.length,
        },
      },

      categories: categoryBreakdown.map((b) => ({
        category: b._id || "Uncategorized",
        totalSales: b.totalSales,
        receipts: b.receipts,
        percentage: thisMonthTotal > 0 ? Math.round((b.totalSales / thisMonthTotal) * 100) : 0,
      })),

      paymentMethods: paymentMethodBreakdown.map((p) => ({
        method: p._id || "other",
        total: p.total,
        count: p.count,
        percentage: thisMonthTotal > 0 ? Math.round((p.total / thisMonthTotal) * 100) : 0,
      })),

      dailySales: dailySales.map((d) => ({
        date: d._id,
        total: d.total,
        count: d.count,
      })),

      monthlyTrend: monthlyTrend.map((m) => ({
        year: m._id.year,
        month: m._id.month,
        total: m.total,
        count: m.count,
      })),

      topCustomers: topCustomers.map((c) => ({
        name: c.customerName || "Anonymous",
        totalSpent: c.totalSpent,
        visits: c.visits,
        lastVisit: c.lastVisit,
      })),

      topItems: topItems.map((item) => ({
        name: item._id || "Unknown",
        totalRevenue: Math.round(item.totalRevenue),
        quantity: item.totalQuantity,
        avgPrice: Math.round(item.avgPrice || 0),
        percentage: Math.round((item.totalQuantity / maxItemQuantity) * 100),
      })),

      recentActivity: recentReceipts.map((r) => ({
        customer: r.customerSnapshot?.name || "Walk-in",
        amount: r.total,
        date: r.transactionDate,
        category: r.category,
        paymentMethod: r.paymentMethod,
        itemCount: r.items?.length || 0,
      })),

      // Metadata - ALL TIMESTAMPS IN IST
      meta: {
        generatedAt: formatISTDateTime(getNowIST()),
        periodStart: formatISTDateTime(startOfMonth),
        periodEnd: formatISTDateTime(now),
        timezone: "IST (UTC+05:30)",
      },
    };
    }); // End of getCachedOrFetch
    
    res.json(analytics);
  } catch (error) {
    console.error("getMerchantAnalytics error", error);
    res.status(500).json({ message: "Failed to load analytics" });
  }
};
