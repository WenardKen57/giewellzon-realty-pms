import { api } from "./client";
import { endpoints } from "./endpoints";

export async function getProvinces() {
  const { data } = await api.get(endpoints.locations.provinces);
  return data; // Expects an array of strings: ['Province1', 'Province2']
}

export async function getCities(province) {
  if (!province) return []; // Don't call API if province is empty
  try {
    const { data } = await api.get(endpoints.locations.cities(province));
    return data; // Expects an array of strings: ['City1', 'City2']
  } catch (error) {
    console.error(`Error fetching cities for ${province}:`, error);
    return []; // Return empty array on error
  }
}