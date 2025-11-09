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

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function VideoCompareScreen({ navigation, route }: any) {
  const { video1, video2 } = route.params;

  const player1 = useRef<Video>(null);
  const player2 = useRef<Video>(null);

  const [mode, setMode] = useState<"anchor" | "sync" | "playback">("anchor");
  const [isPlaying, setIsPlaying] = useState(false);
  const [ghostMode, setGhostMode] = useState(false);
  const [swapGhost, setSwapGhost] = useState(false);
  const [offset, setOffset] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);

  // keep elapsed time synced
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying && player1.current) {
      interval = setInterval(async () => {
        const status = await player1.current?.getStatusAsync();
        if (status?.positionMillis)
          setElapsed(status.positionMillis / 1000);
      }, 250);
    }
    return () => interval && clearInterval(interval);
  }, [isPlaying]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
  };

  // --- Anchor mode controls
  const handleAnchorPlayPause = async () => {
    if (isPlaying) {
      await player1.current?.pauseAsync();
      setIsPlaying(false);
    } else {
      await player1.current?.playAsync();
      setIsPlaying(true);
    }
  };

  const handleConfirmAnchor = async () => {
    await player1.current?.pauseAsync();
    setIsPlaying(false);
    setMode("sync");
  };

  // --- Sync mode
  const handleOffsetChange = async (val: number) => {
    setOffset(val);
    // live scrub video2
    await player2.current?.setPositionAsync(Math.abs(val) * 1000);
  };

  const handleConfirmSync = async () => {
    await player2.current?.pauseAsync();
    setMode("playback");
    setElapsed(0);
  };

  // --- Playback controls
  const handlePlayPauseBoth = async () => {
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
    setMode("anchor");
    setIsPlaying(false);
    setGhostMode(false);
  };

  // --- Layout sections
  const renderVideos = () => {
    if (mode === "anchor" || mode === "sync") {
      return (
        <View style={styles.stackContainer}>
          <Video
            ref={player1}
            source={{ uri: video1 }}
            style={styles.videoHalf}
            resizeMode="contain"
            useNativeControls={mode === "anchor"}
            pointerEvents={mode === "sync" ? "none" : "auto"}
          />
          <Video
            ref={player2}
            source={{ uri: video2 }}
            style={styles.videoHalf}
            resizeMode="contain"
            useNativeControls={mode === "sync"}
            pointerEvents={mode === "sync" ? "auto" : "none"}
          />
        </View>
      );
    }

    // playback
    if (ghostMode) {
      return (
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
      );
    } else {
      return (
        <>
          <Video
            ref={player1}
            source={{ uri: video1 }}
            style={[styles.videoHalf, styles.topVideoAbs]}
            resizeMode="contain"
          />
          <Video
            ref={player2}
            source={{ uri: video2 }}
            style={[styles.videoHalf, styles.bottomVideoAbs]}
            resizeMode="contain"
          />
        </>
      );
    }
  };

  // --- Controls sections
  const renderControls = () => {
    if (mode === "anchor") {
      return (
        <View style={styles.controls}>
          <Text style={styles.header}>Set Anchor Frame</Text>
          <View style={styles.row}>
            <TouchableOpacity onPress={handleAnchorPlayPause}>
              <Ionicons
                name={isPlaying ? "pause-circle" : "play-circle"}
                size={56}
                color="#fff"
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleConfirmAnchor}>
              <Ionicons name="checkmark-circle" size={56} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (mode === "sync") {
      return (
        <View style={styles.controls}>
          <Text style={styles.header}>Adjust Sync</Text>
          <Text style={styles.subText}>
            Offset: {offset.toFixed(2)} s
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={-3}
            maximumValue={3}
            step={0.1}
            value={offset}
            onValueChange={handleOffsetChange}
            minimumTrackTintColor="#fff"
            maximumTrackTintColor="#333"
            thumbTintColor="#fff"
          />
          <TouchableOpacity onPress={handleConfirmSync}>
            <Ionicons name="checkmark-circle" size={56} color="#fff" />
          </TouchableOpacity>
        </View>
      );
    }

    if (mode === "playback") {
      return (
        <View style={styles.controls}>
          <View style={styles.playbackRow}>
            <TouchableOpacity onPress={handlePlayPauseBoth}>
              <Ionicons
                name={isPlaying ? "pause-circle" : "play-circle"}
                size={52}
                color="#fff"
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPlaybackRate(0.5)}>
              <Text style={styles.rateText}>½×</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPlaybackRate(0.25)}>
              <Text style={styles.rateText}>¼×</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setGhostMode((g) => !g)}>
              <Ionicons
                name="layers"
                size={36}
                color={ghostMode ? "#fff" : "rgba(255,255,255,0.6)"}
              />
            </TouchableOpacity>
            {ghostMode && (
              <TouchableOpacity onPress={() => setSwapGhost((p) => !p)}>
                <Ionicons name="swap-vertical" size={36} color="#fff" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleRestart}>
              <Ionicons name="arrow-undo" size={36} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      );
    }
  };

  return (
    <Pressable style={styles.container}>
      {mode === "playback" && (
        <View style={styles.elapsedOverlay}>
          <Text style={styles.elapsedText}>{formatTime(elapsed)}</Text>
        </View>
      )}
      {renderVideos()}
      {renderControls()}
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
  stackContainer: {
    flex: 1,
    width: "100%",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  videoHalf: {
    width: "100%",
    height: SCREEN_HEIGHT / 2.2,
    backgroundColor: "#111",
    marginVertical: 4,
  },
  topVideoAbs: {
    position: "absolute",
    top: 0,
  },
  bottomVideoAbs: {
    position: "absolute",
    bottom: 0,
  },
  videoOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  controls: {
    position: "absolute",
    bottom: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  subText: {
    color: "#aaa",
    marginBottom: 6,
  },
  row: { flexDirection: "row", gap: 40 },
  slider: { width: 280, marginVertical: 12 },
  playbackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    backgroundColor: "rgba(0,0,0,0.25)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 40,
  },
  rateText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
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
});
