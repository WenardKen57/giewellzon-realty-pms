import { api } from "./client";
import { endpoints } from "./endpoints";


export async function getDashboardAnalytics() {
  const { data } = await api.get(endpoints.analytics.dashboard);
  return data;
}
