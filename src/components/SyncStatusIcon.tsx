import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import type { SyncStatus } from '../types';
import { colors } from '../theme';

type Props = {
  status: SyncStatus;
};

export function SyncStatusIcon({ status }: Props) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status !== 'syncing') {
      spin.setValue(0);
      return;
    }
    const animation = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [spin, status]);

  const rotation = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (status === 'idle') {
    return (
      <View style={[styles.badge, styles.idle]}>
        <Svg width={16} height={16} viewBox="0 0 24 24">
          <Circle cx="12" cy="12" r="8.5" stroke="rgba(67,56,202,0.25)" strokeWidth={2.4} fill="none" />
          <Path
            d="M12 3.5a8.5 8.5 0 0 1 8.5 8.5"
            stroke={colors.primary}
            strokeWidth={2.4}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </View>
    );
  }

  if (status === 'success') {
    return (
      <View style={[styles.badge, styles.success]}>
        <Svg width={16} height={16} viewBox="0 0 24 24">
          <Path
            d="M20 6.5L9.5 17 4 11.5"
            stroke="#fff"
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </Svg>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={[styles.badge, styles.error]}>
        <Svg width={16} height={16} viewBox="0 0 24 24">
          <Path
            d="M15.5 8.5L8.5 15.5M8.5 8.5l7 7"
            stroke="#fff"
            strokeWidth={2.6}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.badge, styles.syncing, { transform: [{ rotate: rotation }] }]}>
      <Svg width={16} height={16} viewBox="0 0 24 24">
        <Circle cx="12" cy="12" r="8.5" stroke="rgba(255,255,255,0.28)" strokeWidth={2.4} fill="none" />
        <Path
          d="M12 3.5a8.5 8.5 0 0 1 8.5 8.5"
          stroke="#fff"
          strokeWidth={2.4}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  idle: {
    backgroundColor: colors.soft,
  },
  syncing: {
    backgroundColor: colors.primary,
  },
  success: {
    backgroundColor: colors.green,
  },
  error: {
    backgroundColor: colors.red,
  },
});
