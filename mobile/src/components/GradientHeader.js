import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const GRADIENT_COLORS = ['#FEDA75', '#FA7E1E', '#D62976', '#962FBF', '#4F5BD5'];

const GradientHeader = ({
  title,
  onBack,
  rightComponent,
  leftComponent,
  centerComponent,
}) => {
  return (
    <LinearGradient
      colors={GRADIENT_COLORS}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.header}
    >
      <View style={styles.left}>
        {onBack ? (
          <TouchableOpacity onPress={onBack}>
            <Ionicons name="chevron-back" size={28} color="#FFF" />
          </TouchableOpacity>
        ) : leftComponent || <View style={{ width: 28 }} />}
      </View>

      <View style={styles.center}>
        {centerComponent || (
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
        )}
      </View>

      <View style={styles.right}>
        {rightComponent || <View style={{ width: 28 }} />}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
  },
  left: {
    minWidth: 40,
    alignItems: 'flex-start',
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  right: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export { GRADIENT_COLORS };
export default GradientHeader;
