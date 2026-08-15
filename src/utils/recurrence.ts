import type { Expense, Salary } from '../types';
import { addDays, addMonths, daysInMonth, parseISODate, toISODate } from './format';

const MS_PER_DAY = 86400000;

export function expenseOccursOn(expense: Expense, year: number, month: number, day: number): boolean {
  const base = parseISODate(expense.date);
  const target = new Date(year, month, day);
  const diff = Math.round((target.getTime() - base.getTime()) / MS_PER_DAY);
  if (diff < 0) return false;

  const monthsToPay = expense.monthsToPay || 0;
  if (monthsToPay > 0 && target >= addMonths(base, monthsToPay)) return false;

  if (expense.freq === 'once') return diff === 0;
  if (expense.freq === 'daily') return true;
  if (expense.freq === 'monthly') return base.getDate() === day;
  if (expense.freq === 'weekly') return diff % 7 === 0;
  if (expense.freq === 'biweekly') return diff % 14 === 0;
  return false;
}

export function expensesOnDay(
  expenses: Expense[],
  salaryId: string,
  year: number,
  month: number,
  day: number,
): Expense[] {
  return expenses.filter(
    (expense) => expense.salaryId === salaryId && expenseOccursOn(expense, year, month, day),
  );
}

export function monthExpenseTotal(
  expenses: Expense[],
  salaryId: string,
  year: number,
  month: number,
): number {
  const days = daysInMonth(year, month);
  let total = 0;
  for (let day = 1; day <= days; day += 1) {
    total += expensesOnDay(expenses, salaryId, year, month, day).reduce(
      (sum, expense) => sum + expense.amount,
      0,
    );
  }
  return total;
}

export function resolveSecondPayDate(salary: Salary): Date | null {
  const raw = salary.secondPayDate || salary.secondPayDay;
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return parseISODate(raw);
  const dayNum = parseInt(raw, 10);
  if (!dayNum) return null;
  const first = parseISODate(salary.payDate);
  return new Date(first.getFullYear(), first.getMonth(), dayNum);
}

export function salaryScheduledOnDay(salary: Salary, year: number, month: number, day: number): boolean {
  const date = new Date(year, month, day);
  const start = parseISODate(salary.payDate || toISODate(new Date(year, month, 1)));
  if (date < start) return false;

  const diff = Math.floor((date.getTime() - start.getTime()) / MS_PER_DAY);
  const lastDay = daysInMonth(year, month);
  const startDay = start.getDate();

  if (salary.freq === 'monthly') {
    return day === Math.min(startDay, lastDay);
  }
  if (salary.freq === 'weekly') {
    return diff % 7 === 0;
  }
  if (salary.freq === 'biweekly') {
    return diff % 14 === 0;
  }
  if (salary.freq === 'semimonthly') {
    const firstDay = Math.min(startDay, lastDay);
    const second = resolveSecondPayDate(salary);
    const secondDay = Math.min(second ? second.getDate() : startDay + 15, lastDay);
    return day === firstDay || day === secondDay;
  }
  return false;
}

export function salaryPaysOnDay(salary: Salary, year: number, month: number, day: number): boolean {
  const date = new Date(year, month, day);
  const weekday = date.getDay();
  if (weekday === 0 || weekday === 6) return false;

  if (salaryScheduledOnDay(salary, year, month, day)) return true;

  if (weekday === 5) {
    const saturday = addDays(date, 1);
    const sunday = addDays(date, 2);
    return (
      salaryScheduledOnDay(salary, saturday.getFullYear(), saturday.getMonth(), saturday.getDate()) ||
      salaryScheduledOnDay(salary, sunday.getFullYear(), sunday.getMonth(), sunday.getDate())
    );
  }
  return false;
}

export function payOnDay(salary: Salary, year: number, month: number, day: number): number {
  return salaryPaysOnDay(salary, year, month, day) ? salary.amount : 0;
}

export function payCountInMonth(salary: Salary, year: number, month: number): number {
  const days = daysInMonth(year, month);
  let count = 0;
  for (let day = 1; day <= days; day += 1) {
    if (salaryPaysOnDay(salary, year, month, day)) count += 1;
  }
  return count;
}

export function monthPayTotal(salary: Salary, year: number, month: number): number {
  return payCountInMonth(salary, year, month) * salary.amount;
}

export type Breakdown = {
  income: number;
  expenses: number;
  savings: number;
  remaining: number;
  expensePct: number;
  savingPct: number;
  payCount: number;
  startIso: string;
  endIso: string;
};

export function computeBreakdown(
  selected: Salary[],
  expenses: Expense[],
  startIso: string,
  endIso: string,
): Breakdown {
  const start = parseISODate(startIso);
  const end = parseISODate(endIso);
  const from = start <= end ? start : end;
  const to = start <= end ? end : start;

  let payCount = 0;
  let income = 0;
  let savings = 0;
  let expenseTotal = 0;

  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const last = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  while (cursor <= last) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const day = cursor.getDate();
    selected.forEach((salary) => {
      if (salaryPaysOnDay(salary, year, month, day)) {
        payCount += 1;
        income += salary.amount;
        savings += salary.savings;
      }
      expenseTotal += expensesOnDay(expenses, salary.id, year, month, day).reduce(
        (sum, expense) => sum + expense.amount,
        0,
      );
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  const remaining = income - expenseTotal - savings;
  const total = Math.max(1, income);
  return {
    income,
    expenses: expenseTotal,
    savings,
    remaining,
    expensePct: Math.min(100, (expenseTotal / total) * 100),
    savingPct: Math.min(100, (savings / total) * 100),
    payCount,
    startIso: toISODate(from),
    endIso: toISODate(to),
  };
}

export function adjustedSecondPayDate(freq: Salary['freq'], firstIso: string, secondIso?: string): string | undefined {
  if (freq !== 'biweekly' && freq !== 'semimonthly') return undefined;
  const first = parseISODate(firstIso);
  if (freq === 'biweekly') return toISODate(addDays(first, 14));
  if (secondIso) {
    const second = parseISODate(secondIso);
    return second <= first ? toISODate(addDays(first, 15)) : secondIso;
  }
  return toISODate(addDays(first, 15));
}
