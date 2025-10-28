import { api } from "./client";
import { endpoints } from "./endpoints";

export const listInquiries = async (
  status,
  dateFrom = "",
  dateTo = "",
  limit = 100 // Default limit for general use
) => {
  const params = {
    limit: limit, // Use the passed limit
    page: 1,
    sortBy: "createdAt", // Sort by creation date
    sortOrder: "desc", // Show newest first
  };

  // Add filters only if they have values
  if (status && status !== "all") {
    params.status = status;
  }
  if (dateFrom) {
    params.dateFrom = dateFrom;
  }
  if (dateTo) {
    params.dateTo = dateTo;
  }

  try {
    const response = await api.get(endpoints.inquiries.root, { params });
    // Backend returns { data: [], total, page, limit }
    return response.data.data || []; // Return just the array of inquiries
  } catch (error) {
    console.error("Error fetching inquiries:", error); // Log the full error
    // Log request config if available
    if (error.config) {
        console.error("Request config:", error.config);
    }
    throw error;
  }
};

export const updateStatus = async (id, status) => {
  try {
    const response = await api.patch(endpoints.inquiries.status(id), {
      status,
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating inquiry ${id} status:`, error);
    throw error;
  }
};

// Remove markHandled if updateStatus covers it
// export async function markHandled(id) { ... }