const Property = require("../models/Property");
const Sale = require("../models/Sale");
const Inquiry = require("../models/Inquiry");
const Unit = require("../models/Unit");
const AnalyticsSnapshot = require("../models/AnalyticsSnapshot");
const mongoose = require("mongoose");

// --- Dashboard ---
// Provides a current snapshot of key metrics.
async function dashboard(req, res, next) {
  try {
    const [
      buildingCount,
      unitCounts, // Get counts for different unit statuses in one go
      closedSalesAgg, // Aggregate only CLOSED sales
      pendingInquiriesCount,
      totalInquiriesCount,
    ] = await Promise.all([
      Property.countDocuments({}),
      Unit.aggregate([
        // More efficient way to get multiple status counts
        {
          $group: {
            _id: "$status", // Group by status
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            // Group again to consolidate results
            _id: null,
            totalUnits: { $sum: "$count" }, // Sum all counts for total
            statuses: { $push: { status: "$_id", count: "$count" } }, // Push status/count pairs
          },
        },
      ]),
      Sale.aggregate([
        { $match: { softDeleted: false, status: "closed" } }, // Only closed sales
        {
          $group: {
            _id: null,
            totalSales: { $sum: 1 },
            totalRevenue: { $sum: "$salePrice" },
            avgSalePrice: { $avg: "$salePrice" },
            totalCommission: { $sum: "$commissionAmount" },
          },
        },
      ]),
      Inquiry.countDocuments({
        status: { $nin: ["closed", "cancelled", "archived", "handled"] },
      }), // Refined pending status definition
      Inquiry.countDocuments({}),
    ]);

    // Process Unit Counts
    const unitStatusMap = new Map(
      unitCounts[0]?.statuses.map((item) => [item.status, item.count]) || []
    );
    const totalUnits = unitCounts[0]?.totalUnits || 0;
    const availableUnits = unitStatusMap.get("available") || 0;
    const soldUnits = unitStatusMap.get("sold") || 0;
    const rentedUnits = unitStatusMap.get("rented") || 0;

    // Process Sales Aggregation
    const salesData = closedSalesAgg[0] || {};
    const totalSales = salesData.totalSales || 0;
    const totalRevenue = salesData.totalRevenue || 0;
    const avgSalePrice = salesData.avgSalePrice || 0;
    const totalCommission = salesData.totalCommission || 0;

    res.json({
      buildingCount,
      totalUnits,
      availableUnits,
      soldUnits,
      rentedUnits,
      totalClosedSales: totalSales, // Clarified name
      totalClosedRevenue: totalRevenue, // Clarified name
      avgClosedSalePrice: avgSalePrice, // Clarified name
      totalCommissionPaid: totalCommission, // Clarified name
      pendingInquiries: pendingInquiriesCount,
      totalInquiries: totalInquiriesCount,
    });
  } catch (e) {
    next(e);
  }
}

// --- Sales Trends ---
// Shows sales count and total revenue grouped by month, quarter, or year.
async function salesTrends(req, res, next) {
  try {
    const {
      period = "monthly",
      year = new Date().getFullYear(),
      dateField = "closingDate",
      status = "closed",
    } = req.query;
    const dateFieldName =
      dateField === "saleDate" ? "$saleDate" : "$closingDate"; // Use closingDate by default for revenue recognition

    const matchQuery = {
      softDeleted: false,
      status: status, // Filter by status (default 'closed')
      // Date filter set below based on year or dateFrom/dateTo
    };

    // Allow explicit date range slicing via dateFrom/dateTo (overrides year)
    const dateKey = dateField === "saleDate" ? "saleDate" : "closingDate";
    const { dateFrom, dateTo } = req.query;
    if (dateFrom || dateTo) {
      matchQuery[dateKey] = {};
      if (dateFrom) matchQuery[dateKey].$gte = new Date(dateFrom);
      if (dateTo) matchQuery[dateKey].$lte = new Date(dateTo);
    } else {
      // Default to entire year if no explicit range provided
      matchQuery[dateKey] = {
        $gte: new Date(`${year}-01-01T00:00:00.000Z`),
        $lte: new Date(`${year}-12-31T23:59:59.999Z`),
      };
    }

    let groupBy;
    let sortOrder = { "_id.year": 1 }; // Default sort

    switch (period) {
      case "yearly":
        groupBy = { _id: { year: { $year: dateFieldName } } };
        sortOrder = { "_id.year": 1 };
        break;
      case "quarterly":
        groupBy = {
          _id: {
            year: { $year: dateFieldName },
            quarter: { $ceil: { $divide: [{ $month: dateFieldName }, 3] } },
          },
        };
        sortOrder = { "_id.year": 1, "_id.quarter": 1 };
        break;
      case "monthly":
      default:
        groupBy = {
          _id: {
            year: { $year: dateFieldName },
            month: { $month: dateFieldName },
          },
        };
        sortOrder = { "_id.year": 1, "_id.month": 1 };
        break;
    }

    const trends = await Sale.aggregate([
      { $match: matchQuery },
      {
        $group: {
          ...groupBy, // Dynamic grouping based on period
          totalRevenue: { $sum: "$salePrice" },
          count: { $sum: 1 },
        },
      },
      { $sort: sortOrder },
    ]);

    // Format results consistently
    const formattedTrends = trends.map((item) => ({
      year: item._id.year,
      month: item._id.month, // Will be undefined if yearly/quarterly
      quarter: item._id.quarter, // Will be undefined if yearly/monthly
      totalRevenue: item.totalRevenue,
      count: item.count,
    }));

    res.json({
      period,
      year,
      dateFieldUsed: dateFieldName,
      statusUsed: status,
      trends: formattedTrends,
    });
  } catch (e) {
    next(e);
  }
}

// --- Property (Building) Performance ---
// Aggregates sales and unit data per Property (Building).
async function propertyPerformance(req, res, next) {
  try {
    const { dateFrom, dateTo } = req.query;
    const salesDateField =
      req.query.dateField === "saleDate" ? "saleDate" : "closingDate";

    // 1. Aggregated Unit Counts per Property
    const unitCountsAgg = Unit.aggregate([
      {
        $group: {
          _id: "$property", // Group by the parent property ID
          totalUnits: { $sum: 1 },
          availableUnits: {
            $sum: { $cond: [{ $eq: ["$status", "available"] }, 1, 0] },
          },
          soldUnits: { $sum: { $cond: [{ $eq: ["$status", "sold"] }, 1, 0] } },
          rentedUnits: {
            $sum: { $cond: [{ $eq: ["$status", "rented"] }, 1, 0] },
          },
        },
      },
    ]);

    // 2. Aggregated CLOSED Sales Stats per Property
    const salesMatch = { softDeleted: false, status: "closed" };
    if (dateFrom || dateTo) {
      salesMatch[salesDateField] = {};
      if (dateFrom) salesMatch[salesDateField].$gte = new Date(dateFrom);
      if (dateTo) salesMatch[salesDateField].$lte = new Date(dateTo);
    }

    const salesStatsAgg = Sale.aggregate([
      { $match: salesMatch },
      {
        $group: {
          _id: "$propertyId",
          totalClosedSales: { $sum: 1 },
          totalClosedRevenue: { $sum: "$salePrice" },
          avgClosedSalePrice: { $avg: "$salePrice" },
          totalCommissionPaid: { $sum: "$commissionAmount" },
        },
      },
    ]);

    // 3. Get Property Details
    const propertiesQuery = Property.find({})
      .select("propertyName city province createdAt")
      .lean();

    // Execute in parallel
    const [unitCounts, salesStats, properties] = await Promise.all([
      unitCountsAgg,
      salesStatsAgg,
      propertiesQuery,
    ]);

    // Create maps for efficient merging
    const unitMap = new Map(unitCounts.map((u) => [String(u._id), u]));
    const salesMap = new Map(salesStats.map((s) => [String(s._id), s]));

    // 4. Merge results
    const performanceData = properties
      .map((p) => {
        const pIdStr = String(p._id);
        const units = unitMap.get(pIdStr) || {};
        const sales = salesMap.get(pIdStr) || {};
        return {
          propertyId: p._id,
          propertyName: p.propertyName,
          location: `${p.city || ""}, ${p.province || ""}`,
          createdAt: p.createdAt,
          totalUnits: units.totalUnits || 0,
          availableUnits: units.availableUnits || 0,
          soldUnits: units.soldUnits || 0,
          rentedUnits: units.rentedUnits || 0,
          totalClosedSales: sales.totalClosedSales || 0,
          totalClosedRevenue: sales.totalClosedRevenue || 0,
          avgClosedSalePrice: sales.avgClosedSalePrice || 0,
          totalCommissionPaid: sales.totalCommissionPaid || 0,
        };
      })
      .sort((a, b) => b.totalClosedRevenue - a.totalClosedRevenue); // Sort by revenue

    res.json(performanceData);
  } catch (e) {
    next(e);
  }
}

// --- Agent Performance ---
// Aggregates sales performance by agent name.
async function agentPerformance(req, res, next) {
  try {
    const { dateFrom, dateTo, status = "closed" } = req.query; // Default to closed sales

    const matchQuery = {
      softDeleted: false,
      status: status,
      agentName: { $exists: true, $ne: null, $ne: "" }, // Only include sales with an agent name
    };

    // Add date filters (using closingDate by default)
    const dateField =
      req.query.dateField === "saleDate" ? "saleDate" : "closingDate";
    if (dateFrom || dateTo) {
      matchQuery[dateField] = {};
      if (dateFrom) matchQuery[dateField].$gte = new Date(dateFrom);
      if (dateTo) matchQuery[dateField].$lte = new Date(dateTo);
    }

    const performance = await Sale.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$agentName", // Group by agent name
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: "$salePrice" },
          avgSalePrice: { $avg: "$salePrice" },
          totalCommission: { $sum: "$commissionAmount" },
        },
      },
      { $sort: { totalRevenue: -1 } }, // Sort by revenue
      {
        $project: {
          // Rename _id to agentName for clarity
          _id: 0,
          agentName: "$_id",
          totalSales: 1,
          totalRevenue: 1,
          avgSalePrice: 1,
          totalCommission: 1,
        },
      },
    ]);

    res.json(performance);
  } catch (e) {
    next(e);
  }
}

// --- Snapshot Functions ---
async function createSnapshot(req, res, next) {
  try {
    // This could potentially calculate metrics for a specific period (e.g., previous month)
    // For simplicity, it mirrors the current dashboard logic.
    const [buildingCount, unitCounts, closedSalesAgg, pendingInquiriesCount] =
      await Promise.all([
        /* ... same queries as dashboard ... */ Property.countDocuments({}),
        Unit.aggregate([
          { $group: { _id: "$status", count: { $sum: 1 } } },
          {
            $group: {
              _id: null,
              totalUnits: { $sum: "$count" },
              statuses: { $push: { status: "$_id", count: "$count" } },
            },
          },
        ]),
        Sale.aggregate([
          { $match: { softDeleted: false, status: "closed" } },
          {
            $group: {
              _id: null,
              totalSales: { $sum: 1 },
              totalRevenue: { $sum: "$salePrice" },
              avgSalePrice: { $avg: "$salePrice" },
              totalCommission: { $sum: "$commissionAmount" },
            },
          },
        ]),
        Inquiry.countDocuments({
          status: { $nin: ["closed", "cancelled", "archived", "handled"] },
        }),
      ]);

    const unitStatusMap = new Map(
      unitCounts[0]?.statuses.map((item) => [item.status, item.count]) || []
    );
    const salesData = closedSalesAgg[0] || {};

    const doc = await AnalyticsSnapshot.create({
      period: req.body?.period || "monthly",
      metrics: {
        totalBuildings: buildingCount,
        totalUnits: unitCounts[0]?.totalUnits || 0,
        availableUnits: unitStatusMap.get("available") || 0,
        soldUnits: unitStatusMap.get("sold") || 0,
        rentedUnits: unitStatusMap.get("rented") || 0,
        closedSalesCount: salesData.totalSales || 0,
        closedSalesRevenue: salesData.totalRevenue || 0,
        closedSalesAvgPrice: salesData.avgSalePrice || 0,
        totalCommissionPaid: salesData.totalCommission || 0,
        pendingInquiries: pendingInquiriesCount,
        // Could add 'newInquiries' if calculated based on createdAt date range
      },
    });
    res.status(201).json(doc);
  } catch (e) {
    next(e);
  }
}

async function listSnapshots(req, res, next) {
  try {
    const q = {};
    if (req.query.period) q.period = req.query.period;
    const data = await AnalyticsSnapshot.find(q)
      .sort({ snapshotDate: -1 })
      .limit(100);
    res.json(data);
  } catch (e) {
    next(e);
  }
}

module.exports = {
  dashboard,
  salesTrends,
  propertyPerformance, // Renamed from propertyStats
  agentPerformance, // Added
  createSnapshot,
  listSnapshots,
};
