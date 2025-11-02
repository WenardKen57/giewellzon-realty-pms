import { useEffect, useState, useMemo } from "react";
// *** ADD useLocation ***
import { useParams, useLocation, Link } from "react-router-dom";
import { PropertiesAPI } from "../../api/properties";
import InquiryForm from "../../components/layout/InquiryForm";

export default function PropertyDetail() {
  const { id } = useParams();
  const location = useLocation(); // *** ADD this ***
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

  // *** NEW: useEffect to scroll to hash ***
  useEffect(() => {
    // Only scroll if there's a hash and property data (p) has loaded
    if (location.hash && p) {
      const id = location.hash.replace("#", "");
      // Use a timeout to ensure the element has rendered
      const timer = setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });

          // Optional: add a temporary highlight
          element.style.transition = "all 0.3s ease-in-out";
          element.style.backgroundColor = "rgba(255, 235, 59, 0.3)"; // Yellow highlight
          const highlightTimer = setTimeout(() => {
            if (element) {
              element.style.backgroundColor = "transparent";
            }
          }, 2500);

          return () => clearTimeout(highlightTimer);
        }
      }, 300); // 300ms delay to wait for render

      return () => clearTimeout(timer);
    }
  }, [location.hash, p]); // Re-run if hash changes or property data loads

  // Prepare the list of available units
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
  const prev = () =>
    setLightbox((s) => ({
      ...s,
      index: (s.index - 1 + photos.length) % photos.length,
    }));
  const next = () =>
    setLightbox((s) => ({ ...s, index: (s.index + 1) % photos.length }));

  return (
    <div className="py-6 container-page">
      <button onClick={() => history.back()} className="mb-3 text-sm underline">
        &larr; Back to Properties
      </button>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div>
          {/* ... (rest of the component is the same) ... */}

          {/* 🏠 Main Image, 🖼️ Thumbnail Grid, Property Info, etc. ... */}
          <div
            className="relative cursor-pointer group"
            onClick={() => openLightbox(0)}
          >
            <img
              src={
                photos?.[0] ||
                "https://via.placeholder.com/1024x576?text=Property"
              }
              className="object-cover w-full h-64 rounded-lg"
              alt={p.propertyName}
            />
            <div className="absolute inset-0 flex items-center justify-center transition-opacity opacity-0 bg-black/30 group-hover:opacity-100">
              <span className="text-sm text-white">Click to enlarge</span>
            </div>
          </div>

          {photos?.length > 1 && (
            <div className="grid grid-cols-4 gap-2 mt-2">
              {photos.slice(1, 5).map((ph, i) => (
                <img
                  key={i}
                  src={ph}
                  onClick={() => openLightbox(i + 1)}
                  className="object-cover w-full h-24 transition-transform rounded cursor-pointer hover:scale-105"
                  alt={`${p.propertyName} thumbnail ${i + 1}`}
                />
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-xl font-semibold">{p.propertyName}</h1>
              <div className="text-sm text-neutral-600">{addr}</div>
            </div>
            {p.propertyType && (
              <div className="mt-1 text-sm font-medium text-brand-primary">
                Type:{" "}
                {p.propertyType.charAt(0).toUpperCase() +
                  p.propertyType.slice(1)}
              </div>
            )}
          </div>

          {p.videoTours?.[0] && (
            <div className="mt-6">
              <h3 className="mb-2 font-medium">Property video tour</h3>
              <div className="w-full overflow-hidden bg-black rounded-lg aspect-video">
                <iframe
                  title="tour"
                  src={toEmbed(p.videoTours[0])}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          <div className="mt-6">
            <h3 className="mb-2 font-medium">Description</h3>
            <p className="text-sm text-neutral-700">{p.description || "—"}</p>
          </div>

          {/* 🏘️ Available Units */}
          <div className="mt-6">
            <h3 className="mb-2 font-medium">Available Units</h3>
            <div className="space-y-3">
              {availableUnits.length > 0 ? (
                availableUnits.map((u) => <UnitRow key={u._id} unit={u} />)
              ) : (
                <p className="text-sm text-neutral-700">
                  No units currently listed for this property.
                </p>
              )}
            </div>
          </div>

          {/* ... (Amenities and Site Map sections) ... */}
          {p.amenities?.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 font-medium">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {p.amenities.map((a, i) => (
                  <div
                    key={i}
                    className="px-3 py-1 text-sm border rounded-full bg-brand-light border-brand-gray"
                  >
                    {a}
                  </div>
                ))}
              </div>
            </div>
          )}

          {p.siteMap?.url && (
            <div className="mt-6">
              <h3 className="mb-2 font-medium">Site Development Plan</h3>
              {p.siteMap.mimeType === "application/pdf" ? (
                <a
                  className="btn btn-outline"
                  href={p.siteMap.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  View Site Plan (PDF)
                </a>
              ) : (
                <img
                  src={p.siteMap.url}
                  className="w-full border rounded-lg"
                  alt="Site Map"
                />
              )}
            </div>
          )}
        </div>

        {/* 📝 Inquiry Form */}
        <aside className="p-4 card h-fit">
          <div className="mb-2 font-medium">Property Inquiry</div>
          <InquiryForm propertyId={id} propertyName={p.propertyName} />

          <div className="p-3 mt-6 text-sm border rounded bg-brand-light border-brand-gray">
            <div className="mb-1 font-medium">Contact Us</div>
            <div>
              Brgy. San Isidro, Cabanatuan City, Nueva Ecija, Philippines
            </div>
            <div>+63 966 752 7631</div>
            <div>info@giewellzon.com</div>
          </div>
        </aside>
      </div>

      {/* Lightbox ... (no change here) ... */}
      {lightbox.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={closeLightbox}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            className="absolute text-3xl text-white left-4 hover:text-gray-300"
          >
            ‹
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
              next();
            }}
            className="absolute text-3xl text-white right-4 hover:text-gray-300"
          >
            ›
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeLightbox();
            }}
            className="absolute text-2xl text-white top-4 right-4 hover:text-gray-300"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

// Unit row linking to Unit detail page
function UnitRow({ unit }) {
  const {
    unitNumber,
    price,
    status,
    photos = [],
    specifications = {},
    _id,
  } = unit;
  const { bedrooms, bathrooms, floorArea } = specifications;
  const cover =
    photos?.[0] || "https://via.placeholder.com/640x360?text=No+Photo";
  return (
    <Link
      to={`/unit/${_id}`}
      className="flex gap-3 p-3 transition border rounded hover:bg-gray-50"
    >
      <img src={cover} className="object-cover w-24 h-24 rounded" alt="" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="font-semibold truncate">
            {unitNumber || "Unit"}
          </div>
          <div className="ml-2 font-semibold text-brand-primary">
            ₱ {Number(price || 0).toLocaleString()}
          </div>
        </div>
        <div className="mt-1 text-xs tracking-wide uppercase">
          {status}
        </div>
        <div className="mt-1 text-sm text-neutral-700">
          {bedrooms ? `${bedrooms} Bed` : ""}
          {bathrooms ? ` • ${bathrooms} Bath` : ""}
          {floorArea ? ` • ${floorArea} sqm` : ""}
        </div>
      </div>
    </Link>
  );
}

// ... (toEmbed function is unchanged) ...
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
