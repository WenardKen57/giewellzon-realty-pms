import React, { useState, useEffect, useCallback } from "react"; // Added useCallback
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
    description: unit?.description || "",
    amenities: unit?.amenities || [], // Initialize amenities from unit
  });

  // --- 👇 NEW State for single amenity input ---
  const [currentAmenity, setCurrentAmenity] = useState("");
  // ------------------------------------------

  // Ensure form updates if the unit prop changes
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
        description: unit.description || "",
        amenities: unit.amenities || [], // Make sure amenities are updated
      });
      setCurrentAmenity(""); // Clear input field when modal opens/unit changes
    }
  }, [unit]);

  // --- 👇 NEW Function to add amenity ---
  const handleAddAmenity = useCallback(() => {
    const trimmedAmenity = currentAmenity.trim();
    // Add only if it's not empty and not already in the list
    if (trimmedAmenity && !form.amenities.includes(trimmedAmenity)) {
      setForm((prevForm) => ({
        ...prevForm,
        amenities: [...prevForm.amenities, trimmedAmenity],
      }));
      setCurrentAmenity(""); // Clear input after adding
    } else if (!trimmedAmenity) {
      // Optionally notify if trying to add empty string
      // notifyError("Amenity cannot be empty.");
    } else {
      // Optionally notify if amenity already exists
      // notifyError(`"${trimmedAmenity}" already added.`);
      setCurrentAmenity(""); // Still clear input
    }
  }, [currentAmenity, form.amenities]);
  // ------------------------------------

  // --- 👇 NEW Function to remove amenity ---
  const handleRemoveAmenity = useCallback((amenityToRemove) => {
    setForm((prevForm) => ({
      ...prevForm,
      amenities: prevForm.amenities.filter(
        (amenity) => amenity !== amenityToRemove
      ),
    }));
  }, []);
  // ---------------------------------------

  async function save() {
    if (!form.unitNumber || !form.price) {
      // Added price validation
      notifyError("Unit Number and Price are required (*).");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form, // Includes description and updated amenities array
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

            {/* --- 👇 UPDATED Amenities Input Section --- */}
            <L label="Unit Amenities">
              <View style={styles.amenityInputContainer}>
                <T
                  style={styles.amenityInput}
                  value={currentAmenity}
                  onChangeText={setCurrentAmenity}
                  placeholder="Type amenity and press Add"
                  onSubmitEditing={handleAddAmenity} // Add on enter key
                />
                <Pressable
                  style={[
                    styles.addButton,
                    !currentAmenity.trim() && styles.addButtonDisabled,
                  ]}
                  onPress={handleAddAmenity}
                  disabled={!currentAmenity.trim()}
                >
                  <Text style={styles.addButtonText}>Add</Text>
                </Pressable>
              </View>
              {/* Display added amenities */}
              <View style={styles.amenitiesList}>
                {form.amenities.map((amenity, index) => (
                  <View key={index} style={styles.amenityTag}>
                    <Text style={styles.amenityTagText}>{amenity}</Text>
                    <Pressable
                      onPress={() => handleRemoveAmenity(amenity)}
                      style={styles.removeButton}
                    >
                      <Ionicons
                        name="close-circle"
                        size={18}
                        color={colors.danger}
                      />
                    </Pressable>
                  </View>
                ))}
                {form.amenities.length === 0 && (
                  <Text style={styles.noAmenitiesText}>
                    No amenities added yet.
                  </Text>
                )}
              </View>
            </L>
            {/* -------------------------------------- */}

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
              disabled={saving || !form.unitNumber || !form.price} // Added price validation here too
              style={[
                styles.button,
                (saving || !form.unitNumber || !form.price) &&
                  styles.buttonDisabled,
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
      placeholderTextColor="#6B7280"
      underlineColorAndroid="transparent"
      style={[baseStyle, props.style]}
    />
  );
}

// --- Styles ---
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
    maxHeight: "85%",
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
    minWidth: 100,
  },
  buttonText: { color: "#fff", fontWeight: "600" },
  buttonOutline: {
    borderWidth: 1,
    borderColor: colors.gray,
    backgroundColor: "transparent",
  },
  buttonOutlineText: { color: colors.text, fontWeight: "600" },
  buttonDisabled: { backgroundColor: colors.gray, opacity: 0.7 },
  labelContainer: { marginBottom: 12 },
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
    backgroundColor: "#fff",
  },
  // --- Amenity Input Styles ---
  amenityInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  amenityInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    height: 44,
    justifyContent: "center",
  },
  addButtonDisabled: {
    backgroundColor: colors.muted,
    opacity: 0.7,
  },
  addButtonText: {
    color: colors.white,
    fontWeight: "600",
  },
  amenitiesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    gap: 8,
  },
  amenityTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.light,
    borderRadius: 15,
    paddingVertical: 5,
    paddingLeft: 10,
    paddingRight: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  amenityTagText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginRight: 4,
  },
  removeButton: {
    padding: 2,
  },
  noAmenitiesText: {
    fontSize: 13,
    color: colors.muted,
    fontStyle: "italic",
  },
});
