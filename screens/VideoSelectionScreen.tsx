import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import type { StackNavigationProp } from "@react-navigation/stack";

type RootStackParamList = {
  Entry: undefined;
  VideoSelection: undefined;
  VideoCompare: { video1: string; video2: string };
};

type Props = {
  navigation: StackNavigationProp<RootStackParamList, "VideoSelection">;
};

export default function VideoSelectionScreen({ navigation }: Props) {
  const [video1, setVideo1] = useState<string | null>(null);
  const [video2, setVideo2] = useState<string | null>(null);

  const pickVideo = async (setter: React.Dispatch<React.SetStateAction<string | null>>) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "video/*",
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const selected = result.assets?.[0]?.uri || result.uri;
      if (selected) setter(selected);
    } catch (error) {
      console.error("Error selecting video:", error);
      Alert.alert("Error", "There was an issue selecting your video. Please try again.");
    }
  };

  const startCompare = () => {
    if (video1 && video2) {
      navigation.navigate("VideoCompare", { video1, video2 });
    } else {
      Alert.alert("Select Two Videos", "Please choose both videos before starting comparison.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎥 Select Two Videos</Text>

      <TouchableOpacity style={styles.button} onPress={() => pickVideo(setVideo1)}>
        <Text style={styles.buttonText}>{video1 ? "✅ Video 1 Selected" : "Pick Video 1"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => pickVideo(setVideo2)}>
        <Text style={styles.buttonText}>{video2 ? "✅ Video 2 Selected" : "Pick Video 2"}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: video1 && video2 ? "#00FFF7" : "#555" },
        ]}
        onPress={startCompare}
        disabled={!video1 || !video2}
      >
        <Text
          style={[
            styles.buttonText,
            { color: video1 && video2 ? "#0B0C10" : "#999" },
          ]}
        >
          🚀 Start Compare
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#222" }]}
        onPress={() => navigation.navigate("Entry")}
      >
        <Text style={styles.buttonText}>🔄 Start Over</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0C10",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 40,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  button: {
    backgroundColor: "#FF2975",
    paddingVertical: 16,
    borderRadius: 12,
    marginVertical: 10,
    width: "80%",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
});
