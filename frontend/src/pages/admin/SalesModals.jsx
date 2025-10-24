import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { SalesAPI } from "../../api/sales";
import { PropertiesAPI } from "../../api/properties";
// UnitsAPI might not be needed here anymore if PropertiesAPI.listUnits is used

// --- Helper: Format date for input type="date" ---
function formatDateForInput(dateStr) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}
// Helper to format currency
const formatCurrency = (value) =>
  `₱ ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
// Helper to format dates nicely
const formatDate = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "N/A";

// --- Initial Form State ---
const BLANK_FORM = {
  propertyId: "",
  unitId: "",
  buyerName: "",
  buyerEmail: "",
  buyerPhone: "",
  salePrice: "",
  saleDate: new Date().toISOString().slice(0, 10),
  closingDate: "",
  status: "pending",
  financingType: "cash",
  agentName: "",
  agentEmail: "",
  agentPhone: "",
  commissionRate: "",
  notes: "",
  source: "",
};

export function SaleFormModal({ open, onClose, editing }) {
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [loading, setLoading] = useState(false);

  // Fetch properties
  useEffect(() => {
    if (open) {
      PropertiesAPI.list({})
        .then((r) => setProperties(r.data || []))
        .catch(() => toast.error("Failed to load properties list."));
    }
  }, [open]);

  // Fetch units
  useEffect(() => {
    const propertyId = form.propertyId;
    if (propertyId && open) {
      // Fetch only if modal is open and propertyId is set
      setLoadingUnits(true);
      PropertiesAPI.listUnits(propertyId)
        .then((r) => {
          const unitList = r.data || [];
          // Filter units for the dropdown
          const selectableUnits = editing
            ? unitList // Show all when editing (including the current one)
            : unitList.filter((u) => u.status === "available"); // Show only available when adding

          // Ensure the currently edited unit is in the list if editing
          if (
            editing &&
            !selectableUnits.some((u) => u._id === editing.unitId)
          ) {
            const currentUnit = unitList.find((u) => u._id === editing.unitId);
            if (currentUnit) selectableUnits.push(currentUnit);
          }

          setUnits(selectableUnits);
        })
        .catch(() => toast.error("Failed to load units for selected property."))
        .finally(() => setLoadingUnits(false));
    } else {
      setUnits([]);
    }
  }, [form.propertyId, open, editing]); // Rerun when propertyId, open state, or editing data changes

  // Populate form
  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          propertyId: editing.propertyId || "",
          unitId: editing.unitId || "",
          buyerName: editing.buyerName || "",
          buyerEmail: editing.buyerEmail || "",
          buyerPhone: editing.buyerPhone || "",
          salePrice: editing.salePrice || "",
          saleDate: formatDateForInput(editing.saleDate),
          closingDate: formatDateForInput(editing.closingDate),
          status: editing.status || "pending",
          financingType: editing.financingType || "cash",
          agentName: editing.agentName || "",
          agentEmail: editing.agentEmail || "",
          agentPhone: editing.agentPhone || "",
          commissionRate: editing.commissionRate ?? "", // Use ?? for null/undefined check
          notes: editing.notes || "",
          source: editing.source || "",
        });
      } else {
        setForm(BLANK_FORM);
      }
    }
  }, [editing, open]);

  if (!open) return null;

  async function submit(e) {
    e.preventDefault();
    if (!form.unitId) {
      toast.error("Please select a Unit.");
      return;
    }
    if (!form.buyerName) {
      toast.error("Please enter Buyer Name.");
      return;
    }
    if (
      !form.salePrice ||
      isNaN(Number(form.salePrice)) ||
      Number(form.salePrice) <= 0
    ) {
      toast.error("Please enter a valid Sale Price.");
      return;
    }
    if (!form.saleDate) {
      toast.error("Please enter a Sale Date.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        salePrice: Number(form.salePrice),
        commissionRate:
          form.commissionRate !== "" && !isNaN(Number(form.commissionRate))
            ? Number(form.commissionRate)
            : undefined,
        closingDate: form.closingDate || undefined,
        // Remove propertyId from payload if backend doesn't need it (it's derived via unitId)
        // propertyId: undefined
      };
      delete payload.propertyId; // Remove propertyId as backend gets it via unitId

      if (editing) {
        await SalesAPI.update(editing._id, payload);
        toast.success("Sale updated successfully!");
      } else {
        await SalesAPI.create(payload);
        toast.success("Sale recorded successfully!");
      }
      onClose(true);
    } catch (err) {
      console.error("Save Sale Error:", err);
      toast.error(
        err?.response?.data?.message || "Failed to save sale record."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid p-4 bg-black/60 place-items-center overflow-y-auto">
      {" "}
      {/* Darker overlay */}
      <form
        onSubmit={submit}
        className="w-full max-w-2xl p-6 my-8 space-y-6 bg-white rounded-lg shadow-xl"
      >
        {" "}
        {/* Wider modal, more spacing */}
        <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2">
          {editing ? "Update Sale Details" : "Record New Sale"}
        </h2>
        {/* Property & Unit Selection */}
        <fieldset className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <legend className="text-lg font-medium text-gray-700 mb-2">
            Property & Unit
          </legend>
          <div>
            <label
              htmlFor="propertyId"
              className="block mb-1 text-sm font-medium text-gray-600"
            >
              Property (Building) *
            </label>
            <select
              id="propertyId"
              required
              className="input"
              value={form.propertyId}
              onChange={(e) =>
                setForm((s) => ({
                  ...s,
                  propertyId: e.target.value,
                  unitId: "",
                }))
              }
              disabled={!!editing}
            >
              <option value="">Select Property</option>
              {properties.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.propertyName} ({p.city})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="unitId"
              className="block mb-1 text-sm font-medium text-gray-600"
            >
              Unit *
            </label>
            <select
              id="unitId"
              required
              className="input"
              value={form.unitId}
              onChange={(e) =>
                setForm((s) => ({ ...s, unitId: e.target.value }))
              }
              disabled={!form.propertyId || loadingUnits || !!editing}
            >
              <option value="">
                {loadingUnits ? "Loading..." : "Select Unit"}
              </option>
              {units.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.unitNumber || `ID:...${u._id.slice(-6)}`}
                  {` - ${formatCurrency(u.price)} (${u.status})`}
                  {editing && u._id === editing.unitId && " (Current)"}
                </option>
              ))}
              {!loadingUnits && units.length === 0 && form.propertyId && (
                <option value="" disabled>
                  {editing ? "Unit unavailable" : "No available units"}
                </option>
              )}
            </select>
          </div>
        </fieldset>
        {/* Buyer Info */}
        <fieldset>
          <legend className="text-lg font-medium text-gray-700 mb-2">
            Buyer Information
          </legend>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Buyer Name *"
              value={form.buyerName}
              onChange={(v) => setForm((s) => ({ ...s, buyerName: v }))}
              required
            />
            <Input
              label="Buyer Email"
              type="email"
              value={form.buyerEmail}
              onChange={(v) => setForm((s) => ({ ...s, buyerEmail: v }))}
            />
            <Input
              label="Buyer Phone"
              value={form.buyerPhone}
              onChange={(v) => setForm((s) => ({ ...s, buyerPhone: v }))}
            />
          </div>
        </fieldset>
        {/* Sale Details */}
        <fieldset>
          <legend className="text-lg font-medium text-gray-700 mb-2">
            Sale Details
          </legend>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Sale Price *"
              type="number"
              step="0.01"
              value={form.salePrice}
              onChange={(v) => setForm((s) => ({ ...s, salePrice: v }))}
              required
            />
            <Input
              label="Commission Rate (%)"
              type="number"
              step="0.01"
              value={form.commissionRate}
              onChange={(v) => setForm((s) => ({ ...s, commissionRate: v }))}
            />
            <Input
              label="Sale Date *"
              type="date"
              value={form.saleDate}
              onChange={(v) => setForm((s) => ({ ...s, saleDate: v }))}
              required
            />
            <Input
              label="Closing Date"
              type="date"
              value={form.closingDate}
              onChange={(v) => setForm((s) => ({ ...s, closingDate: v }))}
            />
            <div>
              <label
                htmlFor="status"
                className="block mb-1 text-sm font-medium text-gray-600"
              >
                Status
              </label>
              <select
                id="status"
                className="input"
                value={form.status}
                onChange={(e) =>
                  setForm((s) => ({ ...s, status: e.target.value }))
                }
              >
                <option value="pending">Pending</option>
                <option value="closed">Closed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="financingType"
                className="block mb-1 text-sm font-medium text-gray-600"
              >
                Financing Type
              </label>
              <select
                id="financingType"
                className="input"
                value={form.financingType}
                onChange={(e) =>
                  setForm((s) => ({ ...s, financingType: e.target.value }))
                }
              >
                <option value="cash">Cash</option>
                <option value="pag_ibig">Pag-IBIG</option>
                <option value="in_house">In-house</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="source"
                className="block mb-1 text-sm font-medium text-gray-600"
              >
                Lead Source
              </label>
              <select
                id="source"
                className="input"
                value={form.source}
                onChange={(e) =>
                  setForm((s) => ({ ...s, source: e.target.value }))
                }
              >
                <option value="">Optional</option>
                <option value="website">Website</option>
                <option value="referral">Referral</option>
                <option value="walk_in">Walk-in</option>
                <option value="advertisement">Advertisement</option>
              </select>
            </div>
          </div>
        </fieldset>
        {/* Agent Info */}
        <fieldset>
          <legend className="text-lg font-medium text-gray-700 mb-2">
            Agent Information
          </legend>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Agent Name"
              value={form.agentName}
              onChange={(v) => setForm((s) => ({ ...s, agentName: v }))}
            />
            <Input
              label="Agent Email"
              type="email"
              value={form.agentEmail}
              onChange={(v) => setForm((s) => ({ ...s, agentEmail: v }))}
            />
            <Input
              label="Agent Phone"
              value={form.agentPhone}
              onChange={(v) => setForm((s) => ({ ...s, agentPhone: v }))}
            />
          </div>
        </fieldset>
        {/* Notes */}
        <div>
          <label
            htmlFor="notes"
            className="block mb-1 text-sm font-medium text-gray-600"
          >
            Notes
          </label>
          <textarea
            id="notes"
            className="input"
            rows="3"
            value={form.notes}
            onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
          />
        </div>
        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          {" "}
          {/* Use gap-3 */}
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => onClose(false)}
            disabled={loading}
          >
            Close
          </button>
          <button className="btn btn-primary" disabled={loading}>
            {loading ? "Saving..." : editing ? "Update Sale" : "Record Sale"}
          </button>
        </div>
      </form>
    </div>
  );
}

// --- SaleViewModal ---
export function SaleViewModal({ open, onClose, data }) {
  if (!open || !data) return null;
  return (
    <div className="fixed inset-0 z-50 grid p-4 bg-black/60 place-items-center overflow-y-auto">
      <div className="w-full max-w-xl p-6 my-8 space-y-4 bg-white rounded-lg shadow-xl">
        {" "}
        {/* Wider modal */}
        <h2 className="text-2xl font-semibold text-center text-gray-800 border-b pb-2">
          View Sale Details
        </h2>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          {" "}
          {/* Responsive grid */}
          <Read label="Property" value={data.propertyName} />
          <Read
            label="Unit"
            value={data.unitNumber || data.unitId?.unitNumber}
          />
          <Read label="Buyer Name" value={data.buyerName} />
          <Read label="Buyer Email" value={data.buyerEmail} />
          <Read label="Buyer Phone" value={data.buyerPhone} />
          <Read label="Sale Price" value={formatCurrency(data.salePrice)} />
          <Read
            label="Commission Rate"
            value={`${data.commissionRate ?? "N/A"}%`}
          />
          <Read
            label="Commission Amount"
            value={formatCurrency(data.commissionAmount)}
          />
          <Read label="Sale Date" value={formatDate(data.saleDate)} />
          <Read label="Closing Date" value={formatDate(data.closingDate)} />
          <Read label="Status" value={data.status} />
          <Read label="Financing Type" value={data.financingType} />
          <Read label="Agent Name" value={data.agentName} />
          <Read label="Agent Email" value={data.agentEmail} />
          <Read label="Agent Phone" value={data.agentPhone} />
          <Read label="Source" value={data.source} />
          <div className="sm:col-span-2">
            {" "}
            {/* Notes span full width */}
            <Read label="Notes" value={data.notes} isTextArea={true} />
          </div>
        </div>
        <div className="pt-4 border-t">
          <button
            className="w-full btn btn-primary"
            onClick={() => onClose(false)}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Helper Components ---
function Input({
  label,
  type = "text",
  value,
  onChange,
  required = false,
  ...props
}) {
  // Basic Input component - can be further styled
  return (
    <div>
      <label className="block mb-1 text-sm font-medium text-gray-600">
        {label}
      </label>
      <input
        className="input" // Ensure your global input styles are applied
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        {...props}
      />
    </div>
  );
}
// Updated Read component
function Read({ label, value, isTextArea = false }) {
  const displayValue = value || (
    <span className="text-gray-400 italic">N/A</span>
  );
  return (
    <div>
      <div className="text-xs font-medium text-gray-500 uppercase">{label}</div>
      {isTextArea ? (
        <div className="mt-1 p-2 min-h-[60px] w-full text-sm text-gray-700 bg-gray-100 border border-gray-200 rounded-md">
          {displayValue}
        </div>
      ) : (
        <div className="mt-1 p-2 w-full text-sm text-gray-700 bg-gray-100 border border-gray-200 rounded-md">
          {displayValue}
        </div>
      )}
    </div>
  );
}
