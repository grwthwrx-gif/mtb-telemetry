import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
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
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "video/*",
      });

      if (result.type === "success") {
        const newVideo: VideoItem = {
          id: String(Date.now()),
          uri: result.uri,
          name: result.name || "Unnamed Video",
        };
        setVideos((prev) => [...prev, newVideo]);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to select video.");
    }
  };

  const startComparison = () => {
    if (videos.length < 2) {
      Alert.alert("Select Two Videos", "Please select at least two videos to compare.");
      return;
    }
    navigation.navigate("VideoCompare", {
      video1: videos[0].uri,
      video2: videos[1].uri,
    });
  };

  const resetSelection = () => {
    setVideos([]);
  };

  const renderVideo = ({ item }: { item: VideoItem }) => (
    <View style={styles.videoItem}>
      <Ionicons name="videocam" size={20} color="#00FFF7" />
      <Text style={styles.videoText}>{item.name}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎥 Select Videos to Compare</Text>

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
          <Ionicons name="add-circle-outline" size={28} color="#00FFF7" />
          <Text style={styles.buttonText}>Add Video</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={resetSelection} style={styles.actionButton}>
          <Ionicons name="trash-outline" size={28} color="#FF2975" />
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
        <Ionicons name="speedometer" size={28} color="#0B0C10" />
        <Text style={styles.startButtonText}>Start Comparison</Text>
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
    color: "#888",
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
    backgroundColor: "#00FFF7",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
    shadowColor: "#00FFF7",
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  startButtonText: {
    color: "#0B0C10",
    fontWeight: "bold",
    fontSize: 18,
    marginLeft: 8,
  },
});
