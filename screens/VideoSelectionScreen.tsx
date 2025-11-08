import React, { useState, useEffect } from "react";
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
import * as FileSystem from "expo-file-system";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

export default function VideoSelectionScreen() {
  const [videos, setVideos] = useState<string[]>([]);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [thumbLoading, setThumbLoading] = useState(false);
  const [videosReady, setVideosReady] = useState(false);
  const navigation = useNavigation();

  // subtle glow animation for ready state
  const glow = useSharedValue(0);
  useEffect(() => {
    if (videosReady) {
      glow.value = withRepeat(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else glow.value = 0;
  }, [videosReady]);
  const glowStyle = useAnimatedStyle(() => ({
    shadowColor: "#FFFFFF",
    shadowOpacity: glow.value * 0.8,
    shadowRadius: 10 + glow.value * 6,
  }));

  const handleSelectVideos = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please enable photo library access.");
      return;
    }

    try {
      setLoading(true);
      setVideosReady(false);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled && result.assets.length > 0) {
        const chosen = result.assets.slice(0, 2);
        const copiedUris: string[] = [];

        for (const asset of chosen) {
          const dest = FileSystem.cacheDirectory + asset.fileName;
          await FileSystem.copyAsync({ from: asset.uri, to: dest });
          copiedUris.push(dest);
        }

        setVideos(copiedUris);
        setThumbnails([]);
        setThumbLoading(true);

        Promise.all(
          copiedUris.map(async (uri) => {
            try {
              const { uri: thumb } = await VideoThumbnails.getThumbnailAsync(uri, {
                time: 800,
                quality: 0.5,
              });
              return thumb;
            } catch {
              return "";
            }
          })
        )
          .then((thumbs) => {
            setThumbnails(thumbs);
            setVideosReady(true);
          })
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
    if (thumbLoading) {
      Alert.alert("Please wait", "Thumbnails are still being generated.");
      return;
    }
    if (videos.length < 2 || !videos[0] || !videos[1]) {
      Alert.alert("Select 2 Videos", "Please select two valid runs to compare.");
      return;
    }

    navigation.navigate(
      "VideoCompare" as never,
      { video1: videos[0], video2: videos[1] } as never
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Ionicons name="film-outline" size={60} color="#FFFFFF" style={styles.icon} />
      <Text style={styles.title}>select your runs</Text>

      <TouchableOpacity style={styles.selectButton} onPress={handleSelectVideos} disabled={loading}>
        <Ionicons name="videocam" size={22} color="#fff" />
        <Text style={styles.buttonText}>
          {loading ? " loading…" : " select videos"}
        </Text>
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
                <Image source={{ uri: thumbnails[idx] }} style={styles.thumbnail} />
              ) : (
                <View style={styles.thumbnailPlaceholder} />
              )}
              <Text style={styles.label}>run {idx + 1}</Text>
            </View>
          ))
        )}
      </View>

      <Animated.View style={[styles.startButton, glowStyle]}>
        <TouchableOpacity
          onPress={handleStartComparison}
          disabled={!videosReady || videos.length < 2}
          style={{ flexDirection: "row", alignItems: "center" }}
        >
          {videosReady ? (
            <>
              <Ionicons name="checkmark-circle-outline" size={26} color="#FFFFFF" />
              <Text style={[styles.buttonText, { color: "#FFFFFF" }]}>
                {"  ready"}
              </Text>
            </>
          ) : thumbLoading ? (
            <>
              <ActivityIndicator size="small" color="#FFF" />
              <Text style={styles.buttonText}> loading…</Text>
            </>
          ) : (
            <>
              <Ionicons name="play" size={22} color="#fff" />
              <Text style={styles.buttonText}> start comparison</Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
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
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 30,
  },
});
