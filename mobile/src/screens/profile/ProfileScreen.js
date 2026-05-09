import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Image, FlatList, TouchableOpacity, StyleSheet,
  Dimensions, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import userApi from '../../services/api/userApi';
import GradientHeader from '../../components/GradientHeader';

const { width } = Dimensions.get('window');
const GRID_SIZE = (width - 4) / 3;

const ProfileScreen = ({ route, navigation }) => {
  const targetUsername = route?.params?.username;
  const { colors } = useTheme();
  const { user: currentUser, logout } = useAuth();
  const isOwnProfile = !targetUsername || targetUsername === currentUser?.username;
  
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [gridView, setGridView] = useState(true);

  useEffect(() => {
    fetchProfile();
    fetchPosts();
  }, [targetUsername]);

  const fetchProfile = async () => {
    try {
      const username = targetUsername || currentUser?.username;
      const response = await userApi.getProfile(username);
      setProfile(response.data.data.user);
      setIsFollowing(response.data.data.user.isFollowing);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const username = targetUsername || currentUser?.username;
      const response = await userApi.getUserPosts(username);
      setPosts(response.data.data.posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await userApi.unfollowUser(profile._id);
        setProfile(prev => ({
          ...prev,
          followersCount: prev.followersCount - 1
        }));
      } else {
        await userApi.followUser(profile._id);
        setProfile(prev => ({
          ...prev,
          followersCount: prev.followersCount + 1
        }));
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([fetchProfile(), fetchPosts()]).finally(() => setRefreshing(false));
  }, []);

  const handleMessage = async () => {
    navigation.navigate('ChatDetail', { userId: profile._id, username: profile.username });
  };

  const renderHeader = () => {
    if (!profile) return null;

    return (
      <View style={styles.profileSection}>
        {/* Avatar & Stats */}
        <View style={styles.topRow}>
          <View style={styles.avatarContainer}>
            {profile.avatar?.url ? (
              <Image source={{ uri: profile.avatar.url }} style={styles.avatar} />
            ) : (
              <LinearGradient colors={['#E040FB', '#536DFE']} style={styles.avatar}>
                <Text style={styles.avatarLetter}>
                  {profile.fullName?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </LinearGradient>
            )}
            {profile.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#536DFE" />
              </View>
            )}
          </View>

          <View style={styles.statsContainer}>
            <TouchableOpacity style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{profile.postsCount || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Posts</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => navigation.navigate('Followers', { userId: profile._id, username: profile.username })}
            >
              <Text style={[styles.statNumber, { color: colors.text }]}>{profile.followersCount || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Followers</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.statItem}
              onPress={() => navigation.navigate('Following', { userId: profile._id, username: profile.username })}
            >
              <Text style={[styles.statNumber, { color: colors.text }]}>{profile.followingCount || 0}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Following</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bio */}
        <View style={styles.bioSection}>
          <Text style={[styles.fullName, { color: colors.text }]}>{profile.fullName}</Text>
          {profile.bio ? (
            <Text style={[styles.bio, { color: colors.textSecondary }]}>{profile.bio}</Text>
          ) : null}
          {profile.website ? (
            <Text style={[styles.website, { color: colors.secondary }]}>{profile.website}</Text>
          ) : null}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {isOwnProfile ? (
            <>
              <TouchableOpacity
                style={[styles.actionButton, { borderColor: colors.border }]}
                onPress={() => navigation.navigate('EditProfile')}
              >
                <Text style={[styles.actionButtonText, { color: colors.text }]}>Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButtonSmall, { borderColor: colors.border }]}
                onPress={() => navigation.navigate('Settings')}
              >
                <Ionicons name="settings-outline" size={18} color={colors.text} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  isFollowing 
                    ? { borderColor: colors.border } 
                    : { backgroundColor: colors.primary, borderColor: colors.primary }
                ]}
                onPress={handleFollow}
              >
                <Text style={[
                  styles.actionButtonText,
                  { color: isFollowing ? colors.text : '#FFF' }
                ]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { borderColor: colors.border }]}
                onPress={handleMessage}
              >
                <Text style={[styles.actionButtonText, { color: colors.text }]}>Message</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Grid/List Toggle */}
        <View style={[styles.viewToggle, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.toggleButton, gridView && { borderBottomColor: colors.text, borderBottomWidth: 1 }]}
            onPress={() => setGridView(true)}
          >
            <Ionicons name="grid-outline" size={22} color={gridView ? colors.text : colors.textTertiary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, !gridView && { borderBottomColor: colors.text, borderBottomWidth: 1 }]}
            onPress={() => setGridView(false)}
          >
            <Ionicons name="list-outline" size={22} color={!gridView ? colors.text : colors.textTertiary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderPostItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('PostDetail', { postId: item._id })}
      style={styles.gridItem}
    >
      <Image source={{ uri: item.media[0]?.url }} style={styles.gridImage} />
      {item.media.length > 1 && (
        <View style={styles.multipleIcon}>
          <Ionicons name="copy" size={16} color="#FFF" />
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GradientHeader
        title={profile?.username || ''}
        onBack={!isOwnProfile ? () => navigation.goBack() : undefined}
      />

      <FlatList
        data={posts}
        key="profile-grid-3"
        numColumns={3}
        keyExtractor={(item) => item._id}
        renderItem={renderPostItem}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  headerUsername: { fontSize: 20, fontWeight: '700' },
  profileSection: { paddingHorizontal: 16 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  avatarContainer: { position: 'relative' },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: { fontSize: 36, fontWeight: '700', color: '#FFF' },
  verifiedBadge: { position: 'absolute', bottom: 0, right: 0 },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: 24,
  },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 13, marginTop: 2 },
  bioSection: { marginTop: 14 },
  fullName: { fontSize: 15, fontWeight: '700' },
  bio: { fontSize: 14, marginTop: 3, lineHeight: 20 },
  website: { fontSize: 14, marginTop: 3 },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonSmall: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: { fontSize: 14, fontWeight: '600' },
  viewToggle: {
    flexDirection: 'row',
    marginTop: 16,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
  },
  toggleButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  gridItem: {
    width: GRID_SIZE,
    height: GRID_SIZE,
    padding: 1,
  },
  gridImage: {
    flex: 1,
    borderRadius: 2,
  },
  multipleIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
});

export default ProfileScreen;
