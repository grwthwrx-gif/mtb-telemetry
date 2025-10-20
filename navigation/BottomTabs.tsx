import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import VideoSelectionScreen from "../screens/VideoSelectionScreen";
import VideoCompareScreen from "../screens/VideoCompareScreen";

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#00FFF7", // neon cyan highlight
        tabBarInactiveTintColor: "#FFFFFF", // white inactive icons
        tabBarStyle: {
          backgroundColor: "#0B0C10",
          borderTopColor: "#222",
          height: 80,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === "Select Run") {
            iconName = focused ? "cloud-upload" : "cloud-upload-outline";
          } else if (route.name === "Compare Runs") {
            iconName = focused ? "stats-chart" : "stats-chart-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Select Run" component={VideoSelectionScreen} />
      <Tab.Screen name="Compare Runs" component={VideoCompareScreen} />
    </Tab.Navigator>
  );
}
