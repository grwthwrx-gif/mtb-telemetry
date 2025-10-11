import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { useFonts } from "expo-font";
import { View, ActivityIndicator } from "react-native";

import Branding from "./components/Branding"; // Optional logo animation
import LoadingScreen from "./screens/LoadingScreen";
import EntryScreen from "./screens/EntryScreen";
import VideoSelectionScreen from "./screens/VideoSelectionScreen";
import VideoCompareScreen from "./screens/VideoCompareScreen";
// import Dashboard from "./screens/Dashboard"; // Uncomment if used

const Stack = createStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    Orbitron: require("./assets/fonts/Orbitron-Regular.ttf"),
    "Orbitron-Bold": require("./assets/fonts/Orbitron-Bold.ttf"),
  });

  // ✅ Replace deprecated AppLoading with a simple fallback
  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0B0C10",
        }}
      >
        <ActivityIndicator size="large" color="#00FFF7" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Loading"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Loading" component={LoadingScreen} />
        <Stack.Screen name="Entry" component={EntryScreen} />
        <Stack.Screen name="VideoSelection" component={VideoSelectionScreen} />
        <Stack.Screen name="VideoCompare" component={VideoCompareScreen} />
        {/* <Stack.Screen name="Dashboard" component={Dashboard} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
