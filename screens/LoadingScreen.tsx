import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';

export default function LoadingScreen({ navigation }) {
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => navigation.replace('Entry'), 1000);
    });
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../assets/splash_dark.png')}
        style={[styles.logo, { opacity: fadeAnim }]}
      />
      <Text style={styles.text}>mtb telemetry</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0C10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  text: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 28,
    color: '#00FFF7',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
