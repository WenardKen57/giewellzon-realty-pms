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

// Helper function to create unique filenames with date
const generateFilename = (base) =>
  `${base}_${new Date().toISOString().split("T")[0]}.csv`;

// Main download function using fetch with Authorization header
export function downloadCsv(url, filename) {
  // Get token from localStorage (adjust key if necessary)
  const token = localStorage.getItem("gw_at") || "";

  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => {
      if (!r.ok) {
        // Handle HTTP errors
        console.error("CSV Download failed:", r.status, r.statusText);
        // Try to read error message from backend if available
        r.text()
          .then((text) => {
            alert(
              `Failed to download report: ${r.statusText} - ${
                text || "Server error"
              }`
            );
          })
          .catch(() => {
            alert(`Failed to download report: ${r.statusText}`);
          });
        return Promise.reject(new Error(`HTTP error ${r.status}`));
      }
      return r.blob();
    })
    .then((blob) => {
      // Create a link to trigger the download
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link); // Required for Firefox
      link.click();
      document.body.removeChild(link); // Clean up
      URL.revokeObjectURL(link.href); // Free up memory
    })
    .catch((err) => {
      // Avoid double alerts for HTTP errors already handled
      if (!err.message.startsWith("HTTP error")) {
        console.error("Error during CSV download:", err);
        alert("An error occurred while preparing the download.");
      }
    });
}

// API object for report downloads
export const ReportsAPI = {
  // Pass optional filter params to the URL
  sales: (params) =>
    downloadCsv(
      `${endpoints.reports.sales}${buildQueryString(params)}`,
      generateFilename("sales_report")
    ),
  properties: (params) =>
    downloadCsv(
      `${endpoints.reports.properties}${buildQueryString(params)}`,
      generateFilename("property_buildings_report")
    ),
  units: (params) =>
    downloadCsv(
      `${endpoints.reports.units}${buildQueryString(params)}`,
      generateFilename("units_report")
    ),
  inquiries: (params) =>
    downloadCsv(
      `${endpoints.reports.inquiries}${buildQueryString(params)}`,
      generateFilename("inquiries_report")
    ),
  agents: (params) =>
    downloadCsv(
      `${endpoints.reports.agents}${buildQueryString(params)}`,
      generateFilename("agent_performance_report")
    ),
};
