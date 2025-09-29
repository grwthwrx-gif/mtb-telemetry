import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import Branding from "../components/Branding"; // ✅ Psynk animated logo

export default function LoadingScreen({ navigation }: any) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();

    // Navigate to Entry screen after 2.5s
    const timer = setTimeout(() => {
      navigation.replace("Entry");
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim }}>
        {/* 🔥 Psynk animated logo */}
        <Branding />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0C10", // ✅ Matches brand midnight black
    alignItems: "center",
    justifyContent: "center",
  },
});
