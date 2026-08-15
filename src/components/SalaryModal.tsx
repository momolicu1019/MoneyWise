import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useEffect, useMemo, useState } from 'react';
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
import type { Salary, SalaryFrequency } from '../types';
import { salaryFreqLabel, toISODate } from '../utils/format';
import { colors, salaryPalette } from '../theme';
import { ColorPicker } from './ColorPicker';
import { OptionsModal } from './OptionsModal';
import { FieldLabel, SelectField } from './SelectField';
import { PrimaryButton, SoftButton } from './Buttons';

const FREQ_OPTIONS = (Object.keys(salaryFreqLabel) as SalaryFrequency[]).map((value) => ({
  value,
  label: salaryFreqLabel[value],
}));

type Props = {
  visible: boolean;
  salary?: Salary | null;
  salaryCount: number;
  onClose: () => void;
  onSave: (salary: Omit<Salary, 'id'> & { id?: string }) => void;
};

function helperFor(freq: SalaryFrequency): string {
  if (freq === 'monthly') return 'The salary will recur on this day each month.';
  if (freq === 'biweekly') return 'The salary will be received every 14 days from this date.';
  if (freq === 'weekly') return 'The salary will be received every 7 days from this date.';
  return 'Choose the two dates when the salary is received each month.';
}

export function SalaryModal({ visible, salary, salaryCount, onClose, onSave }: Props) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [freq, setFreq] = useState<SalaryFrequency>('monthly');
  const [payDate, setPayDate] = useState(toISODate(new Date()));
  const [secondPayDay, setSecondPayDay] = useState('30');
  const [savings, setSavings] = useState('');
  const [color, setColor] = useState(salaryPalette[0]);
  const [showFreq, setShowFreq] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [showSecond, setShowSecond] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(salary?.name || '');
    setAmount(salary?.amount ? String(salary.amount) : '');
    setFreq(salary?.freq || 'monthly');
    setPayDate(salary?.payDate || toISODate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
    setSecondPayDay(salary?.secondPayDay || '30');
    setSavings(salary?.savings ? String(salary.savings) : '');
    setColor(salary?.color || salaryPalette[salaryCount % salaryPalette.length]);
  }, [salary, salaryCount, visible]);

  const dateObj = useMemo(() => {
    const [y, m, d] = payDate.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  }, [payDate]);

  const onDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShowDate(false);
    if (event.type === 'dismissed') return;
    if (selected) setPayDate(toISODate(selected));
  };

  const save = () => {
    const parsedAmount = Number(amount);
    if (!parsedAmount) {
      Alert.alert('Missing amount', 'Please enter a salary amount.');
      return;
    }
    if (!payDate) {
      Alert.alert('Missing date', 'Please select the salary start/pay date.');
      return;
    }
    onSave({
      id: salary?.id,
      name: name.trim() || 'Untitled Salary',
      amount: parsedAmount,
      freq,
      savings: Number(savings) || 0,
      payDate,
      secondPayDay: freq === 'semimonthly' ? secondPayDay : undefined,
      color,
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable style={styles.box} onPress={() => undefined}>
            <View style={styles.head}>
              <Text style={styles.title}>{salary ? 'Edit Salary' : 'Add Salary'}</Text>
              <Pressable onPress={onClose} style={styles.close}>
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <FieldLabel>Salary name</FieldLabel>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Main Job"
                placeholderTextColor="#94a3b8"
                style={styles.input}
              />

              <FieldLabel>Amount per pay period</FieldLabel>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="50000"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                style={styles.input}
              />

              <SelectField label="Frequency" value={salaryFreqLabel[freq]} onPress={() => setShowFreq(true)} />

              <SelectField
                label="First salary date"
                value={dateObj.toLocaleDateString('en-GB')}
                onPress={() => setShowDate(true)}
              />
              <Text style={styles.note}>{helperFor(freq)}</Text>

              {freq === 'semimonthly' ? (
                <SelectField
                  label="Second salary date"
                  value={secondPayDay === '31' ? '31st / last day' : '30th'}
                  onPress={() => setShowSecond(true)}
                />
              ) : null}

              <FieldLabel>Preferred savings per pay period</FieldLabel>
              <TextInput
                value={savings}
                onChangeText={setSavings}
                placeholder="10000"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                style={styles.input}
              />

              <ColorPicker color={color} onChange={setColor} />

              <View style={styles.actions}>
                <SoftButton title="Cancel" onPress={onClose} />
                <PrimaryButton title="Save Salary" onPress={save} />
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
        visible={showSecond}
        title="Second salary date"
        options={[
          { value: '30', label: '30th' },
          { value: '31', label: '31st / last day' },
        ]}
        selected={secondPayDay}
        onSelect={setSecondPayDay}
        onClose={() => setShowSecond(false)}
      />
      {showDate ? (
        <DateTimePicker
          value={dateObj}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
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
  note: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 6,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 18,
    marginBottom: 4,
  },
});
