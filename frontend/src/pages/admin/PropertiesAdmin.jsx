import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PropertiesAPI } from "../../api/properties";
import PropertyEditor from "./PropertyEditor";
import { toast } from "react-toastify";
import { Plus, Search, MapPin, Home, Eye, Edit3, Trash2, Filter, X } from "lucide-react"; // Added X icon


export default function PropertiesAdmin() {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // Filters: search, propertyType, location (location is a string like "City, Province" or plain location)
  const [filters, setFilters] = useState({
    search: "",
    propertyType: "",
    location: "",
  });

  // Dropdown options derived from loaded data
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [locations, setLocations] = useState([]);

  const [loading, setLoading] = useState(true);

  // --- NEW: State for delete confirmation modal ---
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null); // Stores { id, name }
  const [deleting, setDeleting] = useState(false); // Loading state for delete action

  function buildParamsFromFilters(f) {
    const params = {};

    if (f.search) params.search = f.search;
    if (f.propertyType) params.propertyType = f.propertyType;

    if (f.location) {
      const parts = f.location.split(",").map((s) => s.trim()).filter(Boolean);
      if (parts.length >= 2) {
        params.city = parts[0];
        params.province = parts.slice(1).join(", ");
      } else {
        params.location = f.location;
      }
    }

    return params;
  }

  async function load(overrideFilters) {
    setLoading(true);
    try {
      const f = overrideFilters ?? filters;
      const params = buildParamsFromFilters(f);

      const r = await PropertiesAPI.list({ ...params });
      const items = r.data || [];
      setList(items);

      const typesSet = new Set();
      const locSet = new Set();
      items.forEach((p) => {
        if (p.propertyType) typesSet.add(p.propertyType);
        const loc = p.city ? `${p.city}${p.province ? `, ${p.province}` : ""}` : p.location;
        if (loc) locSet.add(loc);
      });

      setPropertyTypes(Array.from(typesSet).sort((a, b) => a.localeCompare(b)));
      setLocations(Array.from(locSet).sort((a, b) => a.localeCompare(b)));
    } catch (err) {
      console.error("Failed loading properties", err);
      toast.error("Failed to load properties.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onClose(reload) {
    setOpen(false);
    setEditing(null);
    if (reload) load();
  }

  // --- UPDATED: This function now just OPENS the modal ---
  function handleDelete(id, name) {
    setPropertyToDelete({ id, name });
    setIsConfirmModalOpen(true);
  }

  // --- NEW: This function handles the actual deletion ---
  async function confirmDelete() {
    if (!propertyToDelete) return;

    setDeleting(true);
    try {
      await PropertiesAPI.del(propertyToDelete.id);
      toast.success(`Property "${propertyToDelete.name}" and all units deleted successfully!`);
      load(); // Reload the list
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || "Failed to delete property."
      );
    } finally {
      setDeleting(false);
      setIsConfirmModalOpen(false);
      setPropertyToDelete(null);
    }
  }

  // --- NEW: Function to cancel deletion ---
  function cancelDelete() {
    setIsConfirmModalOpen(false);
    setPropertyToDelete(null);
  }


  function clearFilters() {
    const empty = { search: "", propertyType: "", location: "" };
    setFilters(empty);
    load(empty);
  }

  // Helper to pick the thumbnail URL from common possible fields
  function thumbnailForProperty(p) {
    return p?.thumbnail || p?.image || p?.imageUrl || "";
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">
            Property (Building) Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            View, edit and manage properties and their units.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            title="Add Property"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-white font-semibold shadow-md transition transform hover:-translate-y-0.5 focus:outline-none"
            style={{
              background:
                "linear-gradient(90deg,#10B981 0%,#047857 100%)", // green gradient
            }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Property</span>
          </button>
        </div>
      </div>

      {/* Compact Filter Row - search + dropdowns for property type and location */}
      <div className="p-3 bg-white border rounded-lg shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Free text search */}
          <CompactFilter
            value={filters.search}
            onChange={(v) => setFilters((f) => ({ ...f, search: v }))}
            placeholder="Search by title, city or province..."
            icon={<Search className="w-4 h-4 text-slate-400" />}
          />

          {/* Property Type dropdown (derived from loaded data) */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-100">
              <Home className="w-4 h-4 text-slate-400" />
            </div>
            <select
              value={filters.propertyType}
              onChange={(e) =>
                setFilters((f) => ({ ...f, propertyType: e.target.value }))
              }
              className="min-w-[160px] w-48 text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">All Property Types</option>
              {propertyTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Location dropdown (derived from loaded data) */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-100">
              <MapPin className="w-4 h-4 text-slate-400" />
            </div>
            <select
              value={filters.location}
              onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
              className="min-w-[160px] w-56 text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">All Locations</option>
              {locations.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* Controls */}
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-white font-semibold shadow hover:opacity-95 disabled:opacity-60 transition"
              style={{
                background:
                  "linear-gradient(90deg,#10B981 0%,#047857 100%)", // same green gradient as New Property
              }}
            >
              {loading ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      className="opacity-25"
                    />
                    <path
                      d="M4 12a8 8 0 018-8"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                      className="opacity-75"
                    />
                  </svg>
                  Applying...
                </>
              ) : (
                <>
                  <Filter className="w-4 h-4" />
                  Apply
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* List area: cards for readability */}
      <div className="mt-4">
        {loading ? (
          <div className="p-8 rounded-lg bg-gradient-to-r from-slate-50 to-white border border-dashed border-slate-200 text-center">
            <h2 className="text-lg font-medium text-slate-700">Loading properties...</h2>
          </div>
        ) : list.length === 0 ? (
          <div className="p-8 rounded-lg bg-gradient-to-r from-slate-50 to-white border border-dashed border-slate-200 text-center">
            <h2 className="text-lg font-medium text-slate-700">No properties found</h2>
            <p className="text-sm text-slate-500 mt-2">Try adjusting your search or add a new property.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {list.map((p) => (
              <div
                key={p._id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 rounded-lg bg-gradient-to-r from-white to-slate-50 border border-slate-100 shadow-sm transition hover:shadow-lg"
              >
                <div className="flex items-start gap-4">
                  {/* Thumbnail image (fallback to gradient placeholder if none) */}
                  {thumbnailForProperty(p) ? (
                    <img
                      src={thumbnailForProperty(p)}
                      alt={p.propertyName || "Property thumbnail"}
                      className="w-14 h-14 rounded-md object-cover border border-slate-100 shadow-sm"
                      onError={(e) => {
                        // If image fails to load, replace with placeholder by clearing src
                        // This will cause the placeholder branch to show (since thumbnailForProperty still returns a string,
                        // we swap the image out by hiding it)
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-md bg-gradient-to-br from-indigo-100 to-purple-50 flex items-center justify-center text-indigo-600 font-semibold text-sm">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M3 13.5V20a1 1 0 001 1h6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
                        <path d="M21 10.5V4a1 1 0 00-1-1h-6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
                        <path d="M3 13.5L12 6l9 7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
                      </svg>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-semibold text-slate-800">{p.propertyName}</div>
                      <div className="text-xs px-2 py-1 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100">
                        {p.propertyType || "—"}
                      </div>
                    </div>

                    <div className="text-sm text-slate-500 mt-1">
                      <MapPin className="inline w-3 h-3 mr-1 text-slate-400" />
                      {p.city ? `${p.city}, ${p.province}` : p.location || "No location"}
                    </div>

                    {p._unitsCount !== undefined && <div className="text-xs text-slate-400 mt-1">Units: {p._unitsCount}</div>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/admin/properties/${p._id}`}
                    title="View / Manage Units"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-200 bg-white text-sm hover:bg-slate-50"
                  >
                    <Eye className="w-4 h-4 text-slate-600" />
                    <span className="hidden sm:inline">View / Units</span>
                  </Link>

                  <button
                    title="Edit"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm hover:bg-indigo-100"
                    onClick={() => {
                      setEditing(p);
                      setOpen(true);
                    }}
                  >
                    <Edit3 className="w-4 h-4" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>

                  <button
                    title="Delete"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-gradient-to-r from-rose-500 to-pink-500 text-white text-sm shadow-sm hover:from-rose-600 hover:to-pink-600"
                    onClick={() => handleDelete(p._id, p.propertyName)}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editor modal unchanged in behavior */}
      <PropertyEditor open={open} onClose={onClose} editing={editing} />

      {/* --- NEW: Confirmation Modal --- */}
      <ConfirmDeleteModal
        open={isConfirmModalOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        propertyName={propertyToDelete?.name || ""}
        isLoading={deleting}
      />
    </div>
  );
}

/* ---------- Presentational components ---------- */

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
        className="min-w-[160px] w-64 text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
      />
    </div>
  );
}

// --- NEW: Custom Confirmation Modal Component ---
function ConfirmDeleteModal({ open, onClose, onConfirm, propertyName, isLoading }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid p-4 overflow-y-auto bg-black/60 place-items-center">
      <div
        className="w-full max-w-md p-6 bg-white rounded-xl shadow-2xl ring-1 ring-black/5"
        aria-modal="true"
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-red-100 text-red-600 shadow">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Confirm Deletion
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Are you absolutely sure?
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center w-9 h-9 rounded-md text-gray-600 hover:bg-gray-100 transition"
            aria-label="Close"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="mt-4 text-sm text-gray-700 space-y-3">
          <p>
            You are about to delete the property:
            <strong className="block text-base text-gray-900 my-1">{propertyName}</strong>
          </p>
          <p className="p-3 text-sm font-medium text-red-800 bg-red-50 border border-red-200 rounded-lg">
            <strong>Warning:</strong> This will also delete ALL associated units. This action cannot be undone.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t mt-6">
          <button
            type="button"
            className="px-3 py-2 rounded-md text-sm font-medium bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 transition"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-white font-semibold shadow-md transition bg-red-600 hover:bg-red-700 disabled:opacity-60"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
                </svg>
                Deleting...
              </>
            ) : (
              "Confirm Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}