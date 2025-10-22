import React, { useRef, useState, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Animated,
  PanResponder,
  Dimensions,
} from "react-native";
import { Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

export default function VideoCompareScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const videos = route.params?.videos || [];

  const videoRef1 = useRef<Video>(null);
  const videoRef2 = useRef<Video>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [opacityAnim] = useState(new Animated.Value(0.5));
  const [scrubPos, setScrubPos] = useState(0);
  const [duration, setDuration] = useState(1);

  // ───────────────────────────────
  // PLAYBACK CONTROL
  // ───────────────────────────────
  const togglePlay = async () => {
    if (!isPlaying) {
      await videoRef1.current?.playAsync();
      await videoRef2.current?.playAsync();
    } else {
      await videoRef1.current?.pauseAsync();
      await videoRef2.current?.pauseAsync();
    }
    setIsPlaying(!isPlaying);
  };

  const syncVideos = async () => {
    const status1 = await videoRef1.current?.getStatusAsync();
    const status2 = await videoRef2.current?.getStatusAsync();
    if (status1?.positionMillis && status2?.positionMillis) {
      setScrubPos(status1.positionMillis / (status1.durationMillis || 1));
      if (Math.abs(status1.positionMillis - status2.positionMillis) > 300) {
        await videoRef2.current?.setPositionAsync(status1.positionMillis);
      }
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(syncVideos, 250);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // ───────────────────────────────
  // GHOST BLEND SLIDER
  // ───────────────────────────────
  const panGhost = useRef(new Animated.Value(0)).current;
  const sliderWidth = width * 0.8;

  const ghostResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gestureState) => {
          let newX = Math.min(sliderWidth, Math.max(0, gestureState.dx + panGhost._value));
          panGhost.setValue(newX);
          opacityAnim.setValue(1 - newX / sliderWidth);
        },
      }),
    []
  );

  // ───────────────────────────────
  // SCRUBBER CONTROL
  // ───────────────────────────────
  const panScrub = useRef(new Animated.Value(0)).current;
  const scrubWidth = width * 0.8;

  const scrubResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: async () => {
          await videoRef1.current?.pauseAsync();
          await videoRef2.current?.pauseAsync();
        },
        onPanResponderMove: (_, gesture) => {
          let newX = Math.min(scrubWidth, Math.max(0, gesture.dx + panScrub._value));
          panScrub.setValue(newX);
          const ratio = newX / scrubWidth;
          setScrubPos(ratio);
        },
        onPanResponderRelease: async () => {
          const targetTime = scrubPos * duration;
          await videoRef1.current?.setPositionAsync(targetTime);
          await videoRef2.current?.setPositionAsync(targetTime);
          if (isPlaying) {
            await videoRef1.current?.playAsync();
            await videoRef2.current?.playAsync();
          }
        },
      }),
    [scrubPos, duration, isPlaying]
  );

  // ───────────────────────────────
  // VIDEO SETUP
  // ───────────────────────────────
  const onVideoLoad = async (status: any) => {
    if (status?.durationMillis) {
      setDuration(status.durationMillis);
    }
  };

  if (videos.length < 2) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please select two videos first.</Text>
        <TouchableOpacity onPress={() => navigation.navigate("VideoSelection")}>
          <Text style={styles.link}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ───────────────────────────────
  // UI
  // ───────────────────────────────
  return (
    <View style={styles.container}>
      {/* Top (Ghost) video */}
      <Animated.View style={[styles.videoWrapper, { opacity: opacityAnim }]}>
        <Video
          ref={videoRef1}
          source={{ uri: videos[0] }}
          style={styles.video}
          resizeMode="cover"
          shouldPlay={false}
          useNativeControls={false}
          onLoad={onVideoLoad}
        />
      </Animated.View>

      {/* Bottom video */}
      <Video
        ref={videoRef2}
        source={{ uri: videos[1] }}
        style={styles.video}
        resizeMode="cover"
        shouldPlay={false}
        useNativeControls={false}
        onLoad={onVideoLoad}
      />

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={togglePlay}>
          <Ionicons name={isPlaying ? "pause" : "play"} size={28} color="white" />
          <Text style={styles.buttonText}>{isPlaying ? "Pause" : "Play"}</Text>
        </TouchableOpacity>
      </View>

      {/* Ghost blend slider */}
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Ghost Blend</Text>
        <View style={styles.sliderTrack}>
          <Animated.View
            {...ghostResponder.panHandlers}
            style={[styles.sliderThumb, { transform: [{ translateX: panGhost }] }]}
          />
        </View>
      </View>

      {/* Timeline scrubber */}
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Timeline</Text>
        <View style={styles.sliderTrack}>
          <Animated.View
            {...scrubResponder.panHandlers}
            style={[
              styles.scrubThumb,
              { transform: [{ translateX: Animated.multiply(scrubPos, scrubWidth) }] },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0C10",
    alignItems: "center",
    justifyContent: "center",
  },
  videoWrapper: {
    width: "100%",
    flex: 1,
  },
  video: {
    width: "100%",
    height: "100%",
    backgroundColor: "#111",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingVertical: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  button: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonText: { color: "white", fontSize: 16 },
  errorText: { color: "#fff", fontSize: 18, marginBottom: 20 },
  link: { color: "#00FFF7", textDecorationLine: "underline" },
  sliderContainer: {
    width: "100%",
    alignItems: "center",
    paddingBottom: 25,
  },
  sliderLabel: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 8,
  },
  sliderTrack: {
    width: "80%",
    height: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  sliderThumb: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#00FFF7",
    top: -10,
  },
  scrubThumb: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FF2975",
    top: -6,
  },
});
