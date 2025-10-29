import { api } from "./client";
import { endpoints } from "./endpoints";

export const listInquiries = async (params = {}) => {
  // Set defaults for sorting if not provided
  const queryParams = {
    sortBy: "createdAt",
    sortOrder: "desc",
    ...params, // Spread the incoming params (page, limit, status, etc.)
  };

  // Remove 'all' status if present, as backend expects no status for 'all'
  if (queryParams.status === "all") {
    delete queryParams.status;
  }

  try {
    const response = await api.get(endpoints.inquiries.root, {
      params: queryParams, // Pass the whole object to axios
    });

    // --- MODIFIED ---
    // Return the full response object { data, total, page, limit }
    // The screen component is now built to handle this for pagination.
    return response.data;
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

// --- ADDED FOR DASHBOARD ---
export const getRecentInquiries = async (limit = 5) => {
  try {
    // listInquiries handles sorting defaults, just pass limit
    const params = {
      limit,
    };
    // listInquiries returns { data: [], total, ... }
    const response = await listInquiries(params);
    // OverviewScreen expects just the array
    return response.data;
  } catch (error) {
    console.error("Error fetching recent inquiries:", error);
    throw error;
  }
};