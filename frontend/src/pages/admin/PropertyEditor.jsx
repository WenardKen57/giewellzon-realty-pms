import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { PropertiesAPI } from "../../api/properties";

// The form state is now simpler
const BLANK_FORM = {
  propertyName: "",
  description: "",
  location: "",
  city: "",
  province: "",
  street: "",
  featured: false,
  propertyType: "house",
  amenities: [],
  videoTours: [],
  assignedAgentName: "",
  assignedAgentEmail: "",
  assignedAgentPhone: "",
  listedDate: "",
};

export default function PropertyEditor({ open, onClose, editing }) {
  const [form, setForm] = useState(BLANK_FORM);
  const [errors, setErrors] = useState({});
  const [thumb, setThumb] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [siteMap, setSiteMap] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (editing) {
        // Editing existing property (Building)
        setForm((s) => ({
          ...s,
          ...editing,
          propertyType: editing.propertyType || "house",
          amenities: editing.amenities || [],
          videoTours: editing.videoTours || [],
        }));
      } else {
        // Adding a new property: reset the form
        setForm(BLANK_FORM);
        setThumb(null);
        setPhotos([]);
        setSiteMap(null);
        setErrors({});
      }
    }
  }, [editing, open]); // Added 'open' dependency to ensure reset

  if (!open) return null;

  // Basic validation (price and specs are REMOVED)
  function validate() {
    const newErrors = {};
    if (!form.propertyName.trim())
      newErrors.propertyName = "Property name is required.";
    if (!form.city.trim()) newErrors.city = "City is required.";
    if (!form.province.trim()) newErrors.province = "Province is required.";
    if (!form.propertyType.trim())
      newErrors.propertyType = "Property type is required.";
    return newErrors;
  }

  async function save(e) {
    e.preventDefault();
    if (editing) {
      const confirmed = window.confirm(
        "Are you sure you want to update this property (building)?"
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
      // Payload no longer includes price, status, etc.
      const payload = { ...form };
      let res = editing
        ? await PropertiesAPI.update(editing._id, payload)
        : await PropertiesAPI.create(payload);

      const id = res._id || editing._id;

      // File uploads are correct, as they belong to the Property
      if (thumb) await PropertiesAPI.uploadThumbnail(id, thumb);
      if (photos?.length > 0) {
        await PropertiesAPI.uploadPhotos(id, photos);
        setPhotos([]);
      }
      if (siteMap) await PropertiesAPI.uploadSiteMap(id, siteMap);

      toast.success(
        editing
          ? "Property updated successfully!"
          : "Property added successfully!"
      );

      onClose(true); // Close modal and tell parent to refetch
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to save property.");
    } finally {
      setLoading(false);
    }
  }

  function addAmenity() {
    const v = prompt("Amenity name:");
    if (v?.trim()) {
      setForm((s) => ({ ...s, amenities: [...(s.amenities || []), v.trim()] }));
      toast.info(`Added amenity: ${v}`);
    }
  }

  function addVideo() {
    const url = prompt("YouTube URL:");
    if (url?.startsWith("https://")) {
      setForm((s) => ({
        ...s,
        videoTours: [...(s.videoTours || []), url.trim()],
      }));
      toast.info("Video link added!");
    } else if (url) {
      toast.warn("Please enter a valid YouTube URL.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid p-4 bg-black/50 place-items-center">
      <form
        onSubmit={save}
        className="bg-white rounded-lg w-full max-w-3xl max-h-[92vh] overflow-auto p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {editing
              ? "Update Property (Building)"
              : "Add New Property (Building)"}
          </h2>
          <button
            type="button"
            className="text-brand-secondary"
            onClick={() => onClose(false)}
          >
            Close
          </button>
        </div>

        {/* === PROPERTY INFO === */}
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title" error={errors.propertyName}>
            <input
              className="input"
              value={form.propertyName}
              onChange={(e) =>
                setForm((s) => ({ ...s, propertyName: e.target.value }))
              }
              required
            />
          </Field>

          {/* Price Field is REMOVED */}

          <Field label="Property Type" error={errors.propertyType}>
            <select
              className="input"
              value={form.propertyType}
              onChange={(e) =>
                setForm((s) => ({ ...s, propertyType: e.target.value }))
              }
              required
            >
              <option value="">Select Type</option>
              <option value="house">House</option>
              <option value="condo">Condo</option>
              <option value="lot">Lot</option>
              <option value="apartment">Apartment</option>
              <option value="townhouse">Townhouse</option>
              <option value="compound">Compound</option>
            </select>
          </Field>

          <div className="md:col-span-2">
            <Field label="Description">
              <textarea
                className="input"
                rows="3"
                value={form.description}
                onChange={(e) =>
                  setForm((s) => ({ ...s, description: e.target.value }))
                }
              />
            </Field>
          </div>

          {/* numberOfUnit Field is REMOVED */}

          <Field label="Street">
            <input
              className="input"
              value={form.street || ""}
              onChange={(e) =>
                setForm((s) => ({ ...s, street: e.target.value }))
              }
            />
          </Field>

          <Field label="City" error={errors.city}>
            <input
              className="input"
              value={form.city}
              onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))}
              required
            />
          </Field>

          <Field label="Province" error={errors.province}>
            <input
              className="input"
              value={form.province}
              onChange={(e) =>
                setForm((s) => ({ ...s, province: e.target.value }))
              }
              required
            />
          </Field>

          {/* Status Field is REMOVED */}

          <div className="flex items-center gap-2">
            <input
              id="featured"
              type="checkbox"
              checked={!!form.featured}
              onChange={(e) =>
                setForm((s) => ({ ...s, featured: e.target.checked }))
              }
            />
            <label htmlFor="featured" className="text-sm">
              Mark as Featured
            </label>
          </div>
        </div>

        {/* === MEDIA === */}
        <div>
          <div className="mb-2 font-medium">Media</div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-1 text-sm">Thumbnail</div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setThumb(e.target.files?.[0] || null)}
              />
            </div>

            <div>
              <div className="mb-1 text-sm">Photos (up to 15)</div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setPhotos(Array.from(e.target.files || []))}
              />
            </div>

            <div className="md:col-span-2">
              <div className="mb-1 text-sm">
                Site Development Plan (image/PDF)
              </div>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setSiteMap(e.target.files?.[0] || null)}
              />
            </div>
          </div>
        </div>

        {/* === VIDEO TOURS === */}
        <div>
          <div className="mb-2 font-medium">Video Tour</div>
          <button
            type="button"
            className="px-3 py-1 text-sm border rounded"
            onClick={addVideo}
          >
            Add YouTube URL
          </button>
          <ul className="mt-2 ml-6 text-sm list-disc">
            {(form.videoTours || []).map((v, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="truncate">{v}</span>
                <button
                  type="button"
                  className="text-xs text-brand-secondary"
                  onClick={() =>
                    setForm((s) => ({
                      ...s,
                      videoTours: s.videoTours.filter((_, idx) => idx !== i),
                    }))
                  }
                >
                  remove
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* === SPECS (Section is REMOVED) === */}

        {/* === AMENITIES === */}
        <div>
          <div className="mb-2 font-medium">Amenities</div>
          <button
            type="button"
            className="px-3 py-1 text-sm border rounded"
            onClick={addAmenity}
          >
            Add Amenity
          </button>
          <div className="flex flex-wrap gap-2 mt-2">
            {(form.amenities || []).map((a, i) => (
              <span
                key={i}
                className="px-2 py-1 text-xs rounded bg-brand-light"
              >
                {a}{" "}
                <button
                  type="button"
                  className="ml-1 text-brand-secondary"
                  onClick={() => {
                    if (
                      window.confirm(`Are you sure you want to remove "${a}"?`)
                    ) {
                      setForm((s) => ({
                        ...s,
                        amenities: s.amenities.filter((_, idx) => idx !== i),
                      }));
                      toast.info(`Removed amenity: ${a}`);
                    }
                  }}
                >
                  x
                </button>
              </span>
            ))}
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
            {loading
              ? "Saving..."
              : editing
              ? "Update Property"
              : "Add Property"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children, error }) {
  return (
    <div>
      <div className="mb-1 text-sm">{label}</div>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
