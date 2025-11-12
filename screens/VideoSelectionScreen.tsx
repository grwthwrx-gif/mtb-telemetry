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

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type Phase = "select" | "anchor" | "align" | "preview" | "ready";

export default function VideoSelectionScreen() {
  const navigation = useNavigation();

  const [video1, setVideo1] = useState<string | null>(null);
  const [video2, setVideo2] = useState<string | null>(null);

  const [loaded1, setLoaded1] = useState(false);
  const [loaded2, setLoaded2] = useState(false);
  const [duration1, setDuration1] = useState(0);
  const [duration2, setDuration2] = useState(0);
  const [pos1, setPos1] = useState(0);
  const [pos2, setPos2] = useState(0);
  const [isPlaying1, setIsPlaying1] = useState(false);
  const [isPlaying2, setIsPlaying2] = useState(false);

  const [anchorTime, setAnchorTime] = useState<number | null>(null);
  const [alignTime, setAlignTime] = useState<number | null>(null);
  const [offset, setOffset] = useState<number>(0);
  const [phase, setPhase] = useState<Phase>("select");

  const v1 = useRef<Video>(null);
  const v2 = useRef<Video>(null);

  // Toast
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const [toastMessage, setToastMessage] = useState("");
  const showToast = (msg: string) => {
    setToastMessage(msg);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  // Pick video
  const pickVideo = async (which: 1 | 2) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please enable photo access to select videos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 1,
    });

    if (!result.canceled && result.assets?.length) {
      const uri = result.assets[0].uri;
      if (which === 1) {
        setVideo1(uri);
        setLoaded1(false);
        setDuration1(0);
      } else {
        setVideo2(uri);
        setLoaded2(false);
        setDuration2(0);
      }
      setPhase("select");
    }
  };

  const onLoad1 = (s: AVPlaybackStatusSuccess) => {
    setLoaded1(true);
    setDuration1((s.durationMillis ?? 0) / 1000);
  };
  const onLoad2 = (s: AVPlaybackStatusSuccess) => {
    setLoaded2(true);
    setDuration2((s.durationMillis ?? 0) / 1000);
  };
  const onStatus1 = (s: AVPlaybackStatusSuccess) => {
    if (!s.isLoaded) return;
    setPos1((s.positionMillis ?? 0) / 1000);
    setIsPlaying1(s.isPlaying);
  };
  const onStatus2 = (s: AVPlaybackStatusSuccess) => {
    if (!s.isLoaded) return;
    setPos2((s.positionMillis ?? 0) / 1000);
    setIsPlaying2(s.isPlaying);
  };

  const togglePlay = async (which: 1 | 2) => {
    const ref = which === 1 ? v1.current : v2.current;
    if (!ref) return;
    const s = (await ref.getStatusAsync()) as AVPlaybackStatusSuccess;
    if (s.isLoaded && s.isPlaying) {
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
      showToast("Anchor frame saved");
      setPhase("align");
    }
  };

  const confirmAlign = async () => {
    if (!v2.current || anchorTime == null) return;
    const s = (await v2.current.getStatusAsync()) as AVPlaybackStatusSuccess;
    if (s.isLoaded) {
      const alignAt = (s.positionMillis ?? 0) / 1000;
      setAlignTime(alignAt);
      const off = alignAt - anchorTime;
      setOffset(off);
      showToast(`Psynk offset: ${off.toFixed(2)}s`);
      setPhase("preview");
    }
  };

  const previewSynced = async () => {
    if (v1.current && v2.current && anchorTime != null && alignTime != null) {
      await v1.current.setPositionAsync(anchorTime * 1000);
      await v2.current.setPositionAsync(alignTime * 1000);
      await Promise.all([v1.current.playAsync(), v2.current.playAsync()]);
      setPhase("ready");
    }
  };

  const goToCompare = () => {
    navigation.navigate("VideoCompare" as never, { video1, video2, offset } as never);
  };

  const canStart = loaded1 && loaded2;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Sync Runs</Text>

      {/* Toast */}
      <Animated.View
        style={[
          styles.toast,
          {
            opacity: toastOpacity,
            transform: [{ translateY: toastOpacity.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
          },
        ]}
      >
        <Text style={styles.toastText}>{toastMessage}</Text>
      </Animated.View>

      {/* Video 1 */}
      <TouchableOpacity style={styles.videoBox} onPress={() => pickVideo(1)} activeOpacity={0.85}>
        {video1 ? (
          <>
            <Video
              ref={v1}
              source={{ uri: video1 }}
              style={styles.video}
              resizeMode="contain"
              useNativeControls={false}
              onLoad={(s) => onLoad1(s as AVPlaybackStatusSuccess)}
              onPlaybackStatusUpdate={(s) => "isLoaded" in s && s.isLoaded && onStatus1(s)}
            />
            {loaded1 && <View style={styles.readyBadge}><Ionicons name="checkmark" size={16} color="#000" /></View>}
          </>
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="film-outline" size={44} color="#888" />
            <Text style={styles.addText}>Select Top Run</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Video 2 */}
      <TouchableOpacity style={styles.videoBox} onPress={() => pickVideo(2)} activeOpacity={0.85}>
        {video2 ? (
          <>
            <Video
              ref={v2}
              source={{ uri: video2 }}
              style={styles.video}
              resizeMode="contain"
              useNativeControls={false}
              onLoad={(s) => onLoad2(s as AVPlaybackStatusSuccess)}
              onPlaybackStatusUpdate={(s) => "isLoaded" in s && s.isLoaded && onStatus2(s)}
            />
            {loaded2 && <View style={styles.readyBadge}><Ionicons name="checkmark" size={16} color="#000" /></View>}
          </>
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="film-outline" size={44} color="#888" />
            <Text style={styles.addText}>Select Bottom Run</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Phase controls */}
      {video1 && video2 && (
        <>
          {phase === "select" && (
            <View style={styles.instructions}>
              <Text style={styles.instruction}>Step 1: Choose both runs and start syncing.</Text>
              <TouchableOpacity
                disabled={!canStart}
                style={[styles.actionButton, !canStart && { opacity: 0.4 }]}
                onPress={() => setPhase("anchor")}
              >
                <Text style={styles.buttonText}>Start Sync</Text>
              </TouchableOpacity>
            </View>
          )}

          {phase === "anchor" && (
            <View style={styles.syncControls}>
              <Text style={styles.phaseTitle}>Set Anchor Frame (Top)</Text>
              <View style={styles.playRow}>
                <TouchableOpacity onPress={() => togglePlay(1)}><Ionicons name={isPlaying1 ? "pause" : "play"} size={32} color="#fff" /></TouchableOpacity>
                <TouchableOpacity onPress={confirmAnchor}><Ionicons name="checkmark-circle" size={40} color="#fff" /></TouchableOpacity>
              </View>
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
            </View>
          )}

          {phase === "align" && (
            <View style={styles.syncControls}>
              <Text style={styles.phaseTitle}>Step 2: Align Bottom Video</Text>
              <View style={styles.playRow}>
                <TouchableOpacity onPress={() => togglePlay(2)}><Ionicons name={isPlaying2 ? "pause" : "play"} size={32} color="#fff" /></TouchableOpacity>
                <TouchableOpacity onPress={confirmAlign}><Ionicons name="checkmark-circle" size={40} color="#fff" /></TouchableOpacity>
              </View>
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
            </View>
          )}

          {phase === "preview" && (
            <View style={styles.instructions}>
              <TouchableOpacity style={styles.actionButton} onPress={previewSynced}>
                <Ionicons name="play-circle" size={28} color="#fff" />
                <Text style={styles.buttonText}> Preview Sync</Text>
              </TouchableOpacity>
            </View>
          )}

          {phase === "ready" && (
            <View style={styles.instructions}>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: "#2ECC71" }]} onPress={goToCompare}>
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
  container: { flex: 1, backgroundColor: "#0B0C10", alignItems: "center" },
  header: { color: "#fff", fontSize: 22, fontWeight: "700", marginTop: 50 },
  toast: { position: "absolute", top: 90, alignSelf: "center", backgroundColor: "rgba(255,255,255,0.1)", paddingVertical: 10, paddingHorizontal: 20, borderRadius: 20 },
  toastText: { color: "#fff", fontSize: 14 },
  videoBox: { width: "90%", height: SCREEN_HEIGHT * 0.25, backgroundColor: "#111", borderRadius: 10, justifyContent: "center", alignItems: "center", marginVertical: 10 },
  video: { width: "100%", height: "100%", borderRadius: 10 },
  placeholder: { alignItems: "center" },
  addText: { color: "#666", marginTop: 6 },
  readyBadge: { position: "absolute", top: 10, right: 10, backgroundColor: "#fff", borderRadius: 12, padding: 4 },
  instructions: { alignItems: "center", marginTop: 20 },
  instruction: { color: "#ccc", textAlign: "center", marginBottom: 12 },
  syncControls: { alignItems: "center", marginTop: 20 },
  playRow: { flexDirection: "row", gap: 40, marginBottom: 10 },
  phaseTitle: { color: "#fff", fontSize: 16, marginBottom: 10 },
  slider: { width: "85%", height: 40 },
  actionButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#1C1F26", paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 },
  buttonText: { color: "#fff", fontWeight: "600" },
});
