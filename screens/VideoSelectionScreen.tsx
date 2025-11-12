import React, { useState, useRef } from "react";
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
import { Video, AVPlaybackStatusSuccess } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useNavigation } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");

type Phase = "select1" | "anchor" | "select2" | "align" | "ready";

export default function VideoSelectionScreen() {
  const navigation = useNavigation();
  const [video1, setVideo1] = useState<string | null>(null);
  const [video2, setVideo2] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("select1");
  const [anchorTime, setAnchorTime] = useState<number | null>(null);
  const [offset, setOffset] = useState<number>(0);
  const [instruction, setInstruction] = useState("Select your first run video");

  const v1 = useRef<Video>(null);
  const v2 = useRef<Video>(null);
  const [duration1, setDuration1] = useState(0);
  const [duration2, setDuration2] = useState(0);
  const [pos1, setPos1] = useState(0);
  const [pos2, setPos2] = useState(0);
  const [isPlaying1, setIsPlaying1] = useState(false);
  const [isPlaying2, setIsPlaying2] = useState(false);

  const toastOpacity = useRef(new Animated.Value(0)).current;
  const [toastText, setToastText] = useState("");

  const showToast = (msg: string) => {
    setToastText(msg);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1200),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const pickVideo = async (which: 1 | 2) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow photo access to select videos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      if (which === 1) {
        setVideo1(uri);
        setPhase("anchor");
        setInstruction("Scrub to your anchor frame, then tap ✓ to confirm.");
      } else {
        setVideo2(uri);
        setPhase("align");
        setInstruction("Scrub to match anchor frame from Run 1, then tap ✓.");
      }
    }
  };

  const onLoad1 = (s: AVPlaybackStatusSuccess) => {
    setDuration1((s.durationMillis ?? 0) / 1000);
  };
  const onLoad2 = (s: AVPlaybackStatusSuccess) => {
    setDuration2((s.durationMillis ?? 0) / 1000);
  };

  const onStatus1 = (s: AVPlaybackStatusSuccess) => {
    if (s.isLoaded) {
      setPos1((s.positionMillis ?? 0) / 1000);
      setIsPlaying1(s.isPlaying);
    }
  };
  const onStatus2 = (s: AVPlaybackStatusSuccess) => {
    if (s.isLoaded) {
      setPos2((s.positionMillis ?? 0) / 1000);
      setIsPlaying2(s.isPlaying);
    }
  };

  const togglePlay = async (which: 1 | 2) => {
    const ref = which === 1 ? v1.current : v2.current;
    if (!ref) return;
    const s = (await ref.getStatusAsync()) as AVPlaybackStatusSuccess;
    if (s.isPlaying) {
      await ref.pauseAsync();
    } else {
      await ref.playAsync();
    }
  };

  const scrub = async (which: 1 | 2, v: number) => {
    const ref = which === 1 ? v1.current : v2.current;
    if (ref) await ref.setPositionAsync(v * 1000);
  };

  const confirmAnchor = async () => {
    if (!v1.current) return;
    const s = (await v1.current.getStatusAsync()) as AVPlaybackStatusSuccess;
    if (s.isLoaded) {
      setAnchorTime((s.positionMillis ?? 0) / 1000);
      setInstruction("Now select your second run video.");
      showToast("Anchor frame set.");
      setPhase("select2");
    }
  };

  const confirmAlign = async () => {
    if (!v2.current || anchorTime == null) return;
    const s = (await v2.current.getStatusAsync()) as AVPlaybackStatusSuccess;
    if (s.isLoaded) {
      const alignAt = (s.positionMillis ?? 0) / 1000;
      const off = alignAt - anchorTime;
      setOffset(off);
      showToast(`Psynk offset: ${off.toFixed(2)}s`);
      setInstruction("Ready! Tap ✓ to preview both runs together.");
      setPhase("ready");
    }
  };

  const goToCompare = () => {
    navigation.navigate("VideoCompare" as never, { video1, video2, offset } as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Ionicons name="chevron-back" size={26} color="#fff" />
        <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
      </View>

      {/* Toast */}
      <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
        <Text style={styles.toastText}>{toastText}</Text>
      </Animated.View>

      <View style={styles.content}>
        {/* Video 1 */}
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.videoBox, !video1 && { backgroundColor: "#1A1A1A" }]}
            onPress={() => pickVideo(1)}
            activeOpacity={0.8}
          >
            {video1 ? (
              <Video
                ref={v1}
                source={{ uri: video1 }}
                style={styles.video}
                resizeMode="contain"
                onLoad={(s) => onLoad1(s as AVPlaybackStatusSuccess)}
                onPlaybackStatusUpdate={(s) => "isLoaded" in s && s.isLoaded && onStatus1(s)}
                useNativeControls={false}
              />
            ) : (
              <View style={styles.placeholder}>
                <Ionicons name="film-outline" size={44} color="#999" />
                <Text style={styles.placeholderText}>Select Top Run</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.instructionsColumn}>
            {phase === "select1" && <Text style={styles.instructionText}>{instruction}</Text>}
            {phase === "anchor" && (
              <Text style={styles.instructionText}>Scrub to your anchor frame → ✓ confirm</Text>
            )}
          </View>
        </View>

        {phase === "anchor" && (
          <>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={duration1}
              value={pos1}
              onValueChange={(v) => scrub(1, v)}
              minimumTrackTintColor="#fff"
              maximumTrackTintColor="#333"
              thumbTintColor="#fff"
            />
            <View style={styles.controls}>
              <TouchableOpacity onPress={() => togglePlay(1)}>
                <Ionicons name={isPlaying1 ? "pause" : "play"} size={34} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmAnchor}>
                <Ionicons name="checkmark-circle" size={40} color="#fff" />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Video 2 */}
        {(phase === "select2" || phase === "align" || phase === "ready") && (
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.videoBox, !video2 && { backgroundColor: "#1A1A1A" }]}
              onPress={() => pickVideo(2)}
              activeOpacity={0.8}
            >
              {video2 ? (
                <Video
                  ref={v2}
                  source={{ uri: video2 }}
                  style={styles.video}
                  resizeMode="contain"
                  onLoad={(s) => onLoad2(s as AVPlaybackStatusSuccess)}
                  onPlaybackStatusUpdate={(s) => "isLoaded" in s && s.isLoaded && onStatus2(s)}
                  useNativeControls={false}
                />
              ) : (
                <View style={styles.placeholder}>
                  <Ionicons name="film-outline" size={44} color="#999" />
                  <Text style={styles.placeholderText}>Select Bottom Run</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.instructionsColumn}>
              {phase === "select2" && <Text style={styles.instructionText}>{instruction}</Text>}
              {phase === "align" && (
                <Text style={styles.instructionText}>Scrub to match anchor frame → ✓ confirm</Text>
              )}
            </View>
          </View>
        )}

        {phase === "align" && (
          <>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={duration2}
              value={pos2}
              onValueChange={(v) => scrub(2, v)}
              minimumTrackTintColor="#fff"
              maximumTrackTintColor="#333"
              thumbTintColor="#fff"
            />
            <View style={styles.controls}>
              <TouchableOpacity onPress={() => togglePlay(2)}>
                <Ionicons name={isPlaying2 ? "pause" : "play"} size={34} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmAlign}>
                <Ionicons name="checkmark-circle" size={40} color="#fff" />
              </TouchableOpacity>
            </View>
          </>
        )}

        {phase === "ready" && (
          <TouchableOpacity style={styles.confirmButton} onPress={goToCompare}>
            <Ionicons name="checkmark-circle" size={28} color="#fff" />
            <Text style={styles.confirmText}>Confirm & Compare</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 10,
  },
  toast: {
    position: "absolute",
    top: 80,
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  toastText: { color: "#fff" },
  content: { flex: 1, alignItems: "center", justifyContent: "flex-start", marginTop: 10 },
  row: { flexDirection: "row", alignItems: "center", width: "95%", marginVertical: 10 },
  videoBox: {
    width: "70%",
    height: height * 0.25,
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  video: { width: "100%", height: "100%", borderRadius: 10 },
  placeholder: { alignItems: "center" },
  placeholderText: { color: "#777", marginTop: 4 },
  instructionsColumn: { flex: 1, marginLeft: 10 },
  instructionText: { color: "#fff", fontSize: 14, lineHeight: 20 },
  slider: { width: "80%", marginTop: 10 },
  controls: { flexDirection: "row", justifyContent: "center", gap: 30, marginTop: 8 },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    backgroundColor: "#1C1F26",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  confirmText: { color: "#fff", fontWeight: "600", marginLeft: 10 },
});
