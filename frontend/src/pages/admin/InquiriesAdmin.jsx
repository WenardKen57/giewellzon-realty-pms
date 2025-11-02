import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Mail, Search, Filter, X, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { InquiriesAPI } from "../../api/inquiries";
import { toast } from "react-toastify";

// #region Helper Components

function KpiCard({ label, value, color = "blue" }) {
  const colorClasses = {
    green: "bg-gradient-to-br from-green-500 to-green-700",
    blue: "bg-gradient-to-br from-blue-500 to-blue-700",
    indigo: "bg-gradient-to-br from-indigo-500 to-indigo-700",
    purple: "bg-gradient-to-br from-purple-500 to-purple-700",
    amber: "bg-gradient-to-br from-amber-500 to-amber-600",
    yellow: "bg-gradient-to-br from-yellow-500 to-yellow-600",
    gray: "bg-gradient-to-br from-gray-500 to-gray-700",
  };
  const gradient = colorClasses[color] || colorClasses.blue;

  return (
    <div className={`p-5 rounded-lg shadow-sm text-white ${gradient}`}>
      <p className="text-sm font-medium text-white/90 truncate">{label}</p>
      <p className="text-2xl md:text-3xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

function FilterInput({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input {...props} className="input w-full pl-10" />
    </div>
  );
}

function FilterSelect({ icon: Icon, value, onChange, disabled, children }) {
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <select
        className="input w-full pl-10"
        value={value}
        onChange={onChange}
        disabled={disabled}
      >
        {children}
      </select>
    </div>
  );
}

function timeSince(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const intervals = [
    [60 * 60 * 24, "day"],
    [60 * 60, "hour"],
    [60, "minute"],
    [1, "second"],
  ];
  for (const [secs, label] of intervals) {
    const val = Math.floor(seconds / secs);
    if (val >= 1) return `${val} ${label}${val > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

// #endregion

// #region Pagination Hook + Component
const DOTS = "...";

function usePagination({ totalCount, pageSize, siblingCount = 1, currentPage }) {
  const paginationRange = useMemo(() => {
    const totalPageCount = Math.ceil(totalCount / pageSize);
    const totalPageNumbers = siblingCount + 5;

    if (totalPageNumbers >= totalPageCount) {
      return Array.from({ length: totalPageCount }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(
      currentPage + siblingCount,
      totalPageCount
    );

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPageCount - 2;

    const firstPageIndex = 1;
    const lastPageIndex = totalPageCount;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      let leftItemCount = 3 + 2 * siblingCount;
      let leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
      return [...leftRange, DOTS, totalPageCount];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      let rightItemCount = 3 + 2 * siblingCount;
      let rightRange = Array.from(
        { length: rightItemCount },
        (_, i) => totalPageCount - rightItemCount + i + 1
      );
      return [firstPageIndex, DOTS, ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      let middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      );
      return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex];
    }

    return [];
  }, [totalCount, pageSize, siblingCount, currentPage]);

  return paginationRange;
}

function Pagination({ onPageChange, totalCount, currentPage, pageSize }) {
  const paginationRange = usePagination({
    currentPage,
    totalCount,
    pageSize,
  });

  if (currentPage === 0 || paginationRange.length < 2) return null;

  const onNext = () => onPageChange(currentPage + 1);
  const onPrevious = () => onPageChange(currentPage - 1);
  const lastPage = paginationRange[paginationRange.length - 1];

  const base = "flex items-center justify-center w-9 h-9 rounded-md text-sm font-medium";
  const pageClass = (page) =>
    `${base} ${
      page === currentPage
        ? "bg-brand-primary text-white"
        : "text-gray-700 bg-white border hover:bg-gray-50"
    }`;

  return (
    <nav className="flex items-center justify-between mt-6">
      <button
        className={`${base} border hover:bg-gray-50 ${
          currentPage === 1 && "opacity-50 cursor-not-allowed"
        }`}
        onClick={onPrevious}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <ul className="flex items-center gap-1.5">
        {paginationRange.map((pageNumber, i) =>
          pageNumber === DOTS ? (
            <li key={i} className="text-gray-500 px-2">
              ...
            </li>
          ) : (
            <li key={pageNumber}>
              <button
                className={pageClass(pageNumber)}
                onClick={() => onPageChange(pageNumber)}
              >
                {pageNumber}
              </button>
            </li>
          )
        )}
      </ul>
      <button
        className={`${base} border hover:bg-gray-50 ${
          currentPage === lastPage && "opacity-50 cursor-not-allowed"
        }`}
        onClick={onNext}
        disabled={currentPage === lastPage}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}

// #endregion

export default function InquiriesAdmin() {
  // --- State ---
  const [tab, setTab] = useState("all");
  const [allInquiries, setAllInquiries] = useState([]); // Master list
  const [loading, setLoading] = useState(true);

  // committed filters (affect the list & metrics)
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [filterMode, setFilterMode] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [metrics, setMetrics] = useState({ total: 0, pending: 0, interested: 0, closed: 0 });

  // draft filters (used in the UI until user presses "Apply")
  const [draftSearch, setDraftSearch] = useState("");
  const [draftTypeFilter, setDraftTypeFilter] = useState("all");
  const [draftFilterMode, setDraftFilterMode] = useState("all");
  const [draftSelectedMonth, setDraftSelectedMonth] = useState("");
  const [draftSelectedYear, setDraftSelectedYear] = useState(new Date().getFullYear());

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);
  const inquiryTypes = [
    { key: "all", label: "All Types" },
    { key: "general", label: "General" },
    { key: "property", label: "Property" },
    { key: "unit", label: "Unit" }
  ];
  const statuses = [
    "all", "pending", "viewed", "contacted", "interested", "not_interested", "closed", "archived",
  ];

  // --- Data Loading ---
  async function load() {
    try {
      setLoading(true);
      const res = await InquiriesAPI.list({}); // Fetch ALL
      let data = res?.data ?? res ?? [];
      setAllInquiries(data);
    } catch (err) {
      console.error("Failed to load inquiries:", err);
      toast.error("Failed to load inquiries.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []); // Load once on mount

  // Initialize drafts from committed filters when inquiries load (or when user navigates)
  useEffect(() => {
    setDraftSearch(search);
    setDraftTypeFilter(typeFilter);
    setDraftFilterMode(filterMode);
    setDraftSelectedMonth(selectedMonth);
    setDraftSelectedYear(selectedYear);
  }, [search, typeFilter, filterMode, selectedMonth, selectedYear]);

  // --- Filtering Logic (based on committed filters) ---
  const filteredRows = useMemo(() => {
    let data = allInquiries;

    // 1. Filter by Tab (Status)
    if (tab === "all") {
      data = data.filter((it) => it.status !== "archived");
    } else {
      data = data.filter((it) => it.status === tab);
    }

    // 2. Filter by Inquiry Type
    if (typeFilter !== "all") {
      data = data.filter((it) => it.inquiryType === typeFilter);
    }

    // 3. Filter by Date
    if (filterMode !== "all") {
      const now = new Date();
      let dateFrom, dateTo;

      if (filterMode === "week") {
        const start = new Date(now);
        start.setDate(now.getDate() - 7);
        dateFrom = start.setHours(0,0,0,0);
        dateTo = now.setHours(23,59,59,999);
      } else if (filterMode === "month") {
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();
      } else if (filterMode === "year") {
        dateFrom = new Date(now.getFullYear(), 0, 1).getTime();
        dateTo = new Date(now.getFullYear(), 11, 31, 23, 59, 59).getTime();
      } else if (filterMode === "custom" && selectedMonth && selectedYear) {
        const monthIndex = months.indexOf(selectedMonth);
        if (monthIndex >= 0) {
          dateFrom = new Date(selectedYear, monthIndex, 1).getTime();
          dateTo = new Date(selectedYear, monthIndex + 1, 0, 23, 59, 59).getTime();
        }
      }

      if (dateFrom && dateTo) {
        data = data.filter((r) => {
          const rDate = new Date(r.createdAt).getTime();
          return rDate >= dateFrom && rDate <= dateTo;
        });
      }
    }

    // 4. Filter by Search
    if (search.trim().length) {
      const s = search.toLowerCase();
      data = data.filter((r) =>
        [r.firstName, r.lastName, r.customerEmail, r.propertyName, r.unitName, r.message]
          .filter(Boolean).join(" ").toLowerCase().includes(s)
      );
    }

    return data;
  }, [allInquiries, tab, typeFilter, filterMode, selectedMonth, selectedYear, search]);

  // --- Metrics Calculation ---
  useEffect(() => {
    setMetrics({
      total: filteredRows.length,
      pending: filteredRows.filter((r) => r.status === "pending").length,
      interested: filteredRows.filter((r) => r.status === "interested").length,
      closed: filteredRows.filter((r) => r.status === "closed").length,
    });
  }, [filteredRows]);

  // --- Pagination Logic ---
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    return filteredRows.slice(startIndex, endIndex);
  }, [filteredRows, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredRows.length]);

  // --- Handlers ---
  function handleStatusChange(id, newStatus) {
    setAllInquiries((prev) => 
      prev.map((row) => (row._id === id ? { ...row, status: newStatus } : row))
    );
    if (newStatus !== tab && tab !== "all") {
      setTab(newStatus);
    }
  }

  function clearFilters() {
    // Clear both committed filters and drafts
    setFilterMode("all");
    setSelectedMonth("");
    setSelectedYear(new Date().getFullYear());
    setTypeFilter("all");
    setSearch("");

    setDraftFilterMode("all");
    setDraftSelectedMonth("");
    setDraftSelectedYear(new Date().getFullYear());
    setDraftTypeFilter("all");
    setDraftSearch("");
  }

  function applyFilters() {
    // Commit drafts to the real filters
    setSearch(draftSearch);
    setTypeFilter(draftTypeFilter);
    setFilterMode(draftFilterMode);
    setSelectedMonth(draftSelectedMonth);
    setSelectedYear(draftSelectedYear);
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Inquiry Management</h1>
        <p className="text-sm text-gray-500 mt-1">View and update customer inquiries</p>
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard label="Total" value={metrics.total} color="blue" />
        <KpiCard label="Pending" value={metrics.pending} color="yellow" />
        <KpiCard label="Interested" value={metrics.interested} color="green" />
        <KpiCard label="Closed" value={metrics.closed} color="gray" />
      </section>
      
      {/* Tab Bar */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex flex-wrap gap-x-6 gap-y-2">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => setTab(status)}
              className={`py-3 px-1 border-b-2 text-sm font-medium ${
                tab === status
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
            </button>
          ))}
        </nav>
      </div>

      {/* Filter Bar (with drafts + Apply + global Clear All) */}
      <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-end">
          <div className="flex items-center gap-2 col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4">
            <Filter className="w-5 h-5 text-gray-700" />
            <span className="text-lg font-semibold text-gray-700">
              Filters
            </span>
          </div>

          <label>
            <span className="text-sm font-medium">Search</span>
            <FilterInput
              icon={Search}
              type="text"
              placeholder="Search by name, email, property..."
              value={draftSearch}
              onChange={e => setDraftSearch(e.target.value)}
            />
          </label>
          
          <label>
            <span className="text-sm font-medium">Inquiry Type</span>
            <FilterSelect
              icon={Mail}
              value={draftTypeFilter}
              onChange={(e) => setDraftTypeFilter(e.target.value)}
            >
              {inquiryTypes.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </FilterSelect>
          </label>
          
          <label>
            <span className="text-sm font-medium">Date Range</span>
            <select
              className="input w-full"
              value={draftFilterMode}
              onChange={(e) => setDraftFilterMode(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="custom">Specific Month</option>
            </select>
          </label>

          {draftFilterMode === "custom" ? (
            <>
              <label>
                <span className="text-sm font-medium">Month</span>
                <select
                  className="input w-full"
                  value={draftSelectedMonth}
                  onChange={(e) => setDraftSelectedMonth(e.target.value)}
                >
                  <option value="">Select Month</option>
                  {months.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="text-sm font-medium">Year</span>
                <select
                  className="input w-full"
                  value={draftSelectedYear}
                  onChange={(e) => setDraftSelectedYear(Number(e.target.value))}
                >
                  {years.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </label>
            </>
          ) : (
            <div /> // Placeholder to keep grid aligned
          )}
          
          <div className="flex gap-2 items-center">
            <button
              type="button"
              onClick={applyFilters}
              className="px-3 py-2 rounded-md bg-brand-primary text-white hover:opacity-95"
            >
              Apply
            </button>

            <button
              type="button"
              onClick={clearFilters}
              className="px-3 py-2 rounded-md border bg-white hover:bg-gray-50 text-gray-700 flex items-center"
              title="Clear all filters and drafts"
            >
              <X className="w-4 h-4 mr-2" />
              Clear All
            </button>
          </div>
        </div>
      </div>
      
      <div className="text-sm text-gray-500">
        Showing {paginatedRows.length} of {filteredRows.length} {filteredRows.length === 1 ? "inquiry" : "inquiries"}
      </div>

      {/* Paginated List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center text-sm text-gray-500 py-12 bg-white border rounded-lg">
            Loading inquiries...
          </div>
        ) : paginatedRows.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-12 bg-white border rounded-lg">
            No inquiries found matching your criteria.
          </div>
        ) : (
          paginatedRows.map((r) => (
            <InquiryRow key={r._id} r={r} onStatusChange={handleStatusChange} />
          ))
        )}
      </div>

      {/* Pagination Component */}
      <Pagination
        currentPage={currentPage}
        totalCount={filteredRows.length}
        pageSize={PAGE_SIZE}
        onPageChange={page => setCurrentPage(page)}
      />
    </div>
  );
}

// Redesigned InquiryRow
function InquiryRow({ r, onStatusChange }) {
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    viewed: "bg-blue-100 text-blue-800 border-blue-200",
    contacted: "bg-sky-100 text-sky-800 border-sky-200",
    interested: "bg-emerald-100 text-emerald-800 border-emerald-200",
    not_interested: "bg-red-100 text-red-800 border-red-200",
    closed: "bg-gray-100 text-gray-700 border-gray-200",
    archived: "bg-gray-200 text-gray-600 border-gray-300",
  };

  const [updating, setUpdating] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  async function handleChange(e) {
    const newStatus = e.target.value;
    setUpdating(true);
    try {
      await InquiriesAPI.updateStatus(r._id, newStatus);
      onStatusChange(r._id, newStatus);
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error("Failed to update status.");
    } finally {
      setUpdating(false);
    }
  }

  // auto-mark as viewed when opening if pending
  useEffect(() => {
    if (showDetails && r.status === "pending") {
      (async () => {
        try {
          await InquiriesAPI.updateStatus(r._id, "viewed");
          onStatusChange(r._id, "viewed");
        } catch {}
      })();
    }
    // eslint-disable-next-line
  }, [showDetails]);

  return (
    <article className="bg-white border rounded-lg shadow-sm">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 font-semibold text-sm">
              {((r.firstName || r.lastName) && `${(r.firstName || "").charAt(0)}${(r.lastName || "").charAt(0)}`) || "?"}
            </div>
          </div>
          <div className="min-w-0">
            <div className="font-medium text-gray-900 truncate">
              {[r.firstName, r.lastName].filter(Boolean).join(" ") || "—"}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="truncate">{r.customerEmail || "—"}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
            statusColors[r.status] || "bg-gray-100 text-gray-700"
          }`}>
            {r.status.replace("_", " ")}
          </span>
          <span className="text-xs bg-gray-50 px-2.5 py-0.5 inline-block rounded text-gray-600 border">
            {r.inquiryType || "Others"}
          </span>
          <select
            className="input text-sm h-9"
            value={r.status}
            onChange={handleChange}
            disabled={updating}
          >
            {Object.keys(statusColors).map((s) => (
              <option key={s} value={s}>
                {updating ? "Updating..." : `Set as ${s.replace("_", " ")}`}
              </option>
            ))}
          </select>
        </div>
      </header>
      
      <div className="p-4 border-t border-gray-100">
        <div className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-md p-3">
          {r.message ? r.message : <span className="italic text-gray-400">—</span>}
        </div>
      </div>
      
      <button
        className="w-full flex items-center justify-between p-3 text-sm text-gray-600 hover:bg-gray-50 border-t border-gray-100 rounded-b-lg"
        onClick={() => setShowDetails((v) => !v)}
      >
        <span>{showDetails ? "Hide" : "View"} Details</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
      </button>
      
      {showDetails && (
        <div className="border-t bg-gray-50 p-4 space-y-2">
          <div className="text-xs text-gray-600">
            <b>Date:</b>{" "}
            {r.createdAt
              ? new Date(r.createdAt).toLocaleString("en-PH", {
                  year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                })
              : "—"}{" "}
            {r.createdAt && (
              <span className="italic text-gray-400">({timeSince(r.createdAt)})</span>
            )}
          </div>
          {(r.propertyName || r.unitName) && (
            <div className="text-xs text-gray-600">
              {r.propertyName && (
                <>
                  <b>Property:</b>{" "}
                  <Link
                    className="text-blue-600 underline hover:text-blue-800"
                    to={`/properties/${r.propertyId ?? "#"}`}
                  >
                    {r.propertyName}
                  </Link>
                </>
              )}
              {r.unitName && (
                <>
                  <span className="mx-1 text-gray-400">/</span>
                  <b>Unit:</b>{" "}
                  <Link
                    className="text-blue-600 underline hover:text-blue-800"
                    to={`/unit/${r.unitId ?? "#"}`}
                  >
                    {r.unitName}
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

// #endregion