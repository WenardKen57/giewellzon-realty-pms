import { useEffect, useState, useRef } from "react";
import { InquiriesAPI } from "../../api/inquiries";

export default function InquiriesAdmin() {
  const [tab, setTab] = useState("all");
  const [rows, setRows] = useState([]);

  // Filters
  const [filterMode, setFilterMode] = useState("all"); // all | week | month | year | custom
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

  // TOASTER state
  const [toast, setToast] = useState({ visible: false, message: "", type: "info" });
  const toastTimer = useRef(null);

  function showToast(message, type = "info", timeout = 3000) {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
      toastTimer.current = null;
    }
    setToast({ visible: true, message, type });
    toastTimer.current = setTimeout(() => {
      setToast((t) => ({ ...t, visible: false }));
      toastTimer.current = null;
    }, timeout);
  }

  async function load() {
    try {
      const now = new Date();
      let dateFrom, dateTo;

      // 🗓️ Compute date range
      if (filterMode === "week") {
        const start = new Date(now);
        start.setDate(now.getDate() - 7);
        dateFrom = start.toISOString();
        dateTo = now.toISOString();
      } else if (filterMode === "month") {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        dateFrom = start.toISOString();
        dateTo = end.toISOString();
      } else if (filterMode === "year") {
        const start = new Date(now.getFullYear(), 0, 1);
        const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        dateFrom = start.toISOString();
        dateTo = end.toISOString();
      } else if (filterMode === "custom" && selectedMonth && selectedYear) {
        const monthIndex = months.indexOf(selectedMonth);
        const start = new Date(selectedYear, monthIndex, 1);
        const end = new Date(selectedYear, monthIndex + 1, 0, 23, 59, 59);
        dateFrom = start.toISOString();
        dateTo = end.toISOString();
      }

      // 🧭 Status Filter
      const status = tab === "all" ? undefined : tab;

      // ✅ Combine filters
      const params = {};
      if (status) params.status = status;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const res = await InquiriesAPI.list(params);
      const data = res?.data ?? res ?? [];

      // If viewing "all", filter out archived items client-side
      const filtered = tab === "all" ? data.filter((it) => it.status !== "archived") : data;

      setRows(filtered);
    } catch (err) {
      console.error("Failed to load inquiries:", err);
      showToast("Failed to load inquiries", "error");
    }
  }

  useEffect(() => {
    load();
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, filterMode, selectedMonth, selectedYear]);

  // Called by child when status changes successfully
  function handleStatusChange(id, newStatus) {
    setRows((prev) => {
      if (newStatus === "archived" && tab === "all") {
        // remove archived item from "all" tab immediately
        return prev.filter((row) => row._id !== id);
      }
      // otherwise update status in-place
      return prev.map((row) => (row._id === id ? { ...row, status: newStatus } : row));
    });
  }

  const statuses = [
    "all",
    "pending",
    "viewed",
    "contacted",
    "interested",
    "not_interested",
    "closed",
    "archived",
  ];

  function clearFilters() {
    setFilterMode("all");
    setSelectedMonth("");
    setSelectedYear(new Date().getFullYear());
    // useEffect will re-run load due to filterMode/selectedMonth/selectedYear changes
  }

  return (
    <div className="p-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Inquiry Management</h1>
          <p className="text-sm text-gray-500 mt-1">View and update customer inquiries</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <div className="text-sm text-gray-600">Status</div>
            <div className="flex flex-wrap gap-2">
              {statuses.map((status) => (
                <Tab
                  key={status}
                  statusKey={status}
                  label={status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
                  active={tab === status}
                  onClick={() => setTab(status)}
                />
              ))}
            </div>
          </div>

          <div className="sm:hidden">
            {/* Mobile compact status selector */}
            <select
              className="input text-sm"
              value={tab}
              onChange={(e) => setTab(e.target.value)}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status === "all" ? "All" : status.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Filters panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-700 font-medium">Filter:</label>
          <div className="bg-white border rounded-lg shadow-sm px-3 py-2 flex items-center gap-3">
            <select
              className="text-sm outline-none"
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="custom">Specific Month</option>
            </select>

            {filterMode === "custom" && (
              <>
                <select
                  className="text-sm outline-none"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  <option value="">Select Month</option>
                  {months.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>

                <select
                  className="text-sm outline-none"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </>
            )}

            <button
              type="button"
              onClick={clearFilters}
              className="ml-2 text-sm px-3 py-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          Showing {rows.length} {rows.length === 1 ? "inquiry" : "inquiries"}
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {rows.map((r) => (
          <InquiryRow
            key={r._id}
            r={r}
            onStatusChange={handleStatusChange}
            showToast={showToast}
          />
        ))}

        {rows.length === 0 && (
          <div className="text-center text-sm text-gray-500 py-12 bg-white border rounded-lg">
            No inquiries found for this range.
          </div>
        )}
      </div>

      {/* Simple toaster */}
      {toast.visible && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed right-4 top-4 max-w-xs px-4 py-2 rounded shadow-md z-50 transform transition-all ${
            toast.type === "error"
              ? "bg-red-600 text-white"
              : toast.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-gray-800 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

function InquiryRow({ r, onStatusChange, showToast }) {
  const statusColors = {
    pending: "bg-yellow-50 text-yellow-800",
    viewed: "bg-blue-50 text-blue-800",
    contacted: "bg-sky-50 text-sky-800",
    interested: "bg-emerald-50 text-emerald-800",
    not_interested: "bg-red-50 text-red-800",
    closed: "bg-gray-100 text-gray-700",
    archived: "bg-gray-200 text-gray-600",
  };

  async function handleChange(e) {
    const newStatus = e.target.value;
    const prevStatus = r.status;
    try {
      // Optimistically update via callback so UI is responsive
      onStatusChange(r._id, newStatus);
      await InquiriesAPI.updateStatus(r._id, newStatus);
      showToast(`Status updated to "${newStatus.replace("_", " ")}"`, "success");
    } catch (err) {
      // revert optimistic update on failure
      onStatusChange(r._id, prevStatus);
      console.error("Failed to update status:", err);
      showToast("Failed to update status", "error");
    }
  }

  return (
    <article className="bg-white border rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow grid grid-cols-1 md:grid-cols-[1fr_200px] gap-4 items-start">
      <div className="flex gap-4">
        {/* Avatar / Placeholder */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-semibold">
            {((r.firstName || r.lastName) && `${(r.firstName || "").charAt(0)}${(r.lastName || "").charAt(0)}`) || "?"}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-medium text-gray-900 truncate">
                {[r.firstName, r.lastName].filter(Boolean).join(" ") || "—"}
              </div>
              <div className="text-xs text-gray-500">
                {new Date(r.createdAt).toISOString().slice(0, 10)}
              </div>
            </div>

            <div className="hidden md:flex flex-col items-end gap-2">
              <div
                className={`inline-flex items-center gap-2 text-xs font-medium rounded-full px-3 py-1 ${
                  statusColors[r.status] || "bg-gray-100 text-gray-700"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${r.status === "archived" ? "bg-gray-400" : r.status === "pending" ? "bg-yellow-600" : r.status === "viewed" ? "bg-blue-600" : r.status === "contacted" ? "bg-sky-600" : r.status === "interested" ? "bg-emerald-600" : r.status === "not_interested" ? "bg-red-600" : "bg-gray-500"}`} />
                <span className="capitalize">{r.status.replace("_", " ")}</span>
              </div>

              <div className="text-xs bg-brand-light px-2 py-0.5 inline-block rounded text-gray-700">
                {r.inquiryType || "Others"}
              </div>
            </div>
          </div>

          <div className="mt-3 text-sm text-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 text-xs text-gray-500">
              <span className="truncate">{r.customerEmail}</span>
              {r.customerPhone && <span className="truncate">• {r.customerPhone}</span>}
            </div>

            <div className="mt-3 text-sm text-gray-600">
              <span className="font-medium text-gray-800">Message:</span>{" "}
              <span className="block mt-1 text-sm text-gray-700">{r.message || "—"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-stretch md:items-end gap-3">
        {/* small badges for mobile */}
        <div className="md:hidden flex items-center gap-2">
          <div
            className={`inline-flex items-center gap-2 text-xs font-medium rounded-full px-3 py-1 ${
              statusColors[r.status] || "bg-gray-100 text-gray-700"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${r.status === "archived" ? "bg-gray-400" : r.status === "pending" ? "bg-yellow-600" : r.status === "viewed" ? "bg-blue-600" : r.status === "contacted" ? "bg-sky-600" : r.status === "interested" ? "bg-emerald-600" : r.status === "not_interested" ? "bg-red-600" : "bg-gray-500"}`} />
            <span className="capitalize">{r.status.replace("_", " ")}</span>
          </div>

          <div className="text-xs bg-brand-light px-2 py-0.5 inline-block rounded text-gray-700">
            {r.inquiryType || "Others"}
          </div>
        </div>

        <div className="w-full md:w-auto">
          <label className="sr-only">Change status</label>
          <select
            className="w-full md:w-48 text-sm border rounded-md px-3 py-2 bg-white hover:border-gray-300 transition"
            value={r.status}
            onChange={handleChange}
          >
            {Object.keys(statusColors).map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-gray-400 md:text-right">
          ID: {r._id}
        </div>
      </div>
    </article>
  );
}

/**
 * Tab - color coded by statusKey (visual only).
 * No behavior or logic changes.
 */
function Tab({ active, label, onClick, statusKey }) {
  // color map for tab states: neutral (inactive) vs active
  const tabTheme = {
    all: {
      inactiveBg: "bg-white",
      inactiveText: "text-gray-700",
      inactiveBorder: "border-gray-200",
      activeBg: "bg-gray-800",
      activeText: "text-white",
      activeRing: "ring-gray-300",
    },
    pending: {
      inactiveBg: "bg-yellow-50",
      inactiveText: "text-yellow-800",
      inactiveBorder: "border-yellow-200",
      activeBg: "bg-yellow-500",
      activeText: "text-white",
      activeRing: "ring-yellow-300",
    },
    viewed: {
      inactiveBg: "bg-blue-50",
      inactiveText: "text-blue-800",
      inactiveBorder: "border-blue-200",
      activeBg: "bg-blue-600",
      activeText: "text-white",
      activeRing: "ring-blue-300",
    },
    contacted: {
      inactiveBg: "bg-sky-50",
      inactiveText: "text-sky-800",
      inactiveBorder: "border-sky-200",
      activeBg: "bg-sky-600",
      activeText: "text-white",
      activeRing: "ring-sky-300",
    },
    interested: {
      inactiveBg: "bg-emerald-50",
      inactiveText: "text-emerald-800",
      inactiveBorder: "border-emerald-200",
      activeBg: "bg-emerald-600",
      activeText: "text-white",
      activeRing: "ring-emerald-300",
    },
    not_interested: {
      inactiveBg: "bg-red-50",
      inactiveText: "text-red-800",
      inactiveBorder: "border-red-200",
      activeBg: "bg-red-600",
      activeText: "text-white",
      activeRing: "ring-red-300",
    },
    closed: {
      inactiveBg: "bg-gray-100",
      inactiveText: "text-gray-700",
      inactiveBorder: "border-gray-200",
      activeBg: "bg-gray-700",
      activeText: "text-white",
      activeRing: "ring-gray-300",
    },
    archived: {
      inactiveBg: "bg-gray-100",
      inactiveText: "text-gray-600",
      inactiveBorder: "border-gray-200",
      activeBg: "bg-gray-600",
      activeText: "text-white",
      activeRing: "ring-gray-300",
    },
  };

  const theme = tabTheme[statusKey] || tabTheme.all;

  const base = `px-3 py-1.5 rounded-full text-sm border cursor-pointer transition-all flex items-center gap-2 font-semibold`;
  const inactiveClasses = `${theme.inactiveBg} ${theme.inactiveText} ${theme.inactiveBorder} hover:shadow-sm`;
  const activeClasses = `${theme.activeBg} ${theme.activeText} ${theme.activeRing} shadow`;

  return (
    <button
      onClick={onClick}
      className={`${base} ${active ? activeClasses : inactiveClasses}`}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}