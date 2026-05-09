import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import GradientHeader from '../../components/GradientHeader';

const AboutScreen = ({ navigation }) => {
  const { colors } = useTheme();

  const linkRow = (label, onPress) => (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.rowTitle, { color: colors.text }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <GradientHeader title="About" onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: colors.surface }]}> 
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={[styles.appName, { color: colors.text }]}>Snaply</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>Share moments. Stay connected.</Text>
          <Text style={[styles.version, { color: colors.textTertiary }]}>Version 1.0.0</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>LEGAL</Text>
        {linkRow('Terms of Service', () => navigation.navigate('LegalDocument', { doc: 'terms' }))}
        {linkRow('Privacy Policy', () => navigation.navigate('LegalDocument', { doc: 'privacy' }))}
        {linkRow('Open Source Licenses', () => navigation.navigate('LegalDocument', { doc: 'licenses' }))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: {
    margin: 16,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  logo: {
    width: 72,
    height: 72,
  },
  appName: {
    marginTop: 10,
    fontSize: 22,
    fontWeight: '700',
  },
  tagline: {
    marginTop: 6,
    fontSize: 14,
  },
  version: {
    marginTop: 8,
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  row: {
    minHeight: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default AboutScreen;
