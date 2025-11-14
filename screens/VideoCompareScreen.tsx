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

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

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
  const [playbackRate, setPlaybackRate] = useState(1);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(1);
  const [ghost, setGhost] = useState(false);
  const [swapGhost, setSwapGhost] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Apply sync offset once on mount
  useEffect(() => {
    async function applyOffset() {
      await player1.current?.setPositionAsync(0);
      await player2.current?.setPositionAsync(0);

      if (offset > 0) {
        await player2.current?.setPositionAsync(offset * 1000);
      } else if (offset < 0) {
        await player1.current?.setPositionAsync(Math.abs(offset) * 1000);
      }
    }
    applyOffset();
  }, [offset]);

  // Play / pause both videos in sync
  const handlePlayPause = async () => {
    // If at end, rewind to 0 before replaying
    if (!isPlaying && position >= duration) {
      await player1.current?.setPositionAsync(0);
      await player2.current?.setPositionAsync(offset > 0 ? offset * 1000 : 0);
      if (offset < 0) {
        await player1.current?.setPositionAsync(Math.abs(offset) * 1000);
      }
      setElapsed(0);
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

  // Scrub both videos together
  const handleScrub = async (v: number) => {
    setPosition(v);
    await player1.current?.setPositionAsync(v);
    await player2.current?.setPositionAsync(v);
  };

  // Step forward/backward in seconds
  const handleStep = async (delta: number) => {
    const newPos = Math.max(0, position + delta * 1000);
    setPosition(newPos);
    await player1.current?.setPositionAsync(newPos);
    await player2.current?.setPositionAsync(newPos);
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

          if (s.positionMillis >= s.durationMillis) {
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

  const handleRestart = () => navigation.navigate("VideoSelection" as never);

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={30} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleRestart}>
          <Ionicons name="ellipsis-horizontal" size={34} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Elapsed Time */}
      <Text style={styles.elapsedText}>{formatTime(elapsed)}</Text>

      {/* VIDEO AREA */}
      <View style={styles.videoArea}>
        {/* Stacked Mode */}
        {!ghost && (
          <>
            <Video
              ref={player1}
              source={{ uri: video1 }}
              style={styles.videoHalf}
              resizeMode="contain"
              onLoad={(s) => setDuration(s.durationMillis)}
            />
            <Video
              ref={player2}
              source={{ uri: video2 }}
              style={styles.videoHalf}
              resizeMode="contain"
            />
          </>
        )}

        {/* Ghost Mode */}
        {ghost && (
          <>
            {!swapGhost ? (
              <>
                <Video
                  ref={player1}
                  source={{ uri: video1 }}
                  style={styles.fullVideo}
                  resizeMode="contain"
                />
                <View style={styles.ghostOverlayContainer}>
                  <Video
                    ref={player2}
                    source={{ uri: video2 }}
                    style={[styles.fullVideo, { opacity: ghostOpacity }]}
                    resizeMode="contain"
                  />
                  <View style={styles.ghostGlow} pointerEvents="none" />
                </View>
              </>
            ) : (
              <>
                <Video
                  ref={player2}
                  source={{ uri: video2 }}
                  style={styles.fullVideo}
                  resizeMode="contain"
                />
                <View style={styles.ghostOverlayContainer}>
                  <Video
                    ref={player1}
                    source={{ uri: video1 }}
                    style={[styles.fullVideo, { opacity: ghostOpacity }]}
                    resizeMode="contain"
                  />
                  <View style={styles.ghostGlow} pointerEvents="none" />
                </View>
              </>
            )}
          </>
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
            <Ionicons name="layers" size={30} color={ghost ? "#fff" : "#aaa"} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setSwapGhost(!swapGhost)}>
            <Ionicons name="swap-vertical" size={30} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleRestart}>
            <Ionicons name="refresh" size={30} color="#fff" />
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
  elapsedText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "600",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 5,
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
  },
  fullVideo: {
    position: "absolute",
    width: "100%",
    height: SCREEN_HEIGHT * 0.68,
  },
  ghostOverlayContainer: {
    position: "absolute",
    width: "100%",
    height: SCREEN_HEIGHT * 0.68,
  },
  ghostGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderColor: "rgba(255,255,255,0.6)",
    borderWidth: 1,
    shadowColor: "#fff",
    shadowOpacity: 0.6,
    shadowRadius: 6,
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
