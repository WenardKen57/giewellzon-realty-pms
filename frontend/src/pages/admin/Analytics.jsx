import { useEffect, useState, useMemo } from "react";
import { AnalyticsAPI } from "../../api/analytics";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Pie, Line } from "react-chartjs-2";

const COLORS = ["#10B981", "#EF4444", "#F59E0B", "#4F46E5", "#8B5CF6"];

// Helper to format currency
const formatCurrency = (value) =>
  `₱ ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

// Linear regression helper (same as your previous version)
function linearRegression(data, yKey) {
  const n = data.length;
  const x = [];
  const y = [];
  data.forEach((pt, i) => {
    x.push(i + 1);
    y.push(pt[yKey] || 0);
  });
  const xMean = x.reduce((a, b) => a + b, 0) / n;
  const yMean = y.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - xMean) * (y[i] - yMean);
    den += (x[i] - xMean) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;
  const result = data.map((pt, i) => ({
    ...pt,
    projected: slope * (i + 1) + intercept,
  }));
  return result;
}

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend
);

export default function Analytics() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [trendStatus, setTrendStatus] = useState("closed");
  const [trendDateField, setTrendDateField] = useState("closingDate");

  const [dash, setDash] = useState({});
  const [trend, setTrend] = useState([]);
  const [propPerf, setPropPerf] = useState([]);
  const [agentPerf, setAgentPerf] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        const [dashRes, trendRes, propPerfRes, agentPerfRes] =
          await Promise.all([
            AnalyticsAPI.dashboard(),
            AnalyticsAPI.salesTrends({
              year,
              status: trendStatus,
              dateField: trendDateField,
            }),
            AnalyticsAPI.propertyPerformance(),
            AnalyticsAPI.agentPerformance({ status: "closed" }),
          ]);

        if (!isMounted) return;

        setDash(dashRes || {});
        setTrend(trendRes?.trends || []);
        setPropPerf(propPerfRes || []);
        setAgentPerf(agentPerfRes || []);
      } catch (err) {
        if (!isMounted) return;
        console.error("Analytics fetch error:", err);
        setError("Failed to load analytics data.");
        setDash({});
        setTrend([]);
        setPropPerf([]);
        setAgentPerf([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const timer = setTimeout(fetchData, 300);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [year, trendStatus, trendDateField]);

  // Derived data
  const monthlyTrendData = useMemo(() => {
    if (!trend || trend.length === 0) {
      return Array.from({ length: 12 }).map((_, i) => ({
        month: `M${i + 1}`,
        sales: 0,
        revenue: 0,
      }));
    }
    const monthMap = new Map();
    for (let i = 1; i <= 12; i++) {
      monthMap.set(i, { month: `M${i}`, sales: 0, revenue: 0 });
    }
    trend.forEach((m) => {
      if (m.month) {
        monthMap.set(m.month, {
          month: `M${m.month}`,
          sales: m.count || 0,
          revenue: m.totalRevenue || 0,
        });
      }
    });
    return Array.from(monthMap.values());
  }, [trend]);

  const monthlyTrendWithProjection = useMemo(
    () => linearRegression(monthlyTrendData, "revenue"),
    [monthlyTrendData]
  );

  const unitStatusDistribution = useMemo(
    () =>
      [
        { name: "Available", value: dash.availableUnits || 0 },
        { name: "Sold", value: dash.soldUnits || 0 },
        { name: "Rented", value: dash.rentedUnits || 0 },
      ].filter((item) => item.value > 0),
    [dash]
  );

  if (error) {
    return <div className="py-10 text-center text-red-500">{error}</div>;
  }

  // --- Chart.js data & options
  const barLineData = {
    labels: monthlyTrendWithProjection.map((d) => d.month),
    datasets: [
      {
        type: "bar",
        label: "Sales Count",
        data: monthlyTrendWithProjection.map((d) => d.sales),
        backgroundColor: "#4F46E5",
        yAxisID: "ySales",
      },
      {
        type: "bar",
        label: "Revenue",
        data: monthlyTrendWithProjection.map((d) => d.revenue),
        backgroundColor: "#10B981",
        yAxisID: "yRevenue",
      },
      {
        type: "line",
        label: "Projected Revenue",
        data: monthlyTrendWithProjection.map((d) => d.projected),
        borderColor: "#F59E0B",
        borderWidth: 2,
        fill: false,
        yAxisID: "yRevenue",
      },
    ],
  };

  const barLineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      ySales: {
        type: "linear",
        position: "left",
        beginAtZero: true,
        title: { display: true, text: "Sales Count" },
      },
      yRevenue: {
        type: "linear",
        position: "right",
        beginAtZero: true,
        title: { display: true, text: "Revenue (₱)" },
        ticks: {
          callback: (val) => `₱${(val / 1000000).toFixed(1)}M`,
        },
        grid: {
          drawOnChartArea: false,
        },
      },
      x: {
        title: { display: true, text: "Month" },
      },
    },
    plugins: {
      legend: { position: "bottom" },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || "";
            const value = context.raw;
            if (label.includes("Revenue")) {
              return `₱ ${value.toLocaleString()}`;
            }
            return `${value}`;
          },
        },
      },
    },
  };

  const pieData = {
    labels: unitStatusDistribution.map((u) => u.name),
    datasets: [
      {
        data: unitStatusDistribution.map((u) => u.value),
        backgroundColor: unitStatusDistribution.map(
          (_u, idx) => COLORS[idx % COLORS.length]
        ),
        borderColor: "#FFFFFF",
        borderWidth: 2,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const name = context.label;
            const value = context.parsed;
            return `${name}: ${value.toLocaleString()}`;
          },
        },
      },
    },
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">
        Reports & Analytics
      </h1>

      {/* Filters */}
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

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <Kpi title="Total Buildings" value={dash.buildingCount ?? 0} />
        <Kpi title="Total Units" value={dash.totalUnits ?? 0} />
        <Kpi title="Available Units" value={dash.availableUnits ?? 0} />
        <Kpi title="Sold Units" value={dash.soldUnits ?? 0} />
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title={`Monthly Sales Performance (${year} - ${trendStatus})`}>
          {loading ? (
            <ChartPlaceholder />
          ) : (
            <div className="h-[350px]">
              <Bar data={barLineData} options={barLineOptions} />
            </div>
          )}
        </Card>

        <Card title="Unit Status Distribution">
          {loading ? (
            <ChartPlaceholder />
          ) : (
            <div className="h-[350px]">
              <Pie data={pieData} options={pieOptions} />
            </div>
          )}
        </Card>
      </div>

      {/* Property Performance Table */}
      <Card title="Property Performance (Based on Closed Sales)">
        {loading ? (
          <TablePlaceholder rows={5} cols={7} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full w-full text-sm text-left text-gray-600">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr>
                  <th className="px-4 py-3">Property</th>
                  <th className="px-4 py-3">Total Units</th>
                  <th className="px-4 py-3">Available</th>
                  <th className="px-4 py-3 text-right">Closed Sales</th>
                  <th className="px-4 py-3 text-right">Total Revenue</th>
                  <th className="px-4 py-3 text-right">Avg. Price</th>
                  <th className="px-4 py-3 text-right">Commission Paid</th>
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

      {/* Agent Performance Table */}
      <Card title="Agent Performance (Based on Closed Sales)">
        {loading ? (
          <TablePlaceholder rows={3} cols={5} />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full w-full text-sm text-left text-gray-600">
              <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                <tr>
                  <th className="px-4 py-3">Agent Name</th>
                  <th className="px-4 py-3 text-right">Closed Sales</th>
                  <th className="px-4 py-3 text-right">Total Revenue</th>
                  <th className="px-4 py-3 text-right">Avg. Sale Price</th>
                  <th className="px-4 py-3 text-right">Total Commission</th>
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

// --- Reusable components ---
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

function ChartPlaceholder() {
  return (
    <div className="flex items-center justify-center h-[350px] bg-gray-50 rounded text-gray-400">
      Loading Chart...
    </div>
  );
}

function TablePlaceholder({ rows = 3, cols = 4 }) {
  return (
    <div className="animate-pulse space-y-1">
      <div className="h-8 bg-gray-200 rounded mb-2"></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`h-8 bg-gray-100 rounded ${
            i % 2 === 0 ? "opacity-75" : ""
          }`}
        ></div>
      ))}
    </div>
  );
}
