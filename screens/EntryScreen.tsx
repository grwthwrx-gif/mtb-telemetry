import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";

export default function EntryScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.title, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        Choose Session
      </Animated.Text>

      <Animated.View style={{ opacity: fadeAnim }}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("VideoSelection")}>
          <Text style={styles.buttonText}>Individual</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("VideoSelection")}>
          <Text style={styles.buttonText}>Group</Text>
        </TouchableOpacity>
      </Animated.View>
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
    fontSize: 36,
    color: "#FF2975",
    marginBottom: 40,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  button: {
    backgroundColor: "#00FFF7",
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 12,
    marginVertical: 10,
  },
  buttonText: {
    fontFamily: "Orbitron-Bold",
    fontSize: 18,
    color: "#0B0C10",
    textTransform: "uppercase",
  },
});
