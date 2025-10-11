import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { RouteProp } from "@react-navigation/native";

// ✅ Strongly typed navigation routes
type RootStackParamList = {
  Entry: undefined;
  VideoSelection: undefined;
  VideoCompare: { video1: string; video2: string };
};

type VideoSelectionScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "VideoSelection"
>;

type Props = {
  navigation: VideoSelectionScreenNavigationProp;
};

export default function VideoSelectionScreen({ navigation }: Props) {
  const [video1, setVideo1] = useState<string | null>(null);
  const [video2, setVideo2] = useState<string | null>(null);

  const pickVideo = async (setter: (uri: string) => void) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "video/*",
        multiple: false,
        copyToCacheDirectory: true,
      });

      // ✅ Handle both legacy & modern formats
      if (result.canceled) return;

      const uri = result.assets?.[0]?.uri;
      if (uri) setter(uri);
      else Alert.alert("Error", "Unable to load video file");
    } catch (err) {
      console.error("Video pick error:", err);
      Alert.alert("Error", "There was an issue selecting the video.");
    }
  };

  const startCompare = () => {
    if (video1 && video2) {
      navigation.navigate("VideoCompare", { video1, video2 });
    } else {
      Alert.alert("Select Two Videos", "Please select both videos before comparing.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎥 Select Two Videos</Text>

      <TouchableOpacity style={styles.button} onPress={() => pickVideo(setVideo1)}>
        <Text style={styles.buttonText}>
          {video1 ? "✅ Video 1 Selected" : "Pick Video 1"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => pickVideo(setVideo2)}>
        <Text style={styles.buttonText}>
          {video2 ? "✅ Video 2 Selected" : "Pick Video 2"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: video1 && video2 ? "#00FFF7" : "#333",
          },
        ]}
        onPress={startCompare}
        disabled={!video1 || !video2}
      >
        <Text style={[styles.buttonText, { color: "#0B0C10" }]}>🚀 Start Compare</Text>
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
    fontFamily: "Orbitron-Bold",
    fontSize: 26,
    color: "#FFFFFF",
    marginBottom: 40,
    textTransform: "uppercase",
  },
  button: {
    backgroundColor: "#FF2975",
    paddingVertical: 15,
    borderRadius: 12,
    marginVertical: 10,
    width: "80%",
    alignItems: "center",
  },
  buttonText: {
    fontFamily: "Orbitron-Bold",
    color: "#FFFFFF",
    fontSize: 18,
    textTransform: "uppercase",
  },
});
