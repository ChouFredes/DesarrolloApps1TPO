import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, ViewStyle, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';

interface Props extends TextInputProps {
  label: string;
  error?: string;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
  variant?: 'light' | 'dark' | 'white';
}

export function InputField({ label, error, containerStyle, isPassword, variant = 'dark', ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const wrapperStyle = [
    styles.inputWrapper,
    variant === 'light' && styles.wrapperLight,
    variant === 'dark' && styles.wrapperDark,
    variant === 'white' && styles.wrapperWhite,
    focused && (
      variant === 'dark' ? styles.focusedDark :
      variant === 'white' ? styles.focusedWhite :
      styles.focusedLight
    ),
    error && (
      variant === 'light' ? styles.errorBorderLight : styles.errorBorderDark
    ),
  ];

  const labelStyle = [
    styles.floatingLabel,
    variant === 'light' && styles.labelLight,
    variant === 'dark' && styles.labelDark,
    variant === 'white' && styles.labelWhite,
  ];

  const inputStyle = [
    styles.input,
    variant === 'light' && styles.inputLight,
    variant === 'dark' && styles.inputDark,
    variant === 'white' && styles.inputWhite,
  ];

  const placeholderColor =
    variant === 'dark' ? 'rgba(225,225,225,0.35)' :
    variant === 'white' ? 'rgba(15, 31, 53, 0.4)' :
    colors.textSecondary;

  const eyeColor =
    variant === 'dark' ? 'rgba(0,234,223,0.5)' :
    variant === 'white' ? '#0F1F35' :
    colors.textSecondary;

  const errorTextStyle = [
    styles.errorText,
    variant === 'light' ? styles.errorTextLight : styles.errorTextDark,
  ];

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={wrapperStyle}>
        <View style={styles.inner}>
          {focused || rest.value ? (
            <Text style={labelStyle}>{label}</Text>
          ) : null}
          <TextInput
            style={inputStyle}
            placeholder={focused ? '' : label}
            placeholderTextColor={placeholderColor}
            secureTextEntry={isPassword && !showPassword}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            {...rest}
          />
        </View>
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={eyeColor} />
          </TouchableOpacity>
        )}
      </View>
      {error ? <Text style={errorTextStyle}>{error}</Text> : null}
    </View>
  );
}

export default InputField;

const styles = StyleSheet.create({
  container: { width: '100%', marginBottom: spacing.base },
  inputWrapper: {
    borderRadius: 12,
    borderWidth: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    minHeight: 56,
  },
  wrapperLight: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  wrapperDark: {
    backgroundColor: '#152C44',
    borderColor: 'rgba(0,234,223,0.2)',
  },
  wrapperWhite: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(0,234,223,0.4)',
    borderWidth: 1,
  },
  focusedLight: { borderColor: colors.accent },
  focusedDark: { borderColor: '#00EADF' },
  focusedWhite: { borderColor: '#00EADF' },
  errorBorderLight: { borderColor: colors.error },
  errorBorderDark: { borderColor: '#FF6B6B' },
  inner: { flex: 1 },
  floatingLabel: { fontSize: 11, marginTop: 8 },
  labelLight: { color: colors.textSecondary },
  labelDark: { color: 'rgba(225,225,225,0.5)' },
  labelWhite: { color: 'rgba(15, 31, 53, 0.6)' },
  input: { fontSize: 15, paddingVertical: 4, paddingBottom: 8 },
  inputLight: { color: colors.text },
  inputDark: { color: '#E1E1E1' },
  inputWhite: { color: '#0F1F35' },
  eyeIcon: { padding: 4 },
  errorText: { fontSize: 12, marginTop: 4, marginLeft: 4 },
  errorTextLight: { color: colors.error },
  errorTextDark: { color: '#FF6B6B' },
});

