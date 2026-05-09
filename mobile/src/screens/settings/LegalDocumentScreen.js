import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import GradientHeader from '../../components/GradientHeader';

const CONTENT = {
  terms: {
    title: 'Terms of Service',
    body: 'By using Snaply, you agree to use the platform responsibly and comply with applicable laws. You are responsible for content you post and interactions you initiate.',
  },
  privacy: {
    title: 'Privacy Policy',
    body: 'Snaply stores account data necessary to provide social features, including profile details and app settings. You can control privacy settings from the Privacy page.',
  },
  licenses: {
    title: 'Open Source Licenses',
    body: 'Snaply uses open source libraries across mobile and backend stacks. License details can be provided in a dedicated license listing page.',
  },
};

const LegalDocumentScreen = ({ route, navigation }) => {
  const { colors } = useTheme();
  const doc = route.params?.doc || 'terms';
  const content = CONTENT[doc] || CONTENT.terms;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <GradientHeader title={content.title} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{content.title}</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>{content.body}</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 14 },
  body: { fontSize: 15, lineHeight: 24 },
});

export default LegalDocumentScreen;
