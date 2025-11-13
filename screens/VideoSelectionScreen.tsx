import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Alert,
  Animated,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Video, AVPlaybackStatusSuccess } from "expo-av";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");
const FRAME_H = Math.min(height * 0.30, 300);
const FRAME = 1 / 30; // ~1 frame at 30fps

type Phase = "select1" | "anchor" | "select2" | "align" | "ready";

export default function VideoSelectionScreen() {
  const nav = useNavigation();

  const [phase, setPhase] = useState<Phase>("select1");

  const [video1, setVideo1] = useState<string | null>(null);
  const [video2, setVideo2] = useState<string | null>(null);

  const v1 = useRef<Video>(null);
  const v2 = useRef<Video>(null);

  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);

  const [duration1, setDuration1] = useState(0);
  const [duration2, setDuration2] = useState(0);
  const [pos1, setPos1] = useState(0);
  const [pos2, setPos2] = useState(0);
  const [isPlaying1, setIsPlaying1] = useState(false);
  const [isPlaying2, setIsPlaying2] = useState(false);

  const [anchorTime, setAnchorTime] = useState<number | null>(null);
  const [offset, setOffset] = useState<number>(0);

  const [menuOpen, setMenuOpen] = useState(false);

  // tiny toast
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const [toastText, setToastText] = useState("");
  const toast = (msg: string) => {
    setToastText(msg);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(1200),
      Animated.timing(toastOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  };

  const resetAll = () => {
    setPhase("select1");
    setVideo1(null);
    setVideo2(null);
    setLoading1(false);
    setLoading2(false);
    setDuration1(0);
    setDuration2(0);
    setPos1(0);
    setPos2(0);
    setIsPlaying1(false);
    setIsPlaying2(false);
    setAnchorTime(null);
    setOffset(0);
    setMenuOpen(false);
  };

  const ensurePerms = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Enable Photo Library access to pick videos.");
      return false;
    }
    return true;
  };

  const pickVideo = async (which: 1 | 2) => {
    if (!(await ensurePerms())) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 1,
    });
    if (result.canceled || !result.assets?.length) return;

    const uri = result.assets[0].uri;
    if (which === 1) {
      setVideo1(uri);
      setLoading1(true);
      setPhase("anchor");
    } else {
      setVideo2(uri);
      setLoading2(true);
      setPhase("align");
    }
  };

  // Video 1 events
  const onLoad1 = (s: AVPlaybackStatusSuccess) => {
    setDuration1((s.durationMillis ?? 0) / 1000);
    setLoading1(false);
  };
  const onStatus1 = (s: AVPlaybackStatusSuccess) => {
    if (!s.isLoaded) return;
    setPos1((s.positionMillis ?? 0) / 1000);
    setIsPlaying1(!!s.isPlaying);
  };

  // Video 2 events
  const onLoad2 = (s: AVPlaybackStatusSuccess) => {
    setDuration2((s.durationMillis ?? 0) / 1000);
    setLoading2(false);
  };
  const onStatus2 = (s: AVPlaybackStatusSuccess) => {
    if (!s.isLoaded) return;
    setPos2((s.positionMillis ?? 0) / 1000);
    setIsPlaying2(!!s.isPlaying);
  };

  const togglePlay = async (which: 1 | 2) => {
    const ref = which === 1 ? v1.current : v2.current;
    if (!ref) return;
    const s = (await ref.getStatusAsync()) as AVPlaybackStatusSuccess;
    if (s.isLoaded && s.isPlaying) await ref.pauseAsync();
    else await ref.playAsync();
  };

  const scrub = async (which: 1 | 2, valueSec: number) => {
    const ref = which === 1 ? v1.current : v2.current;
    if (ref) await ref.setPositionAsync(Math.max(0, valueSec) * 1000);
  };

  const nudge = async (which: 1 | 2, delta: number) => {
    const ref = which === 1 ? v1.current : v2.current;
    if (!ref) return;
    const s = (await ref.getStatusAsync()) as AVPlaybackStatusSuccess;
    const cur = (s.positionMillis ?? 0) / 1000;
    await ref.setPositionAsync(Math.max(0, cur + delta) * 1000);
  };

  const confirmAnchor = async () => {
    if (!v1.current) return;
    const s = (await v1.current.getStatusAsync()) as AVPlaybackStatusSuccess;
    if (s.isLoaded) {
      const t = (s.positionMillis ?? 0) / 1000;
      setAnchorTime(t);
      toast("Anchor saved");
      setPhase("select2");
    }
  };

  const confirmAlign = async () => {
    if (!v2.current || anchorTime == null) return;
    const s = (await v2.current.getStatusAsync()) as AVPlaybackStatusSuccess;
    if (s.isLoaded) {
      const t = (s.positionMillis ?? 0) / 1000;
      const off = t - anchorTime;
      setOffset(off);
      toast(`Psynk offset: ${off.toFixed(2)}s`);
      setPhase("ready");
    }
  };

  const goCompare = () => {
    if (!video1 || !video2) return;
    nav.navigate("VideoCompare" as never, { video1, video2, offset } as never);
  };

  // UI helpers
  const InsideHint = ({ text }: { text: string }) => (
    <View style={styles.overlayHint}>
      <Text style={styles.overlayHintText}>{text}</Text>
    </View>
  );

  const FineControls = ({ which }: { which: 1 | 2 }) => (
    <View style={styles.fineRow}>
      <TouchableOpacity onPress={() => nudge(which, -1)}>
        <Text style={styles.fineBtn}>-1s</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => nudge(which, -0.1)}>
        <Text style={styles.fineBtn}>-0.1s</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => nudge(which, -FRAME)}>
        <Text style={styles.fineBtn}>-1f</Text>
      </TouchableOpacity>
      <View style={{ width: 10 }} />
      <TouchableOpacity onPress={() => nudge(which, FRAME)}>
        <Text style={styles.fineBtn}>+1f</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => nudge(which, 0.1)}>
        <Text style={styles.fineBtn}>+0.1s</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => nudge(which, 1)}>
        <Text style={styles.fineBtn}>+1s</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar (lowered so it won't clash with iOS status area) */}
      <View style={styles.topBar}>
        <Ionicons name="chevron-back" size={26} color="#fff" />
        <TouchableOpacity onPress={() => setMenuOpen((m) => !m)}>
          <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {menuOpen && (
        <View style={styles.menuPanel}>
          <TouchableOpacity style={styles.menuItem} onPress={resetAll}>
            <Ionicons name="exit-outline" size={18} color="#fff" />
            <Text style={styles.menuText}>Restart (pick new videos)</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Toast */}
      <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
        <Text style={styles.toastText}>{toastText}</Text>
      </Animated.View>

      {/* --- Video 1 block --- */}
      <View style={styles.frameBlock}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.frame}
          onPress={() => (phase === "select1" ? pickVideo(1) : undefined)}
        >
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
              {loading1 && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.loadingText}>Loading…</Text>
                </View>
              )}
              {!loading1 && phase === "anchor" && (
                <InsideHint text="Scrub to desired anchor frame, then ✓" />
              )}
            </>
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="film" size={44} color="#999" />
              <Text style={styles.placeholderText}>Select first run</Text>
            </View>
          )}
        </TouchableOpacity>

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
            <FineControls which={1} />
            <View style={styles.controlsRow}>
              <TouchableOpacity onPress={() => togglePlay(1)}>
                <Ionicons name={isPlaying1 ? "pause" : "play"} size={34} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmAnchor}>
                <Ionicons name="checkmark-circle" size={40} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.stepHint}>Tip: use the fine controls for precise frame matching.</Text>
          </>
        )}
      </View>

      {/* --- Video 2 block --- */}
      <View style={[styles.frameBlock, { marginTop: 28 }]}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.frame}
          onPress={() =>
            (phase === "select2" || phase === "align" || phase === "ready") ? pickVideo(2) : undefined
          }
        >
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
              {loading2 && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.loadingText}>Loading…</Text>
                </View>
              )}
              {!loading2 && phase === "align" && (
                <InsideHint text="Scrub to match top frame, then ✓" />
              )}
            </>
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="film" size={44} color="#999" />
              <Text style={styles.placeholderText}>
                {phase === "select2" ? "Select second run" : "Tap to select second run"}
              </Text>
            </View>
          )}
        </TouchableOpacity>

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
            <FineControls which={2} />
            <View style={styles.controlsRow}>
              <TouchableOpacity onPress={() => togglePlay(2)}>
                <Ionicons name={isPlaying2 ? "pause" : "play"} size={34} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmAlign}>
                <Ionicons name="checkmark-circle" size={40} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.stepHint}>Match the same moment as the top video, then ✓.</Text>
          </>
        )}
      </View>

      {phase === "ready" && (
        <TouchableOpacity style={styles.confirm} onPress={goCompare}>
          <Ionicons name="checkmark-circle" size={22} color="#fff" />
          <Text style={styles.confirmText}> psynk & compare</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },

  // Lowered top bar
  topBar: {
    marginTop: 16,
    marginHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  menuPanel: {
    position: "absolute",
    top: 56,
    right: 14,
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    zIndex: 9,
  },
  menuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 6, gap: 8 },
  menuText: { color: "#fff" },

  toast: {
    position: "absolute",
    top: 86,
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 16,
    zIndex: 8,
  },
  toastText: { color: "#fff" },

  frameBlock: { alignItems: "center", marginTop: 32 },
  frame: {
    width: Math.min(width * 0.94, 720),
    height: FRAME_H,
    borderRadius: 12,
    backgroundColor: "#1A1A1A",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  video: { width: "100%", height: "100%" },
  placeholder: { justifyContent: "center", alignItems: "center" },
  placeholderText: { color: "#aaa", marginTop: 6 },

  overlayHint: {
    position: "absolute",
    bottom: 8,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  overlayHintText: { color: "#fff" },

  slider: { width: "90%", marginTop: 12 },
  controlsRow: {
    flexDirection: "row",
    gap: 28,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  fineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    marginTop: 8,
  },
  fineBtn: {
    color: "#fff",
    fontWeight: "700",
    backgroundColor: "rgba(255,255,255,0.10)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  stepHint: { color: "#ddd", fontSize: 12, marginTop: 6 },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  loadingText: { color: "#fff", marginTop: 8 },

  confirm: {
    alignSelf: "center",
    marginTop: 22,
    backgroundColor: "#1C1F26",
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  confirmText: { color: "#fff", fontWeight: "600", textTransform: "lowercase" },
});
