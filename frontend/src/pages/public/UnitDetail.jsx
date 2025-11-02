import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { UnitsAPI } from "../../api/units";
import { toast } from "react-toastify";
import InquiryForm from "../../components/layout/InquiryForm";
import { Image, Video, ChevronLeft, ChevronRight, X, MapPin } from "lucide-react";

/*
  UI-only improvements:
  - Elevated visual style to match the PropertyDetail/other admin modals.
  - Added icons, subtle gradients, colored status badges, nicer photo grid, improved lightbox controls.
  - Amenities are more prominent (pill chips with subtle gradient).
  - Kept all logic / API calls unchanged (only markup/styles updated).
*/

function toEmbed(url) {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be")
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (u.hostname.includes("youtube.com") && u.searchParams.get("v"))
      return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
    return url;
  } catch {
    return url;
  }
}

export default function UnitDetail() {
  const { unitId } = useParams();
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState({ open: false, index: 0 });

  useEffect(() => {
    if (unitId) {
      setLoading(true);
      UnitsAPI.get(unitId) // NOTE: Assuming UnitsAPI.get(id) exists
        .then((data) => {
          setUnit(data);
        })
        .catch((err) => {
          console.error("Failed to load unit:", err);
          toast.error("Failed to load unit details.");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [unitId]);

  if (loading) return <div className="py-10 container-page">Loading...</div>;
  if (!unit) return <div className="py-10 container-page">Unit not found.</div>;

  const {
    specifications = {},
    price = 0,
    photos = [],
    thumbnail,
    videoTours = [],
    amenities = [],
    description,
    property: propertyInfo, // Assuming .get() populates this like .list() does
    status,
    unitNumber,
  } = unit;

  const {
    bedrooms = 0,
    bathrooms = 0,
    floorArea = 0,
    lotArea = 0,
    parking = 0,
  } = specifications;

  // Use unit-specific photos, fallback to property thumbnail
  const displayPhotos = photos.length
    ? photos
    : [propertyInfo?.thumbnail].filter(Boolean);

  // Lightbox functions (from PropertyDetail.jsx)
  const openLightbox = (i) => setLightbox({ open: true, index: i });
  const closeLightbox = () => setLightbox({ open: false, index: 0 });
  const prev = (e) => {
    e?.stopPropagation();
    setLightbox((s) => ({
      ...s,
      index: (s.index - 1 + displayPhotos.length) % displayPhotos.length,
    }));
  };
  const next = (e) => {
    e?.stopPropagation();
    setLightbox((s) => ({
      ...s,
      index: (s.index + 1) % displayPhotos.length,
    }));
  };

  const statusClasses =
    status === "available"
      ? "bg-emerald-100 text-emerald-800"
      : status === "sold"
      ? "bg-rose-100 text-rose-800"
      : "bg-amber-100 text-amber-800";

  return (
    <div className="py-6 container-page">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => history.back()}
            className="inline-flex items-center gap-2 text-sm text-slate-700 hover:text-slate-900"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          {propertyInfo && (
            <Link
              to={`/properties/${propertyInfo._id}`}
              className="text-sm text-slate-600 underline"
            >
              View Parent Property →
            </Link>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        <main>
          {/* Hero image */}
          <div
            className="relative cursor-zoom-in group rounded-lg overflow-hidden shadow-sm"
            onClick={() => openLightbox(0)}
          >
            <img
              src={displayPhotos?.[0] || "https://via.placeholder.com/1024x576?text=Unit"}
              className="object-cover w-full h-72 md:h-96"
              alt={unitNumber || "Unit"}
            />
            <div className="absolute left-4 top-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 text-white text-sm">
              <Image className="w-4 h-4" />
              <span>Photos</span>
            </div>
            <div className="absolute inset-0 flex items-end p-4 pointer-events-none">
              <div className="pointer-events-auto bg-white/60 backdrop-blur-sm rounded-md px-3 py-1 text-xs text-slate-800">
                Click to enlarge
              </div>
            </div>
          </div>

          {/* Thumbnail Grid */}
          {displayPhotos?.length > 1 && (
            <div className="grid grid-cols-4 gap-2 mt-3">
              {displayPhotos.slice(1, 9).map((ph, i) => (
                <button
                  key={i}
                  onClick={() => openLightbox(i + 1)}
                  className="block overflow-hidden rounded-md transform transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  <img src={ph} className="object-cover w-full h-24" alt={`Unit ${i + 1}`} />
                </button>
              ))}
            </div>
          )}

          {/* Title & meta */}
          <div className="flex items-start justify-between mt-5 gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold leading-tight text-slate-900">
                {unitNumber || "Unit"}
              </h1>
              <div className="mt-1 flex items-center gap-3 text-sm text-slate-600">
                <div className="inline-flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="truncate">
                    {propertyInfo?.city}, {propertyInfo?.province}
                  </span>
                </div>
                <div className="text-slate-300">•</div>
                <div className="text-sm text-slate-500">Status: <span className={`ml-2 inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${statusClasses}`}>{status}</span></div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <div className="text-lg font-bold text-slate-900">₱ {Number(price).toLocaleString()}</div>
              {videoTours?.[0] && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-sm">
                  <Video className="w-4 h-4" />
                  Video tour available
                </div>
              )}
            </div>
          </div>

          {/* Specifications */}
          <section className="mt-6">
            <h3 className="mb-3 text-lg font-medium text-slate-800">Specifications</h3>
            <div className="grid gap-2 p-3 text-sm rounded bg-slate-50 md:grid-cols-3">
              {lotArea > 0 && (<div>Lot Area: <strong>{lotArea} sqm</strong></div>)}
              {floorArea > 0 && (<div>Floor Area: <strong>{floorArea} sqm</strong></div>)}
              {bedrooms > 0 && (<div>Bedrooms: <strong>{bedrooms}</strong></div>)}
              {bathrooms > 0 && (<div>Bathrooms: <strong>{bathrooms}</strong></div>)}
              {parking > 0 && (<div>Parking: <strong>{parking}</strong></div>)}
            </div>
          </section>

          {/* Video Tour */}
          {videoTours?.[0] && (
            <section className="mt-6">
              <h3 className="mb-3 text-lg font-medium text-slate-800 flex items-center gap-2">
                <Video className="w-5 h-5 text-amber-600" />
                Unit video tour
              </h3>
              <div className="w-full overflow-hidden bg-black rounded-lg aspect-video">
                <iframe
                  title="tour"
                  src={toEmbed(videoTours[0])}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </section>
          )}

          {/* Amenities - elevated */}
          {amenities?.length > 0 && (
            <section className="mt-6">
              <h3 className="mb-3 text-lg font-medium text-slate-800">Amenities</h3>
              <div className="flex flex-wrap gap-3">
                {amenities.map((a, i) => (
                  <div
                    key={i}
                    className="px-3 py-2 text-sm font-medium rounded-full shadow-sm bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-800 border border-emerald-100"
                  >
                    {a}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Description */}
          {description && (
            <section className="mt-6">
              <h3 className="mb-2 text-lg font-medium text-slate-800">Description</h3>
              <p className="text-sm text-slate-700 leading-relaxed">{description}</p>
            </section>
          )}
        </main>

        {/* Aside / Inquiry */}
        <aside className="p-4 bg-white rounded-lg shadow-sm h-fit">
          <div className="mb-3 text-base font-medium">Inquire about this Unit</div>
          <InquiryForm
            propertyId={propertyInfo?._id}
            propertyName={propertyInfo?.propertyName}
            // InquiryForm may be enhanced to accept unitNumber
          />

          <div className="p-3 mt-6 text-sm rounded-md bg-slate-50 border border-slate-100">
            <div className="mb-1 font-medium text-slate-800">Contact Us</div>
            <div className="text-slate-600">Brgy. San Isidro, Cabanatuan City, Nueva Ecija, Philippines</div>
            <div className="text-slate-600 mt-1">+63 966 752 7631</div>
            <div className="text-slate-600 mt-1">info@giewellzon.com</div>
          </div>
        </aside>
      </div>

      {/* Lightbox */}
      {lightbox.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={closeLightbox}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              prev(e);
            }}
            className="absolute left-4 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
            aria-label="Previous"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>

          <img
            src={displayPhotos[lightbox.index]}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-lg"
            onClick={(e) => e.stopPropagation()}
            alt="Lightbox"
          />

          <button
            onClick={(e) => {
              e.stopPropagation();
              next(e);
            }}
            className="absolute right-4 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
            aria-label="Next"
          >
            <ChevronRight className="w-7 h-7" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              closeLightbox();
            }}
            className="absolute top-4 right-4 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}