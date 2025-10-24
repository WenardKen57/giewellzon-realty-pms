import { useState } from "react"; // Import useState
import { ReportsAPI } from "../../api/reports"; // Ensure this uses the updated reports.js
import { toast } from "react-toastify"; // Use toast instead of notify

export default function Reports() {
  const [loading, setLoading] = useState({}); // Track loading state per button

  // Example: Add state for report filters if needed
  const [reportFilters, setReportFilters] = useState({
    salesStatus: "closed",
    agentStatus: "closed",
    // Add date ranges etc. if you build UI for them
  });

  const handleDownload = async (apiFn, reportName, params = {}) => {
    setLoading((prev) => ({ ...prev, [reportName]: true })); // Set loading for this report
    try {
      // Pass filter params to the API function
      await apiFn(params);
      // Success message is usually handled by the browser download prompt
      // toast.success(`${reportName} download started.`);
    } catch (err) {
      // Catch should ideally not be needed if downloadCsv handles errors
      console.error(`Download failed for ${reportName}:`, err);
      toast.error(`${reportName} download failed.`);
    } finally {
      setLoading((prev) => ({ ...prev, [reportName]: false })); // Clear loading
    }
  };

  return (
    <div className="p-6 space-y-6">
      {" "}
      {/* Added spacing */}
      <h1 className="text-2xl font-semibold text-gray-800">
        Reports & Exports
      </h1>
      {/* Optional: Add Filter UI for Reports Here */}
      {/* Example:
       <div className="p-4 space-y-3 bg-white border rounded-lg shadow-sm">
           <div className="text-lg font-medium text-gray-700">Report Filters</div>
            <label>Sales Report Status:
                <select value={reportFilters.salesStatus} onChange={e => setReportFilters(f => ({...f, salesStatus: e.target.value}))}>
                    <option value="closed">Closed</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </label>
            // Add date filters etc.
       </div>
      */}
      <div className="max-w-md p-6 bg-white border rounded-lg shadow-sm space-y-4">
        {" "}
        {/* Constrained width */}
        <p className="text-sm text-gray-600">
          Download latest CSV snapshots for data analysis or offline archiving.
        </p>
        <div className="flex flex-col gap-3">
          <button
            className="btn btn-outline justify-start" // Left align text
            onClick={() =>
              handleDownload(ReportsAPI.sales, "Sales Report", {
                status: reportFilters.salesStatus,
              })
            } // Pass filters
            disabled={loading["Sales Report"]}
          >
            {loading["Sales Report"]
              ? "Generating..."
              : "Download Sales Report"}
          </button>
          <button
            className="btn btn-outline justify-start"
            onClick={() =>
              handleDownload(ReportsAPI.properties, "Buildings Report")
            }
            disabled={loading["Buildings Report"]}
          >
            {loading["Buildings Report"]
              ? "Generating..."
              : "Download Buildings Report"}
          </button>
          <button
            className="btn btn-outline justify-start"
            onClick={() => handleDownload(ReportsAPI.units, "Units Report")}
            disabled={loading["Units Report"]}
          >
            {loading["Units Report"]
              ? "Generating..."
              : "Download Units Report"}
          </button>
          <button
            className="btn btn-outline justify-start"
            onClick={() =>
              handleDownload(ReportsAPI.inquiries, "Inquiries Report")
            }
            disabled={loading["Inquiries Report"]}
          >
            {loading["Inquiries Report"]
              ? "Generating..."
              : "Download Inquiries Report"}
          </button>
          <button
            className="btn btn-outline justify-start"
            onClick={() =>
              handleDownload(ReportsAPI.agents, "Agent Performance Report", {
                status: reportFilters.agentStatus,
              })
            } // Pass filters
            disabled={loading["Agent Performance Report"]}
          >
            {loading["Agent Performance Report"]
              ? "Generating..."
              : "Download Agent Performance Report"}
          </button>
        </div>
      </div>
    </div>
  );
}
