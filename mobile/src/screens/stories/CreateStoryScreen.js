import React, { useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import storyApi from '../../services/api/storyApi';
import GradientHeader from '../../components/GradientHeader';

const CreateStoryScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [media, setMedia] = useState(null);
  const [uploading, setUploading] = useState(false);

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.8,
    });
    if (!result.canceled) setMedia(result.assets[0]);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled) setMedia(result.assets[0]);
  };

  const handleUpload = async () => {
    if (!media) return;
    setUploading(true);
    try {
      const formData = new FormData();
      if (Platform.OS === 'web') {
        const response = await fetch(media.uri);
        const blob = await response.blob();
        formData.append('media', blob, `story.${media.type === 'video' ? 'mp4' : 'jpg'}`);
      } else {
        formData.append('media', {
          uri: media.uri,
          type: media.type === 'video' ? 'video/mp4' : 'image/jpeg',
          name: `story.${media.type === 'video' ? 'mp4' : 'jpg'}`,
        });
      }

      await storyApi.createStory(formData);
      Alert.alert('Success', 'Story added!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to upload story');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GradientHeader
        title="New Story"
        leftComponent={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
        }
        rightComponent={
          <TouchableOpacity onPress={handleUpload} disabled={!media || uploading}>
            {uploading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={{ color: media ? '#FFF' : 'rgba(255,255,255,0.5)', fontWeight: '700', fontSize: 16 }}>Share</Text>
            )}
          </TouchableOpacity>
        }
      />

      {media ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: media.uri }} style={styles.preview} resizeMode="contain" />
          <TouchableOpacity
            style={styles.changeButton}
            onPress={() => setMedia(null)}
          >
            <Ionicons name="refresh" size={20} color="#FFF" />
            <Text style={styles.changeText}>Change</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.pickerContainer}>
          <TouchableOpacity style={[styles.pickerButton, { backgroundColor: colors.surfaceLight }]} onPress={pickMedia}>
            <Ionicons name="images" size={48} color={colors.primary} />
            <Text style={[styles.pickerText, { color: colors.text }]}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.pickerButton, { backgroundColor: colors.surfaceLight }]} onPress={takePhoto}>
            <Ionicons name="camera" size={48} color={colors.primary} />
            <Text style={[styles.pickerText, { color: colors.text }]}>Camera</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 0.5,
  },
  title: { fontSize: 18, fontWeight: '700' },
  previewContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  preview: { width: '100%', height: '80%' },
  changeButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginTop: 16,
  },
  changeText: { color: '#FFF', fontWeight: '600' },
  pickerContainer: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 24, padding: 24,
  },
  pickerButton: {
    flex: 1, height: 160, borderRadius: 16, justifyContent: 'center', alignItems: 'center', gap: 12,
  },
  pickerText: { fontSize: 16, fontWeight: '600' },
});

export default CreateStoryScreen;
