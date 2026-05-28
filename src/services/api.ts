import * as SecureStore from "expo-secure-store";

const API_BASE_URL = "https://3d64-2a02-6680-1106-54d-147f-dcbd-69ff-4601.ngrok-free.app/api";

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  console.log("REQUEST URL:", url);

  const token = await SecureStore.getItemAsync("fitmind_token");

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });

    console.log("STATUS:", response.status);

    const contentType = response.headers.get("content-type") || "";

    let data: any = null;

    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text || "Unexpected server response" };
    }

    console.log("DATA:", data);

    if (!response.ok) {
      const message =
        data?.message ||
        data?.error ||
        "Request failed";

      throw new Error(message);
    }

    return data as T;
  } catch (err: any) {
    console.log("FETCH ERROR:", err);
    throw err;
  }
}