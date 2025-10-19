import 'react-native-reanimated';
import React from 'react';
import BottomTabs from './navigation/BottomTabs';
import { StatusBar } from 'react-native';

export default function App() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#0B0C10" />
      <BottomTabs />
    </>
  );
}

