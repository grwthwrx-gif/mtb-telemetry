import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import LoadingScreen from './LoadingScreen';
import EntryScreen from './screens/EntryScreen';
import CompareVideosScreen from './screens/CompareVideosScreen';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // show loading screen for 2s
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Entry" component={EntryScreen} />
        <Stack.Screen name="CompareVideos" component={CompareVideosScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
