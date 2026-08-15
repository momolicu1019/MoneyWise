import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import type { Breakdown } from '../utils/recurrence';
import { money, salaryFreqLabel } from '../utils/format';
import type { Salary } from '../types';
import { colors } from '../theme';

type Props = {
  selected: Salary[];
  breakdown: Breakdown;
};

export function BreakdownChart({ selected, breakdown }: Props) {
  if (!selected.length) {
    return <Text style={styles.empty}>Add a salary to view its breakdown.</Text>;
  }

  const size = 220;
  const stroke = 42;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const remainingDisplay = breakdown.remaining;
  const remainingSlice = Math.max(0, remainingDisplay);
  const sliceTotal = Math.max(1, breakdown.expenses + breakdown.savings + remainingSlice);
  const expenseLen = (breakdown.expenses / sliceTotal) * circumference;
  const savingLen = (breakdown.savings / sliceTotal) * circumference;
  const remainLen = (remainingSlice / sliceTotal) * circumference;
  const title = selected.length === 1 ? selected[0].name : 'All salaries';

  return (
    <View style={styles.wrap}>
      <View style={styles.donutWrap}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#eef2ff"
            strokeWidth={stroke}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.primary}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${expenseLen} ${circumference}`}
            strokeDashoffset={0}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            strokeLinecap="butt"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.orange}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${savingLen} ${circumference}`}
            strokeDashoffset={-expenseLen}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            strokeLinecap="butt"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.green}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={`${remainLen} ${circumference}`}
            strokeDashoffset={-(expenseLen + savingLen)}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            strokeLinecap="butt"
          />
        </Svg>
        <View style={styles.center} pointerEvents="none">
          <Text style={styles.centerLabel}>{title}</Text>
          <Text style={[styles.centerValue, remainingDisplay < 0 && { color: colors.red }]}>
            {money(remainingDisplay)}
          </Text>
          <Text style={styles.centerLabel}>remaining</Text>
        </View>
      </View>

      <View style={styles.legend}>
        <LegendRow color={colors.primary} label="Associated expenses" value={money(breakdown.expenses)} />
        <LegendRow color={colors.orange} label="Savings" value={money(breakdown.savings)} />
        <LegendRow
          color={colors.green}
          label="Remaining"
          value={money(remainingDisplay)}
          valueColor={remainingDisplay < 0 ? colors.red : colors.text}
        />
        <View style={styles.meta}>
          <Text style={styles.metaText}>
            Salary: <Text style={styles.metaStrong}>{money(breakdown.income)}</Text>
            {selected.length === 1 ? ` · ${salaryFreqLabel[selected[0].freq]}` : ' · combined'}
          </Text>
        </View>
      </View>
    </View>
  );
}

function LegendRow({
  color,
  label,
  value,
  valueColor,
}: {
  color: string;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.legendRow}>
      <View style={styles.legendLeft}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={styles.legendLabel}>{label}</Text>
      </View>
      <Text style={[styles.legendValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 18,
    alignItems: 'center',
  },
  donutWrap: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  centerLabel: {
    color: colors.muted,
    fontSize: 11,
    textAlign: 'center',
  },
  centerValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginVertical: 2,
  },
  legend: {
    width: '100%',
    gap: 12,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },
  legendLabel: {
    fontSize: 13,
    color: colors.text,
  },
  legendValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  meta: {
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 11,
  },
  metaText: {
    fontSize: 12,
    color: colors.muted,
  },
  metaStrong: {
    color: colors.text,
    fontWeight: '800',
  },
  empty: {
    textAlign: 'center',
    color: colors.muted,
    paddingVertical: 28,
    fontSize: 13,
  },
});
