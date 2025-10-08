import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import Branding from "../config/Branding"; // ✅ make sure path is correct

export default function EntryScreen({ navigation }: any) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Intro fade + slide animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous glow pulse on buttons
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const buttonGlow = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 15],
  });

  return (
    <View style={styles.container}>
      {/* Subtle animated fade-in entry for the whole screen */}
      <Animated.View
        style={[
          styles.inner,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Branding />

        <Text style={styles.title}>Choose Session</Text>

        <Animated.View
          style={{
            shadowColor: "#00FFF7",
            shadowOpacity: 0.9,
            shadowRadius: buttonGlow,
            elevation: 12,
          }}
        >
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate("Dashboard")}
          >
            <Text style={styles.buttonText}>Individual</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={{
            shadowColor: "#FF2975",
            shadowOpacity: 0.9,
            shadowRadius: buttonGlow,
            elevation: 12,
          }}
        >
          <TouchableOpacity
            style={[styles.button, styles.groupButton]}
            onPress={() => navigation.navigate("Dashboard")}
          >
            <Text style={styles.buttonText}>Group</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0C10",
    alignItems: "center",
    justifyContent: "center",
  },
  inner: {
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Orbitron-Bold",
    fontSize: 28,
    color: "#FFFFFF",
    marginVertical: 40,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  button: {
    backgroundColor: "#00FFF7",
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 14,
    marginVertical: 10,
  },
  groupButton: {
    backgroundColor: "#FF2975",
  },
  buttonText: {
    fontFamily: "Orbitron-Bold",
    fontSize: 18,
    color: "#0B0C10",
    textTransform: "uppercase",
  },
});
