import React, { useRef, useState, useEffect } from "react";
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
import { useNavigation, useRoute } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");
const FRAME_HEIGHT = Math.min(height * 0.30, 280);

// TRUE fine stepping
const STEP_10MS = 0.01;
const STEP_50MS = 0.05;

type Phase = "select1" | "anchor" | "select2" | "align" | "ready";

export default function VideoSelectionScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  // If returning from compare screen
  const keepVideos = (route.params as any)?.keepVideos ?? false;

  const [phase, setPhase] = useState<Phase>(keepVideos ? "ready" : "select1");

  const [video1, setVideo1] = useState<string | null>(
    keepVideos ? (route.params as any)?.video1 ?? null : null
  );
  const [video2, setVideo2] = useState<string | null>(
    keepVideos ? (route.params as any)?.video2 ?? null : null
  );

  const [offset, setOffset] = useState<number>(
    keepVideos ? (route.params as any)?.offset ?? 0 : 0
  );

  const player1 = useRef<Video>(null);
  const player2 = useRef<Video>(null);

  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);

  const [cloud1, setCloud1] = useState(false);
  const [cloud2, setCloud2] = useState(false);

  const [duration1, setDuration1] = useState(0);
  const [duration2, setDuration2] = useState(0);
  const [pos1, setPos1] = useState(0);
  const [pos2, setPos2] = useState(0);
  const [playing1, setPlaying1] = useState(false);
  const [playing2, setPlaying2] = useState(false);

  const [anchorTime, setAnchorTime] = useState<number | null>(
    keepVideos ? (route.params as any)?.anchorTime ?? null : null
  );

  const [menuOpen, setMenuOpen] = useState(false);

  const ensurePermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Enable photo library access in Settings.");
      return false;
    }
    return true;
  };

  const pickVideo = async (which: 1 | 2) => {
    const ok = await ensurePermissions();
    if (!ok) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: 1,
        allowsMultipleSelection: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      const asset = result.assets[0];

      // iCloud detection — no fileSize means not downloaded yet
      if (!asset.fileSize) {
        if (which === 1) setCloud1(true);
        else setCloud2(true);
      }

      if (which === 1) {
        setCloud1(true);
        setLoading1(true);
        setVideo1(asset.uri);
        setPhase("anchor");
      } else {
        setCloud2(true);
        setLoading2(true);
        setVideo2(asset.uri);
        setPhase("align");
      }
    } catch {
      Alert.alert("Error", "Unable to select video.");
    }
  };

  // VIDEO LOAD HANDLERS
  const onLoadStart1 = () => setLoading1(true);
  const onLoad1 = (status: AVPlaybackStatusSuccess) => {
    setDuration1((status.durationMillis ?? 0) / 1000);
    setLoading1(false);
    setCloud1(false); // iCloud fetch finished
  };

  const onLoadStart2 = () => setLoading2(true);
  const onLoad2 = (status: AVPlaybackStatusSuccess) => {
    setDuration2((status.durationMillis ?? 0) / 1000);
    setLoading2(false);
    setCloud2(false);
  };

  const onStatus1 = (s: AVPlaybackStatusSuccess) => {
    if (!s.isLoaded) return;
    setPos1((s.positionMillis ?? 0) / 1000);
    setPlaying1(!!s.isPlaying);
    if (typeof s.isBuffering === "boolean") setLoading1(s.isBuffering);
  };

  const onStatus2 = (s: AVPlaybackStatusSuccess) => {
    if (!s.isLoaded) return;
    setPos2((s.positionMillis ?? 0) / 1000);
    setPlaying2(!!s.isPlaying);
    if (typeof s.isBuffering === "boolean") setLoading2(s.isBuffering);
  };

  // PLAY / SCRUB
  const togglePlay = async (which: 1 | 2) => {
    const ref = which === 1 ? player1.current : player2.current;
    if (!ref) return;
    const s = (await ref.getStatusAsync()) as AVPlaybackStatusSuccess;
    if (!s.isLoaded) return;
    if (s.isPlaying) await ref.pauseAsync();
    else await ref.playAsync();
  };

  const scrubTo = async (which: 1 | 2, sec: number) => {
    const ref = which === 1 ? player1.current : player2.current;
    if (!ref) return;
    const t = Math.max(0, sec);
    await ref.setPositionAsync(t * 1000);
    if (which === 1) setPos1(t);
    else setPos2(t);
  };

  const microStep = async (which: 1 | 2, deltaSec: number) => {
    const ref = which === 1 ? player1.current : player2.current;
    if (!ref) return;
    const s = (await ref.getStatusAsync()) as AVPlaybackStatusSuccess;
    if (!s.isLoaded) return;
    const current = (s.positionMillis ?? 0) / 1000;
    const next = Math.max(0, current + deltaSec);
    await ref.setPositionAsync(next * 1000);
    if (which === 1) setPos1(next);
    else setPos2(next);
  };

  // ANCHOR + ALIGN
  const confirmAnchor = async () => {
    if (!player1.current) return;
    const s = (await player1.current.getStatusAsync()) as AVPlaybackStatusSuccess;
    const t = (s.positionMillis ?? 0) / 1000;
    setAnchorTime(t);
    setPhase("select2");
  };

  const confirmAlign = async () => {
    if (!player2.current || anchorTime == null) return;
    const s = (await player2.current.getStatusAsync()) as AVPlaybackStatusSuccess;
    const t = (s.positionMillis ?? 0) / 1000;
    setOffset(t - anchorTime);
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
        anchorTime,
        keepVideos: true,
      } as never
    );
  };

  const reset = () => {
    setPhase("select1");
    setVideo1(null);
    setVideo2(null);
    setLoading1(false);
    setLoading2(false);
    setCloud1(false);
    setCloud2(false);
    setDuration1(0);
    setDuration2(0);
    setPos1(0);
    setPos2(0);
    setAnchorTime(null);
    setOffset(0);
  };

  // Fine controls (new micro-stepping)
  const FineControls = ({ which }: { which: 1 | 2 }) => (
    <View style={styles.fineRow}>
      <TouchableOpacity onPress={() => microStep(which, -STEP_50MS)}>
        <Text style={styles.fineBtn}>-50ms</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => microStep(which, -STEP_10MS)}>
        <Text style={styles.fineBtn}>-10ms</Text>
      </TouchableOpacity>

      <View style={{ width: 10 }} />

      <TouchableOpacity onPress={() => microStep(which, STEP_10MS)}>
        <Text style={styles.fineBtn}>+10ms</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => microStep(which, STEP_50MS)}>
        <Text style={styles.fineBtn}>+50ms</Text>
      </TouchableOpacity>
    </View>
  );

  const insideText = (txt: string) => (
    <View style={styles.overlayHint}>
      <Text style={styles.overlayHintText}>{txt}</Text>
    </View>
  );

  // UI
  return (
    <SafeAreaView style={styles.container}>
      {/* TOP BAR */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("Intro" as never, {
              keepVideos: true,
            })
          }
        >
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

      {/* ===== VIDEO 1 ===== */}
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
                onLoad={onLoad1}
                onPlaybackStatusUpdate={(s) =>
                  "isLoaded" in s && s.isLoaded && onStatus1(s as AVPlaybackStatusSuccess)
                }
              />

              {(loading1 || cloud1) && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.loadingText}>
                    {cloud1 ? "Fetching from iCloud…" : "Loading…"}
                  </Text>
                </View>
              )}

              {phase === "anchor" && !loading1 && insideText("Set your anchor frame, then ✓")}
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
                <Ionicons name={playing1 ? "pause" : "play"} size={32} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity onPress={confirmAnchor}>
                <Ionicons name="checkmark-circle" size={40} color="#fff" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* ===== VIDEO 2 ===== */}
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
                onLoadStart={onLoadStart2}
                onLoad={onLoad2}
                onPlaybackStatusUpdate={(s) =>
                  "isLoaded" in s && s.isLoaded && onStatus2(s as AVPlaybackStatusSuccess)
                }
              />

              {(loading2 || cloud2) && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.loadingText}>
                    {cloud2 ? "Fetching from iCloud…" : "Loading…"}
                  </Text>
                </View>
              )}

              {phase === "align" &&
                !loading2 &&
                insideText("Match this to the top video, then ✓")}
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
              minimumTrackTintColor="#fff"
              maximumTrackTintColor="#444"
              thumbTintColor="#fff"
            />

            <FineControls which={2} />

            <View style={styles.controlRow}>
              <TouchableOpacity onPress={() => togglePlay(2)}>
                <Ionicons name={playing2 ? "pause" : "play"} size={32} color="#fff" />
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

// ===== STYLES =====
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
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 12,
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
    gap: 12,
    marginTop: 6,
  },
  fineBtn: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  loadingText: {
    color: "#fff",
    marginTop: 8,
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
