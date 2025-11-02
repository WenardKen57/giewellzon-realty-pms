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
  // API returns { data: [...] }
  const list = res.data || res || [];

  // Fetch unit stats for each featured property (min price and available count)
  const enriched = await Promise.all(
    list.map(async (p) => {
      try {
        const units = await PropertiesAPI.listUnits(p._id);
        const available = (units || []).filter((u) => u.status === "available");
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
    <div>
      {/* Hero Section */}
      <section
        className="relative flex items-center min-h-screen text-white bg-center bg-no-repeat bg-cover"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80')",
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>

        <div className="relative grid items-center gap-8 container-page md:grid-cols-2">
          <div>
            <h1 className="mb-3 text-4xl font-bold md:text-5xl">
              Find Your Ideal Home
            </h1>
            <p className="mb-6 text-lg text-brand-light/90">
              Explore curated listings, schedule viewings, and connect with our
              team for financing options.
            </p>
            <div className="flex gap-3">
              <Link to="/properties" className="btn btn-secondary">
                Browse Properties
              </Link>
              <Link
                to="/contact"
                className="text-white border-white btn btn-outline bg-white/0 hover:bg-white hover:text-brand-primary"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-16 bg-white container-page">
        <h2 className="mb-6 text-2xl font-semibold text-brand-primary">
          Featured Properties
        </h2>

        {loading ? (
          <p className="text-neutral-600">Loading featured properties...</p>
        ) : featured.length === 0 ? (
          <p className="text-neutral-600">
            No featured properties at the moment.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-3 items-stretch">
            {featured.map((p) => (
              <Link
                key={p._id}
                to={`/properties/${p._id}`}
                className="flex h-full flex-col overflow-hidden transition-all duration-300 bg-white border group rounded-xl hover:shadow-xl"
              >
                <div className="relative">
                  <img
                    src={p.thumbnail || "https://placehold.co/800x500?text=No+Image"}
                    alt={p.propertyName}
                    className="object-cover w-full h-52"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute flex gap-2 top-3 left-3">
                    <span className="px-2 py-1 text-xs text-white rounded bg-brand-primary">
                      Featured
                    </span>
                    {p.propertyType && (
                      <span className="px-2 py-1 text-xs rounded bg-white/90 text-brand-primary">
                        {p.propertyType}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="mb-1 text-lg font-semibold text-brand-primary">
                    {p.propertyName}
                  </h3>
                  <p className="mb-3 text-sm text-neutral-600">
                    {p.city && p.province ? `${p.city}, ${p.province}` : p.city || p.province || ""}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-neutral-500">Starting at</div>
                      <div className="font-semibold">
                        {p.minPrice != null ? formatPHP(p.minPrice) : "—"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-neutral-500">Units Available</div>
                      <div className="font-semibold">{p.availableUnits ?? 0}</div>
                    </div>
                  </div>

                  <div className="mt-auto pt-4">
                    <span className="inline-block w-full text-center btn btn-secondary">
                      View details
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-gray-50 container-page">
        <h2 className="mb-6 text-2xl font-semibold text-brand-primary">
          Why Choose Us
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Quality Listings",
              desc: "Handpicked properties with detailed specs, media, and pricing.",
            },
            {
              title: "Inquiry Management",
              desc: "We respond fast and keep you updated on viewings.",
            },
            {
              title: "Sales Transparency",
              desc: "Clear sale records and analytics for decision making.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="p-6 transition-shadow duration-300 shadow-md card hover:shadow-lg"
            >
              <div className="mb-2 text-lg font-medium text-brand-primary">
                {item.title}
              </div>
              <p className="text-sm text-neutral-700">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
