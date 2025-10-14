import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from "react-native";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import type { NavigationProp, RouteProp } from "@react-navigation/native";

interface Props {
  navigation: NavigationProp<any>;
  route: RouteProp<{ params: { video1: string; video2: string } }, "params">;
}

export default function VideoCompareScreen({ navigation, route }: Props) {
  const { video1, video2 } = route.params;
  const videoRef1 = useRef<Video>(null);
  const videoRef2 = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);
  const [ghostMode, setGhostMode] = useState(false);
  const [ghostOnTop, setGhostOnTop] = useState(true);
  const [panelVisible, setPanelVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const panelY = useSharedValue(200); // hidden by default
  const panelOpacity = useSharedValue(0);

  useEffect(() => {
    panelY.value = withSpring(panelVisible ? 0 : 200);
    panelOpacity.value = withTiming(panelVisible ? 1 : 0, { duration: 250 });
  }, [panelVisible]);

  const animatedPanelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: panelY.value }],
    opacity: panelOpacity.value,
  }));

  const togglePlayPause = async () => {
    if (!videoRef1.current || !videoRef2.current) return;
    if (isPlaying) {
      await videoRef1.current.pauseAsync();
      await videoRef2.current.pauseAsync();
      if (timerRef.current) clearInterval(timerRef.current);
    } else {
      await videoRef1.current.playAsync();
      await videoRef2.current.playAsync();
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    setIsPlaying((prev) => !prev);
  };

  const resetSession = () => {
    Alert.alert("Reset Session?", "Return to video selection?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: () => navigation.navigate("VideoSelection"),
      },
    ]);
  };

  const startOver = () => {
    Alert.alert("Start Over?", "Return to entry screen?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: () => navigation.navigate("Entry"),
      },
    ]);
  };

  const sharePlaceholder = () => {
    Alert.alert("Coming Soon", "Sharing/export will be added soon!");
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const { width } = Dimensions.get("window");

  return (
    <View style={styles.container}>
      {ghostMode ? (
        <View style={styles.ghostContainer}>
          <Video
            ref={videoRef1}
            source={{ uri: video1 }}
            style={[
              styles.videoOverlay,
              { opacity: ghostOnTop ? 1 : 0.4 },
            ]}
            resizeMode={ResizeMode.CONTAIN}
          />
          <Video
            ref={videoRef2}
            source={{ uri: video2 }}
            style={[
              styles.videoOverlay,
              { opacity: ghostOnTop ? 0.4 : 1 },
            ]}
            resizeMode={ResizeMode.CONTAIN}
          />
        </View>
      ) : (
        <View style={styles.videoRow}>
          <Video
            ref={videoRef1}
            source={{ uri: video1 }}
            style={styles.video}
            resizeMode={ResizeMode.CONTAIN}
          />
          <Video
            ref={videoRef2}
            source={{ uri: video2 }}
            style={styles.video}
            resizeMode={ResizeMode.CONTAIN}
          />
        </View>
      )}

      {showOverlay && <Text style={styles.overlay}>⏱ Elapsed: {elapsed}s</Text>}

      <View style={styles.controls}>
        <TouchableOpacity onPress={togglePlayPause} style={styles.controlButton}>
          <Ionicons name={isPlaying ? "pause" : "play"} size={28} color="#00FFF7" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowOverlay(!showOverlay)} style={styles.controlButton}>
          <Ionicons name={showOverlay ? "eye" : "eye-off"} size={28} color="#FF2975" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setPanelVisible(!panelVisible)} style={styles.controlButton}>
          <Ionicons name="options" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity onPress={resetSession} style={styles.controlButton}>
          <Ionicons name="refresh" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity onPress={sharePlaceholder} style={styles.controlButton}>
          <Ionicons name="share-social" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity onPress={startOver} style={styles.controlButton}>
          <Ionicons name="home" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Slide-up Ghost Mode Panel */}
      <Animated.View style={[styles.panel, animatedPanelStyle]}>
        <Text style={styles.panelTitle}>Ghost Mode Settings</Text>
        <View style={styles.panelRow}>
          <TouchableOpacity
            style={[styles.panelButton, ghostMode && styles.activeButton]}
            onPress={() => setGhostMode(!ghostMode)}
          >
            <Ionicons name="contrast" size={22} color={ghostMode ? "#0B0C10" : "#00FFF7"} />
            <Text style={[styles.panelButtonText, ghostMode && styles.activeText]}>
              {ghostMode ? "Ghost On" : "Ghost Off"}
            </Text>
          </TouchableOpacity>

          {ghostMode && (
            <TouchableOpacity
              style={styles.panelButton}
              onPress={() => setGhostOnTop(!ghostOnTop)}
            >
              <Ionicons name="swap-horizontal" size={22} color="#FF2975" />
              <Text style={styles.panelButtonText}>Swap Overlay</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0C10",
    justifyContent: "center",
    alignItems: "center",
  },
  videoRow: {
    flexDirection: "row",
    flex: 1,
    width: "100%",
  },
  video: {
    flex: 1,
    margin: 2,
  },
  ghostContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    position: "absolute",
    top: 40,
    fontSize: 20,
    fontWeight: "bold",
    color: "#00FFF7",
    textShadowColor: "#FF2975",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 6,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 20,
    backgroundColor: "rgba(11,12,16,0.85)",
    width: "100%",
  },
  controlButton: {
    marginHorizontal: 12,
  },
  panel: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 16,
    backgroundColor: "rgba(20, 20, 25, 0.92)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  panelTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  panelRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  panelButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "rgba(0,255,247,0.1)",
  },
  activeButton: {
    backgroundColor: "#00FFF7",
  },
  panelButtonText: {
    color: "#00FFF7",
    fontSize: 16,
    marginLeft: 8,
  },
  activeText: {
    color: "#0B0C10",
    fontWeight: "bold",
  },
});
