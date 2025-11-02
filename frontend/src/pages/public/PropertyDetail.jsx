import { useEffect, useState, useMemo } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { PropertiesAPI } from "../../api/properties";
import InquiryForm from "../../components/layout/InquiryForm";
import { MapPin, Video, Image, ChevronLeft, ChevronRight, X, Tag } from "lucide-react";

/*
  UI-only tweaks requested:
  - Remove the "Views: 0" display.
  - Remove the small "Video tour" chip on the top-right of the hero image.
  - Make Amenities more visible / noticeable (bigger gradient chips).
  - Keep all functionality unchanged.
*/

export default function PropertyDetail() {
  const { id } = useParams();
  const location = useLocation();
  const [p, setP] = useState(null);
  const [lightbox, setLightbox] = useState({ open: false, index: 0 });

  async function load() {
    const item = await PropertiesAPI.get(id);
    setP(item);
    PropertiesAPI.incrementView(id).catch(() => {});
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  // Scroll to hash when property loaded (keeps your behavior)
  useEffect(() => {
    if (location.hash && p) {
      const id = location.hash.replace("#", "");
      const timer = setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
          element.style.transition = "all 0.3s ease-in-out";
          element.style.backgroundColor = "rgba(255, 235, 59, 0.18)";
          const highlightTimer = setTimeout(() => {
            if (element) element.style.backgroundColor = "transparent";
          }, 2500);
          return () => clearTimeout(highlightTimer);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [location.hash, p]);

  const availableUnits = useMemo(
    () => (p?.units || []).filter((u) => u.status === "available"),
    [p?.units]
  );

  if (!p) return <div className="py-10 container-page">Loading...</div>;

  const addr =
    [p.street, p.city, p.province].filter(Boolean).join(", ") ||
    p.location ||
    "";
  const photos = p.photos?.length ? p.photos : [p.thumbnail].filter(Boolean);

  const openLightbox = (i) => setLightbox({ open: true, index: i });
  const closeLightbox = () => setLightbox({ open: false, index: 0 });
  const prev = (e) => {
    e?.stopPropagation();
    setLightbox((s) => ({
      ...s,
      index: (s.index - 1 + photos.length) % photos.length,
    }));
  };
  const next = (e) => {
    e?.stopPropagation();
    setLightbox((s) => ({ ...s, index: (s.index + 1) % photos.length }));
  };

  const typeBadge = p.propertyType
    ? p.propertyType.charAt(0).toUpperCase() + p.propertyType.slice(1)
    : null;

  return (
    <div className="py-6 container-page">
      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => history.back()}
          className="inline-flex items-center gap-2 text-sm text-slate-700 hover:text-slate-900"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Properties
        </button>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        <main>
          {/* Hero image */}
          <div
            className="relative cursor-zoom-in group rounded-lg overflow-hidden shadow-sm"
            onClick={() => openLightbox(0)}
          >
            <img
              src={photos?.[0] || "https://via.placeholder.com/1024x576?text=Property"}
              className="object-cover w-full h-72 md:h-96"
              alt={p.propertyName}
            />
            <div className="absolute left-4 top-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 text-white text-sm">
              <Image className="w-4 h-4" />
              <span>Photos</span>
            </div>
            {/* NOTE: video tour chip removed per request */}
            <div className="absolute inset-0 flex items-end p-4 pointer-events-none">
              <div className="pointer-events-auto bg-white/60 backdrop-blur-sm rounded-md px-3 py-1 text-xs text-slate-800">
                Click to enlarge
              </div>
            </div>
          </div>

          {/* Thumbnail grid */}
          {photos?.length > 1 && (
            <div className="grid grid-cols-4 gap-2 mt-3">
              {photos.slice(1, 9).map((ph, i) => (
                <button
                  key={i}
                  onClick={() => openLightbox(i + 1)}
                  className="block overflow-hidden rounded-md transform transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  <img
                    src={ph}
                    className="object-cover w-full h-24"
                    alt={`${p.propertyName} thumbnail ${i + 1}`}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Title & meta */}
          <div className="flex items-start justify-between mt-5 gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold leading-tight text-slate-900">
                {p.propertyName}
              </h1>
              <div className="mt-1 flex items-center gap-3 text-sm text-slate-600">
                <div className="inline-flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{addr}</span>
                </div>
                <div className="text-slate-300">•</div>
                <div className="text-sm text-slate-500">Updated: {new Date(p.updatedAt || p.createdAt).toLocaleDateString()}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {typeBadge && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-50 to-cyan-50 text-indigo-700 border border-indigo-100 text-sm">
                  <Tag className="w-4 h-4" />
                  <span>{typeBadge}</span>
                </div>
              )}
            </div>
          </div>

          {/* Video */}
          {p.videoTours?.[0] && (
            <section className="mt-6">
              <h3 className="mb-3 text-lg font-medium text-slate-800 flex items-center gap-2">
                <Video className="w-5 h-5 text-amber-600" />
                Property video tour
              </h3>
              <div className="w-full overflow-hidden bg-black rounded-lg aspect-video">
                <iframe
                  title="tour"
                  src={toEmbed(p.videoTours[0])}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </section>
          )}

          {/* Description */}
          <section className="mt-6">
            <h3 className="mb-2 text-lg font-medium text-slate-800">Description</h3>
            <p className="text-sm text-slate-700 leading-relaxed">{p.description || "—"}</p>
          </section>

          {/* Available Units */}
          <section className="mt-6">
            <h3 className="mb-3 text-lg font-medium text-slate-800">Available Units</h3>
            <div className="space-y-3">
              {availableUnits.length > 0 ? (
                availableUnits.map((u) => <UnitRow key={u._id} unit={u} />)
              ) : (
                <p className="text-sm text-slate-600">No units currently listed for this property.</p>
              )}
            </div>
          </section>

          {/* Amenities - elevated visuals */}
          {p.amenities?.length > 0 && (
            <section className="mt-6">
              <h3 className="mb-3 text-lg font-medium text-slate-800">Amenities</h3>
              <div className="flex flex-wrap gap-3">
                {p.amenities.map((a, i) => (
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

          {/* Site map */}
          {p.siteMap?.url && (
            <section className="mt-6">
              <h3 className="mb-3 text-lg font-medium text-slate-800">Site Development Plan</h3>
              {p.siteMap.mimeType === "application/pdf" ? (
                <a
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-200 bg-white text-sm shadow-sm hover:bg-slate-50"
                  href={p.siteMap.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  View Site Plan (PDF)
                </a>
              ) : (
                <img src={p.siteMap.url} className="w-full border rounded-lg" alt="Site Map" />
              )}
            </section>
          )}
        </main>

        {/* Aside / Inquiry */}
        <aside className="p-4 bg-white rounded-lg shadow-sm h-fit">
          <div className="mb-3 text-base font-medium">Property Inquiry</div>
          <InquiryForm propertyId={id} propertyName={p.propertyName} />

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
            src={photos[lightbox.index]}
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

function UnitRow({ unit }) {
  const {
    unitNumber,
    price,
    status,
    photos = [],
    thumbnail,
    specifications = {},
    _id,
  } = unit;
  const { bedrooms, bathrooms, floorArea } = specifications;
  const cover = thumbnail || photos?.[0] || "https://via.placeholder.com/640x360?text=No+Photo";

  const statusColors =
    status === "available"
      ? "bg-emerald-100 text-emerald-800"
      : status === "sold"
      ? "bg-rose-100 text-rose-800"
      : "bg-amber-100 text-amber-800";

  return (
    <Link
      to={`/unit/${_id}`}
      className="flex gap-3 p-3 transition border rounded-lg hover:shadow-sm hover:bg-white"
    >
      <img src={cover} className="object-cover w-28 h-20 rounded-md" alt="" />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="font-semibold truncate text-slate-900">{unitNumber || "Unit"}</div>
          <div className="ml-2 font-semibold text-slate-900">
            ₱ {Number(price || 0).toLocaleString()}
          </div>
        </div>

        <div className="mt-2 flex items-center gap-3">
          <div className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusColors}`}>{status}</div>
          <div className="text-sm text-slate-600">
            {bedrooms ? `${bedrooms} Bed` : ""}
            {bathrooms ? ` • ${bathrooms} Bath` : ""}
            {floorArea ? ` • ${floorArea} sqm` : ""}
          </div>
        </div>
      </div>
    </Link>
  );
}

function toEmbed(url) {
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (u.hostname.includes("youtube.com") && u.searchParams.get("v")) return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
    return url;
  } catch {
    return url;
  }
}