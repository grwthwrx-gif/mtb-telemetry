import React, { useEffect } from "react";
import { View, Image, StyleSheet, Animated, Text } from "react-native";

export default function LoadingScreen() {
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim }}>
        <Image source={require("./assets/logo.png")} style={styles.logo} />
        <Text style={styles.brand}>FlowSync</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D1B2A", // Deep navy background
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 180,
    height: 180,
    resizeMode: "contain",
    marginBottom: 20,
  },
  brand: {
    fontSize: 26,
    fontWeight: "700",
    color: "#E0E1DD", // Warm light grey text
    letterSpacing: 2,
  },
});
