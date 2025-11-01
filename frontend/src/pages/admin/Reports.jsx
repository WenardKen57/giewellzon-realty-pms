import "./../../utils/registerCharts.js";
import { useEffect, useMemo, useState } from "react";
import { ReportsAPI } from "../../api/reports";
import { AnalyticsAPI } from "../../api/analytics";
import { Bar, Doughnut } from "react-chartjs-2";
import { toast } from "react-toastify";

export default function Reports() {
  // Downloads
  const [loading, setLoading] = useState({});

  // Visual analytics
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [period, setPeriod] = useState("monthly"); // monthly | quarterly
  const [status, setStatus] = useState("closed");
  const [dateField, setDateField] = useState("closingDate");
  const [dateMode, setDateMode] = useState("year"); // year | range
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dash, setDash] = useState({});
  const [trends, setTrends] = useState([]);
  const [properties, setProperties] = useState([]);
  const [agents, setAgents] = useState([]);
  const [vizLoading, setVizLoading] = useState(true);
  const [vizError, setVizError] = useState(null);

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

  useEffect(() => {
    let active = true;
    setVizLoading(true);
    setVizError(null);

    const run = async () => {
      try {
        const [d, t, p, a] = await Promise.all([
          AnalyticsAPI.dashboard(),
          AnalyticsAPI.salesTrends({
            ...(dateMode === 'range' ? { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined } : { year }),
            period,
            status,
            dateField,
          }),
          AnalyticsAPI.propertyPerformance({
            ...(dateMode === 'range' ? { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, dateField } : {}),
          }),
          AnalyticsAPI.agentPerformance({
            status,
            dateField,
            ...(dateMode === 'range' ? { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined } : {}),
          }),
        ]);
        if (!active) return;
        setDash(d || {});
        setTrends(t?.trends || []);
        setProperties(p || []);
        setAgents(a || []);
      } catch (e) {
        if (!active) return;
        console.error("Visual reports fetch error:", e);
        setVizError("Failed to load visual reports.");
      } finally {
        if (active) setVizLoading(false);
      }
    };

    run();
    return () => {
      active = false;
    };
  }, [year, period, status, dateField, dateMode, dateFrom, dateTo]);

  // Helpers
  const formatCurrency = (v) =>
    `₱ ${Number(v || 0).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;

  const shapedTrend = useMemo(() => {
    if (!trends || trends.length === 0) {
      if (period === "quarterly") return [1, 2, 3, 4].map((q) => ({ label: `Q${q}`, sales: 0, revenue: 0 }));
      return Array.from({ length: 12 }).map((_, i) => ({ label: `M${i + 1}`, sales: 0, revenue: 0 }));
    }
    if (period === "quarterly") {
      const qMap = new Map([1,2,3,4].map((q) => [q, { label: `Q${q}`, sales: 0, revenue: 0 }]));
      trends.forEach((t) => {
        if (t.quarter) qMap.set(t.quarter, { label: `Q${t.quarter}`, sales: t.count || 0, revenue: t.totalRevenue || 0 });
      });
      return Array.from(qMap.values());
    }
    const mMap = new Map(Array.from({ length: 12 }).map((_, i) => [i+1, { label: `M${i+1}`, sales: 0, revenue: 0 }]));
    trends.forEach((m) => {
      if (m.month) mMap.set(m.month, { label: `M${m.month}`, sales: m.count || 0, revenue: m.totalRevenue || 0 });
    });
    return Array.from(mMap.values());
  }, [trends, period]);

  const trendDatasets = useMemo(() => ({
    labels: shapedTrend.map((d) => d.label),
    datasets: [
      {
        type: "bar",
        label: "Sales Count",
        data: shapedTrend.map((d) => d.sales),
        backgroundColor: "#4F46E5",
        yAxisID: "ySales",
      },
      {
        type: "bar",
        label: "Revenue",
        data: shapedTrend.map((d) => d.revenue),
        backgroundColor: "#10B981",
        yAxisID: "yRevenue",
      },
    ],
  }), [shapedTrend]);

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      ySales: { type: "linear", position: "left", beginAtZero: true, title: { display: true, text: "Sales Count" } },
      yRevenue: { type: "linear", position: "right", beginAtZero: true, title: { display: true, text: "Revenue (₱)" }, grid: { drawOnChartArea: false }, ticks: { callback: (v) => `₱${(v/1_000_000).toFixed(1)}M` } },
      x: { title: { display: true, text: period === "quarterly" ? "Quarter" : "Month" } },
    },
    plugins: { legend: { position: "bottom" } },
  };

  const unitStatusData = useMemo(() => {
    const items = [
      { label: "Available", value: dash.availableUnits || 0, color: "#10B981" },
      { label: "Sold", value: dash.soldUnits || 0, color: "#4F46E5" },
      { label: "Rented", value: dash.rentedUnits || 0, color: "#F59E0B" },
    ].filter((i) => i.value > 0);
    return {
      labels: items.map((i) => i.label),
      datasets: [
        {
          data: items.map((i) => i.value),
          backgroundColor: items.map((i) => i.color),
          borderColor: "#fff",
          borderWidth: 2,
        },
      ],
    };
  }, [dash]);

  const topProperties = useMemo(() => (properties || []).slice(0, 5), [properties]);
  const topAgents = useMemo(() => (agents || []).slice(0, 5), [agents]);

  const topPropData = useMemo(() => ({
    labels: topProperties.map((p) => p.propertyName),
    datasets: [
      {
        label: "Revenue",
        data: topProperties.map((p) => p.totalClosedRevenue || 0),
        backgroundColor: "#0ea5e9",
      },
    ],
  }), [topProperties]);

  const topAgentData = useMemo(() => ({
    labels: topAgents.map((a) => a.agentName),
    datasets: [
      {
        label: "Revenue",
        data: topAgents.map((a) => a.totalRevenue || 0),
        backgroundColor: "#8b5cf6",
      },
    ],
  }), [topAgents]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-brand-primary">Reports & Exports</h1>

      {/* Visual Reports */}
      <div className="p-4 bg-white border rounded-lg shadow-sm space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
          <label className="flex items-center gap-2">
            <span className="text-sm font-medium">Date Mode:</span>
            <select className="input w-36" value={dateMode} onChange={(e) => setDateMode(e.target.value)} disabled={vizLoading}>
              <option value="year">By Year</option>
              <option value="range">By Range</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-sm font-medium">Period:</span>
            <select className="input w-36" value={period} onChange={(e) => setPeriod(e.target.value)} disabled={vizLoading}>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </label>
          {dateMode === 'year' ? (
            <label className="flex items-center gap-2">
              <span className="text-sm font-medium">Year:</span>
              <select className="input w-28" value={year} onChange={(e) => setYear(Number(e.target.value))} disabled={vizLoading}>
                {Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </label>
          ) : (
            <>
              <label className="flex items-center gap-2">
                <span className="text-sm font-medium">From:</span>
                <input type="date" className="input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} disabled={vizLoading} />
              </label>
              <label className="flex items-center gap-2">
                <span className="text-sm font-medium">To:</span>
                <input type="date" className="input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} disabled={vizLoading} />
              </label>
            </>
          )}
          <label className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            <select className="input w-32" value={status} onChange={(e) => setStatus(e.target.value)} disabled={vizLoading}>
              <option value="closed">Closed</option>
              <option value="pending">Pending</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-sm font-medium">Date Field:</span>
            <select className="input w-36" value={dateField} onChange={(e) => setDateField(e.target.value)} disabled={vizLoading}>
              <option value="closingDate">Closing Date</option>
              <option value="saleDate">Sale Date</option>
            </select>
          </label>
          {vizLoading && <span className="text-sm text-gray-500">Loading...</span>}
          {vizError && <span className="text-sm text-red-500">{vizError}</span>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="mb-2 text-sm font-medium text-gray-600">Sales Trend ({year} - {status})</div>
            <div className="h-[320px]">{vizLoading ? <Placeholder /> : <Bar data={trendDatasets} options={trendOptions} />}</div>
          </div>
          <div>
            <div className="mb-2 text-sm font-medium text-gray-600">Unit Status Distribution</div>
            <div className="h-[320px]">{vizLoading ? <Placeholder /> : <Doughnut data={unitStatusData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }} />}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="mb-2 text-sm font-medium text-gray-600">Top Properties by Revenue</div>
            <div className="h-[320px]">{vizLoading ? <Placeholder /> : <Bar data={topPropData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => formatCurrency(ctx.raw) } } }, scales: { x: { ticks: { autoSkip: false, maxRotation: 45, minRotation: 0 } }, y: { beginAtZero: true, ticks: { callback: (v) => `₱${(v/1_000_000).toFixed(1)}M` } } } }} />}</div>
          </div>
          <div>
            <div className="mb-2 text-sm font-medium text-gray-600">Top Agents by Revenue</div>
            <div className="h-[320px]">{vizLoading ? <Placeholder /> : <Bar data={topAgentData} options={{ indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => formatCurrency(ctx.raw) } } }, scales: { x: { beginAtZero: true, ticks: { callback: (v) => `₱${(v/1_000_000).toFixed(1)}M` } }, y: { ticks: { autoSkip: false } } } }} />}</div>
          </div>
        </div>
      </div>

      {/* CSV Exports */}
      <div className="max-w-md p-6 bg-white border rounded-lg shadow-sm space-y-4">
        <p className="text-sm text-gray-600">Download the latest CSV snapshots for analysis or archiving.</p>

        <div className="flex flex-col gap-3">
          <ReportButton
            label="Sales Report"
            loading={loading["Sales Report"]}
            onClick={() => handleDownload(ReportsAPI.sales, "Sales Report", { status })}
          />

          <ReportButton
            label="Buildings Report"
            loading={loading["Buildings Report"]}
            onClick={() => handleDownload(ReportsAPI.properties, "Buildings Report")}
          />

          <ReportButton
            label="Units Report"
            loading={loading["Units Report"]}
            onClick={() => handleDownload(ReportsAPI.units, "Units Report")}
          />

          <ReportButton
            label="Inquiries Report"
            loading={loading["Inquiries Report"]}
            onClick={() => handleDownload(ReportsAPI.inquiries, "Inquiries Report")}
          />

          <ReportButton
            label="Agent Performance Report"
            loading={loading["Agent Performance Report"]}
            onClick={() => handleDownload(ReportsAPI.agents, "Agent Performance Report", { status })}
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

function Placeholder() {
  return (
    <div className="flex items-center justify-center h-full bg-gray-50 rounded text-gray-400">
      Loading...
    </div>
  );
}
