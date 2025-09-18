import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import LoadingScreen from "./LoadingScreen";
import DashboardScreen from "./DashboardScreen";

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500); // Show loading screen for 2.5s
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {isLoading ? <LoadingScreen /> : <DashboardScreen />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
