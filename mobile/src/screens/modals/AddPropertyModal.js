import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  Platform,
  StyleSheet,
  Image,
  ActivityIndicator,
  SafeAreaView,
  Animated,
  Dimensions,
  Keyboard,
  FlatList,
  ImageBackground,
  Alert,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
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
const TOTAL_STEPS = 2;
const MAX_PHOTOS = 15;

// --- Main Modal Component ---
export default function AddPropertyModal({ navigation }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // --- All original state is kept ---
  const [form, setForm] = useState({
    propertyName: "",
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

  const [errors, setErrors] = useState({});
  const [videoUrl, setVideoUrl] = useState("");
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [thumb, setThumb] = useState(null);
  const [photos, setPhotos] = useState([]);

  // --- Original logic is kept ---
  const canNextBasic = useMemo(
    () => form.propertyName && form.description && form.province && form.city,
    [form]
  );

  // --- ADDED: Refs for auto-focus ---
  const nameRef = useRef(null);
  const descRef = useRef(null);
  const streetRef = useRef(null);
  const provinceRef = useRef(null);
  const cityRef = useRef(null);
  const locationRef = useRef(null);
  const amenitiesRef = useRef(null);
  const videoUrlRef = useRef(null);

  // --- ADDED: Animation refs ---
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const nextButtonOpacity = useRef(new Animated.Value(0.5)).current;

  // --- Animate Next button opacity when validation changes ---
  useEffect(() => {
    Animated.timing(nextButtonOpacity, {
      toValue: canNextBasic ? 1 : 0.5,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [canNextBasic]);

  // --- All original API/logic functions are kept ---
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  // --- MODIFIED: pickPhotos respects MAX_PHOTOS limit ---
  async function pickPhotos() {
    const currentCount = photos.length;
    if (currentCount >= MAX_PHOTOS) {
      notifyError(`You can only select up to ${MAX_PHOTOS} photos.`);
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.85,
      selectionLimit: MAX_PHOTOS - currentCount, // Only allow picking the remaining number
    });

    if (!res.canceled && res.assets && res.assets.length > 0) {
      const newPhotos = res.assets.map((asset, i) => ({
        uri: asset.uri,
        name:
          asset.fileName ||
          `photo_${i}.${asset.mimeType.split("/")[1] || "jpg"}`,
        type: asset.mimeType,
      }));
      setPhotos((prevPhotos) => [...prevPhotos, ...newPhotos]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  // --- NEW: Remove Thumbnail ---
  function removeThumb() {
    setThumb(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  // --- NEW: Remove specific photo from gallery ---
  function removePhoto(uriToRemove) {
    Alert.alert(
      "Remove Photo",
      "Are you sure you want to remove this photo?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            setPhotos((prevPhotos) =>
              prevPhotos.filter((photo) => photo.uri !== uriToRemove)
            );
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        },
      ]
    );
  }

  function addVideo() {
    const v = (videoUrl || "").trim();
    if (!v) return;
    setForm((s) => ({ ...s, videoTours: [...(s.videoTours || []), v] }));
    setVideoUrl("");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    videoUrlRef.current?.clear();
  }

  // --- NEW: Validation function ---
  function validateBasicInfo() {
    const newErrors = {};
    if (!form.propertyName.trim())
      newErrors.propertyName = "Property name is required.";
    if (!form.description.trim())
      newErrors.description = "Description is required.";
    if (!form.province.trim()) newErrors.province = "Province is required.";
    if (!form.city.trim()) newErrors.city = "City is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Return true if no errors
  }

  // --- NEW: Shake Animation ---
  function triggerShake() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    shakeAnimation.setValue(0);
    Animated.spring(shakeAnimation, {
      toValue: 1,
      friction: 2,
      tension: 150,
      useNativeDriver: true,
    }).start(() => {
      shakeAnimation.setValue(0); // Reset for next time
    });
  }

  const interpolatedShake = shakeAnimation.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, -10, 10, -10, 0], // TranslateX
  });

  // --- MODIFIED: Save function uses new validation ---
  async function save() {
    if (!validateBasicInfo()) {
      notifyError(
        "Please fill in all required fields (*) on the Basic Info tab."
      );
      setStep(0);
      triggerShake();
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
    } finally {
      setSaving(false);
    }
  }

  // --- NEW: Confirmation Alert for Saving ---
  function confirmSave() {
    Alert.alert("Save Property", "Are you sure you want to save this property?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Save",
        style: "default",
        onPress: () => {
          save(); // Call original save function
        },
      },
    ]);
  }

  // --- NEW: Confirmation Alert for Canceling ---
  function confirmCancel() {
    Alert.alert(
      "Discard Changes?",
      "Are you sure you want to exit? Any unsaved changes will be lost.",
      [
        { text: "Stay", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            navigation.goBack(); // Go back only if confirmed
          },
        },
      ]
    );
  }

  // --- NEW: Handlers for bottom bar ---
  const handleNext = () => {
    Keyboard.dismiss();
    if (step === 0) {
      if (validateBasicInfo()) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setStep(1);
      } else {
        triggerShake();
      }
    } else {
      // On final step, "Next" button is "Save"
      confirmSave(); // --- MODIFIED: Show confirm alert first
    }
  };

  const handleBack = () => {
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 0) {
      confirmCancel(); // --- MODIFIED: Show confirm alert first
    } else {
      setStep(0);
    }
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={false}
      onRequestClose={() => navigation.goBack()}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.modalContainer}>
          <Stepper step={step} totalSteps={TOTAL_STEPS} />

          <KeyboardAwareScrollView
            style={styles.formContainer}
            contentContainerStyle={styles.formContentContainer}
            keyboardShouldPersistTaps="handled"
            enableOnAndroid={true}
            extraScrollHeight={Platform.OS === "android" ? 150 : 0}
          >
            {step === 0 && (
              <BasicInfoStep
                form={form}
                setForm={setForm}
                errors={errors}
                setTypePickerOpen={setTypePickerOpen}
                nameRef={nameRef}
                descRef={descRef}
                streetRef={streetRef}
                provinceRef={provinceRef}
                cityRef={cityRef}
                locationRef={locationRef}
                amenitiesRef={amenitiesRef}
              />
            )}

            {step === 1 && (
              <MediaStep
                form={form}
                setForm={setForm}
                videoUrl={videoUrl}
                setVideoUrl={setVideoUrl}
                addVideo={addVideo}
                thumb={thumb}
                pickThumb={pickThumb}
                removeThumb={removeThumb}
                photos={photos}
                pickPhotos={pickPhotos}
                removePhoto={removePhoto}
                videoUrlRef={videoUrlRef}
              />
            )}
          </KeyboardAwareScrollView>

          <BottomNavBar
            step={step}
            totalSteps={TOTAL_STEPS}
            onBack={handleBack}
            onNext={handleNext}
            canNext={step === 0 ? canNextBasic : true}
            isSaving={saving}
            shakeStyle={{ transform: [{ translateX: interpolatedShake }] }}
            opacityStyle={{ opacity: step === 0 ? nextButtonOpacity : 1 }}
          />
        </View>
      </SafeAreaView>

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

      <LoadingOverlay visible={saving} />
    </Modal>
  );
}

// --- NEW: Stepper Component ---
function Stepper({ step, totalSteps }) {
  const progress = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get("window").width;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: ((step + 1) / totalSteps) * screenWidth,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [step, totalSteps, screenWidth]);

  return (
    <View style={styles.stepperContainer}>
      <Text style={styles.stepperTitle}>Add Property</Text>
      <Text style={styles.stepperSubtitle}>
        Step {step + 1} of {totalSteps}: {step === 0 ? "Basic Info" : "Media"}
      </Text>
      <View style={styles.progressBarBackground}>
        <Animated.View style={[styles.progressBar, { width: progress }]} />
      </View>
    </View>
  );
}

// --- NEW: Step 1 Component ---
function BasicInfoStep({
  form,
  setForm,
  errors,
  setTypePickerOpen,
  nameRef,
  descRef,
  streetRef,
  provinceRef,
  cityRef,
  locationRef,
  amenitiesRef,
}) {
  return (
    <View style={styles.stepView}>
      <L label="Property Name*" error={errors.propertyName}>
        <T
          ref={nameRef}
          value={form.propertyName}
          onChangeText={(v) => setForm((s) => ({ ...s, propertyName: v }))}
          placeholder="e.g., The Grand Residences"
          returnKeyType="next"
          onSubmitEditing={() => descRef.current?.focus()}
          error={!!errors.propertyName}
        />
      </L>
      <L label="Description*" error={errors.description}>
        <T
          ref={descRef}
          value={form.description}
          onChangeText={(v) => setForm((s) => ({ ...s, description: v }))}
          placeholder="Building amenities, location highlights..."
          multiline
          minHeight={100}
          error={!!errors.description}
        />
      </L>
      <L label="Property Type*">
        <Pressable
          onPress={() => setTypePickerOpen(true)}
          style={styles.pickerButton}
        >
          <Text style={styles.pickerButtonText}>
            {form.propertyType.charAt(0).toUpperCase() +
              form.propertyType.slice(1)}
          </Text>
          <Ionicons
            name="chevron-down"
            size={20}
            color={colors.textSecondary}
          />
        </Pressable>
      </L>
      <L label="Street Address">
        <T
          ref={streetRef}
          value={form.street}
          onChangeText={(v) => setForm((s) => ({ ...s, street: v }))}
          placeholder="e.g., 123 Main St"
          returnKeyType="next"
          onSubmitEditing={() => provinceRef.current?.focus()}
        />
      </L>
      <L label="Province*" error={errors.province}>
        <T
          ref={provinceRef}
          value={form.province}
          onChangeText={(v) => setForm((s) => ({ ...s, province: v }))}
          placeholder="Enter province name"
          returnKeyType="next"
          onSubmitEditing={() => cityRef.current?.focus()}
          error={!!errors.province}
        />
      </L>
      <L label="City*" error={errors.city}>
        <T
          ref={cityRef}
          value={form.city}
          onChangeText={(v) => setForm((s) => ({ ...s, city: v }))}
          placeholder="Enter city name"
          returnKeyType="next"
          onSubmitEditing={() => locationRef.current?.focus()}
          error={!!errors.city}
        />
      </L>
      <L label="Additional location details (optional)">
        <T
          ref={locationRef}
          value={form.location}
          onChangeText={(v) => setForm((s) => ({ ...s, location: v }))}
          placeholder="Village/Barangay or specific notes"
          returnKeyType="next"
          onSubmitEditing={() => amenitiesRef.current?.focus()}
        />
      </L>
      <L label="Amenities (comma-separated)">
        <T
          ref={amenitiesRef}
          value={form.amenities.join(", ")}
          onChangeText={(v) =>
            setForm((s) => ({
              ...s,
              amenities: v.split(",").map((a) => a.trim()).filter(Boolean),
            }))
          }
          placeholder="e.g., Swimming Pool, Gym, Parking"
          returnKeyType="done"
        />
      </L>
    </View>
  );
}

// --- NEW: Step 2 Component ---
function MediaStep({
  form,
  videoUrl,
  setVideoUrl,
  addVideo,
  thumb,
  pickThumb,
  removeThumb,
  photos,
  pickPhotos,
  removePhoto,
  videoUrlRef,
}) {
  // --- NEW: Render function for photo grid ---
  const renderPhotoItem = ({ item, index }) => {
    if (item.isAddButton) {
      if (photos.length >= MAX_PHOTOS) return null;
      return (
        <Pressable
          style={[styles.photoGridItem, styles.photoGridAddButton]}
          onPress={pickPhotos}
        >
          <Ionicons name="add" size={40} color={colors.primary} />
          <Text style={styles.photoGridAddSubText}>Add Photos</Text>
        </Pressable>
      );
    }

    return (
      <View style={styles.photoGridItem}>
        <ImageBackground
          source={{ uri: item.uri }}
          style={styles.photoGridImage}
          imageStyle={{ borderRadius: 8 }}
          {...(Platform.OS === "web" && { referrerPolicy: "no-referrer" })}
        >
          <Pressable
            style={styles.photoRemoveButton}
            onPress={() => removePhoto(item.uri)}
          >
            <Ionicons name="close" size={18} color={colors.white} />
          </Pressable>
        </ImageBackground>
      </View>
    );
  };

  const photoGridData = [...photos, { isAddButton: true }];

  return (
    <View style={styles.stepView}>
      <L label="Thumbnail (Main Image)">
        <Pressable onPress={pickThumb} style={styles.thumbPicker}>
          {thumb ? (
            <ImageBackground
              source={{ uri: thumb.uri }}
              style={styles.thumbPreview}
              imageStyle={styles.thumbPreviewImage}
              {...(Platform.OS === "web" && { referrerPolicy: "no-referrer" })}
            >
              <Pressable style={styles.thumbRemoveButton} onPress={removeThumb}>
                <Ionicons name="close" size={20} color={colors.white} />
              </Pressable>
            </ImageBackground>
          ) : (
            <View style={styles.thumbPlaceholder}>
              <MaterialCommunityIcons
                name="image-outline"
                size={50}
                color={colors.textSecondary}
              />
              <Text style={styles.thumbPlaceholderText}>
                Upload Main Thumbnail
              </Text>
              <Text style={styles.infoTextSm}>4:3 Ratio Recommended</Text>
            </View>
          )}
        </Pressable>
      </L>

      <L label={`Photos (${photos.length} / ${MAX_PHOTOS})`}>
        <FlatList
          data={photoGridData}
          renderItem={renderPhotoItem}
          keyExtractor={(item, index) => item.uri || `add-${index}`}
          numColumns={3}
          style={styles.photoGridContainer}
          scrollEnabled={false}
        />
      </L>

      <L label="Video Tour URL (YouTube/Vimeo)">
        <T
          ref={videoUrlRef}
          value={videoUrl}
          onChangeText={setVideoUrl}
          placeholder="https://youtube.com/watch?v=..."
          returnKeyType="done"
          onSubmitEditing={addVideo}
        />
      </L>
      <Pressable
        onPress={addVideo}
        disabled={!videoUrl.trim()}
        style={[
          styles.buttonSmall,
          !videoUrl.trim() && styles.buttonSmallDisabled,
        ]}
      >
        <Text style={styles.buttonSmallText}>Add Video URL</Text>
      </Pressable>
      {form.videoTours?.map((url, index) => (
        <Text key={index} style={styles.infoTextSmUrl} numberOfLines={1}>
          <Ionicons name="link" size={13} color={colors.textSecondary} /> {url}
        </Text>
      ))}
    </View>
  );
}

// --- NEW: Bottom Bar Component ---
function BottomNavBar({
  step,
  totalSteps,
  onBack,
  onNext,
  canNext,
  isSaving,
  shakeStyle,
  opacityStyle,
}) {
  return (
    <View style={styles.navigation}>
      <Pressable onPress={onBack} style={[styles.button, styles.buttonOutline]}>
        <Text style={styles.buttonOutlineText}>
          {step === 0 ? "Cancel" : "Back"}
        </Text>
      </Pressable>

      <Animated.View
        style={[{ flex: 1, marginHorizontal: 8 }, shakeStyle, opacityStyle]}
      >
        <Pressable
          onPress={onNext}
          disabled={!canNext || isSaving}
          style={[
            styles.button,
            styles.buttonFull,
            (!canNext || isSaving) && styles.buttonDisabled,
          ]}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {step < totalSteps - 1 ? "Next" : "Save Property"}
            </Text>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

// --- NEW: Loading Overlay Component ---
function LoadingOverlay({ visible }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.loadingOverlay}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Saving Property...</Text>
        </View>
      </View>
    </Modal>
  );
}

// --- L & T Components (Updated Styles) ---
function L({ label, children, style, error }) {
  return (
    <View style={[styles.labelContainer, style]}>
      <Text style={styles.labelText}>{label}</Text>
      {children}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// --- FIXED: Use React.forwardRef to correctly pass ref to TextInput ---
const T = React.forwardRef((props, ref) => {
  const { minHeight, error, ...rest } = props;
  const baseStyle = [
    styles.textInputBase,
    props.multiline && styles.textInputMultiline,
    minHeight ? { minHeight } : {},
    error && styles.textInputError,
  ];
  return (
    <TextInput
      {...rest}
      ref={ref} // Correctly pass the forwarded ref
      placeholderTextColor={colors.textSecondary}
      underlineColorAndroid="transparent"
      style={[baseStyle, props.style]}
    />
  );
});

// --- STYLES: Compressed to single lines as requested ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  modalContainer: { flex: 1, display: "flex", flexDirection: "column" },
  stepperContainer: { padding: 20, paddingTop: Platform.OS === "android" ? 20 : 0, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  stepperTitle: { fontSize: 22, fontWeight: "bold", color: colors.text },
  stepperSubtitle: { fontSize: 15, color: colors.textSecondary, marginTop: 4 },
  progressBarBackground: { height: 4, backgroundColor: colors.border, borderRadius: 2, marginTop: 16 },
  progressBar: { height: 4, backgroundColor: colors.primary, borderRadius: 2 },
  formContainer: { flex: 1 },
  formContentContainer: { padding: 20, paddingBottom: 100 },
  stepView: { gap: 20 },
  navigation: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", justifyContent: "space-between", padding: 20, paddingTop: 16, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  button: { flex: 1, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginHorizontal: 8 },
  buttonFull: { marginHorizontal: 0 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  buttonOutline: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border },
  buttonOutlineText: { color: colors.text, fontWeight: "bold", fontSize: 16 },
  buttonDisabled: { backgroundColor: colors.gray },
  buttonSmall: { alignSelf: "flex-start", backgroundColor: colors.primary, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  buttonSmallText: { color: colors.white, fontWeight: "600" },
  buttonSmallDisabled: { backgroundColor: colors.gray },
  labelContainer: { width: "100%" },
  labelText: { color: colors.text, fontSize: 14, fontWeight: "600", marginBottom: 8 },
  textInputBase: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: colors.light, fontSize: 15, color: colors.text },
  textInputMultiline: { minHeight: 80, paddingVertical: 14, textAlignVertical: "top" },
  textInputError: { borderColor: colors.danger, backgroundColor: "#fff8f8" },
  errorText: { fontSize: 13, color: colors.danger, marginTop: 6 },
  pickerButton: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, backgroundColor: colors.light, height: 50 },
  pickerButtonText: { fontSize: 15, color: colors.text },
  infoText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, padding: 12, backgroundColor: colors.light, borderRadius: 8 },
  infoTextSm: { fontSize: 12, color: colors.textSecondary, textAlign: "center", marginTop: 4 },
  infoTextSmUrl: { color: colors.textSecondary, fontSize: 13, paddingLeft: 4, marginTop: -8 },
  thumbPicker: { width: "100%", height: 180, borderRadius: 10, borderWidth: 2, borderColor: colors.border, borderStyle: "dashed", backgroundColor: colors.light, justifyContent: "center", alignItems: "center", overflow: "hidden" },
  thumbPlaceholder: { alignItems: "center" },
  thumbPlaceholderText: { fontSize: 15, fontWeight: "600", color: colors.textSecondary, marginTop: 8 },
  thumbPreview: { width: "100%", height: "100%", justifyContent: "flex-start", alignItems: "flex-end" },
  thumbPreviewImage: { borderRadius: 8 },
  thumbRemoveButton: { margin: 8, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 15, width: 30, height: 30, justifyContent: "center", alignItems: "center" },
  photoGridContainer: { marginTop: 8 },
  photoGridItem: { flex: 1 / 3, aspectRatio: 1, padding: 4 },
  photoGridImage: { width: "100%", height: "100%", borderRadius: 8, backgroundColor: colors.border, justifyContent: "flex-start", alignItems: "flex-end" },
  photoRemoveButton: { margin: 4, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 12, width: 24, height: 24, justifyContent: "center", alignItems: "center" },
  photoGridAddButton: { justifyContent: "center", alignItems: "center", backgroundColor: colors.light, borderRadius: 8, borderWidth: 2, borderColor: colors.border, borderStyle: "dashed" },
  photoGridAddSubText: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  loadingOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  loadingBox: { backgroundColor: colors.white, borderRadius: 12, padding: 30, alignItems: "center", gap: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  loadingText: { fontSize: 16, fontWeight: "600", color: colors.text },
});