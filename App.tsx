import 'react-native-reanimated';
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Animated, Easing } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";

import Branding from "./components/Branding"; 
import LoadingScreen from "./screens/LoadingScreen";
import EntryScreen from "./screens/EntryScreen";
import VideoSelectionScreen from "./screens/VideoSelectionScreen";
import VideoCompareScreen from "./screens/VideoCompareScreen";

SplashScreen.preventAutoHideAsync();
const Stack = createStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    Orbitron: require("./assets/fonts/Orbitron-Regular.ttf"),
    "Orbitron-Bold": require("./assets/fonts/Orbitron-Bold.ttf"),
  });

  const [showSplash, setShowSplash] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    async function prepare() {
      if (fontsLoaded) {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }).start();

        setTimeout(async () => {
          setShowSplash(false);
          await SplashScreen.hideAsync();
        }, 2500);
      }
    }
    prepare();
  }, [fontsLoaded]);

  if (!fontsLoaded || showSplash) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0B0C10" }}>
        {showSplash ? (
          <Animated.View style={{ opacity: fadeAnim, alignItems: "center" }}>
            <Branding />
            <View style={{ marginTop: 20 }}>
              <ActivityIndicator size="small" color="#00FFF7" />
            </View>
          </Animated.View>
        ) : (
          <ActivityIndicator size="large" color="#00FFF7" />
        )}
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Loading" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Loading" component={LoadingScreen} />
        <Stack.Screen name="Entry" component={EntryScreen} />
        <Stack.Screen name="VideoSelection" component={VideoSelectionScreen} />
        <Stack.Screen name="VideoCompare" component={VideoCompareScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
