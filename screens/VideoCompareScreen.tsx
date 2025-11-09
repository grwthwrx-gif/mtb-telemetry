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
import { useRoute, useNavigation } from "@react-navigation/native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function VideoCompareScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { video1, video2 } = route.params as { video1: string; video2: string };

  const player1 = useRef<Video>(null);
  const player2 = useRef<Video>(null);

  const [isSyncMode, setIsSyncMode] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [offset, setOffset] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [ghostMode, setGhostMode] = useState(false);
  const [swapGhost, setSwapGhost] = useState(false);

  // Elapsed time tracking
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isPlaying) {
      timer = setInterval(async () => {
        const status = await player1.current?.getStatusAsync();
        if (status?.positionMillis) {
          setElapsed(status.positionMillis / 1000);
        }
      }, 500);
    } else if (timer) {
      clearInterval(timer);
    }
    return () => timer && clearInterval(timer);
  }, [isPlaying]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
  };

  // --- SYNC LOGIC ---
  const handleSetAnchor = async () => {
    await player1.current?.pauseAsync();
    await player2.current?.pauseAsync();
    setIsSyncMode(true);
    setIsPlaying(false);
  };

  const handlePlayBoth = async () => {
    try {
      await player1.current?.setPositionAsync(0);
      await player2.current?.setPositionAsync(Math.max(0, offset * 1000));
      await Promise.all([
        player1.current?.playAsync(),
        player2.current?.playAsync(),
      ]);
      setIsPlaying(true);
      setIsSyncMode(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePause = async () => {
    await player1.current?.pauseAsync();
    await player2.current?.pauseAsync();
    setIsPlaying(false);
  };

  const handleToggleGhost = () => setGhostMode((p) => !p);
  const handleSwapGhost = () => setSwapGhost((p) => !p);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>compare runs</Text>

      {/* VIDEOS */}
      {!ghostMode ? (
        <View style={styles.videosStack}>
          <Video
            ref={player1}
            source={{ uri: video1 }}
            style={styles.videoHalf}
            resizeMode="contain"
            useNativeControls={false}
          />
          <Video
            ref={player2}
            source={{ uri: video2 }}
            style={styles.videoHalf}
            resizeMode="contain"
            useNativeControls={false}
          />
        </View>
      ) : (
        <View style={styles.videosOverlay}>
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
        </View>
      )}

      {/* ELAPSED TIME */}
      {!isSyncMode && (
        <View style={styles.elapsedOverlay}>
          <Text style={styles.elapsedText}>{formatTime(elapsed)}</Text>
        </View>
      )}

      {/* CONTROLS */}
      <View style={styles.controlsPanel}>
        {isSyncMode ? (
          <>
            <Text style={styles.sliderLabel}>
              Psynk offset: {offset.toFixed(2)} s
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={-3}
              maximumValue={3}
              step={0.1}
              value={offset}
              onValueChange={setOffset}
              minimumTrackTintColor="#fff"
              maximumTrackTintColor="#333"
              thumbTintColor="#fff"
            />
            <TouchableOpacity style={styles.playButton} onPress={handlePlayBoth}>
              <Ionicons name="checkmark-circle" size={64} color="#fff" />
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.playbackControls}>
            <TouchableOpacity onPress={handlePause}>
              <Ionicons name="pause-circle" size={52} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSetAnchor}>
              <Ionicons name="arrow-undo-circle" size={52} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleToggleGhost}>
              <Ionicons name="layers" size={42} color="#fff" />
            </TouchableOpacity>
            {ghostMode && (
              <TouchableOpacity onPress={handleSwapGhost}>
                <Ionicons name="swap-vertical" size={42} color="#fff" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back-circle" size={52} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0C10",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 40,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
    textTransform: "lowercase",
  },
  videosStack: {
    alignItems: "center",
  },
  videoHalf: {
    width: "90%",
    height: SCREEN_HEIGHT * 0.35,
    borderRadius: 12,
    backgroundColor: "#111",
    marginVertical: 6,
  },
  videosOverlay: {
    width: "90%",
    height: SCREEN_HEIGHT * 0.7,
    position: "relative",
  },
  videoOverlay: {
    width: "100%",
    height: "100%",
    position: "absolute",
    borderRadius: 12,
  },
  elapsedOverlay: {
    position: "absolute",
    top: 20,
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
  controlsPanel: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 20,
  },
  slider: {
    width: "85%",
    height: 40,
  },
  sliderLabel: {
    color: "#fff",
    marginBottom: 4,
  },
  playButton: {
    marginTop: 10,
  },
  playbackControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "90%",
  },
});
