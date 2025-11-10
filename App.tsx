import "react-native-reanimated";
import React from "react";
import { StatusBar } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import VideoSelectionScreen from "./screens/VideoSelectionScreen";
import VideoCompareScreen from "./screens/VideoCompareScreen";

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#0B0C10" />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          presentation: "card",
          animationEnabled: true,
        }}
      >
        <Stack.Screen
          name="VideoSelection"
          component={VideoSelectionScreen}
        />
        <Stack.Screen name="VideoCompare" component={VideoCompareScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
