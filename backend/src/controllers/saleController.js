const Sale = require("../models/Sale");
const Property = require("../models/Property");
const Unit = require("../models/Unit");

// Helper function to pick allowed properties from an object
function pick(obj, keys) {
  const out = {};
  if (!obj) return out;
  keys.forEach((k) => {
    // Check for null and undefined
    if (obj[k] !== undefined && obj[k] !== null) out[k] = obj[k];
  });
  return out;
}

async function createSale(req, res, next) {
  try {
    const b = req.body || {};

    // --- Validation & Unit Check ---
    const unit = await Unit.findById(b.unitId).populate("property");
    if (!unit)
      return res.status(400).json({ message: "Invalid unit selected" }); // More specific message
    if (unit.status !== "available")
      return res
        .status(400)
        .json({ message: `Unit ${unit.unitNumber} is not available for sale` }); // More specific message

    const property = unit.property;
    if (!property)
      return res
        .status(400)
        .json({ message: "Property associated with unit not found" });

    // --- FIX: Robust Date Parsing ---
    let saleDateObj = b.saleDate ? new Date(b.saleDate) : new Date(); // Default to now if empty
    let closingDateObj = b.closingDate ? new Date(b.closingDate) : undefined;

    // Check if dates are valid after parsing
    if (isNaN(saleDateObj.getTime())) {
      return res
        .status(400)
        .json({ message: "Invalid Sale Date format. Please use YYYY-MM-DD." });
    }
    if (closingDateObj && isNaN(closingDateObj.getTime())) {
      return res
        .status(400)
        .json({
          message: "Invalid Closing Date format. Please use YYYY-MM-DD.",
        });
    }
    // --- End of Date Fix ---

    const sale = new Sale({
      propertyId: property._id,
      unitId: unit._id,
      propertyName: property.propertyName,
      unitNumber: unit.unitNumber,
      propertyLocation:
        property.location ||
        [property.city, property.province].filter(Boolean).join(", "),
      buyerName: b.buyerName,
      buyerEmail: b.buyerEmail,
      buyerPhone: b.buyerPhone,
      salePrice: Number(b.salePrice),
      saleDate: saleDateObj, // Use the validated Date object
      closingDate: closingDateObj, // Use the validated Date object (or undefined)
      status: b.status || (closingDateObj ? "closed" : "pending"), // Determine status based on valid closingDateObj
      financingType: b.financingType || "cash",
      agentName: b.agentName,
      agentEmail: b.agentEmail,
      agentPhone: b.agentPhone,
      commissionRate: b.commissionRate ? Number(b.commissionRate) : undefined,
      notes: b.notes,
      source: b.source,
    });

    await sale.save(); // This triggers the pre-save hook

    // Update Unit status
    unit.status = "sold";
    unit.soldDate = closingDateObj || saleDateObj; // Use the valid date objects
    await unit.save();

    res.status(201).json(sale);
  } catch (e) {
    console.error("Error in createSale:", e); // Log the detailed error on the backend
    next(e); // Pass to error handler (results in 500)
  }
}

async function listSales(req, res, next) {
  try {
    const {
      buyer,
      agentName,
      financingType,
      propertyId,
      unitId,
      status,
      dateFrom,
      dateTo,
      closingDateFrom,
      closingDateTo,
      limit,
      page,
    } = req.query;

    const q = { softDeleted: false };
    if (buyer) q.buyerName = new RegExp(buyer, "i");
    if (agentName) q.agentName = new RegExp(agentName, "i");
    if (financingType) q.financingType = financingType;
    if (propertyId) q.propertyId = propertyId;
    if (unitId) q.unitId = unitId;
    if (status) q.status = status;

    if (dateFrom || dateTo) {
      q.saleDate = {};
      if (dateFrom) q.saleDate.$gte = new Date(dateFrom);
      if (dateTo) q.saleDate.$lte = new Date(dateTo);
    }
    if (closingDateFrom || closingDateTo) {
      q.closingDate = {};
      if (closingDateFrom) q.closingDate.$gte = new Date(closingDateFrom);
      if (closingDateTo) q.closingDate.$lte = new Date(closingDateTo);
    }

    const perPage = Math.min(Number(limit) || 50, 100);
    const skip = Math.max(((Number(page) || 1) - 1) * perPage, 0);

    const dataQuery = Sale.find(q)
      .populate("unitId", "unitNumber")
      .sort({ saleDate: -1 })
      .skip(skip)
      .limit(perPage);

    const countQuery = Sale.countDocuments(q);

    const aggQuery = Sale.aggregate([
      { $match: q },
      {
        $group: {
          _id: null,
          sum: { $sum: "$salePrice" },
          avg: { $avg: "$salePrice" },
          commissionSum: { $sum: "$commissionAmount" },
        },
      },
    ]);

    const [data, total, agg] = await Promise.all([
      dataQuery,
      countQuery,
      aggQuery,
    ]);

    const totalRevenue = agg[0]?.sum || 0;
    const avgSalePrice = agg[0]?.avg || 0;
    const totalCommission = agg[0]?.commissionSum || 0;

    res.json({
      data,
      total,
      totalRevenue,
      avgSalePrice,
      totalCommission,
      page: Number(page) || 1,
      limit: perPage,
    });
  } catch (e) {
    console.error("Error in listSales:", e);
    next(e);
  }
}

async function getSale(req, res, next) {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate("propertyId", "propertyName city province")
      .populate("unitId", "unitNumber specifications");

    if (!sale || sale.softDeleted)
      return res.status(404).json({ message: "Not found" });
    res.json(sale);
  } catch (e) {
    next(e);
  }
}

async function updateSale(req, res, next) {
  try {
    const body = req.body || {};
    const sale = await Sale.findById(req.params.id);
    if (!sale || sale.softDeleted)
      return res.status(404).json({ message: "Not found" });

    const allowed = [
      "buyerName",
      "buyerEmail",
      "buyerPhone",
      "salePrice",
      "saleDate",
      "closingDate",
      "status",
      "financingType",
      "agentName",
      "agentEmail",
      "agentPhone",
      "commissionRate",
      "notes",
      "source",
    ];
    const patch = pick(body, allowed);

    if (patch.saleDate) patch.saleDate = new Date(patch.saleDate);
    if (patch.closingDate) patch.closingDate = new Date(patch.closingDate);
    if (patch.salePrice) patch.salePrice = Number(patch.salePrice);
    if (patch.commissionRate)
      patch.commissionRate = Number(patch.commissionRate);

    Object.assign(sale, patch);

    if (patch.status) {
      const unit = await Unit.findById(sale.unitId);
      if (unit) {
        if (patch.status === "closed" || patch.status === "pending") {
          unit.status = "sold";
          unit.soldDate = sale.closingDate || sale.saleDate;
        } else if (patch.status === "cancelled") {
          unit.status = "available";
          unit.soldDate = null;
        }
        await unit.save();
      }
    }

    await sale.save();
    res.json(sale);
  } catch (e) {
    next(e);
  }
}

async function deleteSale(req, res, next) {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale || sale.softDeleted)
      return res.status(404).json({ message: "Not found" });

    sale.softDeleted = true;
    await sale.save();
    // Ensure deleteSale is exported
    // Revert the unit status to available
    const unit = await Unit.findById(sale.unitId);
    if (unit && unit.status === "sold") {
      // Check if it was sold
      unit.status = "available";
      unit.soldDate = null;
      await unit.save();
      console.log(`Unit ${unit._id} marked as available due to sale deletion.`);
    }

    res.json({ message: "Deleted" });
  } catch (e) {
    console.error("Error in deleteSale:", e);
    next(e);
  }
}

module.exports = {
  createSale,
  listSales,
  getSale,
  updateSale,
  deleteSale,
};
