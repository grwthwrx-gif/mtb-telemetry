import React, { useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useRoute, useNavigation } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");

export default function VideoCompareScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { video1, video2 } = route.params as { video1: string; video2: string };

  const player1 = useRef<Video>(null);
  const player2 = useRef<Video>(null);

  const [anchorSet, setAnchorSet] = useState(false);
  const [offset, setOffset] = useState(0);

  const handlePlayPause = async () => {
    if (!anchorSet) {
      const status = await player1.current?.getStatusAsync();
      if (status?.isPlaying) await player1.current?.pauseAsync();
      else await player1.current?.playAsync();
    } else {
      const s1 = await player1.current?.getStatusAsync();
      const s2 = await player2.current?.getStatusAsync();
      if (s1?.isPlaying || s2?.isPlaying) {
        await player1.current?.pauseAsync();
        await player2.current?.pauseAsync();
      } else {
        await player1.current?.playAsync();
        await player2.current?.playAsync();
      }
    }
  };

  const handleSetAnchor = () => {
    setAnchorSet(true);
  };

  const handleConfirmSync = async () => {
    if (offset > 0) {
      await player2.current?.setPositionAsync(offset * 1000);
    } else if (offset < 0) {
      await player1.current?.setPositionAsync(Math.abs(offset) * 1000);
    }
  };

  const handleBack = () => {
    navigation.navigate("VideoSelection" as never);
  };

  return (
    <View style={styles.container}>
      {!anchorSet ? (
        <>
          <Video
            ref={player1}
            source={{ uri: video1 }}
            style={styles.video}
            resizeMode="contain"
            useNativeControls
          />
          <Video
            ref={player2}
            source={{ uri: video2 }}
            style={styles.video}
            resizeMode="contain"
            useNativeControls
          />
          <View style={styles.anchorControls}>
            <Text style={styles.anchorLabel}>Set Anchor Frame</Text>
            <View style={styles.anchorButtons}>
              <TouchableOpacity onPress={handlePlayPause}>
                <Ionicons name="play-circle-outline" size={60} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSetAnchor}>
                <Ionicons name="checkmark-circle-outline" size={60} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </>
      ) : (
        <>
          <Video
            ref={player1}
            source={{ uri: video1 }}
            style={styles.video}
            resizeMode="contain"
          />
          <Video
            ref={player2}
            source={{ uri: video2 }}
            style={styles.video}
            resizeMode="contain"
          />
          <View style={styles.syncControls}>
            <Text style={styles.label}>Psynk offset: {offset.toFixed(2)} s</Text>
            <Slider
              style={styles.slider}
              minimumValue={-3}
              maximumValue={3}
              step={0.05}
              value={offset}
              onValueChange={setOffset}
              minimumTrackTintColor="#fff"
              maximumTrackTintColor="#444"
              thumbTintColor="#fff"
            />
            <View style={styles.syncButtons}>
              <TouchableOpacity onPress={handleConfirmSync}>
                <Ionicons name="checkmark-circle-outline" size={60} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleBack}>
                <Ionicons name="arrow-undo-outline" size={60} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0C10",
    alignItems: "center",
    justifyContent: "center",
  },
  video: {
    width: width * 0.9,
    height: height * 0.28, // reduced for better spacing
    borderRadius: 10,
    backgroundColor: "#111",
    marginVertical: 6,
  },
  anchorControls: {
    alignItems: "center",
    marginTop: 10,
  },
  anchorLabel: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  anchorButtons: {
    flexDirection: "row",
    gap: 40,
  },
  syncControls: {
    alignItems: "center",
    marginTop: 15,
  },
  label: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  slider: {
    width: width * 0.8,
    height: 40,
  },
  syncButtons: {
    flexDirection: "row",
    gap: 40,
    marginTop: 10,
  },
});
