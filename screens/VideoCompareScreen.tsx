import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Pressable,
} from "react-native";
import { Video } from "expo-av";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useRoute, useNavigation } from "@react-navigation/native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type Mode = "anchor" | "sync" | "playback";

export default function VideoCompareScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { video1, video2 } = route.params as { video1: string; video2: string };

  const player1 = useRef<Video>(null);
  const player2 = useRef<Video>(null);

  const [mode, setMode] = useState<Mode>("anchor");
  const [isPlaying, setIsPlaying] = useState(false);
  const [offset, setOffset] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [ghostMode, setGhostMode] = useState(false);
  const [swapGhost, setSwapGhost] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  // track elapsed time only when playing
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPlaying) {
      timer = setInterval(async () => {
        const s = await player1.current?.getStatusAsync();
        if (s?.positionMillis) setElapsed(s.positionMillis / 1000);
      }, 250);
    }
    return () => timer && clearInterval(timer);
  }, [isPlaying]);

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // --- Stage Logic ---

  const handleSetAnchor = async () => {
    await player1.current?.pauseAsync();
    setMode("sync");
  };

  const handleConfirmSync = async () => {
    if (offset > 0) {
      await player2.current?.setPositionAsync(offset * 1000);
    } else if (offset < 0) {
      await player1.current?.setPositionAsync(Math.abs(offset) * 1000);
    }
    setMode("playback");
    setElapsed(0);
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
  };

  const handleRestart = async () => {
    await player1.current?.setPositionAsync(0);
    await player2.current?.setPositionAsync(0);
    setElapsed(0);
  };

  const handleReSync = async () => {
    await player1.current?.pauseAsync();
    await player2.current?.pauseAsync();
    setIsPlaying(false);
    setMode("sync");
  };

  const handleRate = async (rate: number) => {
    setPlaybackRate(rate);
    await player1.current?.setRateAsync(rate, true);
    await player2.current?.setRateAsync(rate, true);
  };

  const stepFrames = async (dir: number) => {
    const s = await player2.current?.getStatusAsync();
    const pos = (s?.positionMillis || 0) + dir * 100;
    await player2.current?.setPositionAsync(Math.max(0, pos));
  };

  const handleGhostToggle = () => setGhostMode((p) => !p);
  const handleSwapGhost = () => setSwapGhost((p) => !p);

  const handleBack = async () => {
    await player1.current?.stopAsync();
    await player2.current?.stopAsync();
    navigation.goBack();
  };

  // --- Render ---

  return (
    <Pressable style={styles.container}>
      {/* === ANCHOR MODE === */}
      {mode === "anchor" && (
        <Animated.View
          entering={FadeIn.duration(400)}
          exiting={FadeOut.duration(300)}
          style={styles.modeContainer}
        >
          <Text style={styles.title}>Set Anchor Frame</Text>
          <Video
            ref={player1}
            source={{ uri: video1 }}
            style={styles.videoLarge}
            useNativeControls
            resizeMode="contain"
          />
          <TouchableOpacity style={styles.bigButton} onPress={handleSetAnchor}>
            <Ionicons name="checkmark-circle" size={70} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* === SYNC MODE === */}
      {mode === "sync" && (
        <Animated.View
          entering={FadeIn.duration(400)}
          exiting={FadeOut.duration(300)}
          style={styles.modeContainer}
        >
          <Text style={styles.title}>Adjust Psynk Offset</Text>
          <Video
            ref={player2}
            source={{ uri: video2 }}
            style={styles.videoLarge}
            useNativeControls
            resizeMode="contain"
          />
          <View style={styles.syncControls}>
            <Text style={styles.offsetText}>
              Psynk Offset: {offset.toFixed(2)}s
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={-3}
              maximumValue={3}
              step={0.05}
              value={offset}
              onValueChange={setOffset}
              minimumTrackTintColor="#fff"
              maximumTrackTintColor="#444"
              thumbTintColor="#fff"
            />
            <View style={styles.frameButtons}>
              <TouchableOpacity onPress={() => stepFrames(-1)}>
                <Ionicons name="play-back" size={32} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => stepFrames(1)}>
                <Ionicons name="play-forward" size={32} color="#fff" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.bigButton}
              onPress={handleConfirmSync}
            >
              <Ionicons name="checkmark-done-circle" size={70} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* === PLAYBACK MODE === */}
      {mode === "playback" && (
        <Animated.View
          entering={FadeIn.duration(400)}
          exiting={FadeOut.duration(300)}
          style={styles.playbackContainer}
        >
          {/* Video stack */}
          {!ghostMode ? (
            <>
              <Video
                ref={player1}
                source={{ uri: video1 }}
                style={[styles.videoHalf, { top: 0 }]}
                resizeMode="contain"
              />
              <Video
                ref={player2}
                source={{ uri: video2 }}
                style={[styles.videoHalf, { bottom: 0 }]}
                resizeMode="contain"
              />
            </>
          ) : swapGhost ? (
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

          {/* Elapsed time */}
          <View style={styles.elapsedOverlay}>
            <Text style={styles.elapsedText}>{formatTime(elapsed)}</Text>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <View style={styles.controlRow}>
              <TouchableOpacity onPress={handlePlayPause}>
                <Ionicons
                  name={
                    isPlaying ? "pause-circle" : "play-circle"
                  }
                  size={50}
                  color="#fff"
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRestart}>
                <Ionicons name="refresh" size={34} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleReSync}>
                <Ionicons name="navigate-circle" size={34} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.controlRow}>
              <TouchableOpacity onPress={() => handleRate(1)}>
                <Text style={styles.rateText}>1×</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleRate(0.5)}>
                <Text style={styles.rateText}>½×</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleRate(0.25)}>
                <Text style={styles.rateText}>¼×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.controlRow}>
              <TouchableOpacity onPress={handleGhostToggle}>
                <Ionicons
                  name="layers"
                  size={30}
                  color={ghostMode ? "#fff" : "rgba(255,255,255,0.6)"}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSwapGhost}>
                <Ionicons name="swap-vertical" size={30} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleBack}>
                <Ionicons name="arrow-undo" size={30} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
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
  modeContainer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingVertical: 40,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  videoLarge: {
    width: "90%",
    height: SCREEN_HEIGHT * 0.4,
    borderRadius: 12,
    backgroundColor: "#111",
  },
  bigButton: {
    marginTop: 10,
  },
  syncControls: {
    alignItems: "center",
    width: "90%",
  },
  offsetText: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 6,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  frameButtons: {
    flexDirection: "row",
    gap: 40,
    marginVertical: 10,
  },
  playbackContainer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  videoHalf: {
    position: "absolute",
    width: "100%",
    height: SCREEN_HEIGHT / 2,
    backgroundColor: "#111",
  },
  videoOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
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
  },
  controls: {
    position: "absolute",
    bottom: 35,
    width: "90%",
    alignItems: "center",
  },
  controlRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 30,
    marginVertical: 8,
  },
  rateText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
