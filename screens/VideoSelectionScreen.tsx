import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import * as DocumentPicker from "expo-document-picker";

export default function VideoSelectionScreen({ navigation }) {
  const [video1, setVideo1] = useState(null);
  const [video2, setVideo2] = useState(null);

  const pickVideo = async (setter) => {
    const result = await DocumentPicker.getDocumentAsync({ type: "video/*" });
    if (result.type === "success") setter(result.uri);
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
        <Text style={styles.buttonText}>{video1 ? "✅ Video 1 Selected" : "Pick Video 1"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => pickVideo(setVideo2)}>
        <Text style={styles.buttonText}>{video2 ? "✅ Video 2 Selected" : "Pick Video 2"}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: video1 && video2 ? "#00FFF7" : "grey" }]}
        onPress={startCompare}
        disabled={!video1 || !video2}
      >
        <Text style={styles.buttonText}>🚀 Start Compare</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: "#333" }]} onPress={() => navigation.navigate("Entry")}>
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
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#FF2975",
    padding: 16,
    borderRadius: 12,
    marginVertical: 10,
    width: "80%",
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});
