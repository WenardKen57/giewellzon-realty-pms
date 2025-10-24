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
    // Added more filters state placeholders
    buyer: "",
    agentName: "",
    status: "",
    dateFrom: "",
    dateTo: "",
  });
  const [loading, setLoading] = useState(true); // Added loading state

  async function load() {
    setLoading(true); // Set loading true at start
    try {
      // Pass filters to the API call
      const r = await SalesAPI.list(filters);
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
      setLoading(false); // Set loading false at end
    }
  }

  // Reload sales when filters change via Apply button
  // useEffect(() => { load(); }, [filters]); // Removed - use explicit Apply button

  // Initial load
  useEffect(() => {
    load();
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

  return (
    <div className="p-6 space-y-6">
      {" "}
      {/* Increased spacing */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {" "}
        {/* Added flex-wrap and gap */}
        <h1 className="text-2xl font-semibold text-gray-800">
          Sales Management
        </h1>{" "}
        {/* Increased size */}
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditing(null);
            setOpenForm(true);
          }}
        >
          + Record New Sale
        </button>
      </div>
      {/* --- Filter Section --- */}
      <div className="p-4 space-y-4 bg-white border rounded-lg shadow-sm">
        <div className="text-lg font-medium text-gray-700">Filters</div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <input
            type="text"
            placeholder="Search Buyer..."
            className="input"
            value={filters.buyer}
            onChange={(e) =>
              setFilters((f) => ({ ...f, buyer: e.target.value }))
            }
          />
          <input
            type="text"
            placeholder="Search Agent Name..."
            className="input"
            value={filters.agentName}
            onChange={(e) =>
              setFilters((f) => ({ ...f, agentName: e.target.value }))
            }
          />
          <select
            className="input"
            value={filters.status}
            onChange={(e) =>
              setFilters((f) => ({ ...f, status: e.target.value }))
            }
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="closed">Closed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {/* Simple Date Inputs (Consider using react-datepicker for better UX) */}
          <input
            type="date"
            className="input"
            value={filters.dateFrom}
            onChange={(e) =>
              setFilters((f) => ({ ...f, dateFrom: e.target.value }))
            }
            title="Sale Date From"
          />
          <input
            type="date"
            className="input"
            value={filters.dateTo}
            onChange={(e) =>
              setFilters((f) => ({ ...f, dateTo: e.target.value }))
            }
            title="Sale Date To"
          />
        </div>
        <div className="flex justify-end">
          <button className="btn btn-outline" onClick={load} disabled={loading}>
            {loading ? "Applying..." : "Apply Filters"}
          </button>
        </div>
      </div>
      {/* --- End Filter Section --- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {" "}
        {/* Responsive grid for KPIs */}
        <Kpi title="Total Sales" value={stats.total} />
        <Kpi title="Total Revenue" value={formatCurrency(stats.revenue)} />
        <Kpi
          title="Total Commission"
          value={formatCurrency(stats.commission)}
        />
        <Kpi title="Avg. Sale Price" value={formatCurrency(stats.avg)} />
      </div>
      <div className="mt-4 overflow-x-auto bg-white rounded-lg shadow">
        {" "}
        {/* Added overflow-x-auto */}
        <table className="min-w-full w-full text-sm text-left text-gray-600">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100">
            <tr>
              <th scope="col" className="px-6 py-3">
                Property
              </th>
              <th scope="col" className="px-6 py-3">
                Unit
              </th>
              <th scope="col" className="px-6 py-3">
                Buyer
              </th>
              <th scope="col" className="px-6 py-3">
                Sale Date
              </th>
              <th scope="col" className="px-6 py-3">
                Closing Date
              </th>
              <th scope="col" className="px-6 py-3 text-right">
                Price
              </th>
              <th scope="col" className="px-6 py-3 text-center">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                  Loading sales...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                  No sales records found matching filters.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r._id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                    {r.propertyName}
                  </td>
                  <td className="px-6 py-4">
                    {r.unitNumber || r.unitId?.unitNumber || "N/A"}
                  </td>
                  <td className="px-6 py-4">{r.buyerName}</td>
                  <td className="px-6 py-4">{formatDate(r.saleDate)}</td>
                  <td className="px-6 py-4">{formatDate(r.closingDate)}</td>
                  <td className="px-6 py-4 text-right">
                    {formatCurrency(r.salePrice)}
                  </td>
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
                  <td className="px-6 py-4 flex justify-center gap-2">
                    {/* Actions */}
                    <button
                      title="Edit"
                      className="font-medium text-blue-600 hover:underline"
                      onClick={() => {
                        setEditing(r);
                        setOpenForm(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      title="Delete"
                      className="font-medium text-red-600 hover:underline"
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
                      className="font-medium text-gray-600 hover:underline"
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

// Updated KPI component styling
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
