import { useEffect, useState, useMemo } from "react"; // 1. Import useMemo
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
  const [rawList, setRawList] = useState([]); // Renamed from 'list' to avoid confusion
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
    setRawList(r.data || []); // Set the raw list of units
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

  useEffect(() => {
    fetchProvinces();
    load();
  }, []);

  useEffect(() => {
    fetchCities(filters.province);
    setFilters((s) => ({ ...s, city: "" }));
  }, [filters.province]);

  // 2. Group the raw list of units using useMemo
  const groupedList = useMemo(() => {
    if (!rawList || rawList.length === 0) return [];

    const groups = rawList.reduce((acc, unit) => {
      const { propertyInfo, specifications, price } = unit;
      if (!propertyInfo) return acc; // Skip units without property info (shouldn't happen)

      const {
        bedrooms = 0,
        bathrooms = 0,
        floorArea = 0,
        lotArea = 0,
      } = specifications || {};

      // Create a unique key combining property ID and unit specs
      const groupKey = `${
        propertyInfo._id
      }-beds-${bedrooms}-baths-${bathrooms}-sqm-${floorArea || lotArea}`;

      if (!acc[groupKey]) {
        // First time seeing this combination, create a group
        acc[groupKey] = {
          groupKey,
          propertyInfo, // Store the whole propertyInfo object
          specifications, // Store the common specs
          count: 0,
          minPrice: price,
          representativeUnit: unit, // Store one unit for potential image fallback
        };
      }

      // Update group count and find minimum price
      acc[groupKey].count += 1;
      if (price < acc[groupKey].minPrice) {
        acc[groupKey].minPrice = price;
      }

      return acc;
    }, {});

    // Convert the groups object back into an array
    return Object.values(groups);
  }, [rawList]); // Recalculate only when the raw list changes

  return (
    <div className="py-8 container-page">
      <h1 className="text-xl font-semibold">PROPERTY LISTINGS</h1>

      <div className="grid md:grid-cols-[280px_1fr] gap-6 mt-4">
        {/* Filters */}
        <div className="p-4 space-y-3 card">
          {/* ... (Filter inputs remain exactly the same) ... */}
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
        </div>

        {/* Listings */}
        <div>
          <div className="mb-3 text-sm text-neutral-600">
            {/* 3. Update count text */}
            Showing {groupedList.length} listing groups
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {/* 4. Map over groupedList and render PropertyGroupCard */}
            {groupedList.map((group) => (
              <PropertyGroupCard key={group.groupKey} group={group} />
            ))}
            {groupedList.length === 0 && (
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

// 5. NEW component to render a grouped property card
function PropertyGroupCard({ group }) {
  const { propertyInfo, specifications, count, minPrice, representativeUnit } =
    group;
  const {
    bedrooms = 0,
    bathrooms = 0,
    floorArea = 0,
    lotArea = 0,
  } = specifications || {};

  // Create a title describing the unit type
  let unitTypeTitle = "Unit";
  if (bedrooms > 0) {
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
          // Use property thumbnail as primary image for the group card
          propertyInfo.thumbnail ||
          representativeUnit.photos?.[0] || // Fallback to a unit photo
          "https://via.placeholder.com/640x360?text=Property"
        }
        className="object-cover w-full h-40"
        alt={propertyInfo.propertyName}
      />
      <div className="p-4 space-y-1">
        <div className="flex items-start justify-between gap-2">
          {/* Show Property Name */}
          <div className="font-medium">{propertyInfo.propertyName}</div>
          {/* Show available count */}
          <span className="badge badge-green">{count} Available</span>
        </div>

        {/* Show Unit Type */}
        <div className="text-sm font-semibold text-brand-primary">
          {unitTypeTitle}
        </div>

        {/* Show Location */}
        <div className="text-sm text-neutral-600">
          {propertyInfo.city
            ? `${propertyInfo.city}, ${propertyInfo.province}`
            : ""}
        </div>

        {/* Show Starting Price */}
        <div className="font-semibold text-brand-primary">
          Starting from: ₱ {Number(minPrice || 0).toLocaleString()}
        </div>

        <div className="pt-2">
          {/* Link to the Property Detail Page */}
          <Link
            to={`/properties/${propertyInfo._id}`}
            className="btn btn-outline"
          >
            See More
          </Link>
        </div>
      </div>
    </div>
  );
}
