import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PropertiesAPI } from "../../api/properties";

export default function Properties() {
  // Filters at the PROPERTY level (match mobile app)
  const [filters, setFilters] = useState({
    search: "",
    province: "",
    city: "",
    propertyType: "",
  });
  const [properties, setProperties] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const propertyTypes = [
    "house",
    "condo",
    "apartment",
    "lot",
    "townhouse",
    "villa",
    "compound",
  ];

  // Load PROPERTIES (not units)
  async function load() {
    const active = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => Boolean(v))
    );
    const r = await PropertiesAPI.list(active);
    setProperties(r.data || r || []);
  }

  async function fetchProvinces() {
    try {
      const r = await PropertiesAPI.getProvinces();
      setProvinces(r.data || r || []);
    } catch (err) {
      console.error("Failed to load provinces:", err);
    }
  }

  async function fetchCities(province) {
    if (!province) return setCities([]);
    try {
      const r = await PropertiesAPI.getCities(province);
      setCities(r.data || r || []);
    } catch (err) {
      console.error("Failed to load cities:", err);
    }
  }

  // 🧹 Clear filters helper
  function clearFilters() {
    setFilters({ search: "", province: "", city: "", propertyType: "" });
    setCities([]);
    load(); // reload unfiltered list
  }

  useEffect(() => {
    fetchProvinces();
    load();
  }, []);

  useEffect(() => {
    fetchCities(filters.province);
    setFilters((s) => ({ ...s, city: "" }));
  }, [filters.province]);

  return (
    <div className="py-8 container-page">
      <h1 className="text-xl font-semibold">PROPERTY LISTINGS</h1>

      <div className="grid md:grid-cols-[280px_1fr] gap-6 mt-4">
        {/* Filters */}
        <div className="p-4 space-y-3 card">
          <div className="font-medium">Filter Properties</div>

          <input
            className="input"
            placeholder="Search properties..."
            value={filters.search}
            onChange={(e) =>
              setFilters((s) => ({ ...s, search: e.target.value }))
            }
          />

          <select
            className="input"
            value={filters.propertyType}
            onChange={(e) =>
              setFilters((s) => ({ ...s, propertyType: e.target.value }))
            }
          >
            <option value="">All Property Types</option>
            {propertyTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>

          <select
            className="input"
            value={filters.province}
            onChange={(e) =>
              setFilters((s) => ({ ...s, province: e.target.value }))
            }
          >
            <option value="">Select Province</option>
            {provinces.map((prov) => (
              <option key={prov._id || prov} value={prov.name || prov}>
                {prov.name || prov}
              </option>
            ))}
          </select>

          <select
            className="input"
            value={filters.city}
            onChange={(e) =>
              setFilters((s) => ({ ...s, city: e.target.value }))
            }
            disabled={!filters.province}
          >
            <option value="">
              {filters.province ? "Select City" : "Select Province first"}
            </option>
            {cities.map((city) => (
              <option key={city._id || city} value={city.name || city}>
                {city.name || city}
              </option>
            ))}
          </select>

          <button className="w-full btn btn-primary" onClick={load}>
            Apply
          </button>
          <button className="w-full btn btn-neutral" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>

        {/* Listings */}
        <div>
          <div className="mb-3 text-sm text-neutral-600">
            Showing {properties.length} properties
          </div>

          <div className="grid items-stretch gap-4 md:grid-cols-3">
            {properties.map((prop) => (
              <PropertyCard key={prop._id} property={prop} />
            ))}
            {properties.length === 0 && (
              <p className="text-neutral-600 md:col-span-3">
                No properties found matching your criteria.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Property card for public listing
function PropertyCard({ property }) {
  const cover =
    property.thumbnail || property.photos?.[0] ||
    "https://via.placeholder.com/640x360?text=No+Image";
  const location = [property.city, property.province]
    .filter(Boolean)
    .join(", ");
  return (
    <div className="overflow-hidden card h-full flex flex-col min-h-[420px]">
      <img
        src={cover}
        className="object-cover w-full h-40"
        alt={property.propertyName}
      />
      <div className="flex flex-col flex-1 p-4">
        <div className="space-y-1">
          <div className="font-semibold">{property.propertyName}</div>
          <div className="text-sm text-neutral-600">{location}</div>
          {property.propertyType && (
            <div className="text-xs tracking-wide uppercase text-brand-primary">
              {property.propertyType}
            </div>
          )}
        </div>
        <div className="pt-2 mt-auto">
          <Link to={`/properties/${property._id}`} className="btn btn-outline">
            View Property
          </Link>
        </div>
      </div>
    </div>
  );
}
