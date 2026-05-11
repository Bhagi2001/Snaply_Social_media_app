import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import GradientHeader from '../../components/GradientHeader';
import { userApi } from '../../services/api/userApi';

const NotificationSettingsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [likes, setLikes] = useState(true);
  const [comments, setComments] = useState(true);
  const [follows, setFollows] = useState(true);
  const [messages, setMessages] = useState(true);
  const [mentions, setMentions] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await userApi.getSettings();
      const notifications = response.data.data.settings?.notifications || {};
      setLikes(!!notifications.likes);
      setComments(!!notifications.comments);
      setFollows(!!notifications.follows);
      setMessages(!!notifications.messages);
      setMentions(!!notifications.mentions);
    } catch (error) {
      Alert.alert('Error', 'Failed to load notification settings.');
    } finally {
      setLoading(false);
    }
  };

  const saveNotifications = async (nextValues) => {
    try {
      await userApi.updateSettings({ notifications: nextValues });
    } catch (error) {
      Alert.alert('Error', 'Failed to update notification settings.');
      loadSettings();
    }
  };

  const row = (icon, label, value, onChange) => (
    <View style={[styles.row, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}> 
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={20} color={colors.textSecondary} />
        <Text style={[styles.rowTitle, { color: colors.text }]}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#FFF"
      />
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}> 
        <GradientHeader title="Notifications" onBack={() => navigation.goBack()} />
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <GradientHeader title="Notifications" onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PUSH NOTIFICATIONS</Text>
        {row('heart-outline', 'Likes', likes, (v) => {
          setLikes(v);
          saveNotifications({ likes: v });
        })}
        {row('chatbubble-outline', 'Comments', comments, (v) => {
          setComments(v);
          saveNotifications({ comments: v });
        })}
        {row('person-add-outline', 'New Followers', follows, (v) => {
          setFollows(v);
          saveNotifications({ follows: v });
        })}
        {row('paper-plane-outline', 'Messages', messages, (v) => {
          setMessages(v);
          saveNotifications({ messages: v });
        })}
        {row('at-outline', 'Mentions', mentions, (v) => {
          setMentions(v);
          saveNotifications({ mentions: v });
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default NotificationSettingsScreen;
