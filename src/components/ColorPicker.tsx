import { Pressable, StyleSheet, View } from 'react-native';
import { FieldLabel } from './SelectField';
import { colors, salaryPalette } from '../theme';

type Props = {
  color: string;
  onChange: (color: string) => void;
};

export function ColorPicker({ color, onChange }: Props) {
  return (
    <View>
      <FieldLabel>Salary color</FieldLabel>
      <View style={[styles.preview, { backgroundColor: color }]} />
      <View style={styles.grid}>
        {salaryPalette.map((swatch) => (
          <Pressable
            key={swatch}
            onPress={() => onChange(swatch)}
            style={[
              styles.swatch,
              { backgroundColor: swatch },
              color === swatch && styles.selected,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  preview: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 8,
  },
  selected: {
    borderWidth: 3,
    borderColor: colors.text,
  },
});
