import React, { useRef } from 'react';
import { Animated, Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing } from '../theme';

interface Props {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
}

export function SecondaryButton({ title, onPress, style }: Props) {
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
        style={styles.button}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Text style={styles.text}>{title}</Text>
      </Pressable>
    </Animated.View>
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
