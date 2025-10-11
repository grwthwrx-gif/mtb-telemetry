import React, { useState, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
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
  const [showOverlay, setShowOverlay] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

      {showOverlay && <Text style={styles.overlay}>⏱ Elapsed: {elapsed}s</Text>}

      <View style={styles.controls}>
        <TouchableOpacity onPress={togglePlayPause} style={styles.controlButton}>
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={28}
            color="#00FFF7"
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowOverlay(!showOverlay)}
          style={styles.controlButton}
        >
          <Ionicons
            name={showOverlay ? "eye" : "eye-off"}
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
      </View>
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
});
