import React, { useEffect } from "react";
import { View, Text, StyleSheet, Image, Dimensions } from "react-native";
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function IntroScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.navigate("VideoSelection" as never);
    }, 3500); // 3.5s intro

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        entering={FadeIn.duration(700)}
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
        <Text style={styles.brandLine}>Connect, Compare, Compete</Text>

        {/* TAGLINE REMOVED */}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
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
    fontSize: 22,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 10,
  },
});
