import { api } from "./client";
import { endpoints } from "./endpoints";

export async function listSales(params = {}) {
  try {
    const { data } = await api.get(endpoints.sales.root, { params });
    // Backend returns { data: [], total, totalRevenue, avgSalePrice, page, limit }
    return data;
  } catch (error) {
    console.error("Error fetching sales:", error);
    throw error;
  }
}

export async function createSale(payload) {
  try {
    const { data } = await api.post(endpoints.sales.root, payload);
    return data; // Returns the created sale document
  } catch (error) {
    console.error("Error creating sale:", error);
    throw error;
  }
}

export async function updateSale(id, payload) {
  try {
    const { data } = await api.patch(endpoints.sales.byId(id), payload);
    return data; // Returns the updated sale document
  } catch (error) {
    console.error(`Error updating sale ${id}:`, error);
    throw error;
  }
}

export async function deleteSale(id) {
  try {
    // Backend implements soft delete via PATCH in controller, but route is DELETE
    const { data } = await api.delete(endpoints.sales.byId(id));
    return data; // Should return { message: "Deleted" }
  } catch (error) {
    console.error(`Error deleting sale ${id}:`, error);
    throw error;
  }
}