import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Pressable,
} from "react-native";
import { Video } from "expo-av";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useRoute, useNavigation } from "@react-navigation/native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
type Mode = "anchor" | "sync" | "playback";

export default function VideoCompareScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { video1, video2 } = route.params as { video1: string; video2: string };

  const player1 = useRef<Video>(null);
  const player2 = useRef<Video>(null);

  const [mode, setMode] = useState<Mode>("anchor");
  const [isPlaying, setIsPlaying] = useState(false);
  const [offset, setOffset] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [scrubValue, setScrubValue] = useState(0);
  const [ghostMode, setGhostMode] = useState(false);
  const [swapGhost, setSwapGhost] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  // elapsed time tracker for active player
  useEffect(() => {
    let t: NodeJS.Timeout | null = null;
    if (isPlaying) {
      t = setInterval(async () => {
        const s = await player1.current?.getStatusAsync();
        if (s?.positionMillis) {
          setElapsed(s.positionMillis / 1000);
          setScrubValue(s.positionMillis / (s.durationMillis || 1));
        }
      }, 250);
    }
    return () => t && clearInterval(t);
  }, [isPlaying]);

  const fmt = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // --- anchor controls ---
  const playPauseAnchor = async () => {
    if (isPlaying) {
      await player1.current?.pauseAsync();
      setIsPlaying(false);
    } else {
      await player1.current?.playAsync();
      setIsPlaying(true);
    }
  };
  const stepAnchor = async (dir: number) => {
    const s = await player1.current?.getStatusAsync();
    const p = (s?.positionMillis || 0) + dir * 100;
    await player1.current?.setPositionAsync(Math.max(0, p));
  };
  const handleSetAnchor = async () => {
    await player1.current?.pauseAsync();
    setIsPlaying(false);
    setMode("sync");
  };

  // --- sync stage ---
  const handleConfirmSync = async () => {
    if (offset > 0) await player2.current?.setPositionAsync(offset * 1000);
    else if (offset < 0)
      await player1.current?.setPositionAsync(Math.abs(offset) * 1000);
    setMode("playback");
    setElapsed(0);
  };
  const stepFrames = async (dir: number) => {
    const s = await player2.current?.getStatusAsync();
    const p = (s?.positionMillis || 0) + dir * 100;
    await player2.current?.setPositionAsync(Math.max(0, p));
  };

  // --- playback ---
  const handlePlayPause = async () => {
    if (isPlaying) {
      await player1.current?.pauseAsync();
      await player2.current?.pauseAsync();
      setIsPlaying(false);
    } else {
      await player1.current?.playAsync();
      await player2.current?.playAsync();
      setIsPlaying(true);
    }
  };
  const handleRestart = async () => {
    await player1.current?.setPositionAsync(0);
    await player2.current?.setPositionAsync(0);
    setElapsed(0);
  };
  const handleReSync = async () => {
    await player1.current?.pauseAsync();
    await player2.current?.pauseAsync();
    setIsPlaying(false);
    setMode("sync");
  };
  const handleRate = async (r: number) => {
    setPlaybackRate(r);
    await player1.current?.setRateAsync(r, true);
    await player2.current?.setRateAsync(r, true);
  };
  const handleGhost = () => setGhostMode(p => !p);
  const handleSwap = () => setSwapGhost(p => !p);
  const handleBack = async () => {
    await player1.current?.stopAsync();
    await player2.current?.stopAsync();
    navigation.goBack();
  };
  const handleScrub = async (v: number) => {
    const s = await player1.current?.getStatusAsync();
    if (!s?.durationMillis) return;
    const pos = v * s.durationMillis;
    await player1.current?.setPositionAsync(pos);
    await player2.current?.setPositionAsync(pos);
  };

  return (
    <Pressable style={st.container}>
      {/* === ANCHOR === */}
      {mode === "anchor" && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={st.mode}>
          <View style={st.elapsed}>
            <Text style={st.elapsedTxt}>{fmt(elapsed)}</Text>
          </View>
          <Text style={st.title}>Set Anchor Frame</Text>
          <Video
            ref={player1}
            source={{ uri: video1 }}
            style={st.videoLg}
            resizeMode="contain"
          />
          <View style={st.anchorCtrls}>
            <TouchableOpacity onPress={() => stepAnchor(-1)}>
              <Ionicons name="play-back" size={34} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={playPauseAnchor}>
              <Ionicons
                name={isPlaying ? "pause-circle" : "play-circle"}
                size={50}
                color="#fff"
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => stepAnchor(1)}>
              <Ionicons name="play-forward" size={34} color="#fff" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={st.bigBtn} onPress={handleSetAnchor}>
            <Ionicons name="checkmark-circle" size={70} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* === SYNC === */}
      {mode === "sync" && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={st.mode}>
          <Text style={st.title}>Adjust Psynk Offset</Text>
          <Video
            ref={player2}
            source={{ uri: video2 }}
            style={st.videoLg}
            resizeMode="contain"
          />
          <Text style={st.offset}>Psynk Offset: {offset.toFixed(2)} s</Text>
          <Slider
            style={st.slider}
            minimumValue={-3}
            maximumValue={3}
            step={0.05}
            value={offset}
            onValueChange={setOffset}
            minimumTrackTintColor="#fff"
            maximumTrackTintColor="#444"
            thumbTintColor="#fff"
          />
          <View style={st.frameBtns}>
            <TouchableOpacity onPress={() => stepFrames(-1)}>
              <Ionicons name="play-back" size={34} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => stepFrames(1)}>
              <Ionicons name="play-forward" size={34} color="#fff" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={st.bigBtn} onPress={handleConfirmSync}>
            <Ionicons name="checkmark-done-circle" size={70} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* === PLAYBACK === */}
      {mode === "playback" && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={st.play}>
          {!ghostMode ? (
            <>
              <Video ref={player1} source={{ uri: video1 }} style={[st.half, { top: 0 }]} resizeMode="contain" />
              <Video ref={player2} source={{ uri: video2 }} style={[st.half, { bottom: 0 }]} resizeMode="contain" />
            </>
          ) : swapGhost ? (
            <>
              <Video ref={player1} source={{ uri: video1 }} style={[st.ov, { opacity: 0.4 }]} resizeMode="contain" />
              <Video ref={player2} source={{ uri: video2 }} style={st.ov} resizeMode="contain" />
            </>
          ) : (
            <>
              <Video ref={player2} source={{ uri: video2 }} style={[st.ov, { opacity: 0.4 }]} resizeMode="contain" />
              <Video ref={player1} source={{ uri: video1 }} style={st.ov} resizeMode="contain" />
            </>
          )}
          <View style={st.elapsed}><Text style={st.elapsedTxt}>{fmt(elapsed)}</Text></View>
          <View style={st.ctrls}>
            <View style={st.row}>
              <TouchableOpacity onPress={handlePlayPause}>
                <Ionicons name={isPlaying ? "pause-circle" : "play-circle"} size={50} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRestart}>
                <Ionicons name="refresh" size={34} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleReSync}>
                <Ionicons name="navigate-circle" size={34} color="#fff" />
              </TouchableOpacity>
            </View>
            <Slider
              style={st.scrub}
              minimumValue={0}
              maximumValue={1}
              step={0.001}
              value={scrubValue}
              onSlidingComplete={handleScrub}
              minimumTrackTintColor="#fff"
              maximumTrackTintColor="#444"
              thumbTintColor="#fff"
            />
            <View style={st.row}>
              <TouchableOpacity onPress={() => handleRate(1)}><Text style={st.rate}>1×</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => handleRate(0.5)}><Text style={st.rate}>½×</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => handleRate(0.25)}><Text style={st.rate}>¼×</Text></TouchableOpacity>
            </View>
            <View style={st.row}>
              <TouchableOpacity onPress={handleGhost}><Ionicons name="layers" size={30} color={ghostMode ? "#fff" : "rgba(255,255,255,0.6)"} /></TouchableOpacity>
              <TouchableOpacity onPress={handleSwap}><Ionicons name="swap-vertical" size={30} color="#fff" /></TouchableOpacity>
              <TouchableOpacity onPress={handleBack}><Ionicons name="arrow-undo" size={30} color="#fff" /></TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}
    </Pressable>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0C10" },
  mode: { flex: 1, alignItems: "center", justifyContent: "space-evenly", width: "100%" },
  play: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { color: "#fff", fontSize: 22, fontWeight: "700" },
  videoLg: { width: "90%", height: SCREEN_HEIGHT * 0.4, backgroundColor: "#111", borderRadius: 12 },
  anchorCtrls: { flexDirection: "row", justifyContent: "center", gap: 30, marginVertical: 8 },
  bigBtn: { marginTop: 10 },
  offset: { color: "#fff", fontSize: 16, marginBottom: 6 },
  slider: { width: "90%", height: 40 },
  frameBtns: { flexDirection: "row", gap: 40, marginVertical: 10 },
  half: { position: "absolute", width: "100%", height: SCREEN_HEIGHT / 2, backgroundColor: "#111" },
  ov: { position: "absolute", width: "100%", height: "100%" },
  elapsed: { position: "absolute", top: 30, right: 20, backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  elapsedTxt: { color: "#fff", fontSize: 16, fontWeight: "600" },
  ctrls: { position: "absolute", bottom: 35, width: "90%", alignItems: "center" },
  row: { flexDirection: "row", justifyContent: "center", gap: 30, marginVertical: 6 },
  scrub: { width: "100%", height: 40, marginTop: 4 },
  rate: { color: "#fff", fontSize: 18, fontWeight: "700" },
});
