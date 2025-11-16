import React, { useEffect } from "react";
import { View, Text, StyleSheet, Image, Dimensions } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  Layout,
} from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function IntroScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate("VideoSelection" as never);
    }, 1500); // 1.5s branded intro

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        entering={FadeIn.duration(600)}
        exiting={FadeOut.duration(300)}
        layout={Layout}
        style={styles.center}
      >
        {/* LOGO */}
        <Image
          source={require("../assets/icons/psynk/logo_transparent_512.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* BRAND LINE */}
        <Text style={styles.brandLine}>Psynk — Connect. Compare. Compete.</Text>

        {/* TAGLINE */}
        <Text style={styles.tagline}>
          Turn your footage into fast, insightful, competitive progress.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0C10", // exact brand black
    alignItems: "center",
    justifyContent: "center",
  },
  center: {
    width: SCREEN_WIDTH * 0.84,
    alignItems: "center",
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 24,
  },
  brandLine: {
    fontFamily: "Orbitron-Bold",
    fontSize: 20,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 12,
  },
  tagline: {
    fontFamily: "Orbitron",
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    lineHeight: 20,
  },
});
