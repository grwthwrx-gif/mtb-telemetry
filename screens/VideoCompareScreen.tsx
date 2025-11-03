import React, { useRef, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
} from "react-native";
import Slider from "@react-native-community/slider";
import { Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function VideoCompareScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { video1, video2 } = route.params as { video1: string; video2: string };

  const player1 = useRef<Video>(null);
  const player2 = useRef<Video>(null);

  const [offset, setOffset] = useState(0);
  const [statusText, setStatusText] = useState("psynk & play");

  const [elapsed, setElapsed] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const ghostMode = useSharedValue(0); // 0 = stacked, 1 = overlay
  const video1Y = useSharedValue(0);
  const video2Y = useSharedValue(SCREEN_HEIGHT / 2);
  const videoOpacity2 = useSharedValue(1);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setTimerActive(false);
  };

  const handlePsynkPlay = async () => {
    try {
      setStatusText("psynking …");
      clearTimer();
      setElapsed(0);

      await player1.current?.setPositionAsync(0);
      await player2.current?.setPositionAsync(0);
      if (offset > 0)
        await player2.current?.setPositionAsync(offset * 1000);
      else if (offset < 0)
        await player1.current?.setPositionAsync(Math.abs(offset) * 1000);

      await Promise.all([
        player1.current?.playAsync(),
        player2.current?.playAsync(),
      ]);

      setTimerActive(true);
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        setElapsed((Date.now() - startTime) / 1000);
      }, 250);

      setStatusText("psynked ✅");
      setTimeout(() => setStatusText("psynk & play"), 2500);
    } catch (e) {
      console.error(e);
      setStatusText("error ⚠️");
      clearTimer();
    }
  };

  const toggleGhost = () => {
    const newValue = ghostMode.value === 0 ? 1 : 0;
    ghostMode.value = withTiming(newValue, { duration: 500 });
    video1Y.value = withTiming(newValue === 1 ? 0 : 0, { duration: 500 });
    video2Y.value = withTiming(newValue === 1 ? 0 : SCREEN_HEIGHT / 2, {
      duration: 500,
    });
    videoOpacity2.value = withTiming(newValue === 1 ? 0.4 : 1, { duration: 500 });
  };

  const animatedStyle1 = useAnimatedStyle(() => ({
    transform: [{ translateY: video1Y.value }],
  }));
  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [{ translateY: video2Y.value }],
    opacity: videoOpacity2.value,
  }));

  useEffect(() => {
    return () => {
      clearTimer();
      player1.current?.pauseAsync();
      player2.current?.pauseAsync();
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.videoArea}>
        <Animated.View style={[styles.videoWrapper, animatedStyle1]}>
          <Video
            ref={player1}
            source={{ uri: video1 }}
            style={styles.video}
            resizeMode="cover"
            useNativeControls
          />
        </Animated.View>

        <Animated.View style={[styles.videoWrapper, animatedStyle2]}>
          <Video
            ref={player2}
            source={{ uri: video2 }}
            style={styles.video}
            resizeMode="cover"
            useNativeControls
          />
        </Animated.View>

        {timerActive && (
          <Animated.View
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(300)}
            style={styles.elapsedOverlay}
          >
            <Text style={styles.elapsedText}>{formatTime(elapsed)}</Text>
          </Animated.View>
        )}
      </View>

      <View style={styles.controlsArea}>
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderLabel}>
            psynk offset: {offset.toFixed(2)} s
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

        <TouchableOpacity style={styles.psynkButton} onPress={handlePsynkPlay}>
          <Text style={styles.psynkText}>{statusText}</Text>
        </TouchableOpacity>

        <View style={styles.controls}>
          <TouchableOpacity onPress={toggleGhost} style={styles.button}>
            <Ionicons
              name={ghostMode.value === 1 ? "layers" : "layers-outline"}
              size={26}
              color="#fff"
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              clearTimer();
              navigation.goBack();
            }}
            style={styles.button}
          >
            <Ionicons name="arrow-back-outline" size={26} color="#fff" />
          </TouchableOpacity>
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
    justifyContent: "flex-start",
  },
  videoArea: {
    width: "100%",
    height: SCREEN_HEIGHT,
    position: "relative",
    overflow: "hidden",
  },
  videoWrapper: {
    position: "absolute",
    width: "100%",
    height: SCREEN_HEIGHT / 2,
  },
  video: {
    width: "100%",
    height: "100%",
  },
  elapsedOverlay: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  elapsedText: {
    fontFamily: "Orbitron",
    fontSize: 18,
    color: "white",
    textShadowColor: "rgba(255,255,255,0.8)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
    letterSpacing: 1,
  },
  controlsArea: {
    position: "absolute",
    bottom: 30,
    alignItems: "center",
    width: "100%",
  },
  sliderContainer: { width: "85%", marginBottom: 10 },
  sliderLabel: { color: "#fff", textAlign: "center", marginBottom: 4 },
  slider: { width: "100%", height: 40 },
  psynkButton: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginVertical: 10,
  },
  psynkText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textTransform: "lowercase",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "60%",
    marginTop: 5,
  },
  button: {
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: 10,
    borderRadius: 30,
  },
});
