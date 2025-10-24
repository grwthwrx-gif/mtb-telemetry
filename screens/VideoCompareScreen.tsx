import React, { useRef } from "react";
import { View, StyleSheet, TouchableOpacity, Text, ScrollView } from "react-native";
import { Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";

export default function VideoCompareScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { video1, video2 } = route.params as { video1: string; video2: string };
  const player1 = useRef<Video>(null);
  const player2 = useRef<Video>(null);

  const handlePlayBoth = async () => {
    await player1.current?.replayAsync();
    await player2.current?.replayAsync();
    await player1.current?.playAsync();
    await player2.current?.playAsync();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Ionicons name="film-outline" size={40} color="#FFFFFF" style={styles.icon} />
      <Text style={styles.title}>Compare Runs</Text>

      <View style={styles.videoWrapper}>
        <Video ref={player1} source={{ uri: video1 }} style={styles.video} useNativeControls resizeMode="contain" />
        <Video ref={player2} source={{ uri: video2 }} style={styles.video} useNativeControls resizeMode="contain" />
      </View>

      <TouchableOpacity style={styles.playButton} onPress={handlePlayBoth}>
        <Ionicons name="play-circle-outline" size={26} color="#fff" />
        <Text style={styles.playText}>Play Both</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    backgroundColor: "#0B0C10",
    paddingVertical: 30,
  },
  icon: {
    marginBottom: 10,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
  },
  videoWrapper: {
    width: "100%",
    alignItems: "center",
  },
  video: {
    width: "90%",
    height: 200,
    borderRadius: 12,
    marginVertical: 10,
  },
  playButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 15,
  },
  playText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  backText: {
    color: "#aaa",
    marginTop: 25,
    fontSize: 16,
  },
});
