import React, { useEffect, useState, useMemo } from "react";
import {
  Modal as RNModal, // Use RNModal to avoid conflict if needed, or remove if not using Modal component directly
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../theme/colors";
import { listProperties, listUnitsForProperty } from "../../api/properties";
import { createSale } from "../../api/sales";
import PickerModal from "../../components/PickerModal";
import { notifyError, notifySuccess } from "../../utils/notify";

const FINANCING_TYPES = ["cash", "pag_ibig", "in_house", "others"];

// Accept 'navigation' prop instead of 'open' and 'onClose'
export default function AddSaleModal({ navigation }) {
  const [saving, setSaving] = useState(false);
  const [propsList, setPropsList] = useState([]);
  const [unitsList, setUnitsList] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(false);

  const [propPickerOpen, setPropPickerOpen] = useState(false);
  const [unitPickerOpen, setUnitPickerOpen] = useState(false);
  const [financePickerOpen, setFinancePickerOpen] = useState(false);

  // Initial form state (remains the same)
  const initialFormState = {
    propertyId: "",
    unitId: "",
    buyerName: "",
    buyerEmail: "",
    buyerPhone: "",
    salePrice: "",
    saleDate: "",
    financingType: "cash",
    agentName: "",
    agentEmail: "",
    agentPhone: "",
    notes: "",
    source: "",
  };
  const [form, setForm] = useState(initialFormState);

  // Fetch properties on mount
  useEffect(() => {
    listProperties({ limit: 500 })
      .then((response) => setPropsList(response.data || []))
      .catch(() => notifyError("Failed to load properties"));
    // Cleanup function to reset form if needed when screen unmounts
    return () => {
      setForm(initialFormState);
      setUnitsList([]);
      setPropsList([]);
    };
  }, []); // Run only on mount

  // Fetch units when propertyId changes (remains the same)
  useEffect(() => {
    const fetchUnits = async () => {
      if (form.propertyId) {
        setLoadingUnits(true);
        setUnitsList([]);
        try {
          const unitsData = await listUnitsForProperty(form.propertyId);
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
        setUnitsList([]);
      }
    };
    fetchUnits();
    setForm((s) => ({ ...s, unitId: "" }));
  }, [form.propertyId]);

  async function save() {
    // Validation remains the same
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
      // Payload creation remains the same
      const payload = {
        ...form,
        salePrice: Number(form.salePrice || 0),
      };
      if (!payload.buyerEmail) delete payload.buyerEmail;
      if (!payload.buyerPhone) delete payload.buyerPhone;
      if (!payload.agentName) delete payload.agentName;
      if (!payload.agentEmail) delete payload.agentEmail;
      if (!payload.agentPhone) delete payload.agentPhone;
      if (!payload.notes) delete payload.notes;
      if (!payload.source) delete payload.source;
      if (!payload.saleDate)
        payload.saleDate = new Date().toISOString().split("T")[0];

      await createSale(payload);
      notifySuccess("Sale recorded successfully!");
      // --- Use navigation.goBack() ---
      navigation.goBack();
      // SalesScreen's useFocusEffect will handle reload
    } catch (e) {
      notifyError(e?.response?.data?.message || "Failed to record sale");
    } finally {
      setSaving(false);
    }
  }

  // Options for pickers (remains the same)
  const propertyOptions = propsList.map((p) => ({
    label: p.propertyName,
    value: p._id,
  }));
  const unitOptions = unitsList.map((u) => ({
    label: `Unit ${u.unitNumber} - ₱${Number(u.price).toLocaleString()}`,
    value: u._id,
  }));
  const selectedPropertyLabel =
    propertyOptions.find((o) => o.value === form.propertyId)?.label ||
    "Select building/property*";
  const selectedUnitLabel =
    unitOptions.find((o) => o.value === form.unitId)?.label ||
    "Select available unit*";

  // --- Render as a View, not a Modal component ---
  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Record New Sale</Text>
          {/* --- Use navigation.goBack() for close button --- */}
          <Pressable
            onPress={() => navigation.goBack()}
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
                style={{ color: form.propertyId ? colors.text : colors.muted }}
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

          {/* Other */}
          <L label="Notes">
            <T
              value={form.notes}
              onChangeText={(v) => setForm((s) => ({ ...s, notes: v }))}
              placeholder="Optional notes about the sale"
              multiline
            />
          </L>
        </ScrollView>

        <View style={styles.navigation}>
          {/* --- Use navigation.goBack() for cancel button --- */}
          <Pressable
            onPress={() => navigation.goBack()}
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

        {/* --- Picker Modals remain inside --- */}
        <PickerModal
          visible={propPickerOpen}
          onClose={() => setPropPickerOpen(false)}
          title="Select Property Building"
          options={propertyOptions}
          value={form.propertyId}
          onSelect={(v) => {
            setForm((s) => ({ ...s, propertyId: v, unitId: "" }));
            setPropPickerOpen(false);
          }}
        />
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
          emptyMessage={
            unitsList.length === 0 && form.propertyId
              ? "No available units found for this property."
              : "Please select a property first."
          }
        />
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
      </View>
    </View>
  );
}

// --- L & T Components ---
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
      placeholderTextColor={colors.muted}
      underlineColorAndroid="transparent"
      style={[baseStyle, props.style]}
    />
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingTop: 40, // Adjust as needed for status bar/notch
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  modalContent: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
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
  formContainer: {
    flex: 1, // Make ScrollView take available space
    paddingBottom: 10, // Add padding at bottom if needed
    paddingTop: 10,
  },
  navigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
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
  buttonDisabled: { backgroundColor: colors.muted, opacity: 0.7 },
  labelContainer: { marginBottom: 12 },
  labelText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 4,
    fontWeight: "500",
  },
  textInputBase: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
    height: 44,
    color: colors.text,
    fontSize: 14,
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
    paddingVertical: 10,
    height: 44,
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  pickerButtonDisabled: {
    backgroundColor: colors.light,
    borderColor: colors.border,
    opacity: 0.7,
  },
});
