import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PropertiesAPI } from "../../api/properties";

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await PropertiesAPI.getFeaturedProperties();
        setFeatured(res.data || res);
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
        className="relative text-white bg-cover bg-center bg-no-repeat min-h-screen flex items-center"
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
            <p className="mb-6 text-brand-light/90 text-lg">
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
          <div className="grid gap-6 md:grid-cols-3">
            {featured.map((property) => (
              <Link
                key={property._id}
                to={`/properties/${property._id}`}
                className="block rounded-lg overflow-hidden border hover:shadow-lg transition-shadow duration-300"
              >
                <img
                  src={
                    property.thumbnail ||
                    "https://placehold.co/600x400?text=No+Image"
                  }
                  alt={property.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-brand-primary">
                    {property.title}
                  </h3>
                  <p className="text-neutral-600 text-sm">
                    {property.location?.city}, {property.location?.province}
                  </p>
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
              className="p-6 card shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <div className="mb-2 font-medium text-brand-primary text-lg">
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
