import { useEffect, useState, useMemo } from "react"; // 1. Import useMemo
import { useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { PropertiesAPI } from "../../api/properties";
import { UnitsAPI } from "../../api/units";

import UnitEditor from "./UnitEditor";
import PropertyEditor from "./PropertyEditor";

export default function PropertyDetailPage() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isUnitEditorOpen, setIsUnitEditorOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [isPropertyEditorOpen, setIsPropertyEditorOpen] = useState(false);

  // 2. Add state for your unit filters
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

  // Delete handler
  async function handleDeleteUnit(unit) {
    if (
      !window.confirm(
        `Are you sure you want to delete unit "${unit.unitNumber}"?`
      )
    ) {
      return;
    }
    try {
      await UnitsAPI.del(unit._id);
      toast.success("Unit deleted successfully!");
      loadProperty();
    } catch (err) {
      toast.error("Failed to delete unit.");
    }
  }

  // 3. Create a filtered list of units using useMemo
  const filteredUnits = useMemo(() => {
    if (!property?.units) {
      return [];
    }

    // Start with all units
    let units = property.units;

    // Apply status filter
    if (unitFilters.status) {
      units = units.filter((unit) => unit.status === unitFilters.status);
    }

    // Apply search filter
    if (unitFilters.search) {
      const searchTerm = unitFilters.search.toLowerCase();
      units = units.filter((unit) =>
        unit.unitNumber?.toLowerCase().includes(searchTerm)
      );
    }

    return units;
  }, [property?.units, unitFilters]); // Re-filter when units or filters change

  if (loading) return <div>Loading...</div>;
  if (!property) return <div>Property not found.</div>;

  return (
    <div className="p-6">
      <Link
        to="/admin/properties"
        className="text-sm text-brand-secondary hover:underline"
      >
        &larr; Back to Property List
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{property.propertyName}</h1>
        <button
          className="btn btn-outline"
          onClick={() => setIsPropertyEditorOpen(true)}
        >
          Edit Property Details
        </button>
      </div>
      <p>
        {property.city}, {property.province}
      </p>
      {/* You would display other property details here... */}

      <hr className="my-6" />

      {/* === UNITS MANAGEMENT === */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Units</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingUnit(null);
            setIsUnitEditorOpen(true);
          }}
        >
          + Add New Unit
        </button>
      </div>

      {/* 4. Add the filter inputs */}
      <div className="flex gap-2 mt-4">
        <input
          type="text"
          placeholder="Search by unit number..."
          className="w-full max-w-xs input"
          value={unitFilters.search}
          onChange={(e) =>
            setUnitFilters((f) => ({ ...f, search: e.target.value }))
          }
        />
        <select
          className="input"
          value={unitFilters.status}
          onChange={(e) =>
            setUnitFilters((f) => ({ ...f, status: e.target.value }))
          }
        >
          <option value="">All Statuses</option>
          <option value="available">Available</option>
          <option value="sold">Sold</option>
          <option value="rented">Rented</option>
        </select>
      </div>

      {/* 5. List of existing units (now uses filteredUnits) */}
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
            {/* 6. Check if filtered list is empty */}
            {filteredUnits.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-4 py-4 text-center text-neutral-500"
                >
                  No units found matching your filters.
                </td>
              </tr>
            ) : (
              // 7. Map over the filtered list
              filteredUnits.map((unit) => (
                <tr key={unit._id} className="[&>td]:px-4 [&>td]:py-2 border-t">
                  <td>{unit.unitNumber || "N/A"}</td>
                  <td>₱ {Number(unit.price || 0).toLocaleString()}</td>
                  <td>
                    {unit.specifications?.bedrooms || 0} bed,{" "}
                    {unit.specifications?.bathrooms || 0} bath
                  </td>
                  <td>
                    <span
                      className={`text-xs rounded-full px-2 py-0.5 ${
                        unit.status === "available"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {unit.status}
                    </span>
                  </td>
                  <td className="flex gap-2">
                    <button
                      title="Edit Unit"
                      className="px-2 py-1 text-xs btn btn-outline"
                      onClick={() => {
                        setEditingUnit(unit);
                        setIsUnitEditorOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      title="Delete Unit"
                      className="px-2 py-1 text-xs btn btn-secondary"
                      onClick={() => handleDeleteUnit(unit)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* The UnitEditor modal */}
      <UnitEditor
        open={isUnitEditorOpen}
        onClose={handleUnitEditorClose}
        editing={editingUnit}
        propertyId={property._id}
      />

      {/* The PropertyEditor modal */}
      <PropertyEditor
        open={isPropertyEditorOpen}
        onClose={handlePropertyEditorClose}
        editing={property}
      />
    </div>
  );
}
