import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import * as VideoThumbnails from "expo-video-thumbnails";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

export default function VideoSelectionScreen() {
  const [video1, setVideo1] = useState<string | null>(null);
  const [video2, setVideo2] = useState<string | null>(null);
  const [thumbnail1, setThumbnail1] = useState<string | null>(null);
  const [thumbnail2, setThumbnail2] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleSelectVideos = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Permission to access camera roll is required!");
      return;
    }

    try {
      setLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        const selected = result.assets.slice(0, 2);

        // Handle first video
        const uri1 = selected[0]?.uri || null;
        const uri2 = selected[1]?.uri || null;

        setVideo1(uri1);
        setVideo2(uri2);

        if (uri1) {
          const { uri: thumb1 } = await VideoThumbnails.getThumbnailAsync(uri1, { time: 500 });
          setThumbnail1(thumb1);
        }

        if (uri2) {
          const { uri: thumb2 } = await VideoThumbnails.getThumbnailAsync(uri2, { time: 500 });
          setThumbnail2(thumb2);
        }
      }
    } catch (error) {
      console.error(error);
      alert("Error selecting videos.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartComparison = () => {
    if (video1 && video2) {
      navigation.navigate("VideoCompare" as never, { video1, video2 } as never);
    } else {
      alert("Please select two videos first!");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Ionicons name="film-outline" size={60} color="#FFFFFF" style={styles.icon} />
      <Text style={styles.title}>Select Your Runs</Text>

      <TouchableOpacity style={styles.selectButton} onPress={handleSelectVideos}>
        <Text style={styles.buttonText}>Select Videos</Text>
      </TouchableOpacity>

      <View style={styles.videoContainer}>
        {loading ? (
          <ActivityIndicator color="#fff" size="large" />
        ) : (
          <>
            {thumbnail1 ? <Image source={{ uri: thumbnail1 }} style={styles.thumbnail} /> : <View style={styles.thumbnailPlaceholder} />}
            <Text style={styles.label}>Run 1</Text>
            {thumbnail2 ? <Image source={{ uri: thumbnail2 }} style={styles.thumbnail} /> : <View style={styles.thumbnailPlaceholder} />}
            <Text style={styles.label}>Run 2</Text>
          </>
        )}
      </View>

      <TouchableOpacity
        style={[styles.startButton, !(video1 && video2) && { opacity: 0.5 }]}
        onPress={handleStartComparison}
        disabled={!(video1 && video2)}
      >
        <Text style={styles.buttonText}>Start Comparison</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: "#0B0C10",
    paddingTop: "15%",
  },
  icon: {
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 20,
  },
  selectButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginBottom: 30,
  },
  startButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 15,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 30,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  videoContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnail: {
    width: 280,
    height: 160,
    borderRadius: 12,
    marginVertical: 8,
  },
  thumbnailPlaceholder: {
    width: 280,
    height: 160,
    borderRadius: 12,
    backgroundColor: "#222",
    marginVertical: 8,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 14,
    marginBottom: 8,
  },
});
