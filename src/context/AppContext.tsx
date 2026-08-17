import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Alert, AppState, type AppStateStatus } from 'react-native';
import type { Expense, GoogleUser, Salary, SalaryFilterId, SyncStatus } from '../types';
import {
  configureGoogleSignIn,
  getValidAccessToken,
  isGoogleCancelError,
  isGoogleConfigured,
  loadStoredUser,
  signInWithGoogleNative,
  signOutFromGoogle,
} from '../services/googleAuth';
import { formatSyncError, pullFromDrive, pushToDrive } from '../services/googleDrive';
import {
  clearLastCloudSync,
  loadLastCloudSync,
  loadLocalPayload,
  makePayload,
  saveLastCloudSync,
  saveLocalPayload,
} from '../services/storage';

type AppContextValue = {
  ready: boolean;
  user: GoogleUser | null;
  isSyncing: boolean;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  syncError: string | null;
  salaries: Salary[];
  expenses: Expense[];
  selectedSalaryId: SalaryFilterId;
  viewDate: Date;
  setSelectedSalaryId: (id: SalaryFilterId) => void;
  changeMonth: (delta: number) => void;
  upsertSalary: (salary: Omit<Salary, 'id'> & { id?: string }) => void;
  removeSalary: (id: string) => void;
  upsertExpense: (expense: Omit<Expense, 'id'> & { id?: string }) => void;
  removeExpense: (id: string) => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  syncNow: () => Promise<void>;
  googleConfigured: boolean;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedSalaryId, setSelectedSalaryId] = useState<SalaryFilterId>('all');
  const [viewDate, setViewDate] = useState(() => new Date());
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userRef = useRef<GoogleUser | null>(null);
  const salariesRef = useRef<Salary[]>([]);
  const expensesRef = useRef<Expense[]>([]);
  const didAlertSyncError = useRef(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const syncGen = useRef(0);
  const googleConfigured = isGoogleConfigured();

  useEffect(() => {
    userRef.current = user;
  }, [user]);
  useEffect(() => {
    salariesRef.current = salaries;
  }, [salaries]);
  useEffect(() => {
    expensesRef.current = expenses;
  }, [expenses]);

  const beginSync = useCallback(() => {
    syncGen.current += 1;
    setIsSyncing(true);
    setSyncStatus('syncing');
  }, []);

  const markCloudSynced = useCallback(async (iso: string) => {
    setLastSyncedAt(iso);
    setSyncError(null);
    setSyncStatus('success');
    didAlertSyncError.current = false;
    await saveLastCloudSync(iso);
  }, []);

  const reportSyncError = useCallback((error: unknown, alertAlways = false) => {
    const message = formatSyncError(error);
    setSyncError(message);
    setSyncStatus('error');
    if (alertAlways || !didAlertSyncError.current) {
      didAlertSyncError.current = true;
      Alert.alert('Drive sync failed', message);
    }
  }, []);

  const withDriveToken = useCallback(async <T,>(fn: (token: string) => Promise<T>): Promise<T> => {
    let token = await getValidAccessToken();
    if (!token) {
      throw new Error('Could not get a Google Drive token. Log out and sign in again, then allow Drive access.');
    }
    try {
      return await fn(token);
    } catch (error) {
      const message = formatSyncError(error);
      if (!/Drive permission/i.test(message)) throw error;
      token = await getValidAccessToken(true);
      if (!token) throw error;
      return fn(token);
    }
  }, []);

  const pushLatestToDrive = useCallback(async () => {
    if (!userRef.current) return;
    const gen = syncGen.current;
    const latest = await loadLocalPayload();
    if (!latest) {
      if (syncGen.current === gen) setIsSyncing(false);
      return;
    }
    try {
      await withDriveToken((token) => pushToDrive(token, latest));
      if (syncGen.current === gen) await markCloudSynced(latest.updatedAt);
    } catch (error) {
      if (syncGen.current === gen) reportSyncError(error);
    } finally {
      if (syncGen.current === gen) setIsSyncing(false);
    }
  }, [markCloudSynced, reportSyncError, withDriveToken]);

  const persistAndSync = useCallback(
    (nextSalaries: Salary[], nextExpenses: Expense[]) => {
      salariesRef.current = nextSalaries;
      expensesRef.current = nextExpenses;
      const payload = makePayload(nextSalaries, nextExpenses);
      void saveLocalPayload(payload);
      if (!userRef.current) return;
      beginSync();
      if (syncTimer.current) clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(() => {
        void pushLatestToDrive();
      }, 800);
    },
    [beginSync, pushLatestToDrive],
  );

  const reconcileWithDrive = useCallback(
    async (alertAlways = false) => {
      if (!userRef.current) return;
      beginSync();
      const gen = syncGen.current;
      try {
        await withDriveToken(async (token) => {
          const cloud = await pullFromDrive(token);
          const local = await loadLocalPayload();
          if (cloud && (!local || cloud.updatedAt >= local.updatedAt)) {
            const nextSalaries = cloud.salaries || [];
            const nextExpenses = cloud.expenses || [];
            // Avoid replacing state with identical payloads so open form drafts stay intact.
            setSalaries((current) =>
              JSON.stringify(current) === JSON.stringify(nextSalaries) ? current : nextSalaries,
            );
            setExpenses((current) =>
              JSON.stringify(current) === JSON.stringify(nextExpenses) ? current : nextExpenses,
            );
            await saveLocalPayload(cloud);
            await markCloudSynced(cloud.updatedAt);
            return;
          }
          if (local) {
            await pushToDrive(token, local);
            await markCloudSynced(local.updatedAt);
            return;
          }
          await markCloudSynced(new Date().toISOString());
        });
      } catch (error) {
        if (syncGen.current === gen) reportSyncError(error, alertAlways);
      } finally {
        if (syncGen.current === gen) setIsSyncing(false);
      }
    },
    [beginSync, markCloudSynced, reportSyncError, withDriveToken],
  );

  useEffect(() => {
    configureGoogleSignIn();
    void (async () => {
      const local = await loadLocalPayload();
      if (local) {
        setSalaries(local.salaries || []);
        setExpenses(local.expenses || []);
      }
      const cloudSync = await loadLastCloudSync();
      if (cloudSync) {
        setLastSyncedAt(cloudSync);
        setSyncStatus('success');
      }
      const storedUser = await loadStoredUser();
      if (storedUser) {
        userRef.current = storedUser;
        setUser(storedUser);
        await reconcileWithDrive();
      }
      setReady(true);
    })();
  }, [reconcileWithDrive]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      const previous = appState.current;
      appState.current = next;
      if (previous.match(/inactive|background/) && next === 'active') {
        void reconcileWithDrive();
      }
    });
    return () => sub.remove();
  }, [reconcileWithDrive]);

  const signInWithGoogle = useCallback(async () => {
    if (!googleConfigured) {
      Alert.alert(
        'Google not configured',
        'Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (OAuth Web client ID), then create a new EAS build.',
      );
      return;
    }
    try {
      const profile = await signInWithGoogleNative();
      userRef.current = profile;
      setUser(profile);
      await reconcileWithDrive(true);
    } catch (error) {
      if (isGoogleCancelError(error)) return;
      Alert.alert('Google sign-in failed', error instanceof Error ? error.message : 'Unknown error');
    }
  }, [googleConfigured, reconcileWithDrive]);

  const signOut = useCallback(async () => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    userRef.current = null;
    await signOutFromGoogle();
    await clearLastCloudSync();
    setUser(null);
    setLastSyncedAt(null);
    setSyncError(null);
    setIsSyncing(false);
    setSyncStatus('idle');
  }, []);

  const syncNow = useCallback(async () => {
    if (!userRef.current) {
      Alert.alert('Not signed in', 'Sign in with Google first to sync between phones.');
      return;
    }
    await reconcileWithDrive(true);
  }, [reconcileWithDrive]);

  const upsertSalary = useCallback(
    (salary: Omit<Salary, 'id'> & { id?: string }) => {
      setSalaries((current) => {
        const next = salary.id
          ? current.map((item) => (item.id === salary.id ? { ...item, ...salary, id: salary.id } : item))
          : [...current, { ...salary, id: `s${Date.now()}` }];
        persistAndSync(next, expenses);
        return next;
      });
    },
    [expenses, persistAndSync],
  );

  const removeSalary = useCallback(
    (id: string) => {
      const nextSalaries = salaries.filter((salary) => salary.id !== id);
      const nextExpenses = expenses.filter((expense) => expense.salaryId !== id);
      setSalaries(nextSalaries);
      setExpenses(nextExpenses);
      if (selectedSalaryId === id) setSelectedSalaryId('all');
      persistAndSync(nextSalaries, nextExpenses);
    },
    [expenses, persistAndSync, salaries, selectedSalaryId],
  );

  const upsertExpense = useCallback(
    (expense: Omit<Expense, 'id'> & { id?: string }) => {
      setExpenses((current) => {
        const next = expense.id
          ? current.map((item) => (item.id === expense.id ? { ...item, ...expense, id: expense.id } : item))
          : [...current, { ...expense, id: `e${Date.now()}` }];
        persistAndSync(salaries, next);
        return next;
      });
    },
    [persistAndSync, salaries],
  );

  const removeExpense = useCallback(
    (id: string) => {
      const next = expenses.filter((expense) => expense.id !== id);
      setExpenses(next);
      persistAndSync(salaries, next);
    },
    [expenses, persistAndSync, salaries],
  );

  const changeMonth = useCallback((delta: number) => {
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      ready,
      user,
      isSyncing,
      syncStatus,
      lastSyncedAt,
      syncError,
      salaries,
      expenses,
      selectedSalaryId,
      viewDate,
      setSelectedSalaryId,
      changeMonth,
      upsertSalary,
      removeSalary,
      upsertExpense,
      removeExpense,
      signInWithGoogle,
      signOut,
      syncNow,
      googleConfigured,
    }),
    [
      changeMonth,
      expenses,
      googleConfigured,
      isSyncing,
      lastSyncedAt,
      syncStatus,
      ready,
      removeExpense,
      removeSalary,
      salaries,
      selectedSalaryId,
      signInWithGoogle,
      signOut,
      syncError,
      syncNow,
      upsertExpense,
      upsertSalary,
      user,
      viewDate,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
