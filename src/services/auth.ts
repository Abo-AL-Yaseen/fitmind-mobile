import * as SecureStore from 'expo-secure-store';
import { apiFetch } from './api';

const AUTH_TOKEN_KEY = 'fitmind_token';
const AUTH_ROLE_KEY = 'fitmind_role';
const AUTH_USER_ID_KEY = 'fitmind_user_id';
const AUTH_USER_NAME_KEY = 'fitmind_user_name';
const AUTH_EMAIL_KEY = 'fitmind_email';

const RESET_TOKEN_KEY = 'fitmind_reset_token';
const RESET_EMAIL_KEY = 'fitmind_reset_email';

export interface LoginResponse {
  message: string;
  token: string;
  role: string;
  user_id: number;
  user_name: string;
  email: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface StoredAuth {
  token: string | null;
  role: string | null;
  userId: string | null;
  userName: string | null;
  email: string | null;
}

export interface ApiMessageResponse {
  message: string;
}

export interface VerifyOtpResponse {
  message: string;
  reset_token: string;
}

export interface StoredResetData {
  resetToken: string | null;
  resetEmail: string | null;
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function forgotPassword(email: string): Promise<ApiMessageResponse> {
  return apiFetch<ApiMessageResponse>('/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function verifyOtp(
  email: string,
  OTP: string
): Promise<VerifyOtpResponse> {
  return apiFetch<VerifyOtpResponse>('/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, OTP }),
  });
}

export async function saveResetData(
  resetToken: string,
  email: string
): Promise<void> {
  await SecureStore.setItemAsync(RESET_TOKEN_KEY, resetToken);
  await SecureStore.setItemAsync(RESET_EMAIL_KEY, email);
}

export async function getResetData(): Promise<StoredResetData> {
  const [resetToken, resetEmail] = await Promise.all([
    SecureStore.getItemAsync(RESET_TOKEN_KEY),
    SecureStore.getItemAsync(RESET_EMAIL_KEY),
  ]);

  return {
    resetToken,
    resetEmail,
  };
}

export async function clearResetData(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(RESET_TOKEN_KEY),
    SecureStore.deleteItemAsync(RESET_EMAIL_KEY),
  ]);
}

export async function saveAuth(data: LoginResponse): Promise<void> {
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, data.token);
  await SecureStore.setItemAsync(AUTH_ROLE_KEY, data.role);
  await SecureStore.setItemAsync(AUTH_USER_ID_KEY, String(data.user_id));
  await SecureStore.setItemAsync(AUTH_USER_NAME_KEY, data.user_name ?? '');
  await SecureStore.setItemAsync(AUTH_EMAIL_KEY, data.email ?? '');
}

export async function getAuth(): Promise<StoredAuth> {
  const [token, role, userId, userName, email] = await Promise.all([
    SecureStore.getItemAsync(AUTH_TOKEN_KEY),
    SecureStore.getItemAsync(AUTH_ROLE_KEY),
    SecureStore.getItemAsync(AUTH_USER_ID_KEY),
    SecureStore.getItemAsync(AUTH_USER_NAME_KEY),
    SecureStore.getItemAsync(AUTH_EMAIL_KEY),
  ]);

  return {
    token,
    role,
    userId,
    userName,
    email,
  };
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
}

export async function getUserId(): Promise<string | null> {
  return SecureStore.getItemAsync(AUTH_USER_ID_KEY);
}

export async function getUserName(): Promise<string | null> {
  return SecureStore.getItemAsync(AUTH_USER_NAME_KEY);
}

export async function getEmail(): Promise<string | null> {
  return SecureStore.getItemAsync(AUTH_EMAIL_KEY);
}

export async function getRole(): Promise<string | null> {
  return SecureStore.getItemAsync(AUTH_ROLE_KEY);
}

export async function clearAuth(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(AUTH_TOKEN_KEY),
    SecureStore.deleteItemAsync(AUTH_ROLE_KEY),
    SecureStore.deleteItemAsync(AUTH_USER_ID_KEY),
    SecureStore.deleteItemAsync(AUTH_USER_NAME_KEY),
    SecureStore.deleteItemAsync(AUTH_EMAIL_KEY),
    SecureStore.deleteItemAsync(RESET_TOKEN_KEY),
    SecureStore.deleteItemAsync(RESET_EMAIL_KEY),
  ]);
}

export async function logout(): Promise<ApiMessageResponse> {
  try {
    const response = await apiFetch<ApiMessageResponse>('/logout', {
      method: 'POST',
    });

    await clearAuth();
    return response;
  } catch (error) {
    await clearAuth();
    throw error;
  }
}

export async function resetPassword(
  resetToken: string,
  password: string,
  passwordConfirmation: string
): Promise<ApiMessageResponse> {
  return apiFetch<ApiMessageResponse>('/reset-password', {
    method: 'POST',
    body: JSON.stringify({
      reset_token: resetToken,
      password,
      password_confirmation: passwordConfirmation,
    }),
  });
}