import React, { useRef, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  Pressable,
  SafeAreaView,
} from "react-native";
import { Video } from "expo-av";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
} from "react-native-reanimated";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function VideoCompareScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { video1, video2, offset } = route.params as {
    video1: string;
    video2: string;
    offset: number;
  };

  const player1 = useRef<Video>(null);
  const player2 = useRef<Video>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [ghostMode, setGhostMode] = useState(false);
  const [swapGhost, setSwapGhost] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [pos1, setPos1] = useState(0);
  const [duration, setDuration] = useState(0);

  // Fade in/out animation
  const fade = useSharedValue(0);
  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
  }));

  // Control visibility animation
  const controlsOpacity = useSharedValue(1);
  const [controlsVisible, setControlsVisible] = useState(true);
  const animatedControlsStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
  }));

  useEffect(() => {
    fade.value = withDelay(100, withTiming(1, { duration: 700 }));
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(async () => {
        const s = await player1.current?.getStatusAsync();
        if (s?.positionMillis) setElapsed(s.positionMillis / 1000);
      }, 300);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => interval && clearInterval(interval);
  }, [isPlaying]);

  const onLoad = async () => {
    const s1 = await player1.current?.getStatusAsync();
    if (s1?.durationMillis) setDuration(s1.durationMillis / 1000);
  };

  const handlePlayPause = async () => {
    if (isPlaying) {
      await player1.current?.pauseAsync();
      await player2.current?.pauseAsync();
      setIsPlaying(false);
    } else {
      const s1 = await player1.current?.getStatusAsync();
      const s2 = await player2.current?.getStatusAsync();
      if (s1 && s2) {
        if (offset > 0) await player2.current?.setPositionAsync(offset * 1000);
        else if (offset < 0)
          await player1.current?.setPositionAsync(Math.abs(offset) * 1000);
      }
      await Promise.all([
        player1.current?.playAsync(),
        player2.current?.playAsync(),
      ]);
      setIsPlaying(true);
    }
    setControlsVisible(true);
    controlsOpacity.value = withTiming(1, { duration: 200 });
  };

  const handleRateChange = async (rate: number) => {
    setPlaybackRate(rate);
    await player1.current?.setRateAsync(rate, true);
    await player2.current?.setRateAsync(rate, true);
  };

  const handleScrub = async (v: number) => {
    await player1.current?.setPositionAsync(v * 1000);
    await player2.current?.setPositionAsync(v * 1000 + offset * 1000);
    setPos1(v);
  };

  const handleStep = async (delta: number) => {
    const newPos = Math.max(0, pos1 + delta);
    await handleScrub(newPos);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const handleToggleGhost = () => setGhostMode((p) => !p);
  const handleSwapGhost = () => setSwapGhost((p) => !p);

  const handleBack = async () => {
    await player1.current?.pauseAsync();
    await player2.current?.pauseAsync();
    setIsPlaying(false);
    fade.value = withTiming(0, { duration: 500 }, () => {
      runOnJS(navigation.goBack)();
    });
  };

  const handleTap = () => {
    setControlsVisible(true);
    controlsOpacity.value = withTiming(1, { duration: 200 });
    setTimeout(() => {
      controlsOpacity.value = withTiming(0, { duration: 600 });
      setControlsVisible(false);
    }, 3500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Pressable style={{ flex: 1, width: "100%" }} onPress={handleTap}>
        <Animated.View style={[{ flex: 1 }, fadeStyle]}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={handleBack}>
              <Ionicons name="chevron-back" size={26} color="#fff" />
            </TouchableOpacity>
            <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
          </View>

          {/* Videos */}
          {!ghostMode ? (
            <>
              <Video
                ref={player1}
                source={{ uri: video1 }}
                style={styles.videoTop}
                resizeMode="contain"
                onLoad={onLoad}
              />
              <Video
                ref={player2}
                source={{ uri: video2 }}
                style={styles.videoBottom}
                resizeMode="contain"
              />
            </>
          ) : (
            <>
              {swapGhost ? (
                <>
                  <Video
                    ref={player1}
                    source={{ uri: video1 }}
                    style={[styles.videoOverlay, { opacity: 0.4 }]}
                    resizeMode="contain"
                  />
                  <Video
                    ref={player2}
                    source={{ uri: video2 }}
                    style={styles.videoOverlay}
                    resizeMode="contain"
                  />
                </>
              ) : (
                <>
                  <Video
                    ref={player2}
                    source={{ uri: video2 }}
                    style={[styles.videoOverlay, { opacity: 0.4 }]}
                    resizeMode="contain"
                  />
                  <Video
                    ref={player1}
                    source={{ uri: video1 }}
                    style={styles.videoOverlay}
                    resizeMode="contain"
                  />
                </>
              )}
            </>
          )}

          {/* Elapsed Time */}
          <View style={styles.elapsedOverlay}>
            <Text style={styles.elapsedText}>{formatTime(elapsed)}</Text>
          </View>

          {/* Controls */}
          {controlsVisible && (
            <Animated.View
              style={[styles.controlsContainer, animatedControlsStyle]}
            >
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={duration}
                value={pos1}
                onValueChange={(v) => handleScrub(v)}
                minimumTrackTintColor="#fff"
                maximumTrackTintColor="#333"
                thumbTintColor="#fff"
              />

              <View style={styles.controlsRow}>
                <TouchableOpacity onPress={() => handleStep(-0.5)}>
                  <Ionicons name="play-back" size={28} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity onPress={handlePlayPause}>
                  <Ionicons
                    name={isPlaying ? "pause" : "play"}
                    size={40}
                    color="#fff"
                  />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleStep(0.5)}>
                  <Ionicons name="play-forward" size={28} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleRateChange(1)}>
                  <Text style={styles.rateText}>1×</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleRateChange(0.5)}>
                  <Text style={styles.rateText}>½×</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleRateChange(0.25)}>
                  <Text style={styles.rateText}>¼×</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.controlsRow}>
                <TouchableOpacity onPress={handleToggleGhost}>
                  <Ionicons
                    name="layers"
                    size={26}
                    color={ghostMode ? "#fff" : "rgba(255,255,255,0.5)"}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSwapGhost}>
                  <Ionicons name="swap-vertical" size={26} color="#fff" />
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        </Animated.View>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  topBar: {
    position: "absolute",
    top: 10,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  videoTop: {
    width: "100%",
    height: SCREEN_HEIGHT * 0.45,
    backgroundColor: "#111",
  },
  videoBottom: {
    width: "100%",
    height: SCREEN_HEIGHT * 0.45,
    backgroundColor: "#111",
  },
  videoOverlay: {
    position: "absolute",
    top: 0,
    width: "100%",
    height: "100%",
  },
  elapsedOverlay: {
    position: "absolute",
    top: 60,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  elapsedText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  controlsContainer: {
    position: "absolute",
    bottom: 30,
    width: "100%",
    alignItems: "center",
  },
  slider: {
    width: "85%",
    height: 40,
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 24,
    marginVertical: 10,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 30,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  rateText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
