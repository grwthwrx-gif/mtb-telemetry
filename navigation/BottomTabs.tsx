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
          backgroundColor: 'rgba(11, 12, 16, 0.9)', // semi-transparent dark bar
          borderTopWidth: 0,
          position: 'absolute',
          bottom: 0,
          height: 78,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
        tabBarIcon: ({ color, focused }) => {
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
                borderRadius: 24,
                padding: 10,
                marginHorizontal: 14,
              }}
            >
              <IconComponent color={color} size={34} strokeWidth={2.5} />
            </View>
          );
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginTop: -2,
        },
      })}
    >
      <Tab.Screen name="Select Videos" component={VideoSelectionScreen} />
      <Tab.Screen name="Compare" component={VideoCompareScreen} />
    </Tab.Navigator>
  );
}
