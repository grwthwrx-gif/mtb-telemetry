import React, { useEffect } from "react";
import { View, Text, StyleSheet, Image, Dimensions } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  withTiming,
  useSharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function IntroScreen() {
  const navigation = useNavigation();

  // Fade-in of entire screen (smooth, premium)
  const fade = useSharedValue(0);

  useEffect(() => {
    fade.value = withTiming(1, { duration: 900 }); // full-screen fade in

    const timer = setTimeout(() => {
      navigation.navigate("VideoSelection" as never);
    }, 2800); // ~2.8s intro

    return () => clearTimeout(timer);
  }, []);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
  }));

  return (
    <Animated.View style={[styles.container, fadeStyle]}>
      {/* Logo */}
      <Animated.View entering={FadeIn.duration(750)} exiting={FadeOut.duration(200)}>
        <Image
          source={require("../assets/icons/psynk/logo_transparent_512.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Strapline */}
      <Animated.View entering={FadeIn.duration(900).delay(300)}>
        <Text style={styles.brandLine}>Connect, Compare, Compete</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  brandLine: {
    fontFamily: "Orbitron-Bold",
    fontSize: 24,
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 10,
  },
});
