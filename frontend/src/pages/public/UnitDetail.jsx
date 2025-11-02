import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom"; // Added useNavigate
import { UnitsAPI } from "../../api/units";
import { toast } from "react-toastify";
import InquiryForm from "../../components/layout/InquiryForm"; // Assuming this path

// Helper function from PropertyDetail.jsx
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
  // *** 🚀 FIXED: Reverted back to `unitId` ***
  const { unitId } = useParams();
  const navigate = useNavigate();
  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState({ open: false, index: 0 });

  useEffect(() => {
    // *** 🚀 FIXED: Check for `unitId` ***
    if (unitId) {
      setLoading(true);
      // *** 🚀 FIXED: Use `unitId` ***
      UnitsAPI.get(unitId)
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
    // *** 🚀 FIXED: Use `unitId` in dependency array ***
  }, [unitId]);

  if (loading) return <div className="py-10 container-page">Loading...</div>;
  if (!unit) return <div className="py-10 container-page">Unit not found.</div>;

  const {
    specifications = {},
    price = 0,
    photos = [],
    // videoTours = [], // This is for unit-specific videos, we'll use the property's
    description,
    property: propertyInfo, // This has the property-level details
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
  const prev = () =>
    setLightbox((s) => ({
      ...s,
      index: (s.index - 1 + displayPhotos.length) % displayPhotos.length,
    }));
  const next = () =>
    setLightbox((s) => ({
      ...s,
      index: (s.index + 1) % displayPhotos.length,
    }));

  return (
    <div className="py-6 container-page">
      <div className="flex justify-between items-center mb-3">
        {/* MODIFIED: Use navigate(-1) for a more reliable "Back" */}
        <button onClick={() => navigate(-1)} className="text-sm underline">
          &larr; Back
        </button>
        {/* This is the link to the parent property */}
        {propertyInfo && (
          <Link
            to={`/property/${propertyInfo._id}`}
            className="text-sm underline"
          >
            View Parent Property &rarr;
          </Link>
        )}
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        <div>
          {/* Main Image */}
          <div
            className="relative cursor-pointer group"
            onClick={() => openLightbox(0)}
          >
            <img
              src={
                displayPhotos?.[0] ||
                "https://via.placeholder.com/1024x576?text=Unit"
              }
              className="object-cover w-full h-64 rounded-lg"
              alt={unit.unitNumber || "Unit"}
            />
            <div className="absolute inset-0 flex items-center justify-center transition-opacity opacity-0 bg-black/30 group-hover:opacity-100">
              <span className="text-white text-sm">Click to enlarge</span>
            </div>
          </div>

          {/* Thumbnail Grid */}
          {displayPhotos?.length > 1 && (
            <div className="grid grid-cols-4 gap-2 mt-2">
              {displayPhotos.slice(1, 5).map((ph, i) => (
                <img
                  key={i}
                  src={ph}
                  onClick={() => openLightbox(i + 1)}
                  className="object-cover w-full h-24 transition-transform rounded cursor-pointer hover:scale-105"
                  alt={`Unit thumbnail ${i + 1}`}
                />
              ))}
            </div>
          )}

          {/* Unit Info */}
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-xl font-semibold">
                {unit.unitNumber || "Unit"}
              </h1>
              {/* Location is here, below the unit name/title */}
              <div className="text-sm text-neutral-600">
                {propertyInfo?.city}, {propertyInfo?.province}
              </div>
            </div>
            <div className="mt-1 text-lg font-bold text-brand-primary">
              ₱ {Number(price).toLocaleString()}
            </div>
          </div>

          {/* Specifications */}
          <div className="mt-6">
            <h3 className="mb-2 font-medium">Specifications</h3>
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

          {/* === ADDED: Property Video Tour === */}
          {/* This pulls from the parent property, as requested */}
          {propertyInfo?.videoTours?.[0] && (
            <div className="mt-6">
              <h3 className="mb-2 font-medium">Property Video Tour</h3>
              <div className="w-full overflow-hidden bg-black rounded-lg aspect-video">
                <iframe
                  title="tour"
                  src={toEmbed(propertyInfo.videoTours[0])}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* === ADDED: Amenities === */}
          {/* This also pulls from the parent property */}
          {propertyInfo?.amenities?.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 font-medium">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {propertyInfo.amenities.map((a, i) => (
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

          {/* Unit Description */}
          {description && (
            <div className="mt-6">
              <h3 className="mb-2 font-medium">Unit Description</h3>
              <p className="text-sm text-neutral-700">{description}</p>
            </div>
          )}
        </div>

        {/* Inquiry Form */}
        <aside className="p-4 card h-fit">
          <div className="mb-2 font-medium">Inquire About This Unit</div>
          {/* MODIFIED: Pass unit info to the form */}
          <InquiryForm
            propertyId={propertyInfo?._id}
            propertyName={propertyInfo?.propertyName}
            unitId={unit._id}
            unitName={unit.unitNumber}
          />
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

      {/* Lightbox */}
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
            src={displayPhotos[lightbox.index]}
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

