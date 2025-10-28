import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  Platform,
  ScrollView,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { colors } from "../../theme/colors";
import {
  createProperty,
  uploadThumbnail,
  uploadPhotos,
} from "../../api/properties";
import PickerModal from "../../components/PickerModal";
import { notifyError, notifySuccess } from "../../utils/notify";

const PROPERTY_TYPES = [
  "house",
  "condo",
  "apartment",
  "lot",
  "townhouse",
  "villa",
  "compound",
];

export default function AddPropertyModal({ navigation }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // --- FIX: Aligned state with backend model ---
  const [form, setForm] = useState({
    propertyName: "", // <-- FIX: Was 'name'
    description: "",
    street: "",
    location: "",
    city: "",
    province: "",
    propertyType: "house",
    amenities: [],
    videoTours: [],
    more: "",
  });

  const [videoUrl, setVideoUrl] = useState("");
  const [typePickerOpen, setTypePickerOpen] = useState(false);

  const [thumb, setThumb] = useState(null); // { uri, name, type }
  const [photos, setPhotos] = useState([]); // Array of { uri, name, type }

  const canNextBasic = useMemo(
    () => form.propertyName && form.description && form.province && form.city, // Check if province and city are typed
    [form]
  );

  async function pickThumb() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });

    if (!res.canceled && res.assets && res.assets.length > 0) {
      const asset = res.assets[0];
      setThumb({
        uri: asset.uri,
        name:
          asset.fileName ||
          `thumbnail.${asset.mimeType.split("/")[1] || "jpg"}`,
        type: asset.mimeType,
      });
    }
  }

  async function pickPhotos() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.85,
    });

    if (!res.canceled && res.assets && res.assets.length > 0) {
      setPhotos(
        res.assets
          .map((asset, i) => ({
            uri: asset.uri,
            name:
              asset.fileName ||
              `photo_${i}.${asset.mimeType.split("/")[1] || "jpg"}`,
            type: asset.mimeType,
          }))
          .slice(0, 15)
      );
    }
  }

  function addVideo() {
    const v = (videoUrl || "").trim();
    if (!v) return;
    setForm((s) => ({ ...s, videoTours: [...(s.videoTours || []), v] }));
    setVideoUrl("");
  }

  async function save() {
    // --- 1. ADD VALIDATION HERE ---
    if (
      !form.propertyName ||
      !form.description ||
      !form.province ||
      !form.city
    ) {
      notifyError(
        "Please fill in all required fields (*) on the Basic Info tab."
      );
      setStep(0); // Go back to the first step so the user can see what's missing
      return; // Stop the save process
    }
    // --- End of Validation ---

    setSaving(true);
    try {
      const payload = {
        propertyName: form.propertyName,
        description: form.description,
        street: form.street,
        location: form.location,
        city: form.city,
        province: form.province,
        featured: false,
        amenities: form.amenities,
        videoTours: form.videoTours,
        propertyType: form.propertyType,
      };

      const created = await createProperty(payload);

      if (thumb) {
        await uploadThumbnail(created._id, thumb);
      }
      if (photos.length) {
        await uploadPhotos(created._id, photos);
      }

      notifySuccess("Property added successfully!");
      navigation.goBack();
    } catch (e) {
      notifyError(e?.response?.data?.message || "Failed to add property");
      // Optional: If the error suggests a validation issue, maybe navigate back to step 0
      // if (e?.response?.status === 400) { setStep(0); }
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
          {/* Updated Title */}
          <Text style={styles.modalTitle}>Add Property (Building/Complex)</Text>
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
                <L label="Description* (About the building/complex)">
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
                      {/* Capitalize for display */}
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

                {/* --- Province Input --- */}
                <L label="Province*">
                  <T
                    value={form.province}
                    onChangeText={(v) =>
                      setForm((s) => ({ ...s, province: v }))
                    }
                    placeholder="Enter province name"
                  />
                </L>

                {/* --- City Input --- */}
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
                {/* --- Amenities Input --- */}
                <L label="Amenities (comma-separated)">
                  <T
                    value={form.amenities.join(", ")} // Join array for display
                    // Split string into array, trim whitespace, remove empty strings
                    onChangeText={(v) =>
                      setForm((s) => ({
                        ...s,
                        amenities: v
                          .split(",")
                          .map((a) => a.trim())
                          .filter(Boolean),
                      }))
                    }
                    placeholder="e.g., Swimming Pool, Gym, Parking Area"
                  />
                </L>
              </View>
            )}

            {/* --- STEP 1: Media --- */}
            {step === 1 && (
              <View style={styles.stepView}>
                <Text style={styles.infoText}>
                  Add photos/videos for the overall property (building exterior,
                  lobby, amenities). Unit-specific photos are added separately
                  later.
                </Text>

                <L label="Thumbnail (Main Image)">
                  <Pressable onPress={pickThumb} style={styles.imagePicker}>
                    {thumb ? (
                      <Image
                        source={{ uri: thumb.uri }}
                        style={styles.previewImage}
                        {...(Platform.OS === "web" && {
                          referrerPolicy: "no-referrer",
                        })}
                      />
                    ) : (
                      <Text>Click to upload thumbnail</Text>
                    )}
                  </Pressable>
                  {thumb && (
                    <Text style={styles.infoTextSm}>
                      {thumb.name} ({thumb.type})
                    </Text>
                  )}
                </L>

                <L label="Photos (Gallery Images)">
                  <Pressable
                    onPress={pickPhotos}
                    style={[styles.imagePicker, styles.imagePickerSmall]}
                  >
                    <Text>Select Photos (up to 15)</Text>
                  </Pressable>
                  <ScrollView horizontal style={styles.photosContainer}>
                    {photos.map((photo) => (
                      <Image
                        key={photo.uri}
                        source={{ uri: photo.uri }}
                        style={styles.previewImageSmall}
                        {...(Platform.OS === "web" && {
                          referrerPolicy: "no-referrer",
                        })}
                      />
                    ))}
                  </ScrollView>
                  <Text style={styles.infoTextSm}>
                    {photos.length}/15 selected
                  </Text>
                </L>

                <L label="Video Tour URL (YouTube/Vimeo)">
                  <T
                    value={videoUrl}
                    onChangeText={setVideoUrl}
                    placeholder="https://youtube.com/watch?v=..."
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
                {!!form.videoTours?.length && (
                  <Text style={styles.infoTextSm}>
                    {form.videoTours.length} video link(s) added
                  </Text>
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
              {/* Text changes based on step */}
              <Text style={styles.buttonOutlineText}>
                {step === 0 ? "Cancel" : "Back"}
              </Text>
            </Pressable>
            {/* Only show Next button if not on the last step (step 1) */}
            {step < 1 ? (
              <Pressable
                onPress={() => setStep((s) => s + 1)} // Simplified logic
                // Disable Next on step 0 if basic info is invalid
                disabled={step === 0 && !canNextBasic}
                style={[
                  styles.button,
                  step === 0 && !canNextBasic && styles.buttonDisabled,
                ]}
              >
                <Text style={styles.buttonText}>Next</Text>
              </Pressable>
            ) : (
              // Show Save button only on the last step (step 1)
              <Pressable
                onPress={save}
                disabled={saving}
                style={[styles.button, saving && styles.buttonDisabled]}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  // Changed button text
                  <Text style={styles.buttonText}>Save Property</Text>
                )}
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* --- Property Type Modal --- */}
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
      {/* Province/City Pickers Removed */}
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
    marginBottom: 5, // Added margin
  },
  stepper: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginVertical: 12,
    paddingBottom: 10, // Added padding
    borderBottomWidth: 1, // Added border
    borderBottomColor: colors.border,
  },
  stepText: { color: colors.muted, fontWeight: "500" },
  stepTextActive: { color: colors.primary, fontWeight: "700" },
  formContainer: { maxHeight: "70%", paddingBottom: 20 },
  stepView: { gap: 12, paddingHorizontal: 4, paddingBottom: 16 }, // Increased gap
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
  buttonSmall: { paddingVertical: 8, paddingHorizontal: 12 },
  labelContainer: { marginBottom: 0 }, // Reduced margin bottom
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
    // Keep for Property Type
    borderWidth: 1,
    borderColor: "#D9D9D9",
    borderRadius: 8,
    padding: 10,
    height: 44,
    justifyContent: "center",
    backgroundColor: "#fff", // Match TextInput background
  },
  // pickerButtonDisabled removed
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
  // statusToggle and statusButton removed
});
