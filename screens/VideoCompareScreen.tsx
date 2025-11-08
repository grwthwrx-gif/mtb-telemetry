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
  Easing,
} from "react-native-reanimated";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// ~1 frame at 30fps
const FRAME_SEC = 1 / 30;
// panel animation
const PANEL_H = 210;
const ANIM_CFG = { duration: 220, easing: Easing.out(Easing.cubic) };

export default function VideoCompareScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { video1, video2 } = route.params as { video1: string; video2: string };

  const player1 = useRef<Video>(null); // reference (top)
  const player2 = useRef<Video>(null); // target (bottom / overlay)

  const [isPlaying, setIsPlaying] = useState(false);
  const [ghostMode, setGhostMode] = useState(false);
  const [swapVertical, setSwapVertical] = useState(false);
  const [swapGhost, setSwapGhost] = useState(false);

  // Offsets & timing
  const [offset, setOffset] = useState(0); // seconds (+ means video2 starts later)
  const [elapsed, setElapsed] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  // Scrub (compare mode): uses player1 duration
  const [scrubPos, setScrubPos] = useState(0);
  const [duration, setDuration] = useState(1);

  // Precision Psynk Mode
  const [psynkMode, setPsynkMode] = useState(false);
  const [prevOffset, setPrevOffset] = useState(0);
  const [fineScrubPos, setFineScrubPos] = useState(0); // ratio of player2 duration
  const [duration2, setDuration2] = useState(1);

  // Panels slide animation
  const controlY = useSharedValue(0);          // 0 = visible, PANEL_H = hidden down
  const psynkY = useSharedValue(PANEL_H);      // 0 = visible, PANEL_H = hidden down
  const controlStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: controlY.value }],
    opacity: 1 - Math.min(controlY.value / PANEL_H, 1),
  }));
  const psynkStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: psynkY.value }],
    opacity: 1 - Math.min(psynkY.value / PANEL_H, 1),
  }));

  // Keep elapsed + scrub in sync with player1
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    const tick = async () => {
      const s1 = await player1.current?.getStatusAsync();
      if (s1?.durationMillis && s1?.positionMillis !== undefined) {
        setDuration(Math.max(1, s1.durationMillis / 1000));
        setElapsed((s1.positionMillis ?? 0) / 1000);
        setScrubPos((s1.positionMillis ?? 0) / s1.durationMillis);
      }
    };
    if (isPlaying) {
      interval = setInterval(tick, 250);
    } else {
      // update once when paused so UI reflects correct positions
      tick();
    }
    return () => interval && clearInterval(interval);
  }, [isPlaying]);

  // Get player2 duration for fine sync slider
  useEffect(() => {
    const probe = async () => {
      const s2 = await player2.current?.getStatusAsync();
      if (s2?.durationMillis) setDuration2(Math.max(1, s2.durationMillis / 1000));
    };
    probe();
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
  };

  // ====== Compare Mode Handlers ======
  const handlePlayPause = async () => {
    if (isPlaying) {
      await player1.current?.pauseAsync();
      await player2.current?.pauseAsync();
      setIsPlaying(false);
    } else {
      await player1.current?.playAsync();
      await player2.current?.playAsync();
      await player1.current?.setRateAsync(playbackRate, true);
      await player2.current?.setRateAsync(playbackRate, true);
      setIsPlaying(true);
    }
  };

  const handleStep = async (deltaSec: number) => {
    const s1 = await player1.current?.getStatusAsync();
    const base = s1?.positionMillis ?? 0;
    const newPos = Math.max(0, base + deltaSec * 1000);
    await Promise.all([
      player1.current?.setPositionAsync(newPos),
      player2.current?.setPositionAsync(newPos),
    ]);
  };

  const handleRateChange = async (rate: number) => {
    setPlaybackRate(rate);
    await Promise.all([
      player1.current?.setRateAsync(rate, true),
      player2.current?.setRateAsync(rate, true),
    ]);
  };

  const handleScrub = async (ratio: number) => {
    const targetMs = ratio * duration * 1000;
    await Promise.all([
      player1.current?.setPositionAsync(targetMs),
      player2.current?.setPositionAsync(targetMs),
    ]);
    setScrubPos(ratio);
  };

  // Adjust sync offset live (coarse)
  const handlePsynkOffset = async (val: number) => {
    setOffset(val);
    // Apply absolute offset from t=0 for clarity; jump to aligned positions around current t
    const s1 = await player1.current?.getStatusAsync();
    const currentMs = s1?.positionMillis ?? 0;
    // keep player1 at currentMs; shift player2 relative by "val"
    const target2 = Math.max(0, currentMs + val * 1000);
    await player2.current?.setPositionAsync(target2);
  };

  // Toggle modes & swapping
  const handleToggleGhost = () => setGhostMode((p) => !p);
  const handleSwap = () =>
    ghostMode ? setSwapGhost((p) => !p) : setSwapVertical((p) => !p);

  const handleBack = async () => {
    await player1.current?.pauseAsync();
    await player2.current?.pauseAsync();
    navigation.goBack();
  };

  // ====== Precision Psynk Mode ======
  const enterPsynkMode = async () => {
    // Pause both, freeze top; bottom will scrub
    await player1.current?.pauseAsync();
    await player2.current?.pauseAsync();
    setIsPlaying(false);
    setPrevOffset(offset);

    // initialise fine scrub based on player2 current position
    const s2 = await player2.current?.getStatusAsync();
    if (s2?.durationMillis) {
      const ratio = (s2.positionMillis ?? 0) / s2.durationMillis;
      setFineScrubPos(ratio);
      setDuration2(Math.max(1, s2.durationMillis / 1000));
    }

    setPsynkMode(true);
    // slide panels
    controlY.value = withTiming(PANEL_H, ANIM_CFG);
    psynkY.value = withTiming(0, ANIM_CFG);
  };

  const cancelPsynk = async () => {
    // revert offset & positions
    setOffset(prevOffset);
    // Re-align player2 to reverted offset around current player1 position
    const s1 = await player1.current?.getStatusAsync();
    const currentMs = s1?.positionMillis ?? 0;
    const target2 = Math.max(0, currentMs + prevOffset * 1000);
    await player2.current?.setPositionAsync(target2);

    setPsynkMode(false);
    controlY.value = withTiming(0, ANIM_CFG);
    psynkY.value = withTiming(PANEL_H, ANIM_CFG);
  };

  const confirmPsynk = async () => {
    // offset already tracked live via fine scrub; just exit mode
    setPsynkMode(false);
    controlY.value = withTiming(0, ANIM_CFG);
    psynkY.value = withTiming(PANEL_H, ANIM_CFG);
  };

  // Fine scrub uses player2 duration and sets absolute offset vs player1 paused time
  const handleFineScrub = async (ratio: number) => {
    const s1 = await player1.current?.getStatusAsync();
    const s2 = await player2.current?.getStatusAsync();
    const dur2 = s2?.durationMillis ?? 1;
    const target2 = ratio * dur2;
    await player2.current?.setPositionAsync(target2);
    setFineScrubPos(ratio);

    // set offset in seconds relative to current top (player1) time
    const topMs = s1?.positionMillis ?? 0;
    setOffset((target2 - topMs) / 1000);
  };

  const stepFrame = async (dir: -1 | 1) => {
    const s2 = await player2.current?.getStatusAsync();
    const pos = s2?.positionMillis ?? 0;
    const newPos = Math.max(0, pos + dir * FRAME_SEC * 1000);
    await player2.current?.setPositionAsync(newPos);

    // update ratio + offset display
    const dur = s2?.durationMillis ?? 1;
    setFineScrubPos(newPos / dur);

    const s1 = await player1.current?.getStatusAsync();
    const topMs = s1?.positionMillis ?? 0;
    setOffset((newPos - topMs) / 1000);
  };

  return (
    <View style={styles.container}>
      {/* Elapsed time */}
      <View style={styles.elapsedOverlay} pointerEvents="none">
        <Text style={styles.elapsedText}>{formatTime(elapsed)}</Text>
      </View>

      {/* VIDEOS */}
      <View style={styles.videoContainer}>
        {!ghostMode ? (
          <>
            <Video
              ref={player1}
              source={{ uri: video1 }}
              style={[
                styles.videoHalf,
                swapVertical ? styles.bottomVideo : styles.topVideo,
              ]}
              resizeMode="contain"
            />
            <Video
              ref={player2}
              source={{ uri: video2 }}
              style={[
                styles.videoHalf,
                swapVertical ? styles.topVideo : styles.bottomVideo,
              ]}
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
      </View>

      {/* MAIN CONTROL PANEL (Compare Mode) */}
      <Animated.View style={[styles.controlPanel, controlStyle]}>
        {/* Psynk offset (coarse) */}
        <View style={styles.sliderGroup}>
          <Text style={styles.sliderLabel}>Psynk Offset</Text>
          <Text style={styles.offsetValue}>
            {offset > 0 ? `+${offset.toFixed(2)} s` : `${offset.toFixed(2)} s`}
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={-3}
            maximumValue={3}
            step={0.1}
            value={offset}
            onValueChange={handlePsynkOffset}
            minimumTrackTintColor="#fff"
            maximumTrackTintColor="#444"
            thumbTintColor="#fff"
          />
        </View>

        {/* Scrub (both videos together) */}
        <View style={{ marginTop: 6 }}>
          <Text style={styles.sliderLabel}>Scrub</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            step={0.001}
            value={scrubPos}
            onSlidingComplete={handleScrub}
            minimumTrackTintColor="#fff"
            maximumTrackTintColor="#444"
            thumbTintColor="#fff"
          />
        </View>

        {/* Controls row */}
        <View style={styles.controlsRow}>
          <TouchableOpacity onPress={() => handleStep(-0.5)}>
            <Ionicons name="play-back" size={30} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePlayPause}>
            <Ionicons
              name={isPlaying ? "pause-circle" : "play-circle"}
              size={50}
              color="#fff"
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleStep(0.5)}>
            <Ionicons name="play-forward" size={30} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleRateChange(0.5)}>
            <Text style={styles.rateText}>½×</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleRateChange(0.25)}>
            <Text style={styles.rateText}>¼×</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom row */}
        <View style={styles.bottomRow}>
          <TouchableOpacity onPress={handleToggleGhost}>
            <Ionicons
              name="layers"
              size={26}
              color={ghostMode ? "#fff" : "rgba(255,255,255,0.7)"}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSwap}>
            <Ionicons name="swap-vertical" size={26} color="#fff" />
          </TouchableOpacity>

          {/* Enter Precision Psynk (filled sync icon) */}
          <TouchableOpacity onPress={enterPsynkMode}>
            <Ionicons name="sync" size={26} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="arrow-undo" size={26} color="#fff" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* PRECISION PSYNK PANEL (slides up over bottom) */}
      <Animated.View style={[styles.psynkPanel, psynkStyle]}>
        <Text style={styles.psynkTitle}>Precision Psynk</Text>
        <Text style={styles.offsetValue}>
          {offset > 0 ? `+${offset.toFixed(3)} s` : `${offset.toFixed(3)} s`}
        </Text>

        <View style={styles.psynkRow}>
          <TouchableOpacity onPress={() => stepFrame(-1)} style={styles.circleBtn}>
            <Ionicons name="play-back" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={{ flex: 1, marginHorizontal: 10 }}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              step={0.001}
              value={fineScrubPos}
              onValueChange={handleFineScrub}
              minimumTrackTintColor="#fff"
              maximumTrackTintColor="#444"
              thumbTintColor="#fff"
            />
          </View>

          <TouchableOpacity onPress={() => stepFrame(1)} style={styles.circleBtn}>
            <Ionicons name="play-forward" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.psynkActions}>
          <TouchableOpacity onPress={cancelPsynk} style={styles.actionBtn}>
            <Ionicons name="close-circle" size={28} color="#fff" />
            <Text style={styles.actionTxt}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmPsynk} style={styles.actionBtn}>
            <Ionicons name="checkmark-circle" size={28} color="#fff" />
            <Text style={styles.actionTxt}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0C10" },

  // Elapsed time
  elapsedOverlay: {
    position: "absolute",
    top: 30,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    zIndex: 2,
  },
  elapsedText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  // Video area
  videoContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  videoHalf: {
    width: "100%",
    height: SCREEN_HEIGHT * 0.4,
    backgroundColor: "#111",
  },
  topVideo: { zIndex: 1 },
  bottomVideo: { zIndex: 0 },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  // Main control panel
  controlPanel: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  sliderGroup: { width: "100%" },
  sliderLabel: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 2,
    textAlign: "center",
  },
  offsetValue: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 4,
    opacity: 0.85,
  },
  slider: { width: "100%", height: 35 },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    marginTop: 6,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "88%",
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 6,
  },
  rateText: { color: "#fff", fontSize: 18, fontWeight: "700", marginHorizontal: 10 },

  // Precision Psynk panel
  psynkPanel: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: PANEL_H,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  psynkTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 2,
  },
  psynkRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  psynkActions: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 6,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionTxt: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
