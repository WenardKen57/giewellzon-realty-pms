import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnalyticsAPI } from "../../api/analytics";
import { InquiriesAPI } from "../../api/inquiries";
import { SalesAPI } from "../../api/sales";
import { toast } from "react-toastify";

export default function DashboardPreview({ previewCount = 6 }) {
  const [metrics, setMetrics] = useState(null);
  const [recentInquiries, setRecentInquiries] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      // Parallel requests: analytics + small previews
      const [metricsRes, inquiriesRes, salesRes] = await Promise.all([
        AnalyticsAPI.dashboard().catch((e) => {
          console.warn("AnalyticsAPI.dashboard failed:", e);
          return null;
        }),
        InquiriesAPI.list({ limit: previewCount, sort: "-createdAt" }).catch(
          (e) => {
            console.warn("InquiriesAPI.list failed:", e);
            return null;
          }
        ),
        SalesAPI.list({ limit: previewCount, sort: "-createdAt" }).catch(
          (e) => {
            console.warn("SalesAPI.list failed:", e);
            return null;
          }
        ),
      ]);

      const normalize = (r) => {
        if (!r) return r;
        if (r && typeof r === "object" && "data" in r) return r.data;
        return r;
      };

      setMetrics(normalize(metricsRes) || (metricsRes ?? {}));
      setRecentInquiries(
        Array.isArray(normalize(inquiriesRes)) ? normalize(inquiriesRes) : []
      );
      setRecentSales(
        Array.isArray(normalize(salesRes)) ? normalize(salesRes) : []
      );
    } catch (err) {
      console.error("Dashboard load failed:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [previewCount]);

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
    salesTrend = [],
  } = metrics;

  const formatPeso = (num) =>
    `₱${Number(num || 0).toLocaleString(undefined, {
      maximumFractionDigits: 0,
    })}`;

  const occupancyPercent = totalUnits
    ? Math.round((soldUnits / totalUnits) * 100)
    : 0;

  return (
    <div className="p-6 space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-brand-primary">
            Dashboard Overview
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Snapshot of properties, sales and recent activity.
          </p>
        </div>

        {/* Small KPIs removed to avoid duplication with the InfoTiles below */}
        <div className="hidden" aria-hidden />
      </header>

      {/* Minimal Design Tiles for Buildings, Units, Pending Inquiries */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <InfoTile
            title="Buildings"
            value={buildingCount}
            description="Registered properties"
            variant="buildings"
            icon="buildings"
          />

          <InfoTile
            title="Units"
            value={totalUnits}
            description={`${availableUnits} available • ${soldUnits} sold`}
            variant="units"
            icon="units"
            // occupancy bar
            extra={
              <div className="mt-3">
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-gradient-to-r from-emerald-400 to-green-600"
                    style={{
                      width: `${Math.min(Math.max(occupancyPercent, 0), 100)}%`,
                    }}
                  />
                </div>
                <div className="mt-2 text-xs text-neutral-500">
                  Occupancy:{" "}
                  <span className="font-medium text-neutral-700">
                    {occupancyPercent}%
                  </span>
                </div>
              </div>
            }
          />

          <InfoTile
            title="Pending Inquiries"
            value={pendingInquiries}
            description="Unresolved customer inquiries"
            variant="inquiries"
            icon="inquiries"
          />
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">
          Key Metrics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Available Units"
            value={availableUnits}
            variant="units"
          />
          <StatCard title="Sold Units" value={soldUnits} variant="sold" />
          <StatCard title="Rented Units" value={rentedUnits} variant="rented" />
          <StatCard
            title="Closed Sales"
            value={totalClosedSales}
            variant="sales"
          />
        </div>
      </section>

      {/* Main grid: Sales performance (wide) + Recent Inquiries (right column) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <DecorativePie />
              <div>
                <h3 className="text-md font-semibold text-gray-700">
                  Sales Performance
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Summary of closed sales and revenue.
                </p>
              </div>
            </div>

            <div className="text-sm text-neutral-500 text-right">
              <div className="text-xs">Total Revenue</div>
              <div className="font-medium text-green-700">
                {formatPeso(totalClosedRevenue)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
            <MiniStat label="Revenue" value={formatPeso(totalClosedRevenue)} />
            <MiniStat label="Avg Sale" value={formatPeso(avgClosedSalePrice)} />
            <MiniStat
              label="Commission"
              value={formatPeso(totalCommissionPaid)}
            />
          </div>

          <p className="text-sm text-neutral-500 mt-3">
            Summary of closed deals, revenue and key sales.
          </p>
        </div>

        {/* RIGHT COLUMN: Recent Inquiries */}
        <div className="bg-white p-5 rounded-2xl shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <h3 className="text-md font-semibold text-gray-700">
                Recent Inquiries
              </h3>
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                {recentInquiries.length}
              </span>
            </div>
            <Link
              to="/admin/inquiries"
              className="text-sm text-brand-primary hover:underline"
            >
              See all
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto max-h-64 -mx-3 px-3">
            <RecentList
              items={recentInquiries}
              emptyMessage="No recent inquiries."
              type="inquiry"
              previewCount={previewCount}
              showStatus
              showAgent
              compact
            />
          </div>
        </div>
      </section>

      {/* FULL-WIDTH: Recent Sales moved here so it has more room */}
      <section className="bg-white p-5 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h3 className="text-md font-semibold text-gray-700">
              Recent Sales
            </h3>
            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
              {recentSales.length}
            </span>
          </div>
          <Link
            to="/admin/sales"
            className="text-sm text-brand-primary hover:underline"
          >
            See all
          </Link>
        </div>

        <div className="overflow-y-auto max-h-72 -mx-3 px-3">
          <RecentList
            items={recentSales}
            emptyMessage="No recent sales."
            type="sale"
            previewCount={previewCount}
            showStatus
            showAgent
            showAmount
            dense={false}
          />
        </div>
      </section>
    </div>
  );
}

/* ---------- New: InfoTile (minimal designs) ---------- */
function InfoTile({
  title,
  value,
  description,
  variant = "default",
  icon,
  extra,
}) {
  const gradient = tileGradient(variant);
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-50 flex items-start gap-4">
      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center ${gradient} flex-shrink-0`}
      >
        {tileIcon(icon)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          {/* [EDIT] Made label bold and darker */}
          <p className="text-sm font-semibold text-neutral-600">{title}</p>
          <div className="text-lg font-bold text-gray-900">{value ?? 0}</div>
        </div>
        <p className="text-xs text-neutral-500 mt-1 truncate">{description}</p>
        {extra}
      </div>
    </div>
  );
}

function tileGradient(variant) {
  switch (variant) {
    case "buildings":
      return "bg-gradient-to-br from-indigo-400 to-indigo-600";
    case "units":
      return "bg-gradient-to-br from-emerald-400 to-green-600";
    case "inquiries":
      return "bg-gradient-to-br from-rose-400 to-pink-600";
    default:
      return "bg-gray-300";
  }
}

function tileIcon(name) {
  const baseProps = {
    width: 20,
    height: 20,
    fill: "none",
    className: "text-white",
  };
  if (name === "buildings") {
    return (
      <svg {...baseProps} viewBox="0 0 24 24" aria-hidden>
        <path
          d="M3 21V7a1 1 0 0 1 1-1h12v16H3z"
          fill="rgba(255,255,255,0.92)"
        ></path>
        <path d="M21 21h-6V11h6v10z" fill="rgba(255,255,255,0.18)"></path>
      </svg>
    );
  }
  if (name === "units") {
    return (
      <svg {...baseProps} viewBox="0 0 24 24" aria-hidden>
        <rect
          x="3"
          y="4"
          width="18"
          height="6"
          rx="1.5"
          fill="rgba(255,255,255,0.9)"
        ></rect>
        <rect
          x="3"
          y="14"
          width="7"
          height="6"
          rx="1.5"
          fill="rgba(255,255,255,0.9)"
        ></rect>
      </svg>
    );
  }
  if (name === "inquiries") {
    return (
      <svg {...baseProps} viewBox="0 0 24 24" aria-hidden>
        <path
          d="M21 6v9a2 2 0 0 1-2 2H8l-5 4V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
          fill="rgba(255,255,255,0.92)"
        ></path>
      </svg>
    );
  }
  // fallback
  return (
    <svg {...baseProps} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M3 12h18"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ---------- Existing presentational components (unchanged behavior) ---------- */

function DecorativePie() {
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center flex-shrink-0">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        className="text-white"
      >
        <path d="M12 2v10l6 2a8 8 0 0 0-6-14z" fill="rgba(255,255,255,0.92)" />
      </svg>
    </div>
  );
}

function StatCard({ title, value, variant = "default" }) {
  const isMoney = typeof value === "string" && value.startsWith("₱");
  const gradient = variantToGradient(variant);

  return (
    <div className="p-4 bg-white border rounded-xl shadow-sm hover:shadow-md transition flex items-center gap-4">
      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center ${gradient}`}
      >
        {statIconSVG(variant)}
      </div>
      <div>
        {/* [EDIT] Made label bold and darker */}
        <p className="text-gray-600 text-sm font-semibold">{title}</p>
        <h2
          className={`mt-1 text-3xl font-bold ${
            isMoney ? "text-green-700" : "text-gray-900"
          }`}
        >
          {value ?? 0}
        </h2>
      </div>
    </div>
  );
}

function variantToGradient(variant) {
  switch (variant) {
    case "units":
      return "bg-gradient-to-br from-indigo-400 to-indigo-600";
    case "sold":
      return "bg-gradient-to-br from-rose-400 to-rose-600";
    case "rented":
      return "bg-gradient-to-br from-yellow-400 to-amber-600";
    case "sales":
      return "bg-gradient-to-br from-green-400 to-emerald-600";
    default:
      return "bg-gradient-to-br from-gray-300 to-gray-500";
  }
}

function statIconSVG(variant) {
  const base = { width: 20, height: 20, fill: "none", className: "text-white" };
  if (variant === "units") {
    return (
      <svg {...base} viewBox="0 0 24 24" aria-hidden>
        <rect
          x="3"
          y="3"
          width="18"
          height="7"
          rx="1.5"
          fill="white"
          opacity="0.9"
        />
        <rect
          x="3"
          y="14"
          width="7"
          height="7"
          rx="1.5"
          fill="white"
          opacity="0.9"
        />
      </svg>
    );
  }
  if (variant === "sold") {
    return (
      <svg {...base} viewBox="0 0 24 24" aria-hidden>
        <path
          d="M5 12h14"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 5v14"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (variant === "rented") {
    return (
      <svg {...base} viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="8" r="3" fill="white" opacity="0.95" />
        <rect
          x="5"
          y="13"
          width="14"
          height="6"
          rx="1"
          fill="white"
          opacity="0.95"
        />
      </svg>
    );
  }
  if (variant === "sales") {
    return (
      <svg {...base} viewBox="0 0 24 24" aria-hidden>
        <path d="M4 12a8 8 0 1 0 8-8v8z" fill="white" opacity="0.95" />
        <circle cx="17" cy="17" r="3" fill="rgba(255,255,255,0.18)" />
      </svg>
    );
  }
  return (
    <svg {...base} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M3 12h18"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="p-3 bg-gray-50 rounded-lg text-center border border-gray-100">
      <p className="text-xs text-neutral-500">{label}</p>
      <div className="text-sm font-medium mt-1">{value}</div>
    </div>
  );
}

function RecentList({
  items = [],
  emptyMessage = "No items.",
  type = "inquiry",
  previewCount = 6,
  showStatus = false,
  showAgent = false,
  showAmount = false,
  compact = false,
  dense = true,
}) {
  const formatPeso = (num) =>
    `₱${Number(num || 0).toLocaleString(undefined, {
      maximumFractionDigits: 0,
    })}`;

  if (!items || items.length === 0) {
    return <div className="text-sm text-neutral-500 p-2">{emptyMessage}</div>;
  }

  return (
    <div className="divide-y divide-gray-100">
      {items.slice(0, previewCount).map((it, idx) => {
        const id = it.id || it._id || it.inquiryId || it.saleId || it.reference;
        const title =
          it.subject ||
          it.propertyName ||
          it.buildingName ||
          it.customerName ||
          it.clientName ||
          (type === "sale" && (it.reference || `Sale #${id}`)) ||
          `#${id}`;
        const subtitle =
          it.message?.slice(0, 80) ||
          it.unitName ||
          it.propertyAddress ||
          (it.amount ? `Amount: ${formatPeso(it.amount)}` : "");
        const date = it.createdAt || it.date || it.saleDate || it.inquiryDate;
        const status = it.status || it.state || it.inquiryStatus;
        const agent = it.assignedTo?.name || it.agentName || it.assignedAgent;
        const amount = it.amount || it.price || it.total || it.saleAmount;

        const to =
          type === "inquiry"
            ? `/admin/inquiries`
            : type === "sale"
            ? `/admin/sales/${id}`
            : "#";

        return (
          <Link
            key={String(id || idx)}
            to={to}
            className={`flex items-start gap-3 p-3 hover:bg-green-50 transition ${
              compact ? "py-2" : ""
            }`}
          >
            <div className="w-10 h-10 rounded-md bg-brand-light flex items-center justify-center text-brand-primary font-semibold flex-shrink-0">
              {String((title || "#")[0] || "#").toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {title}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1 truncate">
                    {subtitle}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {showAgent && agent && (
                    <span className="text-xs text-neutral-500 truncate max-w-[90px]">
                      {agent}
                    </span>
                  )}

                  {showAmount && amount != null && (
                    <div className="text-sm font-medium text-green-700 whitespace-nowrap">
                      {formatPeso(amount)}
                    </div>
                  )}

                  {showStatus && status && (
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadgeClass(
                        status
                      )}`}
                    >
                      {status}
                    </span>
                  )}

                  <p className="text-xs text-neutral-500">
                    {formatShortDate(date)}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function statusBadgeClass(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("pending")) return "bg-yellow-100 text-yellow-800";
  if (
    s.includes("handled") ||
    s.includes("closed") ||
    s.includes("done") ||
    s.includes("completed")
  )
    return "bg-green-100 text-green-800";
  if (s.includes("rejected") || s.includes("cancel"))
    return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-700";
}

function formatShortDate(iso) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}
