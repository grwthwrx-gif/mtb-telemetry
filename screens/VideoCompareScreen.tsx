import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Alert,
} from "react-native";
import { Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";

export default function VideoCompareScreen({ route, navigation }) {
  const { videos = [] } = route.params || {};
  const [isGhostMode, setIsGhostMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRefs = [useRef(null), useRef(null)];
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Smooth fade when ghost mode toggles
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isGhostMode ? 1 : 0,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [isGhostMode]);

  const togglePlay = async () => {
    setIsPlaying(!isPlaying);
    for (const ref of videoRefs) {
      if (ref.current) {
        isPlaying ? await ref.current.pauseAsync() : await ref.current.playAsync();
      }
    }
  };

  const toggleGhost = () => {
    if (videos.length < 2) return Alert.alert("Select 2 videos first");
    setIsGhostMode(!isGhostMode);
  };

  const goBack = () => navigation.goBack();

  if (videos.length < 2) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Please select two videos first.</Text>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.playerArea}>
        {/* Base Video 1 */}
        <Video
          ref={videoRefs[0]}
          source={{ uri: videos[0].uri }}
          style={[styles.video]}
          resizeMode="contain"
          isLooping
          shouldPlay={isPlaying}
        />

        {/* Second Video Overlay with Fade */}
        <Animated.View style={[styles.overlayVideo, { opacity: fadeAnim }]}>
          <Video
            ref={videoRefs[1]}
            source={{ uri: videos[1].uri }}
            style={styles.video}
            resizeMode="contain"
            isLooping
            shouldPlay={isPlaying}
          />
        </Animated.View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={goBack}>
          <Ionicons name="arrow-back" size={30} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={togglePlay}>
          <Ionicons name={isPlaying ? "pause" : "play"} size={38} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleGhost}>
          <Ionicons name="layers-outline" size={30} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0C10",
    alignItems: "center",
    justifyContent: "center",
  },
  playerArea: {
    width: width,
    height: height * 0.8,
    justifyContent: "center",
    alignItems: "center",
  },
  video: {
    width: width * 0.9,
    height: height * 0.4,
    borderRadius: 10,
    backgroundColor: "#111",
  },
  overlayVideo: {
    position: "absolute",
    width: width * 0.9,
    height: height * 0.4,
    borderRadius: 10,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "80%",
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  text: {
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 10,
  },
  backButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    padding: 10,
  },
  backText: {
    color: "#fff",
  },
});
