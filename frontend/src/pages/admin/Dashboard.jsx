import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../../api/analytics";
import { toast } from "react-toastify";

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await AnalyticsAPI.dashboard();
      setMetrics(res || {});
    } catch (err) {
      console.error("Dashboard load failed:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">Loading dashboard...</div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-6 text-center text-red-500">
        No dashboard data available.
      </div>
    );
  }

  const {
    buildingCount = 0,
    totalUnits = 0,
    availableUnits = 0,
    soldUnits = 0,
    rentedUnits = 0,
    totalClosedSales = 0,
    totalClosedRevenue = 0,
    avgClosedSalePrice = 0,
    totalCommissionPaid = 0,
    pendingInquiries = 0,
  } = metrics;

  const formatPeso = (num) =>
    `₱${Number(num || 0).toLocaleString(undefined, {
      maximumFractionDigits: 0,
    })}`;

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-semibold text-brand-primary">
        Dashboard Overview
      </h1>

      {/* --- Property & Unit Stats --- */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">
          Property & Unit Summary
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard title="Total Buildings" value={buildingCount} />
          <StatCard title="Total Units" value={totalUnits} />
          <StatCard title="Available Units" value={availableUnits} />
          <StatCard title="Sold Units" value={soldUnits} />
          <StatCard title="Rented Units" value={rentedUnits} />
        </div>
      </div>

      {/* --- Sales Metrics --- */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">
          Sales Performance
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard title="Closed Sales" value={totalClosedSales} />
          <StatCard
            title="Total Sales Revenue"
            value={formatPeso(totalClosedRevenue)}
          />
          <StatCard
            title="Average Sale Price"
            value={formatPeso(avgClosedSalePrice)}
          />
          <StatCard
            title="Total Commission Paid"
            value={formatPeso(totalCommissionPaid)}
          />
        </div>
      </div>

      {/* --- Inquiries --- */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Inquiries</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <StatCard title="Pending Inquiries" value={pendingInquiries} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  const isMoney = typeof value === "string" && value.startsWith("₱");
  return (
    <div className="p-5 bg-white border rounded-xl shadow-sm hover:shadow-md transition">
      <p className="text-gray-500 text-sm">{title}</p>
      <h2
        className={`mt-1 text-3xl font-semibold ${
          isMoney ? "text-green-700" : "text-gray-800"
        }`}
      >
        {value ?? 0}
      </h2>
    </div>
  );
}
