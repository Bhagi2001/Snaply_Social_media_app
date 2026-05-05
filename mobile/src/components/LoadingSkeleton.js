import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const LoadingSkeleton = ({ width, height, borderRadius = 4, style }) => {
  const { colors } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.skeleton,
          opacity,
        },
        style,
      ]}
    />
  );
};

// Pre-built skeleton layouts
export const PostSkeleton = () => {
  const { colors } = useTheme();
  return (
    <View style={[skeletonStyles.postContainer, { borderBottomColor: colors.border }]}>
      <View style={skeletonStyles.header}>
        <LoadingSkeleton width={36} height={36} borderRadius={18} />
        <View style={{ marginLeft: 10, gap: 6 }}>
          <LoadingSkeleton width={120} height={14} />
          <LoadingSkeleton width={80} height={10} />
        </View>
      </View>
      <LoadingSkeleton width="100%" height={350} borderRadius={0} />
      <View style={{ padding: 14, gap: 8 }}>
        <LoadingSkeleton width={100} height={14} />
        <LoadingSkeleton width="80%" height={14} />
        <LoadingSkeleton width="60%" height={12} />
      </View>
    </View>
  );
};

const skeletonStyles = StyleSheet.create({
  postContainer: { borderBottomWidth: 0.5, paddingBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 12 },
});

export default LoadingSkeleton;
