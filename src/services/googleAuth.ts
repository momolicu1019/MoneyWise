import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import * as SecureStore from 'expo-secure-store';
import type { GoogleUser } from '../types';

const ACCESS_TOKEN_KEY = 'moneywise.google.accessToken';
const EXPIRES_AT_KEY = 'moneywise.google.expiresAt';
const USER_KEY = 'moneywise.google.user';

export const GOOGLE_SCOPES = ['https://www.googleapis.com/auth/drive.appdata'];

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

export function configureGoogleSignIn(): void {
  const { webClientId, iosClientId } = getGoogleClientIds();
  GoogleSignin.configure({
    webClientId: webClientId || undefined,
    iosClientId: iosClientId || undefined,
    scopes: GOOGLE_SCOPES,
    offlineAccess: Boolean(webClientId),
  });
}

export async function saveAuthSession(params: {
  accessToken: string;
  expiresIn?: number;
  user: GoogleUser;
}): Promise<void> {
  const expiresAt = Date.now() + (params.expiresIn || 3500) * 1000;
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, params.accessToken);
  await SecureStore.setItemAsync(EXPIRES_AT_KEY, String(expiresAt));
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(params.user));
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
    SecureStore.deleteItemAsync(EXPIRES_AT_KEY),
    SecureStore.deleteItemAsync(USER_KEY),
  ]);
}

function toAppUser(name: string | null, email: string, photo: string | null): GoogleUser {
  return {
    name: name || 'Google User',
    email,
    picture: photo || undefined,
  };
}

export async function signInWithGoogleNative(): Promise<GoogleUser> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  if (response.type !== 'success') {
    const error = new Error('Google sign-in was cancelled');
    (error as { code?: string }).code = 'cancelled';
    throw error;
  }

  const tokens = await GoogleSignin.getTokens();
  const user = toAppUser(
    response.data.user.name,
    response.data.user.email,
    response.data.user.photo,
  );
  await saveAuthSession({ accessToken: tokens.accessToken, user });
  return user;
}

export async function signOutFromGoogle(): Promise<void> {
  try {
    await GoogleSignin.signOut();
  } catch {
    // Ignore native sign-out errors and still clear local session.
  }
  await clearAuthSession();
}

export async function getValidAccessToken(): Promise<string | null> {
  try {
    if (GoogleSignin.hasPreviousSignIn()) {
      const tokens = await GoogleSignin.getTokens();
      if (tokens.accessToken) {
        await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken);
        await SecureStore.setItemAsync(EXPIRES_AT_KEY, String(Date.now() + 3500 * 1000));
        return tokens.accessToken;
      }
    }
  } catch {
    // Fall through to the stored token.
  }

  const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  const expiresAtRaw = await SecureStore.getItemAsync(EXPIRES_AT_KEY);
  const expiresAt = expiresAtRaw ? Number(expiresAtRaw) : 0;
  if (token && Date.now() < expiresAt - 30_000) return token;
  return token;
}

export function isGoogleCancelError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = 'code' in error ? String(error.code) : '';
  return code === 'cancelled' || code === String(statusCodes.SIGN_IN_CANCELLED);
}
