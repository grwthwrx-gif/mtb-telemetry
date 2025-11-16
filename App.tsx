import "react-native-reanimated";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import IntroScreen from "./screens/IntroScreen";
import VideoSelectionScreen from "./screens/VideoSelectionScreen";
import VideoCompareScreen from "./screens/VideoCompareScreen";

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animationEnabled: true,
        }}
      >
        <Stack.Screen name="Intro" component={IntroScreen} />
        <Stack.Screen name="VideoSelection" component={VideoSelectionScreen} />
        <Stack.Screen name="VideoCompare" component={VideoCompareScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
