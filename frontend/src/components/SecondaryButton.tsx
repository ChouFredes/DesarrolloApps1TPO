import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing } from '../theme';

interface Props {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
}

export function SecondaryButton({ title, onPress, style }: Props) {
  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

export default SecondaryButton;

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.base,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  text: { color: colors.primary, fontSize: 16, fontWeight: '600' },
});
