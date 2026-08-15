import type { ExpenseFrequency, SalaryFrequency } from '../types';

export function money(n: number): string {
  return '₱' + Math.round(n || 0).toLocaleString('en-PH');
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDisplayDate(iso: string): string {
  const date = parseISODate(iso);
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}/${m}/${date.getFullYear()}`;
}

export function monthTitle(date: Date): string {
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export const salaryFreqLabel: Record<SalaryFrequency, string> = {
  monthly: 'Monthly',
  biweekly: 'Every 2 weeks / Biweekly',
  weekly: 'Weekly',
  semimonthly: 'Twice a month',
};

export const expenseFreqLabel: Record<ExpenseFrequency, string> = {
  once: 'One time',
  daily: 'Daily',
  monthly: 'Monthly',
  biweekly: 'Every 2 weeks',
  weekly: 'Weekly',
};

export function newId(prefix: string): string {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;
}
