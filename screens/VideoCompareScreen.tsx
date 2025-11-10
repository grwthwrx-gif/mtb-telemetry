import React, { useRef, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
} from "react-native";
import { Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useRoute, useNavigation } from "@react-navigation/native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

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
  const [elapsed, setElapsed] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  // Elapsed timer sync
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(async () => {
        const status = await player1.current?.getStatusAsync();
        if (status?.positionMillis && status?.durationMillis) {
          setElapsed(status.positionMillis / 1000);
          setPosition(status.positionMillis);
          setDuration(status.durationMillis);
        }
      }, 250);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => interval && clearInterval(interval);
  }, [isPlaying]);

  // Format time (mm:ss)
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const handlePlayPause = async () => {
    if (isPlaying) {
      await player1.current?.pauseAsync();
      await player2.current?.pauseAsync();
      setIsPlaying(false);
    } else {
      // Sync offset
      if (offset > 0) await player2.current?.setPositionAsync(offset * 1000);
      else if (offset < 0) await player1.current?.setPositionAsync(Math.abs(offset) * 1000);

      await player1.current?.playAsync();
      await player2.current?.playAsync();
      setIsPlaying(true);
    }
  };

  const handleScrub = async (value: number) => {
    await player1.current?.setPositionAsync(value);
    await player2.current?.setPositionAsync(value);
  };

  const handleRateChange = async (rate: number) => {
    setPlaybackRate(rate);
    await player1.current?.setRateAsync(rate, true);
    await player2.current?.setRateAsync(rate, true);
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {}}>
          <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* VIDEOS */}
      <View style={styles.videoStack}>
        <Video
          ref={player1}
          source={{ uri: video1 }}
          style={styles.videoHalf}
          resizeMode="contain"
        />
        <Video
          ref={player2}
          source={{ uri: video2 }}
          style={styles.videoHalf}
          resizeMode="contain"
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

        {/* Scrub Slider */}
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration}
          value={position}
          onValueChange={handleScrub}
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
  header: {
    position: "absolute",
    top: 40,
    width: "90%",
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 10,
  },
  videoStack: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  videoHalf: {
    width: "90%",
    height: SCREEN_HEIGHT * 0.3,
    borderRadius: 10,
    backgroundColor: "#111",
    marginVertical: 10,
  },
  elapsedOverlay: {
    position: "absolute",
    top: 100,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
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
    width: "90%",
    alignItems: "center",
    marginBottom: 40,
  },
  playbackRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  rateControls: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "80%",
    marginTop: 10,
  },
  rateText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});
