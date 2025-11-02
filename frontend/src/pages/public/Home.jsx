import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PropertiesAPI } from "../../api/properties";
import { formatPHP } from "../../utils/format";

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await PropertiesAPI.getFeaturedProperties();
        const list = res.data || res || [];

        // Fetch unit stats for each featured property (min price and available count)
        const enriched = await Promise.all(
          list.map(async (p) => {
            try {
              const units = await PropertiesAPI.listUnits(p._id);
              const available = (units || []).filter(
                (u) => u.status === "available"
              );
              const minPrice =
                available.length > 0
                  ? Math.min(
                      ...available
                        .map((u) => Number(u.price))
                        .filter((n) => Number.isFinite(n))
                    )
                  : null;
              return { ...p, availableUnits: available.length, minPrice };
            } catch {
              // If unit fetch fails, keep original property data
              return { ...p };
            }
          })
        );
        setFeatured(enriched);
      } catch (err) {
        console.error("Failed to load featured properties:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div className="animate-fadeIn">
      {/* 1️⃣ Hero Section */}
      <section
        className="relative flex items-center min-h-screen text-white bg-center bg-no-repeat bg-cover"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent"></div>
        <div className="relative z-10 w-full max-w-screen-xl px-4 mx-auto sm:px-6 lg:px-8">
          <div className="max-w-xl">
            <h1 className="mb-4 text-4xl font-bold leading-tight text-white drop-shadow-md md:text-5xl lg:text-6xl">
              Find Your Ideal Home
            </h1>
            <p className="max-w-lg mb-8 text-lg text-gray-200 md:text-xl">
              Explore curated listings, schedule viewings, and connect with our
              team for financing options.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/properties"
                className="inline-block px-8 py-3 text-base font-medium text-white transition-all duration-300 transform bg-red-600 rounded-lg shadow-lg hover:bg-red-700 hover:shadow-xl hover:scale-[1.02]"
              >
                Browse Properties
              </Link>
              <Link
                to="/contact"
                className="inline-block px-8 py-3 text-base font-medium text-white transition-all duration-300 bg-transparent border-2 border-white/80 rounded-lg hover:bg-white hover:text-green-700"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2️⃣ Featured Properties Section */}
      <section className="py-20 bg-white">
        <div className="w-full max-w-screen-xl px-4 mx-auto sm:px-6 lg:px-8">
          <h2 className="mb-4 text-3xl font-bold text-center text-green-800 md:text-4xl">
            Featured Properties
          </h2>
          <p className="mb-12 text-lg text-center text-gray-500">
            Discover our most sought-after homes and properties.
          </p>

          {/* This conditional rendering block is now correctly structured */}
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <svg
                className="w-8 h-8 mr-3 text-green-600 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span className="text-lg text-gray-500">
                Loading featured properties...
              </span>
            </div>
          ) : featured.length === 0 ? (
            <p className="py-10 text-lg text-center text-gray-500">
              No featured properties at the moment.
            </p>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((p) => (
                <Link
                  key={p._id}
                  to={`/properties/${p._id}`}
                  className="block w-full overflow-hidden transition-all duration-300 transform bg-white border border-gray-100 shadow-md group rounded-2xl hover:shadow-xl hover:scale-[1.02]"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={
                        p.thumbnail ||
                        "https://placehold.co/800x500?text=No+Image"
                      }
                      alt={p.propertyName}
                      className="object-cover w-full h-56 transition-transform duration-300 ease-in-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute flex gap-2 top-4 left-4">
                      <span className="px-3 py-1 text-xs font-medium text-white bg-green-700 rounded-full">
                        Featured
                      </span>
                      {p.propertyType && (
                        <span className="px-3 py-1 text-xs font-medium capitalize bg-white/90 text-green-800 rounded-full">
                          {p.propertyType}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="mb-1 text-xl font-bold text-green-800">
                      {p.propertyName}
                    </h3>
                    <p className="mb-4 text-sm text-gray-500">
                      {p.city && p.province
                        ? `${p.city}, ${p.province}`
                        : p.city || p.province || "Location not specified"}
                    </p>
                    <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
                      <div>
                        <div className="text-sm text-gray-500">Starting at</div>
                        <div className="text-lg font-bold text-green-700">
                          {p.minPrice != null ? formatPHP(p.minPrice) : "—"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Units</div>
                        <div className="text-lg font-bold text-gray-800">
                          {p.availableUnits ?? 0}
                        </div>
                      </div>
                    </div>
                    <span className="inline-block w-full px-5 py-2 text-sm font-medium text-center text-white transition-all duration-300 bg-green-600 rounded-lg shadow-sm hover:bg-green-700 hover:shadow-md">
                      View Details
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3️⃣ Why Choose Us Section */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="w-full max-w-screen-xl px-4 mx-auto sm:px-6 lg:px-8">
          <h2 className="mb-4 text-3xl font-bold text-center text-green-800 md:text-4xl">
            Why Choose Us
          </h2>
          <p className="mb-12 text-lg text-center text-gray-500">
            Your trusted partner in real estate.
          </p>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-8 h-8 text-green-700"
                  >
                    {" "}
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>{" "}
                    <path d="m9 12 2 2 4-4"></path>{" "}
                  </svg>
                ),
                title: "Quality Listings",
                desc: "Handpicked properties with detailed specs, media, and pricing.",
              },
              {
                icon: (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-8 h-8 text-green-700"
                  >
                    {" "}
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>{" "}
                    <path d="M15 10H9"></path> <path d="M15 6H9"></path>{" "}
                    <path d="M11 14H9"></path>{" "}
                  </svg>
                ),
                title: "Inquiry Management",
                desc: "We respond fast and keep you updated on viewings.",
              },
              {
                icon: (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-8 h-8 text-green-700"
                  >
                    {" "}
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>{" "}
                    <path d="M14 2v6h6"></path>{" "}
                    <path d="M10 16s.5-1 2-1 2 1 2 1"></path>{" "}
                    <path d="M12 16v-1"></path>{" "}
                    <circle cx="12" cy="12" r="3"></circle>{" "}
                  </svg>
                ),
                title: "Sales Transparency",
                desc: "Clear sale records and analytics for decision making.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="p-8 text-center transition-all duration-300 transform bg-white shadow-md rounded-2xl hover:shadow-xl hover:-translate-y-1"
              >
                <div className="flex items-center justify-center w-20 h-20 mx-auto mb-5 bg-green-100 rounded-full">
                  {item.icon}
                </div>
                <h3 className="mb-3 text-xl font-semibold text-green-800">
                  {item.title}
                </h3>
                <p className="text-base leading-relaxed text-gray-600">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
