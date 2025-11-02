import { useEffect, useState } from "react";
import { toast } from "react-toastify";
// Import BOTH APIs
import { PropertiesAPI } from "../../api/properties";
import { UnitsAPI } from "../../api/units";
import { X, Cloud, Image, Trash2, Plus } from "lucide-react";

/*
  UI-only update to match the SalesModals/PropertyEditor aesthetic:
  - Centered rounded modal card, gradient header icon, nicer inputs, dashed upload area,
    photo grid with hover remove buttons, and green-gradient primary action.
  - Kept all functionality exactly the same: media uploads, deletions, API calls,
    validation, previews, and behavior unchanged.
*/

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
  amenities: [],
  videoTours: [],
  thumbnail: "",
};

export default function UnitEditor({ open, onClose, editing, propertyId }) {
  const [form, setForm] = useState(BLANK_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Media state
  const [newThumbnail, setNewThumbnail] = useState(null);
  const [thumbPreview, setThumbPreview] = useState("");
  const [existingThumbnail, setExistingThumbnail] = useState("");

  const [newPhotos, setNewPhotos] = useState([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm((s) => ({
          ...s,
          ...editing,
          specifications: {
            ...BLANK_FORM.specifications,
            ...(editing.specifications || {}),
          },
          amenities: editing.amenities || [],
          videoTours: editing.videoTours || [],
        }));
        setExistingThumbnail(editing.thumbnail || "");
        setExistingPhotos(editing.photos || []);
      } else {
        // Reset for new unit
        setForm(BLANK_FORM);
        setErrors({});
        setNewThumbnail(null);
        setThumbPreview("");
        setExistingThumbnail("");
        setNewPhotos([]);
        setExistingPhotos([]);
      }
    } else {
      // modal closed: clear selected previews
      setNewThumbnail(null);
      setThumbPreview("");
      setNewPhotos([]);
      setNewPhotoPreviews([]);
    }
  }, [editing, open]);

  // thumbnail preview for selected file
  useEffect(() => {
    if (!newThumbnail) {
      setThumbPreview("");
      return;
    }
    const url = URL.createObjectURL(newThumbnail);
    setThumbPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [newThumbnail]);

  // previews for newly selected photos
  useEffect(() => {
    newPhotoPreviews.forEach((u) => URL.revokeObjectURL(u));
    if (!newPhotos || newPhotos.length === 0) {
      setNewPhotoPreviews([]);
      return;
    }
    const urls = newPhotos.map((f) => URL.createObjectURL(f));
    setNewPhotoPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [newPhotos]);

  if (!open) return null;

  function validate() {
    const newErrors = {};
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
      newErrors.price = "Price must be a positive number.";
    return newErrors;
  }

  async function removeExistingThumb() {
    if (!editing?._id) return;
    if (!window.confirm("Remove existing thumbnail?")) return;
    setDeleting(true);
    try {
      await UnitsAPI.deleteThumbnail(editing._id);
      setExistingThumbnail("");
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

  function removeNewPhoto(index) {
    setNewPhotos((s) => s.filter((_, i) => i !== index));
  }

  const handlePhotoSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setNewPhotos((s) => {
      const combined = [...(s || []), ...files];
      return combined.slice(0, 15);
    });
    e.target.value = null;
  };

  async function save(e) {
    e.preventDefault();
    if (editing) {
      const confirmed = window.confirm("Are you sure you want to update this unit?");
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
      delete payload.photos;
      delete payload.thumbnail;

      let res;
      if (editing) {
        res = await UnitsAPI.update(editing._id, payload);
      } else {
        if (!propertyId) {
          toast.error("No Property ID provided. Cannot create unit.");
          setLoading(false);
          return;
        }
        res = await PropertiesAPI.createUnit(propertyId, payload);
      }

      const id = res._id || editing._id;

      if (newThumbnail) {
        await UnitsAPI.uploadThumbnail(id, newThumbnail);
      }
      if (newPhotos.length > 0) {
        await UnitsAPI.uploadPhotos(id, newPhotos);
      }

      setNewThumbnail(null);
      setNewPhotos([]);

      toast.success(editing ? "Unit updated successfully!" : "Unit added successfully!");
      onClose(true);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to save unit.");
    } finally {
      setLoading(false);
    }
  }

  function setSpec(key, value) {
    setForm((s) => ({ ...s, specifications: { ...s.specifications, [key]: value } }));
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
    if (!url) return;
    if (!isValidYouTubeUrl(url)) {
      toast.warn("Please enter a valid YouTube URL.");
      return;
    }
    setForm((s) => ({ ...s, videoTours: [...(s.videoTours || []), url.trim()] }));
    toast.info("Video link added!");
  }

  // Helper icons for badges
  function IconCheckSmall() {
    return (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <div className="fixed inset-0 z-50 grid p-4 overflow-y-auto bg-black/60 place-items-center">
      <form
        onSubmit={save}
        className="w-full max-w-2xl p-6 my-8 space-y-6 bg-white rounded-xl shadow-2xl ring-1 ring-black/5"
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
                {editing ? "Update Unit" : "Add New Unit"}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Provide unit details and upload media. Media uploads are appended.
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

        {/* Unit Info */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-600">Unit Number / Name</label>
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
              value={form.unitNumber}
              onChange={(e) => setForm((s) => ({ ...s, unitNumber: e.target.value }))}
              placeholder="e.g., Apt 101 or Main House"
            />
            {errors.unitNumber && <p className="text-xs text-red-500 mt-1">{errors.unitNumber}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">Price</label>
            <input
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
              type="number"
              value={form.price}
              onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))}
              required
            />
            {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">Status</label>
            <select
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
              value={form.status}
              onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
            >
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="rented">Rented</option>
            </select>
          </div>
        </section>

        {/* Specs */}
        <section>
          <div className="mb-2 font-medium text-gray-700">Specifications</div>
          <div className="grid gap-3 md:grid-cols-3">
            <Spec label="Lot Area (sqm)" value={form.specifications.lotArea} onChange={(v) => setSpec("lotArea", v)} />
            <Spec label="Floor Area (sqm)" value={form.specifications.floorArea} onChange={(v) => setSpec("floorArea", v)} />
            <Spec label="Bedrooms" value={form.specifications.bedrooms} onChange={(v) => setSpec("bedrooms", v)} />
            <Spec label="Bathrooms" value={form.specifications.bathrooms} onChange={(v) => setSpec("bathrooms", v)} />
            <Spec label="Parking" value={form.specifications.parking} onChange={(v) => setSpec("parking", v)} />
          </div>
        </section>

        {/* Media */}
        <section className="grid grid-cols-1 gap-6">
          <div>
            <div className="mb-1 text-sm font-medium text-gray-700">Unit Thumbnail</div>
            <p className="text-xs text-gray-500 mb-2">Main cover image for the unit.</p>
            <div className="flex items-center gap-4">
              <div className="relative w-28 h-20 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden border">
                {thumbPreview || existingThumbnail ? (
                  <img src={thumbPreview || existingThumbnail} alt="thumbnail" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Image className="w-6 h-6" />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 flex-grow">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 cursor-pointer hover:bg-gray-50">
                  <Cloud className="w-4 h-4 text-slate-500" />
                  <span className="text-sm">{newThumbnail ? "Change selected" : "Select thumbnail"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setNewThumbnail(e.target.files?.[0] || null)} />
                </label>

                <div className="flex items-center gap-3">
                  {newThumbnail && <button type="button" className="text-sm text-red-600 hover:underline" onClick={() => setNewThumbnail(null)}>Clear</button>}

                  {!newThumbnail && existingThumbnail && (
                    <button type="button" className="inline-flex items-center gap-2 text-sm text-red-600 hover:underline" onClick={removeExistingThumb} disabled={deleting}>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{deleting ? "..." : "Remove existing"}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-1 text-sm font-medium text-gray-700">Additional Photos</div>
            <p className="text-xs text-gray-500 mb-2">Upload additional photos. New photos will be appended.</p>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-3">
              {existingPhotos.map((p, i) => (
                <div key={`existing-${i}`} className="relative group aspect-square rounded-md overflow-hidden border">
                  <img src={p} alt={`Existing ${i}`} className="w-full h-full object-cover" />
                  <button type="button" className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeExistingPhoto(p)} disabled={deleting} title="Remove">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {newPhotoPreviews.map((url, idx) => (
                <div key={`new-${idx}`} className="relative group aspect-square rounded-md overflow-hidden border-2 border-blue-400">
                  <img src={url} alt={`New ${idx}`} className="w-full h-full object-cover" />
                  <button type="button" className="absolute top-1 right-1 bg-gray-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeNewPhoto(idx)} title="Remove">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            <label className="relative flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                <Cloud className="w-7 h-7 mb-2 text-slate-400" />
                <p className="mb-1 text-sm text-slate-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-slate-500">PNG, JPG, GIF (up to 15)</p>
              </div>
              <input type="file" accept="image/*" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handlePhotoSelect} />
            </label>
          </div>
        </section>

        {/* Video Tours & Amenities */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                  <button type="button" className="text-xs text-slate-600 hover:underline" onClick={() => setForm((s) => ({ ...s, videoTours: s.videoTours.filter((_, idx) => idx !== i) }))}>remove</button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-2 text-sm font-medium text-gray-700">Amenities</div>
            <button type="button" className="px-3 py-1 text-sm border rounded inline-flex items-center gap-2" onClick={addAmenity}>
              <Plus className="w-4 h-4" />
              Add Amenity
            </button>
            <div className="flex flex-wrap gap-2 mt-2">
              {(form.amenities || []).map((a, i) => (
                <span key={i} className="px-2 py-1 text-xs rounded bg-indigo-50 text-indigo-700 flex items-center gap-2">
                  {a}
                  <button type="button" className="text-indigo-600 hover:text-red-600" onClick={() => {
                    if (window.confirm(`Are you sure you want to remove "${a}"?`)) {
                      setForm((s) => ({ ...s, amenities: s.amenities.filter((_, idx) => idx !== i) }));
                      toast.info(`Removed amenity: ${a}`);
                    }
                  }}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button type="button" className="px-3 py-2 rounded-md text-sm font-medium bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 transition" onClick={() => onClose(false)} disabled={loading}>
            Cancel
          </button>

          <button type="submit" className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-white font-semibold shadow-md transition" disabled={loading || deleting} style={{ background: "linear-gradient(90deg,#10B981 0%,#047857 100%)" }}>
            {loading ? "Saving..." : editing ? "Update Unit" : "Add Unit"}
          </button>
        </div>
      </form>
    </div>
  );
}

// Helper components
function Field({ label, children, error }) {
  return (
    <div>
      <div className="mb-1 text-sm font-medium text-gray-600">{label}</div>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function Spec({ label, value, onChange }) {
  return (
    <div>
      <div className="mb-1 text-sm text-gray-600">{label}</div>
      <input className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" value={value || ""} type="number" min="0" onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function isValidYouTubeUrl(url) {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.hostname === "youtu.be" || u.hostname.includes("youtube.com") || url.startsWith("https://");
  } catch {
    return false;
  }
}