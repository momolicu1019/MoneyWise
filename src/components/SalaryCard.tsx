import { Alert, StyleSheet, Text, View } from 'react-native';
import type { Salary } from '../types';
import { money, salaryFreqLabel } from '../utils/format';
import { DangerButton, SoftButton } from './Buttons';
import { colors } from '../theme';

type Props = {
  salary: Salary;
  onEdit: () => void;
  onDelete: () => void;
};

export function SalaryCard({ salary, onEdit, onDelete }: Props) {
  return (
    <View style={[styles.card, { borderColor: `${salary.color}55` }]}>
      <View style={styles.top}>
        <View style={[styles.dot, { backgroundColor: salary.color }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{salary.name}</Text>
          <Text style={styles.freq}>{salaryFreqLabel[salary.freq]}</Text>
        </View>
      </View>
      <View style={styles.values}>
        <View style={styles.mini}>
          <Text style={styles.miniLabel}>Pay period</Text>
          <Text style={styles.miniValue}>{money(salary.amount)}</Text>
        </View>
        <View style={styles.mini}>
          <Text style={styles.miniLabel}>Savings / pay</Text>
          <Text style={[styles.miniValue, { color: colors.green }]}>{money(salary.savings)}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <View style={{ flex: 1 }}>
          <SoftButton title="Edit" onPress={onEdit} />
        </View>
        <View style={{ flex: 1 }}>
          <DangerButton
            title="Delete"
            onPress={() =>
              Alert.alert('Delete salary', 'Delete this salary and its associated expenses?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: onDelete },
              ])
            }
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderRadius: 15,
    padding: 14,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  dot: {
    width: 13,
    height: 13,
    borderRadius: 7,
  },
  name: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
  },
  freq: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 1,
  },
  values: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  mini: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 9,
  },
  miniLabel: {
    color: colors.muted,
    fontSize: 10,
  },
  miniValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },
});
