import React from "react";
import { Modal, View, Text, Pressable, ScrollView } from "react-native";
import { colors } from "../theme/colors";

// --- FIX: Changed 'open' prop to 'visible' to match how it's called ---
export default function PickerModal({ visible, title = "Select", options = [], value, onSelect, onClose }) {
  return (
    // --- FIX: Pass 'visible' prop to the Modal component ---
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)", padding: 16, justifyContent: "center" }}>
        <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: 16, maxHeight: "70%" }}>
          <Text style={{ textAlign: "center", fontWeight: "700", fontSize: 16 }}>{title}</Text>
          <ScrollView style={{ marginTop: 12 }}>
            {options.map((o) => {
              const active = o.value === value;
              return (
                <Pressable key={o.value} onPress={() => { onSelect?.(o.value); onClose?.(); }} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#EEE" }}>
                  <Text style={{ fontWeight: active ? "700" : "500", color: active ? colors.primary : colors.text }}>{o.label}</Text>
                </Pressable>
              );
            })}
            {options.length === 0 && <Text style={{ textAlign: "center", color: colors.muted }}>No options</Text>}
          </ScrollView>
          <Pressable onPress={onClose} style={{ marginTop: 12, alignSelf: "flex-end", paddingHorizontal: 12, paddingVertical: 8 }}>
            <Text style={{ color: colors.primary, fontWeight: "600" }}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}