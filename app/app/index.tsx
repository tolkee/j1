import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { StatusBar } from "expo-status-bar";

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to J1</Text>
        <Text style={styles.subtitle}>Clean Expo Router App</Text>
        <Text style={styles.description}>
          This is a clean Expo app with Expo Router, built without Tamagui.
          It maintains the same architecture and structure as the original app.
        </Text>
        <View style={styles.features}>
          <Text style={styles.featureTitle}>Features:</Text>
          <Text style={styles.feature}>• Expo Router for navigation</Text>
          <Text style={styles.feature}>• TypeScript support</Text>
          <Text style={styles.feature}>• Path aliases (@/common, @/services)</Text>
          <Text style={styles.feature}>• Clean architecture structure</Text>
          <Text style={styles.feature}>• Ready for backend integration</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    color: "#555",
    marginBottom: 32,
  },
  features: {
    alignItems: "flex-start",
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  feature: {
    fontSize: 16,
    marginBottom: 6,
    color: "#555",
  },
});