import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, ScrollView } from "react-native";
import * as ImagePicker from "expo-image-picker";

export default function VideoSelectionScreen({ navigation }) {
  const [videos, setVideos] = useState<{ uri: string; thumb: string | null }[]>([]);
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Permission to access videos is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const selected = result.assets.map((a) => ({
        uri: a.uri,
        thumb: a.uri, // we can later replace this with generated thumbnails
      }));
      setVideos(selected);
    }
  };

  const startComparison = () => {
    if (videos.length < 2) {
      alert("Please select at least two videos to compare.");
      return;
    }
    navigation.navigate("CompareVideos", { videos });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerIconContainer}>
        <Text style={styles.headerIcon}>🎬</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Select Your Runs</Text>

        <TouchableOpacity style={styles.selectButton} onPress={pickVideo}>
          <Text style={styles.selectText}>Select Videos</Text>
        </TouchableOpacity>

        <View style={styles.videoList}>
          {videos.map((vid, index) => (
            <View key={index} style={styles.videoContainer}>
              {loadingIndex === index ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Image
                  source={{ uri: vid.thumb }}
                  style={styles.thumbnail}
                  onLoadStart={() => setLoadingIndex(index)}
                  onLoadEnd={() => setLoadingIndex(null)}
                />
              )}
              <Text style={styles.videoText}>Run {index + 1}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.compareButton} onPress={startComparison}>
          <Text style={styles.compareText}>Start Comparison</Text>
        </TouchableOpacity>
      </ScrollView>
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
  scrollContainer: {
    alignItems: "center",
    paddingBottom: 40,
  },
  headerIconContainer: {
    marginTop: 60,
    marginBottom: 10,
  },
  headerIcon: {
    fontSize: 32,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginVertical: 10,
  },
  selectButton: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 30,
    marginTop: 40,
  },
  selectText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  videoList: {
    marginTop: 30,
    width: "90%",
    alignItems: "center",
  },
  videoContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  thumbnail: {
    width: 300,
    height: 170,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  videoText: {
    color: "#FFFFFF",
    marginTop: 5,
    fontSize: 14,
  },
  compareButton: {
    marginTop: 20,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  compareText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
