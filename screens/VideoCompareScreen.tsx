// screens/VideoCompareScreen.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Video } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";

export default function VideoCompareScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const videoUri = route.params?.videoUri || null;

  return (
    <View style={styles.container}>
      <Ionicons name="stats-chart-outline" size={60} color="#FFFFFF" style={{ marginBottom: 20 }} />

      {videoUri ? (
        <>
          <Video
            source={{ uri: videoUri }}
            style={styles.video}
            useNativeControls
            resizeMode="contain"
          />
          <Text style={styles.infoText}>Now comparing selected run...</Text>
        </>
      ) : (
        <>
          <Text style={styles.warningText}>⚠️ No video selected</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate("VideoSelection" as never)}
          >
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            <Text style={styles.backButtonText}>Go Select a Run</Text>
          </TouchableOpacity>
        </>
      )}
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
  video: {
    width: "100%",
    height: 300,
    borderRadius: 16,
    backgroundColor: "#1A1C21",
  },
  infoText: {
    color: "#FFFFFF",
    fontSize: 16,
    marginTop: 20,
    textAlign: "center",
    fontFamily: "Orbitron-Regular",
  },
  warningText: {
    color: "#FF2975",
    fontSize: 18,
    fontFamily: "Orbitron-Bold",
    marginBottom: 20,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1C21",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderColor: "#00FFF7",
    borderWidth: 1,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Orbitron-Regular",
    marginLeft: 10,
  },
});
