import { useState } from "react";
import { ReportsAPI } from "../../api/reports";
import { toast } from "react-toastify";

export default function Reports() {
  const [loading, setLoading] = useState({});
  const [filters, setFilters] = useState({
    salesStatus: "closed",
    agentStatus: "closed",
  });

  const handleDownload = async (apiFn, key, params = {}) => {
    setLoading((prev) => ({ ...prev, [key]: true }));
    try {
      await apiFn(params);
    } catch (err) {
      console.error(`${key} download failed:`, err);
      toast.error(`${key} download failed.`);
    } finally {
      setLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-brand-primary">
        Reports & Exports
      </h1>

      <div className="max-w-md p-6 bg-white border rounded-lg shadow-sm space-y-4">
        <p className="text-sm text-gray-600">
          Download the latest CSV snapshots for analysis or archiving.
        </p>

        <div className="flex flex-col gap-3">
          <ReportButton
            label="Sales Report"
            loading={loading["Sales Report"]}
            onClick={() =>
              handleDownload(ReportsAPI.sales, "Sales Report", {
                status: filters.salesStatus,
              })
            }
          />

          <ReportButton
            label="Buildings Report"
            loading={loading["Buildings Report"]}
            onClick={() =>
              handleDownload(ReportsAPI.properties, "Buildings Report")
            }
          />

          <ReportButton
            label="Units Report"
            loading={loading["Units Report"]}
            onClick={() => handleDownload(ReportsAPI.units, "Units Report")}
          />

          <ReportButton
            label="Inquiries Report"
            loading={loading["Inquiries Report"]}
            onClick={() =>
              handleDownload(ReportsAPI.inquiries, "Inquiries Report")
            }
          />

          <ReportButton
            label="Agent Performance Report"
            loading={loading["Agent Performance Report"]}
            onClick={() =>
              handleDownload(ReportsAPI.agents, "Agent Performance Report", {
                status: filters.agentStatus,
              })
            }
          />
        </div>
      </div>
    </div>
  );
}

function ReportButton({ label, loading, onClick }) {
  return (
    <button
      className={`flex items-center justify-start px-4 py-2 border rounded-md text-sm font-medium hover:bg-brand-primary hover:text-white transition ${
        loading
          ? "bg-gray-100 text-gray-500 cursor-not-allowed"
          : "bg-white text-gray-700"
      }`}
      onClick={onClick}
      disabled={loading}
    >
      {loading ? "Generating..." : `Download ${label}`}
    </button>
  );
}
