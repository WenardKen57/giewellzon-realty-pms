import React, { useEffect, useMemo, useState } from "react";
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
import { getProvinces, getCities } from "../../api/locations";
import { toAbsoluteUrl } from "../../api/client";
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

export default function EditPropertyModal({ route, navigation }) {
  const { property } = route.params;
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // --- FIX: Aligned state with backend model ---
  const [form, setForm] = useState({
    propertyName: property.propertyName || "", // <-- FIX: Was 'name'
    description: property.description || "",
    street: property.street || "",
    location: property.location || "",
    city: property.city || "",
    province: property.province || "",
    price: String(property.price || 0),
    status: property.status || "available", // <-- FIX: Read from property.status
    propertyType: property.propertyType || "house",
    specifications: {
      floorArea: String(property.specifications?.floorArea || 0),
      bedrooms: String(property.specifications?.bedrooms || 0),
      bathrooms: String(property.specifications?.bathrooms || 0),
    },
    amenities: property.amenities || [],
    videoTours: property.videoTours || [],
    numberOfUnit: String(property.numberOfUnit || 0), // <-- FIX: Was 'availableUnits'
    more: property.more || "",
  });

  // Previews for existing media
  const [thumbPreview, setThumbPreview] = useState(property.thumbnail || null); // <-- FIX: Was property.thumbnail?.url
  const [photosPreview, setPhotosPreview] = useState(property.photos || []); // This is string[]

  // New media to be uploaded
  const [newThumb, setNewThumb] = useState(null); // { uri, name, type }
  const [newPhotos, setNewPhotos] = useState([]); // Array of { uri, name, type }

  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);

  // --- Location Data Fetching ---
  useEffect(() => {
    (async () => {
      try {
        const provData = await getProvinces();
        setProvinces(provData.map((p) => ({ label: p, value: p })));
      } catch {}
    })();
  }, []);

  useEffect(() => {
    const fetchCities = async () => {
      if (form.province) {
        setLoadingCities(true);
        try {
          const cityData = await getCities(form.province);
          setCities(cityData.map((c) => ({ label: c, value: c })));
        } catch {
          setCities([]);
        }
        setLoadingCities(false);
      } else {
        setCities([]);
      }
    };
    fetchCities();
  }, [form.province]);

  const [videoUrl, setVideoUrl] = useState("");
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [provPickerOpen, setProvPickerOpen] = useState(false);
  const [cityPickerOpen, setCityPickerOpen] = useState(false);

  const canNextBasic = useMemo(
    () => form.propertyName && form.description && (form.city || form.location), // <-- FIX: Was form.name
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
        uri: asset.uri,
        name:
          asset.fileName ||
          `thumbnail.${asset.mimeType.split("/")[1] || "jpg"}`,
        type: asset.mimeType,
      });
      setThumbPreview(asset.uri); // Update preview to local URI
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
      // Update preview to show new local images (which are objects)
      setPhotosPreview(
        selectedAssets.map((a) => ({ url: a.uri, public_id: a.uri }))
      );
    }
  }

  function addVideo() {
    const v = (videoUrl || "").trim();
    if (!v) return;
    setForm((s) => ({ ...s, videoTours: [...(s.videoTours || []), v] }));
    setVideoUrl("");
  }

  // --- Save Function ---
  async function save() {
    setSaving(true);
    try {
      // --- FIX: Send payload matching backend model ---
      const payload = {
        ...form,
        price: Number(form.price || 0),
        numberOfUnit: Number(form.numberOfUnit || 0), // <-- FIX: Send 'numberOfUnit'
        // 'status' is already correct
        specifications: {
          ...form.specifications,
          floorArea: Number(form.specifications.floorArea || 0),
          bedrooms: Number(form.specifications.bedrooms || 0),
          bathrooms: Number(form.specifications.bathrooms || 0),
        },
      };

      // Clean up fields the backend controller doesn't use or auto-sets
      delete payload.availableUnits;
      delete payload.name;
      delete payload.isSold; // Backend controller handles this based on numberOfUnit

      await updateProperty(property._id, payload);

      if (newThumb) {
        await uploadThumbnail(property._id, newThumb);
      }
      if (newPhotos.length) {
        // This REPLACES all existing photos per backend controller logic
        await uploadPhotos(property._id, newPhotos);
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
          <Text style={styles.modalTitle}>Edit Property</Text>
          <View style={styles.stepper}>
            {["Basic", "Media", "Specifications", "More"].map((t, i) => (
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
                <L label="Title*">
                  <T
                    value={form.propertyName} // <-- FIX: Was form.name
                    onChangeText={
                      (v) => setForm((s) => ({ ...s, propertyName: v })) // <-- FIX: Was name: v
                    }
                    placeholder="Property title"
                  />
                </L>
                <L label="Description*">
                  <T
                    value={form.description}
                    onChangeText={(v) =>
                      setForm((s) => ({ ...s, description: v }))
                    }
                    placeholder="Property description"
                    multiline
                  />
                </L>
                <L label="Street address">
                  <T
                    value={form.street}
                    onChangeText={(v) => setForm((s) => ({ ...s, street: v }))}
                    placeholder="Street address"
                  />
                </L>

                <L label="Province">
                  <Pressable
                    onPress={() => setProvPickerOpen(true)}
                    style={styles.pickerButton}
                  >
                    <Text style={{ color: form.province ? "#000" : "#6B7280" }}>
                      {form.province || "Select province"}
                    </Text>
                  </Pressable>
                </L>

                <L label="City">
                  <Pressable
                    disabled={!form.province || loadingCities}
                    onPress={() => setCityPickerOpen(true)}
                    style={[
                      styles.pickerButton,
                      (!form.province || loadingCities) &&
                        styles.pickerButtonDisabled,
                    ]}
                  >
                    <Text style={{ color: form.city ? "#000" : "#6B7280" }}>
                      {loadingCities
                        ? "Loading..."
                        : form.city || "Select city"}
                    </Text>
                  </Pressable>
                </L>

                <L label="Additional location (optional)">
                  <T
                    value={form.location}
                    onChangeText={(v) =>
                      setForm((s) => ({ ...s, location: v }))
                    }
                    placeholder="Village/Barangay or Notes"
                  />
                </L>
              </View>
            )}

            {/* --- STEP 1: Media --- */}
            {step === 1 && (
              <View style={styles.stepView}>
                <Text style={styles.infoText}>
                  Recommended: 1280x800, JPG/PNG
                </Text>

                <L label="Current Thumbnail">
                  <Pressable onPress={pickThumb} style={styles.imagePicker}>
                    {thumbPreview ? (
                      <Image
                        source={{ uri: toAbsoluteUrl(thumbPreview) }}
                        style={styles.previewImage}
                        // --- FIX: Add this prop for web ---
                        {...(Platform.OS === "web" && {
                          referrerPolicy: "no-referrer",
                        })}
                      />
                    ) : (
                      <Text>Click to upload new thumbnail</Text>
                    )}
                  </Pressable>
                  {newThumb && (
                    <Text style={styles.infoTextSm}>{newThumb.name}</Text>
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
                    {photosPreview.map((photo) => {
                      // --- FIX: Handle both string (initial) and object (new) ---
                      const key =
                        typeof photo === "string"
                          ? photo
                          : photo.public_id || photo.uri;
                      const url =
                        typeof photo === "string"
                          ? photo
                          : photo.url || photo.uri;
                      return (
                        <Image
                          key={key}
                          source={{ uri: toAbsoluteUrl(url) }}
                          style={styles.previewImageSmall}
                          // --- FIX: Add this prop for web ---
                          {...(Platform.OS === "web" && {
                            referrerPolicy: "no-referrer",
                          })}
                        />
                      );
                    })}
                  </ScrollView>
                  <Text style={styles.infoTextSm}>
                    {newPhotos.length} new photos selected
                  </Text>
                </L>

                {/* Video URLs */}
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

            {/* --- STEP 2: Specifications --- */}
            {step === 2 && (
              <View style={styles.stepView}>
                <L label="Price*">
                  <T
                    value={form.price}
                    onChangeText={(v) => setForm((s) => ({ ...s, price: v }))}
                    placeholder="e.g. 4500000"
                    keyboardType="numeric"
                  />
                </L>
                <L label="Units*">
                  <T
                    value={form.numberOfUnit} // <-- FIX: Was form.availableUnits
                    onChangeText={
                      (v) => setForm((s) => ({ ...s, numberOfUnit: v })) // <-- FIX: Was availableUnits: v
                    }
                    placeholder="e.g. 3"
                    keyboardType="numeric"
                  />
                </L>
                <L label="Floor Area*">
                  <T
                    value={form.specifications.floorArea}
                    onChangeText={(v) =>
                      setForm((s) => ({
                        ...s,
                        specifications: { ...s.specifications, floorArea: v },
                      }))
                    }
                    placeholder="e.g. 150"
                    keyboardType="numeric"
                  />
                </L>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <L label="Bedrooms*" style={{ flex: 1 }}>
                    <T
                      value={form.specifications.bedrooms}
                      onChangeText={(v) =>
                        setForm((s) => ({
                          ...s,
                          specifications: { ...s.specifications, bedrooms: v },
                        }))
                      }
                      placeholder="e.g. 3"
                      keyboardType="numeric"
                    />
                  </L>
                  <L label="Bathrooms*" style={{ flex: 1 }}>
                    <T
                      value={form.specifications.bathrooms}
                      onChangeText={(v) =>
                        setForm((s) => ({
                          ...s,
                          specifications: { ...s.specifications, bathrooms: v },
                        }))
                      }
                      placeholder="e.g. 2"
                      keyboardType="numeric"
                    />
                  </L>
                </View>
              </View>
            )}

            {/* --- STEP 3: More --- */}
            {step === 3 && (
              <View style={styles.stepView}>
                <L label="Property Type">
                  <Pressable
                    onPress={() => setTypePickerOpen(true)}
                    style={styles.pickerButton}
                  >
                    <Text style={{ color: colors.text }}>
                      {form.propertyType}
                    </Text>
                  </Pressable>
                </L>
                <L label="Additional Info">
                  <T
                    value={form.more}
                    onChangeText={(v) => setForm((s) => ({ ...s, more: v }))}
                    placeholder="Add more details..."
                    multiline
                  />
                </L>
                <View style={styles.statusToggle}>
                  <View>
                    <Text style={{ fontWeight: "600" }}>
                      {form.status === "available" ? "Available" : "Sold"}
                    </Text>
                    <Text style={styles.infoTextSm}>
                      Mark as available or sold
                    </Text>
                  </View>
                  <Pressable
                    onPress={() =>
                      setForm((s) => ({
                        ...s,
                        status: s.status === "available" ? "sold" : "available",
                      }))
                    }
                    style={[
                      styles.statusButton,
                      {
                        backgroundColor:
                          form.status === "available"
                            ? colors.successBg
                            : colors.dangerBg,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color:
                          form.status === "available"
                            ? colors.successText
                            : colors.dangerText,
                        fontWeight: "700",
                      }}
                    >
                      {form.status === "available" ? "AVAILABLE" : "SOLD"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>

          {/* --- Navigation --- */}
          <View style={styles.navigation}>
            <Pressable
              onPress={() =>
                step === 0 ? navigation.goBack() : setStep((s) => s - 1)
              }
              style={[styles.button, styles.buttonOutline]}
            >
              <Text style={styles.buttonOutlineText}>Back</Text>
            </Pressable>
            {step < 3 ? (
              <Pressable
                onPress={() =>
                  step === 0 && !canNextBasic ? null : setStep((s) => s + 1)
                }
                style={[
                  styles.button,
                  canNextBasic || step > 0 ? {} : styles.buttonDisabled,
                ]}
              >
                <Text style={styles.buttonText}>Next</Text>
              </Pressable>
            ) : (
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
        options={PROPERTY_TYPES.map((t) => ({ label: t, value: t }))}
        value={form.propertyType}
        onSelect={(v) => {
          setForm((s) => ({ ...s, propertyType: v }));
          setTypePickerOpen(false);
        }}
      />
      <PickerModal
        visible={provPickerOpen}
        onClose={() => setProvPickerOpen(false)}
        title="Select Province"
        options={provinces}
        value={form.province}
        onSelect={(v) => {
          setForm((s) => ({ ...s, province: v, city: "" }));
          setProvPickerOpen(false);
        }}
      />
      <PickerModal
        visible={cityPickerOpen}
        onClose={() => setCityPickerOpen(false)}
        title="Select City"
        options={cities}
        value={form.city}
        onSelect={(v) => {
          setForm((s) => ({ ...s, city: v }));
          setCityPickerOpen(false);
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
    maxHeight: "90%",
  },
  modalTitle: {
    fontWeight: "700",
    fontSize: 18,
    textAlign: "center",
    color: colors.text,
  },
  stepper: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginVertical: 12,
  },
  stepText: { color: colors.muted, fontWeight: "500" },
  stepTextActive: { color: colors.primary, fontWeight: "700" },
  formContainer: { maxHeight: "70%", paddingBottom: 20 },
  stepView: { gap: 10, paddingHorizontal: 4, paddingBottom: 16 },
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
  labelContainer: { marginBottom: 6 },
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
  },
  pickerButtonDisabled: { backgroundColor: colors.light, opacity: 0.7 },
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
  statusToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.light,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  statusButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
});
