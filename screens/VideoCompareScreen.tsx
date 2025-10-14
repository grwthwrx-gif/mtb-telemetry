import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  PanResponder,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
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
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [ghostMode, setGhostMode] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 🎞️ Shared animation values
  const fadeGhost = useSharedValue(ghostMode ? 1 : 0);
  const panelY = useSharedValue(300);
  const fadeIntro = useSharedValue(0); // intro fade-in

  // 🔹 Fade animation styles
  const fadeGhostStyle = useAnimatedStyle(() => ({
    opacity: fadeGhost.value,
  }));

  const fadeIntroStyle = useAnimatedStyle(() => ({
    opacity: fadeIntro.value,
  }));

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: panelY.value }],
  }));

  // 🎬 Handle fade-in on mount
  useEffect(() => {
    fadeIntro.value = withDelay(200, withTiming(1, { duration: 800 }));
  }, []);

  const toggleGhostMode = () => {
    setGhostMode((prev) => !prev);
    fadeGhost.value = withTiming(ghostMode ? 0 : 1, { duration: 400 });
  };

  const togglePanel = () => {
    setPanelVisible((prev) => !prev);
    panelY.value = withTiming(panelVisible ? 300 : 0, { duration: 300 });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy < -30) togglePanel();
        if (gesture.dy > 30) togglePanel();
      },
    })
  ).current;

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

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.videoContainer, fadeIntroStyle]}>
        <Video
          ref={videoRef1}
          source={{ uri: video1 }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
        />

        {/* Overlay / Ghost video */}
        <Animated.View style={[StyleSheet.absoluteFill, fadeGhostStyle]}>
          <Video
            ref={videoRef2}
            source={{ uri: video2 }}
            style={styles.video}
            resizeMode={ResizeMode.CONTAIN}
          />
        </Animated.View>
      </Animated.View>

      {overlayVisible && (
        <Animated.Text style={[styles.overlayText, fadeIntroStyle]}>
          ⏱ Elapsed: {elapsed}s
        </Animated.Text>
      )}

      {!panelVisible && (
        <Animated.Text style={[styles.hintText, fadeIntroStyle]}>
          ⬆ Swipe up for controls
        </Animated.Text>
      )}

      {/* Slide-up Control Panel */}
      <Animated.View
        style={[styles.controlPanel, panelStyle]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          onPress={togglePlayPause}
          style={styles.controlButton}
        >
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={28}
            color="#00FFF7"
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleGhostMode} style={styles.controlButton}>
          <Ionicons
            name="layers-outline"
            size={28}
            color={ghostMode ? "#FF2975" : "#00FFF7"}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setOverlayVisible(!overlayVisible)}
          style={styles.controlButton}
        >
          <Ionicons
            name={overlayVisible ? "eye" : "eye-off"}
            size={28}
            color="#FF2975"
          />
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
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0C10",
  },
  videoContainer: {
    flex: 1,
    position: "relative",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  overlayText: {
    position: "absolute",
    top: 40,
    alignSelf: "center",
    fontSize: 18,
    fontWeight: "bold",
    color: "#00FFF7",
    textShadowColor: "#FF2975",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 6,
  },
  hintText: {
    position: "absolute",
    bottom: 80,
    alignSelf: "center",
    color: "#888",
    fontSize: 14,
  },
  controlPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingVertical: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  controlButton: {
    marginHorizontal: 10,
  },
});
