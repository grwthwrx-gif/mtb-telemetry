import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Video, AVPlaybackStatusSuccess } from "expo-av";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");
const FRAME_HEIGHT = Math.min(height * 0.30, 280);

// True frame-step (for ~30fps videos)
const FRAME_STEP_SEC = 1 / 30;

// UI phases for guided syncing
type Phase = "select1" | "anchor" | "select2" | "align" | "ready";

export default function VideoSelectionScreen() {
  const navigation = useNavigation();

  const [phase, setPhase] = useState<Phase>("select1");
  const [video1, setVideo1] = useState<string | null>(null);
  const [video2, setVideo2] = useState<string | null>(null);

  const player1 = useRef<Video>(null);
  const player2 = useRef<Video>(null);

  // NEW — preparing flags (instant overlay)
  const [preparing1, setPreparing1] = useState(false);
  const [preparing2, setPreparing2] = useState(false);

  // Video load + buffer flags
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);

  const [duration1, setDuration1] = useState(0);
  const [duration2, setDuration2] = useState(0);
  const [pos1, setPos1] = useState(0);
  const [pos2, setPos2] = useState(0);
  const [playing1, setPlaying1] = useState(false);
  const [playing2, setPlaying2] = useState(false);

  const [anchorTime, setAnchorTime] = useState<number | null>(null);
  const [offset, setOffset] = useState(0);

  const [menuOpen, setMenuOpen] = useState(false);

  const ensurePermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please enable Photo Library access.");
      return false;
    }
    return true;
  };

  // Select video
  const pickVideo = async (which: 1 | 2) => {
    const ok = await ensurePermissions();
    if (!ok) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const uri = result.assets[0].uri;

      // Immediately show preparing overlay
      if (which === 1) {
        setPreparing1(true);
        setVideo1(uri);
        setPhase("anchor");
      } else {
        setPreparing2(true);
        setVideo2(uri);
        setPhase("align");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Unable to select video.");
      which === 1 ? setPreparing1(false) : setPreparing2(false);
    }
  };

  // ------------------------------------------------------------
  // Video 1 events
  // ------------------------------------------------------------

  const onLoadStart1 = () => {
    setLoading1(true);
  };

  const onLoad1 = (status: AVPlaybackStatusSuccess) => {
    setDuration1((status.durationMillis ?? 0) / 1000);
    setLoading1(false);
    setPreparing1(false); // finish preparing stage
  };

  const onStatus1 = (status: AVPlaybackStatusSuccess) => {
    if (!status.isLoaded) return;

    const newPos = (status.positionMillis ?? 0) / 1000;
    setPos1(newPos);
    setPlaying1(!!status.isPlaying);

    if (typeof status.isBuffering === "boolean") {
      setLoading1(status.isBuffering);
    }
  };

  // ------------------------------------------------------------
  // Video 2 events
  // ------------------------------------------------------------

  const onLoadStart2 = () => {
    setLoading2(true);
  };

  const onLoad2 = (status: AVPlaybackStatusSuccess) => {
    setDuration2((status.durationMillis ?? 0) / 1000);
    setLoading2(false);
    setPreparing2(false);
  };

  const onStatus2 = (status: AVPlaybackStatusSuccess) => {
    if (!status.isLoaded) return;

    const newPos = (status.positionMillis ?? 0) / 1000;
    setPos2(newPos);
    setPlaying2(!!status.isPlaying);

    if (typeof status.isBuffering === "boolean") {
      setLoading2(status.isBuffering);
    }
  };

  // ------------------------------------------------------------
  // Video controls
  // ------------------------------------------------------------

  const togglePlay = async (which: 1 | 2) => {
    const ref = which === 1 ? player1.current : player2.current;
    if (!ref) return;
    const s = (await ref.getStatusAsync()) as AVPlaybackStatusSuccess;
    if (s.isLoaded && s.isPlaying) {
      await ref.pauseAsync();
    } else if (s.isLoaded) {
      await ref.playAsync();
    }
  };

  const scrubTo = async (which: 1 | 2, valueSec: number) => {
    const ref = which === 1 ? player1.current : player2.current;
    if (!ref) return;
    const clamped = Math.max(0, valueSec);
    await ref.setPositionAsync(clamped * 1000);
    which === 1 ? setPos1(clamped) : setPos2(clamped);
  };

  const nudgeSmall = async (which: 1 | 2, delta: number) => {
    const ref = which === 1 ? player1.current : player2.current;
    if (!ref) return;
    const s = (await ref.getStatusAsync()) as AVPlaybackStatusSuccess;
    if (!s.isLoaded) return;
    const current = (s.positionMillis ?? 0) / 1000;
    const next = Math.max(0, current + delta);
    await ref.setPositionAsync(next * 1000);
    which === 1 ? setPos1(next) : setPos2(next);
  };

  // Confirm sync anchor
  const confirmAnchor = async () => {
    if (!player1.current) return;
    const s = (await player1.current.getStatusAsync()) as AVPlaybackStatusSuccess;
    if (!s.isLoaded) return;
    setAnchorTime((s.positionMillis ?? 0) / 1000);
    setPhase("select2");
  };

  // Confirm alignment
  const confirmAlign = async () => {
    if (!player2.current || anchorTime == null) return;
    const s = (await player2.current.getStatusAsync()) as AVPlaybackStatusSuccess;
    if (!s.isLoaded) return;
    const t = (s.positionMillis ?? 0) / 1000;
    setOffset(t - anchorTime);
    setPhase("ready");
  };

  // Go to compare
  const goCompare = () => {
    if (!video1 || !video2) {
      Alert.alert("Select videos", "Please select and sync both runs first.");
      return;
    }
    navigation.navigate(
      "VideoCompare" as never,
      { video1, video2, offset } as never
    );
  };

  // Reset flow
  const reset = () => {
    setPhase("select1");
    setVideo1(null);
    setVideo2(null);
    setPreparing1(false);
    setPreparing2(false);
    setLoading1(false);
    setLoading2(false);
    setDuration1(0);
    setDuration2(0);
    setPos1(0);
    setPos2(0);
    setPlaying1(false);
    setPlaying2(false);
    setAnchorTime(null);
    setOffset(0);
    setMenuOpen(false);
  };

  // ------------------------------------------------------------
  // Fine frame controls (already working well)
  // ------------------------------------------------------------

  const FineControls = ({ which }: { which: 1 | 2 }) => (
    <View style={styles.fineRow}>
      <TouchableOpacity onPress={() => nudgeSmall(which, -10 * FRAME_STEP_SEC)}>
        <Text style={styles.fineBtn}>-10f</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => nudgeSmall(which, -1 * FRAME_STEP_SEC)}>
        <Text style={styles.fineBtn}>-1f</Text>
      </TouchableOpacity>

      <View style={{ width: 8 }} />

      <TouchableOpacity onPress={() => nudgeSmall(which, 1 * FRAME_STEP_SEC)}>
        <Text style={styles.fineBtn}>+1f</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => nudgeSmall(which, 10 * FRAME_STEP_SEC)}>
        <Text style={styles.fineBtn}>+10f</Text>
      </TouchableOpacity>
    </View>
  );

  const overlayHint = (text: string) => (
    <View style={styles.overlayHint}>
      <Text style={styles.overlayHintText}>{text}</Text>
    </View>
  );

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMenuOpen((m) => !m)}>
          <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {menuOpen && (
        <View style={styles.menuPanel}>
          <TouchableOpacity style={styles.menuItem} onPress={reset}>
            <Ionicons name="refresh" size={18} color="#fff" />
            <Text style={styles.menuText}>Restart (select new videos)</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ------------------------------------------------------------
          VIDEO 1 BLOCK
      ------------------------------------------------------------ */}
      <View style={styles.block}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.frame}
          onPress={() => phase === "select1" && pickVideo(1)}
        >
          {video1 ? (
            <>
              <Video
                ref={player1}
                source={{ uri: video1 }}
                style={styles.video}
                resizeMode="contain"
                useNativeControls={false}
                onLoadStart={onLoadStart1}
                onLoad={(s) => onLoad1(s as AVPlaybackStatusSuccess)}
                onPlaybackStatusUpdate={(s) =>
                  "isLoaded" in s &&
                  s.isLoaded &&
                  onStatus1(s as AVPlaybackStatusSuccess)
                }
              />

              {(preparing1 || loading1) && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.loadingText}>Preparing video…</Text>
                </View>
              )}

              {phase === "anchor" && !preparing1 && !loading1 &&
                overlayHint("Scrub to your anchor frame, then ✓")}
            </>
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="film" size={38} color="#999" />
              <Text style={styles.placeholderText}>Select first run</Text>
            </View>
          )}
        </TouchableOpacity>

        {phase === "anchor" && (
          <>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={duration1 || 1}
              value={pos1}
              onValueChange={(v) => scrubTo(1, v)}
              thumbTintColor="#fff"
              minimumTrackTintColor="#fff"
              maximumTrackTintColor="#444"
            />

            <FineControls which={1} />

            <View style={styles.controlRow}>
              <TouchableOpacity onPress={() => togglePlay(1)}>
                <Ionicons
                  name={playing1 ? "pause" : "play"}
                  size={32}
                  color="#fff"
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmAnchor}>
                <Ionicons name="checkmark-circle" size={40} color="#fff" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* ------------------------------------------------------------
          VIDEO 2 BLOCK
      ------------------------------------------------------------ */}
      <View style={[styles.block, { marginTop: 28 }]}>
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.frame}
          onPress={() =>
            (phase === "select2" || phase === "align" || phase === "ready") &&
            pickVideo(2)
          }
        >
          {video2 ? (
            <>
              <Video
                ref={player2}
                source={{ uri: video2 }}
                style={styles.video}
                resizeMode="contain"
                useNativeControls={false}
                onLoadStart={onLoadStart2}
                onLoad={(s) => onLoad2(s as AVPlaybackStatusSuccess)}
                onPlaybackStatusUpdate={(s) =>
                  "isLoaded" in s &&
                  s.isLoaded &&
                  onStatus2(s as AVPlaybackStatusSuccess)
                }
              />

              {(preparing2 || loading2) && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.loadingText}>Preparing video…</Text>
                </View>
              )}

              {phase === "align" && !preparing2 && !loading2 &&
                overlayHint("Scrub to match the top frame, then ✓")}
            </>
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="film" size={40} color="#999" />
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
              maximumValue={duration2 || 1}
              value={pos2}
              onValueChange={(v) => scrubTo(2, v)}
              thumbTintColor="#fff"
              minimumTrackTintColor="#fff"
              maximumTrackTintColor="#444"
            />

            <FineControls which={2} />

            <View style={styles.controlRow}>
              <TouchableOpacity onPress={() => togglePlay(2)}>
                <Ionicons
                  name={playing2 ? "pause" : "play"}
                  size={32}
                  color="#fff"
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmAlign}>
                <Ionicons name="checkmark-circle" size={40} color="#fff" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {phase === "ready" && (
        <TouchableOpacity style={styles.psynkButton} onPress={goCompare}>
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.psynkText}> psynk & compare</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

// ------------------------------------------------------------
// STYLES
// ------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  topBar: {
    marginTop: 12,
    marginHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  menuPanel: {
    position: "absolute",
    top: 54,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.85)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    zIndex: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  menuText: {
    color: "#fff",
    fontSize: 14,
  },
  block: {
    alignItems: "center",
    marginTop: 24,
  },
  frame: {
    width: Math.min(width * 0.94, 720),
    height: FRAME_HEIGHT,
    borderRadius: 12,
    backgroundColor: "#1E1E1E",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#aaa",
    marginTop: 6,
  },

  // 🆕 Dark in-frame loading overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 6,
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },

  overlayHint: {
    position: "absolute",
    bottom: 8,
    alignSelf: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  overlayHintText: {
    color: "#fff",
    fontSize: 13,
  },

  slider: {
    width: "90%",
    marginTop: 12,
  },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 26,
    marginTop: 10,
  },
  fineRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 6,
  },
  fineBtn: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 8,
  },
  psynkButton: {
    alignSelf: "center",
    marginTop: 22,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    flexDirection: "row",
    alignItems: "center",
  },
  psynkText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textTransform: "lowercase",
  },
});
