import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as VideoThumbnails from "expo-video-thumbnails";
import { Video } from "expo-av";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function VideoSelectionScreen() {
  const navigation = useNavigation();
  const [videos, setVideos] = useState<string[]>([]);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncMode, setSyncMode] = useState(false);
  const [offset, setOffset] = useState(0);

  const player1 = useRef<Video>(null);
  const player2 = useRef<Video>(null);

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

        const thumbs: string[] = [];
        for (let uri of uris) {
          try {
            const { uri: thumb } = await VideoThumbnails.getThumbnailAsync(uri, {
              time: 800,
            });
            thumbs.push(thumb);
          } catch {
            thumbs.push("");
          }
        }
        setThumbnails(thumbs);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Unable to select videos.");
    } finally {
      setLoading(false);
    }
  };

  const handleSyncNext = () => {
    if (videos.length < 2) {
      Alert.alert("Select 2 Videos", "Please select two runs to compare.");
      return;
    }
    setSyncMode(true);
  };

  const handleConfirmSync = () => {
    navigation.navigate(
      "VideoCompare" as never,
      { video1: videos[0], video2: videos[1], offset } as never
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSyncMode(false)}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {}}>
          <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {!syncMode ? (
        <>
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

          {videos.length === 2 && (
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleSyncNext}
            >
              <Ionicons name="checkmark-circle" size={26} color="#fff" />
              <Text style={styles.buttonText}> sync runs</Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <>
          <Text style={styles.title}>sync your runs</Text>
          <View style={styles.videosStack}>
            <Video
              ref={player1}
              source={{ uri: videos[0] }}
              style={styles.videoHalf}
              useNativeControls
              resizeMode="contain"
            />
            <Video
              ref={player2}
              source={{ uri: videos[1] }}
              style={styles.videoHalf}
              useNativeControls
              resizeMode="contain"
            />
          </View>

          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>
              Psynk Offset: {offset.toFixed(2)}s
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={-3}
              maximumValue={3}
              step={0.1}
              value={offset}
              onValueChange={setOffset}
              minimumTrackTintColor="#fff"
              maximumTrackTintColor="#444"
              thumbTintColor="#fff"
            />
          </View>

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirmSync}
          >
            <Ionicons name="checkmark-circle" size={70} color="#fff" />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0C10",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 50,
  },
  header: {
    width: "90%",
    flexDirection: "row",
    justifyContent: "space-between",
    position: "absolute",
    top: 40,
    zIndex: 10,
  },
  icon: { marginBottom: 10, marginTop: 80 },
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
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textTransform: "lowercase",
  },
  videoContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  videoBlock: { alignItems: "center", marginVertical: 10 },
  thumbnail: { width: 280, height: 160, borderRadius: 12 },
  thumbnailPlaceholder: {
    width: 280,
    height: 160,
    borderRadius: 12,
    backgroundColor: "#222",
  },
  label: { color: "#FFFFFF", fontSize: 14, marginTop: 6 },
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
  videosStack: {
    width: "100%",
    alignItems: "center",
  },
  videoHalf: {
    width: "90%",
    height: SCREEN_HEIGHT * 0.3,
    borderRadius: 12,
    backgroundColor: "#111",
    marginVertical: 8,
  },
  sliderContainer: {
    width: "85%",
    marginTop: 10,
  },
  sliderLabel: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  confirmButton: {
    marginTop: 20,
  },
});
