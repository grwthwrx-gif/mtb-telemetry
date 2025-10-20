// ./screens/VideoCompareScreen.tsx
import React, { useRef } from "react";
import { View, Text, StyleSheet, Alert, Dimensions } from "react-native";
import { Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useRoute } from "@react-navigation/native";

const { width } = Dimensions.get("window");

type RootStackParamList = {
  VideoCompare: { video1?: string; video2?: string };
};

type CompareRouteProp = RouteProp<RootStackParamList, "VideoCompare">;

export default function VideoCompareScreen() {
  const route = useRoute<CompareRouteProp>();
  const video1 = route.params?.video1;
  const video2 = route.params?.video2;

  const player1 = useRef<Video>(null);
  const player2 = useRef<Video>(null);

  if (!video1 || !video2) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#FFFFFF" />
        <Text style={styles.errorText}>No videos selected.</Text>
        <Text style={styles.errorSub}>
          Please go back and select two videos to compare.
        </Text>
      </View>
    );
  }

  const handleReady = async () => {
    try {
      const status1 = await player1.current?.getStatusAsync();
      const status2 = await player2.current?.getStatusAsync();

      if (status1?.isLoaded && status2?.isLoaded) {
        await player1.current?.playAsync();
        await player2.current?.playAsync();
      }
    } catch (e) {
      Alert.alert("Playback error", "Unable to play videos.");
    }
  };

  return (
    <View style={styles.container}>
      <Ionicons name="speedometer-outline" size={40} color="#FFFFFF" style={styles.icon} />
      <Text style={styles.title}>Comparing Runs</Text>

      <View style={styles.videoContainer}>
        <Video
          ref={player1}
          source={{ uri: video1 }}
          style={styles.video}
          resizeMode="cover"
          onLoad={handleReady}
          isMuted
        />
        <Video
          ref={player2}
          source={{ uri: video2 }}
          style={[styles.video, styles.overlayVideo]}
          resizeMode="cover"
          opacity={0.4}
          isMuted
        />
      </View>

      <Text style={styles.caption}>Ghost overlay active</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0C10",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 80,
  },
  icon: {
    marginBottom: 10,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  videoContainer: {
    width: width * 0.9,
    height: width * 0.6,
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
  },
  video: {
    width: "100%",
    height: "100%",
  },
  overlayVideo: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  caption: {
    color: "#FFFFFF",
    fontSize: 14,
    opacity: 0.7,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "#0B0C10",
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
  },
  errorSub: {
    color: "#AAAAAA",
    marginTop: 5,
  },
});
