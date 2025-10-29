import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Animated,
  Keyboard,
  Alert,
  Platform,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Ionicons } from "@expo/vector-icons";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import * as Haptics from "expo-haptics";
import { useRoute, useNavigation } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import { updateSale } from "../../api/sales";
import PickerModal from "../../components/PickerModal";
import { notifyError, notifySuccess } from "../../utils/notify";

const FINANCING_TYPES = ["cash", "pag_ibig", "in_house", "others"];
const SALE_STATUS_OPTIONS = ["pending", "closed", "cancelled"];

// --- Helper: Formats a date object to "Oct 29, 2025" ---
const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// --- Helper: Formats a number string with commas ---
const formatPrice = (value) => {
  const num = (value || "").toString().replace(/[^0-9]/g, "");
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// --- Helper: Removes commas from a formatted string ---
const unformatPrice = (value) => {
  return (value || "").toString().replace(/,/g, "");
};

export default function EditSaleModal() {
  const navigation = useNavigation();
  const route = useRoute();
  const { sale } = route.params || {};

  const [saving, setSaving] = useState(false);
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editingDate, setEditingDate] = useState(null); // 'saleDate' or 'closingDate'
  const [errors, setErrors] = useState({});

  // --- Initial form state matching the Edit logic ---
  const initialFormState = {
    propertyName: "",
    unitNumber: "",
    buyerName: "",
    buyerEmail: "",
    buyerPhone: "",
    salePrice: "",
    saleDate: new Date(),
    closingDate: null,
    status: "pending",
    financingType: "cash",
    agentName: "",
    agentEmail: "",
    agentPhone: "",
    commissionRate: "",
    notes: "",
    source: "",
  };
  const [form, setForm] = useState(initialFormState);

  // --- Refs for auto-focusing inputs ---
  const buyerNameRef = useRef(null);
  const buyerEmailRef = useRef(null);
  const buyerPhoneRef = useRef(null);
  const salePriceRef = useRef(null);
  const agentNameRef = useRef(null);
  const agentEmailRef = useRef(null);
  const agentPhoneRef = useRef(null);
  const commissionRateRef = useRef(null);
  const notesRef = useRef(null);
  const sourceRef = useRef(null);

  // --- Refs for animations ---
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const saveButtonAnim = useRef(new Animated.Value(0.5)).current;

  // --- Validation logic from original file ---
  const isFormValid = useMemo(
    () => form.buyerName && form.salePrice,
    [form.buyerName, form.salePrice]
  );

  // --- Animate save button when form becomes valid ---
  useEffect(() => {
    Animated.timing(saveButtonAnim, {
      toValue: isFormValid ? 1 : 0.6,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isFormValid]);

  // --- Original useEffect to populate form ---
  useEffect(() => {
    if (sale) {
      setForm({
        propertyName: sale.propertyName || "N/A",
        unitNumber: sale.unitId?.unitNumber || sale.unitNumber || "N/A",
        buyerName: sale.buyerName || "",
        buyerEmail: sale.buyerEmail || "",
        buyerPhone: sale.buyerPhone || "",
        salePrice: String(sale.salePrice || ""), // Keep as string for formatter
        saleDate: sale.saleDate ? new Date(sale.saleDate) : new Date(),
        closingDate: sale.closingDate ? new Date(sale.closingDate) : null,
        status: sale.status || "pending",
        financingType: sale.financingType || "cash",
        agentName: sale.agentName || "",
        agentEmail: sale.agentEmail || "",
        agentPhone: sale.agentPhone || "",
        commissionRate: String(sale.commissionRate || ""),
        notes: sale.notes || "",
        source: sale.source || "",
      });
    } else {
      notifyError("Sale data not found.");
      navigation.goBack();
    }
  }, [sale, navigation]);

  // --- NEW: Validation function ---
  const validateForm = () => {
    const newErrors = {};
    if (!form.buyerName.trim()) newErrors.buyerName = "Buyer name is required.";
    if (!unformatPrice(form.salePrice).trim())
      newErrors.salePrice = "Sale price is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- NEW: Shake animation ---
  const triggerShake = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    shakeAnimation.setValue(0);
    Animated.spring(shakeAnimation, {
      toValue: 1,
      friction: 2,
      tension: 150,
      useNativeDriver: true,
    }).start(() => shakeAnimation.setValue(0));
  };

  const interpolatedShake = shakeAnimation.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, -10, 10, -10, 0], // TranslateX
  });

  // --- MODIFIED: Save function with validation and confirmation ---
  async function save() {
    Keyboard.dismiss();
    if (!validateForm()) {
      triggerShake();
      return;
    }

    Alert.alert(
      "Update Sale",
      "Are you sure you want to save these changes?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Update",
          style: "default",
          onPress: async () => {
            setSaving(true);
            try {
              // --- Original payload logic from your file ---
              const payload = {
                buyerName: form.buyerName,
                buyerEmail: form.buyerEmail || undefined,
                buyerPhone: form.buyerPhone || undefined,
                salePrice: Number(unformatPrice(form.salePrice) || 0),
                saleDate: form.saleDate
                  ? new Date(form.saleDate).toISOString().split("T")[0]
                  : undefined,
                closingDate: form.closingDate
                  ? new Date(form.closingDate).toISOString().split("T")[0]
                  : undefined,
                status: form.status,
                financingType: form.financingType,
                agentName: form.agentName || undefined,
                agentEmail: form.agentEmail || undefined,
                agentPhone: form.agentPhone || undefined,
                commissionRate: form.commissionRate
                  ? Number(form.commissionRate)
                  : undefined,
                notes: form.notes || undefined,
                source: form.source || undefined,
              };

              await updateSale(sale._id, payload);
              notifySuccess("Sale updated successfully!");
              navigation.goBack();
            } catch (e) {
              notifyError(
                e?.response?.data?.message || "Failed to update sale"
              );
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  }

  // --- NEW: Cancel handler with confirmation ---
  const handleCancel = () => {
    Keyboard.dismiss();
    Alert.alert(
      "Discard Changes?",
      "Are you sure you want to cancel? Any unsaved changes will be lost.",
      [
        { text: "Stay", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  // --- NEW: Date picker handler ---
  const handleDateConfirm = (selectedDate) => {
    setShowDatePicker(false);
    if (editingDate) {
      setForm((s) => ({ ...s, [editingDate]: selectedDate }));
    }
    setEditingDate(null);
  };

  const openDatePicker = (field) => {
    setEditingDate(field);
    setShowDatePicker(true);
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.modalContent}>
            {/* --- NEW: Modern Header --- */}
            <View style={styles.headerContainer}>
              <View style={styles.pullIndicator} />
              <Text style={styles.modalTitle}>Update Sales Record</Text>
              <Text style={styles.modalSubtitle}>Editing Sale ID: {sale?._id.slice(-6)}</Text>
              <Pressable onPress={handleCancel} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* --- NEW: Keyboard-Aware Scroll Area --- */}
            <KeyboardAwareScrollView
              style={styles.formContainer}
              contentContainerStyle={styles.formContentContainer}
              keyboardShouldPersistTaps="handled"
              enableOnAndroid={true}
              extraScrollHeight={Platform.OS === "android" ? 150 : 0}
            >
              {/* --- Property/Unit (Display Only) --- */}
              <Section title="Property Details" icon="business-outline">
                <L label="Property Building">
                  <DisplayOnlyText value={form.propertyName} />
                </L>
                <L label="Unit Number">
                  <DisplayOnlyText value={form.unitNumber} />
                </L>
              </Section>

              {/* --- Buyer Info --- */}
              <Section title="Buyer Information" icon="person-outline">
                <L label="Buyer Name*" error={errors.buyerName}>
                  <T
                    ref={buyerNameRef}
                    value={form.buyerName}
                    onChangeText={(v) => setForm((s) => ({ ...s, buyerName: v }))}
                    placeholder="Enter buyer's full name"
                    error={!!errors.buyerName}
                    returnKeyType="next"
                    onSubmitEditing={() => buyerEmailRef.current?.focus()}
                  />
                </L>
                <L label="Buyer Email">
                  <T
                    ref={buyerEmailRef}
                    value={form.buyerEmail}
                    onChangeText={(v) => setForm((s) => ({ ...s, buyerEmail: v }))}
                    placeholder="buyer@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="next"
                    onSubmitEditing={() => buyerPhoneRef.current?.focus()}
                  />
                </L>
                <L label="Buyer Phone">
                  <T
                    ref={buyerPhoneRef}
                    value={form.buyerPhone}
                    onChangeText={(v) => setForm((s) => ({ ...s, buyerPhone: v }))}
                    placeholder="e.g., +639..."
                    keyboardType="phone-pad"
                    returnKeyType="next"
                    onSubmitEditing={() => salePriceRef.current?.focus()}
                  />
                </L>
              </Section>

              {/* --- Sale Details --- */}
              <Section title="Sale Details" icon="cash-outline">
                <L label="Sale Price*" error={errors.salePrice}>
                  <T
                    ref={salePriceRef}
                    value={formatPrice(form.salePrice)}
                    onChangeText={(v) =>
                      setForm((s) => ({ ...s, salePrice: unformatPrice(v) }))
                    }
                    placeholder="Enter final sale price"
                    keyboardType="numeric"
                    error={!!errors.salePrice}
                    returnKeyType="next"
                    onSubmitEditing={() => agentNameRef.current?.focus()}
                  />
                </L>
                <L label="Sale Date">
                  <PickerButton
                    label={formatDate(form.saleDate)}
                    onPress={() => openDatePicker("saleDate")}
                    hasValue={true}
                  />
                </L>
                <L label="Closing Date">
                  <PickerButton
                    label={
                      form.closingDate
                        ? formatDate(form.closingDate)
                        : "Select closing date"
                    }
                    onPress={() => openDatePicker("closingDate")}
                    hasValue={!!form.closingDate}
                    placeholder="Select closing date"
                  />
                </L>
                <L label="Sale Status*">
                  <PickerButton
                    label={
                      form.status.charAt(0).toUpperCase() + form.status.slice(1)
                    }
                    onPress={() => setStatusPickerOpen(true)}
                    hasValue={true}
                  />
                </L>
                <L label="Financing Type">
                  <FinancingChips
                    options={FINANCING_TYPES}
                    selectedValue={form.financingType}
                    onSelect={(value) => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setForm((s) => ({ ...s, financingType: value }));
                    }}
                  />
                </L>
              </Section>

              {/* --- Agent Info --- */}
              <Section title="Agent & Commission" icon="briefcase-outline">
                <L label="Agent Name">
                  <T
                    ref={agentNameRef}
                    value={form.agentName}
                    onChangeText={(v) => setForm((s) => ({ ...s, agentName: v }))}
                    placeholder="Agent's full name"
                    returnKeyType="next"
                    onSubmitEditing={() => agentEmailRef.current?.focus()}
                  />
                </L>
                <L label="Agent Email">
                  <T
                    ref={agentEmailRef}
                    value={form.agentEmail}
                    onChangeText={(v) =>
                      setForm((s) => ({ ...s, agentEmail: v }))
                    }
                    placeholder="agent@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="next"
                    onSubmitEditing={() => agentPhoneRef.current?.focus()}
                  />
                </L>
                <L label="Agent Phone">
                  <T
                    ref={agentPhoneRef}
                    value={form.agentPhone}
                    onChangeText={(v) =>
                      setForm((s) => ({ ...s, agentPhone: v }))
                    }
                    placeholder="e.g., +639..."
                    keyboardType="phone-pad"
                    returnKeyType="next"
                    onSubmitEditing={() => commissionRateRef.current?.focus()}
                  />
                </L>
                <L label="Commission Rate (%)">
                  <T
                    ref={commissionRateRef}
                    value={form.commissionRate}
                    onChangeText={(v) =>
                      setForm((s) => ({ ...s, commissionRate: v.replace(/[^0-9.]/g, '') }))
                    }
                    placeholder="e.g., 3.5"
                    keyboardType="numeric"
                    returnKeyType="next"
                    onSubmitEditing={() => notesRef.current?.focus()}
                  />
                </L>
              </Section>

              {/* --- Other Info --- */}
              <Section title="Other Information" icon="document-text-outline">
                <L label="Notes">
                  <T
                    ref={notesRef}
                    value={form.notes}
                    onChangeText={(v) => setForm((s) => ({ ...s, notes: v }))}
                    placeholder="Optional notes about this sale."
                    multiline
                    minHeight={100}
                    returnKeyType="default"
                  />
                </L>
                <L label="Source">
                  <T
                    ref={sourceRef}
                    value={form.source}
                    onChangeText={(v) => setForm((s) => ({ ...s, source: v }))}
                    placeholder="e.g., website, referral"
                    returnKeyType="done"
                  />
                </L>
              </Section>
            </KeyboardAwareScrollView>

            {/* --- NEW: Sticky Footer --- */}
            <Animated.View
              style={[
                styles.navigation,
                { transform: [{ translateX: interpolatedShake }] },
              ]}
            >
              <Pressable
                onPress={handleCancel}
                style={[styles.button, styles.buttonOutline]}
              >
                <Text style={styles.buttonOutlineText}>Cancel</Text>
              </Pressable>
              <Animated.View style={[{ flex: 1, marginHorizontal: 8 }, { opacity: saveButtonAnim }]}>
                <Pressable
                  onPress={save}
                  disabled={!isFormValid || saving}
                  style={[
                    styles.button,
                    styles.buttonFull,
                    (!isFormValid || saving) && styles.buttonDisabled,
                  ]}
                >
                  <Text style={styles.buttonText}>Update Sale</Text>
                </Pressable>
              </Animated.View>
            </Animated.View>
          </View>
        </SafeAreaView>

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
        <DateTimePickerModal
          isVisible={showDatePicker}
          mode="date"
          date={new Date(form[editingDate] || form.saleDate || new Date())}
          onConfirm={handleDateConfirm}
          onCancel={() => {
            setShowDatePicker(false);
            setEditingDate(null);
          }}
        />
        <LoadingOverlay visible={saving} />
      </View>
    </Modal>
  );
}

// --- NEW: Helper Components ---
function Section({ title, icon, children }) {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={20} color={colors.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

function L({ label, children, style, error }) {
  return (
    <View style={[styles.labelContainer, style]}>
      <Text style={styles.labelText}>{label}</Text>
      {children}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

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
      ref={ref}
      placeholderTextColor={colors.textSecondary}
      underlineColorAndroid="transparent"
      style={[baseStyle, props.style]}
    />
  );
});

function PickerButton({ label, onPress, placeholder, hasValue, disabled }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.pickerButton, disabled && styles.pickerButtonDisabled]}
    >
      <Text
        style={[
          styles.pickerButtonText,
          !hasValue && styles.pickerButtonPlaceholder,
        ]}
        numberOfLines={1}
      >
        {label || placeholder}
      </Text>
      <Ionicons
        name="chevron-down-outline"
        size={20}
        color={colors.textSecondary}
      />
    </Pressable>
  );
}

function DisplayOnlyText({ value }) {
  return (
    <View style={styles.displayOnlyContainer}>
      <Text style={styles.displayOnlyText}>{value}</Text>
    </View>
  );
}

function FinancingChips({ options, selectedValue, onSelect }) {
  return (
    <View style={styles.chipContainer}>
      {options.map((option) => {
        const isSelected = selectedValue === option;
        return (
          <Pressable
            key={option}
            onPress={() => onSelect(option)}
            style={[styles.chip, isSelected && styles.chipSelected]}
          >
            <Text
              style={[
                styles.chipText,
                isSelected && styles.chipTextSelected,
              ]}
            >
              {option.replace("_", " ").toUpperCase()}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function LoadingOverlay({ visible }) {
  if (!visible) return null;
  return (
    <View style={styles.loadingOverlay}>
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Updating Sale...</Text>
      </View>
    </View>
  );
}

// --- STYLES: Compressed to single lines as requested ---
const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  safeArea: { width: "100%", height: "95%" },
  modalContent: { flex: 1, backgroundColor: colors.light, borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: "hidden", display: "flex", flexDirection: "column" },
  headerContainer: { padding: 20, paddingTop: 16, paddingBottom: 12, alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.white, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  pullIndicator: { width: 40, height: 5, backgroundColor: colors.border, borderRadius: 2.5, position: "absolute", top: 8 },
  modalTitle: { fontWeight: "bold", fontSize: 18, color: colors.text, marginTop: 12 },
  modalSubtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  closeButton: { position: "absolute", right: 16, top: 24, backgroundColor: colors.light, borderRadius: 15, width: 30, height: 30, justifyContent: "center", alignItems: "center" },
  formContainer: { flex: 1, backgroundColor: colors.light },
  formContentContainer: { padding: 20, paddingBottom: 100, gap: 16 },
  sectionContainer: { backgroundColor: colors.white, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: colors.border, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: colors.text },
  sectionContent: { gap: 16 },
  navigation: { flexDirection: "row", justifyContent: "space-between", padding: 20, paddingTop: 16, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  button: { flex: 1, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginHorizontal: 8 },
  buttonFull: { marginHorizontal: 0 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  buttonOutline: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border },
  buttonOutlineText: { color: colors.text, fontWeight: "bold", fontSize: 16 },
  buttonDisabled: { backgroundColor: colors.gray, opacity: 0.8 },
  labelContainer: { width: "100%" },
  labelText: { color: colors.text, fontSize: 14, fontWeight: "600", marginBottom: 8 },
  textInputBase: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: colors.white, fontSize: 15, color: colors.text, height: 50 },
  textInputMultiline: { minHeight: 100, paddingVertical: 14, textAlignVertical: "top", height: "auto" },
  textInputError: { borderColor: colors.danger, backgroundColor: "#fff8f8" },
  errorText: { fontSize: 13, color: colors.danger, marginTop: 6 },
  helperText: { fontSize: 13, color: colors.textSecondary, marginTop: 6, fontStyle: "italic" },
  displayOnlyContainer: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, backgroundColor: colors.light, height: 50, justifyContent: "center" },
  displayOnlyText: { fontSize: 15, color: colors.textSecondary },
  pickerButton: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, backgroundColor: colors.white, height: 50 },
  pickerButtonText: { fontSize: 15, color: colors.text, flex: 1, marginRight: 8 },
  pickerButtonPlaceholder: { color: colors.textSecondary },
  pickerButtonDisabled: { backgroundColor: colors.light, opacity: 0.7 },
  chipContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: colors.light, borderWidth: 1.5, borderColor: colors.border },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontWeight: "600", fontSize: 13 },
  chipTextSelected: { color: colors.white },
  loadingOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  loadingBox: { backgroundColor: colors.white, borderRadius: 12, padding: 30, alignItems: "center", gap: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  loadingText: { fontSize: 16, fontWeight: "600", color: colors.text },
});