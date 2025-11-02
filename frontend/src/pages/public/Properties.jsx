import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PropertiesAPI } from "../../api/properties";
// [EDIT] Import icons for the new UI
import { Search, MapPin, Building, ArrowRight, Filter, X } from "lucide-react";

// #region New Filter Components

// New component for an input with an icon
function FilterInput({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input {...props} className="input w-full pl-10" />
    </div>
  );
}

// New component for a select with an icon
function FilterSelect({ icon: Icon, value, onChange, disabled, children }) {
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <select
        className="input w-full pl-10"
        value={value}
        onChange={onChange}
        disabled={disabled}
      >
        {children}
      </select>
    </div>
  );
}

// #endregion

export default function Properties() {
  // --- STATE (Unchanged) ---
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
    "townhouse",
    "villa",
    "compound",
  ];

  // --- API FUNCTIONS (Unchanged) ---
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

  function clearFilters() {
    setFilters({ search: "", province: "", city: "", propertyType: "" });
    setCities([]);
    // Note: The 'load' function is triggered by the 'Apply' button,
    // so clearing filters just resets state. We'll add a 'load' call here
    // to make "Clear Filters" also re-fetch the unfiltered list.
    load();
  }

  useEffect(() => {
    fetchProvinces();
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchCities(filters.province);
    setFilters((s) => ({ ...s, city: "" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.province]);

  return (
    <div className="py-8 md:py-12 container-page">
      {/* [EDIT] Enhanced Page Header */}
      <h1 className="text-3xl font-bold text-gray-900">Property Listings</h1>
      <p className="mt-1 text-gray-600">
        Browse our collection of available properties.
      </p>

      <div className="grid md:grid-cols-[280px_1fr] gap-6 mt-6">
        {/* [EDIT] Enhanced Filters Panel */}
        <aside className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm h-fit space-y-4">
          <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
            <Filter className="w-5 h-5" />
            <span>Filter Properties</span>
          </div>

          <FilterInput
            icon={Search}
            placeholder="Search properties..."
            value={filters.search}
            onChange={(e) =>
              setFilters((s) => ({ ...s, search: e.target.value }))
            }
          />

          <FilterSelect
            icon={Building}
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
          </FilterSelect>

          <FilterSelect
            icon={MapPin}
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
          </FilterSelect>

          <FilterSelect
            icon={MapPin}
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
          </FilterSelect>

          {/* [EDIT] Updated Buttons */}
          <button
            className="w-full btn btn-primary"
            onClick={load}
          >
            Apply Filters
          </button>
          <button className="w-full btn btn-outline" onClick={clearFilters}>
            Clear Filters
          </button>
        </aside>

        {/* Listings */}
        <main>
          <div className="mb-3 text-sm text-neutral-600">
            Showing {properties.length} properties
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.length === 0 && (
              <div className="sm:col-span-2 lg:col-span-3 text-center text-gray-500 py-16">
                <Building className="w-12 h-12 mx-auto text-gray-400" />
                <h3 className="mt-2 text-lg font-semibold">No properties found</h3>
                <p className="mt-1 text-sm">
                  Try adjusting your filters or check back later.
                </p>
              </div>
            )}
            
            {properties.map((prop) => (
              <PropertyCard key={prop._id} property={prop} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

// Property card for public listing
function PropertyCard({ property }) {
  const cover =
    property.thumbnail ||
    property.photos?.[0] ||
    "https://placehold.co/600x400/e2e8f0/64748b?text=No+Photo";
    
  const location = [property.city, property.province]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col group">
      <div className="overflow-hidden">
        <img
          src={cover}
          className="object-cover w-full h-48 transition-transform duration-300 group-hover:scale-105"
          alt={property.propertyName}
        />
      </div>
      <div className="flex flex-col flex-1 p-4">
        <div className="space-y-2 flex-1">
          {property.propertyType && (
            <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
              {property.propertyType}
            </span>
          )}
          <h3 className="font-semibold text-lg text-gray-900">{property.propertyName}</h3>
          <div className="flex items-center gap-1.5 text-sm text-neutral-600">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span>{location}</span>
          </div>
        </div>
        <div className="pt-4 mt-4 border-t">
          <Link to={`/properties/${property._id}`} className="btn btn-outline w-full">
            View Property
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>
    </div>
  );
}
