import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as VideoThumbnails from "expo-video-thumbnails";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

export default function VideoSelectionScreen() {
  const [videos, setVideos] = useState<string[]>([]);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [thumbLoading, setThumbLoading] = useState(false);
  const navigation = useNavigation();

  const handleSelectVideos = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please enable photo library access.");
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
        const chosen = result.assets.slice(0, 2);
        const uris = chosen.map((item) => item.uri);
        setVideos(uris);
        setThumbnails([]);
        setThumbLoading(true);

        Promise.all(
          uris.map(async (uri) => {
            try {
              const { uri: thumb } = await VideoThumbnails.getThumbnailAsync(
                uri,
                { time: 800, quality: 0.5 }
              );
              return thumb;
            } catch {
              return "";
            }
          })
        )
          .then((thumbs) => setThumbnails(thumbs))
          .finally(() => setThumbLoading(false));
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Unable to select videos.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartComparison = () => {
    if (videos.length < 2) {
      Alert.alert("Select 2 Videos", "Please select two runs to compare.");
      return;
    }
    navigation.navigate(
      "VideoCompare" as never,
      { video1: videos[0], video2: videos[1] } as never
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Ionicons
        name="film-outline"
        size={60}
        color="#FFFFFF"
        style={styles.icon}
      />
      <Text style={styles.title}>select your runs</Text>

      <TouchableOpacity
        style={styles.selectButton}
        onPress={handleSelectVideos}
      >
        <Ionicons name="videocam" size={22} color="#fff" />
        <Text style={styles.buttonText}> select videos</Text>
      </TouchableOpacity>

      <View style={styles.videoContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#FFF" />
        ) : thumbLoading ? (
          <View style={{ alignItems: "center", marginTop: 10 }}>
            <ActivityIndicator size="small" color="#FFF" />
            <Text style={styles.loadingText}>generating thumbnails…</Text>
          </View>
        ) : (
          videos.map((uri, idx) => (
            <View key={idx} style={styles.videoBlock}>
              {thumbnails[idx] ? (
                <Image
                  source={{ uri: thumbnails[idx] }}
                  style={styles.thumbnail}
                />
              ) : (
                <View style={styles.thumbnailPlaceholder} />
              )}
              <Text style={styles.label}>run {idx + 1}</Text>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.startButton,
          videos.length < 2 && { opacity: 0.5 },
        ]}
        onPress={handleStartComparison}
        disabled={videos.length < 2}
      >
        <Ionicons name="play" size={20} color="#fff" />
        <Text style={styles.buttonText}> start comparison</Text>
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
  icon: { marginBottom: 10 },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 20,
    textTransform: "lowercase",
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginBottom: 30,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 30,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textTransform: "lowercase",
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 14,
    marginTop: 6,
    opacity: 0.8,
    textTransform: "lowercase",
  },
  videoContainer: { alignItems: "center", justifyContent: "center" },
  videoBlock: { alignItems: "center", marginVertical: 10 },
  thumbnail: { width: 280, height: 160, borderRadius: 12 },
  thumbnailPlaceholder: {
    width: 280,
    height: 160,
    borderRadius: 12,
    backgroundColor: "#222",
  },
  label: { color: "#FFFFFF", fontSize: 14, marginTop: 6 },
});
