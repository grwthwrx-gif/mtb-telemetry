import React, { useRef, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  Pressable,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { Video } from "expo-av";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
} from "react-native-reanimated";

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
  const [ghostMode, setGhostMode] = useState(false);
  const [swapGhost, setSwapGhost] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [pos1, setPos1] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loadingCount, setLoadingCount] = useState(2); // wait until both onLoad fire

  // simple top-right menu
  const [menuOpen, setMenuOpen] = useState(false);

  // Fade animations
  const fade = useSharedValue(0);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.value }));
  const controlsOpacity = useSharedValue(1);
  const [controlsVisible, setControlsVisible] = useState(true);
  const animatedControlsStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
  }));

  useEffect(() => {
    fade.value = withDelay(100, withTiming(1, { duration: 700 }));
  }, []);

  // elapsed updater
  useEffect(() => {
    let id: NodeJS.Timeout | null = null;
    if (isPlaying) {
      id = setInterval(async () => {
        const s = await player1.current?.getStatusAsync();
        if (s?.positionMillis) {
          setElapsed(s.positionMillis / 1000);
          setPos1(s.positionMillis / 1000);
        }
      }, 250);
    }
    return () => id && clearInterval(id);
  }, [isPlaying]);

  const onLoad1 = async () => {
    const s = await player1.current?.getStatusAsync();
    if (s?.durationMillis) setDuration(s.durationMillis / 1000);
    setLoadingCount((c) => Math.max(0, c - 1));
  };
  const onLoad2 = async () => {
    setLoadingCount((c) => Math.max(0, c - 1));
  };

  // loop-ish: when either finishes, reset both to 0 and pause
  const onStatusCheckEnd = async (s: any) => {
    if (s?.didJustFinish) {
      await player1.current?.setPositionAsync(0);
      await player2.current?.setPositionAsync(Math.max(0, offset) * 1000);
      setIsPlaying(false);
    }
  };

  const applyOffsetForStart = async () => {
    if (offset > 0) await player2.current?.setPositionAsync(offset * 1000);
    else if (offset < 0) await player1.current?.setPositionAsync(Math.abs(offset) * 1000);
  };

  const handlePlayPause = async () => {
    if (isPlaying) {
      await player1.current?.pauseAsync();
      await player2.current?.pauseAsync();
      setIsPlaying(false);
    } else {
      await applyOffsetForStart();
      await Promise.all([player1.current?.playAsync(), player2.current?.playAsync()]);
      setIsPlaying(true);
    }
    revealControls();
  };

  const handleScrub = async (v: number) => {
    await player1.current?.setPositionAsync(v * 1000);
    await player2.current?.setPositionAsync(v * 1000 + offset * 1000);
    setPos1(v);
    revealControls();
  };

  const handleStep = async (delta: number) => {
    const newPos = Math.max(0, pos1 + delta);
    await handleScrub(newPos);
  };

  const handleRateChange = async (rate: number) => {
    await player1.current?.setRateAsync(rate, true);
    await player2.current?.setRateAsync(rate, true);
    revealControls();
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? "0" : ""}${sec}`;
  };

  const revealControls = () => {
    setControlsVisible(true);
    controlsOpacity.value = withTiming(1, { duration: 180 });
    setTimeout(() => {
      controlsOpacity.value = withTiming(0, { duration: 600 });
      setControlsVisible(false);
      setMenuOpen(false);
    }, 3500);
  };

  const handleTap = () => revealControls();

  const handleBack = async () => {
    await player1.current?.pauseAsync();
    await player2.current?.pauseAsync();
    setIsPlaying(false);
    fade.value = withTiming(0, { duration: 500 }, () => runOnJS(navigation.goBack)());
  };

  // menu actions
  const replaySynced = async () => {
    await player1.current?.setPositionAsync(0);
    await player2.current?.setPositionAsync(Math.max(0, offset) * 1000);
    await Promise.all([player1.current?.playAsync(), player2.current?.playAsync()]);
    setIsPlaying(true);
    setMenuOpen(false);
    revealControls();
  };
  const restart = async () => {
    await player1.current?.pauseAsync();
    await player2.current?.pauseAsync();
    setIsPlaying(false);
    fade.value = withTiming(0, { duration: 400 }, () => runOnJS(navigation.goBack)());
  };

  // ghost toggles
  const toggleGhost = () => {
    setGhostMode((g) => !g);
    setMenuOpen(false);
    revealControls();
  };
  const swapGhostLayer = () => {
    setSwapGhost((s) => !s);
    setMenuOpen(false);
    revealControls();
  };

  const isLoading = loadingCount > 0;

  return (
    <SafeAreaView style={styles.container}>
      <Pressable style={{ flex: 1, width: "100%" }} onPress={handleTap}>
        <Animated.View style={[{ flex: 1 }, fadeStyle]}>
          {/* Top bar + menu */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={handleBack}>
              <Ionicons name="chevron-back" size={26} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMenuOpen((b) => !b)}>
              <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Simple menu panel */}
          {menuOpen && (
            <View style={styles.menuPanel}>
              <TouchableOpacity style={styles.menuItem} onPress={replaySynced}>
                <Ionicons name="refresh" size={18} color="#fff" />
                <Text style={styles.menuText}>Replay synced runs</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={toggleGhost}>
                <Ionicons name="layers" size={18} color="#fff" />
                <Text style={styles.menuText}>
                  {ghostMode ? "Disable ghost overlay" : "Enable ghost overlay"}
                </Text>
              </TouchableOpacity>
              {ghostMode && (
                <TouchableOpacity style={styles.menuItem} onPress={swapGhostLayer}>
                  <Ionicons name="swap-vertical" size={18} color="#fff" />
                  <Text style={styles.menuText}>Swap ghost layer</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.menuItem} onPress={restart}>
                <Ionicons name="exit-outline" size={18} color="#fff" />
                <Text style={styles.menuText}>Restart (pick new videos)</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Videos */}
          {!ghostMode ? (
            <>
              <Video
                ref={player1}
                source={{ uri: video1 }}
                style={styles.videoTop}
                resizeMode="contain"
                onLoad={onLoad1}
                onPlaybackStatusUpdate={onStatusCheckEnd}
              />
              <Video
                ref={player2}
                source={{ uri: video2 }}
                style={styles.videoBottom}
                resizeMode="contain"
                onLoad={onLoad2}
                onPlaybackStatusUpdate={onStatusCheckEnd}
              />
            </>
          ) : (
            <>
              {/* true overlay: both absolute, one semi-transparent */}
              {swapGhost ? (
                <>
                  <Video
                    ref={player1}
                    source={{ uri: video1 }}
                    style={styles.videoOverlay}
                    resizeMode="contain"
                    onLoad={onLoad1}
                    onPlaybackStatusUpdate={onStatusCheckEnd}
                  />
                  <Video
                    ref={player2}
                    source={{ uri: video2 }}
                    style={[styles.videoOverlay, { opacity: 0.4 }]}
                    resizeMode="contain"
                    onLoad={onLoad2}
                    onPlaybackStatusUpdate={onStatusCheckEnd}
                  />
                </>
              ) : (
                <>
                  <Video
                    ref={player2}
                    source={{ uri: video2 }}
                    style={[styles.videoOverlay, { opacity: 0.4 }]}
                    resizeMode="contain"
                    onLoad={onLoad2}
                    onPlaybackStatusUpdate={onStatusCheckEnd}
                  />
                  <Video
                    ref={player1}
                    source={{ uri: video1 }}
                    style={styles.videoOverlay}
                    resizeMode="contain"
                    onLoad={onLoad1}
                    onPlaybackStatusUpdate={onStatusCheckEnd}
                  />
                </>
              )}
            </>
          )}

          {/* Elapsed time lowered a bit */}
          <View style={styles.elapsedOverlay}>
            <Text style={styles.elapsedText}>
              {formatTime(elapsed)}
            </Text>
          </View>

          {/* Controls */}
          {controlsVisible && (
            <Animated.View style={[styles.controls, animatedControlsStyle]}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={duration}
                value={pos1}
                onValueChange={(v) => handleScrub(v)}
                minimumTrackTintColor="#fff"
                maximumTrackTintColor="#333"
                thumbTintColor="#fff"
              />
              <View style={styles.row}>
                <TouchableOpacity onPress={() => handleStep(-0.5)}>
                  <Ionicons name="play-back" size={28} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handlePlayPause}>
                  <Ionicons name={isPlaying ? "pause" : "play"} size={40} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleStep(0.5)}>
                  <Ionicons name="play-forward" size={28} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRateChange(1)}>
                  <Text style={styles.rate}>1×</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRateChange(0.5)}>
                  <Text style={styles.rate}>½×</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRateChange(0.25)}>
                  <Text style={styles.rate}>¼×</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {/* Loading overlay until both onLoad have fired */}
          {isLoading && (
            <View style={styles.loadingCover}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingTxt}>Preparing Psynk Playback…</Text>
            </View>
          )}
        </Animated.View>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  topBar: {
    position: "absolute",
    top: 10,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  menuPanel: {
    position: "absolute",
    top: 44,
    right: 14,
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    zIndex: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    gap: 8,
  },
  menuText: { color: "#fff" },

  videoTop: {
    width: "100%",
    height: SCREEN_HEIGHT * 0.45,
    backgroundColor: "#111",
  },
  videoBottom: {
    width: "100%",
    height: SCREEN_HEIGHT * 0.45,
    backgroundColor: "#111",
  },
  videoOverlay: {
    position: "absolute",
    top: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },

  elapsedOverlay: {
    position: "absolute",
    top: 68,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  elapsedText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  controls: {
    position: "absolute",
    bottom: 30,
    width: "100%",
    alignItems: "center",
  },
  slider: { width: "85%", height: 40 },
  row: {
    flexDirection: "row",
    gap: 22,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginTop: 10,
  },
  rate: { color: "#fff", fontWeight: "700" },

  loadingCover: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingTxt: { color: "#fff", marginTop: 10, fontWeight: "600" },
});
