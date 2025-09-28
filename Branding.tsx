import React from "react";
import { Image, View, StyleSheet } from "react-native";

export const Branding = () => {
  return (
    <View style={styles.container}>
      <Image
        source={require("./assets/images/psynk_logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0B0C10", // matches brand background
  },
  logo: {
    width: 200,
    height: 200,
  },
});

export default Branding;
