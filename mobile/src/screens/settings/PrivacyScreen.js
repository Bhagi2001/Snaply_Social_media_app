import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import GradientHeader from '../../components/GradientHeader';
import { userApi } from '../../services/api/userApi';
import { useAuth } from '../../context/AuthContext';

const PrivacyScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { updateUser } = useAuth();
  const [privateAccount, setPrivateAccount] = useState(false);
  const [activityStatus, setActivityStatus] = useState(true);
  const [storyReplies, setStoryReplies] = useState(true);
  const [counts, setCounts] = useState({ blocked: 0, muted: 0, restricted: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await userApi.getSettings();
      const { settings, interactionCounts } = response.data.data;
      setPrivateAccount(!!settings.privacy?.privateAccount);
      setActivityStatus(!!settings.privacy?.activityStatus);
      setStoryReplies(!!settings.privacy?.storyReplies);
      setCounts(interactionCounts || { blocked: 0, muted: 0, restricted: 0 });
    } catch (error) {
      Alert.alert('Error', 'Failed to load privacy settings.');
    } finally {
      setLoading(false);
    }
  };

  const savePrivacy = async (nextValues) => {
    try {
      await userApi.updateSettings({ privacy: nextValues });
      if (nextValues.privateAccount !== undefined) {
        updateUser({ isPrivate: !!nextValues.privateAccount });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update privacy settings.');
      loadSettings();
    }
  };

  const renderSwitchRow = (icon, label, value, onChange, description) => (
    <View style={[styles.row, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={20} color={colors.textSecondary} />
        <View>
          <Text style={[styles.rowTitle, { color: colors.text }]}>{label}</Text>
          {description ? <Text style={[styles.rowDesc, { color: colors.textSecondary }]}>{description}</Text> : null}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#FFF"
      />
    </View>
  );

  const renderLinkRow = (icon, label, value = '', onPress) => (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={20} color={colors.textSecondary} />
        <Text style={[styles.rowTitle, { color: colors.text }]}>{label}</Text>
      </View>
      <View style={styles.rowRight}>
        {value ? <Text style={[styles.valueText, { color: colors.textSecondary }]}>{value}</Text> : null}
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}> 
        <GradientHeader title="Privacy" onBack={() => navigation.goBack()} />
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <GradientHeader title="Privacy" onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ACCOUNT PRIVACY</Text>
        {renderSwitchRow('lock-closed-outline', 'Private Account', privateAccount, (v) => {
          setPrivateAccount(v);
          savePrivacy({ privateAccount: v });
        }, 'Only approved followers can see your posts.')}
        {renderSwitchRow('radio-outline', 'Activity Status', activityStatus, (v) => {
          setActivityStatus(v);
          savePrivacy({ activityStatus: v });
        }, 'Allow others to see when you are active.')}
        {renderSwitchRow('chatbubble-ellipses-outline', 'Story Replies', storyReplies, (v) => {
          setStoryReplies(v);
          savePrivacy({ storyReplies: v });
        }, 'Allow replies to your stories.')}

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>INTERACTIONS</Text>
        {renderLinkRow('ban-outline', 'Blocked Accounts', String(counts.blocked), () => navigation.navigate('InteractionList', { type: 'blocked' }))}
        {renderLinkRow('eye-off-outline', 'Muted Accounts', String(counts.muted), () => navigation.navigate('InteractionList', { type: 'muted' }))}
        {renderLinkRow('shield-checkmark-outline', 'Restricted Accounts', String(counts.restricted), () => navigation.navigate('InteractionList', { type: 'restricted' }))}
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
    minHeight: 62,
    paddingHorizontal: 16,
    paddingVertical: 10,
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
    paddingRight: 12,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  rowDesc: {
    marginTop: 2,
    fontSize: 12,
  },
  valueText: {
    fontSize: 13,
  },
});

export default PrivacyScreen;
