import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  Platform,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { colors } from "../../theme/colors";
import {
  updateProperty,
  uploadThumbnail,
  uploadPhotos,
} from "../../api/properties";
import PickerModal from "../../components/PickerModal";
import { toAbsoluteUrl } from "../../api/client";
import { notifyError, notifySuccess } from "../../utils/notify";
import { Ionicons } from "@expo/vector-icons";

// Property Types (Unchanged)
const PROPERTY_TYPES = [
  "house",
  "condo",
  "apartment",
  "lot",
  "townhouse",
  "villa",
  "compound",
];

export default function EditPropertyModal({
  visible,
  onClose,
  onSave,
  propertyData,
}) {
  const property = propertyData;

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    propertyName: property?.propertyName || "",
    description: property?.description || "",
    street: property?.street || "",
    location: property?.location || "",
    city: property?.city || "",
    province: property?.province || "",
    propertyType: property?.propertyType || "house",
    amenities: property?.amenities || [],
    videoTours: property?.videoTours || [],
  });

  // (State for media, pickers, etc. - Unchanged)
  const [thumbPreview, setThumbPreview] = useState(property?.thumbnail || null);
  const [photosPreview, setPhotosPreview] = useState(property?.photos || []);
  const [newThumb, setNewThumb] = useState(null);
  const [newPhotos, setNewPhotos] = useState([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [currentAmenity, setCurrentAmenity] = useState("");

  // useEffect to update form (Unchanged)
  useEffect(() => {
    if (property) {
      setForm({
        propertyName: property.propertyName || "",
        description: property.description || "",
        street: property.street || "",
        location: property.location || "",
        city: property.city || "",
        province: property.province || "",
        propertyType: property.propertyType || "house",
        amenities: property.amenities || [],
        videoTours: property.videoTours || [],
      });
      setThumbPreview(property.thumbnail || null);
      setPhotosPreview(property.photos || []);
      setNewThumb(null);
      setNewPhotos([]);
      setCurrentAmenity("");
      setStep(0);
    }
  }, [property]);

  // Validation (Unchanged)
  const canNextBasic = useMemo(
    () => form.propertyName && form.province && form.city,
    [form]
  );

  // Image Picker Functions (Unchanged)
  async function pickThumb() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!res.canceled && res.assets && res.assets.length > 0) {
      const asset = res.assets[0];
      setNewThumb({
        uri: asset.uri,
        name:
          asset.fileName ||
          `thumbnail.${asset.mimeType.split("/")[1] || "jpg"}`,
        type: asset.mimeType,
      });
      setThumbPreview(asset.uri);
    }
  }

  async function pickPhotos() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.85,
    });
    if (!res.canceled && res.assets && res.assets.length > 0) {
      const selectedAssets = res.assets.map((asset, i) => ({
        uri: asset.uri,
        name:
          asset.fileName ||
          `photo_${i}.${asset.mimeType.split("/")[1] || "jpg"}`,
        type: asset.mimeType,
      }));
      setNewPhotos(selectedAssets);
      setPhotosPreview(selectedAssets.map((a) => a.uri));
    }
  }

  // Video URL Function (Unchanged)
  function addVideo() {
    const v = videoUrl.trim();
    if (v && !form.videoTours.includes(v)) {
      setForm((s) => ({ ...s, videoTours: [...(s.videoTours || []), v] }));
      setVideoUrl("");
    } else if (!v) {
    } else {
      setVideoUrl("");
    }
  }

  // Amenity Functions (Unchanged)
  const handleAddAmenity = useCallback(() => {
    const trimmedAmenity = currentAmenity.trim();
    if (trimmedAmenity && !form.amenities.includes(trimmedAmenity)) {
      setForm((prevForm) => ({
        ...prevForm,
        amenities: [...prevForm.amenities, trimmedAmenity],
      }));
      setCurrentAmenity("");
    } else if (!trimmedAmenity) {
    } else {
      setCurrentAmenity("");
    }
  }, [currentAmenity, form.amenities]);

  const handleRemoveAmenity = useCallback((amenityToRemove) => {
    setForm((prevForm) => ({
      ...prevForm,
      amenities: prevForm.amenities.filter(
        (amenity) => amenity !== amenityToRemove
      ),
    }));
  }, []);

  // Save Function (Unchanged)
  async function save() {
    if (!property) return;
    if (!form.propertyName || !form.province || !form.city) {
      notifyError(
        "Please fill in Property Name, Province, and City (*) on the Basic Info tab."
      );
      setStep(0);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        propertyName: form.propertyName,
        description: form.description,
        street: form.street,
        location: form.location,
        city: form.city,
        province: form.province,
        amenities: form.amenities,
        videoTours: form.videoTours,
        propertyType: form.propertyType,
      };
      await updateProperty(property._id, payload);
      if (newThumb) {
        await uploadThumbnail(property._id, newThumb);
      }
      if (newPhotos.length) {
        await uploadPhotos(property._id, newPhotos);
      }
      notifySuccess("Property updated successfully!");
      onSave();
    } catch (e) {
      notifyError(e?.response?.data?.message || "Failed to update property");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* --- MODIFIED: Added Close Button --- */}
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close-outline" size={28} color={colors.muted} />
          </Pressable>

          <Text style={styles.modalTitle}>
            Edit Property (Building/Complex)
          </Text>

          {/* --- MODIFIED: Polished Stepper/Tabs --- */}
          <View style={styles.stepper}>
            {["Basic", "Media"].map((t, i) => (
              <Pressable key={t} onPress={() => setStep(i)}>
                <Text
                  style={[styles.stepText, i === step && styles.stepTextActive]}
                >
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>

          <ScrollView style={styles.formContainer}>
            {/* --- STEP 0: Basic Info --- */}
            {step === 0 && (
              <View style={styles.stepView}>
                <L label="Property Name* (e.g., Building Name)">
                  <T
                    value={form.propertyName}
                    onChangeText={(v) =>
                      setForm((s) => ({ ...s, propertyName: v }))
                    }
                    placeholder="e.g., The Grand Residences"
                  />
                </L>
                <L label="Description (About the building/complex)">
                  <T
                    value={form.description}
                    onChangeText={(v) =>
                      setForm((s) => ({ ...s, description: v }))
                    }
                    placeholder="Building amenities, location highlights..."
                    multiline
                  />
                </L>
                <L label="Property Type* (Overall type)">
                  <Pressable
                    onPress={() => setTypePickerOpen(true)}
                    style={styles.pickerButton}
                  >
                    <Text style={{ color: colors.text }}>
                      {form.propertyType.charAt(0).toUpperCase() +
                        form.propertyType.slice(1)}
                    </Text>
                  </Pressable>
                </L>
                <L label="Street Address">
                  <T
                    value={form.street}
                    onChangeText={(v) => setForm((s) => ({ ...s, street: v }))}
                    placeholder="e.g., 123 Main St"
                  />
                </L>

                {/* --- MODIFIED: Grouped Province/City --- */}
                <View style={styles.formRow}>
                  <L label="Province*" style={styles.formRowItem}>
                    <T
                      value={form.province}
                      onChangeText={(v) =>
                        setForm((s) => ({ ...s, province: v }))
                      }
                      placeholder="Enter province"
                    />
                  </L>
                  <L label="City*" style={styles.formRowItem}>
                    <T
                      value={form.city}
                      onChangeText={(v) => setForm((s) => ({ ...s, city: v }))}
                      placeholder="Enter city"
                    />
                  </L>
                </View>

                <L label="Additional location details (optional)">
                  <T
                    value={form.location}
                    onChangeText={(v) =>
                      setForm((s) => ({ ...s, location: v }))
                    }
                    placeholder="Village/Barangay or specific notes"
                  />
                </L>
                <L label="Building Amenities">
                  <View style={styles.amenityInputContainer}>
                    <T
                      style={styles.amenityInput}
                      value={currentAmenity}
                      onChangeText={setCurrentAmenity}
                      placeholder="Type amenity and press +"
                      onSubmitEditing={handleAddAmenity}
                    />
                    {/* --- MODIFIED: Icon Button --- */}
                    <Pressable
                      style={[
                        styles.addButton,
                        !currentAmenity.trim() && styles.addButtonDisabled,
                      ]}
                      onPress={handleAddAmenity}
                      disabled={!currentAmenity.trim()}
                    >
                      <Ionicons
                        name="add-outline"
                        size={24}
                        color={colors.white}
                      />
                    </Pressable>
                  </View>
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
                        No building amenities added yet.
                      </Text>
                    )}
                  </View>
                </L>
              </View>
            )}

            {/* --- STEP 1: Media --- */}
            {step === 1 && (
              <View style={styles.stepView}>
                <Text style={styles.infoText}>
                  Update photos/videos for the overall property.
                </Text>
                <L label="Current Thumbnail">
                  <Pressable onPress={pickThumb} style={styles.imagePicker}>
                    {thumbPreview ? (
                      <Image
                        source={{ uri: toAbsoluteUrl(thumbPreview) }}
                        style={styles.previewImage}
                        {...(Platform.OS === "web" && {
                          referrerPolicy: "no-referrer",
                        })}
                      />
                    ) : (
                      <Text>Click to upload new thumbnail</Text>
                    )}
                  </Pressable>
                  {newThumb && (
                    <Text style={styles.infoTextSm}>New: {newThumb.name}</Text>
                  )}
                </L>
                <L label="Current Photos">
                  <Pressable
                    onPress={pickPhotos}
                    style={[styles.imagePicker, styles.imagePickerSmall]}
                  >
                    <Text>Click to select new photos (replaces all)</Text>
                  </Pressable>
                  <ScrollView horizontal style={styles.photosContainer}>
                    {photosPreview.map((photoUrl, index) => (
                      <Image
                        key={photoUrl + index}
                        source={{ uri: toAbsoluteUrl(photoUrl) }}
                        style={styles.previewImageSmall}
                        {...(Platform.OS === "web" && {
                          referrerPolicy: "no-referrer",
                        })}
                      />
                    ))}
                  </ScrollView>
                  <Text style={styles.infoTextSm}>
                    {newPhotos.length} new photos selected (will replace
                    existing on save)
                  </Text>
                </L>

                {/* --- MODIFIED: Consistent Video URL Input --- */}
                <L label="Video Tour URLs (YouTube/Vimeo)">
                  <View style={styles.amenityInputContainer}>
                    <T
                      style={styles.amenityInput}
                      value={videoUrl}
                      onChangeText={setVideoUrl}
                      placeholder="Paste a new video URL and press +"
                      onSubmitEditing={addVideo}
                    />
                    <Pressable
                      onPress={addVideo}
                      disabled={!videoUrl.trim()}
                      style={[
                        styles.addButton,
                        !videoUrl.trim() && styles.addButtonDisabled,
                      ]}
                    >
                      <Ionicons
                        name="add-outline"
                        size={24}
                        color={colors.white}
                      />
                    </Pressable>
                  </View>
                </L>
                {/* --- (Old separate button removed) --- */}

                {form.videoTours && form.videoTours.length > 0 && (
                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.infoTextSm}>Current Video URLs:</Text>
                    {form.videoTours.map((url, index) => (
                      <Text
                        key={index}
                        style={styles.infoTextSm}
                        numberOfLines={1}
                      >
                        • {url}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* --- Navigation --- */}
          <View style={styles.navigation}>
            <Pressable
              onPress={() => (step === 0 ? onClose() : setStep((s) => s - 1))}
              // --- MODIFIED: Added pressed state ---
              style={({ pressed }) => [
                styles.button,
                styles.buttonOutline,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.buttonOutlineText}>
                {step === 0 ? "Cancel" : "Back"}
              </Text>
            </Pressable>
            {step < 1 ? (
              <Pressable
                onPress={() => setStep((s) => s + 1)}
                disabled={step === 0 && !canNextBasic}
                // --- MODIFIED: Added pressed state ---
                style={({ pressed }) => [
                  styles.button,
                  step === 0 && !canNextBasic && styles.buttonDisabled,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.buttonText}>Next</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={save}
                disabled={saving}
                // --- MODIFIED: Added pressed state ---
                style={({ pressed }) => [
                  styles.button,
                  saving && styles.buttonDisabled,
                  pressed && styles.buttonPressed,
                ]}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Save Changes</Text>
                )}
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* --- Pickers (Unchanged) --- */}
      <PickerModal
        visible={typePickerOpen}
        onClose={() => setTypePickerOpen(false)}
        title="Select Property Type"
        options={PROPERTY_TYPES.map((t) => ({
          label: t.charAt(0).toUpperCase() + t.slice(1),
          value: t,
        }))}
        value={form.propertyType}
        onSelect={(v) => {
          setForm((s) => ({ ...s, propertyType: v }));
          setTypePickerOpen(false);
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

// --- MODIFIED: T component with focus state ---
function T(props) {
  const [isFocused, setIsFocused] = useState(false); // ADDED
  const baseStyle = [
    styles.textInputBase,
    props.multiline && styles.textInputMultiline,
    isFocused && styles.textInputFocused, // ADDED
  ];
  return (
    <TextInput
      {...props}
      placeholderTextColor="#6B7280"
      underlineColorAndroid="transparent"
      style={[baseStyle, props.style]}
      onFocus={(e) => {
        // ADDED
        setIsFocused(true);
        if (props.onFocus) props.onFocus(e);
      }}
      onBlur={(e) => {
        // ADDED
        setIsFocused(false);
        if (props.onBlur) props.onBlur(e);
      }}
    />
  );
}

// --- Styles (MODIFIED) ---
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
    maxHeight: "90%",
  },
  // --- ADDED: Close button ---
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 6,
    zIndex: 1,
  },
  modalTitle: {
    fontWeight: "700",
    fontSize: 18,
    textAlign: "center",
    color: colors.text,
    marginBottom: 5,
    paddingTop: 10, // Added padding for close button
  },
  // --- MODIFIED: Stepper/Tabs ---
  stepper: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 20,
    marginVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stepText: {
    color: colors.muted,
    fontWeight: "500",
    fontSize: 15,
    paddingBottom: 10,
  },
  stepTextActive: {
    color: colors.primary,
    fontWeight: "700",
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  // ---
  formContainer: { maxHeight: "70%", paddingBottom: 20 },
  // --- MODIFIED: Removed gap, using marginBottom on L ---
  stepView: { paddingHorizontal: 4, paddingBottom: 16 },
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
  // --- ADDED: Pressed state ---
  buttonPressed: {
    opacity: 0.8,
  },
  buttonSmall: { paddingVertical: 8, paddingHorizontal: 12 },
  // --- MODIFIED: Added marginBottom ---
  labelContainer: {
    marginBottom: 16,
  },
  labelText: {
    color: "#6B7280",
    fontSize: 13,
    marginBottom: 4,
    fontWeight: "500",
  },
  // --- MODIFIED: Unified border color ---
  textInputBase: {
    borderWidth: 1,
    borderColor: colors.border, // Changed from #D9D9D9
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
  // --- ADDED: Focus style ---
  textInputFocused: {
    borderColor: colors.primary,
    borderWidth: 1,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  // --- MODIFIED: Unified border color ---
  pickerButton: {
    borderWidth: 1,
    borderColor: colors.border, // Changed from #D9D9D9
    borderRadius: 8,
    padding: 10,
    height: 44,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  // --- ADDED: Form Row styles ---
  formRow: {
    flexDirection: "row",
    gap: 12,
  },
  formRowItem: {
    flex: 1,
  },
  // --- (Image/Media styles unchanged) ---
  infoText: { color: colors.muted, fontSize: 13, marginBottom: 4 },
  infoTextSm: { color: colors.muted, fontSize: 12, marginTop: 2 },
  imagePicker: {
    borderWidth: 1,
    borderColor: colors.gray,
    borderStyle: "dashed",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
  },
  imagePickerSmall: { minHeight: 60, padding: 12 },
  previewImage: { width: "100%", height: 150, borderRadius: 8 },
  photosContainer: { flexDirection: "row", paddingVertical: 8 },
  previewImageSmall: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: colors.light,
  },
  // --- (Amenity styles modified) ---
  amenityInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  amenityInput: {
    flex: 1,
  },
  // --- MODIFIED: Icon button style ---
  addButton: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonDisabled: {
    backgroundColor: colors.muted,
    opacity: 0.7,
  },
  // --- (Removed addButtonText) ---
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