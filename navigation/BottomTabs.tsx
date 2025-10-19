import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import VideoSelectionScreen from '../screens/VideoSelectionScreen';
import VideoCompareScreen from '../screens/VideoCompareScreen';

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#0B0C10',
            borderTopColor: '#1A1C21',
          },
          tabBarActiveTintColor: '#00FFF7',
          tabBarInactiveTintColor: '#555',
          tabBarIcon: ({ color, size, focused }) => {
            let iconName: keyof typeof Ionicons.glyphMap = 'ellipse';

            if (route.name === 'Select') iconName = 'film-outline';
            else if (route.name === 'Compare') iconName = 'git-compare-outline';

            return (
              <Ionicons
                name={iconName}
                size={size}
                color={color}
                style={{
                  textShadowColor: focused ? '#00FFF7' : 'transparent',
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: focused ? 8 : 0,
                }}
              />
            );
          },
        })}
      >
        <Tab.Screen
          name="Select"
          component={VideoSelectionScreen}
          options={{ title: 'Select Run' }}
        />
        <Tab.Screen
          name="Compare"
          component={VideoCompareScreen}
          options={{ title: 'Compare Runs' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

