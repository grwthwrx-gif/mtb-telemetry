import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Alert,
  Animated,
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
  const [offset, setOffset] = useState<number>(0);
  const [phase, setPhase] = useState<
    "select" | "anchor" | "align" | "preview" | "ready"
  >("select");
  const [isPlaying1, setIsPlaying1] = useState(false);
  const [isPlaying2, setIsPlaying2] = useState(false);

  const videoRef1 = useRef<Video>(null);
  const videoRef2 = useRef<Video>(null);

  // Toast animation
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    Animated.sequence([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.delay(1500),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const pickVideo = async (which: number) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        if (which === 1) {
          setVideo1(uri);
        } else {
          setVideo2(uri);
        }
      } else {
        console.log("Video selection cancelled");
      }
    } catch (error) {
      console.warn("Video pick error:", error);
      Alert.alert("Error", "There was a problem selecting the video.");
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

        const calculatedOffset = alignAt - anchorTime;
        setOffset(calculatedOffset);
        showToast(`Psynk offset: ${calculatedOffset.toFixed(2)}s`);
        setPhase("preview");
      }
    }
  };

  const handlePlayPause = async (which: number) => {
    const ref = which === 1 ? videoRef1.current : videoRef2.current;
    if (!ref) return;
    const status = await ref.getStatusAsync();
    if (status.isPlaying) {
      await ref.pauseAsync();
      which === 1 ? setIsPlaying1(false) : setIsPlaying2(false);
    } else {
      await ref.playAsync();
      which === 1 ? setIsPlaying1(true) : setIsPlaying2(true);
    }
  };

  const handleScrub = async (which: number, value: number) => {
    const ref = which === 1 ? videoRef1.current : videoRef2.current;
    if (ref) await ref.setPositionAsync(value * 1000);
  };

  const handlePreviewPlay = async () => {
    if (videoRef1.current && videoRef2.current) {
      await videoRef1.current.setPositionAsync(0);
      await videoRef2.current.setPositionAsync(Math.max(0, offset * 1000));
      await Promise.all([
        videoRef1.current.playAsync(),
        videoRef2.current.playAsync(),
      ]);
      setPhase("ready");
    }
  };

  const handleGoToCompare = () => {
    navigation.navigate("VideoCompare", { video1, video2, offset });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerSafe}>
        <Text style={styles.headerText}>Sync Runs</Text>
      </View>

      {/* Toast */}
      <Animated.View
        style={[
          styles.toast,
          {
            opacity: toastOpacity,
            transform: [
              {
                translateY: toastOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.toastText}>{toastMessage}</Text>
      </Animated.View>

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
            <>
              <Ionicons name="film-outline" size={44} color="#888" />
              <Text style={styles.addText}>Select Top Run</Text>
            </>
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
            <>
              <Ionicons name="film-outline" size={44} color="#888" />
              <Text style={styles.addText}>Select Bottom Run</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Sync Phases */}
      {video1 && video2 && (
        <>
          {phase === "select" && (
            <View style={styles.instructions}>
              <Text style={styles.instructionText}>
                Step 1: Play the top video and pause where the rider starts.
              </Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setPhase("anchor")}
              >
                <Text style={styles.buttonText}>Set Anchor</Text>
              </TouchableOpacity>
            </View>
          )}

          {phase === "anchor" && (
            <View style={styles.syncControls}>
              <Text style={styles.instructionText}>Set Anchor Frame</Text>
              <View style={styles.playControls}>
                <TouchableOpacity onPress={() => handlePlayPause(1)}>
                  <Ionicons
                    name={isPlaying1 ? "pause" : "play"}
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
                Step 2: Align bottom video to the same moment.
              </Text>
              <View style={styles.playControls}>
                <TouchableOpacity onPress={() => handlePlayPause(2)}>
                  <Ionicons
                    name={isPlaying2 ? "pause" : "play"}
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

          {phase === "preview" && (
            <View style={styles.instructions}>
              <Text style={styles.instructionText}>
                Preview synced playback before confirming.
              </Text>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handlePreviewPlay}
              >
                <Ionicons name="play-circle" size={28} color="#fff" />
                <Text style={styles.buttonText}> Preview Sync</Text>
              </TouchableOpacity>
            </View>
          )}

          {phase === "ready" && (
            <View style={styles.instructions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#2ECC71" }]}
                onPress={handleGoToCompare}
              >
                <Text style={styles.buttonText}>Confirm & Compare</Text>
              </TouchableOpacity>
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
  toast: {
    position: "absolute",
    top: 90,
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  toastText: {
    color: "#fff",
    fontSize: 14,
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
  addText: {
    color: "#666",
    marginTop: 6,
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
    flexDirection: "row",
    alignItems: "center",
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
