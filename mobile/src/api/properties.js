import { api } from "./client";
import { endpoints } from "./endpoints";
import { Platform } from "react-native";

// Helper to create FormData compatible with React Native AND Web
const createFormData = async (body = {}, files = []) => {
  // <-- Made async
  const data = new FormData();

  // Append files
  // Use Promise.all to fetch blobs in parallel for web
  await Promise.all(
    files.map(async (file) => {
      // <-- Added async/await
      if (file && file.uri) {
        // Use provided name/type, fallback to guessing
        const uriParts = file.uri.split(".");
        const fileTypeGuess = uriParts[uriParts.length - 1];
        const fileName = file.name || `file.${fileTypeGuess}`;
        const fileType = file.type || `image/${fileTypeGuess}`;

        if (Platform.OS === "web") {
          // On web, fetch the blob from the URI and append it
          try {
            const response = await fetch(file.uri);
            const blob = await response.blob();
            data.append(file.field || "file", blob, fileName);
          } catch (e) {
            console.error("Error fetching blob for FormData:", e);
          }
        } else {
          // On native, use the { uri, name, type } object
          data.append(file.field || "file", {
            uri:
              Platform.OS === "android"
                ? file.uri
                : file.uri.replace("file://", ""),
            name: fileName,
            type: fileType,
          });
        }
      }
    })
  ); // <-- End of Promise.all

  // Append other body data
  Object.keys(body).forEach((key) => {
    data.append(key, body[key]);
  });

  return data;
};
export async function createUnit(propertyId, payload) {
  if (!propertyId) throw new Error("Property ID is required to create a unit");
  try {
    // Construct the endpoint using the propertyId
    const endpoint = `properties/${propertyId}/units`;
    const { data } = await api.post(endpoint, payload);
    return data; // Returns the created unit document
  } catch (error) {
    console.error(`Error creating unit for property ${propertyId}:`, error);
    throw error;
  }
}

export async function listUnitsForProperty(propertyId) {
  if (!propertyId) return []; // Or throw error
  try {
    const endpoint = `properties/${propertyId}/units`;
    const { data } = await api.get(endpoint);
    // Backend returns { data: Unit[] }
    return data || [];
  } catch (error) {
    console.error(`Error fetching units for property ${propertyId}:`, error);
    throw error;
  }
}

export async function updateUnit(unitId, payload) {
  if (!unitId) throw new Error("Unit ID is required for update");
  try {
    // Construct the endpoint using the unitId (mounted at /api/units)
    const endpoint = `units/${unitId}`;
    const { data } = await api.patch(endpoint, payload);
    return data; // Returns the updated unit document
  } catch (error) {
    console.error(`Error updating unit ${unitId}:`, error);
    throw error;
  }
}

export async function deleteUnit(unitId) {
  if (!unitId) throw new Error("Unit ID is required for deletion");
  try {
    const endpoint = `units/${unitId}`;
    const { data } = await api.delete(endpoint);
    return data; // Should return { message: "Unit deleted" }
  } catch (error) {
    console.error(`Error deleting unit ${unitId}:`, error);
    throw error;
  }
}
// Note: Backend endpoint is GET /api/units/:id
export async function getUnit(unitId) {
  if (!unitId) throw new Error("Unit ID is required");
  try {
    const endpoint = `units/${unitId}`; // Endpoint is relative to /api/units
    const { data } = await api.get(endpoint);
    return data; // Returns the full unit document, likely populated with property info
  } catch (error) {
    console.error(`Error fetching unit ${unitId}:`, error);
    throw error;
  }
}

export async function uploadUnitPhotos(unitId, files) {
  if (!unitId) throw new Error("Unit ID is required for photo upload");
  if (!files || !files.length) return; // Or throw error

  const formData = await createFormData(
    {},
    files.map((f) => ({ ...f, field: "photos" })) // 'photos' matches backend multer field
  );

  try {
    const endpoint = `units/${unitId}/upload-photos`;
    const { data } = await api.post(endpoint, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data; // Returns updated unit
  } catch (error) {
    console.error(`Error uploading photos for unit ${unitId}:`, error);
    throw error;
  }
}

export async function listProperties(filters = {}) {
  // Remove empty filter values
  const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
    if (value !== "" && value != null) {
      acc[key] = value;
    }
    return acc;
  }, {});

  const params = {
    limit: 100, // Fetch a larger number for mobile lists
    page: 1,
    ...cleanFilters,
  };

  try {
    const { data } = await api.get(endpoints.properties.root, { params });
    // Backend returns { data: [], total, page, limit }
    return data || [];
  } catch (error) {
    console.error("Error fetching properties:", error);
    throw error;
  }
}

export async function getProperty(id) {
  try {
    const { data } = await api.get(endpoints.properties.byId(id));
    return data;
  } catch (error) {
    console.error(`Error fetching property ${id}:`, error);
    throw error;
  }
}

export async function getFeaturedProperties(limit = 6) {
  try {
    const { data } = await api.get(endpoints.properties.featured, {
      params: { limit },
    });
    // Backend returns { data: Property[] }
    return data.data || [];
  } catch (error) {
    console.error("Error fetching featured properties:", error);
    throw error;
  }
}

export async function createProperty(payload) {
  try {
    const { data } = await api.post(endpoints.properties.root, payload);
    return data; // Returns the created property document
  } catch (error) {
    console.error("Error creating property:", error);
    throw error;
  }
}

export async function updateProperty(id, payload) {
  try {
    // Note: Backend uses PATCH for updates according to routes
    const { data } = await api.patch(endpoints.properties.byId(id), payload);
    return data;
  } catch (error) {
    console.error(`Error updating property ${id}:`, error);
    throw error;
  }
}

export async function delProperty(id) {
  try {
    const { data } = await api.delete(endpoints.properties.byId(id));
    return data; // Should return { message: "Deleted" }
  } catch (error) {
    console.error(`Error deleting property ${id}:`, error);
    throw error;
  }
}

export async function toggleFeatured(id, currentFeaturedState) {
  try {
    // Pass the desired state to the backend
    const { data } = await api.patch(endpoints.properties.toggleFeatured(id), {
      featured: !currentFeaturedState,
    });
    return data; // Returns the updated property
  } catch (error) {
    console.error(`Error toggling featured status for ${id}:`, error);
    throw error;
  }
}

// --- Uploads ---

export async function uploadThumbnail(propertyId, file) {
  // 'file' should be an object like { uri: '...', name: '...', type: '...' }
  if (!file || !file.uri) throw new Error("Invalid file object for thumbnail");

  // --- FIX: Added 'await' ---
  const formData = await createFormData({}, [{ ...file, field: "thumbnail" }]);

  try {
    const { data } = await api.post(
      endpoints.properties.uploadThumbnail(propertyId),
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return data; // Returns updated property
  } catch (error) {
    console.error(`Error uploading thumbnail for ${propertyId}:`, error);
    throw error;
  }
}

export async function uploadPhotos(propertyId, files) {
  // 'files' should be an array of file objects
  if (!files || !files.length) return; // Or throw error

  // --- FIX: Added 'await' ---
  const formData = await createFormData(
    {},
    files.map((f) => ({ ...f, field: "photos" }))
  );

  try {
    const { data } = await api.post(
      endpoints.properties.uploadPhotos(propertyId),
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return data; // Returns updated property
  } catch (error) {
    console.error(`Error uploading photos for ${propertyId}:`, error);
    throw error;
  }
}

// --- Unit Management ---

export async function incrementUnits(id) {
  try {
    // Backend uses POST for increment/decrement
    const { data } = await api.post(endpoints.properties.unitsIncrement(id));
    return data; // Should return { numberOfUnit: number } or the updated property
  } catch (error) {
    console.error(`Error incrementing units for ${id}:`, error);
    throw error;
  }
}

export async function decrementUnits(id) {
  try {
    // Backend uses POST for increment/decrement
    const { data } = await api.post(endpoints.properties.unitsDecrement(id));
    return data; // Should return { numberOfUnit: number } or the updated property
  } catch (error) {
    console.error(`Error decrementing units for ${id}:`, error);
    throw error;
  }
}
