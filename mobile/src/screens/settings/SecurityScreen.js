import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import GradientHeader from '../../components/GradientHeader';
import { userApi } from '../../services/api/userApi';

const SecurityScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [twoFactor, setTwoFactor] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [saveLoginInfo, setSaveLoginInfo] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await userApi.getSettings();
      const security = response.data.data.settings?.security || {};
      setTwoFactor(!!security.twoFactor);
      setLoginAlerts(!!security.loginAlerts);
      setSaveLoginInfo(!!security.saveLoginInfo);
    } catch (error) {
      Alert.alert('Error', 'Failed to load security settings.');
    } finally {
      setLoading(false);
    }
  };

  const saveSecurity = async (nextValues) => {
    try {
      await userApi.updateSettings({ security: nextValues });
    } catch (error) {
      Alert.alert('Error', 'Failed to update security settings.');
      loadSettings();
    }
  };

  const row = (icon, label, onPress) => (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.row, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}
      activeOpacity={0.7}
    >
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={20} color={colors.textSecondary} />
        <Text style={[styles.rowTitle, { color: colors.text }]}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  const switchRow = (icon, label, value, onChange, description) => (
    <View style={[styles.row, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}> 
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={20} color={colors.textSecondary} />
        <View>
          <Text style={[styles.rowTitle, { color: colors.text }]}>{label}</Text>
          <Text style={[styles.rowDesc, { color: colors.textSecondary }]}>{description}</Text>
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

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}> 
        <GradientHeader title="Security" onBack={() => navigation.goBack()} />
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <GradientHeader title="Security" onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>LOGIN</Text>
        {row('key-outline', 'Change Password', () => navigation.navigate('ChangePassword'))}
        {switchRow('shield-checkmark-outline', 'Two-Factor Authentication', twoFactor, (v) => {
          setTwoFactor(v);
          saveSecurity({ twoFactor: v });
        }, 'Add an extra layer of security to your account.')}
        {switchRow('notifications-outline', 'Login Alerts', loginAlerts, (v) => {
          setLoginAlerts(v);
          saveSecurity({ loginAlerts: v });
        }, 'Get notified for new sign-ins.')}
        {switchRow('save-outline', 'Save Login Info', saveLoginInfo, (v) => {
          setSaveLoginInfo(v);
          saveSecurity({ saveLoginInfo: v });
        }, 'Store login info on this device.')}

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DEVICES</Text>
        <View style={[styles.deviceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={[styles.deviceTitle, { color: colors.text }]}>Current Device</Text>
          <Text style={[styles.deviceSub, { color: colors.textSecondary }]}>Mobile app • Active now</Text>
        </View>
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
  rowTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  rowDesc: {
    marginTop: 2,
    fontSize: 12,
  },
  deviceCard: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  deviceTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  deviceSub: {
    marginTop: 4,
    fontSize: 13,
  },
});

export default SecurityScreen;
