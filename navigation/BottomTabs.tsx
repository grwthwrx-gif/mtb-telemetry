// navigation/BottomTabs.tsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import VideoSelectionScreen from "../screens/VideoSelectionScreen";
import VideoCompareScreen from "../screens/VideoCompareScreen";

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: "#FFFFFF",
          tabBarInactiveTintColor: "#666666",
          tabBarStyle: {
            backgroundColor: "#0B0C10",
            borderTopColor: "#222",
            height: 80,
            paddingBottom: 10,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 13,
            fontWeight: "600",
            color: "#FFFFFF",
          },
          tabBarIcon: ({ color, size }) => {
            let iconName: string = "";

            if (route.name === "Select Run") {
              iconName = "videocam-outline";
            } else if (route.name === "Compare Runs") {
              iconName = "speedometer-outline";
            }

            return (
              <Ionicons
                name={iconName as any}
                size={size + 6}
                color={color}
                style={{
                  textShadowColor: "#00FFF7",
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 6,
                }}
              />
            );
          },
        })}
      >
        <Tab.Screen
          name="Select Run"
          component={VideoSelectionScreen}
          options={{ tabBarLabel: "Select Run" }}
        />
        <Tab.Screen
          name="Compare Runs"
          component={VideoCompareScreen}
          options={{ tabBarLabel: "Compare Runs" }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
