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
  const video1H = useSharedValue(SCREEN_HEIGHT / 2);
  const video2H = useSharedValue(SCREEN_HEIGHT / 2);
  const videoOpacity1 = useSharedValue(1);
  const videoOpacity2 = useSharedValue(1);
  const spin = useSharedValue(0);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
  };

  /** ─────────────────────────────── PSYNK ─────────────────────────────── **/
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

  /** ─────────────────────────────── GHOST ─────────────────────────────── **/
  const toggleGhost = () => {
    const next = ghost.value === 0 ? 1 : 0;
    ghost.value = withTiming(next, { duration: 500 });

    if (next === 1) {
      // full-screen overlay
      video1Y.value = withTiming(0, { duration: 500 });
      video2Y.value = withTiming(0, { duration: 500 });
      video1H.value = withTiming(SCREEN_HEIGHT, { duration: 500 });
      video2H.value = withTiming(SCREEN_HEIGHT, { duration: 500 });

      if (ghostTop === "first") {
        videoOpacity1.value = withTiming(1, { duration: 400 });
        videoOpacity2.value = withTiming(0.4, { duration: 400 });
      } else {
        videoOpacity1.value = withTiming(0.4, { duration: 400 });
        videoOpacity2.value = withTiming(1, { duration: 400 });
      }
    } else {
      // restore vertical split
      video1Y.value = withTiming(0, { duration: 500 });
      video2Y.value = withTiming(SCREEN_HEIGHT / 2, { duration: 500 });
      video1H.value = withTiming(SCREEN_HEIGHT / 2, { duration: 500 });
      video2H.value = withTiming(SCREEN_HEIGHT / 2, { duration: 500 });
      videoOpacity1.value = withTiming(1, { duration: 400 });
      videoOpacity2.value = withTiming(1, { duration: 400 });
    }
  };

  const swapGhostOrder = () => {
    if (ghost.value === 1) {
      setGhostTop((p) => (p === "first" ? "second" : "first"));
      const nextTop = ghostTop === "first" ? "second" : "first";
      if (nextTop === "first") {
        videoOpacity1.value = withTiming(1, { duration: 400 });
        videoOpacity2.value = withTiming(0.4, { duration: 400 });
      } else {
        videoOpacity1.value = withTiming(0.4, { duration: 400 });
        videoOpacity2.value = withTiming(1, { duration: 400 });
      }
    }
  };

  /** ───────────────────────────── PLAYBACK ───────────────────────────── **/
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
      const new1 = Math.max(0, s1.positionMillis + delta * 1000);
      const new2 = Math.max(0, s2.positionMillis + delta * 1000);
      await player1.current?.setPositionAsync(new1);
      await player2.current?.setPositionAsync(new2);
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

  /** ───────────────────────────── TIMER ───────────────────────────── **/
  useEffect(() => {
    let frame: number;
    const update = (t: number) => {
      if (isPlaying) {
        if (lastTimestamp != null) {
          const d = (t - lastTimestamp) / 1000;
          setElapsed((p) => p + d * playbackRate);
        }
        setLastTimestamp(t);
      } else setLastTimestamp(null);
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [isPlaying, playbackRate, lastTimestamp]);

  /** ───────────────────────────── CLEANUP ───────────────────────────── **/
  useEffect(() => {
    return () => {
      player1.current?.pauseAsync();
      player2.current?.pauseAsync();
    };
  }, []);

  /** ───────────────────────────── STYLES ───────────────────────────── **/
  const a1 = useAnimatedStyle(() => ({
    transform: [{ translateY: video1Y.value }],
    height: video1H.value,
    opacity: videoOpacity1.value,
  }));
  const a2 = useAnimatedStyle(() => ({
    transform: [{ translateY: video2Y.value }],
    height: video2H.value,
    opacity: videoOpacity2.value,
  }));
  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayVisible.value }));

  /** ───────────────────────────── RENDER ───────────────────────────── **/
  return (
    <TouchableWithoutFeedback onPress={showOverlay}>
      <View style={styles.container}>
        <Animated.View style={[styles.videoWrap, a1]}>
          <Video
            ref={player1}
            source={{ uri: video1 }}
            style={styles.video}
            resizeMode="cover"
          />
        </Animated.View>
        <Animated.View style={[styles.videoWrap, a2]}>
          <Video
            ref={player2}
            source={{ uri: video2 }}
            style={styles.video}
            resizeMode="cover"
          />
        </Animated.View>

        {/* elapsed time */}
        <View style={styles.elapsed}>
          <Text style={styles.elapsedTxt}>{formatTime(elapsed)}</Text>
        </View>

        {/* playback overlay */}
        <Animated.View
          style={[styles.playback, overlayStyle]}
          entering={FadeIn.duration(400)}
          exiting={FadeOut.duration(300)}
        >
          <TouchableOpacity onPress={() => handleStep(-0.5)} style={styles.iconBtn}>
            <Ionicons name="play-back-outline" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handlePlayPause} style={styles.iconBtn}>
            <Ionicons
              name={isPlaying ? "pause-circle-outline" : "play-circle-outline"}
              size={50}
              color="#fff"
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleStep(0.5)} style={styles.iconBtn}>
            <Ionicons name="play-forward-outline" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => toggleSpeed(0.5)}
            style={[
              styles.iconBtn,
              playbackRate === 0.5 && styles.activeTxt,
            ]}
          >
            <Text style={styles.spd}>½×</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => toggleSpeed(0.25)}
            style={[
              styles.iconBtn,
              playbackRate === 0.25 && styles.activeTxt,
            ]}
          >
            <Text style={styles.spd}>¼×</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* bottom controls */}
        <View style={styles.bottom}>
          <View style={styles.leftGroup}>
            <TouchableOpacity onPress={toggleGhost} style={styles.btn}>
              <Ionicons name="layers-outline" size={24} color="#fff" />
            </TouchableOpacity>
            {ghost.value === 1 && (
              <TouchableOpacity onPress={swapGhostOrder} style={styles.btn}>
                <Ionicons name="swap-vertical-outline" size={24} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.centerGroup}>
            <Text style={styles.sliderLbl}>
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
              maximumTrackTintColor="rgba(255,255,255,0.3)"
              thumbTintColor="#fff"
            />
            <TouchableOpacity onPress={handlePsynkPlay} style={styles.psynkBtn}>
              <Animated.View
                style={{ transform: [{ rotate: `${spin.value * 360}deg` }] }}
              >
                <Ionicons
                  name={
                    statusText.includes("psynking")
                      ? "sync-outline"
                      : statusText.includes("psynked")
                      ? "checkmark-outline"
                      : "play-circle-outline"
                  }
                  size={60}
                  color="#fff"
                />
              </Animated.View>
              <Text style={styles.psynkTxt}>{statusText}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.btn}>
            <Ionicons name="arrow-back-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0C10" },
  videoWrap: { position: "absolute", width: "100%", overflow: "hidden" },
  video: { width: "100%", height: "100%" },
  elapsed: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  elapsedTxt: {
    fontFamily: "Orbitron",
    color: "#fff",
    fontSize: 18,
    letterSpacing: 1,
  },
  playback: {
    position: "absolute",
    bottom: 110,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 16,
    marginHorizontal: 20,
    paddingVertical: 8,
  },
  iconBtn: { marginHorizontal: 8 },
  spd: { color: "#fff", fontFamily: "Orbitron-Bold", fontSize: 16 },
  activeTxt: { textShadowColor: "#fff", textShadowRadius: 8 },
  bottom: {
    position: "absolute",
    bottom: 25,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
  },
  leftGroup: { flexDirection: "row" },
  centerGroup: { alignItems: "center", flex: 1 },
  sliderLbl: { color: "#fff", fontSize: 13, marginBottom: 4 },
  slider: { width: "80%", height: 35 },
  psynkBtn: { alignItems: "center", marginTop: 6 },
  psynkTxt: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Orbitron-Bold",
    textTransform: "lowercase",
  },
  btn: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 28,
    padding: 10,
    marginHorizontal: 4,
  },
});
