import { api } from "./axios";
import { endpoints } from "./endpoints";

// Helper to convert params object to query string, removing empty values
const buildQueryString = (params) => {
  if (!params) return "";
  const query = Object.entries(params)
    .filter(
      ([_, value]) => value !== null && value !== undefined && value !== ""
    )
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join("&");
  return query ? `?${query}` : "";
};

export const AnalyticsAPI = {
  dashboard: () => api.get(endpoints.analytics.dashboard).then((r) => r.data),

  salesTrends: (params) =>
    api
      .get(`${endpoints.analytics.salesTrends}${buildQueryString(params)}`)
      .then((r) => r.data),

  // Renamed function and updated endpoint
  propertyPerformance: (params) =>
    api
      .get(
        `${endpoints.analytics.propertyPerformance}${buildQueryString(params)}`
      )
      .then((r) => r.data),

  // Added function
  agentPerformance: (params) =>
    api
      .get(`${endpoints.analytics.agentPerformance}${buildQueryString(params)}`)
      .then((r) => r.data),

  createSnapshot: (period) =>
    api.post(endpoints.analytics.snapshots, { period }).then((r) => r.data),

  listSnapshots: (params) =>
    api
      .get(`${endpoints.analytics.snapshots}${buildQueryString(params)}`)
      .then((r) => r.data),
};
