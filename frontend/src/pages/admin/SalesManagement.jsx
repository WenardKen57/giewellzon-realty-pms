import { useEffect, useState } from "react";
import { SalesAPI } from "../../api/sales";
import { SaleFormModal, SaleViewModal } from "./SalesModals";
import { toast } from "react-toastify";

// Helper to format currency
const formatCurrency = (value) =>
  `₱ ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
// Helper to format dates nicely
const formatDate = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "N/A";

export default function SalesManagement() {
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    revenue: 0,
    avg: 0,
    commission: 0,
  });
  const [openForm, setOpenForm] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [filters, setFilters] = useState({
    buyer: "",
    agentName: "",
    status: "",
    dateFrom: "",
    dateTo: "",
  });
  const [loading, setLoading] = useState(true);

  // load accepts an optional overrideFilters object.
  // If provided, it will be used for the API call instead of the component state.
  async function load(overrideFilters) {
    setLoading(true);
    try {
      const params = overrideFilters ?? filters;
      const r = await SalesAPI.list(params);
      setRows(r.data || []);
      setStats({
        total: r.total || 0,
        revenue: r.totalRevenue || 0,
        avg: r.avgSalePrice || 0,
        commission: r.totalCommission || 0,
      });
    } catch (err) {
      toast.error("Failed to load sales data.");
      console.error("Load Sales Error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(saleId, propertyName, unitNumber) {
    if (
      confirm(
        `Are you sure you want to delete the sale for ${propertyName} ${
          unitNumber || ""
        }? This will mark the unit as available again.`
      )
    ) {
      try {
        await SalesAPI.del(saleId);
        toast.success("Sale record deleted successfully!");
        load(); // Reload the list
      } catch (err) {
        toast.error("Failed to delete sale record.");
        console.error("Delete Sale Error:", err);
      }
    }
  }

  // Clear filters and immediately reload the list (no extra Apply click needed)
  function clearFilters() {
    const empty = {
      buyer: "",
      agentName: "",
      status: "",
      dateFrom: "",
      dateTo: "",
    };
    setFilters(empty);
    // Immediately reload using empty filters so UI updates right away
    load(empty);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Sales Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage sales records, export and review transactions</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-white font-semibold shadow-md transition transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-300"
            style={{
              background: "linear-gradient(90deg,#10B981 0%,#047857 100%)", // green gradient preserved per request
            }}
            onClick={() => {
              setEditing(null);
              setOpenForm(true);
            }}
          >
            <IconPlus className="w-4 h-4" />
            Record New Sale
          </button>
        </div>
      </div>

      {/* COMPACT FILTER ROW */}
      <div className="p-3 bg-white border rounded-lg shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <CompactFilter
            value={filters.buyer}
            onChange={(v) => setFilters((f) => ({ ...f, buyer: v }))}
            placeholder="Buyer"
            icon={<IconSearch className="w-4 h-4 text-gray-400" />}
          />

          <CompactFilter
            value={filters.agentName}
            onChange={(v) => setFilters((f) => ({ ...f, agentName: v }))}
            placeholder="Agent"
            icon={<IconUser className="w-4 h-4 text-gray-400" />}
          />

          <div className="w-40">
            <select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              className="w-full h-10 pl-3 pr-8 rounded-lg border border-gray-200 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="closed">Closed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
              className="h-10 pl-3 pr-3 rounded-lg border border-gray-200 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
              title="From"
            />
            <span className="text-xs text-gray-400">—</span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
              className="h-10 pl-3 pr-3 rounded-lg border border-gray-200 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
              title="To"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={clearFilters}
              className="px-3 py-2 rounded-md text-sm font-medium bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 transition"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => load()}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 text-white font-semibold shadow hover:opacity-95 disabled:opacity-60 transition"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
                  </svg>
                  Applying...
                </>
              ) : (
                <>
                  <IconFilter className="w-4 h-4" />
                  Apply
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* KPI CARDS - compact with lucide icons, gradient icon background and subtle shadows */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCompact title="Total Sales" value={stats.total} icon={<IconShoppingCart />} gradient="bg-gradient-to-tr from-indigo-500 to-cyan-400" />
        <KpiCompact title="Total Revenue" value={formatCurrency(stats.revenue)} icon={<IconDollarSign />} gradient="bg-gradient-to-tr from-emerald-400 to-teal-400" />
        <KpiCompact title="Total Commission" value={formatCurrency(stats.commission)} icon={<IconPercent />} gradient="bg-gradient-to-tr from-amber-400 to-orange-500" />
        <KpiCompact title="Avg. Sale Price" value={formatCurrency(stats.avg)} icon={<IconTrendingUp />} gradient="bg-gradient-to-tr from-sky-400 to-indigo-500" />
      </div>

      {/* TABLE */}
      <div className="mt-4 overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full w-full text-sm text-left text-gray-600">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">Property</th>
              <th scope="col" className="px-6 py-3">Unit</th>
              <th scope="col" className="px-6 py-3">Buyer</th>
              <th scope="col" className="px-6 py-3">Sale Date</th>
              <th scope="col" className="px-6 py-3">Closing Date</th>
              <th scope="col" className="px-6 py-3 text-right">Price</th>
              <th scope="col" className="px-6 py-3 text-center">Status</th>
              <th scope="col" className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="px-6 py-8 text-center text-gray-500">Loading sales...</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-8 text-center text-gray-500">No sales records found matching filters.</td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r._id} className="bg-white border-b hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">{r.propertyName}</td>
                  <td className="px-6 py-4">{r.unitNumber || r.unitId?.unitNumber || "N/A"}</td>
                  <td className="px-6 py-4">{r.buyerName}</td>
                  <td className="px-6 py-4">{formatDate(r.saleDate)}</td>
                  <td className="px-6 py-4">{formatDate(r.closingDate)}</td>
                  <td className="px-6 py-4 text-right">{formatCurrency(r.salePrice)}</td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`capitalize text-xs font-semibold rounded-full px-2.5 py-0.5 ${
                        r.status === "closed"
                          ? "bg-emerald-100 text-emerald-800"
                          : r.status === "pending"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex justify-center gap-3">
                    <button
                      title="Edit"
                      className="text-sm font-medium text-indigo-600 hover:underline"
                      onClick={() => {
                        setEditing(r);
                        setOpenForm(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      title="Delete"
                      className="text-sm font-medium text-red-600 hover:underline"
                      onClick={() =>
                        handleDelete(
                          r._id,
                          r.propertyName,
                          r.unitNumber || r.unitId?.unitNumber
                        )
                      }
                    >
                      Delete
                    </button>
                    <button
                      title="View"
                      className="text-sm font-medium text-gray-600 hover:underline"
                      onClick={() => {
                        setViewing(r);
                        setOpenView(true);
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <SaleFormModal
        open={openForm}
        onClose={(reload) => {
          setOpenForm(false);
          setEditing(null);
          if (reload) load();
        }}
        editing={editing}
      />
      <SaleViewModal
        open={openView}
        onClose={() => {
          setOpenView(false);
          setViewing(null);
        }}
        data={viewing}
      />
    </div>
  );
}

/* ---------- Presentational components ---------- */

/* CompactFilter - smaller single-line filter */
function CompactFilter({ value, onChange, placeholder, icon }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-100">
        {icon}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-[160px] w-40 sm:w-48 lg:w-56 text-sm px-2 py-2 rounded-lg border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
      />
    </div>
  );
}

/* KpiCompact - smaller, cleaner KPI with lucide-like icon and gradient circle */
function KpiCompact({ title, value, icon, gradient = "bg-gradient-to-tr from-indigo-500 to-cyan-400" }) {
  return (
    <div className="flex items-center gap-4 p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
      <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-white shadow-sm ${gradient}`}>
        {/* icon is an element (SVG) */}
        <div className="w-6 h-6">
          {icon}
        </div>
      </div>

      <div>
        <div className="text-xs font-medium text-gray-500">{title}</div>
        <div className="mt-1 text-lg font-semibold text-gray-800">{value}</div>
      </div>
    </div>
  );
}

/* ---------- Lucide-like inline SVG icons (kept small, crisp) ---------- */
function IconPlus({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconSearch({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconUser({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconFilter({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M22 4H2l8 8v6l4 2v-8l8-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconShoppingCart({ className = "w-6 h-6 text-white" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6h15l-1.5 9h-13L4 3H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="20" r="1" fill="currentColor" />
      <circle cx="19" cy="20" r="1" fill="currentColor" />
    </svg>
  );
}
function IconDollarSign({ className = "w-6 h-6 text-white" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 1v22" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17 6.5A5 5 0 0012 4a5 5 0 00-5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 17.5A5 5 0 0012 20a5 5 0 005-2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconPercent({ className = "w-6 h-6 text-white" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="17" cy="17" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M21 3L3 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
function IconTrendingUp({ className = "w-6 h-6 text-white" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 17l6-6 4 4 8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 7h6v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}