import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
};

export function PrimaryButton({ title, onPress, disabled }: Props) {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={{ opacity: disabled ? 0.55 : 1 }}>
      <LinearGradient colors={[colors.primary, colors.purple]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.primary}>
        <Text style={styles.primaryText}>{title}</Text>
      </LinearGradient>
    </Pressable>
  );
}

export function SoftButton({ title, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.soft}>
      <Text style={styles.softText}>{title}</Text>
    </Pressable>
  );
}

export function DangerButton({ title, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.danger}>
      <Text style={styles.dangerText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primary: {
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  primaryText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
  soft: {
    backgroundColor: colors.soft,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  softText: {
    color: colors.primaryDark,
    fontWeight: '800',
    fontSize: 13,
  },
  danger: {
    backgroundColor: '#fff0f0',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  dangerText: {
    color: colors.red,
    fontWeight: '800',
    fontSize: 13,
  },
});
