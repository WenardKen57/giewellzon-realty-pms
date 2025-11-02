// src/pages/admin/PropertyEditor.jsx
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { PropertiesAPI } from "../../api/properties";

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

  const [existingThumb, setExistingThumb] = useState(null); // url string
  const [existingPhotos, setExistingPhotos] = useState([]); // array of url strings
  const [thumbPreview, setThumbPreview] = useState(null); // objectURL for selected file
  const [photoPreviews, setPhotoPreviews] = useState([]); // objectURLs for selected files
  const [deleting, setDeleting] = useState(false);

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

        // Populate existing media if available (uses common keys)
        const thumbUrl =
          editing.thumbnail ||
          editing.thumbUrl ||
          editing.thumbnailUrl ||
          editing.image ||
          null;
        const photosArr =
          editing.photos ||
          editing.photoUrls ||
          editing.images ||
          editing.gallery ||
          [];
        setExistingThumb(thumbUrl || null);
        setExistingPhotos(Array.isArray(photosArr) ? photosArr : []);
      } else {
        // Adding a new property: reset the form
        setForm(BLANK_FORM);
        setThumb(null);
        setPhotos([]);
        setSiteMap(null);
        setErrors({});
        setExistingThumb(null);
        setExistingPhotos([]);
      }
    }
  }, [editing, open]); // Added 'open' dependency to ensure reset

  useEffect(() => {
    // cleanup previous previews
    photoPreviews.forEach((u) => URL.revokeObjectURL(u));
    if (!photos || photos.length === 0) {
      setPhotoPreviews([]);
      return;
    }
    const urls = photos.map((f) => URL.createObjectURL(f));
    setPhotoPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos]);

  // create preview for selected thumbnail file
  useEffect(() => {
    if (thumbPreview) {
      URL.revokeObjectURL(thumbPreview);
      setThumbPreview(null);
    }
    if (!thumb) {
      setThumbPreview(null);
      return;
    }
    const url = URL.createObjectURL(thumb);
    setThumbPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [thumb]);

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
      // We also remove 'photos' so we don't overwrite uploads,
      // as uploads are handled separately.
      const payload = { ...form };
      delete payload.photos;
      delete payload.thumbnail;

      let res = editing
        ? await PropertiesAPI.update(editing._id, payload)
        : await PropertiesAPI.create(payload);

      const id = res._id || editing._id;

      // File uploads are correct, as they belong to the Property
      if (thumb) await PropertiesAPI.uploadThumbnail(id, thumb);
      if (photos?.length > 0) {
        // This API now appends, which is what we want.
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

  // remove existing thumbnail (server-side)
  async function removeExistingThumb() {
    if (!editing?._id) return;
    if (!window.confirm("Remove existing thumbnail?")) return;
    setDeleting(true);
    try {
      // expects PropertiesAPI.deleteThumbnail(propertyId)
      await PropertiesAPI.deleteThumbnail(editing._id);
      setExistingThumb(null);
      toast.info("Thumbnail removed.");
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || "Failed to remove thumbnail."
      );
    } finally {
      setDeleting(false);
    }
  }

  // remove an existing photo (server-side)
  async function removeExistingPhoto(photoUrl) {
    if (!editing?._id) return;
    if (!window.confirm("Remove this photo?")) return;
    setDeleting(true);
    try {
      // expects PropertiesAPI.deletePhoto(propertyId, photoIdentifier)
      // pass the photo URL or identifier - adjust API if necessary
      await PropertiesAPI.deletePhoto(editing._id, photoUrl);
      setExistingPhotos((s) => s.filter((p) => p !== photoUrl));
      toast.info("Photo removed.");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to remove photo.");
    } finally {
      setDeleting(false);
    }
  }

  // --- NEW: Helper for file input ---
  const handlePhotoSelect = (e) => {
    const newFiles = Array.from(e.target.files || []);
    setPhotos((s) => {
      const combined = [...(s || []), ...newFiles];
      return combined.slice(0, 15); // Limit to 15
    });
    // Clear the input value to allow selecting the same file again
    e.target.value = null;
  };

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

        {/* === MEDIA (Styled) === */}
        <div className="pt-2">
          <div className="mb-2 font-medium">Media</div>

          {/* --- Thumbnail Section --- */}
          <div className="mb-4">
            <div className="mb-1 text-sm font-medium">Thumbnail</div>
            <p className="text-xs text-gray-500 mb-2">
              This is the main cover image for the property.
            </p>
            <div className="flex items-center gap-4">
              {/* Preview */}
              <div className="relative w-24 h-16 bg-gray-100 rounded-md flex-shrink-0">
                {thumbPreview || existingThumb ? (
                  <img
                    src={thumbPreview || existingThumb}
                    alt={thumbPreview ? "New thumbnail" : "Existing thumbnail"}
                    className="w-full h-full object-cover rounded-md"
                  />
                ) : (
                  <span className="text-xs text-gray-400 flex items-center justify-center h-full">
                    No image
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex-grow">
                <label className="text-sm px-3 py-2 border rounded-md cursor-pointer hover:bg-gray-50">
                  <span>{thumb ? "Change selected" : "Select thumbnail"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setThumb(e.target.files?.[0] || null)}
                  />
                </label>

                {thumb && (
                  <button
                    type="button"
                    className="ml-2 text-sm text-red-600 hover:underline"
                    onClick={() => setThumb(null)}
                  >
                    Clear
                  </button>
                )}

                {!thumb && existingThumb && (
                  <button
                    type="button"
                    className="ml-2 text-sm text-red-600 hover:underline"
                    onClick={removeExistingThumb}
                    disabled={deleting}
                  >
                    {deleting ? "..." : "Remove existing"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* --- Photos Section --- */}
          <div>
            <div className="mb-1 text-sm font-medium">Property Photos</div>
            <p className="text-xs text-gray-500 mb-2">
              Upload additional photos for the gallery. New photos will be
              appended.
            </p>

            {/* Gallery Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 mb-3">
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
              {photoPreviews.map((url, idx) => (
                <div
                  key={`new-${idx}`}
                  className="relative group aspect-square"
                >
                  <img
                    src={url}
                    alt={`New photo ${idx + 1}`}
                    className="w-full h-full object-cover rounded-md border-2 border-blue-400"
                  />
                  <button
                    type="button"
                    className="absolute -top-1.5 -right-1.5 bg-gray-700 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() =>
                      setPhotos((s) => s.filter((_, i) => i !== idx))
                    }
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
                <p className="text-xs text-gray-500">
                  PNG, JPG, GIF (up to 15)
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

          {/* --- Site Map Section --- */}
          <div className="mt-4">
            <div className="mb-1 text-sm font-medium">
              Site Development Plan (image/PDF)
            </div>
            {editing?.siteMap?.url && (
              <div className="text-xs mb-2 p-2 bg-gray-50 border rounded-md">
                Current file:{" "}
                <a
                  href={editing.siteMap.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline font-medium"
                >
                  {editing.siteMap.originalName || "View File"}
                </a>
              </div>
            )}
            <label className="text-sm px-3 py-2 border rounded-md cursor-pointer hover:bg-gray-50">
              <span>{siteMap ? siteMap.name : "Select new site map"}</span>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => setSiteMap(e.target.files?.[0] || null)}
              />
            </label>
            {siteMap && (
              <button
                type="button"
                className="ml-2 text-sm text-red-600 hover:underline"
                onClick={() => setSiteMap(null)}
              >
                Clear
              </button>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Selecting a new file will replace the current one upon saving.
            </p>
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
                      toast.info(`Removed amenity: ${a}`);
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
