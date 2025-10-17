// LoadingScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Animated, Text, StyleSheet } from 'react-native';

export default function LoadingScreen({ navigation }) {
  const [progress] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animate progress bar from 0 to 100% over 2 seconds
    Animated.timing(progress, {
      toValue: 100,
      duration: 2000,
      useNativeDriver: false,
    }).start(() => {
      // Navigate to EntryScreen after animation completes
      navigation.replace('Entry');
    });
  }, []);

  // Interpolate width from 0% → 100%
  const widthInterpolated = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '80%'], // bar max width is 80% of screen width
  });

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Loading...</Text>
      <View style={styles.barBackground}>
        <Animated.View style={[styles.barFill, { width: widthInterpolated }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0C10',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  text: {
    color: '#FFFFFF',
    fontFamily: 'Orbitron-Bold',
    fontSize: 20,
    marginBottom: 20,
  },
  barBackground: {
    width: '80%',
    height: 10,
    backgroundColor: '#1A1C21',
    borderRadius: 5,
  },
  barFill: {
    height: 10,
    backgroundColor: '#00FFF7',
    borderRadius: 5,
  },
});
