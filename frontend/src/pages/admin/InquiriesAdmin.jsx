import { useEffect, useState, useRef } from "react";
import { Mail } from "lucide-react";
import { InquiriesAPI } from "../../api/inquiries";

export default function InquiriesAdmin() {
  const [tab, setTab] = useState("all");
  const [rows, setRows] = useState([]);

  const [filterMode, setFilterMode] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

  async function load() {
    try {
      const now = new Date();
      let dateFrom, dateTo;

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

      const status = tab === "all" ? undefined : tab;
      const params = {};
      if (status) params.status = status;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const res = await InquiriesAPI.list(params);
      const data = res?.data ?? res ?? [];
      const filtered = tab === "all" ? data.filter((it) => it.status !== "archived") : data;
      setRows(filtered);
    } catch (err) {
      console.error("Failed to load inquiries:", err);
    }
  }

  useEffect(() => {
    load();
  }, [tab, filterMode, selectedMonth, selectedYear]);

  function handleStatusChange(id, newStatus) {
    setRows((prev) => {
      if (newStatus === "archived" && tab === "all") {
        return prev.filter((row) => row._id !== id);
      }
      return prev.map((row) => (row._id === id ? { ...row, status: newStatus } : row));
    });

    if (newStatus) {
      setTab(newStatus);
    }
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

      <div className="space-y-3">
        {rows.map((r) => (
          <InquiryRow key={r._id} r={r} onStatusChange={handleStatusChange} />
        ))}

        {rows.length === 0 && (
          <div className="text-center text-sm text-gray-500 py-12 bg-white border rounded-lg">
            No inquiries found for this range.
          </div>
        )}
      </div>
    </div>
  );
}

function InquiryRow({ r, onStatusChange }) {
  const statusColors = {
    pending: "bg-yellow-50 text-yellow-800",
    viewed: "bg-blue-50 text-blue-800",
    contacted: "bg-sky-50 text-sky-800",
    interested: "bg-emerald-50 text-emerald-800",
    not_interested: "bg-red-50 text-red-800",
    closed: "bg-gray-100 text-gray-700",
    archived: "bg-gray-200 text-gray-600",
  };

  const [updating, setUpdating] = useState(false);

  async function handleChange(e) {
    const newStatus = e.target.value;
    setUpdating(true);
    try {
      await InquiriesAPI.updateStatus(r._id, newStatus);
      onStatusChange(r._id, newStatus);
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <article className="bg-white border rounded-lg shadow-sm p-3 hover:shadow-md transition-shadow grid grid-cols-1 md:grid-cols-[1fr_170px] gap-3 items-start">
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-semibold text-sm">
            {((r.firstName || r.lastName) && `${(r.firstName || "").charAt(0)}${(r.lastName || "").charAt(0)}`) || "?"}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium text-gray-900 truncate">
                {[r.firstName, r.lastName].filter(Boolean).join(" ") || "—"}
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="truncate">{r.customerEmail || "—"}</span>
              </div>

              {/* 🗓️ Date Added */}
              <div className="mt-1 text-xs text-gray-500">
                {r.createdAt
                  ? new Date(r.createdAt).toLocaleString("en-PH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </div>
            </div>

            <div className="hidden md:flex flex-col items-end gap-2">
              <div
                className={`inline-flex items-center gap-2 text-xs font-medium rounded-full px-2.5 py-0.5 ${
                  statusColors[r.status] || "bg-gray-100 text-gray-700"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${
                  r.status === "archived" ? "bg-gray-400" :
                  r.status === "pending" ? "bg-yellow-600" :
                  r.status === "viewed" ? "bg-blue-600" :
                  r.status === "contacted" ? "bg-sky-600" :
                  r.status === "interested" ? "bg-emerald-600" :
                  r.status === "not_interested" ? "bg-red-600" :
                  "bg-gray-500"
                }`} />
                <span className="capitalize">{r.status.replace("_", " ")}</span>
              </div>

              <div className="text-xs bg-brand-light px-2 py-0.5 inline-block rounded text-gray-700">
                {r.inquiryType || "Others"}
              </div>
            </div>
          </div>

          <div className="mt-3">
            <div className="text-sm font-medium text-gray-800">Message</div>
            <div className="mt-1 text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-md p-3">
              {r.message ? r.message : <span className="italic text-gray-400">—</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-stretch md:items-end gap-2">
        <div className="md:hidden flex items-center gap-2">
          <div
            className={`inline-flex items-center gap-2 text-xs font-medium rounded-full px-2 py-0.5 ${
              statusColors[r.status] || "bg-gray-100 text-gray-700"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${
              r.status === "archived" ? "bg-gray-400" :
              r.status === "pending" ? "bg-yellow-600" :
              r.status === "viewed" ? "bg-blue-600" :
              r.status === "contacted" ? "bg-sky-600" :
              r.status === "interested" ? "bg-emerald-600" :
              r.status === "not_interested" ? "bg-red-600" :
              "bg-gray-500"
            }`} />
            <span className="capitalize">{r.status.replace("_", " ")}</span>
          </div>

          <div className="text-xs bg-brand-light px-2 py-0.5 inline-block rounded text-gray-700">
            {r.inquiryType || "Others"}
          </div>
        </div>

        <div className="w-full md:w-auto">
          <select
            className="w-full md:w-44 text-sm border rounded-md px-3 py-2 bg-white hover:border-gray-300 transition"
            value={r.status}
            onChange={handleChange}
            disabled={updating}
          >
            {Object.keys(statusColors).map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
      </div>
    </article>
  );
}

function Tab({ active, label, onClick, statusKey }) {
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
      type="button"
    >
      {label}
    </button>
  );
}
