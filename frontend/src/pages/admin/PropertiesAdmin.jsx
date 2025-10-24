import { useEffect, useState } from "react";
import { Link } from "react-router-dom"; // Import Link
import { PropertiesAPI } from "../../api/properties";
import PropertyEditor from "./PropertyEditor";
import { toast } from "react-toastify";

export default function PropertiesAdmin() {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  // The 'status' filter is removed, as it's no longer on the Property model
  const [filters, setFilters] = useState({ search: "" });

  async function load() {
    // We now only filter by search (or other property-level fields)
    const r = await PropertiesAPI.list({ ...filters });
    setList(r.data || []);
  }

  useEffect(() => {
    load();
  }, []); // Note: You may want to move 'load' outside or wrap in useCallback

  function onClose(reload) {
    setOpen(false);
    setEditing(null);
    if (reload) load();
  }

  async function handleDelete(id, name) {
    if (
      window.confirm(
        `Are you sure you want to delete "${name}"? This will also delete ALL associated units. This cannot be undone.`
      )
    ) {
      try {
        await PropertiesAPI.del(id);
        toast.success(`Property "${name}" and all units deleted successfully!`);
        load();
      } catch (err) {
        console.error(err);
        toast.error(
          err?.response?.data?.message || "Failed to delete property."
        );
      }
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          Property (Building) Management
        </h1>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          + Property
        </button>
      </div>

      <div className="flex gap-2 mt-4">
        <input
          className="w-64 input"
          placeholder="Search by title or city"
          value={filters.search}
          onChange={(e) =>
            setFilters((s) => ({ ...s, search: e.target.value }))
          }
        />
        {/* Status filter is removed */}
        <button className="btn btn-outline" onClick={load}>
          Apply
        </button>
      </div>

      <div className="mt-4 overflow-auto">
        <table className="min-w-[720px] w-full bg-white rounded-lg shadow">
          <thead className="text-left">
            <tr className="[&>th]:px-4 [&>th]:py-2 text-sm text-neutral-600">
              <th>Property</th>
              <th>Property Type</th>
              <th>Location</th>
              {/* Price column removed */}
              {/* Status column removed */}
              <th className="w-40">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p._id} className="[&>td]:px-4 [&>td]:py-2 border-t">
                <td className="max-w-[260px]">
                  <div className="font-medium">{p.propertyName}</div>
                </td>
                <td className="max-w-[260px]">
                  <div className="font-medium">{p.propertyType}</div>
                </td>
                <td>
                  {p.city ? `${p.city}, ${p.province}` : p.location || ""}
                </td>

                {/* Price <td> removed */}
                {/* Status <td> removed */}

                <td className="flex gap-2">
                  {/* "Mark Sold" button removed - This is now on the Unit */}
                  <Link
                    to={`/admin/properties/${p._id}`} // ASSUMING this is your detail page route
                    title="View"
                    className="px-2 py-1 text-xs btn btn-outline"
                  >
                    View / Manage Units
                  </Link>
                  <button
                    title="Edit"
                    className="px-2 py-1 text-xs btn btn-outline"
                    onClick={() => {
                      setEditing(p);
                      setOpen(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    title="Delete"
                    className="px-2 py-1 text-xs btn btn-secondary"
                    onClick={() => handleDelete(p._id, p.propertyName)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* This PropertyEditor is now correctly editing the Property (Building) */}
      <PropertyEditor open={open} onClose={onClose} editing={editing} />
    </div>
  );
}
