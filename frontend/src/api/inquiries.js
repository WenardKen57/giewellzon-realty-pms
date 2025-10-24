import { api } from "./axios";
import { endpoints } from "./endpoints";

export const InquiriesAPI = {
  submit: (payload) =>
    api.post(endpoints.inquiries.root, payload).then((r) => r.data),
  list: (params) =>
    api.get(endpoints.inquiries.root, { params }).then((r) => r.data),
  get: (id) => api.get(endpoints.inquiries.byId(id)).then((r) => r.data),
  markHandled: (id) =>
    api.patch(endpoints.inquiries.handle(id)).then((r) => r.data),
  updateStatus: (id, status) =>
    api
      .patch(endpoints.inquiries.updateStatus(id), { status })
      .then((r) => r.data),
};

// Back-compat for older imports
export const submitInquiry = InquiriesAPI.submit;

export default InquiriesAPI;
