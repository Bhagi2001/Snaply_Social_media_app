import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import userApi from '../../services/api/userApi';
import GradientHeader from '../../components/GradientHeader';

const EditProfileScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    username: user?.username || '',
    bio: user?.bio || '',
    website: user?.website || '',
  });
  const [avatarUri, setAvatarUri] = useState(user?.avatar?.url || '');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setUploadingAvatar(true);
      try {
        const formData = new FormData();
        if (Platform.OS === 'web') {
          const fetchRes = await fetch(result.assets[0].uri);
          const blob = await fetchRes.blob();
          formData.append('avatar', blob, 'avatar.jpg');
        } else {
          formData.append('avatar', {
            uri: result.assets[0].uri,
            type: 'image/jpeg',
            name: 'avatar.jpg',
          });
        }

        const response = await userApi.updateAvatar(formData);
        setAvatarUri(response.data.data.avatar.url);
        updateUser({ avatar: response.data.data.avatar });
      } catch (error) {
        Alert.alert('Error', 'Failed to update avatar');
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  const handleSave = async () => {
    if (!form.fullName.trim()) {
      Alert.alert('Error', 'Full name is required');
      return;
    }

    setSaving(true);
    try {
      const response = await userApi.updateProfile(form);
      updateUser(response.data.data.user);
      Alert.alert('Success', 'Profile updated');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <GradientHeader
        title="Edit Profile"
        leftComponent={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: '#FFF', fontSize: 16 }}>Cancel</Text>
          </TouchableOpacity>
        }
        rightComponent={
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>Done</Text>
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <TouchableOpacity style={styles.avatarSection} onPress={pickAvatar}>
          {uploadingAvatar ? (
            <View style={[styles.avatar, { backgroundColor: colors.surfaceLight }]}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <LinearGradient colors={['#E040FB', '#536DFE']} style={styles.avatar}>
              <Text style={styles.avatarLetter}>{form.fullName.charAt(0).toUpperCase()}</Text>
            </LinearGradient>
          )}
          <Text style={[styles.changePhotoText, { color: colors.primary }]}>
            Change Profile Photo
          </Text>
        </TouchableOpacity>

        {/* Form */}
        <View style={styles.form}>
          {['fullName', 'username', 'bio', 'website'].map((field) => (
            <View key={field} style={[styles.fieldRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                {field === 'fullName' ? 'Name' : field.charAt(0).toUpperCase() + field.slice(1)}
              </Text>
              <TextInput
                style={[styles.fieldInput, { color: colors.text }]}
                value={form[field]}
                onChangeText={(v) => setForm(prev => ({ ...prev, [field]: v }))}
                placeholder={`Enter ${field}`}
                placeholderTextColor={colors.textTertiary}
                multiline={field === 'bio'}
                maxLength={field === 'bio' ? 150 : undefined}
                autoCapitalize={field === 'fullName' ? 'words' : 'none'}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  cancelText: { fontSize: 16 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  doneText: { fontSize: 16, fontWeight: '700' },
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: { fontSize: 42, fontWeight: '700', color: '#FFF' },
  changePhotoText: { fontSize: 14, fontWeight: '600', marginTop: 12 },
  form: { paddingHorizontal: 16 },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  fieldLabel: { width: 100, fontSize: 14, paddingTop: 2 },
  fieldInput: { flex: 1, fontSize: 16 },
});

export default EditProfileScreen;
