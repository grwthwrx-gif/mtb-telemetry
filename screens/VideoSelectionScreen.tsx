import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import * as DocumentPicker from "expo-document-picker";

export default function VideoSelectionScreen({ navigation }: any) {
  const [video1, setVideo1] = useState<string | null>(null);
  const [video2, setVideo2] = useState<string | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  const pickVideo = async (setter: React.Dispatch<React.SetStateAction<string | null>>) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "video/*",
        copyToCacheDirectory: true,
      });
      if (result.assets && result.assets.length > 0) {
        setter(result.assets[0].uri);
      }
    } catch (error) {
      console.warn("Video selection failed:", error);
    }
  };

  const startCompare = () => {
    if (video1 && video2) {
      navigation.navigate("VideoCompare", { video1, video2 });
    }
  };

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.title}>🎥 Select Your Runs</Text>

      <TouchableOpacity style={styles.button} onPress={() => pickVideo(setVideo1)}>
        <Text style={styles.buttonText}>
          {video1 ? "✅ First Run Loaded" : "Load First Run"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => pickVideo(setVideo2)}>
        <Text style={styles.buttonText}>
          {video2 ? "✅ Second Run Loaded" : "Load Second Run"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: video1 && video2 ? "#00FFF7" : "#333",
            shadowColor: video1 && video2 ? "#00FFF7" : "transparent",
          },
        ]}
        onPress={startCompare}
        disabled={!video1 || !video2}
      >
        <Text style={[styles.buttonText, { color: "#0B0C10" }]}>🚀 Compare Runs</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#222" }]}
        onPress={() => navigation.navigate("Entry")}
      >
        <Text style={styles.buttonText}>🔄 Return to Start</Text>
      </TouchableOpacity>
    </Animated.View>
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
    textShadowColor: "#00FFF7",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  button: {
    backgroundColor: "#FF2975",
    paddingVertical: 16,
    borderRadius: 14,
    marginVertical: 12,
    width: "80%",
    alignItems: "center",
    shadowColor: "#FF2975",
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
});
