import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Navigation from "./src/navigation/Navigation";

import { registerForPushNotificationsAsync } from "./notifications";

const queryClient = new QueryClient();

export default function App() {

  useEffect(() => {

    async function initPush() {

      const token = await registerForPushNotificationsAsync();

      if (!token) return;

      console.log("SENDING TOKEN:", token);

      try {

        const response = await fetch(
          "http://localhost:8000/api/save-token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: 1,
              token: token,
            }),
          }
        );

        const data = await response.json();

        console.log("SERVER RESPONSE:", data);

      } catch (error) {

        console.log("ERROR:", error);

      }

    }

    initPush();

  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <Navigation />
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}