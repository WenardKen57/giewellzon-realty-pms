import { useEffect, useState, useMemo } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { PropertiesAPI } from "../../api/properties";
import InquiryForm from "../../components/layout/InquiryForm";

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

  // (useEffect for scrolling - no change)
  useEffect(() => {
    if (location.hash && p) {
      const id = location.hash.replace("#", "");
      const timer = setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
          element.style.transition = "all 0.3s ease-in-out";
          element.style.backgroundColor = "rgba(255, 235, 59, 0.3)";
          const highlightTimer = setTimeout(() => {
            if (element) {
              element.style.backgroundColor = "transparent";
            }
          }, 2500);

          return () => clearTimeout(highlightTimer);
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [location.hash, p]);

  // Group available units
  const groupedUnits = useMemo(() => {
    if (!p?.units) return [];

    const availableUnits = p.units.filter((u) => u.status === "available");

    const groups = availableUnits.reduce((acc, unit) => {
      const { specifications, price, photos = [], unitNumber } = unit;
      const {
        bedrooms = 0,
        bathrooms = 0,
        floorArea = 0,
      } = specifications || {};

      const key = `name-${unitNumber}-beds-${bedrooms}-baths-${bathrooms}-sqm-${floorArea}`;

      if (!acc[key]) {
        acc[key] = {
          key,
          specifications,
          count: 0,
          minPrice: price,
          photos: [],
          representativeUnitId: unit._id,
          unitName: unitNumber || "Unit",
        };
      }

      acc[key].count += 1;
      acc[key].photos.push(...photos);
      if (price < acc[key].minPrice) acc[key].minPrice = price;

      return acc;
    }, {});

    return Object.values(groups);
  }, [p?.units]);

  if (!p) return <div className="py-10 container-page">Loading...</div>;

  // ... (rest of the component is identical to the last version) ...
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
          {/* ... (Main Image, Thumbnails, Property Info - no changes) ... */}
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
              <span className="text-white text-sm">Click to enlarge</span>
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
              {groupedUnits.length > 0 ? (
                groupedUnits.map((group) => (
                  <UnitGroupCard key={group.key} group={group} />
                ))
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
                    className="px-3 py-1 text-sm rounded-full bg-brand-light border border-brand-gray"
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
            className="absolute left-4 text-white text-3xl hover:text-gray-300"
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
            className="absolute right-4 text-white text-3xl hover:text-gray-300"
          >
            ›
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeLightbox();
            }}
            className="absolute top-4 right-4 text-2xl text-white hover:text-gray-300"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

// 🏘️ UnitGroupCard with carousel support
function UnitGroupCard({ group }) {
  const navigate = useNavigate();
  const {
    specifications,
    count,
    minPrice,
    photos = [],
    key,
    representativeUnitId,
    unitName, // This will now correctly be the unitNumber
  } = group;

  const [index, setIndex] = useState(0);
  const {
    bedrooms = 0,
    bathrooms = 0,
    floorArea = 0,
    lotArea = 0,
    parking = 0,
  } = specifications || {};

  let specTitle = "Unit Specifications";
  if (bedrooms > 0) {
    specTitle = `${bedrooms} Bedroom ${
      bathrooms > 0 ? `/ ${bathrooms} Bathroom` : ""
    }`;
  } else if (floorArea > 0) {
    specTitle = `${floorArea} sqm Unit`;
  } else if (lotArea > 0) {
    specTitle = `${lotArea} sqm Lot`;
  }

  const hasPhotos = photos && photos.length > 0;

  return (
    <div
      id={key}
      className="p-4 card space-y-3 scroll-mt-20 cursor-pointer hover:shadow-lg transition-shadow duration-200"
      onClick={() => navigate(`/unit/${representativeUnitId}`)}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-lg font-semibold text-brand-primary">
            {unitName} {/* This will now show "Unit A1" etc. */}
          </div>
          <div className="text-sm text-neutral-600 -mt-1">{specTitle}</div>
        </div>
        <span className="flex-shrink-0 badge badge-green">{count} Available</span>
      </div>

      <div className="font-semibold text-brand-primary">
        Starting from: ₱ {Number(minPrice || 0).toLocaleString()}
      </div>
      {/* 🖼️ Carousel for unit photos */}
      {hasPhotos && (
        <div className="relative w-full overflow-hidden rounded-lg h-56 bg-gray-100">
          <img
            src={photos[index]}
            className="object-cover w-full h-full transition-all"
            alt={`Unit photo ${index + 1}`}
          />
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent navigation when clicking buttons
                  setIndex((index - 1 + photos.length) % photos.length);
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full px-2 py-1 text-lg"
              >
                ‹
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent navigation
                  setIndex((index + 1) % photos.length);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full px-2 py-1 text-lg"
              >
                ›
              </button>
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                {photos.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i === index ? "bg-white" : "bg-white/40"
                    }`}
                  ></div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      <div className="grid gap-2 p-3 text-sm rounded bg-gray-50 md:grid-cols-3">
        {lotArea > 0 && (
          <div>
            Lot Area: <strong>{lotArea} sqm</strong>
          </div>
        )}
        {floorArea > 0 && (
          <div>
            Floor Area: <strong>{floorArea} sqm</strong>
          </div>
        )}
        {bedrooms > 0 && (
          <div>
            Bedrooms: <strong>{bedrooms}</strong>
          </div>
        )}
        {bathrooms > 0 && (
          <div>
            Bathrooms: <strong>{bathrooms}</strong>
          </div>
        )}
        {parking > 0 && (
          <div>
            Parking: <strong>{parking}</strong>
          </div>
        )}
      </div>
    </div>
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
