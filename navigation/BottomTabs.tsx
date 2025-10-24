// navigation/BottomTabs.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import { Film, Waves } from 'lucide-react-native';
import VideoSelectionScreen from '../screens/VideoSelectionScreen';
import VideoCompareScreen from '../screens/VideoCompareScreen';

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(11, 12, 16, 0.9)', // semi-transparent dark
          borderTopWidth: 0,
          position: 'absolute',
          bottom: 0,
          height: 70,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
        tabBarIcon: ({ color, size, focused }) => {
          let IconComponent;
          if (route.name === 'Select Videos') {
            IconComponent = Film;
          } else if (route.name === 'Compare') {
            IconComponent = Waves;
          }

          return (
            <View
              style={{
                backgroundColor: focused
                  ? 'rgba(255,255,255,0.15)'
                  : 'transparent',
                borderRadius: 20,
                padding: 8,
              }}
            >
              <IconComponent color={color} size={28} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Select Videos" component={VideoSelectionScreen} />
      <Tab.Screen name="Compare" component={VideoCompareScreen} />
    </Tab.Navigator>
  );
}
