const Property = require("../models/Property");
const Sale = require("../models/Sale");
const Inquiry = require("../models/Inquiry");
const Unit = require("../models/Unit");

let Parser;
try {
  ({ Parser } = require("json2csv"));
} catch {
  /* ... error handling ... */
}

function sendCsv(res, rows, filename) {
  /* ... same as before ... */
}

async function salesCsv(req, res, next) {
  try {
    const sales = await Sale.find({ softDeleted: false })
      .populate("propertyId", "propertyName city province")
      .populate("unitId", "unitNumber")
      .sort({ saleDate: -1 })
      .lean();

    const flattenedSales = sales.map((sale) => ({
      saleId: sale._id,
      saleDate: sale.saleDate ? sale.saleDate.toISOString().split("T")[0] : "",
      closingDate: sale.closingDate
        ? sale.closingDate.toISOString().split("T")[0]
        : "",
      status: sale.status,
      propertyName: sale.propertyId?.propertyName || sale.propertyName,
      unitNumber: sale.unitId?.unitNumber || sale.unitNumber,
      location: sale.propertyId
        ? `${sale.propertyId.city || ""}, ${
            sale.propertyId.province || ""
          }`.replace(/^, |, $/g, "")
        : sale.propertyLocation,
      buyerName: sale.buyerName,
      buyerEmail: sale.buyerEmail,
      buyerPhone: sale.buyerPhone,
      salePrice: sale.salePrice,
      financingType: sale.financingType,
      agentName: sale.agentName,
      agentEmail: sale.agentEmail,
      agentPhone: sale.agentPhone,
      commissionRate: sale.commissionRate,
      commissionAmount: sale.commissionAmount,
      source: sale.source,
      notes: sale.notes,
      createdAt: sale.createdAt
        ? sale.createdAt.toISOString().split("T")[0]
        : "",
    }));
    sendCsv(res, flattenedSales, `sales_report_${Date.now()}.csv`);
  } catch (e) {
    next(e);
  }
}

// Reports on BUILDINGS, includes unit counts
async function propertiesCsv(req, res, next) {
  try {
    // Get unit counts per property
    const unitCounts = await Unit.aggregate([
      {
        $group: {
          _id: "$property",
          totalUnits: { $sum: 1 },
          availableUnits: {
            $sum: { $cond: [{ $eq: ["$status", "available"] }, 1, 0] },
          },
        },
      },
    ]);
    const unitMap = new Map(unitCounts.map((u) => [String(u._id), u]));

    const props = await Property.find({})
      .select("-photos -videoTours -siteMap") // Exclude large/complex fields
      .sort({ createdAt: -1 })
      .lean();

    // Merge unit counts
    const mergedProps = props.map((p) => {
      const units = unitMap.get(String(p._id));
      return {
        ...p,
        totalUnits: units?.totalUnits || 0,
        availableUnits: units?.availableUnits || 0,
      };
    });

    sendCsv(res, mergedProps, `property_buildings_report_${Date.now()}.csv`);
  } catch (e) {
    next(e);
  }
}

// Report for individual Units
async function unitsCsv(req, res, next) {
  try {
    const units = await Unit.find({})
      .populate("property", "propertyName city province")
      .sort({ "property.propertyName": 1, unitNumber: 1 }) // Sort by property then unit
      .lean();

    const flattenedUnits = units.map((unit) => ({
      unitId: unit._id,
      propertyName: unit.property?.propertyName,
      unitNumber: unit.unitNumber,
      location: unit.property
        ? `${unit.property.city || ""}, ${
            unit.property.province || ""
          }`.replace(/^, |, $/g, "")
        : "",
      status: unit.status,
      price: unit.price,
      bedrooms: unit.specifications?.bedrooms,
      bathrooms: unit.specifications?.bathrooms,
      floorAreaSqm: unit.specifications?.floorArea,
      lotAreaSqm: unit.specifications?.lotArea,
      parking: unit.specifications?.parking,
      yearBuilt: unit.specifications?.yearBuilt,
      soldDate: unit.soldDate ? unit.soldDate.toISOString().split("T")[0] : "",
      createdAt: unit.createdAt
        ? unit.createdAt.toISOString().split("T")[0]
        : "",
    }));
    sendCsv(res, flattenedUnits, `units_report_${Date.now()}.csv`);
  } catch (e) {
    next(e);
  }
}

async function inquiriesCsv(req, res, next) {
  try {
    const list = await Inquiry.find({})
      .populate("propertyId", "propertyName")
      .sort({ createdAt: -1 })
      .lean();

    const flattenedInquiries = list.map((inq) => ({
      inquiryId: inq._id,
      date: inq.createdAt ? inq.createdAt.toISOString().split("T")[0] : "",
      status: inq.status,
      firstName: inq.firstName,
      lastName: inq.lastName,
      email: inq.customerEmail,
      phone: inq.customerPhone,
      propertyName: inq.propertyId?.propertyName || inq.propertyName,
      message: (inq.message || "").replace(/[\r\n]+/g, " "), // Clean up message for CSV
      preferredDate: inq.preferredViewingDate
        ? inq.preferredViewingDate.toISOString().split("T")[0]
        : "",
      preferredTime: inq.preferredViewingTime,
      scheduledDate: inq.scheduledViewingDate
        ? inq.scheduledViewingDate.toISOString().split("T")[0]
        : "",
      scheduledTime: inq.scheduledViewingTime,
      viewingAgent: inq.viewingAgentName,
      handledByName: inq.handledByName,
      handledAt: inq.handledAt ? inq.handledAt.toISOString().split("T")[0] : "",
    }));
    sendCsv(res, flattenedInquiries, `inquiries_report_${Date.now()}.csv`);
  } catch (e) {
    next(e);
  }
}

// --- NEW: Agent Performance Report ---
async function agentPerformanceCsv(req, res, next) {
  try {
    // Re-use aggregation logic from analytics controller
    const { dateFrom, dateTo, status = "closed" } = req.query;
    const matchQuery = {
      softDeleted: false,
      status: status,
      agentName: { $exists: true, $ne: null, $ne: "" },
    };
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
          _id: "$agentName",
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: "$salePrice" },
          avgSalePrice: { $avg: "$salePrice" },
          totalCommission: { $sum: "$commissionAmount" },
        },
      },
      { $sort: { totalRevenue: -1 } },
      {
        $project: {
          _id: 0,
          agentName: "$_id",
          totalSales: 1,
          totalRevenue: 1,
          avgSalePrice: 1,
          totalCommission: 1,
        },
      },
    ]);
    sendCsv(
      res,
      performance,
      `agent_performance_report_${status}_${Date.now()}.csv`
    );
  } catch (e) {
    next(e);
  }
}
// --- END NEW ---

module.exports = {
  salesCsv,
  propertiesCsv,
  unitsCsv,
  inquiriesCsv,
  agentPerformanceCsv, // Export new function
};
