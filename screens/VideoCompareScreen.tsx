import React, { useRef, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useRoute, useNavigation } from "@react-navigation/native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function VideoCompareScreen() {
  const route = useRoute();
  const navigation = useNavigation();

  const { video1, video2, offset = 0 } = (route.params ??
    {}) as { video1?: string; video2?: string; offset?: number };

  const player1 = useRef<Video>(null);
  const player2 = useRef<Video>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  const [v1Ready, setV1Ready] = useState(false);
  const [v2Ready, setV2Ready] = useState(false);

  // ---- Helpers
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
  };

  // Keep elapsed/slider in sync while playing
  useEffect(() => {
    let id: NodeJS.Timeout | null = null;
    if (isPlaying) {
      id = setInterval(async () => {
        const s1 = await player1.current?.getStatusAsync();
        if (s1?.positionMillis != null && s1?.durationMillis != null) {
          setElapsed(s1.positionMillis / 1000);
          setPosition(s1.positionMillis);
          setDuration(s1.durationMillis);
        }
      }, 250);
    }
    return () => {
      if (id) clearInterval(id);
    };
  }, [isPlaying]);

  // Apply initial seeks when both videos report ready
  useEffect(() => {
    const init = async () => {
      try {
        // Always show first frames
        await player1.current?.setPositionAsync(0);
        await player2.current?.setPositionAsync(0);

        // Apply offset visually before first play
        if (offset > 0) {
          // video2 starts later
          await player2.current?.setPositionAsync(offset * 1000);
        } else if (offset < 0) {
          // video1 starts later
          await player1.current?.setPositionAsync(Math.abs(offset) * 1000);
        }

        // Make sure both are paused initially
        await player1.current?.pauseAsync();
        await player2.current?.pauseAsync();
        setIsPlaying(false);
      } catch (e) {
        console.warn("Initial seek error:", e);
      }
    };

    if (v1Ready && v2Ready) init();
  }, [v1Ready, v2Ready, offset]);

  const handlePlayPause = async () => {
    try {
      if (isPlaying) {
        await player1.current?.pauseAsync();
        await player2.current?.pauseAsync();
        setIsPlaying(false);
      } else {
        // Ensure offset alignment each time play is pressed
        const s1 = await player1.current?.getStatusAsync();
        const s2 = await player2.current?.getStatusAsync();

        const base = Math.max(s1?.positionMillis ?? 0, 0);
        // align player2 relative to player1 by offset
        const p2 = base + offset * 1000;
        const p1 = base;

        await player1.current?.setPositionAsync(Math.max(p1, 0));
        await player2.current?.setPositionAsync(Math.max(p2, 0));

        await player1.current?.playAsync();
        await player2.current?.playAsync();
        setIsPlaying(true);
      }
    } catch (e) {
      console.warn("Play/pause error:", e);
    }
  };

  const handleScrub = async (valueMs: number) => {
    try {
      const p1 = Math.max(valueMs, 0);
      const p2 = Math.max(valueMs + offset * 1000, 0);
      await player1.current?.setPositionAsync(p1);
      await player2.current?.setPositionAsync(p2);
      setPosition(p1);
      setElapsed(p1 / 1000);
    } catch (e) {
      console.warn("Scrub error:", e);
    }
  };

  const handleRateChange = async (rate: number) => {
    setPlaybackRate(rate);
    await player1.current?.setRateAsync(rate, true);
    await player2.current?.setRateAsync(rate, true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { /* menu placeholder */ }}>
          <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* VIDEOS */}
      <View style={styles.videoStack}>
        <Video
          ref={player1}
          source={video1 ? { uri: video1 } : undefined}
          style={styles.videoHalf}
          resizeMode="contain"
          useNativeControls={false}
          onLoad={(s) => {
            setDuration(s?.durationMillis ?? 0);
            setV1Ready(true);
          }}
          onError={(e) => console.warn("Video1 error:", e)}
        />
        <Video
          ref={player2}
          source={video2 ? { uri: video2 } : undefined}
          style={styles.videoHalf}
          resizeMode="contain"
          useNativeControls={false}
          onLoad={() => setV2Ready(true)}
          onError={(e) => console.warn("Video2 error:", e)}
        />
      </View>

      {/* ELAPSED TIME */}
      <View style={styles.elapsedOverlay}>
        <Text style={styles.elapsedText}>{formatTime(elapsed)}</Text>
      </View>

      {/* CONTROLS */}
      <View style={styles.controls}>
        <View style={styles.playbackRow}>
          <TouchableOpacity onPress={handlePlayPause}>
            <Ionicons
              name={isPlaying ? "pause-circle-outline" : "play-circle-outline"}
              size={58}
              color="#fff"
            />
          </TouchableOpacity>
        </View>

        {/* Scrub Slider (milliseconds) */}
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={Math.max(duration, 1)}
          value={position}
          onSlidingComplete={handleScrub}
          minimumTrackTintColor="#fff"
          maximumTrackTintColor="#555"
          thumbTintColor="#fff"
        />

        <View style={styles.rateControls}>
          <TouchableOpacity onPress={() => handleRateChange(0.25)}>
            <Text style={styles.rateText}>¼×</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleRateChange(0.5)}>
            <Text style={styles.rateText}>½×</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleRateChange(1)}>
            <Text style={styles.rateText}>1×</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleRateChange(1.5)}>
            <Text style={styles.rateText}>1.5×</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0C10",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    position: "absolute",
    top: 8,
    width: "92%",
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 10,
  },
  videoStack: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40, // leave room for header
  },
  videoHalf: {
    width: "92%",
    height: SCREEN_HEIGHT * 0.28,
    borderRadius: 10,
    backgroundColor: "#111",
    marginVertical: 8,
  },
  elapsedOverlay: {
    position: "absolute",
    top: 48,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  elapsedText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  controls: {
    width: "92%",
    alignItems: "center",
    marginBottom: 24,
  },
  playbackRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  rateControls: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "80%",
    marginTop: 6,
  },
  rateText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
