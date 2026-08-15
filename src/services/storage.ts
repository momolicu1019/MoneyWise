import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CloudPayload, Expense, Salary } from '../types';

const DATA_KEY = 'moneywise.payload.v1';
const LAST_CLOUD_SYNC_KEY = 'moneywise.lastCloudSync.v1';

export async function loadLocalPayload(): Promise<CloudPayload | null> {
  const raw = await AsyncStorage.getItem(DATA_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CloudPayload;
  } catch {
    return null;
  }
}

export async function saveLocalPayload(payload: CloudPayload): Promise<void> {
  await AsyncStorage.setItem(DATA_KEY, JSON.stringify(payload));
}

export function makePayload(salaries: Salary[], expenses: Expense[], updatedAt?: string): CloudPayload {
  return {
    version: 1,
    updatedAt: updatedAt || new Date().toISOString(),
    salaries,
    expenses,
  };
}

export async function loadLastCloudSync(): Promise<string | null> {
  return AsyncStorage.getItem(LAST_CLOUD_SYNC_KEY);
}

export async function saveLastCloudSync(iso: string): Promise<void> {
  await AsyncStorage.setItem(LAST_CLOUD_SYNC_KEY, iso);
}

export async function clearLastCloudSync(): Promise<void> {
  await AsyncStorage.removeItem(LAST_CLOUD_SYNC_KEY);
}
