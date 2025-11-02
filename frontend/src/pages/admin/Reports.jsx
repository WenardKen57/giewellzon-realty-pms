// src/pages/reports.jsx
// This is your main page component

import "./../../utils/registerCharts.js"; // Make sure this path is correct
import { useEffect, useMemo, useState } from "react";
import { ReportsAPI } from "../../api/reports";
import { AnalyticsAPI } from "../../api/analytics"; // <-- This imports from api/analytics.js
import { toast } from "react-toastify";
import {
  DollarSign,
  Home,
  Package,
  CheckCircle,
  Percent,
  Wallet,
  Building,
  KeyRound,
  FileDown,
  LineChart,
  PieChart,
  BarChartHorizontal,
  Users,
} from "lucide-react";

// Import helpers and charts from our new analytics.jsx component file
// *** ADJUST THIS PATH if your analytics.jsx is in a different folder ***
import {
  KpiCard,
  ChartCard,
  Placeholder,
  formatCurrency,
  Bar,
  Doughnut,
} from "./analytics"; 

// #region Helper Components

/**
 * A reusable tab navigation component.
 */
function Tabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: "sales", label: "Sales Report", icon: LineChart },
    { id: "units", label: "Units & Availability", icon: Building },
    { id: "exports", label: "Data Exports", icon: FileDown },
  ];

  return (
    <div>
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === tab.id
                    ? "border-brand-primary text-brand-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

/**
 * Button for CSV downloads.
 */
function ReportButton({ label, loading, onClick }) {
  return (
    <button
      className={`flex items-center justify-start w-full px-4 py-2.5 border rounded-md text-sm font-medium hover:bg-brand-primary hover:text-white transition-colors
        ${
          loading
            ? "bg-gray-100 text-gray-500 cursor-not-allowed"
            : "bg-white text-gray-700 border-gray-300 hover:border-brand-primary"
        }
      `}
      onClick={onClick}
      disabled={loading}
    >
      <FileDown className="w-4 h-4 mr-2" />
      {loading ? "Generating..." : `Download ${label}`}
    </button>
  );
}

// #endregion

// #region Tab Content Components

/**
 * Displays the Sales Report tab content.
 */
function SalesReport({
  dash,
  vizLoading,
  trendDatasets,
  trendOptions,
  topPropData,
  topAgentData,
}) {
  const kpis = [
    { title: "Total Revenue", value: dash.totalRevenue, icon: DollarSign, format: formatCurrency },
    { title: "Sold Units", value: dash.soldUnits, icon: Package },
    { title: "Closed Sales", value: dash.soldUnits, icon: CheckCircle },
    { title: "Average Sale Price", value: dash.avgSalePrice, icon: Percent, format: formatCurrency },
    { title: "Total Commission Paid", value: dash.totalCommission, icon: Wallet, format: formatCurrency },
  ];

  const topPropOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => formatCurrency(ctx.raw) } } },
    scales: { 
      x: { ticks: { autoSkip: false, maxRotation: 45, minRotation: 0 } }, 
      y: { beginAtZero: true, ticks: { callback: (v) => `₱${(v/1_000_000).toFixed(1)}M` } } 
    }
  };

  const topAgentOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => formatCurrency(ctx.raw) } } },
    scales: { 
      x: { beginAtZero: true, ticks: { callback: (v) => `₱${(v/1_000_000).toFixed(1)}M` } }, 
      y: { ticks: { autoSkip: false } } 
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {kpis.map((kpi) => (
          <KpiCard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value || 0}
            icon={kpi.icon}
            format={kpi.format}
          />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <ChartCard title="Monthly Sales Performance" vizLoading={vizLoading}>
            <Bar data={trendDatasets} options={trendOptions} />
          </ChartCard>
        </div>
        <div className="lg:col-span-2">
          <ChartCard title="Sales by Property Type" vizLoading={vizLoading}>
            <Bar data={topPropData} options={topPropOptions} />
          </ChartCard>
        </div>
      </div>
      
      <div className="grid grid-cols-1">
         <ChartCard title="Top Agent Performance" vizLoading={vizLoading}>
            <Bar data={topAgentData} options={topAgentOptions} />
          </ChartCard>
      </div>
    </div>
  );
}

/**
 * Displays the Units & Availability Report tab content.
 */
function UnitsReport({ dash, vizLoading, unitStatusData }) {
  const kpis = [
    { title: "Total Units", value: dash.totalUnits, icon: Building },
    { title: "Available Units", value: dash.availableUnits, icon: Home },
    { title: "Sold Units", value: dash.soldUnits, icon: Package },
    { title: "Rented Units", value: dash.rentedUnits, icon: KeyRound },
  ];

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom" } },
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi) => (
          <KpiCard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value || 0}
            icon={kpi.icon}
          />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ChartCard title="Unit Status Distribution" vizLoading={vizLoading}>
            <Doughnut data={unitStatusData} options={doughnutOptions} />
          </ChartCard>
        </div>
        <div className="md:col-span-1 lg:col-span-2 flex items-center justify-center h-[350px] bg-white border border-dashed rounded-lg">
          <div className="text-center text-gray-500">
            <BarChartHorizontal className="w-12 h-12 mx-auto text-gray-400" />
            <h3 className="mt-2 text-sm font-medium">
              Unit Status by Property
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              (Chart data not yet available)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Displays the CSV Exports tab content.
 */
function CsvExports({ loading, handleDownload, status }) {
  const reports = [
    { label: "Sales Report", key: "Sales Report", fn: ReportsAPI.sales, params: { status } },
    { label: "Buildings Report", key: "Buildings Report", fn: ReportsAPI.properties, params: {} },
    { label: "Units Report", key: "Units Report", fn: ReportsAPI.units, params: {} },
    { label: "Inquiries Report", key: "Inquiries Report", fn: ReportsAPI.inquiries, params: {} },
    { label: "Agent Performance Report", key: "Agent Performance Report", fn: ReportsAPI.agents, params: { status } },
  ];

  return (
    <div className="max-w-md p-6 bg-white border rounded-lg shadow-sm space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Download Snapshots</h3>
      <p className="text-sm text-gray-600">
        Download the latest CSV snapshots for analysis or archiving.
      </p>

      <div className="flex flex-col gap-3 pt-2">
        {reports.map((report) => (
          <ReportButton
            key={report.key}
            label={report.label}
            loading={loading[report.key]}
            onClick={() => handleDownload(report.fn, report.key, report.params)}
          />
        ))}
      </div>
    </div>
  );
}

// #endregion

// #region Main Reports Component

export default function Reports() {
  // --- STATE ---
  const [loading, setLoading] = useState({});
  const [activeTab, setActiveTab] = useState("sales");
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [period, setPeriod] = useState("monthly");
  const [status, setStatus] = useState("closed");
  const [dateField, setDateField] = useState("closingDate");
  const [dateMode, setDateMode] = useState("year");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dash, setDash] = useState({});
  const [trends, setTrends] = useState([]);
  const [properties, setProperties] = useState([]);
  const [agents, setAgents] = useState([]);
  const [vizLoading, setVizLoading] = useState(true);
  const [vizError, setVizError] = useState(null);

  // --- DATA FETCHING ---
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
            ...(dateMode === "range" ? { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined } : { year }),
            period,
            status,
            dateField,
          }),
          AnalyticsAPI.propertyPerformance({
            ...(dateMode === "range" ? { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, dateField } : {}),
          }),
          AnalyticsAPI.agentPerformance({
            status,
            dateField,
            ...(dateMode === "range" ? { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined } : {}),
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
        toast.error("Failed to load visual reports.");
      } finally {
        if (active) setVizLoading(false);
      }
    };

    run();
    return () => {
      active = false;
    };
  }, [year, period, status, dateField, dateMode, dateFrom, dateTo]);

  // --- MEMOIZED DATA ---

  const shapedTrend = useMemo(() => {
    if (!trends || trends.length === 0) {
      if (period === "quarterly") return [1, 2, 3, 4].map((q) => ({ label: `Q${q}`, sales: 0, revenue: 0 }));
      return Array.from({ length: 12 }).map((_, i) => ({ label: `M${i + 1}`, sales: 0, revenue: 0 }));
    }
    if (period === "quarterly") {
      const qMap = new Map([1, 2, 3, 4].map((q) => [q, { label: `Q${q}`, sales: 0, revenue: 0 }]));
      trends.forEach((t) => {
        if (t.quarter) qMap.set(t.quarter, { label: `Q${t.quarter}`, sales: t.count || 0, revenue: t.totalRevenue || 0 });
      });
      return Array.from(qMap.values());
    }
    const mMap = new Map(Array.from({ length: 12 }).map((_, i) => [i + 1, { label: `M${i + 1}`, sales: 0, revenue: 0 }]));
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
        type: "line",
        label: "Revenue",
        data: shapedTrend.map((d) => d.revenue),
        borderColor: "#10B981",
        backgroundColor: "#10B981",
        yAxisID: "yRevenue",
        tension: 0.1,
      },
    ],
  }), [shapedTrend]);

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      ySales: { type: "linear", position: "left", beginAtZero: true, title: { display: true, text: "Sales Count" } },
      yRevenue: { type: "linear", position: "right", beginAtZero: true, title: { display: true, text: "Revenue (₱)" }, grid: { drawOnChartArea: false }, ticks: { callback: (v) => `₱${(v / 1_000_000).toFixed(1)}M` } },
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


  // --- RENDER ---
  const currentTab = useMemo(() => {
    switch (activeTab) {
      case "sales":
        return (
          <SalesReport
            dash={dash}
            vizLoading={vizLoading}
            trendDatasets={trendDatasets}
            trendOptions={trendOptions}
            topPropData={topPropData}
            topAgentData={topAgentData}
          />
        );
      case "units":
        return (
          <UnitsReport
            dash={dash}
            vizLoading={vizLoading}
            unitStatusData={unitStatusData}
          />
        );
      case "exports":
        return (
          <CsvExports
            loading={loading}
            handleDownload={handleDownload}
            status={status}
          />
        );
      default:
        return null;
    }
  }, [
    activeTab, 
    dash, 
    vizLoading, 
    trendDatasets, 
    trendOptions, 
    topPropData, 
    topAgentData, 
    unitStatusData, 
    loading, 
    status, 
  ]);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* 1. Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports & Insights</h1>
        <p className="text-sm text-gray-500">Admin / Reports</p>
      </div>

      {/* 2. Global Filters */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
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
            <select className="input w-36" value={period} onChange={(e) => setPeriod(e.targe.value)} disabled={vizLoading || dateMode === 'range'}>
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
          {vizLoading && <span className="text-sm text-gray-500 animate-pulse">Loading data...</span>}
          {vizError && <span className="text-sm text-red-500">{vizError}</span>}
        </div>
      </div>

      {/* 3. Tabs Navigation */}
      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 4. Tab Content */}
      <div className="mt-6">
        {currentTab}
      </div>
    </div>
  );
}
// #endregion