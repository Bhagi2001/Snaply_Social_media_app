import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image,
  ScrollView, ActivityIndicator, Alert, StatusBar, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import postApi from '../../services/api/postApi';
import GradientHeader from '../../components/GradientHeader';

const CreatePostScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [media, setMedia] = useState([]);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10,
    });

    if (!result.canceled) {
      setMedia(prev => [...prev, ...result.assets].slice(0, 10));
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled) {
      setMedia(prev => [...prev, ...result.assets].slice(0, 10));
    }
  };

  const removeMedia = (index) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    if (media.length === 0) {
      Alert.alert('No media', 'Please add at least one photo or video');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('caption', caption);
      formData.append('location', location);

      for (let index = 0; index < media.length; index++) {
        const item = media[index];
        if (Platform.OS === 'web') {
          // On web, convert blob URI to actual Blob
          const response = await fetch(item.uri);
          const blob = await response.blob();
          const fileName = `media_${index}.${item.type === 'video' ? 'mp4' : 'jpg'}`;
          formData.append('media', blob, fileName);
        } else {
          // On native, use the RN format
          const fileType = item.type === 'video' ? 'video/mp4' : 'image/jpeg';
          formData.append('media', {
            uri: item.uri,
            type: fileType,
            name: `media_${index}.${item.type === 'video' ? 'mp4' : 'jpg'}`,
          });
        }
      }

      await postApi.createPost(formData);
      Alert.alert('Success', 'Your post has been shared!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create post');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      
      <GradientHeader
        title="New Post"
        leftComponent={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
        }
        rightComponent={
          <TouchableOpacity onPress={handlePost} disabled={uploading || media.length === 0}>
            {uploading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={[styles.shareText, { color: media.length > 0 ? '#FFF' : 'rgba(255,255,255,0.5)' }]}>
                Share
              </Text>
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Media Preview */}
        {media.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaPreview}>
            {media.map((item, index) => (
              <View key={index} style={styles.mediaItem}>
                <Image source={{ uri: item.uri }} style={styles.mediaImage} />
                <TouchableOpacity
                  style={styles.removeMedia}
                  onPress={() => removeMedia(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#FF4757" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        ) : (
          <TouchableOpacity style={[styles.addMediaBox, { borderColor: colors.border }]} onPress={pickImage}>
            <Ionicons name="images-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.addMediaText, { color: colors.textSecondary }]}>
              Tap to add photos or videos
            </Text>
          </TouchableOpacity>
        )}

        {/* Media Actions */}
        <View style={styles.mediaActions}>
          <TouchableOpacity
            style={[styles.mediaButton, { backgroundColor: colors.surfaceLight }]}
            onPress={pickImage}
          >
            <Ionicons name="images" size={20} color={colors.primary} />
            <Text style={[styles.mediaButtonText, { color: colors.text }]}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.mediaButton, { backgroundColor: colors.surfaceLight }]}
            onPress={takePhoto}
          >
            <Ionicons name="camera" size={20} color={colors.primary} />
            <Text style={[styles.mediaButtonText, { color: colors.text }]}>Camera</Text>
          </TouchableOpacity>
        </View>

        {/* Caption */}
        <View style={[styles.captionContainer, { borderBottomColor: colors.border }]}>
          <View style={styles.captionHeader}>
            <Image
              source={{ uri: user?.avatar?.url || 'https://via.placeholder.com/40' }}
              style={styles.userAvatar}
            />
            <Text style={[styles.username, { color: colors.text }]}>{user?.username}</Text>
          </View>
          <TextInput
            style={[styles.captionInput, { color: colors.text }]}
            placeholder="Write a caption..."
            placeholderTextColor={colors.textTertiary}
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={2200}
          />
        </View>

        {/* Location */}
        <View style={[styles.optionRow, { borderBottomColor: colors.border }]}>
          <Ionicons name="location-outline" size={22} color={colors.textSecondary} />
          <TextInput
            style={[styles.optionInput, { color: colors.text }]}
            placeholder="Add location"
            placeholderTextColor={colors.textTertiary}
            value={location}
            onChangeText={setLocation}
          />
        </View>
      </ScrollView>

      {/* Uploading Overlay */}
      {uploading && (
        <View style={styles.uploadOverlay}>
          <View style={[styles.uploadBox, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.uploadText, { color: colors.text }]}>Sharing your post...</Text>
          </View>
        </View>
      )}
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
  headerTitle: { fontSize: 18, fontWeight: '700' },
  shareText: { fontSize: 16, fontWeight: '700' },
  mediaPreview: { padding: 16 },
  mediaItem: { marginRight: 10, position: 'relative' },
  mediaImage: { width: 200, height: 200, borderRadius: 12 },
  removeMedia: { position: 'absolute', top: 4, right: 4 },
  addMediaBox: {
    margin: 16,
    height: 250,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMediaText: { fontSize: 15, marginTop: 12 },
  mediaActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  mediaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  mediaButtonText: { fontSize: 14, fontWeight: '600' },
  captionContainer: { padding: 16, borderBottomWidth: 0.5 },
  captionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  userAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  username: { fontSize: 14, fontWeight: '600' },
  captionInput: { fontSize: 16, minHeight: 80, textAlignVertical: 'top' },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  optionInput: { flex: 1, fontSize: 16 },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadBox: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  uploadText: { marginTop: 16, fontSize: 16, fontWeight: '600' },
});

export default CreatePostScreen;
