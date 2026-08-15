import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

type Props = {
  label?: string;
  value: string;
  placeholder?: string;
  onPress: () => void;
};

export function FieldLabel({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function SelectField({ label, value, placeholder, onPress }: Props) {
  return (
    <View>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <Pressable onPress={onPress} style={styles.input}>
        <Text style={[styles.value, !value && styles.placeholder]}>{value || placeholder || 'Select'}</Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
    marginTop: 10,
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: {
    color: colors.text,
    fontSize: 14,
    flex: 1,
  },
  placeholder: {
    color: '#94a3b8',
  },
  chevron: {
    color: colors.muted,
    fontSize: 12,
    marginLeft: 8,
  },
});
