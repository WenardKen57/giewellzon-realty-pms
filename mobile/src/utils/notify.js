import Toast from "react-native-toast-message";

export const notifySuccess = (message) => {
  Toast.show({
    type: "success",
    text1: "Success",
    text2: message,
    position: "bottom", // Changed to bottom for better visibility
    visibilityTime: 3000,
  });
};

export const notifyError = (message) => {
  Toast.show({
    type: "error",
    text1: "Error",
    text2: message || "An unexpected error occurred.", // Default message
    position: "bottom", // Changed to bottom
    visibilityTime: 4000,
  });
};

export const notifyInfo = (message) => {
  Toast.show({
    type: "info",
    text1: "Info",
    text2: message,
    position: "bottom", // Changed to bottom
    visibilityTime: 3000,
  });
};