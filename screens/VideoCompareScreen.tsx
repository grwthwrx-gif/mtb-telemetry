import React, { useRef, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  Pressable,
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

  // Players
  const player1 = useRef<Video>(null);
  const player2 = useRef<Video>(null);

  // State
  const [isSetupMode, setIsSetupMode] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ghostMode, setGhostMode] = useState(false);
  const [swapVertical, setSwapVertical] = useState(false); // top/bottom in split
  const [swapGhost, setSwapGhost] = useState(false);       // front/back in ghost
  const [offset, setOffset] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  // Auto-hide controls
  const controlsOpacity = useSharedValue(1);
  useEffect(() => {
    if (!isSetupMode && controlsVisible) {
      controlsOpacity.value = withTiming(1, { duration: 200 });
      const t = setTimeout(() => {
        controlsOpacity.value = withTiming(0.2, { duration: 400 });
        setControlsVisible(false);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [controlsVisible, isSetupMode]);
  const animatedControlsStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
  }));

  // Elapsed time from actual player position (player1 is source of truth)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying && player1.current) {
      interval = setInterval(async () => {
        const status = await player1.current?.getStatusAsync();
        if (status?.positionMillis != null) {
          setElapsed(status.positionMillis / 1000);
        }
      }, 250);
    } else if (interval) {
      clearInterval(interval);
    }
    return () => interval && clearInterval(interval);
  }, [isPlaying]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
  };

  // Psynk & Play
  const handlePsynkPlay = async () => {
    try {
      await player1.current?.setPositionAsync(0);
      await player2.current?.setPositionAsync(0);

      if (offset > 0) {
        await player2.current?.setPositionAsync(offset * 1000);
      } else if (offset < 0) {
        await player1.current?.setPositionAsync(Math.abs(offset) * 1000);
      }

      setIsSetupMode(false);
      await Promise.all([
        player1.current?.playAsync(),
        player2.current?.playAsync(),
      ]);
      await Promise.all([
        player1.current?.setRateAsync(playbackRate, true),
        player2.current?.setRateAsync(playbackRate, true),
      ]);
      setIsPlaying(true);
      setElapsed(0);
      setControlsVisible(true);
    } catch (e) {
      console.error("psynk error:", e);
    }
  };

  // Playback
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
    revealControls();
  };

  const handleStep = async (delta: number) => {
    const s1 = await player1.current?.getStatusAsync();
    const newPos = Math.max(0, (s1?.positionMillis ?? 0) + delta * 1000);
    await Promise.all([
      player1.current?.setPositionAsync(newPos),
      player2.current?.setPositionAsync(newPos),
    ]);
    revealControls();
  };

  const handleRateChange = async (rate: number) => {
    setPlaybackRate(rate);
    await Promise.all([
      player1.current?.setRateAsync(rate, true),
      player2.current?.setRateAsync(rate, true),
    ]);
    revealControls();
  };

  // Modes
  const handleToggleGhost = () => {
    setGhostMode((prev) => !prev);
    revealControls();
  };

  const handleSwap = () => {
    if (ghostMode) setSwapGhost((p) => !p);
    else setSwapVertical((p) => !p);
    revealControls();
  };

  const handleBackToSetup = async () => {
    await player1.current?.pauseAsync();
    await player2.current?.pauseAsync();
    setIsPlaying(false);
    setIsSetupMode(true);
    revealControls();
  };

  const revealControls = () => {
    controlsOpacity.value = withTiming(1, { duration: 150 });
    setControlsVisible(true);
  };

  const handleTapScreen = () => revealControls();

  // Common props to keep videos responsive and debuggable
  const baseVideoProps = {
    resizeMode: "contain" as const,
    isLooping: true,
    shouldCorrectPitch: true,
    onError: (e: any) => console.log("Video error:", e),
  };

  return (
    <Pressable style={styles.container} onPress={handleTapScreen}>
      {/* === SETUP MODE === */}
      {isSetupMode ? (
        <View style={styles.setupContainer}>
          <View style={styles.videosStack}>
            <Video
              ref={player1}
              source={{ uri: video1 }}
              style={styles.videoHalf}
              useNativeControls
              {...baseVideoProps}
            />
            <Video
              ref={player2}
              source={{ uri: video2 }}
              style={styles.videoHalf}
              useNativeControls
              {...baseVideoProps}
            />
          </View>

          <View style={styles.sliderContainer}>
            <Text style={styles.sliderLabel}>Psynk Offset</Text>
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
            <Ionicons name="play-circle-outline" size={70} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        /* === PLAYBACK MODE === */
        <View style={styles.playbackContainer}>
          {/* Videos */}
          {!ghostMode ? (
            <>
              <Video
                ref={player1}
                source={{ uri: video1 }}
                style={[
                  styles.videoFull,
                  swapVertical ? styles.bottomVideo : styles.topVideo,
                ]}
                useNativeControls={false}
                {...baseVideoProps}
              />
              <Video
                ref={player2}
                source={{ uri: video2 }}
                style={[
                  styles.videoFull,
                  swapVertical ? styles.topVideo : styles.bottomVideo,
                ]}
                useNativeControls={false}
                {...baseVideoProps}
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
                    useNativeControls={false}
                    {...baseVideoProps}
                  />
                  <Video
                    ref={player2}
                    source={{ uri: video2 }}
                    style={styles.videoOverlay}
                    useNativeControls={false}
                    {...baseVideoProps}
                  />
                </>
              ) : (
                <>
                  <Video
                    ref={player2}
                    source={{ uri: video2 }}
                    style={[styles.videoOverlay, { opacity: 0.4 }]}
                    useNativeControls={false}
                    {...baseVideoProps}
                  />
                  <Video
                    ref={player1}
                    source={{ uri: video1 }}
                    style={styles.videoOverlay}
                    useNativeControls={false}
                    {...baseVideoProps}
                  />
                </>
              )}
            </>
          )}

          {/* Elapsed Time (non-blocking) */}
          <View style={styles.elapsedOverlay} pointerEvents="none">
            <Text style={styles.elapsedText}>{formatTime(elapsed)}</Text>
          </View>

          {/* Controls Overlay */}
          <Animated.View style={[styles.controlsOverlay, animatedControlsStyle]}>
            <View style={styles.playbackRow}>
              <TouchableOpacity onPress={() => handleStep(-0.5)} hitSlop={10}>
                <Ionicons name="play-back-outline" size={34} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity onPress={handlePlayPause} hitSlop={10}>
                <Ionicons
                  name={
                    isPlaying ? "pause-circle-outline" : "play-circle-outline"
                  }
                  size={52}
                  color="#fff"
                />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => handleStep(0.5)} hitSlop={10}>
                <Ionicons name="play-forward-outline" size={34} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => handleRateChange(0.5)} hitSlop={10}>
                <Text style={styles.rateText}>½×</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleRateChange(0.25)} hitSlop={10}>
                <Text style={styles.rateText}>¼×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.lowerControls}>
              <View style={styles.leftControls}>
                <TouchableOpacity onPress={handleToggleGhost} hitSlop={10}>
                  <Ionicons
                    name="layers-outline"
                    size={28}
                    color={ghostMode ? "#fff" : "rgba(255,255,255,0.7)"}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSwap} hitSlop={10}>
                  <Ionicons name="swap-vertical-outline" size={28} color="#fff" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={handleBackToSetup} hitSlop={10}>
                <Ionicons name="arrow-undo-outline" size={30} color="#fff" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0C10",
    alignItems: "center",
    justifyContent: "center",
  },

  // SETUP
  setupContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 40,
  },
  videosStack: {
    width: "100%",
    alignItems: "center",
  },
  videoHalf: {
    width: "90%",
    height: SCREEN_HEIGHT * 0.3,
    borderRadius: 12,
    backgroundColor: "#111",
    marginVertical: 8,
  },
  sliderContainer: {
    width: "85%",
    marginTop: 20,
  },
  sliderLabel: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "none",
  },
  slider: {
    width: "100%",
    height: 40,
  },
  psynkButton: {
    marginTop: 10,
  },

  // PLAYBACK
  playbackContainer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  videoFull: {
    width: "100%",
    height: SCREEN_HEIGHT / 2,
    position: "absolute",
  },
  topVideo: { top: 0 },
  bottomVideo: { bottom: 0 },
  videoOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },

  // ELAPSED
  elapsedOverlay: {
    position: "absolute",
    top: 30,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  elapsedText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textShadowColor: "rgba(255,255,255,0.6)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },

  // CONTROLS
  controlsOverlay: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    alignItems: "center",
  },
  playbackRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 40,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 15,
  },
  lowerControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "85%",
  },
  leftControls: {
    flexDirection: "row",
    gap: 20,
  },
  rateText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 14,
  },
});
