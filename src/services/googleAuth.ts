import * as SecureStore from 'expo-secure-store';
import type { GoogleUser } from '../types';

const ACCESS_TOKEN_KEY = 'moneywise.google.accessToken';
const REFRESH_TOKEN_KEY = 'moneywise.google.refreshToken';
const EXPIRES_AT_KEY = 'moneywise.google.expiresAt';
const USER_KEY = 'moneywise.google.user';

export const GOOGLE_SCOPES = [
  'openid',
  'profile',
  'email',
  'https://www.googleapis.com/auth/drive.appdata',
];

export function getGoogleClientIds() {
  return {
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
  };
}

export function isGoogleConfigured(): boolean {
  const { webClientId, androidClientId } = getGoogleClientIds();
  return Boolean(webClientId || androidClientId);
}

export async function saveAuthSession(params: {
  accessToken: string;
  refreshToken?: string | null;
  expiresIn?: number;
  user: GoogleUser;
}): Promise<void> {
  const expiresAt = Date.now() + (params.expiresIn || 3500) * 1000;
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, params.accessToken);
  await SecureStore.setItemAsync(EXPIRES_AT_KEY, String(expiresAt));
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(params.user));
  if (params.refreshToken) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, params.refreshToken);
  }
}

export async function loadStoredUser(): Promise<GoogleUser | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GoogleUser;
  } catch {
    return null;
  }
}

export async function clearAuthSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(EXPIRES_AT_KEY),
    SecureStore.deleteItemAsync(USER_KEY),
  ]);
}

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const { webClientId, androidClientId } = getGoogleClientIds();
  const clientId = webClientId || androidClientId;
  if (!clientId) return null;

  const body = new URLSearchParams({
    client_id: clientId,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!response.ok) return null;
  const json = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) return null;
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, json.access_token);
  await SecureStore.setItemAsync(
    EXPIRES_AT_KEY,
    String(Date.now() + (json.expires_in || 3500) * 1000),
  );
  return json.access_token;
}

export async function getValidAccessToken(): Promise<string | null> {
  const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  const expiresAtRaw = await SecureStore.getItemAsync(EXPIRES_AT_KEY);
  const expiresAt = expiresAtRaw ? Number(expiresAtRaw) : 0;
  if (token && Date.now() < expiresAt - 30_000) return token;

  const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  if (refreshToken) {
    const refreshed = await refreshAccessToken(refreshToken);
    if (refreshed) return refreshed;
  }
  return token;
}

export async function fetchGoogleUser(accessToken: string): Promise<GoogleUser> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error('Could not load Google profile');
  }
  const json = (await response.json()) as { name?: string; email?: string; picture?: string };
  return {
    name: json.name || 'Google User',
    email: json.email || '',
    picture: json.picture,
  };
}
