import React, { useRef, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  Pressable,
} from "react-native";
import Slider from "@react-native-community/slider";
import { Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
type Mode = "anchor" | "sync" | "playback";

export default function VideoCompareScreen({ navigation, route }: any) {
  const { video1, video2 } = route.params as { video1: string; video2: string };

  const player1 = useRef<Video>(null);
  const player2 = useRef<Video>(null);

  // flow + state
  const [mode, setMode] = useState<Mode>("anchor");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [ghostMode, setGhostMode] = useState(false);
  const [swapGhost, setSwapGhost] = useState(false);

  // sync + timing
  const [anchorPosMs, setAnchorPosMs] = useState(0); // where video1 is frozen
  const [offsetSec, setOffsetSec] = useState(0);     // user-chosen offset (seconds)
  const [elapsed, setElapsed] = useState(0);         // from player1 position
  const [scrubValue, setScrubValue] = useState(0);   // 0..1 playback scrub

  // elapsed + scrub tracker while playing (playback mode)
  useEffect(() => {
    let t: NodeJS.Timeout | null = null;
    if (isPlaying && mode === "playback") {
      t = setInterval(async () => {
        const s = await player1.current?.getStatusAsync();
        if (s?.positionMillis && s?.durationMillis) {
          setElapsed(s.positionMillis / 1000);
          setScrubValue(s.positionMillis / s.durationMillis);
        }
      }, 250);
    }
    return () => t && clearInterval(t);
  }, [isPlaying, mode]);

  const fmt = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // ---------- ANCHOR (Video 1) ----------
  const anchorPlayPause = async () => {
    if (isPlaying) {
      await player1.current?.pauseAsync();
      setIsPlaying(false);
    } else {
      await player1.current?.playAsync();
      setIsPlaying(true);
    }
  };

  const anchorStep = async (dir: number) => {
    const s = await player1.current?.getStatusAsync();
    const pos = Math.max(0, (s?.positionMillis ?? 0) + dir * 250);
    await player1.current?.setPositionAsync(pos);
  };

  const setAnchorAndContinue = async () => {
    const s = await player1.current?.getStatusAsync();
    const pos = s?.positionMillis ?? 0;
    setAnchorPosMs(pos);
    await player1.current?.pauseAsync();
    setIsPlaying(false);
    // place video2 at anchor + offset for visual alignment
    const target = Math.max(0, pos + offsetSec * 1000);
    await player2.current?.setPositionAsync(target);
    setMode("sync");
  };

  // ---------- SYNC (Video 2) ----------
  const syncPlayPause = async () => {
    // play/pause only video2; video1 remains frozen at anchor
    const s2 = await player2.current?.getStatusAsync();
    if (s2?.isPlaying) {
      await player2.current?.pauseAsync();
    } else {
      await player2.current?.playAsync();
    }
  };

  const syncStep = async (dir: number) => {
    const s2 = await player2.current?.getStatusAsync();
    const pos = Math.max(0, (s2?.positionMillis ?? 0) + dir * 250);
    await player2.current?.setPositionAsync(pos);
  };

  const onOffsetChange = async (val: number) => {
    setOffsetSec(val);
    const target = Math.max(0, anchorPosMs + val * 1000);
    await player2.current?.setPositionAsync(target);
  };

  const confirmSync = async () => {
    // lock positions relative to anchor
    await player1.current?.setPositionAsync(anchorPosMs);
    const target = Math.max(0, anchorPosMs + offsetSec * 1000);
    await player2.current?.setPositionAsync(target);
    // reset play state and enter playback
    setGhostMode(false);
    setSwapGhost(false);
    setElapsed(0);
    setScrubValue(0);
    setIsPlaying(false);
    setMode("playback");
  };

  // ---------- PLAYBACK (both) ----------
  const playPauseBoth = async () => {
    if (isPlaying) {
      await player1.current?.pauseAsync();
      await player2.current?.pauseAsync();
      setIsPlaying(false);
    } else {
      await player1.current?.playAsync();
      await player2.current?.playAsync();
      // ensure both at same rate
      await player1.current?.setRateAsync(playbackRate, true);
      await player2.current?.setRateAsync(playbackRate, true);
      setIsPlaying(true);
    }
  };

  const setRate = async (rate: number) => {
    setPlaybackRate(rate);
    await player1.current?.setRateAsync(rate, true);
    await player2.current?.setRateAsync(rate, true);
  };

  const restartToAnchor = async () => {
    await player1.current?.pauseAsync();
    await player2.current?.pauseAsync();
    await player1.current?.setPositionAsync(0);
    await player2.current?.setPositionAsync(0);
    setIsPlaying(false);
    setGhostMode(false);
    setSwapGhost(false);
    setOffsetSec(0);
    setAnchorPosMs(0);
    setElapsed(0);
    setScrubValue(0);
    setMode("anchor");
  };

  const reEnterSync = async () => {
    const s = await player1.current?.getStatusAsync();
    const pos = s?.positionMillis ?? 0;
    setAnchorPosMs(pos);
    await player1.current?.pauseAsync();
    await player2.current?.pauseAsync();
    setIsPlaying(false);
    setMode("sync");
  };

  const onPlaybackScrub = async (value: number) => {
    setScrubValue(value);
    const s = await player1.current?.getStatusAsync();
    if (!s?.durationMillis) return;
    const newPos = value * s.durationMillis;
    await player1.current?.setPositionAsync(newPos);
    await player2.current?.setPositionAsync(newPos);
  };

  // ---------- RENDER ----------
  return (
    <Pressable style={styles.container}>
      {/* elapsed (playback) */}
      {mode === "playback" && (
        <View style={styles.elapsed}>
          <Text style={styles.elapsedTxt}>{fmt(elapsed)}</Text>
        </View>
      )}

      {/* videos area */}
      {mode !== "playback" ? (
        // calibration: pure flex stack (no absolute) to avoid touch overlap
        <View style={styles.stack}>
          <Video
            ref={player1}
            source={{ uri: video1 }}
            style={styles.videoCalib}
            resizeMode="contain"
            // ensure only v2 is interactive in sync stage
            pointerEvents={mode === "sync" ? "none" : "auto"}
            shouldPlay={false}
            isLooping={false}
          />
          <Video
            ref={player2}
            source={{ uri: video2 }}
            style={styles.videoCalib}
            resizeMode="contain"
            pointerEvents={mode === "sync" ? "auto" : "none"}
            shouldPlay={false}
            isLooping={false}
          />
        </View>
      ) : !ghostMode ? (
        <>
          <Video
            ref={player1}
            source={{ uri: video1 }}
            style={[styles.videoHalfAbs, { top: 0 }]}
            resizeMode="contain"
          />
          <Video
            ref={player2}
            source={{ uri: video2 }}
            style={[styles.videoHalfAbs, { bottom: 0 }]}
            resizeMode="contain"
          />
        </>
      ) : swapGhost ? (
        <>
          <Video
            ref={player1}
            source={{ uri: video1 }}
            style={[styles.overlay, { opacity: 0.4 }]}
            resizeMode="contain"
          />
          <Video
            ref={player2}
            source={{ uri: video2 }}
            style={styles.overlay}
            resizeMode="contain"
          />
        </>
      ) : (
        <>
          <Video
            ref={player2}
            source={{ uri: video2 }}
            style={[styles.overlay, { opacity: 0.4 }]}
            resizeMode="contain"
          />
          <Video
            ref={player1}
            source={{ uri: video1 }}
            style={styles.overlay}
            resizeMode="contain"
          />
        </>
      )}

      {/* controls */}
      {mode === "anchor" && (
        <View style={styles.controls}>
          <Text style={styles.title}>Set Anchor Frame</Text>
          <View style={styles.row}>
            <TouchableOpacity onPress={() => anchorStep(-1)}>
              <Ionicons name="play-back" size={34} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={anchorPlayPause}>
              <Ionicons
                name={isPlaying ? "pause-circle" : "play-circle"}
                size={56}
                color="#fff"
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => anchorStep(1)}>
              <Ionicons name="play-forward" size={34} color="#fff" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={setAnchorAndContinue} style={{ marginTop: 6 }}>
            <Ionicons name="checkmark-circle" size={56} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {mode === "sync" && (
        <View style={styles.controls}>
          <Text style={styles.title}>Adjust Sync</Text>
          <Text style={styles.sub}>Psynk Offset: {offsetSec.toFixed(2)} s</Text>
          {/* controls for video2 only */}
          <View style={styles.row}>
            <TouchableOpacity onPress={() => syncStep(-1)}>
              <Ionicons name="play-back" size={34} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={syncPlayPause}>
              <Ionicons name="play-circle" size={50} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => syncStep(1)}>
              <Ionicons name="play-forward" size={34} color="#fff" />
            </TouchableOpacity>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={-3}
            maximumValue={3}
            step={0.05}
            value={offsetSec}
            onValueChange={onOffsetChange}
            minimumTrackTintColor="#fff"
            maximumTrackTintColor="#333"
            thumbTintColor="#fff"
          />
          <TouchableOpacity onPress={confirmSync} style={{ marginTop: 6 }}>
            <Ionicons name="checkmark-done-circle" size={56} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {mode === "playback" && (
        <View style={styles.controls}>
          <View style={styles.row}>
            <TouchableOpacity onPress={playPauseBoth}>
              <Ionicons
                name={isPlaying ? "pause-circle" : "play-circle"}
                size={56}
                color="#fff"
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setRate(1)}>
              <Text style={styles.rate}>1×</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setRate(0.5)}>
              <Text style={styles.rate}>½×</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setRate(0.25)}>
              <Text style={styles.rate}>¼×</Text>
            </TouchableOpacity>
          </View>

          {/* playback scrub */}
          <Slider
            style={styles.scrub}
            minimumValue={0}
            maximumValue={1}
            step={0.001}
            value={scrubValue}
            onSlidingComplete={onPlaybackScrub}
            minimumTrackTintColor="#fff"
            maximumTrackTintColor="#333"
            thumbTintColor="#fff"
          />

          <View style={styles.row}>
            <TouchableOpacity onPress={() => setGhostMode(g => !g)}>
              <Ionicons
                name="layers"
                size={30}
                color={ghostMode ? "#fff" : "rgba(255,255,255,0.6)"}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSwapGhost(s => !s)}>
              <Ionicons name="swap-vertical" size={30} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={reEnterSync}>
              <Ionicons name="navigate-circle" size={34} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={restartToAnchor}>
              <Ionicons name="arrow-undo" size={34} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0C10", alignItems: "center", justifyContent: "center" },

  // calibration stack (no absolute to avoid overlaps)
  stack: { flex: 1, width: "100%", alignItems: "center", justifyContent: "center" },
  videoCalib: { width: "100%", height: SCREEN_HEIGHT / 2.2, backgroundColor: "#111", marginVertical: 4 },

  // playback stacked halves (absolute for full height use)
  videoHalfAbs: { position: "absolute", width: "100%", height: SCREEN_HEIGHT / 2, backgroundColor: "#111" },
  overlay: { position: "absolute", width: "100%", height: "100%" },

  // controls
  controls: { position: "absolute", bottom: 36, alignItems: "center", justifyContent: "center" },
  title: { color: "#fff", fontSize: 20, fontWeight: "700", marginBottom: 6, textTransform: "none" },
  sub: { color: "#aaa", marginBottom: 6 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 26, marginVertical: 6 },
  slider: { width: 300, marginTop: 4 },
  scrub: { width: 320, marginTop: 6 },

  rate: { color: "#fff", fontSize: 18, fontWeight: "700" },

  elapsed: { position: "absolute", top: 30, right: 20, backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  elapsedTxt: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
