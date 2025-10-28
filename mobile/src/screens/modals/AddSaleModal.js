import React, { useEffect, useState, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView, // Added ScrollView
  StyleSheet, // Added StyleSheet
  ActivityIndicator, // Added ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; // Added Icons
import { colors } from "../../theme/colors";
import { listProperties, listUnitsForProperty } from "../../api/properties"; // Added listUnitsForProperty
import { createSale } from "../../api/sales";
import PickerModal from "../../components/PickerModal";
import { notifyError, notifySuccess } from "../../utils/notify"; // Added notifications

const FINANCING_TYPES = ["cash", "pag_ibig", "in_house", "others"]; // Corrected pagibig, removed bank_loan unless needed

export default function AddSaleModal({ open, onClose }) {
  const [saving, setSaving] = useState(false);
  const [propsList, setPropsList] = useState([]);
  const [unitsList, setUnitsList] = useState([]); // State for units
  const [loadingUnits, setLoadingUnits] = useState(false);

  const [propPickerOpen, setPropPickerOpen] = useState(false);
  const [unitPickerOpen, setUnitPickerOpen] = useState(false); // State for unit picker
  const [financePickerOpen, setFinancePickerOpen] = useState(false);

  // Initial form state
  const initialFormState = {
    propertyId: "",
    unitId: "", // Added unitId
    buyerName: "",
    buyerEmail: "",
    buyerPhone: "",
    salePrice: "",
    saleDate: "", // Consider adding closingDate if needed by backend
    financingType: "cash",
    agentName: "",
    agentEmail: "",
    agentPhone: "",
    // commissionRate: "", // Optional, if you calculate on frontend
    notes: "",
    source: "", // Optional source field
  };
  const [form, setForm] = useState(initialFormState);

  // Fetch properties when modal opens
  useEffect(() => {
    if (open) {
      listProperties({ limit: 500 }) // Fetch all properties? Or filter differently?
        .then((data) => setPropsList(data || [])) // Directly use data array
        .catch(() => notifyError("Failed to load properties"));
    } else {
      // Reset form when closing
      setForm(initialFormState);
      setUnitsList([]);
      setPropsList([]);
    }
  }, [open]);

  // Fetch units when propertyId changes
  useEffect(() => {
    const fetchUnits = async () => {
      if (form.propertyId) {
        setLoadingUnits(true);
        setUnitsList([]); // Clear previous units
        try {
          const unitsData = await listUnitsForProperty(form.propertyId);
          // Filter for available units only
          const availableUnits = unitsData.filter(
            (u) => u.status === "available"
          );
          setUnitsList(availableUnits);
        } catch (error) {
          notifyError("Failed to load units for selected property.");
          setUnitsList([]);
        } finally {
          setLoadingUnits(false);
        }
      } else {
        setUnitsList([]); // Clear if no property selected
      }
    };
    fetchUnits();
    // Reset unitId if property changes
    setForm((s) => ({ ...s, unitId: "" }));
  }, [form.propertyId]);

  async function save() {
    // Validation
    if (
      !form.propertyId ||
      !form.unitId ||
      !form.buyerName ||
      !form.salePrice
    ) {
      notifyError("Please fill in all required fields (*).");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        salePrice: Number(form.salePrice || 0),
        // Add closingDate if needed: closingDate: form.closingDate || undefined,
        // Add commissionRate if needed: commissionRate: Number(form.commissionRate || 0),
      };
      // Remove empty optional fields if backend expects them not present
      if (!payload.buyerEmail) delete payload.buyerEmail;
      if (!payload.buyerPhone) delete payload.buyerPhone;
      if (!payload.agentName) delete payload.agentName;
      if (!payload.agentEmail) delete payload.agentEmail;
      if (!payload.agentPhone) delete payload.agentPhone;
      if (!payload.notes) delete payload.notes;
      if (!payload.source) delete payload.source;
      if (!payload.saleDate)
        payload.saleDate = new Date().toISOString().split("T")[0]; // Default saleDate if empty

      await createSale(payload);
      notifySuccess("Sale recorded successfully!");
      onClose(true); // Signal to reload data on the previous screen
    } catch (e) {
      notifyError(e?.response?.data?.message || "Failed to record sale");
    } finally {
      setSaving(false);
    }
  }

  // Options for pickers
  const propertyOptions = propsList.map((p) => ({
    label: p.propertyName,
    value: p._id,
  }));
  const unitOptions = unitsList.map((u) => ({
    label: `Unit ${u.unitNumber} - ₱${Number(u.price).toLocaleString()}`, // Display unit number and price
    value: u._id,
  }));

  const selectedPropertyLabel =
    propertyOptions.find((o) => o.value === form.propertyId)?.label ||
    "Select building/property*";
  const selectedUnitLabel =
    unitOptions.find((o) => o.value === form.unitId)?.label ||
    "Select available unit*";

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => onClose(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Record New Sale</Text>
            <Pressable
              onPress={() => onClose(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close-circle" size={28} color={colors.muted} />
            </Pressable>
          </View>

          <ScrollView style={styles.formContainer}>
            {/* Property Selection */}
            <L label="Property Building*">
              <Pressable
                onPress={() => setPropPickerOpen(true)}
                style={styles.pickerButton}
              >
                <Text
                  style={{
                    color: form.propertyId ? colors.text : colors.muted,
                  }}
                  numberOfLines={1}
                >
                  {selectedPropertyLabel}
                </Text>
              </Pressable>
            </L>

            {/* Unit Selection (conditional) */}
            <L label="Unit*">
              <Pressable
                onPress={() => setUnitPickerOpen(true)}
                style={[
                  styles.pickerButton,
                  !form.propertyId && styles.pickerButtonDisabled,
                ]}
                disabled={!form.propertyId || loadingUnits}
              >
                <Text
                  style={{ color: form.unitId ? colors.text : colors.muted }}
                  numberOfLines={1}
                >
                  {loadingUnits
                    ? "Loading Units..."
                    : unitsList.length === 0 && form.propertyId
                    ? "No Available Units"
                    : selectedUnitLabel}
                </Text>
              </Pressable>
            </L>

            {/* Buyer Info */}
            <L label="Buyer Name*">
              <T
                value={form.buyerName}
                onChangeText={(v) => setForm((s) => ({ ...s, buyerName: v }))}
                placeholder="Enter buyer's full name"
              />
            </L>
            <L label="Buyer Email">
              <T
                value={form.buyerEmail}
                onChangeText={(v) => setForm((s) => ({ ...s, buyerEmail: v }))}
                placeholder="buyer@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </L>
            <L label="Buyer Phone">
              <T
                value={form.buyerPhone}
                onChangeText={(v) => setForm((s) => ({ ...s, buyerPhone: v }))}
                placeholder="e.g., +639..."
                keyboardType="phone-pad"
              />
            </L>

            {/* Sale Details */}
            <L label="Sale Price*">
              <T
                value={form.salePrice}
                onChangeText={(v) => setForm((s) => ({ ...s, salePrice: v }))}
                placeholder="Enter final sale price"
                keyboardType="numeric"
              />
            </L>
            <L label="Sale Date (YYYY-MM-DD)">
              <T
                value={form.saleDate}
                onChangeText={(v) => setForm((s) => ({ ...s, saleDate: v }))}
                placeholder={new Date().toISOString().split("T")[0]}
              />
            </L>
            {/* Optional: <L label="Closing Date (YYYY-MM-DD)"><T value={form.closingDate} onChangeText={(v) => setForm((s) => ({ ...s, closingDate: v }))} placeholder="Optional" /></L> */}

            <L label="Financing Type">
              <Pressable
                onPress={() => setFinancePickerOpen(true)}
                style={styles.pickerButton}
              >
                <Text style={{ color: colors.text }}>{form.financingType}</Text>
              </Pressable>
            </L>

            {/* Agent Info */}
            <L label="Agent Name">
              <T
                value={form.agentName}
                onChangeText={(v) => setForm((s) => ({ ...s, agentName: v }))}
                placeholder="Agent's full name"
              />
            </L>
            <L label="Agent Email">
              <T
                value={form.agentEmail}
                onChangeText={(v) => setForm((s) => ({ ...s, agentEmail: v }))}
                placeholder="agent@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </L>
            <L label="Agent Phone">
              <T
                value={form.agentPhone}
                onChangeText={(v) => setForm((s) => ({ ...s, agentPhone: v }))}
                placeholder="e.g., +639..."
                keyboardType="phone-pad"
              />
            </L>
            {/* Optional: <L label="Commission Rate (%)"><T value={form.commissionRate} onChangeText={(v) => setForm(s => ({...s, commissionRate: v}))} placeholder="e.g., 3" keyboardType="numeric"/></L> */}

            {/* Other */}
            <L label="Notes">
              <T
                value={form.notes}
                onChangeText={(v) => setForm((s) => ({ ...s, notes: v }))}
                placeholder="Optional notes about the sale"
                multiline
              />
            </L>
            {/* Optional: <L label="Source"><T value={form.source} onChangeText={(v) => setForm(s => ({...s, source: v}))} placeholder="e.g., website, referral"/></L> */}
          </ScrollView>

          <View style={styles.navigation}>
            <Pressable
              onPress={() => onClose(false)}
              style={[styles.button, styles.buttonOutline]}
            >
              <Text style={styles.buttonOutlineText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={save}
              disabled={
                saving ||
                !form.propertyId ||
                !form.unitId ||
                !form.buyerName ||
                !form.salePrice
              }
              style={[
                styles.button,
                (saving ||
                  !form.propertyId ||
                  !form.unitId ||
                  !form.buyerName ||
                  !form.salePrice) &&
                  styles.buttonDisabled,
              ]}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Record Sale</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>

      {/* Property Picker */}
      <PickerModal
        visible={propPickerOpen}
        onClose={() => setPropPickerOpen(false)}
        title="Select Property Building"
        options={propertyOptions}
        value={form.propertyId}
        onSelect={(v) => {
          setForm((s) => ({ ...s, propertyId: v, unitId: "" })); // Reset unitId when property changes
          setPropPickerOpen(false);
        }}
      />
      {/* Unit Picker */}
      <PickerModal
        visible={unitPickerOpen}
        onClose={() => setUnitPickerOpen(false)}
        title="Select Available Unit"
        options={unitOptions}
        value={form.unitId}
        onSelect={(v) => {
          setForm((s) => ({ ...s, unitId: v }));
          setUnitPickerOpen(false);
        }}
        // Add a message if no units are available
        emptyMessage={
          unitsList.length === 0 && form.propertyId
            ? "No available units found for this property."
            : "Please select a property first."
        }
      />
      {/* Financing Picker */}
      <PickerModal
        visible={financePickerOpen}
        onClose={() => setFinancePickerOpen(false)}
        title="Financing Type"
        options={FINANCING_TYPES.map((t) => ({
          label: t.replace("_", " ").toUpperCase(),
          value: t,
        }))}
        value={form.financingType}
        onSelect={(v) => {
          setForm((s) => ({ ...s, financingType: v }));
          setFinancePickerOpen(false);
        }}
      />
    </Modal>
  );
}

// --- COPY L & T and Styles from AddUnitModal here ---
function L({ label, children, style }) {
  return (
    <View style={[styles.labelContainer, style]}>
      <Text style={styles.labelText}>{label}</Text>
      {children}
    </View>
  );
}
function T(props) {
  const baseStyle = [
    styles.textInputBase,
    props.multiline && styles.textInputMultiline,
  ];
  return (
    <TextInput
      {...props}
      placeholderTextColor={colors.muted} // Use muted color for placeholder
      underlineColorAndroid="transparent"
      style={[baseStyle, props.style]}
    />
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)", // Darker overlay
    justifyContent: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    maxHeight: "90%", // Allow slightly more height
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    position: "relative",
  },
  modalTitle: {
    fontWeight: "700",
    fontSize: 18,
    textAlign: "center",
    color: colors.text,
  },
  closeButton: {
    position: "absolute",
    right: -5,
    top: -5,
    padding: 5,
  },
  formContainer: { maxHeight: "75%", paddingBottom: 10, paddingTop: 10 },
  navigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16, // Increased margin
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    minWidth: 100,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  buttonOutline: {
    borderWidth: 1,
    borderColor: colors.gray,
    backgroundColor: "transparent",
  },
  buttonOutlineText: { color: colors.text, fontWeight: "600" },
  buttonDisabled: { backgroundColor: colors.muted, opacity: 0.7 }, // Use muted color
  labelContainer: { marginBottom: 12 },
  labelText: {
    color: colors.textSecondary, // Use secondary text color
    fontSize: 13,
    marginBottom: 4,
    fontWeight: "500",
  },
  textInputBase: {
    borderWidth: 1,
    borderColor: colors.border, // Use border color
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.white, // Keep white or use light gray?
    height: 44,
    color: colors.text,
    fontSize: 14, // Slightly smaller font
  },
  textInputMultiline: {
    minHeight: 80,
    paddingVertical: 10,
    textAlignVertical: "top",
    height: "auto",
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10, // Consistent padding
    height: 44,
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  pickerButtonDisabled: {
    backgroundColor: colors.light, // Use light background for disabled
    borderColor: colors.border,
    opacity: 0.7,
  },
});
