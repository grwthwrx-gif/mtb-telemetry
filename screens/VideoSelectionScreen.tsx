import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function VideoSelectionScreen() {
  const navigation = useNavigation<any>();
  const [videos, setVideos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsMultipleSelection: false,
        quality: 1,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const selectedUri = result.assets[0].uri;
        setVideos((prev) => (prev.length < 2 ? [...prev, selectedUri] : prev));
      }
    } catch (err) {
      console.log("Video pick error:", err);
    }
  };

  const startComparison = () => {
    if (videos.length === 2) {
      navigation.navigate("VideoCompare", { videos });
    }
  };

  return (
    <View style={styles.container}>
      <Ionicons name="videocam" size={64} color="white" style={styles.iconTop} />
      <Text style={styles.title}>Select Two Videos</Text>

      <TouchableOpacity style={styles.button} onPress={pickVideo} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>+ Select Video</Text>}
      </TouchableOpacity>

      <View style={styles.previewContainer}>
        {videos.map((uri, index) => (
          <Video
            key={index}
            source={{ uri }}
            style={styles.videoPreview}
            resizeMode="cover"
            useNativeControls
            shouldPlay={false}
          />
        ))}
      </View>

      <TouchableOpacity
        style={[styles.startButton, videos.length < 2 && { opacity: 0.4 }]}
        disabled={videos.length < 2}
        onPress={startComparison}
      >
        <Text style={styles.startButtonText}>Start Comparison</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0C10", alignItems: "center", justifyContent: "flex-start", paddingTop: 100 },
  title: { color: "white", fontSize: 22, marginVertical: 20 },
  iconTop: { marginBottom: 10 },
  button: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 30,
    marginBottom: 30,
  },
  buttonText: { color: "white", fontWeight: "600", fontSize: 16 },
  previewContainer: { flexDirection: "row", justifyContent: "center", gap: 10, marginBottom: 40 },
  videoPreview: { width: 140, height: 100, backgroundColor: "#111", borderRadius: 6 },
  startButton: { backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 8, paddingVertical: 16, paddingHorizontal: 40 },
  startButtonText: { color: "white", fontSize: 18, fontWeight: "bold" },
});
