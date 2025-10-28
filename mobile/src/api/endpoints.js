// Paths are relative to the '/api' base URL configured in client.js
export const endpoints = {
  auth: {
    login: "auth/login",
    refresh: "auth/refresh",
    logout: "auth/logout",
    // Add register, verify, forgot, reset if needed for mobile
  },
  users: {
    me: "users/me",
    changePassword: "users/me/change-password",
  },
  analytics: {
    dashboard: "analytics/dashboard",
    // Add salesTrends, propertyStats if needed later
  },
  properties: {
    root: "properties",
    featured: "properties/featured",
    byId: (id) => `properties/${id}`,
    toggleFeatured: (id) => `properties/${id}/feature`, // Adjusted endpoint name based on backend routes
    markSold: (id) => `properties/${id}/mark-sold`, // If you have a dedicated endpoint
    view: (id) => `properties/${id}/view`,
    uploadThumbnail: (id) => `properties/${id}/upload-thumbnail`,
    uploadPhotos: (id) => `properties/${id}/upload-photos`,
    uploadSiteMap: (id) => `properties/${id}/upload-sitemap`,
    // Units
    units: (id) => `properties/${id}/units`, // GET endpoint if needed
    unitsIncrement: (id) => `properties/${id}/units/increment`, // POST in backend
    unitsDecrement: (id) => `properties/${id}/units/decrement`, // POST in backend
  },
  sales: {
    root: "sales",
    byId: (id) => `sales/${id}`,
  },
  inquiries: {
    root: "inquiries",
    byId: (id) => `inquiries/${id}`,
    status: (id) => `inquiries/${id}/status`, // PATCH endpoint
    handle: (id) => `inquiries/${id}/handle`, // Old endpoint, might remove if status handles all
  },
  locations: {
    provinces: "locations/provinces",
    cities: (province) => `locations/provinces/${encodeURIComponent(province)}/cities`,
  },
};