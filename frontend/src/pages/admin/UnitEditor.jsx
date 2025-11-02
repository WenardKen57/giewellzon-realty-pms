import { useEffect, useState } from "react";
import { toast } from "react-toastify";
// Import BOTH APIs
import { PropertiesAPI } from "../../api/properties";
import { UnitsAPI } from "../../api/units";

const BLANK_FORM = {
  unitNumber: "",
  price: "",
  status: "available",
  specifications: {
    lotArea: "",
    floorArea: "",
    bedrooms: "",
    bathrooms: "",
    parking: "",
  },
  soldDate: "",
};

export default function UnitEditor({ open, onClose, editing, propertyId }) {
  const [form, setForm] = useState(BLANK_FORM);
  const [errors, setErrors] = useState({});
  const [thumbnail, setThumbnail] = useState(null); // Single unit thumbnail (first photo)
  const [thumbPreview, setThumbPreview] = useState("");
  const [photos, setPhotos] = useState([]); // Additional unit photos
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (editing) {
        // Editing existing unit
        setForm((s) => ({
          ...s,
          ...editing,
          specifications: {
            ...BLANK_FORM.specifications, // Start with blank specs
            ...(editing.specifications || {}), // Apply editing specs
          },
        }));
      } else {
        // Adding a new unit: reset the form
        setForm(BLANK_FORM);
        setPhotos([]);
        setThumbnail(null);
        setThumbPreview("");
        setErrors({});
      }
    }
  }, [editing, open]);

  // Build a preview URL when a thumbnail file is selected
  useEffect(() => {
    if (!thumbnail) {
      setThumbPreview("");
      return;
    }
    const url = URL.createObjectURL(thumbnail);
    setThumbPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [thumbnail]);

  if (!open) return null;

  // Validation for Unit fields
  function validate() {
    const newErrors = {};
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
      newErrors.price = "Price must be a positive number.";
    return newErrors;
  }

  async function save(e) {
    e.preventDefault();
    if (editing) {
      const confirmed = window.confirm(
        "Are you sure you want to update this unit?"
      );
      if (!confirmed) return;
    }

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please fix the highlighted fields before saving.");
      return;
    }

    setLoading(true);
    try {
      const payload = { ...form, price: Number(form.price) };
      let res;

      if (editing) {
        // Use UnitsAPI to update a specific unit
        res = await UnitsAPI.update(editing._id, payload);
      } else {
        // Use PropertiesAPI to create a new unit *for* this property
        if (!propertyId) {
          toast.error("No Property ID provided. Cannot create unit.");
          setLoading(false);
          return;
        }
        res = await PropertiesAPI.createUnit(propertyId, payload);
      }

      const id = res._id || editing._id;

      // Upload thumbnail + photos (thumbnail first)
      const filesToUpload = [thumbnail, ...(photos || [])].filter(Boolean);
      if (filesToUpload.length > 0) {
        await UnitsAPI.uploadPhotos(id, filesToUpload);
        setPhotos([]);
        setThumbnail(null);
        setThumbPreview("");
      }

      toast.success(
        editing ? "Unit updated successfully!" : "Unit added successfully!"
      );
      onClose(true); // Close modal and tell parent to refetch
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to save unit.");
    } finally {
      setLoading(false);
    }
  }

  function setSpec(key, value) {
    setForm((s) => ({
      ...s,
      specifications: { ...s.specifications, [key]: value },
    }));
  }

  return (
    <div className="fixed inset-0 z-50 grid p-4 bg-black/50 place-items-center">
      <form
        onSubmit={save}
        className="bg-white rounded-lg w-full max-w-2xl max-h-[92vh] overflow-auto p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {editing ? "Update Unit" : "Add New Unit"}
          </h2>
          <button
            type="button"
            className="text-brand-secondary"
            onClick={() => onClose(false)}
          >
            Close
          </button>
        </div>

        {/* === UNIT INFO === */}
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Unit Number / Name" error={errors.unitNumber}>
            <input
              className="input"
              value={form.unitNumber}
              onChange={(e) =>
                setForm((s) => ({ ...s, unitNumber: e.target.value }))
              }
              placeholder="e.g., 'Apt 101' or 'Main House'"
            />
          </Field>

          <Field label="Price" error={errors.price}>
            <input
              className="input"
              type="number"
              value={form.price}
              onChange={(e) =>
                setForm((s) => ({ ...s, price: e.target.value }))
              }
              required
            />
          </Field>

          <Field label="Status">
            <select
              className="input"
              value={form.status}
              onChange={(e) =>
                setForm((s) => ({ ...s, status: e.target.value }))
              }
            >
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="rented">Rented</option>
            </select>
          </Field>
        </div>

        {/* === SPECS === */}
        <div>
          <div className="mb-2 font-medium">Specifications</div>
          <div className="grid gap-3 md:grid-cols-3">
            <Spec
              label="Lot Area (sqm)"
              value={form.specifications.lotArea}
              onChange={(v) => setSpec("lotArea", v)}
            />
            <Spec
              label="Floor Area (sqm)"
              value={form.specifications.floorArea}
              onChange={(v) => setSpec("floorArea", v)}
            />
            <Spec
              label="Bedrooms"
              value={form.specifications.bedrooms}
              onChange={(v) => setSpec("bedrooms", v)}
            />
            <Spec
              label="Bathrooms"
              value={form.specifications.bathrooms}
              onChange={(v) => setSpec("bathrooms", v)}
            />
            <Spec
              label="Parking"
              value={form.specifications.parking}
              onChange={(v) => setSpec("parking", v)}
            />
          </div>
        </div>

        {/* === UNIT MEDIA === */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Thumbnail (single) */}
          <div>
            <div className="mb-2 font-medium">Unit Thumbnail</div>
            {thumbPreview ? (
              <img
                src={thumbPreview}
                alt="Thumbnail preview"
                className="object-cover w-full h-40 mb-2 border rounded"
              />
            ) : null}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
            />
            <p className="mt-1 text-xs text-neutral-600">
              This image will be used as the unit cover (first photo).
            </p>
          </div>

          {/* Additional photos */}
          <div>
            <div className="mb-2 font-medium">Unit Photos</div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setPhotos(Array.from(e.target.files || []))}
            />
            <p className="mt-1 text-xs text-neutral-600">
              You can select multiple images; they will appear after the thumbnail.
            </p>
          </div>
        </div>

        {/* === BUTTONS === */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="px-4 py-2 border rounded"
            onClick={() => onClose(false)}
          >
            Cancel
          </button>
          <button className="btn btn-primary" disabled={loading}>
            {loading ? "Saving..." : editing ? "Update Unit" : "Add Unit"}
          </button>
        </div>
      </form>
    </div>
  );
}

// --- Helper Components ---
function Field({ label, children, error }) {
  return (
    <div>
      <div className="mb-1 text-sm">{label}</div>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function Spec({ label, value, onChange }) {
  return (
    <div>
      <div className="mb-1 text-sm">{label}</div>
      <input
        className="input"
        value={value || ""}
        type="number"
        min="0"
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
