import React, { useEffect, useState } from "react";
import { Modal, View, Text, TextInput, Pressable } from "react-native";
import { colors } from "../../theme/colors";
import { listProperties } from "../../api/properties";
import { createSale } from "../../api/sales";
import PickerModal from "../../components/PickerModal";

const FINANCING_TYPES = ["cash", "bank_loan", "pagibig", "inhouse", "others"];

export default function AddSaleModal({ open, onClose }) {
  const [saving, setSaving] = useState(false);
  const [propsList, setPropsList] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [financePickerOpen, setFinancePickerOpen] = useState(false);

  const [form, setForm] = useState({
    propertyId: "",
    buyerName: "",
    buyerEmail: "",
    buyerPhone: "",
    salePrice: "",
    saleDate: "",
    financingType: "cash",
    agentName: "",
    agentEmail: "",
    agentPhone: "",
    notes: ""
  });

  useEffect(() => {
    if (open) listProperties({ status: "available", limit: 100 }).then((r) => setPropsList(r.data || []));
  }, [open]);

  async function save() {
    setSaving(true);
    try {
      await createSale({
        ...form,
        salePrice: Number(form.salePrice || 0)
      });
      onClose(true);
      setForm({
        propertyId: "", buyerName: "", buyerEmail: "", buyerPhone: "",
        salePrice: "", saleDate: "", financingType: "cash",
        agentName: "", agentEmail: "", agentPhone: "", notes: ""
      });
    } catch (e) { alert(e?.response?.data?.message || "Failed to record sale"); }
    finally { setSaving(false); }
  }

  const options = propsList.map((p) => ({ label: p.propertyName, value: p._id }));
  const selectedLabel = options.find((o) => o.value === form.propertyId)?.label || "Select a property";

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => onClose(false)}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)", padding: 16, justifyContent: "center" }}>
        <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: 16 }}>
          <Text style={{ textAlign: "center", fontWeight: "700", fontSize: 16 }}>Record New Sale</Text>
          <View style={{ gap: 10, marginTop: 12 }}>
            <L label="Property*">
              <Pressable onPress={() => setPickerOpen(true)} style={{ borderWidth: 1, borderColor: "#D9D9D9", borderRadius: 8, padding: 10, marginTop: 6 }}>
                <Text style={{ color: form.propertyId ? "#000" : "#6B7280" }}>{selectedLabel}</Text>
              </Pressable>
            </L>
            <L label="Buyer Name*"><T value={form.buyerName} onChangeText={(v) => setForm((s) => ({ ...s, buyerName: v }))} placeholder="Enter buyer name" /></L>
            <L label="Buyer Email"><T value={form.buyerEmail} onChangeText={(v) => setForm((s) => ({ ...s, buyerEmail: v }))} placeholder="email@example.com" keyboardType="email-address" /></L>
            <L label="Buyer Phone"><T value={form.buyerPhone} onChangeText={(v) => setForm((s) => ({ ...s, buyerPhone: v }))} placeholder="+63..." keyboardType="phone-pad" /></L>

            <L label="Sale Price"><T value={form.salePrice} onChangeText={(v) => setForm((s) => ({ ...s, salePrice: v }))} placeholder="Enter price" keyboardType="numeric" /></L>
            <L label="Sale Date"><T value={form.saleDate} onChangeText={(v) => setForm((s) => ({ ...s, saleDate: v }))} placeholder="YYYY-MM-DD" /></L>

            <L label="Financing Type">
              <Pressable onPress={() => setFinancePickerOpen(true)} style={{ borderWidth: 1, borderColor: "#D9D9D9", borderRadius: 8, padding: 10, marginTop: 6 }}>
                <Text style={{ color: "#000" }}>{form.financingType}</Text>
              </Pressable>
            </L>

            <L label="Agent Name"><T value={form.agentName} onChangeText={(v) => setForm((s) => ({ ...s, agentName: v }))} placeholder="Agent full name" /></L>
            <L label="Agent Email"><T value={form.agentEmail} onChangeText={(v) => setForm((s) => ({ ...s, agentEmail: v }))} placeholder="agent@example.com" keyboardType="email-address" /></L>
            <L label="Agent Phone"><T value={form.agentPhone} onChangeText={(v) => setForm((s) => ({ ...s, agentPhone: v }))} placeholder="+63..." keyboardType="phone-pad" /></L>

            <L label="Notes"><T value={form.notes} onChangeText={(v) => setForm((s) => ({ ...s, notes: v }))} placeholder="Optional notes" multiline /></L>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 14 }}>
            <Pressable onPress={() => onClose(false)} style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: colors.gray }}>
              <Text>Cancel</Text>
            </Pressable>
            <Pressable onPress={save} disabled={saving || !form.propertyId || !form.buyerName} style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }}>
              <Text style={{ color: "#fff" }}>{saving ? "Saving..." : "Record Sale"}</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <PickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Select Property"
        options={options}
        value={form.propertyId}
        onSelect={(v) => setForm((s) => ({ ...s, propertyId: v }))}
      />
      <PickerModal
        open={financePickerOpen}
        onClose={() => setFinancePickerOpen(false)}
        title="Financing Type"
        options={FINANCING_TYPES.map((t) => ({ label: t, value: t }))}
        value={form.financingType}
        onSelect={(v) => setForm((s) => ({ ...s, financingType: v }))}
      />
    </Modal>
  );
}

function L({ label, children }) { return (<View><Text style={{ color: "#6B7280", fontSize: 12 }}>{label}</Text>{children}</View>); }
function T(props) { return <TextInput {...props} style={[{ borderWidth: 1, borderColor: "#D9D9D9", borderRadius: 8, padding: 10, marginTop: 6 }, props.style]} />; }