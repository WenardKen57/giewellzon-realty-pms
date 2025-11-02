import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { PropertiesAPI } from "../../api/properties";
import { X, Image, Cloud, Trash2 } from "lucide-react";


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

  const [existingThumb, setExistingThumb] = useState(null);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [thumbPreview, setThumbPreview] = useState(null);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm((s) => ({
          ...s,
          ...editing,
          propertyType: editing.propertyType || "house",
          amenities: editing.amenities || [],
          videoTours: editing.videoTours || [],
        }));

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
        setForm(BLANK_FORM);
        setThumb(null);
        setPhotos([]);
        setSiteMap(null);
        setErrors({});
        setExistingThumb(null);
        setExistingPhotos([]);
      }
    }
  }, [editing, open]);

  // photos -> previews
  useEffect(() => {
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

  // thumbnail preview
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

  function validate() {
    const newErrors = {};
    if (!form.propertyName?.trim())
      newErrors.propertyName = "Property name is required.";
    if (!form.city?.trim()) newErrors.city = "City is required.";
    if (!form.province?.trim()) newErrors.province = "Province is required.";
    if (!form.propertyType?.trim())
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
      const payload = { ...form };
      delete payload.photos;
      delete payload.thumbnail;

      let res = editing
        ? await PropertiesAPI.update(editing._id, payload)
        : await PropertiesAPI.create(payload);

      const id = res._id || editing._id;

      if (thumb) await PropertiesAPI.uploadThumbnail(id, thumb);
      if (photos?.length > 0) {
        await PropertiesAPI.uploadPhotos(id, photos);
        setPhotos([]);
      }
      if (siteMap) await PropertiesAPI.uploadSiteMap(id, siteMap);

      toast.success(
        editing ? "Property updated successfully!" : "Property added successfully!"
      );

      onClose(true);
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

  async function removeExistingThumb() {
    if (!editing?._id) return;
    if (!window.confirm("Remove existing thumbnail?")) return;
    setDeleting(true);
    try {
      await PropertiesAPI.deleteThumbnail(editing._id);
      setExistingThumb(null);
      toast.info("Thumbnail removed.");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to remove thumbnail.");
    } finally {
      setDeleting(false);
    }
  }

  async function removeExistingPhoto(photoUrl) {
    if (!editing?._id) return;
    if (!window.confirm("Remove this photo?")) return;
    setDeleting(true);
    try {
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

  const handlePhotoSelect = (e) => {
    const newFiles = Array.from(e.target.files || []);
    setPhotos((s) => {
      const combined = [...(s || []), ...newFiles];
      return combined.slice(0, 15);
    });
    e.target.value = null;
  };

  // helper to choose thumbnail fields
  function thumbnailForProperty(p) {
    return p?.thumbnail || p?.image || p?.imageUrl || "";
  }

  return (
    <div className="fixed inset-0 z-50 grid p-4 overflow-y-auto bg-black/60 place-items-center">
      <form
        onSubmit={save}
        className="w-full max-w-3xl p-6 my-8 space-y-6 bg-white rounded-xl shadow-2xl ring-1 ring-black/5"
        aria-modal="true"
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center shadow"
              style={{ background: "linear-gradient(135deg,#10B981,#047857)" }}
            >
              <Image className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {editing ? "Update Property (Building)" : "Add New Property (Building)"}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Add or edit property details, upload media and manage amenities.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="inline-flex items-center justify-center w-9 h-9 rounded-md text-gray-600 hover:bg-gray-100 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* form grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-600">Title</label>
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
              value={form.propertyName}
              onChange={(e) => setForm((s) => ({ ...s, propertyName: e.target.value }))}
            />
            {errors.propertyName && <p className="text-xs text-red-500 mt-1">{errors.propertyName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">Property Type</label>
            <select
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
              value={form.propertyType}
              onChange={(e) => setForm((s) => ({ ...s, propertyType: e.target.value }))}
            >
              <option value="">Select Type</option>
              <option value="house">House</option>
              <option value="condo">Condo</option>
              <option value="lot">Lot</option>
              <option value="apartment">Apartment</option>
              <option value="townhouse">Townhouse</option>
              <option value="compound">Compound</option>
            </select>
            {errors.propertyType && <p className="text-xs text-red-500 mt-1">{errors.propertyType}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-600">Description</label>
            <textarea
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
              rows="3"
              value={form.description}
              onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">Street</label>
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
              value={form.street || ""}
              onChange={(e) => setForm((s) => ({ ...s, street: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">City</label>
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
              value={form.city}
              onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))}
            />
            {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">Province</label>
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
              value={form.province}
              onChange={(e) => setForm((s) => ({ ...s, province: e.target.value }))}
            />
            {errors.province && <p className="text-xs text-red-500 mt-1">{errors.province}</p>}
          </div>

          <div className="flex items-center gap-2">
            <input
              id="featured"
              type="checkbox"
              checked={!!form.featured}
              onChange={(e) => setForm((s) => ({ ...s, featured: e.target.checked }))}
            />
            <label htmlFor="featured" className="text-sm">Mark as Featured</label>
          </div>
        </div>

        {/* MEDIA */}
        <div>
          <div className="mb-2 text-sm font-medium text-gray-700">Media</div>

          {/* Thumbnail */}
          <div className="mb-4">
            <div className="mb-1 text-sm font-medium">Thumbnail</div>
            <p className="text-xs text-gray-500 mb-2">This is the main cover image for the property.</p>
            <div className="flex items-center gap-4">
              <div className="relative w-28 h-20 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden border">
                {thumbPreview || existingThumb ? (
                  <img
                    src={thumbPreview || existingThumb}
                    alt={thumbPreview ? "New thumbnail" : "Existing thumbnail"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Image className="w-6 h-6" />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 flex-grow">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 cursor-pointer hover:bg-gray-50">
                  <Cloud className="w-4 h-4 text-slate-500" />
                  <span className="text-sm">{thumb ? "Change selected" : "Select thumbnail"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setThumb(e.target.files?.[0] || null)}
                  />
                </label>

                <div className="flex items-center gap-3">
                  {thumb && (
                    <button type="button" className="text-sm text-red-600 hover:underline" onClick={() => setThumb(null)}>Clear</button>
                  )}

                  {!thumb && existingThumb && (
                    <button
                      type="button"
                      className="text-sm text-red-600 hover:underline inline-flex items-center gap-2"
                      onClick={removeExistingThumb}
                      disabled={deleting}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{deleting ? "..." : "Remove existing"}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Photos */}
          <div>
            <div className="mb-1 text-sm font-medium">Property Photos</div>
            <p className="text-xs text-gray-500 mb-2">Upload additional photos for the gallery. New photos will be appended.</p>

            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 mb-3">
              {existingPhotos.map((p, i) => (
                <div key={`existing-${i}`} className="relative group aspect-square rounded-md overflow-hidden border">
                  <img src={p} alt={`Existing photo ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeExistingPhoto(p)}
                    disabled={deleting}
                    title="Remove this photo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {photoPreviews.map((url, idx) => (
                <div key={`new-${idx}`} className="relative group aspect-square rounded-md overflow-hidden border-2 border-blue-400">
                  <img src={url} alt={`New photo ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    className="absolute top-1 right-1 bg-gray-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setPhotos((s) => s.filter((_, i) => i !== idx))}
                    title="Clear this selection"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <label className="relative flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
              <div className="flex flex-col items-center justify-center pt-4 pb-4 text-center">
                <Cloud className="w-7 h-7 mb-2 text-slate-400" />
                <p className="mb-1 text-sm text-slate-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-slate-500">PNG, JPG, GIF (up to 15)</p>
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

          {/* Site map */}
          <div className="md:col-span-2 mt-4">
            <div className="mb-1 text-sm font-medium">Site Development Plan (image/PDF)</div>
            {editing?.siteMap?.url && (
              <div className="text-xs mb-2 p-2 bg-gray-50 border rounded-md">
                Current file:{" "}
                <a href={editing.siteMap.url} target="_blank" rel="noreferrer" className="text-indigo-600 underline font-medium">
                  {editing.siteMap.originalName || "View File"}
                </a>
              </div>
            )}
            <div className="flex items-center gap-3">
              <label className="text-sm px-3 py-2 border rounded-md cursor-pointer hover:bg-gray-50 inline-flex items-center gap-2">
                <Cloud className="w-4 h-4 text-slate-500" />
                <span>{siteMap ? siteMap.name : "Select new site map"}</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => setSiteMap(e.target.files?.[0] || null)}
                />
              </label>
              {siteMap && <button type="button" className="text-sm text-red-600 hover:underline" onClick={() => setSiteMap(null)}>Clear</button>}
            </div>
            <p className="text-xs text-gray-500 mt-1">Selecting a new file will replace the current one upon saving.</p>
          </div>
        </div>

        {/* video tours & amenities */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="mb-2 text-sm font-medium text-gray-700">Video Tour</div>
            <button type="button" className="px-3 py-1 text-sm border rounded inline-flex items-center gap-2" onClick={addVideo}>
              <Image className="w-4 h-4" />
              Add YouTube URL
            </button>
            <ul className="mt-2 ml-6 text-sm list-disc">
              {(form.videoTours || []).map((v, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="truncate">{v}</span>
                  <button
                    type="button"
                    className="text-xs text-slate-600 hover:underline"
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

          <div>
            <div className="mb-2 text-sm font-medium text-gray-700">Amenities</div>
            <button type="button" className="px-3 py-1 text-sm border rounded inline-flex items-center gap-2" onClick={addAmenity}>
              <CheckIcon />
              Add Amenity
            </button>
            <div className="flex flex-wrap gap-2 mt-2">
              {(form.amenities || []).map((a, i) => (
                <span key={i} className="px-2 py-1 text-xs rounded bg-indigo-50 text-indigo-700 flex items-center gap-2">
                  {a}
                  <button
                    type="button"
                    className="text-indigo-600 hover:text-red-600"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to remove "${a}"?`)) {
                        setForm((s) => ({
                          ...s,
                          amenities: s.amenities.filter((_, idx) => idx !== i),
                        }));
                        toast.info(`Removed amenity: ${a}`);
                      }
                    }}
                  >
                    <XIcon />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            className="px-3 py-2 rounded-md text-sm font-medium bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 transition"
            onClick={() => onClose(false)}
            disabled={loading}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-white font-semibold shadow-md transition"
            disabled={loading || deleting}
            style={{ background: "linear-gradient(90deg,#10B981 0%,#047857 100%)" }}
          >
            {loading ? "Saving..." : editing ? "Update Property" : "Add Property"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* small inline icons to avoid new imports for tiny X/check used in badges */
function XIcon(props) {
  return (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CheckIcon(props) {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}