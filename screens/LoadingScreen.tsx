import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";

export default function LoadingScreen({ navigation }: { navigation: any }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      // Wait a bit before moving to the Entry screen
      const timeout = setTimeout(() => navigation.replace("Entry"), 1000);
      return () => clearTimeout(timeout);
    });
  }, [fadeAnim, navigation]);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require("../assets/splash_dark.png")}
        style={[styles.logo, { opacity: fadeAnim }]}
      />
      <Animated.Text style={[styles.text, { opacity: fadeAnim }]}>
        mtb telemetry
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0C10",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 20,
    resizeMode: "contain",
  },
  text: {
    fontFamily: "Orbitron-Bold",
    fontSize: 28,
    color: "#00FFF7",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
});
