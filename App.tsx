import React from "react";
import * as Font from "expo-font";
import AppLoading from "expo-app-loading";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import Branding from "./components/Branding"; // ✅ Psynk logo animation component
import LoadingScreen from "./screens/LoadingScreen";
import EntryScreen from "./screens/EntryScreen";
import VideoSelectionScreen from "./screens/VideoSelectionScreen";
import VideoCompareScreen from "./screens/VideoCompareScreen";
// Remove Dashboard import if not in use
// import Dashboard from "./screens/Dashboard";

const Stack = createStackNavigator();

export default function App() {
  const [fontsLoaded] = Font.useFonts({
    Orbitron: require("./assets/fonts/Orbitron-Regular.ttf"),
    "Orbitron-Bold": require("./assets/fonts/Orbitron-Bold.ttf"),
  });

  if (!fontsLoaded) {
    return <AppLoading />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Loading" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Loading" component={LoadingScreen} />
        <Stack.Screen name="Entry" component={EntryScreen} />
        <Stack.Screen name="VideoSelection" component={VideoSelectionScreen} />
        <Stack.Screen name="VideoCompare" component={VideoCompareScreen} />
        {/* <Stack.Screen name="Dashboard" component={Dashboard} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
