const Unit = require("../models/Unit");
const Property = require("../models/Property");
const { isYouTubeUrl } = require("../utils/validate");
const { uploadBuffer } = require("../configs/cloudinary");
const { pick, ensureArrayStrings } = require("../utils/helpers");

// Create a new Unit for a specific Property
async function createUnit(req, res, next) {
  try {
    const b = req.body || {};
    const { propertyId } = req.params; // Get property ID from URL

    // Check if the parent property exists
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    const doc = await Unit.create({
      property: propertyId,
      unitNumber: b.unitNumber,
      price: b.price != null ? Number(b.price) : 0,
      status: b.status || "available",
      specifications: b.specifications || {},
      photos: ensureArrayStrings(b.photos),
      videoTours: ensureArrayStrings(b.videoTours).filter(isYouTubeUrl),
      soldDate:
        b.status === "sold"
          ? b.soldDate
            ? new Date(b.soldDate)
            : new Date()
          : undefined,
    });
    res.status(201).json(doc);
  } catch (e) {
    next(e);
  }
}

// List all Units for a specific Property
async function listUnitsForProperty(req, res, next) {
  try {
    const { propertyId } = req.params;
    const data = await Unit.find({ property: propertyId }).sort({
      unitNumber: 1,
    });
    res.json({ data });
  } catch (e) {
    next(e);
  }
}

// Get a single Unit by its ID
async function getUnit(req, res, next) {
  try {
    const doc = await Unit.findById(req.params.id).populate("property"); // Populate property info
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch (e) {
    next(e);
  }
}

// Update a single Unit
async function updateUnit(req, res, next) {
  try {
    const { id } = req.params; // This is the Unit ID
    const b = req.body || {};

    if (b.videoTours)
      b.videoTours = ensureArrayStrings(b.videoTours).filter(isYouTubeUrl);

    const allowed = [
      "unitNumber",
      "price",
      "status",
      "specifications",
      "photos",
      "videoTours",
      "soldDate",
    ];
    const patch = pick(b, allowed);

    if (patch.price != null) patch.price = Number(patch.price);

    // Handle sold/available logic
    if (patch.status) {
      if (patch.status === "sold" && !patch.soldDate)
        patch.soldDate = new Date();
      if (patch.status === "available" || patch.status === "rented")
        patch.soldDate = null;
    }

    const doc = await Unit.findByIdAndUpdate(id, patch, { new: true });
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch (e) {
    next(e);
  }
}

// Delete a single Unit
async function deleteUnit(req, res, next) {
  try {
    const doc = await Unit.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Unit deleted" });
  } catch (e) {
    next(e);
  }
}

// --- UNIT MEDIA UPLOADS ---

// Upload photos for a specific Unit
async function uploadUnitPhotos(req, res, next) {
  try {
    if (!req.files || !req.files.length)
      return res.status(400).json({ message: "No files" });
    const uploads = await Promise.all(
      req.files.map((f) => uploadBuffer(f.buffer, "units/photos", "image"))
    );
    const urls = uploads.map((u) => u.secure_url);
    const doc = await Unit.findByIdAndUpdate(
      req.params.id, // Unit ID
      { photos: urls }, // Replaces entire array
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch (e) {
    next(e);
  }
}

// --- GLOBAL UNIT SEARCH ---

// This is the new, more complex "list" function for customers.
// It searches across all Units and joins Property data.
async function listUnits(req, res, next) {
  try {
    const {
      search,
      status,
      city,
      province,
      featured, // Note: featured is on the Property
      minPrice,
      maxPrice,
      limit,
      page,
      propertyType,
      // Unit-specific filters
      bedrooms,
      bathrooms,
    } = req.query;

    const perPage = Math.min(Number(limit) || 50, 100);
    const skip = Math.max(((Number(page) || 1) - 1) * perPage, 0);

    // 1. Build unit-level filters
    const unitMatch = {};
    if (status) unitMatch.status = status;
    if (minPrice || maxPrice) {
      unitMatch.price = {};
      if (minPrice) unitMatch.price.$gte = Number(minPrice);
      if (maxPrice) unitMatch.price.$lte = Number(maxPrice);
    }
    if (bedrooms) unitMatch["specifications.bedrooms"] = Number(bedrooms);
    if (bathrooms) unitMatch["specifications.bathrooms"] = Number(bathrooms);

    // 2. Build property-level filters
    const propertyMatch = {};
    if (city) propertyMatch["propertyInfo.city"] = city;
    if (province) propertyMatch["propertyInfo.province"] = province;
    if (propertyType) propertyMatch["propertyInfo.propertyType"] = propertyType;
    if (featured !== undefined)
      propertyMatch["propertyInfo.featured"] = featured === "true";

    // 3. Build search filter (searches both collections)
    if (search) {
      propertyMatch.$or = [
        { "propertyInfo.propertyName": { $regex: search, $options: "i" } },
        { "propertyInfo.city": { $regex: search, $options: "i" } },
        { "propertyInfo.province": { $regex: search, $options: "i" } },
        { unitNumber: { $regex: search, $options: "i" } }, // Search unit number too
      ];
    }

    // 4. Build the aggregation pipeline
    const pipeline = [
      // Start with Unit filters
      { $match: unitMatch },
      // Join with Properties
      {
        $lookup: {
          from: "properties", // The collection name for Property
          localField: "property",
          foreignField: "_id",
          as: "propertyInfo",
        },
      },
      // Deconstruct the array
      { $unwind: "$propertyInfo" },
      // Filter by property-level fields
      { $match: propertyMatch },
    ];

    // 5. Get total count and paginated data in one query
    const results = await Unit.aggregate([
      ...pipeline,
      {
        $facet: {
          total: [{ $count: "count" }],
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: perPage },
          ],
        },
      },
    ]);

    const data = results[0].data;
    const total = results[0].total.length > 0 ? results[0].total[0].count : 0;

    res.json({ data, total, page: Number(page) || 1, limit: perPage });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  createUnit,
  listUnitsForProperty,
  getUnit,
  updateUnit,
  deleteUnit,
  uploadUnitPhotos,
  listUnits, // This is the main search endpoint
};
