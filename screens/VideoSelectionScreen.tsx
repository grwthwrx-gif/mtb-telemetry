// screens/VideoSelectionScreen.tsx
import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

export default function VideoSelectionScreen() {
  const navigation = useNavigation();
  const [selectedVideos, setSelectedVideos] = useState<{ uri: string }[]>([]);

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Permission required to access your videos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      const newVideos = result.assets.map((asset) => ({ uri: asset.uri }));
      setSelectedVideos(newVideos);
    }
  };

  const startComparison = () => {
    if (selectedVideos.length < 1) {
      alert("Please select at least one video first.");
      return;
    }
    navigation.navigate("VideoCompare" as never, { videos: selectedVideos } as never);
  };

  return (
    <View style={styles.container}>
      {/* Top Icon */}
      <View style={styles.headerIcon}>
        <Ionicons name="film-outline" size={48} color="#FFFFFF" />
      </View>

      <Text style={styles.title}>Select Your Run</Text>

      <TouchableOpacity style={styles.selectButton} onPress={pickVideo}>
        <Ionicons name="videocam-outline" size={24} color="#FFFFFF" style={{ marginRight: 8 }} />
        <Text style={styles.selectButtonText}>Select Video(s)</Text>
      </TouchableOpacity>

      {selectedVideos.length > 0 && (
        <FlatList
          data={selectedVideos}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styles.thumbnailContainer}>
              <Image source={{ uri: item.uri }} style={styles.thumbnail} />
            </View>
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginVertical: 20 }}
        />
      )}

      <TouchableOpacity style={styles.startButton} onPress={startComparison}>
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
    justifyContent: "center",
    padding: 20,
  },
  headerIcon: {
    marginBottom: 10,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F1F1F",
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#00FFF7",
  },
  selectButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  thumbnailContainer: {
    marginRight: 10,
  },
  thumbnail: {
    width: 120,
    height: 80,
    borderRadius: 10,
  },
  startButton: {
    backgroundColor: "#FF2975",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 30,
    marginTop: 10,
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
});
