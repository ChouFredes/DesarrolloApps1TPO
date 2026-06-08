import React, { useRef } from 'react';
import { Animated, Pressable, Text, StyleSheet, ViewStyle } from 'react-native';

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
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,234,223,0.4)',
    paddingVertical: 15,
    alignItems: 'center',
    width: '100%',
  },
  text: {
    color: '#00EADF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
