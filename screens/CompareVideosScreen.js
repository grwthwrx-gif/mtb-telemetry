import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Video } from 'expo-av';
import { colors } from '../theme';

export default function CompareVideosScreen() {
  const [elapsed, setElapsed] = useState(0);
  const [speed, setSpeed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(prev => prev + 1);
      setSpeed(Math.floor(20 + Math.random() * 30));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <Video
        source={{ uri: 'https://www.w3schools.com/html/mov_bbb.mp4' }}
        rate={1.0}
        volume={1.0}
        isMuted={false}
        resizeMode="cover"
        shouldPlay
        style={styles.video}
      />

      <View style={styles.overlay}>
        <Text style={styles.speed}>{speed} km/h</Text>
        <Text style={styles.elapsed}>{elapsed}s</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  video: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  speed: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    textShadowColor: colors.secondary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  elapsed: {
    fontSize: 22,
    color: colors.secondary,
    fontWeight: '600',
    textShadowColor: colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});
