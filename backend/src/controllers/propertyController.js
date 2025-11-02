// controllers/propertyController.js
const Property = require("../models/Property");
const Unit = require("../models/Unit"); // Imported for the delete hook
const { isYouTubeUrl } = require("../utils/validate");
const { uploadBuffer } = require("../configs/cloudinary");
const { pick, ensureArrayStrings } = require("../utils/helpers");
// --- (fs and path are not needed for this change) ---

// Create a new Property (Building/Complex)
async function createProperty(req, res, next) {
  try {
    const b = req.body || {};
    const doc = await Property.create({
      propertyName: b.propertyName,
      description: b.description,
      street: b.street,
      location: b.location,
      city: b.city,
      province: b.province,
      featured: !!b.featured,
      amenities: ensureArrayStrings(b.amenities),
      videoTours: ensureArrayStrings(b.videoTours).filter(isYouTubeUrl),
      assignedAgentName: b.assignedAgentName,
      assignedAgentEmail: b.assignedAgentEmail,
      assignedAgentPhone: b.assignedAgentPhone,
      listedDate: b.listedDate ? new Date(b.listedDate) : undefined,
      propertyType: b.propertyType || "house",
    });
    res.status(201).json(doc);
  } catch (e) {
    next(e);
  }
}

// List *Properties* (Buildings/Complexes), not individual units
async function listProperties(req, res, next) {
  try {
    const { search, city, province, propertyType, limit, page } = req.query;
    const q = {};
    if (search) q.$text = { $search: search };
    if (city) q.city = city;
    if (province) q.province = province;
    if (propertyType) q.propertyType = propertyType;

    const perPage = Math.min(Number(limit) || 50, 100);
    const skip = Math.max(((Number(page) || 1) - 1) * perPage, 0);

    const [data, total] = await Promise.all([
      Property.find(q).sort({ createdAt: -1 }).skip(skip).limit(perPage),
      Property.countDocuments(q),
    ]);
    res.json({ data, total, page: Number(page) || 1, limit: perPage });
  } catch (e) {
    next(e);
  }
}

// Get a single Property and populate its associated units
async function getProperty(req, res, next) {
  try {
    const doc = await Property.findById(req.params.id).populate("units");
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch (e) {
    next(e);
  }
}

// Update a Property's details
async function updateProperty(req, res, next) {
  try {
    const { id } = req.params;
    const b = req.body || {};

    // --- START of ARRAY FIELD HANDLING FIX ---
    // Handle array fields explicitly to ensure they can be cleared (set to [])
    if (b.videoTours !== undefined) {
      b.videoTours = ensureArrayStrings(b.videoTours).filter(isYouTubeUrl);
    }
    if (b.amenities !== undefined) {
      b.amenities = ensureArrayStrings(b.amenities);
    }
    // IMPORTANT: Allow 'photos' array to be cleared or replaced via update
    // Note: The main photo upload is via uploadPhotos, but this allows clearing the list.
    if (b.photos !== undefined) {
      b.photos = ensureArrayStrings(b.photos);
    }
    // --- END of ARRAY FIELD HANDLING FIX ---

    // List of fields allowed to be updated on the Property
    const allowed = [
      "propertyName",
      "description",
      "street",
      "location",
      "city",
      "province",
      "featured",
      "amenities",
      "videoTours",
      "assignedAgentName",
      "assignedAgentEmail",
      "assignedAgentPhone",
      "listedDate",
      "thumbnail",
      "photos", // Allow photos array to be updated/cleared
      "siteMap",
      "propertyType",
    ];
    const patch = pick(b, allowed);

    // Logic for numberOfUnit, status, soldDate has been REMOVED.
    // It now lives in the unit.controller.

    const doc = await Property.findByIdAndUpdate(id, patch, { new: true });
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch (e) {
    next(e);
  }
}

// Delete a Property (and all its Units, via the model hook)
async function deleteProperty(req, res, next) {
  try {
    // CRITICAL: Use findOneAndDelete to trigger the 'pre' hook in the model
    const doc = await Property.findOneAndDelete({ _id: req.params.id });
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Property and all associated units deleted" });
  } catch (e) {
    next(e);
  }
}

// Toggle the 'featured' flag on a Property
async function toggleFeatured(req, res, next) {
  try {
    const doc = await Property.findByIdAndUpdate(
      req.params.id,
      { featured: !!req.body.featured },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch (e) {
    next(e);
  }
}

// Increment the view count on a Property
async function incrementView(req, res, next) {
  try {
    const doc = await Property.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json({ viewCount: doc.viewCount });
  } catch (e) {
    next(e);
  }
}

// --- PROPERTY MEDIA UPLOADS ---

// Upload a thumbnail for the Property
async function uploadThumbnail(req, res, next) {
  try {
    if (!req.file || !req.file.buffer)
      return res.status(400).json({ message: "No file" });
    const result = await uploadBuffer(
      req.file.buffer,
      "properties/thumbnails",
      "image"
    );
    const url = result.secure_url;
    const doc = await Property.findByIdAndUpdate(
      req.params.id,
      { thumbnail: url },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch (e) {
    next(e);
  }
}

// Upload photos for the Property (building, lobby, pool, etc.)
// --- UPDATED: This now APPENDS photos instead of replacing ---
async function uploadPhotos(req, res, next) {
  try {
    if (!req.files || !req.files.length)
      return res.status(400).json({ message: "No files" });

    const prop = await Property.findById(req.params.id);
    if (!prop) return res.status(404).json({ message: "Not found" });

    const uploads = await Promise.all(
      req.files.map((f) => uploadBuffer(f.buffer, "properties/photos", "image"))
    );
    const newUrls = uploads.map((u) => u.secure_url);

    // Append new photos to existing ones
    prop.photos = [...(prop.photos || []), ...newUrls];
    await prop.save();

    res.json(prop);
  } catch (e) {
    next(e);
  }
}

// Upload a site map for the Property
async function uploadSiteMap(req, res, next) {
  try {
    if (!req.file || !req.file.buffer)
      return res.status(400).json({ message: "No file" });
    const isPdf = req.file.mimetype === "application/pdf";
    const result = await uploadBuffer(
      req.file.buffer,
      "properties/sitemaps",
      isPdf ? "raw" : "image"
    );
    const siteMap = {
      url: result.secure_url,
      mimeType: req.file.mimetype,
      originalName: req.file.originalname,
    };
    const doc = await Property.findByIdAndUpdate(
      req.params.id,
      { siteMap },
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch (e) {
    next(e);
  }
}

// --- NEW: Delete Thumbnail ---
async function deleteThumbnail(req, res, next) {
  try {
    const doc = await Property.findByIdAndUpdate(
      req.params.id,
      { $set: { thumbnail: null } }, // Set thumbnail field to null
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Not found" });
    // Note: This does not delete the file from Cloudinary, only removes the reference.
    // Deleting from Cloudinary would require its SDK and the public_id.
    res.json({ message: "Thumbnail removed", doc });
  } catch (e) {
    next(e);
  }
}

// --- NEW: Delete a specific Photo ---
async function deletePhoto(req, res, next) {
  try {
    const { photoUrl } = req.body; // Get the URL from the request body
    if (!photoUrl) {
      return res.status(400).json({ message: "No photoUrl provided" });
    }
    const doc = await Property.findByIdAndUpdate(
      req.params.id,
      { $pull: { photos: photoUrl } }, // Remove the specific URL from the photos array
      { new: true }
    );
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Photo removed", doc });
  } catch (e) {
    next(e);
  }
}

// Get featured *Properties* (buildings)
// Enhanced to return quick engagement details for the homepage cards:
// - availableUnits: count of units with status 'available'
// - minPrice: lowest price across ALL units (even if sold/rented)
// Note: We still avoid returning the full units array for performance.
async function getFeaturedProperties(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 6, 20);
    const data = await Property.aggregate([
      { $match: { featured: true } },
      {
        $lookup: {
          from: "units",
          localField: "_id",
          foreignField: "property",
          as: "units",
        },
      },
      // Compute engagement fields
      {
        $addFields: {
          availableUnits: {
            $size: {
              $filter: {
                input: "$units",
                as: "u",
                cond: { $eq: ["$$u.status", "available"] },
              },
            },
          },
          // Lowest price across ALL units (ignore null/0/NaN)
          minPrice: {
            $min: {
              $map: {
                input: {
                  $filter: {
                    input: "$units",
                    as: "u",
                    cond: {
                      $and: [
                        { $ne: ["$$u.price", null] },
                        { $gt: ["$$u.price", 0] },
                      ],
                    },
                  },
                },
                as: "u",
                in: "$$u.price",
              },
            },
          },
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: limit },
      {
        $project: {
          // Include only the fields needed on the homepage
          propertyName: 1,
          city: 1,
          province: 1,
          thumbnail: 1,
          propertyType: 1,
          availableUnits: 1,
          minPrice: 1,
        },
      },
    ]);
    res.json({ data });
  } catch (e) {
    next(e);
  }
}

// --- DEPRECATED FUNCTIONS ---
// markSold, getNumberOfUnit, incrementNumberOfUnit, decrementNumberOfUnit
// are all removed. This logic is now handled by creating/updating Units.

module.exports = {
  createProperty,
  listProperties,
  getProperty,
  updateProperty,
  deleteProperty,
  toggleFeatured,
  incrementView,
  uploadThumbnail,
  uploadPhotos,
  uploadSiteMap,
  getFeaturedProperties,
  // --- NEW EXPORTS ---
  deleteThumbnail,
  deletePhoto,
};
