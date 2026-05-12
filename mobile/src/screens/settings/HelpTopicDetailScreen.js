import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import GradientHeader from '../../components/GradientHeader';

const HELP_CONTENT = {
  'Getting Started': {
    title: 'Getting Started',
    body: 'Create your profile, follow friends, and share your first post or story. Use Explore to discover people and content.',
  },
  'Account & Profile': {
    title: 'Account & Profile',
    body: 'You can edit profile details from Settings > Edit Profile. Keep your username unique and your bio concise.',
  },
  'Privacy & Safety': {
    title: 'Privacy & Safety',
    body: 'Control account privacy, activity status, story replies, and interaction restrictions from the Privacy page.',
  },
  'Messages & Stories': {
    title: 'Messages & Stories',
    body: 'Open Chat for direct messaging. Stories are visible for 24 hours and can be managed from story settings.',
  },
};

const HelpTopicDetailScreen = ({ route, navigation }) => {
  const { colors } = useTheme();
  const topic = route.params?.topic || 'Getting Started';
  const content = HELP_CONTENT[topic] || HELP_CONTENT['Getting Started'];

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

export default HelpTopicDetailScreen;
