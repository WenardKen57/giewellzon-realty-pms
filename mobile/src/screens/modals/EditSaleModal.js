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
// --- 1. Import useRoute and useNavigation ---
import { useRoute, useNavigation } from "@react-navigation/native";
import { updateSale } from "../../api/sales";
import PickerModal from "../../components/PickerModal";
import { notifyError, notifySuccess } from "../../utils/notify"; // Added notifications

const FINANCING_TYPES = ["cash", "pag_ibig", "in_house", "others"]; // Corrected
const SALE_STATUS_OPTIONS = ["pending", "closed", "cancelled"]; // Added status options

// --- 2. Change props to accept navigation/route (or none) ---
export default function EditSaleModal() {
  // --- 3. Get navigation, route, and sale object ---
  const navigation = useNavigation();
  const route = useRoute();
  const { sale } = route.params || {}; // Get sale from route.params

  // --- 4. The modal is now the screen, so it's always 'open' ---
  // const open = !!sale; // This is no longer needed

  const [saving, setSaving] = useState(false);
  const [financePickerOpen, setFinancePickerOpen] = useState(false);
  const [statusPickerOpen, setStatusPickerOpen] = useState(false); // State for status picker

  // Define initial state structure matching AddSaleModal
  const initialFormState = {
    // propertyId: "", // Not editable
    // unitId: "", // Not editable
    propertyName: "", // For display only
    unitNumber: "", // For display only
    buyerName: "",
    buyerEmail: "",
    buyerPhone: "",
    salePrice: "",
    saleDate: "",
    closingDate: "", // Added closing date
    status: "pending", // Added status
    financingType: "cash",
    agentName: "",
    agentEmail: "",
    agentPhone: "",
    commissionRate: "", // Added commission rate
    notes: "",
    source: "",
  };
  const [form, setForm] = useState(initialFormState);

  // Populate form when sale object is available (modal opens)
  useEffect(() => {
    if (sale) {
      setForm({
        // Keep propertyName and unitNumber from the sale object for display
        propertyName: sale.propertyName || "N/A",
        unitNumber: sale.unitId?.unitNumber || sale.unitNumber || "N/A", // Get from populated unit if available

        buyerName: sale.buyerName || "",
        buyerEmail: sale.buyerEmail || "",
        buyerPhone: sale.buyerPhone || "",
        salePrice: String(sale.salePrice || ""),
        saleDate: (sale.saleDate || "").slice(0, 10), // Format YYYY-MM-DD
        closingDate: (sale.closingDate || "").slice(0, 10), // Format YYYY-MM-DD
        status: sale.status || "pending",
        financingType: sale.financingType || "cash",
        agentName: sale.agentName || "",
        agentEmail: sale.agentEmail || "",
        agentPhone: sale.agentPhone || "",
        commissionRate: String(sale.commissionRate || ""), // Convert to string
        notes: sale.notes || "",
        source: sale.source || "",
      });
    } else {
      // If no sale object is found, go back
      notifyError("Sale data not found.");
      navigation.goBack();
    }
  }, [sale, navigation]); // Depend on the sale object and navigation

  async function save() {
    // Validation
    if (!form.buyerName || !form.salePrice) {
      notifyError("Buyer Name and Sale Price are required (*).");
      return;
    }
    setSaving(true);
    try {
      // Only include fields allowed by the backend updateSale controller
      const payload = {
        buyerName: form.buyerName,
        buyerEmail: form.buyerEmail || undefined, // Send undefined if empty
        buyerPhone: form.buyerPhone || undefined,
        salePrice: Number(form.salePrice || 0),
        saleDate: form.saleDate || undefined,
        closingDate: form.closingDate || undefined,
        status: form.status,
        financingType: form.financingType,
        agentName: form.agentName || undefined,
        agentEmail: form.agentEmail || undefined,
        agentPhone: form.agentPhone || undefined,
        commissionRate: form.commissionRate
          ? Number(form.commissionRate)
          : undefined, // Convert or send undefined
        notes: form.notes || undefined,
        source: form.source || undefined,
      };

      await updateSale(sale._id, payload);
      notifySuccess("Sale updated successfully!");

      // --- 5. Use navigation.goBack() instead of onClose ---
      navigation.goBack();
      // The SalesScreen useFocusEffect will handle reloading
    } catch (e) {
      notifyError(e?.response?.data?.message || "Failed to update sale");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      // --- 6. Set visible to true (navigation handles showing/hiding) ---
      visible={true}
      transparent
      animationType="fade"
      // --- 7. Use navigation.goBack() for request close ---
      onRequestClose={() => navigation.goBack()}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Update Sales Record</Text>
            <Pressable
              // --- 8. Use navigation.goBack() for close button ---
              onPress={() => navigation.goBack()}
              style={styles.closeButton}
            >
              <Ionicons name="close-circle" size={28} color={colors.muted} />
            </Pressable>
          </View>

          <ScrollView style={styles.formContainer}>
            {/* Display Property and Unit - Not Editable */}
            <L label="Property Building">
              <Text style={styles.displayOnlyText}>{form.propertyName}</Text>
            </L>
            <L label="Unit Number">
              <Text style={styles.displayOnlyText}>{form.unitNumber}</Text>
            </L>

            {/* Editable Fields */}
            <L label="Buyer Name*">
              <T
                value={form.buyerName}
                onChangeText={(v) => setForm((s) => ({ ...s, buyerName: v }))}
              />
            </L>
            <L label="Buyer Email">
              <T
                value={form.buyerEmail}
                onChangeText={(v) => setForm((s) => ({ ...s, buyerEmail: v }))}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </L>
            <L label="Buyer Phone">
              <T
                value={form.buyerPhone}
                onChangeText={(v) => setForm((s) => ({ ...s, buyerPhone: v }))}
                keyboardType="phone-pad"
              />
            </L>

            <L label="Sale Price*">
              <T
                value={form.salePrice}
                onChangeText={(v) => setForm((s) => ({ ...s, salePrice: v }))}
                keyboardType="numeric"
              />
            </L>
            <L label="Sale Date (YYYY-MM-DD)">
              <T
                value={form.saleDate}
                onChangeText={(v) => setForm((s) => ({ ...s, saleDate: v }))}
              />
            </L>
            <L label="Closing Date (YYYY-MM-DD)">
              <T
                value={form.closingDate}
                onChangeText={(v) => setForm((s) => ({ ...s, closingDate: v }))}
                placeholder="Optional"
              />
            </L>

            {/* Status Picker */}
            <L label="Sale Status*">
              <Pressable
                onPress={() => setStatusPickerOpen(true)}
                style={styles.pickerButton}
              >
                <Text style={{ color: colors.text }}>
                  {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                </Text>
              </Pressable>
            </L>

            <L label="Financing Type">
              <Pressable
                onPress={() => setFinancePickerOpen(true)}
                style={styles.pickerButton}
              >
                <Text style={{ color: colors.text }}>{form.financingType}</Text>
              </Pressable>
            </L>

            <L label="Agent Name">
              <T
                value={form.agentName}
                onChangeText={(v) => setForm((s) => ({ ...s, agentName: v }))}
              />
            </L>
            <L label="Agent Email">
              <T
                value={form.agentEmail}
                onChangeText={(v) => setForm((s) => ({ ...s, agentEmail: v }))}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </L>
            <L label="Agent Phone">
              <T
                value={form.agentPhone}
                onChangeText={(v) => setForm((s) => ({ ...s, agentPhone: v }))}
                keyboardType="phone-pad"
              />
            </L>
            <L label="Commission Rate (%)">
              <T
                value={form.commissionRate}
                onChangeText={(v) =>
                  setForm((s) => ({ ...s, commissionRate: v }))
                }
                placeholder="e.g., 3"
                keyboardType="numeric"
              />
            </L>

            <L label="Notes">
              <T
                value={form.notes}
                onChangeText={(v) => setForm((s) => ({ ...s, notes: v }))}
                multiline
              />
            </L>
            <L label="Source">
              <T
                value={form.source}
                onChangeText={(v) => setForm((s) => ({ ...s, source: v }))}
                placeholder="e.g., website, referral"
              />
            </L>
          </ScrollView>

          <View style={styles.navigation}>
            <Pressable
              // --- 9. Use navigation.goBack() for cancel button ---
              onPress={() => navigation.goBack()}
              style={[styles.button, styles.buttonOutline]}
            >
              <Text style={styles.buttonOutlineText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={save}
              disabled={saving || !form.buyerName || !form.salePrice}
              style={[
                styles.button,
                (saving || !form.buyerName || !form.salePrice) &&
                  styles.buttonDisabled,
              ]}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Update Sale</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>

      {/* --- Picker Modals --- */}
      <PickerModal
        visible={statusPickerOpen}
        onClose={() => setStatusPickerOpen(false)}
        title="Update Sale Status"
        options={SALE_STATUS_OPTIONS.map((s) => ({
          label: s.charAt(0).toUpperCase() + s.slice(1),
          value: s,
        }))}
        value={form.status}
        onSelect={(v) => {
          setForm((s) => ({ ...s, status: v }));
          setStatusPickerOpen(false);
        }}
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
    </Modal>
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
    justifyContent: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    maxHeight: "90%",
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
  displayOnlyText: {
    // Style for non-editable fields
    fontSize: 14,
    color: colors.muted, // Muted color
    paddingVertical: 10, // Match input padding
    paddingHorizontal: 12,
    backgroundColor: colors.light, // Light background
    borderRadius: 8,
    minHeight: 44, // Match input height
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
    // Still needed if you add other pickers
    backgroundColor: colors.light,
    borderColor: colors.border,
    opacity: 0.7,
  },
});
