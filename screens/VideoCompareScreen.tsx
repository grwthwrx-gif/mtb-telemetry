import React, { useRef, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import Slider from "@react-native-community/slider";
import { Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [lastTimestamp, setLastTimestamp] = useState<number | null>(null);
  const [ghostTop, setGhostTop] = useState<"first" | "second">("first");

  const overlayVisible = useSharedValue(1);
  const ghost = useSharedValue(0);
  const video1Y = useSharedValue(0);
  const video2Y = useSharedValue(SCREEN_HEIGHT / 2);
  const videoOpacity1 = useSharedValue(1);
  const videoOpacity2 = useSharedValue(1);
  const spin = useSharedValue(0);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const handlePsynkPlay = async () => {
    try {
      setStatusText("psynking …");
      setElapsed(0);
      setLastTimestamp(null);
      spin.value = withRepeat(withTiming(1, { duration: 1200 }), -1, false);

      await player1.current?.setPositionAsync(0);
      await player2.current?.setPositionAsync(0);
      if (offset > 0) await player2.current?.setPositionAsync(offset * 1000);
      else if (offset < 0)
        await player1.current?.setPositionAsync(Math.abs(offset) * 1000);

      await Promise.all([
        player1.current?.playAsync(),
        player2.current?.playAsync(),
      ]);
      setIsPlaying(true);

      setTimeout(() => {
        spin.value = 0;
        setStatusText("psynked");
        setTimeout(() => setStatusText("psynk & play"), 2500);
      }, 1800);
    } catch (e) {
      console.error(e);
      spin.value = 0;
      setStatusText("error ⚠️");
    }
  };

  const toggleGhost = () => {
    const next = ghost.value === 0 ? 1 : 0;
    ghost.value = withTiming(next, { duration: 500 });
    video1Y.value = withTiming(0, { duration: 500 });
    video2Y.value = withTiming(next === 1 ? 0 : SCREEN_HEIGHT / 2, {
      duration: 500,
    });

    if (next === 1) {
      // entering ghost mode
      if (ghostTop === "first") {
        videoOpacity1.value = withTiming(1, { duration: 400 });
        videoOpacity2.value = withTiming(0.4, { duration: 400 });
      } else {
        videoOpacity1.value = withTiming(0.4, { duration: 400 });
        videoOpacity2.value = withTiming(1, { duration: 400 });
      }
    } else {
      // leaving ghost mode
      videoOpacity1.value = withTiming(1, { duration: 400 });
      videoOpacity2.value = withTiming(1, { duration: 400 });
    }
  };

  const swapGhostOrder = () => {
    if (ghost.value === 1) {
      setGhostTop((prev) => (prev === "first" ? "second" : "first"));
      const newTop = ghostTop === "first" ? "second" : "first";
      if (newTop === "first") {
        videoOpacity1.value = withTiming(1, { duration: 400 });
        videoOpacity2.value = withTiming(0.4, { duration: 400 });
      } else {
        videoOpacity1.value = withTiming(0.4, { duration: 400 });
        videoOpacity2.value = withTiming(1, { duration: 400 });
      }
    }
  };

  const handlePlayPause = async () => {
    if (isPlaying) {
      await player1.current?.pauseAsync();
      await player2.current?.pauseAsync();
      setIsPlaying(false);
    } else {
      await player1.current?.playAsync();
      await player2.current?.playAsync();
      setIsPlaying(true);
    }
    showOverlay();
  };

  const handleStep = async (delta: number) => {
    const s1 = await player1.current?.getStatusAsync();
    const s2 = await player2.current?.getStatusAsync();
    if (s1?.positionMillis && s2?.positionMillis) {
      const newPos1 = Math.max(0, s1.positionMillis + delta * 1000);
      const newPos2 = Math.max(0, s2.positionMillis + delta * 1000);
      await player1.current?.setPositionAsync(newPos1);
      await player2.current?.setPositionAsync(newPos2);
    }
    showOverlay();
  };

  const toggleSpeed = async (rate: number) => {
    await player1.current?.setRateAsync(rate, true);
    await player2.current?.setRateAsync(rate, true);
    setPlaybackRate(rate);
    showOverlay();
  };

  const showOverlay = () => {
    overlayVisible.value = withTiming(1, { duration: 250 });
    setTimeout(() => {
      overlayVisible.value = withTiming(0, { duration: 400 });
    }, 3000);
  };

  // Elapsed timer synced to playback & rate
  useEffect(() => {
    let frame: number;
    const updateElapsed = (timestamp: number) => {
      if (isPlaying) {
        if (lastTimestamp != null) {
          const delta = (timestamp - lastTimestamp) / 1000;
          setElapsed((prev) => prev + delta * playbackRate);
        }
        setLastTimestamp(timestamp);
      } else setLastTimestamp(null);
      frame = requestAnimationFrame(updateElapsed);
    };
    frame = requestAnimationFrame(updateElapsed);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, playbackRate, lastTimestamp]);

  useEffect(() => {
    return () => {
      player1.current?.pauseAsync();
      player2.current?.pauseAsync();
    };
  }, []);

  const animatedStyle1 = useAnimatedStyle(() => ({
    transform: [{ translateY: video1Y.value }],
    opacity: videoOpacity1.value,
  }));
  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [{ translateY: video2Y.value }],
    opacity: videoOpacity2.value,
  }));
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayVisible.value,
  }));

  return (
    <TouchableWithoutFeedback onPress={showOverlay}>
      <View style={styles.container}>
        <View style={styles.videoArea}>
          <Animated.View style={[styles.videoWrapper, animatedStyle1]}>
            <Video
              ref={player1}
              source={{ uri: video1 }}
              style={styles.video}
              resizeMode="cover"
              useNativeControls={false}
            />
          </Animated.View>
          <Animated.View style={[styles.videoWrapper, animatedStyle2]}>
            <Video
              ref={player2}
              source={{ uri: video2 }}
              style={styles.video}
              resizeMode="cover"
              useNativeControls={false}
            />
          </Animated.View>

          <View style={styles.elapsedOverlay}>
            <Text style={styles.elapsedText}>{formatTime(elapsed)}</Text>
          </View>

          <Animated.View
            style={[styles.playbackOverlay, overlayStyle]}
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(300)}
          >
            <TouchableOpacity
              onPress={() => handleStep(-0.5)}
              style={styles.overlayButton}
            >
              <Ionicons name="play-back-outline" size={30} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePlayPause} style={styles.overlayButton}>
              <Ionicons
                name={isPlaying ? "pause-circle-outline" : "play-circle-outline"}
                size={50}
                color="#fff"
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleStep(0.5)}
              style={styles.overlayButton}
            >
              <Ionicons name="play-forward-outline" size={30} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => toggleSpeed(0.5)}
              style={[
                styles.overlayButton,
                playbackRate === 0.5 && styles.activeText,
              ]}
            >
              <Text style={styles.speedText}>½×</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => toggleSpeed(0.25)}
              style={[
                styles.overlayButton,
                playbackRate === 0.25 && styles.activeText,
              ]}
            >
              <Text style={styles.speedText}>¼×</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Controls Area */}
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
              minimumTrackTintColor="rgba(255,255,255,0.9)"
              maximumTrackTintColor="rgba(255,255,255,0.2)"
              thumbTintColor="#fff"
            />
          </View>

          <TouchableOpacity style={styles.psynkIconButton} onPress={handlePsynkPlay}>
            <Animated.View
              style={{
                transform: [{ rotate: `${spin.value * 360}deg` }],
              }}
            >
              <Ionicons
                name={
                  statusText.includes("psynking")
                    ? "sync-outline"
                    : statusText.includes("psynked")
                    ? "checkmark-outline"
                    : "play-circle-outline"
                }
                size={70}
                color="#FFFFFF"
                style={styles.psynkIcon}
              />
            </Animated.View>
            <Text style={styles.psynkLabel}>{statusText}</Text>
          </TouchableOpacity>

          <View style={styles.controls}>
            <TouchableOpacity onPress={toggleGhost} style={styles.button}>
              <Ionicons name="layers-outline" size={26} color="#fff" />
            </TouchableOpacity>
            {ghost.value === 1 && (
              <TouchableOpacity onPress={swapGhostOrder} style={styles.button}>
                <Ionicons name="swap-vertical-outline" size={26} color="#fff" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.button}
            >
              <Ionicons name="arrow-back-outline" size={26} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0C10", alignItems: "center" },
  videoArea: { width: "100%", height: SCREEN_HEIGHT, position: "relative" },
  videoWrapper: {
    position: "absolute",
    width: "100%",
    height: SCREEN_HEIGHT / 2,
  },
  video: { width: "100%", height: "100%" },
  elapsedOverlay: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  elapsedText: {
    fontFamily: "Orbitron",
    fontSize: 18,
    color: "white",
    textShadowColor: "rgba(255,255,255,0.8)",
    textShadowRadius: 6,
    letterSpacing: 1,
  },
  playbackOverlay: {
    position: "absolute",
    bottom: 100,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    width: "90%",
    borderRadius: 16,
    paddingVertical: 10,
  },
  overlayButton: { marginHorizontal: 8 },
  speedText: { color: "#fff", fontSize: 18, fontFamily: "Orbitron-Bold" },
  activeText: { textShadowColor: "#fff", textShadowRadius: 8 },
  controlsArea: {
    position: "absolute",
    bottom: 30,
    alignItems: "center",
    width: "100%",
  },
  sliderContainer: { width: "85%", marginBottom: 10 },
  sliderLabel: { color: "#fff", textAlign: "center", marginBottom: 4 },
  slider: { width: "100%", height: 40 },
  psynkIconButton: { alignItems: "center", marginTop: 10 },
  psynkIcon: {
    shadowColor: "#FFFFFF",
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  psynkLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "lowercase",
    marginTop: 4,
    letterSpacing: 0.5,
    fontFamily: "Orbitron-Bold",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "70%",
    marginTop: 8,
  },
  button: {
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: 10,
    borderRadius: 30,
  },
});
