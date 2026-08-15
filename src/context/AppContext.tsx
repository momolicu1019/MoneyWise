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
import { Alert } from 'react-native';
import type { Expense, GoogleUser, Salary, SalaryFilterId } from '../types';
import {
  configureGoogleSignIn,
  getValidAccessToken,
  isGoogleCancelError,
  isGoogleConfigured,
  loadStoredUser,
  signInWithGoogleNative,
  signOutFromGoogle,
} from '../services/googleAuth';
import { pullFromDrive, pushToDrive } from '../services/googleDrive';
import { loadLocalPayload, makePayload, saveLocalPayload } from '../services/storage';

type AppContextValue = {
  ready: boolean;
  user: GoogleUser | null;
  isSyncing: boolean;
  lastSyncedAt: string | null;
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
  googleConfigured: boolean;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedSalaryId, setSelectedSalaryId] = useState<SalaryFilterId>('all');
  const [viewDate, setViewDate] = useState(() => new Date());
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const googleConfigured = isGoogleConfigured();

  const persistAndSync = useCallback(
    (nextSalaries: Salary[], nextExpenses: Expense[]) => {
      const payload = makePayload(nextSalaries, nextExpenses);
      void saveLocalPayload(payload);
      if (syncTimer.current) clearTimeout(syncTimer.current);
      syncTimer.current = setTimeout(() => {
        void (async () => {
          const token = await getValidAccessToken();
          if (!token) return;
          try {
            setIsSyncing(true);
            await pushToDrive(token, payload);
            setLastSyncedAt(payload.updatedAt);
          } catch (error) {
            console.warn('Drive sync failed', error);
          } finally {
            setIsSyncing(false);
          }
        })();
      }, 800);
    },
    [],
  );

  const hydrateFromCloud = useCallback(async () => {
    const token = await getValidAccessToken();
    if (!token) return;
    try {
      setIsSyncing(true);
      const cloud = await pullFromDrive(token);
      if (cloud) {
        setSalaries(cloud.salaries || []);
        setExpenses(cloud.expenses || []);
        setLastSyncedAt(cloud.updatedAt);
        await saveLocalPayload(cloud);
      } else {
        const local = await loadLocalPayload();
        if (local) await pushToDrive(token, local);
      }
    } catch (error) {
      console.warn('Drive restore failed', error);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    configureGoogleSignIn();
    void (async () => {
      const local = await loadLocalPayload();
      if (local) {
        setSalaries(local.salaries || []);
        setExpenses(local.expenses || []);
        setLastSyncedAt(local.updatedAt);
      }
      const storedUser = await loadStoredUser();
      if (storedUser) {
        setUser(storedUser);
        await hydrateFromCloud();
      }
      setReady(true);
    })();
  }, [hydrateFromCloud]);

  const signInWithGoogle = useCallback(async () => {
    if (!googleConfigured) {
      Alert.alert(
        'Google not configured',
        'Add your Google OAuth Web and Android client IDs, then create a new EAS build.',
      );
      return;
    }
    try {
      const profile = await signInWithGoogleNative();
      setUser(profile);
      await hydrateFromCloud();
    } catch (error) {
      if (isGoogleCancelError(error)) return;
      Alert.alert('Google sign-in failed', error instanceof Error ? error.message : 'Unknown error');
    }
  }, [googleConfigured, hydrateFromCloud]);

  const signOut = useCallback(async () => {
    await signOutFromGoogle();
    setUser(null);
  }, []);

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
      lastSyncedAt,
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
      googleConfigured,
    }),
    [
      changeMonth,
      expenses,
      googleConfigured,
      isSyncing,
      lastSyncedAt,
      ready,
      removeExpense,
      removeSalary,
      salaries,
      selectedSalaryId,
      signInWithGoogle,
      signOut,
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
