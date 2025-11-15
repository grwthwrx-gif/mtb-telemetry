import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Video } from "expo-av";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";

import { PinchGestureHandler } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
} from "react-native-reanimated";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

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
  const [position, setPosition] = useState(0); // ms
  const [duration, setDuration] = useState(1); // ms
  const [ghost, setGhost] = useState(false);
  const [swapGhost, setSwapGhost] = useState(false);
  const [elapsed, setElapsed] = useState(0); // ms
  const [menuOpen, setMenuOpen] = useState(false);
  const [loaded1, setLoaded1] = useState(false);
  const [loaded2, setLoaded2] = useState(false);

  const offsetMs = offset * 1000;

  // === ZOOM STATE ===
  // Stacked: independent zoom for top and bottom
  const topScale = useSharedValue(1);
  const topBaseScale = useSharedValue(1);

  const bottomScale = useSharedValue(1);
  const bottomBaseScale = useSharedValue(1);

  // Ghost: shared zoom
  const ghostScale = useSharedValue(1);
  const ghostBaseScale = useSharedValue(1);

  const topPinchHandler = useAnimatedGestureHandler({
    onStart: () => {
      topBaseScale.value = topScale.value;
    },
    onActive: (event) => {
      let next = topBaseScale.value * event.scale;
      if (next < 1) next = 1;
      if (next > 4) next = 4;
      topScale.value = next;
    },
  });

  const bottomPinchHandler = useAnimatedGestureHandler({
    onStart: () => {
      bottomBaseScale.value = bottomScale.value;
    },
    onActive: (event) => {
      let next = bottomBaseScale.value * event.scale;
      if (next < 1) next = 1;
      if (next > 4) next = 4;
      bottomScale.value = next;
    },
  });

  const ghostPinchHandler = useAnimatedGestureHandler({
    onStart: () => {
      ghostBaseScale.value = ghostScale.value;
    },
    onActive: (event) => {
      let next = ghostBaseScale.value * event.scale;
      if (next < 1) next = 1;
      if (next > 4) next = 4;
      ghostScale.value = next;
    },
  });

  const topVideoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: topScale.value }],
  }));

  const bottomVideoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bottomScale.value }],
  }));

  const ghostVideoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ghostScale.value }],
  }));

  // Once both videos are loaded, apply sync offset
  useEffect(() => {
    async function applyOffsetOnceReady() {
      if (!loaded1 || !loaded2) return;

      setIsPlaying(false);
      setElapsed(0);
      setPosition(0);

      if (offsetMs >= 0) {
        await player1.current?.setPositionAsync(0);
        await player2.current?.setPositionAsync(offsetMs);
      } else {
        await player1.current?.setPositionAsync(-offsetMs);
        await player2.current?.setPositionAsync(0);
      }
    }
    applyOffsetOnceReady();
  }, [loaded1, loaded2, offsetMs]);

  // Play / pause both videos in sync
  const handlePlayPause = async () => {
    // If at end, rewind to synced start before replay
    if (!isPlaying && position >= duration) {
      await handleReplay(false);
    }

    if (isPlaying) {
      await player1.current?.pauseAsync();
      await player2.current?.pauseAsync();
      setIsPlaying(false);
      return;
    }

    await player1.current?.playAsync();
    await player2.current?.playAsync();
    setIsPlaying(true);
  };

  // Scrub both videos together while preserving offset
  const handleScrub = async (v: number) => {
    setPosition(v);

    if (offsetMs >= 0) {
      const p1 = Math.max(0, v);
      const p2 = Math.max(0, v + offsetMs);
      await player1.current?.setPositionAsync(p1);
      await player2.current?.setPositionAsync(p2);
    } else {
      const p1 = Math.max(0, v - offsetMs); // offsetMs is negative
      const p2 = Math.max(0, v);
      await player1.current?.setPositionAsync(p1);
      await player2.current?.setPositionAsync(p2);
    }
  };

  // Small step forward/backward in seconds
  const handleStep = async (delta: number) => {
    const newPos = Math.max(0, position + delta * 1000);
    await handleScrub(newPos);
  };

  const handleRate = async (r: number) => {
    setPlaybackRate(r);
    await player1.current?.setRateAsync(r, true);
    await player2.current?.setRateAsync(r, true);
  };

  // Track elapsed time based on player1
  useEffect(() => {
    let interval: NodeJS.Timer | null = null;

    if (isPlaying) {
      interval = setInterval(async () => {
        const s = await player1.current?.getStatusAsync();
        if (s?.positionMillis != null) {
          setElapsed(s.positionMillis);
          setPosition(s.positionMillis);

          if (s.durationMillis && s.positionMillis >= s.durationMillis) {
            setIsPlaying(false);
          }
        }
      }, 120);
    }

    return () => interval && clearInterval(interval);
  }, [isPlaying]);

  const formatTime = (ms: number) => {
    const s = ms / 1000;
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const hundredths = Math.floor((s * 100) % 100)
      .toString()
      .padStart(2, "0");
    return `${m}:${sec.toString().padStart(2, "0")}:${hundredths}`;
  };

  const ghostOpacity = 0.45;

  // Replay from synced start (respecting offset)
  const handleReplay = async (autoPlay = false) => {
    setIsPlaying(false);
    setElapsed(0);
    setPosition(0);

    if (offsetMs >= 0) {
      await player1.current?.setPositionAsync(0);
      await player2.current?.setPositionAsync(offsetMs);
    } else {
      await player1.current?.setPositionAsync(-offsetMs);
      await player2.current?.setPositionAsync(0);
    }

    if (autoPlay) {
      await player1.current?.playAsync();
      await player2.current?.playAsync();
      setIsPlaying(true);
    }
  };

  const handleRestart = () =>
    navigation.navigate("VideoSelection" as never);

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.navigate("VideoSelection" as never)}
        >
          <Ionicons name="arrow-back" size={30} color="#fff" />
        </TouchableOpacity>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={() => handleReplay(false)}>
            <Ionicons
              name="play-skip-back-circle"
              size={30}
              color="#fff"
              style={{ marginRight: 16 }}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMenuOpen((m) => !m)}>
            <Ionicons name="ellipsis-horizontal" size={30} color="#fff" />
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

      {/* Elapsed Time */}
      <View style={styles.elapsedWrapper}>
        <Text style={styles.elapsedText}>{formatTime(elapsed)}</Text>
      </View>

      {/* VIDEO AREA */}
      <View style={styles.videoArea}>
        {/* Stacked Mode */}
        {!ghost && (
          <>
            <PinchGestureHandler onGestureEvent={topPinchHandler}>
              <View style={styles.videoHalf}>
                <Animated.View style={[styles.innerVideoWrapper, topVideoStyle]}>
                  <Video
                    ref={player1}
                    source={{ uri: video1 }}
                    style={styles.videoFill}
                    resizeMode="contain"
                    onLoad={(s) => {
                      setLoaded1(true);
                      setDuration(s.durationMillis ?? 1);
                    }}
                  />
                </Animated.View>
              </View>
            </PinchGestureHandler>

            <PinchGestureHandler onGestureEvent={bottomPinchHandler}>
              <View style={styles.videoHalf}>
                <Animated.View
                  style={[styles.innerVideoWrapper, bottomVideoStyle]}
                >
                  <Video
                    ref={player2}
                    source={{ uri: video2 }}
                    style={styles.videoFill}
                    resizeMode="contain"
                    onLoad={() => setLoaded2(true)}
                  />
                </Animated.View>
              </View>
            </PinchGestureHandler>
          </>
        )}

        {/* Ghost Mode */}
        {ghost && (
          <PinchGestureHandler onGestureEvent={ghostPinchHandler}>
            <View style={styles.ghostContainer}>
              <Animated.View style={[styles.innerVideoWrapper, ghostVideoStyle]}>
                {!swapGhost ? (
                  <>
                    <Video
                      ref={player1}
                      source={{ uri: video1 }}
                      style={styles.videoFill}
                      resizeMode="contain"
                    />
                    <Video
                      ref={player2}
                      source={{ uri: video2 }}
                      style={[styles.videoFill, { opacity: ghostOpacity }]}
                      resizeMode="contain"
                    />
                  </>
                ) : (
                  <>
                    <Video
                      ref={player2}
                      source={{ uri: video2 }}
                      style={styles.videoFill}
                      resizeMode="contain"
                    />
                    <Video
                      ref={player1}
                      source={{ uri: video1 }}
                      style={[styles.videoFill, { opacity: ghostOpacity }]}
                      resizeMode="contain"
                    />
                  </>
                )}
              </Animated.View>
            </View>
          </PinchGestureHandler>
        )}
      </View>

      {/* CONTROL BLOCK */}
      <View style={styles.controlsBlock}>
        <View style={styles.mainRow}>
          <TouchableOpacity onPress={() => handleStep(-0.5)}>
            <Ionicons name="play-back" size={32} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handlePlayPause}>
            <Ionicons
              name={isPlaying ? "pause-circle" : "play-circle"}
              size={56}
              color="#fff"
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleStep(0.5)}>
            <Ionicons name="play-forward" size={32} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleRate(0.25)}>
            <Text style={styles.rate}>¼×</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleRate(0.5)}>
            <Text style={styles.rate}>½×</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleRate(1)}>
            <Text style={styles.rate}>1×</Text>
          </TouchableOpacity>
        </View>

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

        <View style={styles.bottomRow}>
          <TouchableOpacity onPress={() => setGhost(!ghost)}>
            <Ionicons
              name="layers"
              size={30}
              color={ghost ? "#fff" : "#aaa"}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setSwapGhost(!swapGhost)}>
            <Ionicons name="swap-vertical" size={30} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleReplay(true)}>
            <Ionicons name="refresh-circle" size={34} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

/* STYLES */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0C10",
  },
  topBar: {
    marginTop: 55,
    paddingHorizontal: 22,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  menuPanel: {
    position: "absolute",
    top: 90,
    right: 22,
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
  elapsedWrapper: {
    alignItems: "center",
    marginTop: 6,
    marginBottom: 4,
  },
  elapsedText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  videoArea: {
    flex: 1,
    width: "100%",
    justifyContent: "space-evenly",
    alignItems: "center",
  },
  videoHalf: {
    width: SCREEN_WIDTH * 0.95,
    height: SCREEN_HEIGHT * 0.28,
    backgroundColor: "#111",
    borderRadius: 10,
    overflow: "hidden",
  },
  ghostContainer: {
    width: SCREEN_WIDTH * 0.98,
    height: SCREEN_HEIGHT * 0.68,
    backgroundColor: "#000",
    borderRadius: 10,
    overflow: "hidden",
  },
  innerVideoWrapper: {
    width: "100%",
    height: "100%",
  },
  videoFill: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  controlsBlock: {
    width: "100%",
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  mainRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    marginBottom: 8,
  },
  rate: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
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
    paddingBottom: 4,
  },
});
