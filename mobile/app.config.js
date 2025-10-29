export default {
  expo: {
    name: "Giewellzon Mobile",
    slug: "giewellzon-mobile",
    version: "1.0.0",
    orientation: "portrait",
    scheme: "giewellzon",
    userInterfaceStyle: "light",
    // Link to your actual icon file
    icon: "./assets/complogo.jpg",
    splash: {
      // Link to your actual splash image file
      image: "./assets/complogo.jpg",
      resizeMode: "contain",
      backgroundColor: "#FFFFFF",
    },
    // Link to your actual adaptive icon file
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/complogo.jpg",
        backgroundColor: "#FFFFFF",
      },
      package: "com.yourcompany.giewellzonmobile", // Change if needed
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.yourcompany.giewellzonmobile", // Change if needed
    },
    web: {
      // Link to your actual favicon file
      favicon: "./assets/complogo.jpg",
    },
    extra: {
      // Use EXPO_PUBLIC_API_BASE from .env, fallback to Render URL
      apiBase:
        process.env.EXPO_PUBLIC_API_BASE ||
        "https://pmas-ws.onrender.com/api",
    },
    plugins: [
      // Add other plugins if needed, e.g., expo-font
    ],
  },
};