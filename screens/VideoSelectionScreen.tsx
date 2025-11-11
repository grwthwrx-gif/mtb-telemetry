import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useNavigation } from "@react-navigation/native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function VideoSelectionScreen() {
  const navigation = useNavigation();

  const [video1, setVideo1] = useState<string | null>(null);
  const [video2, setVideo2] = useState<string | null>(null);
  const [anchorTime, setAnchorTime] = useState<number | null>(null);
  const [alignTime, setAlignTime] = useState<number | null>(null);
  const [phase, setPhase] = useState<"select" | "anchor" | "align" | "ready">(
    "select"
  );
  const [isPlaying, setIsPlaying] = useState(false);

  const videoRef1 = useRef<Video>(null);
  const videoRef2 = useRef<Video>(null);

  const pickVideo = async (which: number) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets?.length > 0) {
      const uri = result.assets[0].uri;
      if (which === 1) setVideo1(uri);
      else setVideo2(uri);
    }
  };

  const handleAnchorSelect = async () => {
    if (videoRef1.current) {
      const status = await videoRef1.current.getStatusAsync();
      if (status.isLoaded) {
        setAnchorTime(status.positionMillis / 1000);
        setPhase("align");
      }
    }
  };

  const handleAlignSelect = async () => {
    if (videoRef2.current && anchorTime !== null) {
      const status = await videoRef2.current.getStatusAsync();
      if (status.isLoaded) {
        const alignAt = status.positionMillis / 1000;
        setAlignTime(alignAt);

        const offset = alignAt - anchorTime; // positive = video2 starts later
        setPhase("ready");

        navigation.navigate("VideoCompare", {
          video1,
          video2,
          offset,
        });
      }
    }
  };

  const handlePlayPause = async (which: number) => {
    const ref = which === 1 ? videoRef1.current : videoRef2.current;
    if (!ref) return;
    const status = await ref.getStatusAsync();
    if (status.isPlaying) {
      await ref.pauseAsync();
      setIsPlaying(false);
    } else {
      await ref.playAsync();
      setIsPlaying(true);
    }
  };

  const handleScrub = async (which: number, value: number) => {
    const ref = which === 1 ? videoRef1.current : videoRef2.current;
    if (ref) await ref.setPositionAsync(value * 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerSafe}>
        <Text style={styles.headerText}>Sync Runs</Text>
      </View>

      {/* Video pickers */}
      <View style={styles.videosContainer}>
        <TouchableOpacity
          style={styles.videoBox}
          onPress={() => pickVideo(1)}
          activeOpacity={0.8}
        >
          {video1 ? (
            <Video
              ref={videoRef1}
              source={{ uri: video1 }}
              style={styles.video}
              resizeMode="contain"
              useNativeControls={false}
            />
          ) : (
            <Ionicons name="film-outline" size={44} color="#888" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.videoBox}
          onPress={() => pickVideo(2)}
          activeOpacity={0.8}
        >
          {video2 ? (
            <Video
              ref={videoRef2}
              source={{ uri: video2 }}
              style={styles.video}
              resizeMode="contain"
              useNativeControls={false}
            />
          ) : (
            <Ionicons name="film-outline" size={44} color="#888" />
          )}
        </TouchableOpacity>
      </View>

      {/* Phase logic */}
      {video1 && video2 && (
        <>
          {phase === "select" && (
            <View style={styles.instructions}>
              <Text style={styles.instructionText}>
                Step 1: Play and pause the top video where your rider starts the
                run.
              </Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setPhase("anchor")}
              >
                <Text style={styles.buttonText}>Start Sync</Text>
              </TouchableOpacity>
            </View>
          )}

          {phase === "anchor" && (
            <View style={styles.syncControls}>
              <Text style={styles.instructionText}>Set Anchor Frame</Text>
              <View style={styles.playControls}>
                <TouchableOpacity onPress={() => handlePlayPause(1)}>
                  <Ionicons
                    name={isPlaying ? "pause" : "play"}
                    size={36}
                    color="#fff"
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAnchorSelect}>
                  <Ionicons name="checkmark-circle" size={46} color="#fff" />
                </TouchableOpacity>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={30}
                onValueChange={(v) => handleScrub(1, v)}
                minimumTrackTintColor="#fff"
                maximumTrackTintColor="#444"
                thumbTintColor="#fff"
              />
            </View>
          )}

          {phase === "align" && (
            <View style={styles.syncControls}>
              <Text style={styles.instructionText}>
                Step 2: Align the second video to match the same point.
              </Text>
              <View style={styles.playControls}>
                <TouchableOpacity onPress={() => handlePlayPause(2)}>
                  <Ionicons
                    name={isPlaying ? "pause" : "play"}
                    size={36}
                    color="#fff"
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAlignSelect}>
                  <Ionicons name="checkmark-circle" size={46} color="#fff" />
                </TouchableOpacity>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={30}
                onValueChange={(v) => handleScrub(2, v)}
                minimumTrackTintColor="#fff"
                maximumTrackTintColor="#444"
                thumbTintColor="#fff"
              />
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0C10",
    alignItems: "center",
  },
  headerSafe: {
    marginTop: 50,
    alignItems: "center",
  },
  headerText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },
  videosContainer: {
    flexDirection: "column",
    alignItems: "center",
    marginTop: 20,
  },
  videoBox: {
    width: "90%",
    height: SCREEN_HEIGHT * 0.25,
    backgroundColor: "#111",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
  },
  video: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  instructions: {
    alignItems: "center",
    marginTop: 20,
  },
  instructionText: {
    color: "#ccc",
    textAlign: "center",
    fontSize: 16,
    marginBottom: 12,
  },
  syncControls: {
    alignItems: "center",
    marginTop: 20,
  },
  playControls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 40,
    marginBottom: 10,
  },
  actionButton: {
    backgroundColor: "#1C1F26",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  slider: {
    width: "85%",
    height: 40,
  },
});
