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
  // FileDown, // <-- REMOVED
  LineChart,
  PieChart,
  BarChartHorizontal,
  Users,
  X,
  Filter,
} from "lucide-react";

// Import helpers and charts from our new analytics.jsx component file
import {
  ChartCard,
  Placeholder,
  formatCurrency,
  Bar,
  Doughnut,
} from "./analytics";

// #region Helper Components

/**
 * KpiCard component with 'variant' prop
 * 'variant="icon"' (default): White card with gradient icon.
 * 'variant="gradient"': Full gradient card with white text and no icon.
 */
function KpiCard({
  title,
  value,
  icon: Icon,
  format = (v) => v,
  color = "blue",
  variant = "icon",
}) {
  // Softer, less-neon gradients
  const colorClasses = {
    green: "bg-gradient-to-br from-green-500 to-green-700",
    blue: "bg-gradient-to-br from-blue-500 to-blue-700",
    indigo: "bg-gradient-to-br from-indigo-500 to-indigo-700",
    purple: "bg-gradient-to-br from-purple-500 to-purple-700",
    amber: "bg-gradient-to-br from-amber-500 to-amber-600",
  };
  const gradient = colorClasses[color] || colorClasses.blue;

  if (variant === "gradient") {
    return (
      <div
        className={`p-5 rounded-lg shadow-sm text-white ${gradient}`}
      >
        <p className="text-sm font-medium text-green-50 truncate">{title}</p>
        <p className="text-2xl md:text-3xl font-bold tracking-tight">
          {format(value)}
        </p>
      </div>
    );
  }

  return (
    <div className="p-5 bg-white border border-gray-200 rounded-lg shadow-sm flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
        <p className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
          {format(value)}
        </p>
      </div>
      {Icon && (
        <div
          className={`ml-4 flex-shrink-0 p-3 rounded-full ${gradient} text-white shadow-lg`}
        >
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}

/**
 * A reusable tab navigation component.
 */
function Tabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: "sales", label: "Sales Report", icon: LineChart },
    { id: "units", label: "Units & Availability", icon: Building },
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

// #endregion

// #region Tab Content Components

/**
 * Displays the Sales Report tab content.
 */
function SalesReport() {
  // --- STATE for Sales Tab ---
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [period, setPeriod] = useState("monthly");
  const [status, setStatus] = useState("closed");
  const [dateField, setDateField] = useState("closingDate");
  const [dateMode, setDateMode] = useState("year");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dash, setDash] = useState({}); // For global totals
  const [trends, setTrends] = useState([]);
  const [properties, setProperties] = useState([]);
  const [agents, setAgents] = useState([]);
  const [vizLoading, setVizLoading] = useState(true);
  const [vizError, setVizError] = useState(null);

  // --- DATA FETCHING for Sales Tab ---
  const handleClearFilters = () => {
    setYear(currentYear);
    setPeriod("monthly");
    setStatus("closed");
    setDateField("closingDate");
    setDateMode("year");
    setDateFrom("");
    setDateTo("");
  };

  useEffect(() => {
    let active = true;
    setVizLoading(true);
    setVizError(null);

    const filters = {
      ...(dateMode === "range" ? { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined } : { year }),
      period,
      status,
      dateField,
    };

    const run = async () => {
      try {
        // [EDIT] Fetch dashboard *without* filters to get global totals
        const [d, t, p, a] = await Promise.all([
          AnalyticsAPI.dashboard(), // Global totals
          AnalyticsAPI.salesTrends(filters),
          AnalyticsAPI.propertyPerformance(filters),
          AnalyticsAPI.agentPerformance(filters),
        ]);
        if (!active) return;
        setDash(d || {}); // This is now just for fallback/global
        setTrends(t?.trends || []);
        setProperties(p || []);
        setAgents(a || []);
      } catch (e) {
        if (!active) return;
        console.error("Sales report fetch error:", e);
        setVizError("Failed to load sales reports.");
        toast.error("Failed to load sales reports.");
      } finally {
        if (active) setVizLoading(false);
      }
    };

    run();
    return () => {
      active = false;
    };
  }, [year, period, status, dateField, dateMode, dateFrom, dateTo]);

  // --- MEMOIZED DATA for Sales Tab ---

  // [NEW] Calculate KPIs from filtered lists, not the 'dash' object
  const kpiData = useMemo(() => {
    // If filters are at default, use the global 'dash' object
    const isFiltered = dateMode !== 'year' || period !== 'monthly' || status !== 'closed' || dateField !== 'closingDate';
    
    // Fallback to global dash if not filtered or lists are empty
    if (!isFiltered && !vizLoading) {
      return {
        totalClosedRevenue: dash.totalClosedRevenue,
        soldUnits: dash.soldUnits,
        totalClosedSales: dash.totalClosedSales,
        avgClosedSalePrice: dash.avgClosedSalePrice,
        totalCommissionPaid: dash.totalCommissionPaid,
      };
    }

    // Recalculate from filtered 'properties' and 'agents'
    let totalRevenue = 0;
    let totalSales = 0;
    let totalCommission = 0;
    
    properties.forEach(p => {
      totalRevenue += p.totalClosedRevenue || 0;
      totalSales += p.totalClosedSales || 0;
      totalCommission += p.totalCommissionPaid || 0; // Assuming this comes from property perf
    });

    // Note: 'soldUnits' might be harder to calculate from 'properties'
    // if 'properties' only tracks closed sales. We'll use the 'totalSales'
    // calculated from the list.
    // If 'totalCommissionPaid' is not on 'properties', we can sum 'agents'
    if (totalCommission === 0 && agents.length > 0) {
       totalCommission = agents.reduce((acc, agent) => acc + (agent.totalCommission || 0), 0);
    }

    return {
      totalClosedRevenue: totalRevenue,
      soldUnits: totalSales, // Use calculated total sales
      totalClosedSales: totalSales,
      avgClosedSalePrice: totalSales > 0 ? totalRevenue / totalSales : 0,
      totalCommissionPaid: totalCommission,
    };
  }, [dash, properties, agents, dateMode, period, status, dateField, vizLoading]);


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
      { type: "bar", label: "Sales Count", data: shapedTrend.map((d) => d.sales), backgroundColor: "#4F46E5", yAxisID: "ySales" },
      { type: "line", label: "Revenue", data: shapedTrend.map((d) => d.revenue), borderColor: "#10B981", backgroundColor: "#10B981", yAxisID: "yRevenue", tension: 0.1 },
    ],
  }), [shapedTrend]);

  const trendOptions = {
    responsive: true, maintainAspectRatio: false,
    scales: {
      ySales: { type: "linear", position: "left", beginAtZero: true, title: { display: true, text: "Sales Count" } },
      yRevenue: { type: "linear", position: "right", beginAtZero: true, title: { display: true, text: "Revenue (₱)" }, grid: { drawOnChartArea: false }, ticks: { callback: (v) => `₱${(v / 1_000_000).toFixed(1)}M` } },
      x: { title: { display: true, text: period === "quarterly" ? "Quarter" : "Month" } },
    },
    plugins: { legend: { position: "bottom" } },
  };

  const topProperties = useMemo(() => (properties || []).slice(0, 5), [properties]);
  const topAgents = useMemo(() => (agents || []).slice(0, 5), [agents]);

  const topPropData = useMemo(() => ({
    labels: topProperties.map((p) => p.propertyName),
    datasets: [{ label: "Revenue", data: topProperties.map((p) => p.totalClosedRevenue || 0), backgroundColor: "#0ea5e9" }],
  }), [topProperties]);

  const topAgentData = useMemo(() => ({
    labels: topAgents.map((a) => a.agentName),
    datasets: [{ label: "Revenue", data: topAgents.map((a) => a.totalRevenue || 0), backgroundColor: "#8b5cf6" }],
  }), [topAgents]);

  const kpis = [
    // [EDIT] KPIs now use the new 'kpiData' object
    { title: "Total Revenue", value: kpiData.totalClosedRevenue, format: formatCurrency, color: "green", variant: "gradient" },
    { title: "Sold Units", value: kpiData.soldUnits, color: "indigo", variant: "gradient" },
    { title: "Closed Sales", value: kpiData.totalClosedSales, color: "blue", variant: "gradient" },
    { title: "Average Sale Price", value: kpiData.avgClosedSalePrice, format: formatCurrency, color: "purple", variant: "gradient" },
    { title: "Total Commission Paid", value: kpiData.totalCommissionPaid, format: formatCurrency, color: "amber", variant: "gradient" },
  ];

  const topPropOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => formatCurrency(ctx.raw) } } },
    scales: {
      x: { ticks: { autoSkip: false, maxRotation: 45, minRotation: 0 } },
      y: { beginAtZero: true, ticks: { callback: (v) => `₱${(v / 1_000_000).toFixed(1)}M` } },
    },
  };

  const topAgentOptions = {
    indexAxis: "y", responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => formatCurrency(ctx.raw) } } },
    scales: {
      x: { beginAtZero: true, ticks: { callback: (v) => `₱${(v / 1_000_000).toFixed(1)}M` } },
      y: { ticks: { autoSkip: false } },
    },
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-end">
          <div className="flex items-center gap-2 col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
            <Filter className="w-5 h-5 text-gray-700" />
            <span className="text-lg font-semibold text-gray-700">
              Sales Filters
            </span>
          </div>

          <label>
            <span className="text-sm font-medium">Date Mode:</span>
            <select className="input w-full mt-1" value={dateMode} onChange={(e) => setDateMode(e.target.value)} disabled={vizLoading}>
              <option value="year">By Year</option>
              <option value="range">By Range</option>
            </select>
          </label>

          {dateMode === 'year' ? (
             <label>
                <span className="text-sm font-medium">Year:</span>
                <select className="input w-full mt-1" value={year} onChange={(e) => setYear(Number(e.target.value))} disabled={vizLoading}>
                  {Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </label>
          ) : (
            <>
              <label>
                <span className="text-sm font-medium">From:</span>
                <input type="date" className="input w-full mt-1" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} disabled={vizLoading} />
              </label>
              <label>
                <span className="text-sm font-medium">To:</span>
                <input type="date" className="input w-full mt-1" value={dateTo} onChange={(e) => setDateTo(e.target.value)} disabled={vizLoading} />
              </label>
            </>
          )}

          <label>
            <span className="text-sm font-medium">Period:</span>
            <select className="input w-full mt-1" value={period} onChange={(e) => setPeriod(e.target.value)} disabled={vizLoading || dateMode === 'range'}>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </label>

          <label>
            <span className="text-sm font-medium">Status:</span>
            <select className="input w-full mt-1" value={status} onChange={(e) => setStatus(e.target.value)} disabled={vizLoading}>
              <option value="closed">Closed</option>
              <option value="pending">Pending</option>
            </select>
          </label>

          <label>
            <span className="text-sm font-medium">Date Field:</span>
            <select className="input w-full mt-1" value={dateField} onChange={(e) => setDateField(e.target.value)} disabled={vizLoading}>
              <option value="closingDate">Closing Date</option>
              <option value="saleDate">Sale Date</option>
            </select>
          </label>

          <div>
            <span className="text-sm font-medium invisible">Clear</span>
            <button onClick={handleClearFilters} disabled={vizLoading} className="flex items-center justify-center w-full input bg-gray-100 hover:bg-gray-200 mt-1 text-gray-700">
              <X className="w-4 h-4 mr-1" />
              Clear Filters
            </button>
          </div>

          {vizLoading && <span className="text-sm text-gray-500 animate-pulse col-span-full">Loading data...</span>}
          {vizError && <span className="text-sm text-red-500 col-span-full">{vizError}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} title={kpi.title} value={kpi.value || 0} format={kpi.format} color={kpi.color} variant={kpi.variant} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <ChartCard title="Monthly Sales Performance" vizLoading={vizLoading}>
            <Bar data={trendDatasets} options={trendOptions} />
          </ChartCard>
        </div>
        <div className="lg:col-span-2">
          <ChartCard title="Sales by Property Type (Top 5)" vizLoading={vizLoading}>
            <Bar data={topPropData} options={topPropOptions} />
          </ChartCard>
        </div>
      </div>

      <div className="grid grid-cols-1">
        <ChartCard title="Top Agent Performance (Top 5)" vizLoading={vizLoading}>
          <Bar data={topAgentData} options={topAgentOptions} />
        </ChartCard>
      </div>
    </div>
  );
}

/**
 * Displays the Units & Availability Report tab content.
 */
function UnitsReport() {
  // --- STATE for Units Tab ---
  const [dash, setDash] = useState({}); // For global totals
  const [allProperties, setAllProperties] = useState([]); // Full list for dropdown
  const [filteredProperties, setFilteredProperties] = useState([]); // List for chart
  const [vizLoading, setVizLoading] = useState(true);
  const [vizError, setVizError] = useState(null);

  const [propertyFilter, setPropertyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // --- DATA FETCHING for Units Tab ---
  useEffect(() => {
    let active = true;
    setVizLoading(true);
    setVizError(null);

    const filters = {
      propertyId: propertyFilter || undefined,
      unitStatus: statusFilter || undefined,
    };

    const run = async () => {
      try {
        const [d, p] = await Promise.all([
          AnalyticsAPI.dashboard(filters), // This gets filtered KPIs
          AnalyticsAPI.propertyPerformance(filters), // This gets filtered properties
        ]);
        
        if (!active) return;
        
        // Use filteredDashData for KPIs and Doughnut
        setDash(d || {});
        
        // Set properties for Bar Chart
        if (allProperties.length === 0) {
          setAllProperties(p || []);
        }
        setFilteredProperties(p || []);

      } catch (e) {
        if (!active) return;
        console.error("Units report fetch error:", e);
        setVizError("Failed to load unit reports.");
        toast.error("Failed to load unit reports.");
      } finally {
        if (active) setVizLoading(false);
      }
    };

    run();
    return () => {
      active = false;
    };
  }, [propertyFilter, statusFilter]);

  // Fetch all properties *once* on mount for the dropdown
  useEffect(() => {
    AnalyticsAPI.propertyPerformance({})
      .then(p => setAllProperties(p || []))
      .catch(e => console.error("Failed to fetch all properties for filter", e));
  }, []); 


  // --- MEMOIZED DATA for Units Tab ---

  const kpiData = useMemo(() => {
    // [BUG FIX] Logic updated.
    // If a property filter is set, *always* reduce the filteredProperties list.
    if (propertyFilter) {
      return filteredProperties.reduce(
        (acc, prop) => {
          acc.totalUnits += prop.totalUnits || 0;
          acc.availableUnits += prop.availableUnits || 0;
          acc.soldUnits += prop.soldUnits || 0;
          acc.rentedUnits += prop.rentedUnits || 0;
          return acc;
        },
        { totalUnits: 0, availableUnits: 0, soldUnits: 0, rentedUnits: 0 }
      );
    }
    // Otherwise, use the 'dash' object (which is filtered by status, or global)
    return dash;
  }, [dash, filteredProperties, propertyFilter]);


  // Doughnut chart should now ALSO reflect filters
  const unitStatusData = useMemo(() => {
    const items = [
      { label: "Available", value: kpiData.availableUnits || 0, color: "#10B981" },
      { label: "Sold", value: kpiData.soldUnits || 0, color: "#4F46E5" },
      { label: "Rented", value: kpiData.rentedUnits || 0, color: "#F59E0B" },
    ].filter((i) => i.value > 0);
    return {
      labels: items.map((i) => i.label),
      datasets: [{ data: items.map((i) => i.value), backgroundColor: items.map((i) => i.color), borderColor: "#fff", borderWidth: 2 }],
    };
  }, [kpiData]); // Depends on the new kpiData

  const chartProperties = useMemo(() => {
    if (propertyFilter) {
      return filteredProperties;
    }
    return allProperties;
  }, [allProperties, filteredProperties, propertyFilter]);

  const unitStatusByPropData = useMemo(() => {
    const props = chartProperties;
    return {
      labels: props.map((p) => p.propertyName),
      datasets: [
        { label: "Available", data: props.map((p) => p.availableUnits || 0), backgroundColor: "#10B981" },
        { label: "Sold", data: props.map((p) => p.soldUnits || 0), backgroundColor: "#4F46E5" },
        { label: "Rented", data: props.map((p) => p.rentedUnits || 0), backgroundColor: "#F59E0B" },
      ],
    };
  }, [chartProperties]);

  const unitStatusByPropOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom" },
      tooltip: { callbacks: { label: (context) => `${context.dataset.label}: ${context.raw || 0} units` } },
    },
    scales: {
      x: { stacked: true, title: { display: true, text: "Property" }, ticks: { autoSkip: false, maxRotation: 45, minRotation: 0 } },
      y: { stacked: true, beginAtZero: true, title: { display: true, text: "Count of Units" } },
    },
  };

  const kpis = [
    { title: "Total Units", value: kpiData.totalUnits, icon: Building, color: "blue" },
    { title: "Available Units", value: kpiData.availableUnits, icon: Home, color: "green" },
    { title: "Sold Units", value: kpiData.soldUnits, icon: Package, color: "indigo" },
    { title: "Rented Units", value: kpiData.rentedUnits, icon: KeyRound, color: "amber" },
  ];

  const doughnutOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: "bottom" } },
  };

  const propertyOptions = useMemo(() => {
    return (allProperties || []).map(p => ({
      id: p.propertyId, 
      name: p.propertyName,
    }));
  }, [allProperties]);

  const handleClearUnitFilters = () => {
    setPropertyFilter("");
    setStatusFilter("");
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <div className="flex items-center gap-2 col-span-1 md:col-span-2 lg:col-span-3">
             <Filter className="w-5 h-5 text-gray-700" />
            <span className="text-lg font-semibold text-gray-700">
              Unit Filters
            </span>
          </div>
          
          <label>
            <span className="text-sm font-medium">Property:</span>
            <select 
              className="input w-full mt-1" 
              disabled={vizLoading}
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
            >
              <option value="">All Properties</option>
              {propertyOptions.map(prop => (
                <option key={prop.id} value={prop.id}>{prop.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-sm font-medium">Unit Status:</span>
            <select 
              className="input w-full mt-1" 
              disabled={vizLoading}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="rented">Rented</option>
            </select>
          </label>
          
          <div>
            <span className="text-sm font-medium invisible">Clear</span>
            <button 
              onClick={handleClearUnitFilters} 
              disabled={vizLoading} 
              className="flex items-center justify-center w-full input bg-gray-100 hover:bg-gray-200 mt-1 text-gray-700"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} title={kpi.title} value={kpi.value || 0} icon={kpi.icon} color={kpi.color} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ChartCard title={propertyFilter || statusFilter ? "Unit Status (Filtered)" : "Unit Status (Global)"} vizLoading={vizLoading}>
            <Doughnut data={unitStatusData} options={doughnutOptions} />
          </ChartCard>
        </div>
        <div className="md:col-span-1 lg:col-span-2">
          <ChartCard title={propertyFilter ? "Unit Status for Selected Property" : "Unit Status by Property"} vizLoading={vizLoading}>
            <Bar data={unitStatusByPropData} options={unitStatusByPropOptions} />
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

// #endregion

// #region Main Reports Component

export default function Reports() {
  const [activeTab, setActiveTab] = useState("sales");

  const currentTab = useMemo(() => {
    switch (activeTab) {
      case "sales":
        return <SalesReport />;
      case "units":
        return <UnitsReport />;
      default:
        return <SalesReport />; 
    }
  }, [activeTab]);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-gray-50 min-h-screen">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Reports & Insights</h1>
        <p className="text-sm text-gray-500">Admin / Reports</p>
      </div>

      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="mt-6">
        {currentTab}
      </div>
    </div>
  );
}
// #endregion

