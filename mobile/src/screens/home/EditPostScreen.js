import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image,
  ScrollView, ActivityIndicator, Alert, StatusBar, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import postApi from '../../services/api/postApi';
import GradientHeader from '../../components/GradientHeader';

const EditPostScreen = ({ route, navigation }) => {
  const { postId, initialCaption, initialLocation, media, onUpdate } = route.params;
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [caption, setCaption] = useState(initialCaption || '');
  const [location, setLocation] = useState(initialLocation || '');
  const [updating, setUpdating] = useState(false);
  
  // Combine existing media with marker, local state can hold both existing and new files
  const [mediaList, setMediaList] = useState(
    (media || []).map(item => ({ ...item, isExisting: true }))
  );

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
      selectionLimit: 10 - mediaList.length,
    });

    if (!result.canceled) {
      const newAssets = result.assets.map(asset => ({
        uri: asset.uri,
        type: asset.type,
        isNew: true,
      }));
      setMediaList(prev => [...prev, ...newAssets].slice(0, 10));
    }
  };

  const takePhoto = async () => {
    if (mediaList.length >= 10) {
      Alert.alert('Limit reached', 'You can upload up to 10 photos/videos');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled) {
      const newAsset = {
        uri: result.assets[0].uri,
        type: result.assets[0].type,
        isNew: true,
      };
      setMediaList(prev => [...prev, newAsset].slice(0, 10));
    }
  };

  const removeMedia = (index) => {
    setMediaList(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdate = async () => {
    if (mediaList.length === 0) {
      Alert.alert('No media', 'At least one image or video is required');
      return;
    }

    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append('caption', caption);
      formData.append('location', location);

      // Separate existing and new media
      const existingMedia = mediaList.filter(item => item.isExisting);
      formData.append('existingMedia', JSON.stringify(existingMedia));

      // Append new media files
      const newMedia = mediaList.filter(item => item.isNew);
      for (let index = 0; index < newMedia.length; index++) {
        const item = newMedia[index];
        if (Platform.OS === 'web') {
          const response = await fetch(item.uri);
          const blob = await response.blob();
          const fileName = `media_${index}.${item.type === 'video' ? 'mp4' : 'jpg'}`;
          formData.append('media', blob, fileName);
        } else {
          const fileType = item.type === 'video' ? 'video/mp4' : 'image/jpeg';
          formData.append('media', {
            uri: item.uri,
            type: fileType,
            name: `media_${index}.${item.type === 'video' ? 'mp4' : 'jpg'}`,
          });
        }
      }

      const response = await postApi.updatePost(postId, formData);
      const updatedPost = response.data.data.post;
      
      Alert.alert('Success', 'Your post has been updated!');
      
      if (onUpdate) {
        onUpdate(updatedPost);
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Error updating post:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to update post');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      
      <GradientHeader
        title="Edit Post"
        leftComponent={
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color="#FFF" />
          </TouchableOpacity>
        }
        rightComponent={
          <TouchableOpacity onPress={handleUpdate} disabled={updating}>
            {updating ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveText}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Media Preview (Add/Remove Support) */}
        {mediaList.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaPreview}>
            {mediaList.map((item, index) => (
              <View key={index} style={styles.mediaItem}>
                <Image 
                  source={{ uri: item.isExisting ? item.url : item.uri }} 
                  style={styles.mediaImage} 
                />
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
          <View style={[styles.addMediaBox, { borderColor: colors.border }]}>
            <Ionicons name="images-outline" size={48} color={colors.textTertiary} />
            <Text style={[styles.addMediaText, { color: colors.textSecondary }]}>
              No photos/videos remaining. Add some below.
            </Text>
          </View>
        )}

        {/* Media Add Row */}
        {mediaList.length < 10 && (
          <View style={styles.mediaActions}>
            <TouchableOpacity
              style={[styles.mediaButton, { backgroundColor: colors.surfaceLight }]}
              onPress={pickImage}
            >
              <Ionicons name="images" size={20} color={colors.primary} />
              <Text style={[styles.mediaButtonText, { color: colors.text }]}>Add Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.mediaButton, { backgroundColor: colors.surfaceLight }]}
              onPress={takePhoto}
            >
              <Ionicons name="camera" size={20} color={colors.primary} />
              <Text style={[styles.mediaButtonText, { color: colors.text }]}>Add Camera</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Caption */}
        <View style={[styles.captionContainer, { borderBottomColor: colors.border }]}>
          <View style={styles.captionHeader}>
            {user?.avatar?.url ? (
              <Image
                source={{ uri: user.avatar.url }}
                style={styles.userAvatar}
              />
            ) : (
              <View style={[styles.userAvatar, { backgroundColor: colors.surfaceLight, justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="person" size={16} color={colors.textTertiary} />
              </View>
            )}
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

      {/* Updating Overlay */}
      {updating && (
        <View style={styles.uploadOverlay}>
          <View style={[styles.uploadBox, { backgroundColor: colors.surface }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.uploadText, { color: colors.text }]}>Saving changes...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  saveText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  mediaPreview: { padding: 16 },
  mediaItem: { marginRight: 10, position: 'relative' },
  mediaImage: { width: 200, height: 200, borderRadius: 12 },
  removeMedia: { position: 'absolute', top: 4, right: 4 },
  addMediaBox: {
    margin: 16,
    height: 150,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMediaText: { fontSize: 14, marginTop: 12, paddingHorizontal: 20, textAlign: 'center' },
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
    zIndex: 10,
  },
  uploadBox: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  uploadText: { marginTop: 16, fontSize: 16, fontWeight: '600' },
});

export default EditPostScreen;
