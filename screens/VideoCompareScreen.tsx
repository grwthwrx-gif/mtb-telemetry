// screens/VideoCompareScreen.tsx
import React, { useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";

export default function VideoCompareScreen() {
  const route = useRoute();
  const { videos } = route.params || { videos: [] };
  const playerRefs = useRef<(Video | null)[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlayback = async () => {
    if (!videos.length) return;
    const newState = !isPlaying;
    setIsPlaying(newState);
    for (let player of playerRefs.current) {
      if (player) {
        newState ? await player.playAsync() : await player.pauseAsync();
      }
    }
  };

  const screenWidth = Dimensions.get("window").width;
  const videoWidth = screenWidth * 0.9;
  const videoHeight = (videoWidth * 9) / 16;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="speedometer-outline" size={32} color="#FFFFFF" style={{ marginRight: 8 }} />
        <Text style={styles.title}>Compare Runs</Text>
      </View>

      {videos.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color="#FFFFFF" />
          <Text style={styles.emptyText}>No videos selected yet.</Text>
        </View>
      ) : (
        videos.map((video, index) => (
          <View key={index} style={styles.videoContainer}>
            <Video
              ref={(ref) => (playerRefs.current[index] = ref)}
              source={{ uri: video.uri }}
              style={{ width: videoWidth, height: videoHeight, borderRadius: 12 }}
              useNativeControls={true}
              resizeMode="contain"
            />
          </View>
        ))
      )}

      {videos.length > 0 && (
        <TouchableOpacity style={styles.playButton} onPress={togglePlayback}>
          <Ionicons
            name={isPlaying ? "pause-circle" : "play-circle"}
            size={40}
            color="#FFFFFF"
          />
          <Text style={styles.playText}>
            {isPlaying ? "Pause All" : "Play All"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0C10",
    alignItems: "center",
    paddingTop: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
  },
  videoContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  playButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF2975",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 14,
    marginBottom: 30,
  },
  playText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 10,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginTop: 10,
  },
});
