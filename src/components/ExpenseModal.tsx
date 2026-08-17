import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { Expense, ExpenseFrequency, Salary } from '../types';
import { expenseFreqLabel, formatDisplayDate, toISODate } from '../utils/format';
import { OptionsModal } from './OptionsModal';
import { FieldLabel, SelectField } from './SelectField';
import { DangerButton, PrimaryButton, SoftButton } from './Buttons';
import { colors } from '../theme';

const FREQ_OPTIONS = (Object.keys(expenseFreqLabel) as ExpenseFrequency[]).map((value) => ({
  value,
  label: expenseFreqLabel[value],
}));

type Props = {
  visible: boolean;
  expense?: Expense | null;
  salaries: Salary[];
  defaultDate: string;
  onClose: () => void;
  onSave: (expense: Omit<Expense, 'id'> & { id?: string }) => void;
  onDelete?: () => void;
};

export function ExpenseModal({
  visible,
  expense,
  salaries,
  defaultDate,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [freq, setFreq] = useState<ExpenseFrequency>('once');
  const [monthsToPay, setMonthsToPay] = useState('0');
  const [salaryId, setSalaryId] = useState(salaries[0]?.id || '');
  const [showFreq, setShowFreq] = useState(false);
  const [showSalary, setShowSalary] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const wasVisible = useRef(false);

  // Only seed fields when the modal opens. Background sync can refresh
  // salaries/expenses while the form is open; those must not wipe drafts.
  useEffect(() => {
    if (!visible) {
      wasVisible.current = false;
      return;
    }
    if (wasVisible.current) return;
    wasVisible.current = true;
    setName(expense?.name || '');
    setAmount(expense?.amount ? String(expense.amount) : '');
    setDate(expense?.date || defaultDate);
    setFreq(expense?.freq || 'once');
    setMonthsToPay(String(expense?.monthsToPay ?? 0));
    setSalaryId(expense?.salaryId || salaries[0]?.id || '');
  }, [defaultDate, expense, salaries, visible]);

  const dateObj = useMemo(() => {
    const [y, m, d] = date.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  }, [date]);

  const selectedSalary = salaries.find((item) => item.id === salaryId);

  const onDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowDate(false);
    if (event.type === 'dismissed') return;
    if (selected) setDate(toISODate(selected));
  };

  const save = () => {
    const parsedAmount = Number(amount);
    if (!parsedAmount || !date) {
      Alert.alert('Missing details', 'Please enter amount and due date.');
      return;
    }
    const parsedMonths = monthsToPay.trim() === '' ? 0 : Number(monthsToPay);
    if (!Number.isInteger(parsedMonths) || parsedMonths < 0) {
      Alert.alert('Months to pay', 'Use 0 or a whole number of months.');
      return;
    }
    if (!salaryId) {
      Alert.alert('Missing salary', 'Please choose a salary for this expense.');
      return;
    }
    onSave({
      id: expense?.id,
      name: name.trim() || 'Untitled Expense',
      amount: parsedAmount,
      date,
      freq,
      salaryId,
      monthsToPay: parsedMonths,
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable style={styles.box} onPress={() => undefined}>
            <View style={styles.head}>
              <Text style={styles.title}>{expense ? 'Edit Expense' : 'Add Expense'}</Text>
              <Pressable onPress={onClose} style={styles.close}>
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <FieldLabel>Name</FieldLabel>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Electricity"
                placeholderTextColor="#94a3b8"
                style={styles.input}
              />

              <FieldLabel>How much</FieldLabel>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#94a3b8"
                style={styles.input}
              />

              <SelectField
                label="Due date"
                value={formatDisplayDate(date)}
                onPress={() => setShowDate(true)}
              />
              <SelectField
                label="Frequency"
                value={expenseFreqLabel[freq]}
                onPress={() => setShowFreq(true)}
              />

              <FieldLabel>Months to pay</FieldLabel>
              <TextInput
                value={monthsToPay}
                onChangeText={setMonthsToPay}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#94a3b8"
                style={styles.input}
              />
              <Text style={styles.hint}>
                0 keeps repeating by frequency. 3 stops this expense after 3 months.
              </Text>

              <SelectField
                label="Salary"
                value={selectedSalary?.name || 'Select salary'}
                onPress={() => setShowSalary(true)}
              />

              <View style={styles.actions}>
                {expense && onDelete ? (
                  <View style={{ marginRight: 'auto' }}>
                    <DangerButton
                      title="Delete"
                      onPress={() =>
                        Alert.alert('Delete expense', 'Delete this expense?', [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Delete', style: 'destructive', onPress: onDelete },
                        ])
                      }
                    />
                  </View>
                ) : null}
                <SoftButton title="Cancel" onPress={onClose} />
                <PrimaryButton title="Save Expense" onPress={save} />
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>

      <OptionsModal
        visible={showFreq}
        title="Frequency"
        options={FREQ_OPTIONS}
        selected={freq}
        onSelect={setFreq}
        onClose={() => setShowFreq(false)}
      />
      <OptionsModal
        visible={showSalary}
        title="Salary"
        options={salaries.map((item) => ({ value: item.id, label: item.name }))}
        selected={salaryId}
        onSelect={setSalaryId}
        onClose={() => setShowSalary(false)}
      />
      {showDate ? (
        <DateTimePicker value={dateObj} mode="date" display="default" onChange={onDateChange} />
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: 18,
  },
  box: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    maxHeight: '90%',
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  close: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 20,
    color: colors.text,
    lineHeight: 22,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.text,
    backgroundColor: '#fff',
  },
  hint: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 6,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
});
