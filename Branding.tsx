import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";

const Branding = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-40)).current; // motion lines slide in

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Motion lines (slide in from left) */}
      <Animated.View
        style={[
          styles.motionLines,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <View style={styles.line} />
        <View style={[styles.line, { width: 25 }]} />
        <View style={[styles.line, { width: 15 }]} />
      </Animated.View>

      {/* Brand text */}
      <Animated.Text style={[styles.text, { opacity: fadeAnim }]}>
        psynk
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  motionLines: {
    flexDirection: "row",
    marginRight: 10,
  },
  line: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#00FFF7", // electric cyan
    marginHorizontal: 2,
    width: 35,
  },
  text: {
    fontSize: 48,
    fontFamily: "Orbitron-Bold",
    color: "#FFFFFF",
    letterSpacing: 2,
    textTransform: "lowercase",
  },
});

export default Branding;
