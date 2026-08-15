import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

type Props = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function Card({ title, subtitle, action, children }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.toolbar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
        </View>
        {action}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 19,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#1f2937',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 1,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  sub: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 3,
  },
});
