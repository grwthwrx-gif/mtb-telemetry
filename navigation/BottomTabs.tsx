import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { View, StyleSheet } from "react-native";

import VideoSelectionScreen from "../screens/VideoSelectionScreen";
import VideoCompareScreen from "../screens/VideoCompareScreen";

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: true,
          tabBarActiveTintColor: "#FFFFFF",
          tabBarInactiveTintColor: "rgba(255,255,255,0.6)",
          tabBarStyle: {
            backgroundColor: "rgba(11,12,16,0.95)",
            borderTopColor: "rgba(255,255,255,0.1)",
            height: 80,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
          },
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap = "ellipse";
            let backgroundColor = focused
              ? "rgba(255,255,255,0.15)"
              : "transparent";

            if (route.name === "Select Run") {
              iconName = focused ? "film" : "film-outline";
            } else if (route.name === "Compare Runs") {
              iconName = focused ? "analytics" : "analytics-outline";
            }

            return (
              <View style={[styles.iconContainer, { backgroundColor }]}>
                <Ionicons name={iconName} size={size} color={color} />
              </View>
            );
          },
        })}
      >
        <Tab.Screen name="Select Run" component={VideoSelectionScreen} />
        <Tab.Screen name="Compare Runs" component={VideoCompareScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    borderRadius: 50,
    padding: 10,
  },
});
