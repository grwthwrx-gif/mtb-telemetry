// screens/VideoSelectionScreen.tsx
import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function VideoSelectionScreen() {
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const navigation = useNavigation();

  const pickVideo = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access photos is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setVideoUri(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top icon */}
      <Ionicons name="bicycle-outline" size={60} color="#FFFFFF" style={{ marginBottom: 20 }} />

      <Text style={styles.title}>Select Run</Text>

      <TouchableOpacity style={styles.selectButton} onPress={pickVideo}>
        <Ionicons name="videocam-outline" size={26} color="#FFFFFF" style={{ marginRight: 10 }} />
        <Text style={styles.selectButtonText}>Select from Library</Text>
      </TouchableOpacity>

      {videoUri ? (
        <Text style={styles.fileText}>✅ Video selected!</Text>
      ) : (
        <Text style={styles.fileText}>No video selected yet</Text>
      )}

      <TouchableOpacity
        style={[styles.compareButton, { opacity: videoUri ? 1 : 0.4 }]}
        onPress={() =>
          videoUri && navigation.navigate("VideoCompare" as never, { videoUri } as never)
        }
        disabled={!videoUri}
      >
        <Text style={styles.compareButtonText}>Start Comparison</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0C10",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontFamily: "Orbitron-Bold",
    fontSize: 28,
    color: "#FFFFFF",
    marginBottom: 40,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1C21",
    borderColor: "#00FFF7",
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 30,
  },
  selectButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Orbitron-Regular",
  },
  fileText: {
    color: "#AAAAAA",
    fontSize: 14,
    marginBottom: 30,
  },
  compareButton: {
    backgroundColor: "#FF2975",
    paddingVertical: 16,
    paddingHorizontal: 50,
    borderRadius: 14,
    shadowColor: "#FF2975",
    shadowOpacity: 0.8,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  compareButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Orbitron-Bold",
    textTransform: "uppercase",
  },
});
