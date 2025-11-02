import { api } from "./axios";
import { endpoints } from "./endpoints";

// This API object now ONLY manages Properties (Buildings/Complexes)
export const PropertiesAPI = {
  // Lists all BUILDINGS
  list: (params) =>
    api.get(endpoints.properties.root, { params }).then((r) => r.data),

  // Gets one BUILDING (and populates its units)
  get: (id) => api.get(endpoints.properties.byId(id)).then((r) => r.data),

  getFeaturedProperties: (limit) =>
    api
      .get(endpoints.properties.featured, { params: { limit } })
      .then((r) => r.data),

  // --- Building Management ---
  create: (payload) =>
    api.post(endpoints.properties.root, payload).then((r) => r.data),
  update: (id, payload) =>
    api.patch(endpoints.properties.byId(id), payload).then((r) => r.data),
  del: (id) => api.delete(endpoints.properties.byId(id)).then((r) => r.data),
  toggleFeatured: (id, featured) =>
    api
      .patch(endpoints.properties.feature(id), { featured })
      .then((r) => r.data),
  incrementView: (id) =>
    api.post(endpoints.properties.view(id)).then((r) => r.data),

  // --- Building Uploads ---
  uploadThumbnail: (id, file) => {
    const fd = new FormData();
    fd.append("thumbnail", file);
    return api
      .post(endpoints.properties.uploadThumbnail(id), fd)
      .then((r) => r.data);
  },
  uploadPhotos: (id, files) => {
    const fd = new FormData();
    for (const f of files) fd.append("photos", f);
    return api
      .post(endpoints.properties.uploadPhotos(id), fd)
      .then((r) => r.data);
  },
  uploadSiteMap: (id, file) => {
    const fd = new FormData();
    fd.append("sitemap", file);
    return api
      .post(endpoints.properties.uploadSiteMap(id), fd)
      .then((r) => r.data);
  },

  // --- NEW: Building Media Deletion ---
  deleteThumbnail: (id) =>
    api.delete(endpoints.properties.thumbnail(id)).then((r) => r.data),
  deletePhoto: (id, photoUrl) =>
    api
      .delete(endpoints.properties.photo(id), { data: { photoUrl } }) // Send URL in body
      .then((r) => r.data),

  // --- Unit management *relative* to this property ---
  listUnits: (propertyId) =>
    api.get(endpoints.properties.listUnits(propertyId)).then((r) => r.data),
  createUnit: (propertyId, payload) =>
    api
      .post(endpoints.properties.createUnit(propertyId), payload)
      .then((r) => r.data),

  // --- Location Functions ---
  getProvinces: () =>
    api.get(endpoints.properties.provinces).then((r) => r.data),
  getCities: (province) =>
    api.get(endpoints.properties.cities(province)).then((r) => r.data),

  // --- DEPRECATED ---
  // markSold: (id) => ...
};
