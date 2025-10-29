import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { PropertiesAPI } from "../../api/properties";
import { UnitsAPI } from "../../api/units";

export default function Properties() {
  const [filters, setFilters] = useState({
    search: "",
    province: "",
    city: "",
    minPrice: "",
    maxPrice: "",
    propertyType: "",
    bedrooms: "",
    bathrooms: "",
  });
  const [rawList, setRawList] = useState([]);
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

  async function load() {
    const r = await UnitsAPI.list({ ...filters, status: "available" });
    setRawList(r.data || []);
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
    setFilters({
      search: "",
      province: "",
      city: "",
      minPrice: "",
      maxPrice: "",
      propertyType: "",
      bedrooms: "",
      bathrooms: "",
    });
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

          <div className="grid grid-cols-2 gap-2">
            <select
              className="input"
              value={filters.bedrooms}
              onChange={(e) =>
                setFilters((s) => ({ ...s, bedrooms: e.target.value }))
              }
            >
              <option value="">Bedrooms (All)</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} Bedroom{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>

            <select
              className="input"
              value={filters.bathrooms}
              onChange={(e) =>
                setFilters((s) => ({ ...s, bathrooms: e.target.value }))
              }
            >
              <option value="">Bathrooms (All)</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} Bathroom{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>

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

          <div className="grid grid-cols-2 gap-2">
            <input
              className="input"
              placeholder="Min Price"
              type="number"
              value={filters.minPrice}
              onChange={(e) =>
                setFilters((s) => ({ ...s, minPrice: e.target.value }))
              }
            />
            <input
              className="input"
              placeholder="Max Price"
              type="number"
              value={filters.maxPrice}
              onChange={(e) =>
                setFilters((s) => ({ ...s, maxPrice: e.target.value }))
              }
            />
          </div>

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
            Showing {rawList.length} units
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {rawList.map((unit) => (
              <UnitCard key={unit._id} unit={unit} />
            ))}
            {rawList.length === 0 && (
              <p className="text-neutral-600 md:col-span-3">
                No units found matching your criteria.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// MODIFIED: UnitCard component
function UnitCard({ unit }) {
  const { propertyInfo, specifications, price, photos, unitNumber } = unit;

  if (!propertyInfo) {
    return null;
  }

  const {
    bedrooms = 0,
    bathrooms = 0,
    floorArea = 0,
    lotArea = 0,
  } = specifications || {};

  let unitTypeTitle = "Unit";
  if (unitNumber) {
    unitTypeTitle = `Unit ${unitNumber}`;
  } else if (bedrooms > 0) {
    unitTypeTitle = `${bedrooms} BR ${
      bathrooms > 0 ? `/ ${bathrooms} Bath` : ""
    }`;
  } else if (floorArea > 0) {
    unitTypeTitle = `${floorArea} sqm Unit`;
  } else if (lotArea > 0) {
    unitTypeTitle = `${lotArea} sqm Lot`;
  }

  return (
    <div className="overflow-hidden card">
      <img
        src={
          photos?.[0] || // <-- Use unit photo
          "https://via.placeholder.com/640x360?text=No+Unit+Photo" // <-- Fallback to placeholder
        }
        className="object-cover w-full h-40"
        alt={unitTypeTitle} // <-- Use unit title for alt text
      />
      <div className="p-4 space-y-1">
        {/* H1: Unit Title */}
        <div className="font-medium">{unitTypeTitle}</div>

        {/* H2: Property Parent */}
        <div className="text-sm font-semibold text-brand-primary">
          {propertyInfo.propertyName}
        </div>

        {/* Location (related to property) */}
        <div className="text-sm text-neutral-600">
          {propertyInfo.city
            ? `${propertyInfo.city}, ${propertyInfo.province}`
            : ""}
        </div>

        {/* Price */}
        <div className="font-semibold text-brand-primary">
          ₱ {Number(price || 0).toLocaleString()}
        </div>

        {/* Link */}
        <div className="pt-2">
          <Link to={`/unit/${unit._id}`} className="btn btn-outline">
            See More Details
          </Link>
        </div>
      </div>
    </div>
  );
}
