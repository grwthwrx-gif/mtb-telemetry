import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme';

export default function EntryScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Session Type</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('CompareVideos')}
      >
        <Text style={styles.buttonText}>Individual Session</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.groupButton]}
        onPress={() => navigation.navigate('CompareVideos')}
      >
        <Text style={styles.buttonText}>Group Session</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 40,
    textShadowColor: colors.secondary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: colors.secondary,
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 15,
  },
  groupButton: {
    backgroundColor: colors.secondary,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.background,
  },
});
