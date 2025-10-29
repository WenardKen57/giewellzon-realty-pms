
import React from "react";
import { Platform, View, Pressable, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

let DateTimePicker, ReactDatePicker;
if (Platform.OS !== "web") {
  DateTimePicker = require("@react-native-community/datetimepicker").default;
} else {
  ReactDatePicker = require("react-datepicker").default;
  require("react-datepicker/dist/react-datepicker.css");
}

export default function DatePickerField({ value, onChange, label, minimumDate, maximumDate }) {
  const [show, setShow] = React.useState(false);
  const date = value ? new Date(value) : new Date();

  const onChangeDate = (event, selectedDate) => {
    setShow(false);
    if (selectedDate) {
      onChange(selectedDate.toISOString().split("T")[0]);
    }
  };

  // For web, use react-datepicker
  if (Platform.OS === "web" && ReactDatePicker) {
    return (
      <View style={styles.container}>
        {label && <Text style={styles.label}>{label}</Text>}
        <View style={styles.webPickerWrapper}>
          <ReactDatePicker
            selected={date}
            onChange={(d) => d && onChange(d.toISOString().split("T")[0])}
            dateFormat="yyyy-MM-dd"
            minDate={minimumDate}
            maxDate={maximumDate}
            customInput={
              <Pressable style={styles.input}>
                <Text style={{ color: value ? colors.text : colors.muted }}>
                  {value || new Date().toISOString().split("T")[0]}
                </Text>
                <Ionicons name="calendar" size={20} color={colors.muted} style={{ marginLeft: 8 }} />
              </Pressable>
            }
          />
        </View>
      </View>
    );
  }

  // For native
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Pressable
        style={styles.input}
        onPress={() => setShow(true)}
      >
        <Text style={{ color: value ? colors.text : colors.muted }}>
          {value || new Date().toISOString().split("T")[0]}
        </Text>
        <Ionicons name="calendar" size={20} color={colors.muted} style={{ marginLeft: 8 }} />
      </Pressable>
      {show && DateTimePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onChangeDate}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 4,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    height: 44,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  webPickerWrapper: {
    flex: 1,
  },
});
