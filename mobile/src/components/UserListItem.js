import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import userApi from '../services/api/userApi';

const UserListItem = ({ user, navigation }) => {
  const { colors } = useTheme();
  const { user: currentUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const isOwn = user._id === currentUser?._id;

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await userApi.unfollowUser(user._id);
      } else {
        await userApi.followUser(user._id);
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => navigation.navigate('UserProfile', { username: user.username })}
    >
      {user.avatar?.url ? (
        <Image source={{ uri: user.avatar.url }} style={styles.avatar} />
      ) : (
        <LinearGradient colors={['#E040FB', '#536DFE']} style={styles.avatar}>
          <Text style={styles.avatarLetter}>{user.fullName?.charAt(0)?.toUpperCase() || '?'}</Text>
        </LinearGradient>
      )}

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.username, { color: colors.text }]}>{user.username}</Text>
          {user.isVerified && <Ionicons name="checkmark-circle" size={14} color="#536DFE" />}
        </View>
        <Text style={[styles.fullName, { color: colors.textSecondary }]}>{user.fullName}</Text>
      </View>

      {!isOwn && (
        <TouchableOpacity
          style={[
            styles.followButton,
            isFollowing
              ? { borderColor: colors.border, borderWidth: 1 }
              : { backgroundColor: colors.primary },
          ]}
          onPress={handleFollow}
        >
          <Text style={[styles.followText, { color: isFollowing ? colors.text : '#FFF' }]}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10,
  },
  avatar: {
    width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center',
  },
  avatarLetter: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  info: { flex: 1, marginLeft: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  username: { fontSize: 14, fontWeight: '600' },
  fullName: { fontSize: 13, marginTop: 2 },
  followButton: {
    paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8,
  },
  followText: { fontSize: 13, fontWeight: '700' },
});

export default React.memo(UserListItem);
