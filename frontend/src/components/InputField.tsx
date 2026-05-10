import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, ViewStyle, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../theme';

interface Props extends TextInputProps {
  label: string;
  error?: string;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

export function InputField({ label, error, containerStyle, isPassword, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[styles.inputWrapper, focused && styles.focused, error ? styles.errorBorder : null]}>
        <View style={styles.inner}>
          {focused || rest.value ? (
            <Text style={styles.floatingLabel}>{label}</Text>
          ) : null}
          <TextInput
            style={styles.input}
            placeholder={focused ? '' : label}
            placeholderTextColor={colors.textSecondary}
            secureTextEntry={isPassword && !showPassword}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            {...rest}
          />
        </View>
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export default InputField;

const styles = StyleSheet.create({
  container: { width: '100%', marginBottom: spacing.md },
  inputWrapper: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    minHeight: 56,
  },
  focused: { borderColor: colors.accent },
  errorBorder: { borderColor: colors.error },
  inner: { flex: 1 },
  floatingLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 8 },
  input: { color: colors.text, fontSize: 14, paddingVertical: 4, paddingBottom: 8 },
  eyeIcon: { padding: 4 },
  errorText: { color: colors.error, fontSize: 12, marginTop: 4, marginLeft: 4 },
});
