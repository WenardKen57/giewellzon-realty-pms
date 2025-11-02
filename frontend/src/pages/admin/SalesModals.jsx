import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { SalesAPI } from "../../api/sales";
import { PropertiesAPI } from "../../api/properties";
import { Save, X } from "lucide-react"; // Import icons

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

// --- NEW: Helper component for form fields with errors ---
function FormField({ label, children, error }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-600">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export function SaleFormModal({ open, onClose, editing }) {
  const [properties, setProperties] = useState([]);
  const [units, setUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [loading, setLoading] = useState(false);
  
  // --- NEW: State for validation errors and confirm modal ---
  const [errors, setErrors] = useState({});
  const [isUpdateConfirmOpen, setIsUpdateConfirmOpen] = useState(false);

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
      setLoadingUnits(true);
      PropertiesAPI.listUnits(propertyId)
        .then((r) => {
          const unitList = Array.isArray(r) ? r : r?.data || [];
          const selectableUnits = editing
            ? unitList
            : unitList.filter((u) => u.status === "available");

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
  }, [form.propertyId, open, editing]);

  // Populate form
  useEffect(() => {
    if (open) {
      setErrors({}); // Clear errors when modal opens
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
          commissionRate: editing.commissionRate ?? "",
          notes: editing.notes || "",
          source: editing.source || "",
        });
      } else {
        setForm(BLANK_FORM);
      }
    }
  }, [editing, open]);

  if (!open) return null;

  // --- NEW: Validation function ---
  function validate() {
    const newErrors = {};
    if (!form.propertyId) {
      newErrors.propertyId = "Please select a property.";
    }
    if (!form.unitId) {
      newErrors.unitId = "Please select a unit.";
    }
    if (!form.buyerName.trim()) {
      newErrors.buyerName = "Buyer name is required.";
    }
    if (
      !form.salePrice ||
      isNaN(Number(form.salePrice)) ||
      Number(form.salePrice) <= 0
    ) {
      newErrors.salePrice = "Please enter a valid, positive sale price.";
    }
    if (!form.saleDate) {
      newErrors.saleDate = "Sale date is required.";
    }
    if (form.closingDate && form.saleDate && form.closingDate < form.saleDate) {
      newErrors.closingDate = "Closing date cannot be earlier than sale date.";
    }
    // Simple phone validation (optional)
    const phPattern = /^(09\d{9}|\+639\d{9})$/;
    if (form.buyerPhone && !phPattern.test(form.buyerPhone)) {
       newErrors.buyerPhone = "Invalid PH mobile (e.g., 09123456789).";
    }
    if (form.agentPhone && !phPattern.test(form.agentPhone)) {
       newErrors.agentPhone = "Invalid PH mobile (e.g., 09123456789).";
    }
    return newErrors;
  }

  // --- UPDATED: This is the form's submit handler ---
  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({}); // Clear old errors

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix the errors highlighted on the form.");
      return;
    }

    if (editing) {
      // If editing, open confirmation modal
      setIsUpdateConfirmOpen(true);
    } else {
      // If creating new, save immediately
      await handleConfirmSave();
    }
  }

  // --- NEW: This function contains the actual save logic ---
  async function handleConfirmSave() {
    setIsUpdateConfirmOpen(false); // Close modal
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
      };
      delete payload.propertyId;
  
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

  // Helper to get error class
  const errorClass = (field) => errors[field] ? "border-red-500 focus:ring-red-200" : "border-gray-200 focus:ring-emerald-200";

  return (
    <div className="fixed inset-0 z-50 grid p-4 overflow-y-auto bg-black/60 place-items-center">
      <form
        onSubmit={handleSubmit} // --- UPDATED ---
        className="w-full max-w-2xl p-6 my-8 space-y-6 bg-white rounded-xl shadow-2xl ring-1 ring-black/5"
        aria-modal="true"
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#10B981, #047857)" }}>
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {editing ? "Update Sale Details" : "Record New Sale"}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Fill required fields and save. You can close without saving.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="inline-flex items-center justify-center w-9 h-9 rounded-md text-gray-600 hover:bg-gray-100 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Property & Unit */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Property (Building) *" error={errors.propertyId}>
            <select
              id="propertyId"
              required
              className={`w-full rounded-md border px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 ${errorClass("propertyId")}`}
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
                  {p.propertyName} {p.city ? `— ${p.city}` : ""}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Unit *" error={errors.unitId}>
            <div className="relative">
              <select
                id="unitId"
                required
                className={`w-full rounded-md border px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 ${errorClass("unitId")}`}
                value={form.unitId}
                onChange={(e) =>
                  setForm((s) => ({ ...s, unitId: e.target.value }))
                }
                disabled={!form.propertyId || loadingUnits || !!editing}
              >
                <option value="">{loadingUnits ? "Loading units..." : "Select Unit"}</option>
                {units.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.unitNumber || `ID:${u._id.slice(-6)}`} — {formatCurrency(u.price)} ({u.status})
                    {editing && u._id === editing.unitId && " (Current)"}
                  </option>
                ))}
                {!loadingUnits && units.length === 0 && form.propertyId && (
                  <option value="" disabled>
                    {editing ? "Unit unavailable" : "No available units"}
                  </option>
                )}
              </select>
              {loadingUnits && (
                <div className="absolute inset-y-0 right-3 flex items-center">
                  <svg className="w-4 h-4 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="opacity-75" />
                  </svg>
                </div>
              )}
            </div>
          </FormField>
        </section>

        {/* Buyer Information */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Buyer Name *" error={errors.buyerName}>
            <input
              className={`w-full rounded-md border px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 ${errorClass("buyerName")}`}
              value={form.buyerName}
              onChange={(e) => setForm((s) => ({ ...s, buyerName: e.target.value }))}
              required
            />
          </FormField>

          <FormField label="Buyer Email" error={errors.buyerEmail}>
            <input
              type="email"
              className={`w-full rounded-md border px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 ${errorClass("buyerEmail")}`}
              value={form.buyerEmail}
              onChange={(e) => setForm((s) => ({ ...s, buyerEmail: e.target.value }))}
            />
          </FormField>

          <FormField label="Buyer Phone" error={errors.buyerPhone}>
            <input
              className={`w-full rounded-md border px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 ${errorClass("buyerPhone")}`}
              value={form.buyerPhone}
              onChange={(e) => setForm((s) => ({ ...s, buyerPhone: e.target.value }))}
            />
          </FormField>
        </section>

        {/* Sale Details */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Sale Price *" error={errors.salePrice}>
            <input
              type="number"
              step="0.01"
              className={`w-full rounded-md border px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 ${errorClass("salePrice")}`}
              value={form.salePrice}
              onChange={(e) => setForm((s) => ({ ...s, salePrice: e.target.value }))}
              required
            />
          </FormField>

          <FormField label="Commission Rate (%)" error={errors.commissionRate}>
            <input
              type="number"
              step="0.01"
              className={`w-full rounded-md border px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 ${errorClass("commissionRate")}`}
              value={form.commissionRate}
              onChange={(e) => setForm((s) => ({ ...s, commissionRate: e.target.value }))}
            />
          </FormField>

          <FormField label="Sale Date *" error={errors.saleDate}>
            <input
              type="date"
              className={`w-full rounded-md border px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 ${errorClass("saleDate")}`}
              value={form.saleDate}
              onChange={(e) => setForm((s) => ({ ...s, saleDate: e.target.value }))}
              required
            />
          </FormField>

          <FormField label="Closing Date" error={errors.closingDate}>
            <input
              type="date"
              className={`w-full rounded-md border px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 ${errorClass("closingDate")}`}
              value={form.closingDate}
              onChange={(e) => setForm((s) => ({ ...s, closingDate: e.target.value }))}
            />
          </FormField>

          <FormField label="Status" error={errors.status}>
            <select
              className={`w-full rounded-md border px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 ${errorClass("status")}`}
              value={form.status}
              onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
            >
              <option value="pending">Pending</option>
              <option value="closed">Closed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </FormField>

          <FormField label="Financing Type" error={errors.financingType}>
            <select
              className={`w-full rounded-md border px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 ${errorClass("financingType")}`}
              value={form.financingType}
              onChange={(e) => setForm((s) => ({ ...s, financingType: e.target.value }))}
            >
              <option value="cash">Cash</option>
              <option value="pag_ibig">Pag-IBIG</option>
              <option value="in_house">In-house</option>
            </select>
          </FormField>

          <FormField label="Lead Source" error={errors.source}>
            <select
              className={`w-full rounded-md border px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 ${errorClass("source")}`}
              value={form.source}
              onChange={(e) => setForm((s) => ({ ...s, source: e.target.value }))}
            >
              <option value="">Optional</option>
              <option value="website">Website</option>
              <option value="referral">Referral</option>
              <option value="walk_in">Walk-in</option>
              <option value="advertisement">Advertisement</option>
            </select>
          </FormField>
        </section>

        {/* Agent Info */}
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Agent Name" error={errors.agentName}>
            <input
              className={`w-full rounded-md border px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 ${errorClass("agentName")}`}
              value={form.agentName}
              onChange={(e) => setForm((s) => ({ ...s, agentName: e.target.value }))}
            />
          </FormField>

          <FormField label="Agent Email" error={errors.agentEmail}>
            <input
              type="email"
              className={`w-full rounded-md border px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 ${errorClass("agentEmail")}`}
              value={form.agentEmail}
              onChange={(e) => setForm((s) => ({ ...s, agentEmail: e.target.value }))}
            />
          </FormField>

          <FormField label="Agent Phone" error={errors.agentPhone}>
            <input
              className={`w-full rounded-md border px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 ${errorClass("agentPhone")}`}
              value={form.agentPhone}
              onChange={(e) => setForm((s) => ({ ...s, agentPhone: e.target.value }))}
            />
          </FormField>
        </section>

        {/* Notes */}
        <FormField label="Notes" error={errors.notes}>
          <textarea
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 min-h-[80px]"
            rows="3"
            value={form.notes}
            onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
          />
        </FormField>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            className="px-3 py-2 rounded-md text-sm font-medium bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 transition disabled:opacity-60"
            onClick={() => onClose(false)}
            disabled={loading}
          >
            Close
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold shadow hover:opacity-95 disabled:opacity-60 transition"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
                </svg>
                Saving...
              </>
            ) : editing ? "Update Sale" : "Record Sale"}
          </button>
        </div>
      </form>

      {/* --- NEW: Add the confirmation modal call --- */}
      <ConfirmUpdateModal
        open={isUpdateConfirmOpen}
        onClose={() => setIsUpdateConfirmOpen(false)}
        onConfirm={handleConfirmSave}
        isLoading={loading}
      />
    </div>
  );
}

// --- SaleViewModal ---
export function SaleViewModal({ open, onClose, data }) {
  if (!open || !data) return null;
  return (
    <div className="fixed inset-0 z-50 grid p-4 overflow-y-auto bg-black/60 place-items-center">
      <div className="w-full max-w-xl p-6 my-8 space-y-4 bg-white rounded-xl shadow-2xl ring-1 ring-black/5">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">View Sale Details</h2>
            <p className="text-sm text-gray-500 mt-1">Read-only summary of the sale</p>
          </div>
          <button
            className="inline-flex items-center justify-center w-9 h-9 rounded-md text-gray-600 hover:bg-gray-100 transition"
            onClick={() => onClose(false)}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          <Read label="Property" value={data.propertyName} />
          <Read label="Unit" value={data.unitNumber || data.unitId?.unitNumber} />
          <Read label="Buyer Name" value={data.buyerName} />
          <Read label="Buyer Email" value={data.buyerEmail} />
          <Read label="Buyer Phone" value={data.buyerPhone} />
          <Read label="Sale Price" value={formatCurrency(data.salePrice)} />
          <Read label="Commission Rate" value={`${data.commissionRate ?? "N/A"}%`} />
          <Read label="Commission Amount" value={formatCurrency(data.commissionAmount)} />
          <Read label="Sale Date" value={formatDate(data.saleDate)} />
          <Read label="Closing Date" value={formatDate(data.closingDate)} />
          <Read label="Status" value={data.status} />
          <Read label="Financing Type" value={data.financingType} />
          <Read label="Agent Name" value={data.agentName} />
          <Read label="Agent Email" value={data.agentEmail} />
          <Read label="Agent Phone" value={data.agentPhone} />
          <Read label="Source" value={data.source} />
          <div className="sm:col-span-2">
            <Read label="Notes" value={data.notes} isTextArea={true} />
          </div>
        </div>

        <div className="pt-4 border-t">
          <button
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold shadow hover:opacity-95 transition"
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
function Read({ label, value, isTextArea = false }) {
  const displayValue = value || <span className="italic text-gray-400">N/A</span>;
  return (
    <div>
      <div className="text-xs font-semibold text-gray-500 uppercase">{label}</div>
      {isTextArea ? (
        <div className="mt-2 p-3 min-h-[80px] w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-md">
          {displayValue}
        </div>
      ) : (
        <div className="mt-2 p-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-md">
          {displayValue}
        </div>
      )}
    </div>
  );
}

// --- NEW: Custom Confirmation Modal Component for Updating ---
function ConfirmUpdateModal({ open, onClose, onConfirm, isLoading }) {
  if (!open) return null;

  return (
    // Use z-[60] to appear on top of the first modal (which is z-50)
    <div className="fixed inset-0 z-[60] grid p-4 overflow-y-auto bg-black/60 place-items-center">
      <div
        className="w-full max-w-md p-6 bg-white rounded-xl shadow-2xl ring-1 ring-black/5"
        aria-modal="true"
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600 shadow">
              <Save className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Confirm Update
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Are you sure?
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center w-9 h-9 rounded-md text-gray-600 hover:bg-gray-100 transition"
            aria-label="Close"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="mt-4 text-sm text-gray-700 space-y-3">
          <p>
            You are about to save changes to this sale record.
          </p>
          <p>Please confirm you want to apply these updates.</p>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t mt-6">
          <button
            type="button"
            className="px-3 py-2 rounded-md text-sm font-medium bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 transition"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-white font-semibold shadow-md transition"
            style={{ background: "linear-gradient(90deg,#10B981 0%,#047857 100%)" }} // Green button
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
                </svg>
                Saving...
              </>
            ) : (
              "Confirm Update"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}