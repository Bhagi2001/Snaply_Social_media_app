import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import GradientHeader from '../../components/GradientHeader';

const SettingsScreen = ({ navigation }) => {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = typeof globalThis.confirm === 'function'
        ? globalThis.confirm('Are you sure you want to log out?')
        : true;
      if (confirmed) {
        logout();
      }
      return;
    }

    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const sections = [
    {
      title: 'Account',
      items: [
        { icon: 'person-outline', label: 'Edit Profile', action: () => navigation.navigate('EditProfile') },
        { icon: 'lock-closed-outline', label: 'Privacy', action: () => navigation.navigate('Privacy') },
        { icon: 'shield-outline', label: 'Security', action: () => navigation.navigate('Security') },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: isDark ? 'moon' : 'sunny',
          label: 'Dark Mode',
          isSwitch: true,
          value: isDark,
          action: toggleTheme,
        },
        { icon: 'notifications-outline', label: 'Notifications', action: () => navigation.navigate('NotificationSettings') },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: 'help-circle-outline', label: 'Help Center', action: () => navigation.navigate('HelpCenter') },
        { icon: 'information-circle-outline', label: 'About', action: () => navigation.navigate('About') },
      ],
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GradientHeader
        title="Settings"
        onBack={() => navigation.goBack()}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <View style={[styles.userCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.userAvatar, { backgroundColor: colors.surfaceLight }]}>
            <Ionicons name="person" size={28} color={colors.textTertiary} />
          </View>
          <View>
            <Text style={[styles.userName, { color: colors.text }]}>{user?.fullName}</Text>
            <Text style={[styles.userHandle, { color: colors.textSecondary }]}>@{user?.username}</Text>
          </View>
        </View>

        {sections.map((section, sIdx) => (
          <View key={sIdx} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              {section.title}
            </Text>
            {section.items.map((item, iIdx) => (
              <TouchableOpacity
                key={iIdx}
                style={[styles.settingRow, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}
                onPress={item.isSwitch ? undefined : item.action}
                activeOpacity={item.isSwitch ? 1 : 0.6}
              >
                <View style={styles.settingLeft}>
                  <Ionicons name={item.icon} size={22} color={colors.textSecondary} />
                  <Text style={[styles.settingLabel, { color: colors.text }]}>{item.label}</Text>
                </View>
                {item.isSwitch ? (
                  <Switch
                    value={item.value}
                    onValueChange={item.action}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor="#FFF"
                  />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.textTertiary }]}>Snaply v1.0.0</Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 0.5,
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  userCard: {
    flexDirection: 'row', alignItems: 'center', padding: 20, margin: 16, borderRadius: 16, gap: 16,
  },
  userAvatar: {
    width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center',
  },
  userName: { fontSize: 18, fontWeight: '700' },
  userHandle: { fontSize: 14, marginTop: 2 },
  section: { marginTop: 8 },
  sectionTitle: {
    fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1,
    paddingHorizontal: 20, paddingVertical: 8,
  },
  settingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 0.5,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  settingLabel: { fontSize: 16 },
  logoutButton: {
    marginHorizontal: 16, marginTop: 32, padding: 16,
    borderRadius: 12, alignItems: 'center',
  },
  logoutText: { color: '#FF4757', fontSize: 16, fontWeight: '600' },
  version: { textAlign: 'center', fontSize: 13, marginVertical: 20 },
});

export default SettingsScreen;
