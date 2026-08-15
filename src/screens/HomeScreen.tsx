import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { useApp } from '../context/AppContext';
import { computeBreakdown } from '../utils/recurrence';
import { toISODate } from '../utils/format';
import { Header } from '../components/Header';
import { Card } from '../components/Card';
import { SalaryCard } from '../components/SalaryCard';
import { SalaryModal } from '../components/SalaryModal';
import { ExpenseModal } from '../components/ExpenseModal';
import { ExpenseCalendar } from '../components/ExpenseCalendar';
import { BreakdownChart } from '../components/BreakdownChart';
import { SavingsProgress } from '../components/SavingsProgress';
import { OptionsModal } from '../components/OptionsModal';
import { SelectField } from '../components/SelectField';
import { PrimaryButton } from '../components/Buttons';
import type { Expense, Salary } from '../types';
import { colors } from '../theme';

export function HomeScreen() {
  const {
    salaries,
    expenses,
    selectedSalaryId,
    setSelectedSalaryId,
    viewDate,
    changeMonth,
    upsertSalary,
    removeSalary,
    upsertExpense,
    removeExpense,
  } = useApp();

  const [salaryModalOpen, setSalaryModalOpen] = useState(false);
  const [editingSalary, setEditingSalary] = useState<Salary | null>(null);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const selectedSalaries = useMemo(
    () => (selectedSalaryId === 'all' ? salaries : salaries.filter((salary) => salary.id === selectedSalaryId)),
    [salaries, selectedSalaryId],
  );
  const breakdown = useMemo(
    () => computeBreakdown(selectedSalaries, expenses, viewDate.getFullYear(), viewDate.getMonth()),
    [expenses, selectedSalaries, viewDate],
  );
  const filterLabel =
    selectedSalaryId === 'all'
      ? 'All salaries'
      : salaries.find((salary) => salary.id === selectedSalaryId)?.name || 'All salaries';

  const openAddSalary = () => {
    setEditingSalary(null);
    setSalaryModalOpen(true);
  };
  const openAddExpense = () => {
    if (!salaries.length) {
      Alert.alert('Add a salary first', 'Create a salary before adding expenses.');
      return;
    }
    setEditingExpense(null);
    setExpenseModalOpen(true);
  };

  return (
    <View style={[styles.screen, { paddingTop: Constants.statusBarHeight + 8 }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Header />

        <Card
          title="💰 My Salaries"
          subtitle="Each salary has its own savings target and associated bills."
          action={<PrimaryButton title="+ Add Salary" onPress={openAddSalary} />}
        >
          {salaries.length ? (
            salaries.map((salary) => (
              <SalaryCard
                key={salary.id}
                salary={salary}
                onEdit={() => {
                  setEditingSalary(salary);
                  setSalaryModalOpen(true);
                }}
                onDelete={() => removeSalary(salary.id)}
              />
            ))
          ) : (
            <Text style={styles.empty}>No salaries yet. Add your first salary.</Text>
          )}
        </Card>

        <Card
          title="🗓️ Expense Calendar"
          subtitle="Expenses are color-coded according to their associated salary."
        >
          <View style={styles.calendarActions}>
            <View style={{ flex: 1 }}>
              <SelectField value={filterLabel} onPress={() => setFilterOpen(true)} />
            </View>
            <PrimaryButton title="+ Add Expense" onPress={openAddExpense} />
          </View>
          <ExpenseCalendar
            viewDate={viewDate}
            salaries={salaries}
            expenses={expenses}
            selectedSalaryId={selectedSalaryId}
            onChangeMonth={changeMonth}
            onPressExpense={(expense) => {
              setEditingExpense(expense);
              setExpenseModalOpen(true);
            }}
          />
        </Card>

        <Card
          title="🥧 Salary Breakdown"
          subtitle="Breakdown follows the salary selected in the calendar filter."
        >
          <BreakdownChart selected={selectedSalaries} breakdown={breakdown} />
        </Card>

        <Card title="🎯 Savings Progress">
          <SavingsProgress savings={breakdown.savings} income={breakdown.income} />
        </Card>
      </ScrollView>

      <SalaryModal
        visible={salaryModalOpen}
        salary={editingSalary}
        salaryCount={salaries.length}
        onClose={() => setSalaryModalOpen(false)}
        onSave={upsertSalary}
      />
      <ExpenseModal
        visible={expenseModalOpen}
        expense={editingExpense}
        salaries={salaries}
        defaultDate={toISODate(new Date())}
        onClose={() => setExpenseModalOpen(false)}
        onSave={upsertExpense}
        onDelete={
          editingExpense
            ? () => {
                removeExpense(editingExpense.id);
                setExpenseModalOpen(false);
              }
            : undefined
        }
      />
      <OptionsModal
        visible={filterOpen}
        title="Filter expenses"
        options={[
          { value: 'all', label: 'All salaries' },
          ...salaries.map((salary) => ({ value: salary.id, label: salary.name })),
        ]}
        selected={selectedSalaryId}
        onSelect={setSelectedSalaryId}
        onClose={() => setFilterOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: 14,
    paddingBottom: 36,
  },
  empty: {
    textAlign: 'center',
    color: colors.muted,
    paddingVertical: 24,
    fontSize: 13,
  },
  calendarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
});
