// controllers/unitController.js
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
      description: b.description || "",
      amenities: ensureArrayStrings(b.amenities),
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
    // Return just the array of units, consistent with how frontend uses it
    res.json(data); // Changed from { data } to data
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

    // Ensure array fields are handled correctly
    if (b.videoTours)
      b.videoTours = ensureArrayStrings(b.videoTours).filter(isYouTubeUrl);
    // --- 👇 ADDED AMENITIES HANDLING ---
    if (b.amenities) b.amenities = ensureArrayStrings(b.amenities);
    // ------------------------------------

    // --- 👇 UPDATED allowed array ---
    const allowed = [
      "unitNumber",
      "price",
      "status",
      "specifications",
      "photos", // Note: photos are usually handled by uploadUnitPhotos, but allow update here if needed
      "videoTours",
      "soldDate",
      "description", // Added description
      "amenities", // Added amenities
    ];
    // ----------------------------
    const patch = pick(b, allowed); // Use helper to get only allowed fields

    if (patch.price != null) patch.price = Number(patch.price);

    // Handle sold/available logic based on status update
    if (patch.status) {
      if (patch.status === "sold" && !patch.soldDate) {
        // Only set soldDate if status becomes 'sold' and no date provided
        // Try to use provided soldDate first, fallback to now
        patch.soldDate = b.soldDate ? new Date(b.soldDate) : new Date();
        // Validate parsed date
        if (isNaN(patch.soldDate.getTime())) {
          console.warn(
            `Invalid soldDate received for unit ${id}: ${b.soldDate}. Defaulting to now.`
          );
          patch.soldDate = new Date();
        }
      }
      // Clear soldDate if status changes away from 'sold'
      if (patch.status === "available" || patch.status === "rented") {
        patch.soldDate = null;
      }
    } else if (b.soldDate !== undefined) {
      // Allow updating soldDate even if status isn't changing (e.g., correcting a date)
      // Ensure null is explicitly set if b.soldDate is empty/null
      if (!b.soldDate) {
        patch.soldDate = null;
      } else {
        const parsedDate = new Date(b.soldDate);
        if (!isNaN(parsedDate.getTime())) {
          patch.soldDate = parsedDate;
        } else {
          console.warn(
            `Invalid soldDate received during update for unit ${id}: ${b.soldDate}. Ignoring.`
          );
          // Do not include invalid date in the patch
        }
      }
    }

    const doc = await Unit.findByIdAndUpdate(id, patch, {
      new: true,
      runValidators: true,
    }); // Added runValidators
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch (e) {
    console.error("Error updating unit:", e); // Log the full error
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
      return res.status(400).json({ message: "No files provided" }); // Clearer message

    // Find the unit first to append photos if needed, or replace
    const unit = await Unit.findById(req.params.id);
    if (!unit) return res.status(404).json({ message: "Unit not found" });

    const uploads = await Promise.all(
      req.files.map((f) => uploadBuffer(f.buffer, "units/photos", "image"))
    );
    const newUrls = uploads.map((u) => u.secure_url);

    // Decide whether to append or replace based on your needs
    // Example: Replace all photos
    unit.photos = newUrls;
    // Example: Append new photos to existing ones
    // unit.photos = [...unit.photos, ...newUrls];

    const updatedDoc = await unit.save(); // Save the unit instance

    res.json(updatedDoc);
  } catch (e) {
    console.error("Error uploading unit photos:", e); // Log full error
    next(e);
  }
}

// --- GLOBAL UNIT SEARCH ---
async function listUnits(req, res, next) {
  // ... (existing listUnits function - no changes needed for this refactor) ...
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
    const pipelineSearchMatch = {}; // Use a separate match stage for $or/$text after lookup
    if (search) {
      // Using $or with $regex for broader matching across fields
      pipelineSearchMatch.$or = [
        { "propertyInfo.propertyName": { $regex: search, $options: "i" } },
        { "propertyInfo.city": { $regex: search, $options: "i" } },
        { "propertyInfo.province": { $regex: search, $options: "i" } },
        { "propertyInfo.description": { $regex: search, $options: "i" } }, // Search property description
        { unitNumber: { $regex: search, $options: "i" } }, // Search unit number
        { description: { $regex: search, $options: "i" } }, // Search unit description
      ];
      // Alternatively, if you have text indexes set up properly on both models:
      // pipelineSearchMatch.$text = { $search: search };
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
          // Select only necessary fields from Property to improve performance
          pipeline: [
            {
              $project: {
                _id: 1,
                propertyName: 1,
                city: 1,
                province: 1,
                street: 1,
                location: 1,
                propertyType: 1,
                featured: 1,
                thumbnail: 1,
                description: 1,
              },
            },
          ],
          as: "propertyInfo",
        },
      },
      // Deconstruct the array (use preserveNullAndEmptyArrays if a unit might lose its property link)
      { $unwind: { path: "$propertyInfo", preserveNullAndEmptyArrays: true } },
      // Filter by property-level fields
      { $match: propertyMatch },
      // Apply search filter if present
      ...(search ? [{ $match: pipelineSearchMatch }] : []),
    ];

    // 5. Get total count and paginated data in one query
    const results = await Unit.aggregate([
      // Apply the main pipeline
      ...pipeline,
      // Facet stage for count and pagination
      {
        $facet: {
          total: [{ $count: "count" }],
          data: [
            // Add sorting - prioritize featured? price? date?
            { $sort: { "propertyInfo.featured": -1, createdAt: -1 } }, // Example: Featured first, then newest
            { $skip: skip },
            { $limit: perPage },
            // Project final shape if needed (e.g., exclude fields)
            // { $project: { someField: 0 } }
          ],
        },
      },
    ]);

    const data = results[0]?.data || []; // Safely access data
    const total = results[0]?.total[0]?.count || 0; // Safely access count

    res.json({ data, total, page: Number(page) || 1, limit: perPage });
  } catch (e) {
    console.error("Error listing/searching units:", e); // Log full error
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
