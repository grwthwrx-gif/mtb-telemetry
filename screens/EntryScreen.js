import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function EntryScreen({ onSelect }) {
  return (
    <LinearGradient colors={["#0A0F1C", "#1B2A41"]} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Choose Your Session</Text>
        <Text style={styles.subtitle}>
          Ride solo or compare runs with your crew
        </Text>

        <TouchableOpacity
          style={[styles.button, styles.individual]}
          onPress={() => onSelect("individual")}
        >
          <Text style={styles.buttonText}>🚴 Individual</


cd ~/mtb-telemetry

# Make sure screens folder exists
mkdir -p screens

# Create EntryScreen.js
cat > screens/EntryScreen.js << 'EOF'
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function EntryScreen({ navigation }) {
  return (
    <LinearGradient
      colors={['#0f0c29', '#302b63', '#24243e']}
      style={styles.container}
    >
      <Text style={styles.title}>MTB Telemetry</Text>
      <Text style={styles.subtitle}>Choose your session type</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('CompareVideos')}
      >
        <Text style={styles.buttonText}>Individual Session</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.altButton]}
        onPress={() => navigation.navigate('CompareVideos')}
      >
        <Text style={styles.buttonText}>Group Session</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: '#ccc',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#ff6f61',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  altButton: {
    backgroundColor: '#1db954',
  },
  buttonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
});
