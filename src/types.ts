export type SalaryFrequency = 'monthly' | 'biweekly' | 'weekly' | 'semimonthly';

export type ExpenseFrequency = 'once' | 'daily' | 'monthly' | 'biweekly' | 'weekly';

export type Salary = {
  id: string;
  name: string;
  amount: number;
  freq: SalaryFrequency;
  savings: number;
  color: string;
  payDate: string;
  secondPayDate?: string;
  secondPayDay?: string;
};

export type Expense = {
  id: string;
  name: string;
  amount: number;
  date: string;
  freq: ExpenseFrequency;
  salaryId: string;
};

export type GoogleUser = {
  name: string;
  email: string;
  picture?: string;
};

export type CloudPayload = {
  version: 1;
  updatedAt: string;
  salaries: Salary[];
  expenses: Expense[];
};

export type SalaryFilterId = 'all' | string;

export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error';
