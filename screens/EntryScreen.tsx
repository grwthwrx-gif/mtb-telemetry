import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function EntryScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Session</Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Dashboard')}>
        <Text style={styles.buttonText}>Individual</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Dashboard')}>
        <Text style={styles.buttonText}>Group</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0C10',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 32,
    color: '#FF2975',
    marginBottom: 40,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  button: {
    backgroundColor: '#00FFF7',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginVertical: 10,
  },
  buttonText: {
    fontFamily: 'Orbitron-Bold',
    fontSize: 18,
    color: '#0B0C10',
    textTransform: 'uppercase',
  },
});
