import React, { useRef, useEffect } from "react";
import {
  View,
  Image,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  Pressable,
  StatusBar,
  Text,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

// NOTE: Assuming your color palette is available (or you define it here)
const colors = {
  white: "#FFFFFF",
  text: "#333333",
};

// 💡 FOR ACTUAL PINCH-TO-ZOOM:
// The Image component below only displays the photo. For true pinch-to-zoom
// functionality, you would replace the Image component with a specialized
// component from a library like 'react-native-image-pan-zoom' or 'react-native-image-zoom-viewer'.
// You would need to install that library separately.

export default function PhotoViewerScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { photos, initialIndex, property } = route.params;
  const { width, height } = useWindowDimensions();
  const flatListRef = useRef(null);

  const renderItem = ({ item }) => (
    <View style={{ width, height: height }}>
      {/* This View serves as the container for the zoom component (e.g., ImageZoom).
        A simple Image component is used here for basic display.
      */}
      <Image
        source={{ uri: item }}
        style={styles.fullScreenImage}
        resizeMode="contain"
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Close Button and Title */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
        >
          <Ionicons name="close-circle" size={32} color={colors.white} />
        </Pressable>
        <Text style={styles.headerText} numberOfLines={1}>
          {property || "Photo Gallery"}
        </Text>
      </View>

      {/* Image Swiper */}
      <FlatList
        ref={flatListRef}
        data={photos}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item}_${index}`}
        horizontal
        pagingEnabled // Enables snap-to-page behavior for swiping
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={initialIndex}
        getItemLayout={(data, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  header: {
    position: "absolute",
    top: 0,
    paddingTop: StatusBar.currentHeight + 10 || 40,
    width: "100%",
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
  },
  closeButton: {
    paddingRight: 15,
  },
  headerText: {
    flex: 1,
    color: colors.white,
    fontSize: 18,
    fontWeight: "bold",
    // Text shadow for better contrast against the image
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  fullScreenImage: {
    width: "100%",
    height: "100%",
  },
});
