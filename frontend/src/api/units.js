// Filename: units.js

import { api } from "./axios";
import { endpoints } from "./endpoints";

// This API object manages individual Units
export const UnitsAPI = {
  /**
   * This is your NEW main search function for the public site.
   * It searches across ALL units with filters.
   * @param {object} params - e.g., { city: 'Metropolis', bedrooms: 2, maxPrice: 500000 }
   */
  list: (params) =>
    api.get(endpoints.units.root, { params }).then((r) => r.data),

  // Gets a single unit by its ID
  get: (id) => api.get(endpoints.units.byId(id)).then((r) => r.data),

  /**
   * Updates a single unit.
   * This is how you'll now mark as sold.
   * e.g., UnitsAPI.update(unitId, { status: 'sold' })
   * e.g., UnitsAPI.update(unitId, { price: 550000 })
   */
  update: (id, payload) =>
    api.patch(endpoints.units.byId(id), payload).then((r) => r.data),

  // Deletes a single unit
  del: (id) => api.delete(endpoints.units.byId(id)).then((r) => r.data),

  // Uploads photos for a specific unit
  uploadPhotos: (id, files) => {
    const fd = new FormData();
    for (const f of files) fd.append("photos", f);
    return api.post(endpoints.units.uploadPhotos(id), fd).then((r) => r.data);
  },
};
