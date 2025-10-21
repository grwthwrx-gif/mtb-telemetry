// screens/VideoSelectionScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function VideoSelectionScreen() {
  const navigation = useNavigation();
  const [selectedVideos, setSelectedVideos] = useState<{ uri: string; name?: string }[]>([]);

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow access to your photo library.");
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled && result.assets?.length) {
        // Map to our shape
        const newVideos = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.fileName || asset.filename || "Video",
        }));
        setSelectedVideos((prev) => [...prev, ...newVideos]);
      }
    } catch (e) {
      console.warn("ImagePicker error", e);
      Alert.alert("Error", "Could not access the photo library.");
    }
  };

  const startComparison = () => {
    if (selectedVideos.length < 2) {
      Alert.alert("Select Two Videos", "Please select at least two videos to compare.");
      return;
    }
    // send the first two videos
    navigation.navigate("Compare Runs" as never, { videos: [selectedVideos[0], selectedVideos[1]] } as never);
  };

  const resetSelection = () => setSelectedVideos([]);

  return (
    <View style={styles.container}>
      {/* Top icon moved down so it is visible */}
      <View style={styles.topIconWrapper}>
        <Ionicons name="film-outline" size={56} color="#FFFFFF" />
      </View>

      <Text style={styles.title}>Select Your Run</Text>

      {/* Select button positioned ~38% down screen */}
      <View style={[styles.selectButtonWrapper, { top: SCREEN_HEIGHT * 0.38 }]}>
        <TouchableOpacity style={styles.selectButton} onPress={pickVideo}>
          <Ionicons name="videocam-outline" size={22} color="#FFFFFF" style={{ marginRight: 10 }} />
          <Text style={styles.selectButtonText}>Select Video(s)</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listArea}>
        {selectedVideos.length === 0 ? (
          <Text style={styles.placeholder}>No videos selected yet.</Text>
        ) : (
          <FlatList
            horizontal
            data={selectedVideos}
            keyExtractor={(_, idx) => String(idx)}
            renderItem={({ item }) => (
              <View style={styles.thumbWrap}>
                <Image source={{ uri: item.uri }} style={styles.thumbnail} />
                <Text style={styles.thumbLabel} numberOfLines={1}>
                  {item.name}
                </Text>
              </View>
            )}
            showsHorizontalScrollIndicator={false}
          />
        )}
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.smallButton} onPress={resetSelection}>
          <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.startButton, selectedVideos.length < 2 && { opacity: 0.45 }]}
          onPress={startComparison}
          disabled={selectedVideos.length < 2}
        >
          <Text style={styles.startButtonText}>Start Comparison</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const BUTTON_OPACITY_BG = "rgba(255,255,255,0.12)"; // white with opacity for buttons

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0C10",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  topIconWrapper: {
    marginTop: 40, // moved down so not obscured by notch/status
    marginBottom: 10,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  selectButtonWrapper: {
    position: "absolute",
    left: 20,
    right: 20,
    alignItems: "center",
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BUTTON_OPACITY_BG,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 12,
  },
  selectButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  listArea: {
    marginTop: SCREEN_HEIGHT * 0.38 + 80 - 140, // push content down visually; safe fallback
    width: "100%",
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: {
    color: "#AAAAAA",
  },
  thumbWrap: {
    marginRight: 12,
    alignItems: "center",
  },
  thumbnail: {
    width: 160,
    height: 96,
    borderRadius: 10,
    backgroundColor: "#111",
  },
  thumbLabel: {
    color: "#FFFFFF",
    marginTop: 6,
    width: 160,
    textAlign: "center",
    fontSize: 12,
  },
  actionRow: {
    position: "absolute",
    bottom: 36,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  smallButton: {
    backgroundColor: BUTTON_OPACITY_BG,
    padding: 12,
    borderRadius: 12,
  },
  startButton: {
    backgroundColor: BUTTON_OPACITY_BG,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 14,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
