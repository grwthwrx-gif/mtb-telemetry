import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CompareVideosScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Mock Compare Videos Screen</Text>
      <Text style={styles.subtext}>
        This is a placeholder for the video player + speedometer.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  subtext: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
