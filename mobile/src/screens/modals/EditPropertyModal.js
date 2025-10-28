import React, { useEffect, useMemo, useState, useCallback } from "react"; // Added useCallback
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
// Removed getProvinces, getCities
import { toAbsoluteUrl } from "../../api/client";
import { notifyError, notifySuccess } from "../../utils/notify";
import { Ionicons } from "@expo/vector-icons"; // Added Ionicons

// Property Types for the Building/Complex itself
const PROPERTY_TYPES = [
  "house",
  "condo",
  "apartment",
  "lot",
  "townhouse",
  "villa",
  "compound",
];

export default function EditPropertyModal({ route, navigation }) {
  const { property } = route.params;
  const [step, setStep] = useState(0); // Simplified to 2 steps: Basic, Media
  const [saving, setSaving] = useState(false);

  // --- Form state aligned with Property model ---
  const [form, setForm] = useState({
    propertyName: property?.propertyName || "",
    description: property?.description || "", // Keep description for building
    street: property?.street || "",
    location: property?.location || "", // Additional location notes
    city: property?.city || "", // Text input
    province: property?.province || "", // Text input
    propertyType: property?.propertyType || "house", // Type of building/complex
    amenities: property?.amenities || [], // Keep building amenities
    videoTours: property?.videoTours || [],
    // Removed price, status, specifications, numberOfUnit, more
  });

  // Previews for existing media
  const [thumbPreview, setThumbPreview] = useState(property?.thumbnail || null);
  const [photosPreview, setPhotosPreview] = useState(property?.photos || []);

  // New media to be uploaded
  const [newThumb, setNewThumb] = useState(null);
  const [newPhotos, setNewPhotos] = useState([]);

  // --- Removed state for provinces, cities, pickers ---

  const [videoUrl, setVideoUrl] = useState("");
  const [typePickerOpen, setTypePickerOpen] = useState(false); // Only type picker needed

  // --- State for single amenity input ---
  const [currentAmenity, setCurrentAmenity] = useState("");
  // ------------------------------------

  // Update form if property prop changes
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
        amenities: property.amenities || [], // Ensure amenities are loaded
        videoTours: property.videoTours || [],
      });
      // Reset media previews based on initial property data
      setThumbPreview(property.thumbnail || null);
      setPhotosPreview(property.photos || []);
      // Clear any newly selected files from previous edits
      setNewThumb(null);
      setNewPhotos([]);
      setCurrentAmenity(""); // Clear amenity input on open/change
    }
  }, [property]);

  // Basic validation for the first step
  const canNextBasic = useMemo(
    // Description is optional, main required fields are name, province, city
    () => form.propertyName && form.province && form.city,
    [form]
  );

  // --- Image Picker Functions ---
  async function pickThumb() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!res.canceled && res.assets && res.assets.length > 0) {
      const asset = res.assets[0];
      setNewThumb({
        // Store the selected file object
        uri: asset.uri,
        name:
          asset.fileName ||
          `thumbnail.${asset.mimeType.split("/")[1] || "jpg"}`,
        type: asset.mimeType,
      });
      setThumbPreview(asset.uri); // Update preview to show the local file URI
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
      setNewPhotos(selectedAssets); // Store the array of selected file objects
      // Update preview to show new local images (map URIs for display)
      setPhotosPreview(selectedAssets.map((a) => a.uri)); // Store URIs for preview
    }
  }

  // --- Video URL Function ---
  function addVideo() {
    const v = videoUrl.trim();
    if (v && !form.videoTours.includes(v)) {
      // Prevent duplicates
      setForm((s) => ({ ...s, videoTours: [...(s.videoTours || []), v] }));
      setVideoUrl("");
    } else if (!v) {
      // notifyError("Video URL cannot be empty.");
    } else {
      // notifyError("Video URL already added.");
      setVideoUrl(""); // Still clear input
    }
  }

  // --- Amenity Functions ---
  const handleAddAmenity = useCallback(() => {
    const trimmedAmenity = currentAmenity.trim();
    if (trimmedAmenity && !form.amenities.includes(trimmedAmenity)) {
      setForm((prevForm) => ({
        ...prevForm,
        amenities: [...prevForm.amenities, trimmedAmenity],
      }));
      setCurrentAmenity("");
    } else if (!trimmedAmenity) {
      /* Optional notification */
    } else {
      /* Optional notification */ setCurrentAmenity("");
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
  // -------------------------

  // --- Save Function ---
  async function save() {
    // Basic validation
    if (!form.propertyName || !form.province || !form.city) {
      notifyError(
        "Please fill in Property Name, Province, and City (*) on the Basic Info tab."
      );
      setStep(0);
      return;
    }

    setSaving(true);
    try {
      // Payload contains only valid Property fields
      const payload = {
        propertyName: form.propertyName,
        description: form.description,
        street: form.street,
        location: form.location,
        city: form.city,
        province: form.province,
        amenities: form.amenities, // Send updated amenities
        videoTours: form.videoTours, // Send updated video tours
        propertyType: form.propertyType,
      };
      // Removed unit-specific fields

      await updateProperty(property._id, payload);

      // Upload media ONLY if new files were selected
      if (newThumb) {
        await uploadThumbnail(property._id, newThumb);
      }
      if (newPhotos.length) {
        await uploadPhotos(property._id, newPhotos); // Assumes API replaces photos
      }

      notifySuccess("Property updated successfully!");
      navigation.goBack();
    } catch (e) {
      notifyError(e?.response?.data?.message || "Failed to update property");
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
          <Text style={styles.modalTitle}>
            Edit Property (Building/Complex)
          </Text>
          {/* Simplified Stepper */}
          <View style={styles.stepper}>
            {["Basic", "Media"].map((t, i) => (
              <Text
                key={t}
                style={[styles.stepText, i === step && styles.stepTextActive]}
              >
                {t}
              </Text>
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
                {/* Kept description for building */}
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
                {/* Province Input */}
                <L label="Province*">
                  <T
                    value={form.province}
                    onChangeText={(v) =>
                      setForm((s) => ({ ...s, province: v }))
                    }
                    placeholder="Enter province name"
                  />
                </L>
                {/* City Input */}
                <L label="City*">
                  <T
                    value={form.city}
                    onChangeText={(v) => setForm((s) => ({ ...s, city: v }))}
                    placeholder="Enter city name"
                  />
                </L>
                <L label="Additional location details (optional)">
                  <T
                    value={form.location}
                    onChangeText={(v) =>
                      setForm((s) => ({ ...s, location: v }))
                    }
                    placeholder="Village/Barangay or specific notes"
                  />
                </L>
                {/* Amenities Input */}
                <L label="Building Amenities">
                  <View style={styles.amenityInputContainer}>
                    <T
                      style={styles.amenityInput}
                      value={currentAmenity}
                      onChangeText={setCurrentAmenity}
                      placeholder="Type amenity and press Add"
                      onSubmitEditing={handleAddAmenity}
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
                {/* Thumbnail Input */}
                <L label="Current Thumbnail">
                  <Pressable onPress={pickThumb} style={styles.imagePicker}>
                    {thumbPreview ? (
                      <Image
                        source={{ uri: toAbsoluteUrl(thumbPreview) }} // Handles both local URI and remote URL
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
                {/* Photos Input */}
                <L label="Current Photos">
                  <Pressable
                    onPress={pickPhotos}
                    style={[styles.imagePicker, styles.imagePickerSmall]}
                  >
                    <Text>Click to select new photos (replaces all)</Text>
                  </Pressable>
                  <ScrollView horizontal style={styles.photosContainer}>
                    {/* Map over photosPreview which now holds URIs or original URLs */}
                    {photosPreview.map((photoUrl, index) => (
                      <Image
                        key={photoUrl + index} // Use index if URLs aren't unique enough temporarily
                        source={{ uri: toAbsoluteUrl(photoUrl) }} // Handles both local/remote
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
                {/* Video URLs Input */}
                <L label="Video Tour URLs (YouTube/Vimeo)">
                  <T
                    value={videoUrl}
                    onChangeText={setVideoUrl}
                    placeholder="Add a new video URL..."
                  />
                </L>
                <Pressable
                  onPress={addVideo}
                  disabled={!videoUrl}
                  style={[
                    styles.button,
                    styles.buttonSmall,
                    { alignSelf: "flex-start", opacity: videoUrl ? 1 : 0.5 },
                  ]}
                >
                  <Text style={styles.buttonText}>Add Video URL</Text>
                </Pressable>
                {/* Display current video URLs - Simple list */}
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
                      // TODO: Add a remove button per URL
                    ))}
                  </View>
                )}
              </View>
            )}
            {/* Steps 2 & 3 Removed */}
          </ScrollView>

          {/* --- Navigation --- */}
          <View style={styles.navigation}>
            <Pressable
              onPress={() =>
                step === 0 ? navigation.goBack() : setStep((s) => s - 1)
              }
              style={[styles.button, styles.buttonOutline]}
            >
              <Text style={styles.buttonOutlineText}>
                {step === 0 ? "Cancel" : "Back"}
              </Text>
            </Pressable>
            {/* Show Next if not on last step (step 1) */}
            {step < 1 ? (
              <Pressable
                onPress={() => setStep((s) => s + 1)}
                disabled={step === 0 && !canNextBasic}
                style={[
                  styles.button,
                  step === 0 && !canNextBasic && styles.buttonDisabled,
                ]}
              >
                <Text style={styles.buttonText}>Next</Text>
              </Pressable>
            ) : (
              // Show Save on last step (step 1)
              <Pressable
                onPress={save}
                disabled={saving}
                style={[styles.button, saving && styles.buttonDisabled]}
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

      {/* --- Pickers --- */}
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
      {/* Removed Province/City Pickers */}
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
    maxHeight: "90%",
  },
  modalTitle: {
    fontWeight: "700",
    fontSize: 18,
    textAlign: "center",
    color: colors.text,
    marginBottom: 5,
  },
  stepper: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginVertical: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stepText: { color: colors.muted, fontWeight: "500" },
  stepTextActive: { color: colors.primary, fontWeight: "700" },
  formContainer: { maxHeight: "70%", paddingBottom: 20 },
  stepView: { gap: 12, paddingHorizontal: 4, paddingBottom: 16 },
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
  buttonSmall: { paddingVertical: 8, paddingHorizontal: 12 },
  labelContainer: { marginBottom: 0 },
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
  // -------------------------
});
