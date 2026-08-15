import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Expense, Salary, SalaryFilterId } from '../types';
import { daysInMonth, monthTitle, toISODate } from '../utils/format';
import { expenseOccursOn, salaryPaysOnDay } from '../utils/recurrence';
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
    const items: Array<{ day?: number; iso?: string; items: Expense[]; paydays: Salary[] }> = [];
    for (let i = 0; i < first; i += 1) items.push({ items: [], paydays: [] });
    for (let day = 1; day <= days; day += 1) {
      const iso = toISODate(new Date(year, month, day));
      const dayItems = expenses.filter(
        (expense) =>
          (selectedSalaryId === 'all' || expense.salaryId === selectedSalaryId) &&
          expenseOccursOn(expense, year, month, day),
      );
      const paydays = salaries.filter(
        (salary) =>
          (selectedSalaryId === 'all' || salary.id === selectedSalaryId) &&
          salaryPaysOnDay(salary, year, month, day),
      );
      items.push({ day, iso, items: dayItems, paydays });
    }
    return items;
  }, [expenses, month, salaries, selectedSalaryId, year]);

  const overflowPaydays = overflowDay
    ? salaries.filter(
        (salary) =>
          (selectedSalaryId === 'all' || salary.id === selectedSalaryId) &&
          salaryPaysOnDay(salary, year, month, overflowDay),
      )
    : [];
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
    while (week.length < 7) week.push({ items: [], paydays: [] });
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
              const marks = [
                ...(cell.paydays || []).map((salary) => ({
                  key: `p-${salary.id}`,
                  label: salary.name,
                  color: salary.color,
                  expense: null as Expense | null,
                })),
                ...cell.items.map((expense) => ({
                  key: expense.id,
                  label: expense.name,
                  color: salaryById[expense.salaryId]?.color || '#64748b',
                  expense,
                })),
              ];
              const visible = marks.slice(0, 2);
              const extra = marks.length - visible.length;
              const isToday = cell.iso === today;
              return (
                <View
                  key={`${cell.day || 'e'}-${weekIndex}-${index}`}
                  style={[
                    styles.day,
                    !cell.day && styles.empty,
                    isToday && styles.today,
                    cell.paydays?.length ? { borderLeftWidth: 3, borderLeftColor: cell.paydays[0].color } : null,
                  ]}
                >
                  {cell.day ? (
                    <View style={styles.dayHead}>
                      <Text style={styles.dayNum}>{cell.day}</Text>
                      <View style={styles.dots}>
                        {(cell.paydays || []).map((salary) => (
                          <View key={salary.id} style={[styles.payDot, { backgroundColor: salary.color }]} />
                        ))}
                      </View>
                    </View>
                  ) : null}
                  {visible.map((mark) =>
                    mark.expense ? (
                      <Pressable
                        key={mark.key}
                        onPress={() => onPressExpense(mark.expense!)}
                        style={[styles.pill, { backgroundColor: mark.color }]}
                      >
                        <Text numberOfLines={1} style={styles.pillText}>
                          {mark.label}
                        </Text>
                      </Pressable>
                    ) : (
                      <View key={mark.key} style={[styles.pill, { backgroundColor: mark.color }]}>
                        <Text numberOfLines={1} style={styles.pillText}>
                          {mark.label}
                        </Text>
                      </View>
                    ),
                  )}
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
        Payday dates are marked in the salary color. Tap an expense to edit or delete it.
      </Text>

      <Modal visible={overflowDay !== null} transparent animationType="fade" onRequestClose={() => setOverflowDay(null)}>
        <Pressable style={styles.overlay} onPress={() => setOverflowDay(null)}>
          <Pressable style={styles.sheet} onPress={() => undefined}>
            <Text style={styles.sheetTitle}>
              {overflowDay} {monthTitle(viewDate)}
            </Text>
            {overflowPaydays.map((salary) => (
              <View key={salary.id} style={[styles.sheetRow, { backgroundColor: salary.color }]}>
                <Text style={styles.sheetRowText}>{salary.name} payday</Text>
              </View>
            ))}
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
  dayHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  dayNum: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748b',
  },
  dots: {
    flexDirection: 'row',
    gap: 2,
  },
  payDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
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
