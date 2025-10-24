export const API_BASE = "/api";

export const endpoints = {
  auth: {
    register: `${API_BASE}/auth/register`,
    resendOtp: `${API_BASE}/auth/resend-otp`,
    verifyEmail: `${API_BASE}/auth/verify-email`,
    login: `${API_BASE}/auth/login`,
    refresh: `${API_BASE}/auth/refresh`,
    logout: `${API_BASE}/auth/logout`,
    forgotPassword: `${API_BASE}/auth/forgot-password`,
    resetPassword: `${API_BASE}/auth/reset-password`,
  },

  users: {
    me: `${API_BASE}/users/me`,
    updateMe: `${API_BASE}/users/me`,
    changePassword: `${API_BASE}/users/me/change-password`,
  },

  properties: {
    root: `${API_BASE}/properties`, // Lists all BUILDINGS
    byId: (id) => `${API_BASE}/properties/${id}`, // Gets one BUILDING
    feature: (id) => `${API_BASE}/properties/${id}/feature`,
    view: (id) => `${API_BASE}/properties/${id}/view`,
    uploadThumbnail: (id) => `${API_BASE}/properties/${id}/upload-thumbnail`,
    uploadPhotos: (id) => `${API_BASE}/properties/${id}/upload-photos`,
    uploadSiteMap: (id) => `${API_BASE}/properties/${id}/upload-sitemap`,
    featured: `${API_BASE}/properties/featured`, // Gets featured BUILDINGS
    listUnits: (propertyId) => `${API_BASE}/properties/${propertyId}/units`,
    createUnit: (propertyId) => `${API_BASE}/properties/${propertyId}/units`,
    provinces: `${API_BASE}/locations/provinces`,
    cities: (province) => `${API_BASE}/locations/provinces/${province}/cities`,
  },

  units: {
    root: `${API_BASE}/units`, // Your NEW main search endpoint (GET)
    byId: (id) => `${API_BASE}/units/${id}`, // GET, PATCH, DELETE one unit
    uploadPhotos: (id) => `${API_BASE}/units/${id}/upload-photos`,
  },

  sales: {
    root: `${API_BASE}/sales`,
    byId: (id) => `${API_BASE}/sales/${id}`,
  },

  inquiries: {
    root: `${API_BASE}/inquiries`,
    byId: (id) => `${API_BASE}/inquiries/${id}`,
    // handle: (id) => `${API_BASE}/inquiries/${id}/handle`, // Deprecated/Optional
    updateStatus: (id) => `${API_BASE}/inquiries/${id}/status`,
    // scheduleViewing: (id) => `${API_BASE}/inquiries/${id}/schedule`, // Removed as per user request
  },

  analytics: {
    dashboard: `${API_BASE}/analytics/dashboard`,
    salesTrends: `${API_BASE}/analytics/sales-trends`,
    propertyPerformance: `${API_BASE}/analytics/property-performance`, // Renamed
    agentPerformance: `${API_BASE}/analytics/agent-performance`, // Added
    snapshots: `${API_BASE}/analytics/snapshots`,
  },

  reports: {
    sales: `${API_BASE}/reports/sales`,
    properties: `${API_BASE}/reports/properties`, // Buildings report
    units: `${API_BASE}/reports/units`, // Added
    inquiries: `${API_BASE}/reports/inquiries`,
    agents: `${API_BASE}/reports/agents`, // Added
  },
};
