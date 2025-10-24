import { useEffect, useState, useMemo } from "react";
import { AnalyticsAPI } from "../../api/analytics"; // Ensure this uses the updated analytics.js
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
} from "recharts";

const COLORS = ["#10B981", "#EF4444", "#F59E0B", "#4F46E5", "#8B5CF6"]; // Adjusted order for status

// Helper to format currency
const formatCurrency = (value) =>
  `₱ ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

// --- Linear regression helper (no changes needed) ---
function linearRegression(data, yKey) {
  // ... (same as before)
}

export default function Analytics() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  // Renamed filterStatus to trendStatus, default to 'closed'
  const [trendStatus, setTrendStatus] = useState("closed");
  const [trendDateField, setTrendDateField] = useState("closingDate"); // Default date field for trends

  const [dash, setDash] = useState({});
  const [trend, setTrend] = useState([]); // Raw trend data from API
  const [propPerf, setPropPerf] = useState([]); // Property performance data
  const [agentPerf, setAgentPerf] = useState([]); // Agent performance data

  const [loading, setLoading] = useState(true); // Combined loading state
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        // Updated API calls
        const [dashRes, trendRes, propPerfRes, agentPerfRes] =
          await Promise.all([
            AnalyticsAPI.dashboard(), // No params needed usually
            AnalyticsAPI.salesTrends({
              year,
              status: trendStatus,
              dateField: trendDateField,
            }),
            AnalyticsAPI.propertyPerformance(), // No params needed usually for overview
            AnalyticsAPI.agentPerformance({ status: "closed" }), // Default to closed sales for agent perf
          ]);

        if (!isMounted) return;

        setDash(dashRes || {});
        setTrend(trendRes?.trends || []); // API returns { trends: [...] }
        setPropPerf(propPerfRes || []);
        setAgentPerf(agentPerfRes || []);
      } catch (err) {
        if (!isMounted) return;
        console.error("Analytics fetch error:", err);
        setError("Failed to load analytics data.");
        // Clear data on error
        setDash({});
        setTrend([]);
        setPropPerf([]);
        setAgentPerf([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Debounce fetching slightly
    const timer = setTimeout(fetchData, 300);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [year, trendStatus, trendDateField]); // Re-fetch when filters change

  // --- Derived Data Calculations ---

  // Sales trend data formatted for charts (monthly only for now)
  const monthlyTrendData = useMemo(() => {
    if (!trend || trend.length === 0)
      return Array(12).fill({ month: "", sales: 0, revenue: 0 }); // Ensure 12 months

    const monthMap = new Map();
    for (let i = 1; i <= 12; i++) {
      monthMap.set(i, { month: `M${i}`, sales: 0, revenue: 0 });
    }
    trend.forEach((m) => {
      if (m.month) {
        // Ensure it's monthly data
        monthMap.set(m.month, {
          month: `M${m.month}`,
          sales: m.count || 0,
          revenue: m.totalRevenue || 0,
        });
      }
    });
    return Array.from(monthMap.values());
  }, [trend]);

  // Add projection line to monthly trend data
  const monthlyTrendWithProjection = useMemo(
    () => linearRegression(monthlyTrendData, "revenue"),
    [monthlyTrendData]
  );

  // Unit status distribution from dashboard data
  const unitStatusDistribution = useMemo(
    () =>
      [
        { name: "Available", value: dash.availableUnits || 0 },
        { name: "Sold", value: dash.soldUnits || 0 },
        { name: "Rented", value: dash.rentedUnits || 0 },
      ].filter((item) => item.value > 0), // Filter out zero values for cleaner chart
    [dash]
  );

  if (error)
    return <div className="py-10 text-center text-red-500">{error}</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">
        Reports & Analytics
      </h1>

      {/* --- Filters --- */}
      <div className="p-4 bg-white border rounded-lg shadow-sm">
        <div className="text-lg font-medium text-gray-700 mb-3">
          Sales Trend Filters
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <label className="flex items-center gap-2">
            <span className="text-sm font-medium">Year:</span>
            <select
              className="input w-28"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              disabled={loading}
            >
              {Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-sm font-medium">Status:</span>
            <select
              className="input w-32"
              value={trendStatus}
              onChange={(e) => setTrendStatus(e.target.value)}
              disabled={loading}
            >
              <option value="closed">Closed</option>
              <option value="pending">Pending</option>
              {/* <option value="cancelled">Cancelled</option> */}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span className="text-sm font-medium">Date Field:</span>
            <select
              className="input w-36"
              value={trendDateField}
              onChange={(e) => setTrendDateField(e.target.value)}
              disabled={loading}
            >
              <option value="closingDate">Closing Date</option>
              <option value="saleDate">Sale Date</option>
            </select>
          </label>
          {loading && <span className="text-sm text-gray-500">Loading...</span>}
        </div>
      </div>

      {/* --- KPI Cards --- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        {" "}
        {/* More KPIs */}
        <Kpi title="Total Buildings" value={dash.buildingCount ?? 0} />
        <Kpi title="Total Units" value={dash.totalUnits ?? 0} />
        <Kpi title="Available Units" value={dash.availableUnits ?? 0} />
        <Kpi title="Sold Units" value={dash.soldUnits ?? 0} />
        {/* <Kpi title="Rented Units" value={dash.rentedUnits ?? 0} /> */}
        <Kpi title="Closed Sales" value={dash.totalClosedSales ?? 0} />
        <Kpi
          title="Total Revenue (Closed)"
          value={formatCurrency(dash.totalClosedRevenue)}
        />
        <Kpi
          title="Avg. Sale Price (Closed)"
          value={formatCurrency(dash.avgClosedSalePrice)}
        />
        <Kpi
          title="Commission Paid (Closed)"
          value={formatCurrency(dash.totalCommissionPaid)}
        />
        <Kpi title="Pending Inquiries" value={dash.pendingInquiries ?? 0} />
      </div>

      {/* --- Charts --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar + Line Chart: Monthly Sales & Revenue */}
        <Card title={`Monthly Sales Performance (${year} - ${trendStatus})`}>
          {loading ? (
            <ChartPlaceholder />
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={monthlyTrendWithProjection}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis
                  fontSize={12}
                  tickFormatter={(val) => `₱${(val / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  formatter={(value, name) =>
                    name === "Sales Count" ? value : formatCurrency(value)
                  }
                />
                <Legend />
                <Bar dataKey="sales" fill="#4F46E5" name="Sales Count" />
                <Bar dataKey="revenue" fill="#10B981" name="Revenue" />
                <Line
                  type="monotone"
                  dataKey="projected"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  name="Projected Revenue"
                  dot={false}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Pie Chart: Unit Status Distribution */}
        <Card title="Unit Status Distribution">
          {loading ? (
            <ChartPlaceholder />
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={unitStatusDistribution}
                  dataKey="value"
                  nameKey="name"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={110}
                  cy="50%" // Center vertically
                >
                  {unitStatusDistribution.map((entry, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      fill={COLORS[idx % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => value.toLocaleString()} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* --- Property Performance Table --- */}
      <Card title="Property Performance (Based on Closed Sales)">
        {loading ? (
          <TablePlaceholder rows={5} cols={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full w-full text-sm text-left text-gray-600">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Property
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Total Units
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Available
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Closed Sales
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Total Revenue
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Avg. Price
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Commission Paid
                  </th>
                </tr>
              </thead>
              <tbody>
                {propPerf.map((p) => (
                  <tr
                    key={p.propertyId}
                    className="bg-white border-b hover:bg-gray-50"
                  >
                    <td className="px-4 py-2 font-medium text-gray-900">
                      {p.propertyName}
                    </td>
                    <td className="px-4 py-2 text-center">{p.totalUnits}</td>
                    <td className="px-4 py-2 text-center">
                      {p.availableUnits}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {p.totalClosedSales}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {formatCurrency(p.totalClosedRevenue)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {formatCurrency(p.avgClosedSalePrice)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {formatCurrency(p.totalCommissionPaid)}
                    </td>
                  </tr>
                ))}
                {propPerf.length === 0 && (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-4 py-4 text-center text-gray-500"
                    >
                      No property performance data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* --- Agent Performance Table --- */}
      <Card title="Agent Performance (Based on Closed Sales)">
        {loading ? (
          <TablePlaceholder rows={3} cols={5} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full w-full text-sm text-left text-gray-600">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Agent Name
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Closed Sales
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Total Revenue
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Avg. Sale Price
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Total Commission
                  </th>
                </tr>
              </thead>
              <tbody>
                {agentPerf.map((a) => (
                  <tr
                    key={a.agentName}
                    className="bg-white border-b hover:bg-gray-50"
                  >
                    <td className="px-4 py-2 font-medium text-gray-900">
                      {a.agentName}
                    </td>
                    <td className="px-4 py-2 text-right">{a.totalSales}</td>
                    <td className="px-4 py-2 text-right">
                      {formatCurrency(a.totalRevenue)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {formatCurrency(a.avgSalePrice)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {formatCurrency(a.totalCommission)}
                    </td>
                  </tr>
                ))}
                {agentPerf.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-4 py-4 text-center text-gray-500"
                    >
                      No agent performance data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// --- Reusable Components ---
function Kpi({ title, value }) {
  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="text-sm font-medium text-gray-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold text-brand-primary">
        {value}
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      {title && (
        <div className="mb-3 text-lg font-semibold text-gray-700">{title}</div>
      )}
      {children}
    </div>
  );
}

// Placeholder for charts while loading
function ChartPlaceholder() {
  return (
    <div className="flex items-center justify-center h-[350px] bg-gray-50 rounded text-gray-400">
      Loading Chart...
    </div>
  );
}
// Placeholder for tables while loading
function TablePlaceholder({ rows = 3, cols = 4 }) {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="h-10 bg-gray-200 rounded mb-2"></div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`h-8 bg-gray-100 rounded mb-1 ${
            i % 2 === 0 ? "opacity-75" : ""
          }`}
        ></div>
      ))}
    </div>
  );
}
