import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Expense, Salary, SalaryFilterId } from '../types';
import { daysInMonth, monthTitle, toISODate } from '../utils/format';
import { expenseOccursOn } from '../utils/recurrence';
import { SoftButton } from './Buttons';
import { colors } from '../theme';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type Props = {
  viewDate: Date;
  salaries: Salary[];
  expenses: Expense[];
  selectedSalaryId: SalaryFilterId;
  onChangeMonth: (delta: number) => void;
  onPressExpense: (expense: Expense) => void;
};

export function ExpenseCalendar({
  viewDate,
  salaries,
  expenses,
  selectedSalaryId,
  onChangeMonth,
  onPressExpense,
}: Props) {
  const [overflowDay, setOverflowDay] = useState<number | null>(null);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const today = toISODate(new Date());
  const salaryById = useMemo(
    () => Object.fromEntries(salaries.map((salary) => [salary.id, salary])),
    [salaries],
  );

  const cells = useMemo(() => {
    const first = new Date(year, month, 1).getDay();
    const days = daysInMonth(year, month);
    const items: Array<{ day?: number; iso?: string; items: Expense[] }> = [];
    for (let i = 0; i < first; i += 1) items.push({ items: [] });
    for (let day = 1; day <= days; day += 1) {
      const iso = toISODate(new Date(year, month, day));
      const dayItems = expenses.filter(
        (expense) =>
          (selectedSalaryId === 'all' || expense.salaryId === selectedSalaryId) &&
          expenseOccursOn(expense, year, month, day),
      );
      items.push({ day, iso, items: dayItems });
    }
    return items;
  }, [expenses, month, selectedSalaryId, year]);

  const overflowItems = overflowDay
    ? expenses.filter(
        (expense) =>
          (selectedSalaryId === 'all' || expense.salaryId === selectedSalaryId) &&
          expenseOccursOn(expense, year, month, overflowDay),
      )
    : [];

  const weeks: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    const week = cells.slice(i, i + 7);
    while (week.length < 7) week.push({ items: [] });
    weeks.push(week);
  }

  return (
    <View>
      <View style={styles.head}>
        <SoftButton title="‹" onPress={() => onChangeMonth(-1)} />
        <Text style={styles.month}>{monthTitle(viewDate)}</Text>
        <SoftButton title="›" onPress={() => onChangeMonth(1)} />
      </View>
      <View style={styles.grid}>
        <View style={styles.row}>
          {DOW.map((label) => (
            <View key={label} style={styles.dow}>
              <Text style={styles.dowText}>{label}</Text>
            </View>
          ))}
        </View>
        {weeks.map((week, weekIndex) => (
          <View key={`w-${weekIndex}`} style={styles.row}>
            {week.map((cell, index) => {
              const visible = cell.items.slice(0, 2);
              const extra = cell.items.length - visible.length;
              const isToday = cell.iso === today;
              return (
                <View
                  key={`${cell.day || 'e'}-${weekIndex}-${index}`}
                  style={[styles.day, !cell.day && styles.empty, isToday && styles.today]}
                >
                  {cell.day ? <Text style={styles.dayNum}>{cell.day}</Text> : null}
                  {visible.map((expense) => (
                    <Pressable
                      key={expense.id}
                      onPress={() => onPressExpense(expense)}
                      style={[styles.pill, { backgroundColor: salaryById[expense.salaryId]?.color || '#64748b' }]}
                    >
                      <Text numberOfLines={1} style={styles.pillText}>
                        {expense.name}
                      </Text>
                    </Pressable>
                  ))}
                  {extra > 0 ? (
                    <Pressable onPress={() => setOverflowDay(cell.day || null)}>
                      <Text style={styles.more}>+{extra} more</Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </View>
        ))}
      </View>
      <Text style={styles.note}>
        Click an expense title to edit or delete it. Repeating expenses appear on future matching dates.
      </Text>

      <Modal visible={overflowDay !== null} transparent animationType="fade" onRequestClose={() => setOverflowDay(null)}>
        <Pressable style={styles.overlay} onPress={() => setOverflowDay(null)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <Text style={styles.sheetTitle}>
              {overflowDay} {monthTitle(viewDate)}
            </Text>
            {overflowItems.map((expense) => (
              <Pressable
                key={expense.id}
                style={[styles.sheetRow, { backgroundColor: salaryById[expense.salaryId]?.color || '#64748b' }]}
                onPress={() => {
                  setOverflowDay(null);
                  onPressExpense(expense);
                }}
              >
                <Text style={styles.sheetRowText}>{expense.name}</Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  month: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.text,
  },
  grid: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 13,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
  dow: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingVertical: 8,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
  },
  dowText: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '800',
  },
  day: {
    flex: 1,
    minHeight: 78,
    padding: 4,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  empty: {
    backgroundColor: colors.emptyDay,
  },
  today: {
    backgroundColor: colors.today,
  },
  dayNum: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748b',
    marginBottom: 2,
  },
  pill: {
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 4,
    marginTop: 3,
  },
  pillText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '800',
  },
  more: {
    fontSize: 9,
    color: colors.muted,
    marginTop: 3,
  },
  note: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 8,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  sheetTitle: {
    fontWeight: '800',
    fontSize: 16,
    color: colors.text,
    marginBottom: 6,
  },
  sheetRow: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  sheetRowText: {
    color: '#fff',
    fontWeight: '800',
  },
});
