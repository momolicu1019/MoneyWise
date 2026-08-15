import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { money } from '../utils/format';
import { colors } from '../theme';

type Props = {
  savings: number;
  income: number;
};

export function SavingsProgress({ savings, income }: Props) {
  const pct = income ? Math.min(100, Math.max(0, (savings / income) * 100)) : 0;
  return (
    <View>
      <View style={styles.row}>
        <Text style={styles.label}>Selected salary savings target</Text>
        <Text style={styles.amount}>{money(savings)}</Text>
      </View>
      <View style={styles.track}>
        <LinearGradient
          colors={[colors.primary, colors.purple]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${pct}%` }]}
        />
      </View>
      <Text style={styles.note}>
        {income
          ? `${pct.toFixed(0)}% of salary in this range is allocated to savings.`
          : 'Add a salary to track savings.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    color: colors.text,
  },
  amount: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  track: {
    height: 9,
    backgroundColor: '#edf0f5',
    borderRadius: 20,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 20,
  },
  note: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 8,
  },
});
