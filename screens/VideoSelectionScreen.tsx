// ./screens/VideoSelectionScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import type { NavigationProp } from "@react-navigation/native";

interface Props {
  navigation: NavigationProp<any>;
}

interface VideoItem {
  id: string;
  uri: string;
  name: string;
}

export default function VideoSelectionScreen({ navigation }: Props) {
  const [videos, setVideos] = useState<VideoItem[]>([]);

  const pickVideo = async () => {
    if (Platform.OS === "ios") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission required",
          "Please grant access to your photo library."
        );
        return;
      }
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled) {
        const selectedVideos = result.assets.map((asset, index) => ({
          id: String(Date.now() + index),
          uri: asset.uri,
          name: asset.filename || "Unnamed Video",
        }));
        setVideos((prev) => [...prev, ...selectedVideos]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to access your video library.");
    }
  };

  const startComparison = () => {
    if (videos.length < 2) {
      Alert.alert(
        "Select Two Videos",
        "Please select at least two videos to compare before continuing."
      );
      return;
    }

    navigation.navigate("VideoCompare", {
      video1: videos[0].uri,
      video2: videos[1].uri,
    });
  };

  const resetSelection = () => setVideos([]);

  const renderVideo = ({ item }: { item: VideoItem }) => (
    <View style={styles.videoItem}>
      <Ionicons name="videocam" size={20} color="#FFFFFF" />
      <Text style={styles.videoText}>{item.name}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Top Icon */}
      <Ionicons name="bicycle-outline" size={50} color="#FFFFFF" style={{ marginBottom: 10 }} />
      <Text style={styles.title}>Select Runs</Text>

      <FlatList
        data={videos}
        renderItem={renderVideo}
        keyExtractor={(item) => item.id}
        style={styles.list}
        ListEmptyComponent={
          <Text style={styles.placeholder}>No videos selected yet.</Text>
        }
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity onPress={pickVideo} style={styles.actionButton}>
          <Ionicons name="add-circle-outline" size={28} color="#FFFFFF" />
          <Text style={styles.buttonText}>Add Video</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={resetSelection} style={styles.actionButton}>
          <Ionicons name="trash-outline" size={28} color="#FFFFFF" />
          <Text style={styles.buttonText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={startComparison}
        style={[
          styles.startButton,
          { opacity: videos.length >= 2 ? 1 : 0.5 },
        ]}
        disabled={videos.length < 2}
      >
        <Ionicons name="speedometer" size={28} color="#FFFFFF" />
        <Text style={styles.startButtonText}>Compare Runs</Text>
      </TouchableOpacity>
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
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 20,
  },
  list: {
    width: "100%",
    maxHeight: 250,
    marginBottom: 30,
  },
  videoItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
  },
  videoText: {
    color: "#FFFFFF",
    marginLeft: 10,
  },
  placeholder: {
    textAlign: "center",
    color: "#AAA",
    marginTop: 40,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
    marginBottom: 40,
  },
  actionButton: {
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    marginTop: 4,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 18,
    marginLeft: 8,
  },
});
