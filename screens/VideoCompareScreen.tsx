import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Video, AVPlaybackStatusSuccess } from "expo-av";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { GestureDetector, Gesture } from "react-native-gesture-handler";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

// Assume 30fps for step accuracy
const FRAME_STEP_MS = 1000 / 30;

export default function VideoCompareScreen() {
  const route = useRoute();
  const navigation = useNavigation();

  const { video1, video2, offset } = route.params as {
    video1: string;
    video2: string;
    offset: number; // seconds
  };

  const player1 = useRef<Video>(null);
  const player2 = useRef<Video>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [position, setPosition] = useState(0); // ms (global scrub position)
  const [duration, setDuration] = useState(1); // ms (based on video1)
  const [elapsed, setElapsed] = useState(0); // ms (player1 time)
  const [ghost, setGhost] = useState(false);
  const [swapGhost, setSwapGhost] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const [loading1, setLoading1] = useState(true);
  const [loading2, setLoading2] = useState(true);
  const [ready1, setReady1] = useState(false);
  const [ready2, setReady2] = useState(false);

  const offsetMs = offset * 1000;
  const ghostOpacity = 0.45;

  // Pinch-to-zoom
  const scale = useSharedValue(1);
  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = event.scale;
    })
    .onEnd(() => {
      // Snap back to 1
      scale.value = withTiming(1, { duration: 180 });
    });
  const zoomStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Compute synced positions for each video given a global "position" v (ms)
  const getSyncedPositions = (v: number) => {
    let p1 = 0;
    let p2 = 0;

    if (offsetMs >= 0) {
      // video2 lags behind (arrives later at anchor)
      p1 = Math.max(0, v);
      p2 = Math.max(0, v + offsetMs);
    } else {
      // video2 is ahead (negative offset)
      p1 = Math.max(0, v - offsetMs); // offsetMs is negative here
      p2 = Math.max(0, v);
    }

    return { p1, p2 };
  };

  // Sync both videos to a global position v (ms)
  const syncToPosition = async (v: number) => {
    const { p1, p2 } = getSyncedPositions(v);

    await player1.current?.setPositionAsync(p1);
    await player2.current?.setPositionAsync(p2);

    setPosition(v);
    setElapsed(p1);
  };

  // Initial sync when both videos are loaded
  useEffect(() => {
    if (ready1 && ready2) {
      syncToPosition(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready1, ready2, offsetMs]);

  // Pause both when unmounting (or when leaving the screen)
  useEffect(() => {
    return () => {
      stopPlayback();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopPlayback = async () => {
    await player1.current?.pauseAsync();
    await player2.current?.pauseAsync();
    setIsPlaying(false);
  };

  const handlePlayPause = async () => {
    // If at (or beyond) end, rewind to synced start first (but remain paused)
    if (!isPlaying && position >= duration) {
      await handleReplay(); // restart to 0, stay paused
    }

    if (isPlaying) {
      await stopPlayback();
      return;
    }

    await player1.current?.playAsync();
    await player2.current?.playAsync();
    setIsPlaying(true);
  };

  // Scrub slider: update both videos and keep offset consistent
  const handleScrub = async (v: number) => {
    await syncToPosition(v);
  };

  // Frame-accurate step forward/backward (≈33ms at 30fps)
  const handleFrameStep = async (direction: "back" | "forward") => {
    const delta = direction === "forward" ? FRAME_STEP_MS : -FRAME_STEP_MS;
    const next = Math.max(0, position + delta);
    await syncToPosition(next);
  };

  // Playback rate
  const handleRate = async (rate: number) => {
    setPlaybackRate(rate);
    await player1.current?.setRateAsync(rate, true);
    await player2.current?.setRateAsync(rate, true);
  };

  // Track elapsed & duration from player1's status
  const handleStatusUpdate1 = (status: AVPlaybackStatusSuccess) => {
    if (!status.isLoaded) return;

    const pos = status.positionMillis ?? 0;
    const dur =
      status.durationMillis ??
      status.playableDurationMillis ??
      duration ??
      1;

    setElapsed(pos);
    setPosition(pos);
    setDuration(dur);

    if (typeof status.isBuffering === "boolean") {
      setLoading1(status.isBuffering);
    }

    if (status.didJustFinish && !status.isLooping) {
      setIsPlaying(false);
    }
  };

  const handleStatusUpdate2 = (status: AVPlaybackStatusSuccess) => {
    if (!status.isLoaded) return;

    if (typeof status.isBuffering === "boolean") {
      setLoading2(status.isBuffering);
    }
  };

  const formatTime = (ms: number) => {
    const s = ms / 1000;
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const hundredths = Math.floor((s * 100) % 100)
      .toString()
      .padStart(2, "0");
    return `${m}:${sec.toString().padStart(2, "0")}:${hundredths}`;
  };

  // Replay from synced start (respecting offset) and STAY PAUSED (option B)
  const handleReplay = async () => {
    await stopPlayback();
    await syncToPosition(0);
  };

  const handleRestart = async () => {
    await stopPlayback();
    navigation.navigate("VideoSelection" as never);
  };

  const handleBack = async () => {
    await stopPlayback();
    navigation.goBack(); // keep selection screen state & videos alive
  };

  return (
    <View style={styles.container}>
      {/* TOP BAR */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={handleReplay}>
            <Ionicons
              name="play-skip-back-circle"
              size={30}
              color="#fff"
              style={{ marginRight: 18 }}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMenuOpen((m) => !m)}>
            <Ionicons name="ellipsis-horizontal" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {menuOpen && (
        <View style={styles.menuPanel}>
          <TouchableOpacity style={styles.menuItem} onPress={handleRestart}>
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.menuText}>Restart (select new videos)</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ELAPSED TIME */}
      <Text style={styles.elapsedText}>{formatTime(elapsed)}</Text>

      {/* VIDEO AREA WITH PINCH ZOOM */}
      <View style={styles.videoArea}>
        <GestureDetector gesture={pinch}>
          <Animated.View style={[styles.zoomContainer, zoomStyle]}>
            {!ghost ? (
              // STACKED VIEW
              <>
                <View style={styles.videoHalfTop}>
                  <Video
                    ref={player1}
                    source={{ uri: video1 }}
                    style={styles.video}
                    resizeMode="contain"
                    useNativeControls={false}
                    onLoadStart={() => {
                      setLoading1(true);
                    }}
                    onLoad={(status) => {
                      const s = status as AVPlaybackStatusSuccess;
                      const d =
                        s.durationMillis ??
                        s.playableDurationMillis ??
                        duration ??
                        1;
                      setDuration(d);
                      setLoading1(false);
                      setReady1(true);
                    }}
                    onPlaybackStatusUpdate={(s) =>
                      "isLoaded" in s &&
                      s.isLoaded &&
                      handleStatusUpdate1(s as AVPlaybackStatusSuccess)
                    }
                  />
                  {loading1 && (
                    <View style={styles.videoLoadingOverlay}>
                      <ActivityIndicator size="large" color="#fff" />
                      <Text style={styles.videoLoadingText}>Loading…</Text>
                    </View>
                  )}
                </View>

                <View style={styles.videoHalfBottom}>
                  <Video
                    ref={player2}
                    source={{ uri: video2 }}
                    style={styles.video}
                    resizeMode="contain"
                    useNativeControls={false}
                    onLoadStart={() => {
                      setLoading2(true);
                    }}
                    onLoad={() => {
                      setLoading2(false);
                      setReady2(true);
                    }}
                    onPlaybackStatusUpdate={(s) =>
                      "isLoaded" in s &&
                      s.isLoaded &&
                      handleStatusUpdate2(s as AVPlaybackStatusSuccess)
                    }
                  />
                  {loading2 && (
                    <View style={styles.videoLoadingOverlay}>
                      <ActivityIndicator size="large" color="#fff" />
                      <Text style={styles.videoLoadingText}>Loading…</Text>
                    </View>
                  )}
                </View>
              </>
            ) : (
              // GHOST OVERLAY VIEW
              <View style={styles.ghostFrame}>
                {!swapGhost ? (
                  <>
                    <Video
                      ref={player1}
                      source={{ uri: video1 }}
                      style={styles.video}
                      resizeMode="contain"
                      useNativeControls={false}
                      onLoadStart={() => {
                        setLoading1(true);
                      }}
                      onLoad={(status) => {
                        const s = status as AVPlaybackStatusSuccess;
                        const d =
                          s.durationMillis ??
                          s.playableDurationMillis ??
                          duration ??
                          1;
                        setDuration(d);
                        setLoading1(false);
                        setReady1(true);
                      }}
                      onPlaybackStatusUpdate={(s) =>
                        "isLoaded" in s &&
                        s.isLoaded &&
                        handleStatusUpdate1(s as AVPlaybackStatusSuccess)
                      }
                    />
                    <Video
                      ref={player2}
                      source={{ uri: video2 }}
                      style={[styles.video, { opacity: ghostOpacity }]}
                      resizeMode="contain"
                      useNativeControls={false}
                      onLoadStart={() => {
                        setLoading2(true);
                      }}
                      onLoad={() => {
                        setLoading2(false);
                        setReady2(true);
                      }}
                      onPlaybackStatusUpdate={(s) =>
                        "isLoaded" in s &&
                        s.isLoaded &&
                        handleStatusUpdate2(s as AVPlaybackStatusSuccess)
                      }
                    />
                  </>
                ) : (
                  <>
                    <Video
                      ref={player2}
                      source={{ uri: video2 }}
                      style={styles.video}
                      resizeMode="contain"
                      useNativeControls={false}
                      onLoadStart={() => {
                        setLoading2(true);
                      }}
                      onLoad={() => {
                        setLoading2(false);
                        setReady2(true);
                      }}
                      onPlaybackStatusUpdate={(s) =>
                        "isLoaded" in s &&
                        s.isLoaded &&
                        handleStatusUpdate2(s as AVPlaybackStatusSuccess)
                      }
                    />
                    <Video
                      ref={player1}
                      source={{ uri: video1 }}
                      style={[styles.video, { opacity: ghostOpacity }]}
                      resizeMode="contain"
                      useNativeControls={false}
                      onLoadStart={() => {
                        setLoading1(true);
                      }}
                      onLoad={(status) => {
                        const s = status as AVPlaybackStatusSuccess;
                        const d =
                          s.durationMillis ??
                          s.playableDurationMillis ??
                          duration ??
                          1;
                        setDuration(d);
                        setLoading1(false);
                        setReady1(true);
                      }}
                      onPlaybackStatusUpdate={(s) =>
                        "isLoaded" in s &&
                        s.isLoaded &&
                        handleStatusUpdate1(s as AVPlaybackStatusSuccess)
                      }
                    />
                  </>
                )}

                {(loading1 || loading2) && (
                  <View style={styles.videoLoadingOverlay}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.videoLoadingText}>Loading…</Text>
                  </View>
                )}
              </View>
            )}
          </Animated.View>
        </GestureDetector>
      </View>

      {/* CONTROLS BLOCK */}
      <View style={styles.controlsBlock}>
        {/* Main playback row */}
        <View style={styles.mainRow}>
          <TouchableOpacity onPress={() => handleFrameStep("back")}>
            <Ionicons name="play-back" size={32} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handlePlayPause}>
            <Ionicons
              name={isPlaying ? "pause-circle" : "play-circle"}
              size={58}
              color="#fff"
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleFrameStep("forward")}>
            <Ionicons name="play-forward" size={32} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleRate(0.25)}>
            <Text
              style={[
                styles.rate,
                playbackRate === 0.25 && styles.rateSelected,
              ]}
            >
              ¼×
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleRate(0.5)}>
            <Text
              style={[
                styles.rate,
                playbackRate === 0.5 && styles.rateSelected,
              ]}
            >
              ½×
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleRate(1)}>
            <Text
              style={[
                styles.rate,
                playbackRate === 1 && styles.rateSelected,
              ]}
            >
              1×
            </Text>
          </TouchableOpacity>
        </View>

        {/* Scrub slider (synced with offset) */}
        <Slider
          style={styles.scrubSlider}
          minimumValue={0}
          maximumValue={duration}
          value={position}
          onSlidingComplete={handleScrub}
          minimumTrackTintColor="#fff"
          maximumTrackTintColor="#555"
          thumbTintColor="#fff"
        />

        {/* Ghost & restart controls */}
        <View style={styles.bottomRow}>
          <TouchableOpacity
            onPress={async () => {
              const next = !ghost;
              setGhost(next);
              // Re-apply sync when toggling ghost
              await syncToPosition(position);
            }}
          >
            <Ionicons
              name="layers"
              size={30}
              color={ghost ? "#fff" : "#aaa"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={async () => {
              const next = !swapGhost;
              setSwapGhost(next);
              // Re-apply sync when swapping
              await syncToPosition(position);
            }}
          >
            <Ionicons name="swap-vertical" size={30} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleReplay}>
            <Ionicons name="refresh-circle" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// STYLES
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0C10",
  },
  topBar: {
    marginTop: 55,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  menuPanel: {
    position: "absolute",
    top: 90,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    zIndex: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  menuText: {
    color: "#fff",
    fontSize: 14,
  },
  elapsedText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  videoArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  zoomContainer: {
    width: SCREEN_WIDTH * 0.96,
    alignItems: "center",
    justifyContent: "center",
  },
  videoHalfTop: {
    width: SCREEN_WIDTH * 0.95,
    height: SCREEN_HEIGHT * 0.26,
    backgroundColor: "#111",
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 10,
  },
  videoHalfBottom: {
    width: SCREEN_WIDTH * 0.95,
    height: SCREEN_HEIGHT * 0.26,
    backgroundColor: "#111",
    borderRadius: 10,
    overflow: "hidden",
  },
  ghostFrame: {
    width: SCREEN_WIDTH * 0.96,
    height: SCREEN_HEIGHT * 0.60,
    backgroundColor: "#111",
    borderRadius: 10,
    overflow: "hidden",
  },
  video: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  videoLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  videoLoadingText: {
    color: "#fff",
    marginTop: 6,
  },
  controlsBlock: {
    width: "100%",
    paddingVertical: 10,
    paddingBottom: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  mainRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    marginBottom: 8,
  },
  rate: {
    color: "#ccc",
    fontSize: 18,
    fontWeight: "700",
  },
  rateSelected: {
    color: "#fff",
    textDecorationLine: "underline",
  },
  scrubSlider: {
    width: "92%",
    alignSelf: "center",
    height: 36,
    marginBottom: 10,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
});
