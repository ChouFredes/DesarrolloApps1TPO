import React, { useRef } from 'react';
import { Animated, Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { borderRadius, spacing } from '../theme';

interface Props {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function PrimaryButton({ title, onPress, loading, disabled, style }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.96, speed: 60, bounciness: 3, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, speed: 60, bounciness: 3, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        style={[styles.button, (disabled || loading) && styles.disabled]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
      >
        {loading ? <ActivityIndicator color="#0A1626" /> : <Text style={styles.text}>{title}</Text>}
      </Pressable>
    </Animated.View>
  );
}

export default PrimaryButton;

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#00EADF',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    width: '100%',
  },
  disabled: { opacity: 0.5 },
  text: {
    color: '#0A1626',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
