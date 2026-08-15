import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export type Option<T extends string> = { label: string; value: T };

type Props<T extends string> = {
  visible: boolean;
  title: string;
  options: Option<T>[];
  selected?: T;
  onSelect: (value: T) => void;
  onClose: () => void;
};

export function OptionsModal<T extends string>({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: Props<T>) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.box} onPress={() => undefined}>
          <Text style={styles.title}>{title}</Text>
          {options.map((option) => {
            const active = option.value === selected;
            return (
              <Pressable
                key={option.value}
                style={[styles.row, active && styles.activeRow]}
                onPress={() => {
                  onSelect(option.value);
                  onClose();
                }}
              >
                <Text style={[styles.rowText, active && styles.activeText]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    padding: 24,
  },
  box: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
    paddingHorizontal: 6,
  },
  row: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  activeRow: {
    backgroundColor: colors.soft,
  },
  rowText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  activeText: {
    color: colors.primaryDark,
  },
});
