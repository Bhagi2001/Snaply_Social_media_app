import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import GradientHeader from '../../components/GradientHeader';

const HelpCenterScreen = ({ navigation }) => {
  const { colors } = useTheme();

  const item = (icon, label, onPress) => (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={20} color={colors.textSecondary} />
        <Text style={[styles.rowTitle, { color: colors.text }]}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <GradientHeader title="Help Center" onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>POPULAR TOPICS</Text>
        {item('rocket-outline', 'Getting Started', () => navigation.navigate('HelpTopicDetail', { topic: 'Getting Started' }))}
        {item('person-circle-outline', 'Account & Profile', () => navigation.navigate('HelpTopicDetail', { topic: 'Account & Profile' }))}
        {item('shield-outline', 'Privacy & Safety', () => navigation.navigate('HelpTopicDetail', { topic: 'Privacy & Safety' }))}
        {item('chatbox-ellipses-outline', 'Messages & Stories', () => navigation.navigate('HelpTopicDetail', { topic: 'Messages & Stories' }))}

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>CONTACT</Text>
        {item('mail-outline', 'Contact Support', () => navigation.navigate('SupportRequest', { type: 'support' }))}
        {item('document-text-outline', 'Report a Problem', () => navigation.navigate('SupportRequest', { type: 'report' }))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 8,
  },
  row: {
    minHeight: 58,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default HelpCenterScreen;
