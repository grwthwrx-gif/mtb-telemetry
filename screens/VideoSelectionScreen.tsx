import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import type { NavigationProp } from "@react-navigation/native";

interface Props {
  navigation: NavigationProp<any>;
}

export default function VideoSelectionScreen({ navigation }: Props) {
  const [video1, setVideo1] = useState<string | null>(null);
  const [video2, setVideo2] = useState<string | null>(null);

  const pickVideo = async (setter: (uri: string) => void) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "video/*",
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setter(uri);
      }
    } catch (err) {
      console.error("Video pick error:", err);
    }
  };

  const startCompare = () => {
    if (video1 && video2) {
      navigation.navigate("VideoCompare", { video1, video2 });
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
        <Text style={styles.buttonText}>🚀 Start Compare</Text>
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
