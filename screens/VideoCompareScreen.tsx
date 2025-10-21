import React, { useRef, useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Animated } from "react-native";
import { Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";

export default function VideoCompareScreen() {
  const [video1Uri, setVideo1Uri] = useState<string | null>(null);
  const [video2Uri, setVideo2Uri] = useState<string | null>(null);
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [ghostTop, setGhostTop] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  const video1Ref = useRef<Video>(null);
  const video2Ref = useRef<Video>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current; // for smooth fade transitions

  const toggleGhostMode = () => {
    setIsGhostMode(!isGhostMode);
  };

  const toggleGhostPosition = () => {
    setGhostTop(!ghostTop);
  };

  const playPause = async () => {
    if (!video1Ref.current || !video2Ref.current) return;
    if (isPlaying) {
      await video1Ref.current.pauseAsync();
      await video2Ref.current.pauseAsync();
    } else {
      const [status1, status2] = await Promise.all([
        video1Ref.current.getStatusAsync(),
        video2Ref.current.getStatusAsync(),
      ]);

      const minDuration = Math.min(status1.durationMillis || 0, status2.durationMillis || 0);
      const minPosition = Math.min(status1.positionMillis || 0, status2.positionMillis || 0);
      const offset = Math.abs(status1.positionMillis - status2.positionMillis);

      // Align start points for sync
      await Promise.all([
        video1Ref.current.setPositionAsync(minPosition),
        video2Ref.current.setPositionAsync(minPosition + offset),
      ]);

      await Promise.all([
        video1Ref.current.playAsync(),
        video2Ref.current.playAsync(),
      ]);
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isGhostMode ? 0.6 : 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [isGhostMode]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerIcon}>
        <Ionicons name="analytics-outline" size={30} color="#FFFFFF" />
      </View>

      {!video1Uri || !video2Uri ? (
        <View style={styles.centerContent}>
          <Text style={styles.infoText}>
            Please select two videos to begin comparison
          </Text>
          <TouchableOpacity style={styles.selectButton}>
            <Text style={styles.buttonText}>Select Videos</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.videoContainer}>
          {!isGhostMode ? (
            <>
              <Video
                ref={video1Ref}
                source={{ uri: video1Uri }}
                style={styles.videoHalf}
                resizeMode="cover"
              />
              <Video
                ref={video2Ref}
                source={{ uri: video2Uri }}
                style={styles.videoHalf}
                resizeMode="cover"
              />
            </>
          ) : (
            <View style={styles.overlayContainer}>
              {ghostTop ? (
                <>
                  <Animated.View style={[styles.ghostVideo, { opacity: fadeAnim }]}>
                    <Video
                      ref={video1Ref}
                      source={{ uri: video1Uri }}
                      style={styles.fullVideo}
                      resizeMode="cover"
                    />
                  </Animated.View>
                  <Video
                    ref={video2Ref}
                    source={{ uri: video2Uri }}
                    style={styles.fullVideo}
                    resizeMode="cover"
                  />
                </>
              ) : (
                <>
                  <Animated.View style={[styles.ghostVideo, { opacity: fadeAnim }]}>
                    <Video
                      ref={video2Ref}
                      source={{ uri: video2Uri }}
                      style={styles.fullVideo}
                      resizeMode="cover"
                    />
                  </Animated.View>
                  <Video
                    ref={video1Ref}
                    source={{ uri: video1Uri }}
                    style={styles.fullVideo}
                    resizeMode="cover"
                  />
                </>
              )}
            </View>
          )}
        </View>
      )}

      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.iconButton} onPress={playPause}>
          <Ionicons name={isPlaying ? "pause" : "play"} size={28} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={toggleGhostMode}>
          <Ionicons
            name={isGhostMode ? "layers" : "layers-outline"}
            size={28}
            color="#FFF"
          />
        </TouchableOpacity>

        {isGhostMode && (
          <TouchableOpacity style={styles.iconButton} onPress={toggleGhostPosition}>
            <Ionicons
              name="swap-vertical-outline"
              size={28}
              color="#FFF"
            />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0C10",
    alignItems: "center",
    justifyContent: "center",
  },
  headerIcon: {
    position: "absolute",
    top: 60,
    left: "50%",
    transform: [{ translateX: -15 }],
  },
  centerContent: {
    alignItems: "center",
    marginTop: "38%",
  },
  infoText: {
    color: "#FFF",
    fontSize: 16,
    marginBottom: 20,
  },
  selectButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 10,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
  },
  videoContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  videoHalf: {
    width: "50%",
    height: "100%",
  },
  overlayContainer: {
    flex: 1,
    width: "100%",
    position: "relative",
  },
  fullVideo: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  ghostVideo: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  controlsContainer: {
    position: "absolute",
    bottom: 90,
    flexDirection: "row",
    justifyContent: "space-around",
    width: "60%",
  },
  iconButton: {
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: 14,
    borderRadius: 50,
  },
});
