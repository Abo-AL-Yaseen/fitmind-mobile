import React, { useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { registerForPushNotificationsAsync } from "../../notifications";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLoginMutation } from "../hooks/auth/mutations/useLoginMutation";

export function LoginScreen({ navigation }: { navigation: any }) {
  const loginMutation = useLoginMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [generalError, setGeneralError] = useState("");

  const isLoading = loginMutation.isPending;

  // 🔥 PUSH FUNCTION
  async function registerPushForUser(user: any) {
    try {
      console.log("LOGIN RESULT:", user);
      console.log("🚀 START PUSH REGISTER");

      const token = await registerForPushNotificationsAsync();

      console.log("📱 PUSH TOKEN:", token);

      if (!token) {
        console.log("❌ NO TOKEN GENERATED");
        return;
      }

      const url =
        "https://3d64-2a02-6680-1106-54d-147f-dcbd-69ff-4601.ngrok-free.app/api/save-token";

      const userId = user?.user_id;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          user_id: userId,
          token: token,
        }),
      });

      console.log("📡 STATUS:", response.status);

      const text = await response.text();
      console.log("📦 RAW RESPONSE:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.log("⚠️ NOT JSON RESPONSE");
      }

      console.log("✅ PARSED DATA:", data);

      if (!response.ok) {
        throw new Error(data?.message || text || "Request failed");
      }

      console.log("🎉 PUSH SAVED SUCCESSFULLY");
    } catch (err: any) {
      console.log("🔥 PUSH ERROR FULL:", {
        message: err.message,
        stack: err.stack,
        error: err,
      });
    }
  }

  function validateForm() {
    if (!email || !password) return false;
    return true;
  }

  async function handleLogin() {
    if (!validateForm()) return;

    try {
      setGeneralError("");

      // 🔥 login مرة واحدة فقط
      const user = await loginMutation.mutateAsync({
        email: email.trim(),
        password,
      });

      // حفظ user محلياً
      await AsyncStorage.setItem("user", JSON.stringify(user));

      // 🔥 تسجيل push token
      await registerPushForUser(user);

      // نجاح
      navigation.replace("MainTabs");
    } catch (error) {
      setGeneralError((error as any)?.message || "Login failed");
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <LinearGradient
        colors={["#0D7D6D", "#0a6259", "#085249"]}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{
              padding: 20,
              flexGrow: 1,
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: 28,
                fontWeight: "bold",
                color: "#fff",
                textAlign: "center",
              }}
            >
              FitMind
            </Text>

            <View
              style={{
                backgroundColor: "#fff",
                padding: 20,
                borderRadius: 20,
                marginTop: 30,
              }}
            >
              {/* Email */}
              <Text>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="email"
                style={{ borderBottomWidth: 1, marginBottom: 20 }}
              />

              {/* Password */}
              <Text>Password</Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  style={{ flex: 1, borderBottomWidth: 1 }}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} />
                </TouchableOpacity>
              </View>

              {generalError ? (
                <Text style={{ color: "red", marginTop: 10 }}>
                  {generalError}
                </Text>
              ) : null}

              {/* Button */}
              <TouchableOpacity
                onPress={handleLogin}
                disabled={isLoading}
                style={{
                  backgroundColor: "#0D7D6D",
                  padding: 15,
                  marginTop: 20,
                  borderRadius: 10,
                  alignItems: "center",
                }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>
                    Login
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
