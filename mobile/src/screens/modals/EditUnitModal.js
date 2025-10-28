import React, { useState, useEffect } from "react";
import {
  Modal,
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
import { updateUnit } from "../../api/properties"; // Use the new API function
import { notifyError, notifySuccess } from "../../utils/notify";
import PickerModal from "../../components/PickerModal";

const UNIT_STATUS_OPTIONS = [
  { label: "Available", value: "available" },
  { label: "Sold", value: "sold" },
  { label: "Rented", value: "rented" },
];

export default function EditUnitModal({ route, navigation }) {
  const { unit } = route.params; // Get the unit object passed during navigation
  const [saving, setSaving] = useState(false);
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);

  // Initialize form with existing unit data
  const [form, setForm] = useState({
    unitNumber: unit?.unitNumber || "",
    price: String(unit?.price || 0),
    status: unit?.status || "available",
    specifications: {
      floorArea: String(unit?.specifications?.floorArea || 0),
      bedrooms: String(unit?.specifications?.bedrooms || 0),
      bathrooms: String(unit?.specifications?.bathrooms || 0),
    },
    description: unit?.description || "", // Initialize description
    amenities: unit?.amenities || [], // Initialize amenities
  });

  // Ensure form updates if the unit prop changes (though unlikely in modal context)
  useEffect(() => {
    if (unit) {
      setForm({
        unitNumber: unit.unitNumber || "",
        price: String(unit.price || 0),
        status: unit.status || "available",
        specifications: {
          floorArea: String(unit.specifications?.floorArea || 0),
          bedrooms: String(unit.specifications?.bedrooms || 0),
          bathrooms: String(unit.specifications?.bathrooms || 0),
        },
        description: unit.description || "", // Update on unit change
        amenities: unit.amenities || [], // Update on unit change
      });
    }
  }, [unit]);

  async function save() {
    if (!form.unitNumber) {
      notifyError("Unit Number is required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price || 0),
        specifications: {
          floorArea: Number(form.specifications.floorArea || 0),
          bedrooms: Number(form.specifications.bedrooms || 0),
          bathrooms: Number(form.specifications.bathrooms || 0),
        },
      };
      await updateUnit(unit._id, payload); // Pass unitId and payload
      notifySuccess("Unit updated successfully!");
      navigation.goBack(); // Go back to Property Details
    } catch (e) {
      notifyError(e?.response?.data?.message || "Failed to update unit");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent
      onRequestClose={() => navigation.goBack()}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Unit</Text>
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.closeButton}
            >
              <Ionicons name="close-circle" size={28} color={colors.muted} />
            </Pressable>
          </View>

          <ScrollView style={styles.formContainer}>
            <L label="Unit Number*">
              <T
                value={form.unitNumber}
                onChangeText={(v) => setForm((s) => ({ ...s, unitNumber: v }))}
                placeholder="e.g., Apt 101, Villa 5"
              />
            </L>
            <L label="Price*">
              <T
                value={form.price}
                onChangeText={(v) => setForm((s) => ({ ...s, price: v }))}
                placeholder="e.g., 2500000"
                keyboardType="numeric"
              />
            </L>
            <L label="Status*">
              <Pressable
                onPress={() => setStatusPickerOpen(true)}
                style={styles.pickerButton}
              >
                <Text style={{ color: colors.text }}>
                  {UNIT_STATUS_OPTIONS.find((opt) => opt.value === form.status)
                    ?.label || "Select Status"}
                </Text>
              </Pressable>
            </L>
            <L label="Unit Description">
              <T
                value={form.description}
                onChangeText={(v) => setForm((s) => ({ ...s, description: v }))}
                placeholder="Describe this specific unit..."
                multiline
              />
            </L>
            <L label="Unit Amenities (comma-separated)">
              <T
                value={form.amenities.join(", ")}
                onChangeText={(v) =>
                  setForm((s) => ({
                    ...s,
                    amenities: v
                      .split(",")
                      .map((a) => a.trim())
                      .filter(Boolean),
                  }))
                }
                placeholder="e.g., Balcony, Air Conditioning"
              />
            </L>
            <L label="Floor Area (sqm)">
              <T
                value={form.specifications.floorArea}
                onChangeText={(v) =>
                  setForm((s) => ({
                    ...s,
                    specifications: { ...s.specifications, floorArea: v },
                  }))
                }
                placeholder="e.g., 55"
                keyboardType="numeric"
              />
            </L>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <L label="Bedrooms" style={{ flex: 1 }}>
                <T
                  value={form.specifications.bedrooms}
                  onChangeText={(v) =>
                    setForm((s) => ({
                      ...s,
                      specifications: { ...s.specifications, bedrooms: v },
                    }))
                  }
                  placeholder="e.g., 2"
                  keyboardType="numeric"
                />
              </L>
              <L label="Bathrooms" style={{ flex: 1 }}>
                <T
                  value={form.specifications.bathrooms}
                  onChangeText={(v) =>
                    setForm((s) => ({
                      ...s,
                      specifications: { ...s.specifications, bathrooms: v },
                    }))
                  }
                  placeholder="e.g., 1"
                  keyboardType="numeric"
                />
              </L>
            </View>
          </ScrollView>

          {/* --- Actions --- */}
          <View style={styles.navigation}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={[styles.button, styles.buttonOutline]}
            >
              <Text style={styles.buttonOutlineText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={save}
              disabled={saving || !form.unitNumber}
              style={[
                styles.button,
                (saving || !form.unitNumber) && styles.buttonDisabled,
              ]}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Save Changes</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>

      {/* --- Status Picker Modal --- */}
      <PickerModal
        visible={statusPickerOpen}
        onClose={() => setStatusPickerOpen(false)}
        title="Select Unit Status"
        options={UNIT_STATUS_OPTIONS}
        value={form.status}
        onSelect={(v) => {
          setForm((s) => ({ ...s, status: v }));
          setStatusPickerOpen(false);
        }}
      />
    </Modal>
  );
}

// --- Copy L & T Component definitions and styles here (identical to AddUnitModal) ---
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
      placeholderTextColor="#6B7280"
      underlineColorAndroid="transparent"
      style={[baseStyle, props.style]}
    />
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    maxHeight: "85%", // Adjusted maxHeight
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "center", // Center title by default
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 10, // Add padding bottom
    borderBottomWidth: 1, // Add border
    borderBottomColor: colors.border, // Use border color
    position: "relative", // Needed for absolute positioning of close button
  },
  modalTitle: {
    fontWeight: "700",
    fontSize: 18,
    textAlign: "center",
    color: colors.text,
  },
  closeButton: {
    position: "absolute",
    right: -5, // Adjust as needed for touch area
    top: -5, // Adjust as needed for touch area
  },
  formContainer: { maxHeight: "75%", paddingBottom: 10, paddingTop: 10 }, // Adjust height and add padding top
  navigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
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
    minWidth: 100, // Ensure buttons have minimum width
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  buttonOutline: {
    borderWidth: 1,
    borderColor: colors.gray,
    backgroundColor: "transparent",
  },
  buttonOutlineText: { color: colors.text, fontWeight: "600" },
  buttonDisabled: { backgroundColor: colors.gray, opacity: 0.7 },
  labelContainer: { marginBottom: 12 }, // Increased spacing
  labelText: {
    color: "#6B7280",
    fontSize: 13,
    marginBottom: 4,
    fontWeight: "500",
  },
  textInputBase: {
    borderWidth: 1,
    borderColor: "#D9D9D9",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    height: 44,
    color: colors.text,
  },
  textInputMultiline: {
    // Added for completeness if needed
    minHeight: 80,
    paddingVertical: 10,
    textAlignVertical: "top",
    height: "auto",
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: "#D9D9D9",
    borderRadius: 8,
    padding: 10,
    height: 44,
    justifyContent: "center",
    backgroundColor: "#fff", // Match TextInput background
  },
});
