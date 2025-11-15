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
const FRAME_STEP_SEC = 1 / 30; // ~1 frame at 30fps

type Phase = "select1" | "anchor" | "select2" | "align" | "ready";

export default function VideoSelectionScreen() {
  const navigation = useNavigation();

  // Flow state
  const [phase, setPhase] = useState<Phase>("select1");

  // URIs
  const [video1, setVideo1] = useState<string | null>(null);
  const [video2, setVideo2] = useState<string | null>(null);

  // Player refs
  const player1 = useRef<Video>(null);
  const player2 = useRef<Video>(null);

  // Loading flags (for spinner)
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);

  // Durations & positions (seconds)
  const [duration1, setDuration1] = useState(0);
  const [duration2, setDuration2] = useState(0);
  const [pos1, setPos1] = useState(0);
  const [pos2, setPos2] = useState(0);

  // Simple playing flags
  const [playing1, setPlaying1] = useState(false);
  const [playing2, setPlaying2] = useState(false);

  // Sync data
  const [anchorTime, setAnchorTime] = useState<number | null>(null);
  const [offset, setOffset] = useState<number>(0);

  // Menu
  const [menuOpen, setMenuOpen] = useState(false);

  // Permissions
  const ensurePermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Please enable Photo Library access in Settings."
      );
      return false;
    }
    return true;
  };

  const pickVideo = async (which: 1 | 2) => {
    const ok = await ensurePermissions();
    if (!ok) return;

    try {
      if (which === 1) setLoading1(true);
      if (which === 2) setLoading2(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        if (which === 1) setLoading1(false);
        if (which === 2) setLoading2(false);
        return;
      }

      const uri = result.assets[0].uri;

      if (which === 1) {
        setVideo1(uri);
        setPhase("anchor");
      } else {
        setVideo2(uri);
        setPhase("align");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Unable to select video.");
      if (which === 1) setLoading1(false);
      if (which === 2) setLoading2(false);
    }
  };

  // Load + status handlers
  const onLoad1 = (status: AVPlaybackStatusSuccess) => {
    setDuration1((status.durationMillis ?? 0) / 1000);
    setLoading1(false);
  };

  const onStatus1 = (status: AVPlaybackStatusSuccess) => {
    if (!status.isLoaded) return;
    const newPos = (status.positionMillis ?? 0) / 1000;
    setPos1(newPos);
    setPlaying1(!!status.isPlaying);
  };

  const onLoad2 = (status: AVPlaybackStatusSuccess) => {
    setDuration2((status.durationMillis ?? 0) / 1000);
    setLoading2(false);
  };

  const onStatus2 = (status: AVPlaybackStatusSuccess) => {
    if (!status.isLoaded) return;
    const newPos = (status.positionMillis ?? 0) / 1000;
    setPos2(newPos);
    setPlaying2(!!status.isPlaying);
  };

  // Play / pause individual
  const togglePlay = async (which: 1 | 2) => {
    const ref = which === 1 ? player1.current : player2.current;
    if (!ref) return;

    const status = (await ref.getStatusAsync()) as AVPlaybackStatusSuccess;
    if (!status.isLoaded) return;

    if (status.isPlaying) {
      await ref.pauseAsync();
    } else {
      await ref.playAsync();
    }
  };

  // Scrub to position (seconds) using local state
  const scrubTo = async (which: 1 | 2, valueSec: number) => {
    const ref = which === 1 ? player1.current : player2.current;
    if (!ref) return;

    const clamped = Math.max(0, valueSec);
    await ref.setPositionAsync(clamped * 1000);

    if (which === 1) setPos1(clamped);
    else setPos2(clamped);
  };

  // Fine nudge using current state only (no status async)
  const nudge = async (which: 1 | 2, deltaSec: number) => {
    if (which === 1) {
      const next = Math.max(0, pos1 + deltaSec);
      await scrubTo(1, next);
    } else {
      const next = Math.max(0, pos2 + deltaSec);
      await scrubTo(2, next);
    }
  };

  const confirmAnchor = async () => {
    // Lock in current position of video1 as anchor
    setAnchorTime(pos1);
    setPhase("select2");
  };

  const confirmAlign = () => {
    if (anchorTime == null) return;
    const off = pos2 - anchorTime;
    setOffset(off);
    setPhase("ready");
  };

  const goCompare = () => {
    if (!video1 || !video2) {
      Alert.alert("Select videos", "Please select and sync both runs first.");
      return;
    }
    navigation.navigate(
      "VideoCompare" as never,
      {
        video1,
        video2,
        offset,
      } as never
    );
  };

  const reset = () => {
    setPhase("select1");
    setVideo1(null);
    setVideo2(null);
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

  const FineControls = ({ which }: { which: 1 | 2 }) => (
    <View style={styles.fineRow}>
      <TouchableOpacity onPress={() => nudge(which, -0.5)}>
        <Text style={styles.fineBtn}>-0.5s</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => nudge(which, -0.1)}>
        <Text style={styles.fineBtn}>-0.1s</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => nudge(which, -FRAME_STEP_SEC)}>
        <Text style={styles.fineBtn}>-1f</Text>
      </TouchableOpacity>

      <View style={{ width: 8 }} />

      <TouchableOpacity onPress={() => nudge(which, FRAME_STEP_SEC)}>
        <Text style={styles.fineBtn}>+1f</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => nudge(which, 0.1)}>
        <Text style={styles.fineBtn}>+0.1s</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => nudge(which, 0.5)}>
        <Text style={styles.fineBtn}>+0.5s</Text>
      </TouchableOpacity>
    </View>
  );

  const overlayHint = (text: string) => (
    <View style={styles.overlayHint}>
      <Text style={styles.overlayHintText}>{text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar */}
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

      {/* VIDEO 1 BLOCK */}
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
                onLoad={(s) => onLoad1(s as AVPlaybackStatusSuccess)}
                onPlaybackStatusUpdate={(s) =>
                  "isLoaded" in s &&
                  s.isLoaded &&
                  onStatus1(s as AVPlaybackStatusSuccess)
                }
              />
              {loading1 && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.loadingText}>Loading…</Text>
                </View>
              )}
              {phase === "anchor" && !loading1 &&
                overlayHint("Scrub to your anchor frame, then ✓")}
            </>
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="film" size={40} color="#999" />
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
              minimumTrackTintColor="#fff"
              maximumTrackTintColor="#444"
              thumbTintColor="#fff"
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
            <Text style={styles.stepHint}>
              Tip: use fine controls to get the start point exactly right.
            </Text>
          </>
        )}
      </View>

      {/* VIDEO 2 BLOCK */}
      <View style={[styles.block, { marginTop: 30 }]}>
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
                onLoad={(s) => onLoad2(s as AVPlaybackStatusSuccess)}
                onPlaybackStatusUpdate={(s) =>
                  "isLoaded" in s &&
                  s.isLoaded &&
                  onStatus2(s as AVPlaybackStatusSuccess)
                }
              />
              {loading2 && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.loadingText}>Loading…</Text>
                </View>
              )}
              {phase === "align" && !loading2 &&
                overlayHint("Match the top frame, then ✓")}
            </>
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="film" size={40} color="#999" />
              <Text style={styles.placeholderText}>
                {phase === "select2"
                  ? "Select second run"
                  : "Tap to select second run"}
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
              minimumTrackTintColor="#fff"
              maximumTrackTintColor="#444"
              thumbTintColor="#fff"
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
            <Text style={styles.stepHint}>
              Match the same point as the first video, then confirm.
            </Text>
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
    backgroundColor: "rgba(0,0,0,0.8)",
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
    marginTop: 26,
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
    marginTop: 8,
  },
  overlayHint: {
    position: "absolute",
    bottom: 8,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
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
    marginTop: 8,
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
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 8,
  },
  stepHint: {
    color: "#ddd",
    fontSize: 12,
    marginTop: 6,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    marginTop: 6,
  },
  psynkButton: {
    alignSelf: "center",
    marginTop: 20,
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
