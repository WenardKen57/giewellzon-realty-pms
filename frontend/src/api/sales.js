import { api } from "./axios";
import { endpoints } from "./endpoints";

export const SalesAPI = {
  list: (params) => api.get(endpoints.sales.root, { params }).then((r) => r.data),
  get: (id) => api.get(endpoints.sales.byId(id)).then((r) => r.data),
  create: (payload) => api.post(endpoints.sales.root, payload).then((r) => r.data),
  update: (id, payload) => api.patch(endpoints.sales.byId(id), payload).then((r) => r.data),
  del: (id) => api.delete(endpoints.sales.byId(id)).then((r) => r.data),
};