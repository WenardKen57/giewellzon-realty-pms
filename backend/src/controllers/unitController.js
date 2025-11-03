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

    // Validate required fields
    const errors = {};
    if (!b.unitNumber || !String(b.unitNumber).trim()) {
      errors.unitNumber = "Unit number/name is required";
    }
    const priceNum = Number(b.price);
    if (b.price === undefined || b.price === null || isNaN(priceNum) || priceNum <= 0) {
      errors.price = "Price must be a positive number";
    }
    const allowedStatus = ["available", "sold", "rented"];
    if (!b.status || !allowedStatus.includes(b.status)) {
      errors.status = "Status is required";
    }
    const specs = b.specifications || {};
    const specFields = [
      ["lotArea", "Lot area is required"],
      ["floorArea", "Floor area is required"],
      ["bedrooms", "Bedrooms is required"],
      ["bathrooms", "Bathrooms is required"],
      ["parking", "Parking is required"],
    ];
    for (const [key, msg] of specFields) {
      const val = specs[key];
      const num = Number(val);
      if (val === undefined || val === null || val === "" || isNaN(num)) {
        errors[key] = msg;
      } else if (num < 0) {
        errors[key] = "Must be zero or greater";
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: "Please fill all required fields", errors });
    }

    // Normalize specifications to numbers
    const normalizedSpecs = {
      lotArea: Number(specs.lotArea),
      floorArea: Number(specs.floorArea),
      bedrooms: Number(specs.bedrooms),
      bathrooms: Number(specs.bathrooms),
      parking: Number(specs.parking),
      ...(specs.yearBuilt != null ? { yearBuilt: Number(specs.yearBuilt) } : {}),
    };

    const doc = await Unit.create({
      property: propertyId,
      unitNumber: String(b.unitNumber).trim(),
      price: priceNum,
      status: b.status,
      specifications: normalizedSpecs,
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
    const patch = {}; // Initialize patch object // --- START of ARRAY FIELD HANDLING FIX ---

    // Handle array fields explicitly to ensure they can be cleared (set to [])
    if (b.videoTours !== undefined) {
      patch.videoTours = ensureArrayStrings(b.videoTours).filter(isYouTubeUrl);
    }

    if (b.amenities !== undefined) {
      patch.amenities = ensureArrayStrings(b.amenities);
    } // IMPORTANT FIX: Allow 'photos' array to be cleared or replaced via update

    // Note: The main photo upload is via uploadUnitPhotos, but this allows clearing the list.
    if (b.photos !== undefined) {
      patch.photos = ensureArrayStrings(b.photos);
    } // --- END of ARRAY FIELD HANDLING FIX --- // Define allowed scalar/object fields to merge with the patch
    const allowedScalars = [
      "unitNumber",
      "price",
      "status",
      "specifications",
      "description",
      "thumbnail",
    ];
    // Merge scalar fields into the patch object
    Object.assign(patch, pick(b, allowedScalars));

    if (patch.price != null) patch.price = Number(patch.price); // Handle sold/available logic based on status update (Logic is correct)

    if (patch.status) {
      if (patch.status === "sold" && !patch.soldDate) {
        // Only set soldDate if status becomes 'sold' and no date provided
        // Try to use provided soldDate first, fallback to now
        patch.soldDate = b.soldDate ? new Date(b.soldDate) : new Date(); // Validate parsed date
        if (isNaN(patch.soldDate.getTime())) {
          console.warn(
            `Invalid soldDate received for unit ${id}: ${b.soldDate}. Defaulting to now.`
          );
          patch.soldDate = new Date();
        }
      } // Clear soldDate if status changes away from 'sold'
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
          ); // Do not include invalid date in the patch
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

async function uploadUnitThumbnail(req, res, next) {
  try {
    if (!req.file || !req.file.buffer)
      return res.status(400).json({ message: "No file provided" });

    const result = await uploadBuffer(
      req.file.buffer,
      "units/thumbnails", // Separate folder
      "image"
    );
    const url = result.secure_url;
    const doc = await Unit.findByIdAndUpdate(
      req.params.id,
      { thumbnail: url }, // Set the new thumbnail field
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Unit not found" });
    res.json(doc);
  } catch (e) {
    console.error("Error uploading unit thumbnail:", e);
    next(e);
  }
}

// Upload photos for a specific Unit
// --- UPDATED: This now APPENDS photos instead of replacing ---
async function uploadUnitPhotos(req, res, next) {
  try {
    if (!req.files || !req.files.length)
      return res.status(400).json({ message: "No files provided" }); // Clearer message

    // Find the unit first to append photos
    const unit = await Unit.findById(req.params.id);
    if (!unit) return res.status(404).json({ message: "Unit not found" });

    const uploads = await Promise.all(
      req.files.map((f) => uploadBuffer(f.buffer, "units/photos", "image"))
    );
    const newUrls = uploads.map((u) => u.secure_url);

    // --- MODIFIED: Append new photos to existing ones ---
    unit.photos = [...(unit.photos || []), ...newUrls];

    const updatedDoc = await unit.save(); // Save the unit instance

    res.json(updatedDoc);
  } catch (e) {
    console.error("Error uploading unit photos:", e); // Log full error
    next(e);
  }
}

async function deleteUnitThumbnail(req, res, next) {
  try {
    const doc = await Unit.findByIdAndUpdate(
      req.params.id,
      { $set: { thumbnail: null } }, // Set thumbnail field to null
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Unit not found" });
    res.json({ message: "Thumbnail removed", doc });
  } catch (e) {
    next(e);
  }
}

// --- NEW: Delete a specific Photo from a Unit ---
async function deleteUnitPhoto(req, res, next) {
  try {
    const { photoUrl } = req.body; // Get the URL from the request body
    if (!photoUrl) {
      return res.status(400).json({ message: "No photoUrl provided" });
    }
    const doc = await Unit.findByIdAndUpdate(
      req.params.id,
      { $pull: { photos: photoUrl } }, // Remove the specific URL from the photos array
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Unit not found" });
    res.json({ message: "Photo removed", doc });
  } catch (e) {
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
  deleteUnitPhoto, // --- NEW EXPORT ---
  uploadUnitThumbnail,
  deleteUnitThumbnail,
};
