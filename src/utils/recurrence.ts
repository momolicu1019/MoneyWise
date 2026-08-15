import type { Expense, Salary } from '../types';
import { daysInMonth, parseISODate, toISODate } from './format';

const MS_PER_DAY = 86400000;

export function expenseOccursOn(expense: Expense, year: number, month: number, day: number): boolean {
  const base = parseISODate(expense.date);
  const target = new Date(year, month, day);
  const diff = Math.round((target.getTime() - base.getTime()) / MS_PER_DAY);
  if (diff < 0) return false;
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

export function payOnDay(salary: Salary, year: number, month: number, day: number): number {
  const date = new Date(year, month, day);
  const start = parseISODate(salary.payDate || toISODate(new Date(year, month, 1)));
  if (date < start) return 0;

  const diff = Math.floor((date.getTime() - start.getTime()) / MS_PER_DAY);
  const lastDay = daysInMonth(year, month);
  const startDay = start.getDate();

  if (salary.freq === 'monthly') {
    return day === Math.min(startDay, lastDay) ? salary.amount : 0;
  }
  if (salary.freq === 'weekly') {
    return diff % 7 === 0 ? salary.amount : 0;
  }
  if (salary.freq === 'biweekly') {
    return diff % 14 === 0 ? salary.amount : 0;
  }
  if (salary.freq === 'semimonthly') {
    const firstDay = Math.min(startDay, lastDay);
    const secondDay = Math.min(parseInt(salary.secondPayDay || '30', 10), lastDay);
    return day === firstDay || day === secondDay ? salary.amount : 0;
  }
  return 0;
}

export type Breakdown = {
  income: number;
  expenses: number;
  savings: number;
  remaining: number;
  expensePct: number;
  savingPct: number;
};

export function computeBreakdown(
  selected: Salary[],
  expenses: Expense[],
  year: number,
  month: number,
): Breakdown {
  const income = selected.reduce((sum, salary) => sum + salary.amount, 0);
  const savings = selected.reduce((sum, salary) => sum + salary.savings, 0);
  const expenseTotal = selected.reduce(
    (sum, salary) => sum + monthExpenseTotal(expenses, salary.id, year, month),
    0,
  );
  const remaining = income - expenseTotal - savings;
  const total = Math.max(1, income);
  const expensePct = Math.min(100, (expenseTotal / total) * 100);
  const savingPct = Math.min(100, (savings / total) * 100);
  return {
    income,
    expenses: expenseTotal,
    savings,
    remaining,
    expensePct,
    savingPct,
  };
}
