import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { PropertiesAPI } from "../../api/properties";
import { UnitsAPI } from "../../api/units";

import UnitEditor from "./UnitEditor";
import PropertyEditor from "./PropertyEditor";

// lucide icons used for consistent design
import { ArrowLeft, Plus, Search, Filter, Edit3, Trash2, X } from "lucide-react";


export default function PropertyDetailPage() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isUnitEditorOpen, setIsUnitEditorOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [isPropertyEditorOpen, setIsPropertyEditorOpen] = useState(false);

  // --- NEW: State for delete confirmation modal ---
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState(null); // Stores the unit object
  const [deleting, setDeleting] = useState(false); // Loading state for delete action

  // Unit filters
  const [unitFilters, setUnitFilters] = useState({
    search: "",
    status: "", // "" means "all"
  });

  async function loadProperty() {
    try {
      setLoading(true);
      const data = await PropertiesAPI.get(id);
      setProperty(data);
    } catch (err) {
      toast.error("Failed to load property.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) {
      loadProperty();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Modal close handlers
  function handleUnitEditorClose(reload) {
    setIsUnitEditorOpen(false);
    setEditingUnit(null);
    if (reload) {
      loadProperty();
    }
  }

  function handlePropertyEditorClose(reload) {
    setIsPropertyEditorOpen(false);
    if (reload) {
      loadProperty();
    }
  }

  // --- UPDATED: Delete handler now opens the modal ---
  function handleDeleteUnit(unit) {
    setUnitToDelete(unit);
    setIsConfirmModalOpen(true);
  }

  // --- NEW: Function to handle the actual deletion ---
  async function confirmDeleteUnit() {
    if (!unitToDelete) return;

    setDeleting(true);
    try {
      await UnitsAPI.del(unitToDelete._id);
      toast.success(`Unit "${unitToDelete.unitNumber}" deleted successfully!`);
      loadProperty();
    } catch (err) {
      toast.error("Failed to delete unit.");
      console.error(err);
    } finally {
      setDeleting(false);
      setIsConfirmModalOpen(false);
      setUnitToDelete(null);
    }
  }

  // --- NEW: Function to cancel deletion ---
  function cancelDeleteUnit() {
    setIsConfirmModalOpen(false);
    setUnitToDelete(null);
  }

  // Filtered units using useMemo (unchanged logic)
  const filteredUnits = useMemo(() => {
    if (!property?.units) return [];

    let units = property.units;

    if (unitFilters.status) {
      units = units.filter((unit) => unit.status === unitFilters.status);
    }

    if (unitFilters.search) {
      const searchTerm = unitFilters.search.toLowerCase();
      units = units.filter((unit) =>
        unit.unitNumber?.toLowerCase().includes(searchTerm)
      );
    }

    return units;
  }, [property?.units, unitFilters]);

  // Helper to pick the thumbnail URL from common possible fields
  function thumbnailForProperty(p) {
    return p?.thumbnail || p?.image || p?.imageUrl || "";
  }

  if (loading) return <div className="p-6">Loading...</div>;
  if (!property) return <div className="p-6">Property not found.</div>;

  return (
    <div className="p-6 space-y-6">
      <Link to="/admin/properties" className="text-sm text-slate-600 hover:underline inline-flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" />
        Back to Property List
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {thumbnailForProperty(property) ? (
            <img
              src={thumbnailForProperty(property)}
              alt={property.propertyName || "Property thumbnail"}
              className="w-16 h-16 rounded-md object-cover border border-slate-100 shadow-sm"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="w-16 h-16 rounded-md bg-gradient-to-br from-indigo-100 to-purple-50 flex items-center justify-center text-indigo-600 font-semibold text-sm border border-slate-100">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M3 13.5V20a1 1 0 001 1h6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
                <path d="M21 10.5V4a1 1 0 00-1-1h-6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
                <path d="M3 13.5L12 6l9 7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
              </svg>
            </div>
          )}

          <div>
            <h1 className="text-2xl font-semibold text-slate-800">{property.propertyName}</h1>
            <p className="text-sm text-slate-500 mt-1">
              {property.city}, {property.province}
            </p>
            {/* other small meta */}
            {property.propertyType && (
              <div className="mt-2 inline-block text-xs px-2 py-1 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100">
                {property.propertyType}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-white font-semibold shadow-md transition transform hover:-translate-y-0.5 focus:outline-none"
            style={{
              background: "linear-gradient(90deg,#10B981 0%,#047857 100%)",
            }}
            onClick={() => setIsPropertyEditorOpen(true)}
          >
            <Edit3 className="w-4 h-4" />
            Edit Property Details
          </button>
        </div>
      </div>

      <hr className="my-6" />

      {/* Units header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Units</h2>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-white font-semibold shadow-md transition transform hover:-translate-y-0.5 focus:outline-none"
          style={{
            background: "linear-gradient(90deg,#10B981 0%,#047857 100%)",
          }}
          onClick={() => {
            setEditingUnit(null);
            setIsUnitEditorOpen(true);
          }}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add New Unit</span>
        </button>
      </div>

      {/* Filters: search + status dropdown + controls */}
      <div className="p-3 bg-white border rounded-lg shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-100">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search by unit number..."
              className="min-w-[160px] w-64 text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              value={unitFilters.search}
              onChange={(e) => setUnitFilters((f) => ({ ...f, search: e.target.value }))}
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-50 border border-gray-100">
              <Filter className="w-4 h-4 text-slate-400" />
            </div>
            <select
              className="min-w-[140px] w-44 text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              value={unitFilters.status}
              onChange={(e) => setUnitFilters((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="">All Statuses</option>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="rented">Rented</option>
            </select>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setUnitFilters({ search: "", status: "" });
              }}
              className="px-3 py-2 rounded-md text-sm font-medium bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 transition"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => {
                /* Apply here simply recomputes filteredUnits via updated state (no extra load needed) */
                // keep a small visual loading state if desired; not necessary to call API
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-white font-semibold shadow hover:opacity-95 transition"
              style={{
                background: "linear-gradient(90deg,#10B981 0%,#047857 100%)",
              }}
            >
              <Filter className="w-4 h-4" />
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Units table */}
      <div className="mt-4 overflow-auto">
        <table className="min-w-full w-full bg-white rounded-lg shadow">
          <thead className="text-left">
            <tr className="[&>th]:px-4 [&>th]:py-2 text-sm text-neutral-600">
              <th>Unit #</th>
              <th>Price</th>
              <th>Specs</th>
              <th>Status</th>
              <th className="w-40">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUnits.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-4 text-center text-neutral-500">
                  No units found matching your filters.
                </td>
              </tr>
            ) : (
              filteredUnits.map((unit) => (
                <tr key={unit._id} className="[&>td]:px-4 [&>td]:py-2 border-t">
                  <td>{unit.unitNumber || "N/A"}</td>
                  <td>₱ {Number(unit.price || 0).toLocaleString()}</td>
                  <td>
                    {unit.specifications?.bedrooms || 0} bed, {unit.specifications?.bathrooms || 0} bath
                  </td>
                  <td>
                    <span
                      className={`text-xs rounded-full px-2 py-0.5 ${
                        unit.status === "available" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {unit.status}
                    </span>
                  </td>
                  <td className="flex gap-2">
                    <button
                      title="Edit Unit"
                      className="px-2 py-1 text-xs inline-flex items-center gap-2 rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700"
                      onClick={() => {
                        setEditingUnit(unit);
                        setIsUnitEditorOpen(true);
                      }}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      title="Delete Unit"
                      className="px-2 py-1 text-xs inline-flex items-center gap-2 rounded-md bg-rose-500 text-white"
                      onClick={() => handleDeleteUnit(unit)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <UnitEditor
        open={isUnitEditorOpen}
        onClose={handleUnitEditorClose}
        editing={editingUnit}
        propertyId={property._id}
      />

      <PropertyEditor
        open={isPropertyEditorOpen}
        onClose={handlePropertyEditorClose}
        editing={property}
      />

      {/* --- NEW: Confirmation Modal --- */}
      <ConfirmDeleteModal
        open={isConfirmModalOpen}
        onClose={cancelDeleteUnit}
        onConfirm={confirmDeleteUnit}
        unitName={unitToDelete?.unitNumber || ""}
        isLoading={deleting}
      />
    </div>
  );
}

// --- NEW: Custom Confirmation Modal Component ---
function ConfirmDeleteModal({ open, onClose, onConfirm, unitName, isLoading }) {
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
                Confirm Unit Deletion
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
            You are about to delete the unit:
            <strong className="block text-base text-gray-900 my-1">{unitName}</strong>
          </p>
          <p className="p-3 text-sm font-medium text-red-800 bg-red-50 border border-red-200 rounded-lg">
            <strong>Warning:</strong> This action cannot be undone.
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