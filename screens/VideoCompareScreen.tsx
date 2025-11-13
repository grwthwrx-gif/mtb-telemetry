import React, { useRef, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  Pressable,
  SafeAreaView,
  ActivityIndicator,
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
  const [pos1, setPos1] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loadingCount, setLoadingCount] = useState(2); // wait until both onLoad fire

  // Fade + controls visibility
  const fade = useSharedValue(0);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.value }));
  const controlsOpacity = useSharedValue(1);
  const [controlsVisible, setControlsVisible] = useState(true);
  const animatedControlsStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
  }));

  useEffect(() => {
    fade.value = withDelay(100, withTiming(1, { duration: 700 }));
  }, []);

  // elapsed updater tied to player1
  useEffect(() => {
    let id: NodeJS.Timeout | null = null;
    if (isPlaying) {
      id = setInterval(async () => {
        const s = await player1.current?.getStatusAsync();
        if (s?.positionMillis != null) {
          const sec = s.positionMillis / 1000;
          setElapsed(sec);
          setPos1(sec);
        }
      }, 120);
    }
    return () => id && clearInterval(id);
  }, [isPlaying]);

  const onLoad1 = async () => {
    const s = await player1.current?.getStatusAsync();
    if (s?.durationMillis) setDuration(s.durationMillis / 1000);
    setLoadingCount((c) => Math.max(0, c - 1));
  };
  const onLoad2 = async () => {
    setLoadingCount((c) => Math.max(0, c - 1));
  };

  // When either finishes, reset to start & pause (no auto-replay)
  const onStatusCheckEnd = async (s: any) => {
    if (s?.didJustFinish) {
      await player1.current?.setPositionAsync(0);
      await player2.current?.setPositionAsync(Math.max(0, offset) * 1000);
      setIsPlaying(false);
    }
  };

  const applyOffsetForStart = async () => {
    if (offset > 0) await player2.current?.setPositionAsync(offset * 1000);
    else if (offset < 0) await player1.current?.setPositionAsync(Math.abs(offset) * 1000);
  };

  const handlePlayPause = async () => {
    if (isPlaying) {
      await player1.current?.pauseAsync();
      await player2.current?.pauseAsync();
      setIsPlaying(false);
    } else {
      // explicit: don't autoplay on load; only on button press
      await applyOffsetForStart();
      await Promise.all([player1.current?.playAsync(), player2.current?.playAsync()]);
      setIsPlaying(true);
    }
    revealControls();
  };

  const handleScrub = async (v: number) => {
    await player1.current?.setPositionAsync(v * 1000);
    await player2.current?.setPositionAsync(v * 1000 + offset * 1000);
    setPos1(v);
    revealControls();
  };

  const handleStep = async (delta: number) => {
    const newPos = Math.max(0, pos1 + delta);
    await handleScrub(newPos);
  };

  const handleRateChange = async (rate: number) => {
    await player1.current?.setRateAsync(rate, true);
    await player2.current?.setRateAsync(rate, true);
    revealControls();
  };

  const formatElapsedFancy = (s: number) => {
    const m = Math.floor(s / 60);
    const whole = Math.floor(s % 60);
    const frac = s - Math.floor(s);
    const hundred = Math.floor(frac * 100) % 10; // hundredths digit
    const tenth = Math.floor((frac * 10) % 10); // tenths digit
    // Order requested: minutes : seconds : tenths : hundredths
    return `${m}:${whole < 10 ? "0" : ""}${whole}:${tenth}${hundred}`;
  };

  const revealControls = () => {
    setControlsVisible(true);
    controlsOpacity.value = withTiming(1, { duration: 180 });
    setTimeout(() => {
      controlsOpacity.value = withTiming(0, { duration: 600 });
      setControlsVisible(false);
    }, 3500);
  };

  const handleTap = () => revealControls();

  const handleBack = async () => {
    await player1.current?.pauseAsync();
    await player2.current?.pauseAsync();
    setIsPlaying(false);
    fade.value = withTiming(0, { duration: 500 }, () => runOnJS(navigation.goBack)());
  };

  // ghost controls in bar
  const toggleGhost = () => {
    setGhostMode((g) => !g);
    revealControls();
  };
  const swapGhostLayer = () => {
    setSwapGhost((s) => !s);
    revealControls();
  };

  const restart = async () => {
    await player1.current?.pauseAsync();
    await player2.current?.pauseAsync();
    setIsPlaying(false);
    fade.value = withTiming(0, { duration: 400 }, () => runOnJS(navigation.goBack)());
  };

  const isLoading = loadingCount > 0;

  return (
    <SafeAreaView style={styles.container}>
      <Pressable style={{ flex: 1, width: "100%" }} onPress={handleTap}>
        <Animated.View style={[{ flex: 1 }, fadeStyle]}>
          {/* Top bar (lowered) */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={handleBack}>
              <Ionicons name="chevron-back" size={26} color="#fff" />
            </TouchableOpacity>

            {/* Cast placeholder (disabled for MVP) */}
            <Ionicons name="radio-outline" size={22} color="rgba(255,255,255,0.35)" />
          </View>

          {/* Videos: stacked or ghost */}
          {!ghostMode ? (
            <>
              <Video
                ref={player1}
                source={{ uri: video1 }}
                style={styles.videoTop}
                resizeMode="contain"
                onLoad={onLoad1}
                onPlaybackStatusUpdate={onStatusCheckEnd}
              />
              {/* central elapsed timer between stacked videos */}
              <View style={styles.elapsedCenter}>
                <Text style={styles.elapsedText}>{formatElapsedFancy(elapsed)}</Text>
              </View>
              <Video
                ref={player2}
                source={{ uri: video2 }}
                style={styles.videoBottom}
                resizeMode="contain"
                onLoad={onLoad2}
                onPlaybackStatusUpdate={onStatusCheckEnd}
              />
            </>
          ) : (
            <>
              {/* Ghost defaults to transparent overlay ON TOP; swap keeps transparency with new top */}
              {swapGhost ? (
                <>
                  <Video
                    ref={player1}
                    source={{ uri: video1 }}
                    style={styles.videoOverlay}
                    resizeMode="contain"
                    onLoad={onLoad1}
                    onPlaybackStatusUpdate={onStatusCheckEnd}
                  />
                  <Video
                    ref={player2}
                    source={{ uri: video2 }}
                    style={[styles.videoOverlay, { opacity: 0.4 }]}
                    resizeMode="contain"
                    onLoad={onLoad2}
                    onPlaybackStatusUpdate={onStatusCheckEnd}
                  />
                </>
              ) : (
                <>
                  <Video
                    ref={player2}
                    source={{ uri: video2 }}
                    style={[styles.videoOverlay, { opacity: 0.4 }]}
                    resizeMode="contain"
                    onLoad={onLoad2}
                    onPlaybackStatusUpdate={onStatusCheckEnd}
                  />
                  <Video
                    ref={player1}
                    source={{ uri: video1 }}
                    style={styles.videoOverlay}
                    resizeMode="contain"
                    onLoad={onLoad1}
                    onPlaybackStatusUpdate={onStatusCheckEnd}
                  />
                </>
              )}
              {/* elapsed below composite center */}
              <View style={styles.elapsedBelow}>
                <Text style={styles.elapsedText}>{formatElapsedFancy(elapsed)}</Text>
              </View>
            </>
          )}

          {/* Single, non-overlapping controls block at bottom */}
          {controlsVisible && (
            <Animated.View style={[styles.controls, animatedControlsStyle]}>
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

              <View style={styles.row}>
                <TouchableOpacity onPress={() => handleStep(-0.5)}>
                  <Ionicons name="play-back" size={26} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity onPress={handlePlayPause}>
                  <Ionicons name={isPlaying ? "pause" : "play"} size={36} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleStep(0.5)}>
                  <Ionicons name="play-forward" size={26} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleRateChange(1)}>
                  <Text style={styles.rate}>1×</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRateChange(0.5)}>
                  <Text style={styles.rate}>½×</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRateChange(0.25)}>
                  <Text style={styles.rate}>¼×</Text>
                </TouchableOpacity>

                <View style={{ width: 10 }} />

                <TouchableOpacity onPress={toggleGhost}>
                  <Ionicons
                    name="layers"
                    size={24}
                    color={ghostMode ? "#fff" : "rgba(255,255,255,0.6)"}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={swapGhostLayer}>
                  <Ionicons name="swap-vertical" size={24} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity onPress={restart}>
                  <Ionicons name="exit-outline" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {/* Loading overlay until both onLoad have fired */}
          {isLoading && (
            <View style={styles.loadingCover}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingTxt}>Preparing Psynk Playback…</Text>
            </View>
          )}
        </Animated.View>
      </Pressable>
    </SafeAreaView>
  );
}

const SPACER = 10; // vertical gap between stacked videos (more room for elapsed)

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  // lowered
  topBar: {
    marginTop: 16,
    marginHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  // Stacked: move closer to center; leave small space for elapsed
  videoTop: {
    width: "100%",
    height: SCREEN_HEIGHT * 0.42,
    backgroundColor: "#111",
  },
  videoBottom: {
    width: "100%",
    height: SCREEN_HEIGHT * 0.42,
    backgroundColor: "#111",
    marginTop: SPACER,
  },

  // Ghost composite
  videoOverlay: {
    position: "absolute",
    top: 0,
    width: "100%",
    height: "84%", // leave space for bottom controls block
    backgroundColor: "#000",
  },

  // Elapsed: centered between stacked videos
  elapsedCenter: {
    position: "absolute",
    top: SCREEN_HEIGHT * 0.42 + 6,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  // Elapsed: centered below ghost composite
  elapsedBelow: {
    position: "absolute",
    top: SCREEN_HEIGHT * 0.84 - 26,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  elapsedText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  // Bottom controls block (not overlaying videos)
  controls: {
    position: "absolute",
    bottom: 22,
    width: "100%",
    alignItems: "center",
  },
  slider: { width: "88%", height: 40 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
  },
  rate: { color: "#fff", fontWeight: "700" },

  loadingCover: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingTxt: { color: "#fff", marginTop: 10, fontWeight: "600" },
});
