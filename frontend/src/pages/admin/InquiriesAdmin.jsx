import { useEffect, useState } from "react";
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

  const years = Array.from(
    { length: 6 },
    (_, i) => new Date().getFullYear() - i
  );

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
        const end = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59
        );
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
      setRows(res.data || res); // handle either { data } or array
    } catch (err) {
      console.error("Failed to load inquiries:", err);
    }
  }

  useEffect(() => {
    load();
  }, [tab, filterMode, selectedMonth, selectedYear]);

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Inquiry Management</h1>

      {/* Tabs (Status Filter) */}
      <div className="flex flex-wrap gap-2">
        {[
          "all",
          "pending",
          "viewed",
          "contacted",
          "interested",
          "not_interested",
          "closed",
          "archived",
        ].map((status) => (
          <Tab
            key={status}
            label={
              status === "all"
                ? "All"
                : status.charAt(0).toUpperCase() + status.slice(1)
            }
            active={tab === status}
            onClick={() => setTab(status)}
          />
        ))}
      </div>

      {/* Time Filter */}
      <div className="flex flex-wrap items-center gap-2 mt-4">
        <label className="text-sm text-gray-700 font-medium">Filter:</label>
        <select
          className="input text-sm w-44"
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
              className="input text-sm w-36"
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
              className="input text-sm w-28"
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
      </div>

      {/* Inquiry List */}
      <div className="space-y-3 mt-3">
        {rows.map((r) => (
          <InquiryRow key={r._id} r={r} reload={load} />
        ))}

        {rows.length === 0 && (
          <div className="text-center text-sm text-gray-500 py-6">
            No inquiries found for this range.
          </div>
        )}
      </div>
    </div>
  );
}

function InquiryRow({ r, reload }) {
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-700",
    viewed: "bg-blue-100 text-blue-700",
    contacted: "bg-sky-100 text-sky-700",
    interested: "bg-emerald-100 text-emerald-700",
    not_interested: "bg-red-100 text-red-700",
    closed: "bg-gray-200 text-gray-700",
    archived: "bg-gray-300 text-gray-600",
  };

  return (
    <div key={r._id} className="flex justify-between p-4 card">
      <div>
        <div className="font-medium">
          {[r.firstName, r.lastName].filter(Boolean).join(" ") || "—"}
        </div>
        <div className="text-xs text-neutral-500">
          {new Date(r.createdAt).toISOString().slice(0, 10)}
        </div>
        <div className="flex gap-3 mt-1 text-sm">
          <span>{r.customerEmail}</span>
          {r.customerPhone && <span>{r.customerPhone}</span>}
        </div>
        <div className="mt-2 text-sm">
          <span className="font-medium">Message:</span> {r.message || "—"}
        </div>
      </div>

      <div className="text-right">
        <div
          className={`inline-block text-xs rounded-full px-2 py-0.5 mb-2 ${
            statusColors[r.status] || "bg-gray-100 text-gray-500"
          }`}
        >
          {r.status}
        </div>

        <div className="text-xs bg-brand-light px-2 py-0.5 inline-block rounded">
          {r.inquiryType || "Others"}
        </div>

        <div className="mt-3">
          <select
            className="text-xs border rounded px-2 py-1 bg-white"
            value={r.status}
            onChange={async (e) => {
              await InquiriesAPI.updateStatus(r._id, e.target.value);
              reload();
            }}
          >
            {Object.keys(statusColors).map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function Tab({ active, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full ${
        active
          ? "bg-brand-gray font-medium"
          : "bg-brand-light hover:bg-brand-gray"
      }`}
    >
      {label}
    </button>
  );
}
