import React, { useRef, useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useRoute, useNavigation } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");

export default function VideoCompareScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { video1, video2 } = route.params as { video1: string; video2: string };

  const player1 = useRef<Video>(null);
  const player2 = useRef<Video>(null);

  const [offset, setOffset] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  // Update elapsed time continuously
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(async () => {
        const s1 = await player1.current?.getStatusAsync();
        if (s1?.positionMillis) {
          setElapsed(s1.positionMillis / 1000);
        }
      }, 200);
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

  const handleSyncAndPlay = async () => {
    try {
      await player1.current?.setPositionAsync(0);
      await player2.current?.setPositionAsync(0);
      if (offset > 0) {
        await player2.current?.setPositionAsync(offset * 1000);
      } else if (offset < 0) {
        await player1.current?.setPositionAsync(Math.abs(offset) * 1000);
      }
      await Promise.all([
        player1.current?.playAsync(),
        player2.current?.playAsync(),
      ]);
      setIsPlaying(true);
      setElapsed(0);
    } catch (e) {
      console.error("Sync error:", e);
    }
  };

  const handlePlayPause = async () => {
    if (isPlaying) {
      await player1.current?.pauseAsync();
      await player2.current?.pauseAsync();
      setIsPlaying(false);
    } else {
      await Promise.all([
        player1.current?.playAsync(),
        player2.current?.playAsync(),
      ]);
      setIsPlaying(true);
    }
  };

  const handleReplay = async () => {
    await player1.current?.setPositionAsync(0);
    await player2.current?.setPositionAsync(0);
    await Promise.all([
      player1.current?.playAsync(),
      player2.current?.playAsync(),
    ]);
    setIsPlaying(true);
    setElapsed(0);
  };

  const handleRateChange = async () => {
    const newRate = playbackRate === 1 ? 0.5 : playbackRate === 0.5 ? 0.25 : 1;
    setPlaybackRate(newRate);
    await player1.current?.setRateAsync(newRate, true);
    await player2.current?.setRateAsync(newRate, true);
  };

  const handleScrub = async (value: number) => {
    const newPos = value * 1000;
    await player1.current?.setPositionAsync(newPos);
    await player2.current?.setPositionAsync(newPos + offset * 1000);
    setElapsed(value);
  };

  const handleBack = () => {
    navigation.navigate("VideoSelection" as never);
  };

  return (
    <View style={styles.container}>
      {/* Videos vertically stacked */}
      <Video
        ref={player1}
        source={{ uri: video1 }}
        style={styles.video}
        resizeMode="contain"
        useNativeControls={false}
        onLoad={(s) => setDuration(s.durationMillis / 1000)}
      />
      <Video
        ref={player2}
        source={{ uri: video2 }}
        style={styles.video}
        resizeMode="contain"
        useNativeControls={false}
      />

      {/* Elapsed Time */}
      {isPlaying && (
        <View style={styles.elapsedOverlay}>
          <Text style={styles.elapsedText}>{formatTime(elapsed)}</Text>
        </View>
      )}

      {/* Sync Slider */}
      <View style={styles.syncControls}>
        <Text style={styles.label}>Psynk offset: {offset.toFixed(2)} s</Text>
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
      </View>

      {/* Playback Controls */}
      <View style={styles.playbackPanel}>
        <TouchableOpacity onPress={handleSyncAndPlay}>
          <Ionicons name="checkmark-circle-outline" size={46} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleReplay}>
          <Ionicons name="refresh-circle-outline" size={46} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={handlePlayPause}>
          <Ionicons
            name={isPlaying ? "pause-circle-outline" : "play-circle-outline"}
            size={56}
            color="#fff"
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleRateChange}>
          <Text style={styles.rateText}>
            {playbackRate === 1 ? "1×" : playbackRate === 0.5 ? "½×" : "¼×"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-undo-outline" size={46} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Scrub Slider */}
      <Slider
        style={styles.scrubSlider}
        minimumValue={0}
        maximumValue={duration}
        step={0.05}
        value={elapsed}
        onSlidingComplete={handleScrub}
        minimumTrackTintColor="#fff"
        maximumTrackTintColor="#444"
        thumbTintColor="#fff"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0C10",
    alignItems: "center",
    justifyContent: "center",
  },
  video: {
    width: width * 0.9,
    height: height * 0.27,
    borderRadius: 10,
    backgroundColor: "#111",
    marginVertical: 6,
  },
  elapsedOverlay: {
    position: "absolute",
    top: 35,
    right: 25,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  elapsedText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  syncControls: {
    alignItems: "center",
    marginTop: 5,
  },
  label: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  slider: {
    width: width * 0.8,
    height: 40,
  },
  playbackPanel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: width * 0.9,
    marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 30,
    paddingVertical: 8,
  },
  rateText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  scrubSlider: {
    width: width * 0.9,
    height: 40,
    marginTop: 10,
  },
});
