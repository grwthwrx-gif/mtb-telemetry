import React from 'react';
import { Text } from 'react-native';
import * as Font from 'expo-font';
import AppLoading from 'expo-app-loading';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import LoadingScreen from './screens/LoadingScreen';
import EntryScreen from './screens/EntryScreen';
import Dashboard from './screens/Dashboard';
import CompareVideosScreen from './screens/CompareVideosScreen';

const Stack = createStackNavigator();

export default function App() {
  const [fontsLoaded] = Font.useFonts({
    Orbitron: require('./assets/fonts/Orbitron-Regular.ttf'),
    'Orbitron-Bold': require('./assets/fonts/Orbitron-Bold.ttf'),
  });

  if (!fontsLoaded) {
    return <AppLoading />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Loading" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Loading" component={LoadingScreen} />
        <Stack.Screen name="Entry" component={EntryScreen} />
        <Stack.Screen name="Dashboard" component={Dashboard} />
        <Stack.Screen name="CompareVideos" component={CompareVideosScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
