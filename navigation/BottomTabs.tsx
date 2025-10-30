import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";
import VideoSelectionScreen from "../screens/VideoSelectionScreen";
import VideoCompareScreen from "../screens/VideoCompareScreen";
import CustomParallelTracksIcon from "../components/CustomParallelTracksIcon";

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "rgba(255,255,255,0.5)",
        tabBarStyle: {
          backgroundColor: "rgba(255,255,255,0.1)",
          borderTopColor: "transparent",
          height: 75,
          position: "absolute",
          left: 20,
          right: 20,
          bottom: 20,
          borderRadius: 20,
          paddingBottom: 8,
          shadowColor: "#000",
          shadowOpacity: 0.4,
          shadowRadius: 8,
        },
        tabBarIcon: ({ color, size, focused }) => {
          let icon;
          if (route.name === "VideoSelection") {
            icon = (
              <Ionicons
                name="film-outline"
                size={focused ? size + 4 : size}
                color={color}
              />
            );
          } else if (route.name === "VideoCompare") {
            icon = (
              <CustomParallelTracksIcon
                size={focused ? size + 6 : size + 2}
                color={color as string}
                strokeWidth={2.25}
              />
            );
          }

          // Add soft white glow for active icon
          return (
            <View style={focused ? styles.activeGlow : null}>{icon}</View>
          );
        },
      })}
    >
      <Tab.Screen name="VideoSelection" component={VideoSelectionScreen} />
      <Tab.Screen name="VideoCompare" component={VideoCompareScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  activeGlow: {
    shadowColor: "#FFFFFF",
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
});
