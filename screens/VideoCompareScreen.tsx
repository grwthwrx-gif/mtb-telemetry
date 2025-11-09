import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Pressable,
  Alert,
} from "react-native";
import Slider from "@react-native-community/slider";
import { Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useRoute, useNavigation } from "@react-navigation/native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function VideoCompareScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { video1, video2 } = route.params as { video1: string; video2: string };

  const player1 = useRef<Video>(null); // master timeline
  const player2 = useRef<Video>(null); // follower (position = master + offset)

  // Phase & playback
  const [isSetupMode, setIsSetupMode] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  // Views
  const [ghostMode, setGhostMode] = useState(false);
  const [swapVertical, setSwapVertical] = useState(false);
  const [swapGhost, setSwapGhost] = useState(false);

  // Sync & timeline
  const [offset, setOffset] = useState(0); // seconds (+ means video2 lags behind)
  const [elapsed, setElapsed] = useState(0);
  const [scrubPos, setScrubPos] = useState(0); // 0..1 of player1
  const [duration, setDuration] = useState(1);

  // readiness
  const [ready1, setReady1] = useState(false);
  const [ready2, setReady2] = useState(false);
  const videosReady = ready1 && ready2;

  // controls auto-hide in playback
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsOpacity = useSharedValue(1);
  const animatedControlsStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
  }));

  useEffect(() => {
    if (!isSetupMode && controlsVisible) {
      controlsOpacity.value = withTiming(1, { duration: 250 });
      const t = setTimeout(() => {
        controlsOpacity.value = withTiming(0, { duration: 450 });
        setControlsVisible(false);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [controlsVisible, isSetupMode]);

  const tapToReveal = () => {
    if (!isSetupMode) {
      controlsOpacity.value = withTiming(1, { duration: 200 });
      setControlsVisible(true);
    }
  };

  // ===== Helpers
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
  };

  // Keep follower aligned to master + offset
  const syncFollower = async () => {
    if (!videosReady) return;
    const s1 = await player1.current?.getStatusAsync();
    const s2 = await player2.current?.getStatusAsync();
    if (s1?.isLoaded && s2?.isLoaded) {
      const target = (s1.positionMillis ?? 0) + offset * 1000;
      await player2.current?.setPositionAsync(Math.max(0, target));
    }
  };

  // Track elapsed + scrub while playing
  useEffect(() => {
    let id: NodeJS.Timeout | null = null;
    if (!isSetupMode && isPlaying && videosReady) {
      id = setInterval(async () => {
        const s1 = await player1.current?.getStatusAsync();
        if (s1?.isLoaded && s1.durationMillis) {
          const pos = s1.positionMillis ?? 0;
          setElapsed(pos / 1000);
          setDuration(Math.max(1, s1.durationMillis / 1000));
          setScrubPos(pos / s1.durationMillis);
        }
      }, 200);
    }
    return () => id && clearInterval(id);
  }, [isSetupMode, isPlaying, videosReady]);

  // ===== Setup confirm
  const handleConfirmSync = async () => {
    if (!videosReady) {
      Alert.alert("Videos not ready", "Please wait for both videos to load.");
      return;
    }
    // reset to t0 and apply offset definition
    await player1.current?.setPositionAsync(0);
    await player2.current?.setPositionAsync(Math.max(0, offset * 1000));
    setElapsed(0);
    setScrubPos(0);
    setIsSetupMode(false);
    // do not auto-play; let user press play
    setControlsVisible(true);
    controlsOpacity.value = withTiming(1, { duration: 200 });
  };

  // ===== Playback controls
  const handlePlayPause = async () => {
    if (!videosReady) return;
    if (isPlaying) {
      await player1.current?.pauseAsync();
      await player2.current?.pauseAsync();
      setIsPlaying(false);
    } else {
      // resync before playing
      await syncFollower();
      await player1.current?.playAsync();
      await player2.current?.playAsync();
      await player1.current?.setRateAsync(playbackRate, true);
      await player2.current?.setRateAsync(playbackRate, true);
      setIsPlaying(true);
    }
    setControlsVisible(true);
  };

  const handleRateChange = async (rate: number) => {
    if (!videosReady) return;
    setPlaybackRate(rate);
    await player1.current?.setRateAsync(rate, true);
    await player2.current?.setRateAsync(rate, true);
    setControlsVisible(true);
  };

  const handleStep = async (deltaSec: number) => {
    if (!videosReady) return;
    const s1 = await player1.current?.getStatusAsync();
    if (!s1?.isLoaded) return;
    const newPos = Math.max(0, (s1.positionMillis ?? 0) + deltaSec * 1000);
    await player1.current?.setPositionAsync(newPos);
    await player2.current?.setPositionAsync(newPos + offset * 1000);
    setIsPlaying(false); // frame step pauses
    setControlsVisible(true);
  };

  const handleScrubPlayback = async (ratio: number) => {
    if (!videosReady) return;
    const s1 = await player1.current?.getStatusAsync();
    if (!s1?.isLoaded || !s1.durationMillis) return;
    const target = ratio * s1.durationMillis;
    await player1.current?.setPositionAsync(target);
    await player2.current?.setPositionAsync(target + offset * 1000);
    setScrubPos(ratio);
    setIsPlaying(false); // user scrub usually pauses
  };

  const handlePsynkOffset = async (val: number) => {
    setOffset(val);
    // live-apply offset: follower jumps relative to current master
    await syncFollower();
  };

  const handleUnlock = async () => {
    // back to setup (resync available again)
    await player1.current?.pauseAsync();
    await player2.current?.pauseAsync();
    setIsPlaying(false);
    setIsSetupMode(true);
    setControlsVisible(true);
    controlsOpacity.value = withTiming(1, { duration: 200 });
  };

  const handleToggleGhost = () => {
    setGhostMode((p) => !p);
    setControlsVisible(true);
  };
  const handleSwap = () => {
    if (ghostMode) setSwapGhost((p) => !p);
    else setSwapVertical((p) => !p);
    setControlsVisible(true);
  };

  const handleBack = async () => {
    await player1.current?.pauseAsync();
    await player2.current?.pauseAsync();
    setIsPlaying(false);
    navigation.goBack();
  };

  return (
    <Pressable style={styles.container} onPress={tapToReveal}>
      {/* elapsed */}
      {!isSetupMode && (
        <View style={styles.elapsedOverlay} pointerEvents="none">
          <Text style={styles.elapsedText}>{formatTime(elapsed)}</Text>
        </View>
      )}

      {/* videos */}
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
              onLoad={() => setReady1(true)}
            />
            <Video
              ref={player2}
              source={{ uri: video2 }}
              style={[
                styles.videoHalf,
                swapVertical ? styles.topVideo : styles.bottomVideo,
              ]}
              resizeMode="contain"
              onLoad={() => setReady2(true)}
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
                  onLoad={() => setReady1(true)}
                />
                <Video
                  ref={player2}
                  source={{ uri: video2 }}
                  style={styles.videoOverlay}
                  resizeMode="contain"
                  onLoad={() => setReady2(true)}
                />
              </>
            ) : (
              <>
                <Video
                  ref={player2}
                  source={{ uri: video2 }}
                  style={[styles.videoOverlay, { opacity: 0.4 }]}
                  resizeMode="contain"
                  onLoad={() => setReady2(true)}
                />
                <Video
                  ref={player1}
                  source={{ uri: video1 }}
                  style={styles.videoOverlay}
                  resizeMode="contain"
                  onLoad={() => setReady1(true)}
                />
              </>
            )}
          </>
        )}
      </View>

      {/* ===== SETUP MODE UI ===== */}
      {isSetupMode ? (
        <View style={styles.setupUI}>
          <View style={styles.sliderBlock}>
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
              maximumTrackTintColor="#333"
              thumbTintColor="#fff"
              disabled={!videosReady}
            />
          </View>

          <TouchableOpacity
            style={styles.tickButton}
            onPress={handleConfirmSync}
            disabled={!videosReady}
          >
            <Ionicons name="checkmark-circle" size={72} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        // ===== PLAYBACK MODE UI =====
        <>
          {/* lock (tap to unlock and return to setup) */}
          <TouchableOpacity style={styles.lockIcon} onPress={handleUnlock}>
            <Ionicons name="lock-closed" size={26} color="#fff" />
          </TouchableOpacity>

          {/* control panel (auto-hide) */}
          <Animated.View style={[styles.controlsOverlay, animatedControlsStyle]}>
            {/* Thin scrub bar (minimalist) */}
            <Slider
              style={styles.scrubSlider}
              minimumValue={0}
              maximumValue={1}
              step={0.001}
              value={scrubPos}
              onSlidingComplete={handleScrubPlayback}
              minimumTrackTintColor="#fff"
              maximumTrackTintColor="rgba(255,255,255,0.25)"
              thumbTintColor="#fff"
            />

            {/* transport + rate */}
            <View style={styles.playbackRow}>
              <TouchableOpacity onPress={() => handleStep(-0.5)}>
                <Ionicons name="play-back" size={30} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handlePlayPause}>
                <Ionicons
                  name={isPlaying ? "pause-circle" : "play-circle"}
                  size={54}
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

            {/* ghost / swap / back */}
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
              <TouchableOpacity onPress={handleBack}>
                <Ionicons name="arrow-undo" size={26} color="#fff" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0C10" },

  // videos
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

  // setup UI
  setupUI: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    paddingTop: 10,
    paddingBottom: 18,
    paddingHorizontal: 14,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
  },
  sliderBlock: { width: "100%" },
  sliderLabel: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 2,
  },
  offsetValue: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 4,
    opacity: 0.85,
  },
  slider: { width: "100%", height: 35 },
  tickButton: { marginTop: 4 },

  // playback UI
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
  lockIcon: {
    position: "absolute",
    top: 30,
    left: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    padding: 6,
    borderRadius: 18,
    zIndex: 2,
  },

  controlsOverlay: {
    position: "absolute",
    bottom: 22,
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 14,
  },

  // thin, minimalist scrub slider
  scrubSlider: {
    width: "100%",
    height: 24,
    marginBottom: 8,
  },

  playbackRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.32)",
    borderRadius: 40,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginBottom: 8,
    gap: 16,
  },
  rateText: { color: "#fff", fontSize: 18, fontWeight: "700" },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
    alignSelf: "center",
    marginTop: 2,
  },
});
