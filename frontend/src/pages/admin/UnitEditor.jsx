// src/pages/admin/UnitEditor.jsx
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
// Import BOTH APIs
import { PropertiesAPI } from "../../api/properties";
import { UnitsAPI } from "../../api/units";

// --- NEW: Lucide Icons for a cleaner UI ---
const IconX = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const IconUploadCloud = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
    <path d="M12 12v9"></path>
    <path d="m16 16-4-4-4 4"></path>
  </svg>
);
// --- END: Lucide Icons ---

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
  // New fields supported by backend schema
  amenities: [],
  videoTours: [],
};

export default function UnitEditor({ open, onClose, editing, propertyId }) {
  const [form, setForm] = useState(BLANK_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // --- NEW Media State ---
  // `existingPhotos` stores URLs from the `editing` object
  const [existingPhotos, setExistingPhotos] = useState([]);
  // `newPhotos` stores File objects selected by the user
  const [newPhotos, setNewPhotos] = useState([]);
  // `newPhotoPreviews` stores object URLs for previewing `newPhotos`
  const [newPhotoPreviews, setNewPhotoPreviews] = useState([]);

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
          amenities: editing.amenities || [],
          videoTours: editing.videoTours || [],
        }));
        // --- NEW ---
        // Populate existing photos from the editing object
        setExistingPhotos(editing.photos || []);
      } else {
        // Adding a new unit: reset the form and all media
        setForm(BLANK_FORM);
        setNewPhotos([]);
        setExistingPhotos([]);
        setErrors({});
      }
    }
  }, [editing, open]);

  // --- NEW: Create/revoke preview URLs for NEWLY selected photos ---
  useEffect(() => {
    // cleanup previous previews
    newPhotoPreviews.forEach((u) => URL.revokeObjectURL(u));
    if (!newPhotos || newPhotos.length === 0) {
      setNewPhotoPreviews([]);
      return;
    }
    // Create new previews
    const urls = newPhotos.map((f) => URL.createObjectURL(f));
    setNewPhotoPreviews(urls);
    // Cleanup on unmount or when newPhotos changes
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [newPhotos]);

  if (!open) return null;

  // Validation for Unit fields
  function validate() {
    const newErrors = {};
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
      newErrors.price = "Price must be a positive number.";
    return newErrors;
  }

  // --- NEW: Remove an EXISTING photo (server-side) ---
  async function removeExistingPhoto(photoUrl) {
    if (!editing?._id) return;
    if (!window.confirm("Remove this photo?")) return;
    setDeleting(true);
    try {
      await UnitsAPI.deletePhoto(editing._id, photoUrl);
      setExistingPhotos((s) => s.filter((p) => p !== photoUrl));
      toast.info("Photo removed.");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to remove photo.");
    } finally {
      setDeleting(false);
    }
  }

  // --- NEW: Remove a NEWLY selected photo (client-side) ---
  function removeNewPhoto(index) {
    setNewPhotos((s) => s.filter((_, i) => i !== index));
  }

  // --- NEW: Handle file selection ---
  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setNewPhotos((s) => [...s, ...files]);
    // Clear the input value to allow selecting the same file again
    e.target.value = null;
  };

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
      const payload = {
        ...form,
        price: Number(form.price),
        amenities: form.amenities || [],
        videoTours: form.videoTours || [],
      };
      // --- MODIFIED: Remove photos from main payload ---
      delete payload.photos;

      let res;
      if (editing) {
        // 1. Update text data
        res = await UnitsAPI.update(editing._id, payload);
      } else {
        // 1. Create unit with text data
        if (!propertyId) {
          toast.error("No Property ID provided. Cannot create unit.");
          setLoading(false);
          return;
        }
        res = await PropertiesAPI.createUnit(propertyId, payload);
      }

      const id = res._id || editing._id;

      // 2. Upload NEW photos (backend will append)
      if (newPhotos.length > 0) {
        await UnitsAPI.uploadPhotos(id, newPhotos);
        setNewPhotos([]); // Clear the staging list
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

  // Match PropertyEditor behavior for adding amenities and video links
  function addAmenity() {
    const v = prompt("Amenity name:");
    if (v?.trim()) {
      setForm((s) => ({ ...s, amenities: [...(s.amenities || []), v.trim()] }));
    }
  }

  function addVideo() {
    const url = prompt("YouTube URL:");
    if (!url) return;
    if (!isValidYouTubeUrl(url)) {
      toast.warn("Please enter a valid YouTube URL.");
      return;
    }
    setForm((s) => ({
      ...s,
      videoTours: [...(s.videoTours || []), url.trim()],
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

        {/* === UNIT MEDIA (Styled) === */}
        <div className="pt-2">
          <div className="mb-1 text-sm font-medium">Unit Photos</div>
          <p className="text-xs text-gray-500 mb-2">
            The first photo will be the main cover image. New photos will be
            appended to the existing ones.
          </p>

          {/* Gallery Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-3">
            {/* Existing Photos */}
            {existingPhotos.map((p, i) => (
              <div
                key={`existing-${i}`}
                className="relative group aspect-square"
              >
                <img
                  src={p}
                  alt={`Existing photo ${i + 1}`}
                  className="w-full h-full object-cover rounded-md border"
                />
                {i === 0 && (
                  <div className="absolute bottom-0 left-0 w-full text-center bg-black/60 text-white text-[10px] py-0.5 rounded-b-md">
                    Cover
                  </div>
                )}
                <button
                  type="button"
                  className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeExistingPhoto(p)}
                  disabled={deleting}
                  title="Remove this photo"
                >
                  <IconX />
                </button>
              </div>
            ))}

            {/* New Photo Previews */}
            {newPhotoPreviews.map((url, idx) => (
              <div key={`new-${idx}`} className="relative group aspect-square">
                <img
                  src={url}
                  alt={`New photo ${idx + 1}`}
                  className="w-full h-full object-cover rounded-md border-2 border-blue-400"
                />
                <button
                  type="button"
                  className="absolute -top-1.5 -right-1.5 bg-gray-700 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeNewPhoto(idx)}
                  title="Clear this selection"
                >
                  <IconX />
                </button>
              </div>
            ))}
          </div>

          {/* File Input Area */}
          <label className="relative flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
              <IconUploadCloud className="w-8 h-8 mb-2 text-gray-400" />
              <p className="mb-1 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag
                and drop
              </p>
            </div>
            <input
              type="file"
              accept="image/*"
              multiple
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handlePhotoSelect}
            />
          </label>
        </div>

        {/* === Video Tours (same style as PropertyEditor) === */}
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

        {/* === Amenities (same style as PropertyEditor) === */}
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
                className="px-2 py-1 text-xs rounded bg-brand-light flex items-center gap-1"
              >
                {a}
                <button
                  type="button"
                  className="text-brand-secondary hover:text-red-600"
                  onClick={() => {
                    if (
                      window.confirm(`Are you sure you want to remove "${a}"?`)
                    ) {
                      setForm((s) => ({
                        ...s,
                        amenities: s.amenities.filter((_, idx) => idx !== i),
                      }));
                    }
                  }}
                >
                  <IconX width="12" height="12" strokeWidth="4" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* === BUTTONS === */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <button
            type="button"
            className="px-4 py-2 border rounded"
            onClick={() => onClose(false)}
          >
            Cancel
          </button>
          <button className="btn btn-primary" disabled={loading || deleting}>
            {loading
              ? "Saving..."
              : deleting
              ? "Deleting..."
              : editing
              ? "Update Unit"
              : "Add Unit"}
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

// --- Local actions for amenities and video tours (match PropertyEditor behavior) ---
function isValidYouTubeUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    return (
      u.hostname === "youtu.be" ||
      u.hostname.includes("youtube.com") ||
      url.startsWith("https://")
    );
  } catch {
    return false;
  }
}
