import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, Image, TouchableOpacity,
  StyleSheet, Dimensions, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import userApi from '../../services/api/userApi';

const ExploreScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);

  useEffect(() => {
    fetchSuggestedUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const timer = setTimeout(() => searchUsers(), 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
      setIsSearchMode(false);
    }
  }, [searchQuery]);

  const fetchSuggestedUsers = async () => {
    try {
      const response = await userApi.getSuggestedUsers();
      const users = (response.data.data.users || []).map(u => ({ ...u, isFollowing: false }));
      setSuggestedUsers(users);
    } catch (error) {
      console.error('Error fetching suggested users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (userId, isFollowing) => {
    try {
      // Optimistically update follow status in suggestedUsers
      setSuggestedUsers(prev =>
        prev.map(u => (u._id === userId ? { ...u, isFollowing: !isFollowing } : u))
      );
      
      if (isFollowing) {
        await userApi.unfollowUser(userId);
      } else {
        await userApi.followUser(userId);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      // Revert optimization on error
      setSuggestedUsers(prev =>
        prev.map(u => (u._id === userId ? { ...u, isFollowing } : u))
      );
    }
  };

  const searchUsers = async () => {
    setSearching(true);
    setIsSearchMode(true);
    try {
      const response = await userApi.searchUsers(searchQuery.trim());
      setSearchResults(response.data.data.users);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setSearching(false);
    }
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => navigation.navigate('UserProfile', { username: item.username })}
    >
      {item.avatar?.url ? (
        <Image source={{ uri: item.avatar.url }} style={styles.userAvatar} />
      ) : (
        <View style={[styles.userAvatar, { backgroundColor: colors.surfaceLight, justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="person" size={20} color={colors.textTertiary} />
        </View>
      )}
      <View style={styles.userInfo}>
        <View style={styles.usernameRow}>
          <Text style={[styles.username, { color: colors.text }]}>{item.username}</Text>
          {item.isVerified && <Ionicons name="checkmark-circle" size={14} color="#536DFE" style={{ marginLeft: 4 }} />}
        </View>
        <Text style={[styles.fullName, { color: colors.textSecondary }]}>{item.fullName}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderSuggestedUserItem = ({ item }) => (
    <View style={styles.suggestedUserItem}>
      <TouchableOpacity
        style={styles.suggestedUserInfo}
        onPress={() => navigation.navigate('UserProfile', { username: item.username })}
      >
        {item.avatar?.url ? (
          <Image source={{ uri: item.avatar.url }} style={styles.suggestedAvatar} />
        ) : (
          <View style={[styles.suggestedAvatar, { backgroundColor: colors.surfaceLight, justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="person" size={24} color={colors.textTertiary} />
          </View>
        )}
        <View style={styles.suggestedDetails}>
          <View style={styles.usernameRow}>
            <Text style={[styles.suggestedUsername, { color: colors.text }]}>{item.username}</Text>
            {item.isVerified && <Ionicons name="checkmark-circle" size={14} color="#536DFE" style={{ marginLeft: 4 }} />}
          </View>
          <Text style={[styles.suggestedFullName, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.fullName}
          </Text>
          <Text style={[styles.suggestedReason, { color: colors.textTertiary }]} numberOfLines={1}>
            {item.mutualFollowers > 0
              ? `Followed by ${item.mutualFollowers} mutual contacts`
              : 'Popular on Snaply'}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.followButton,
          item.isFollowing
            ? { backgroundColor: colors.surfaceLight, borderColor: colors.border, borderWidth: 1 }
            : { backgroundColor: colors.primary }
        ]}
        onPress={() => handleFollowToggle(item._id, item.isFollowing)}
      >
        <Text
          style={[
            styles.followButtonText,
            { color: item.isFollowing ? colors.text : '#FFF' }
          ]}
        >
          {item.isFollowing ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Bar */}
      <LinearGradient
        colors={['#FEDA75', '#FA7E1E', '#D62976', '#962FBF', '#4F5BD5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.searchHeader}
      >
        <View style={[styles.searchBar, { backgroundColor: 'rgba(255,255,255,0.4)' }]}>
          <Ionicons name="search" size={18} color="#000" />
          <TextInput
            style={[styles.searchInput, { color: '#000', outlineStyle: 'none' }]}
            placeholder="Search users..."
            placeholderTextColor="rgba(0,0,0,0.5)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchMode(true)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); setIsSearchMode(false); }}>
              <Ionicons name="close-circle" size={18} color="#000" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {isSearchMode ? (
        searching ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item._id}
            renderItem={renderUserItem}
            ListEmptyComponent={
              searchQuery.length > 0 ? (
                <View style={styles.emptySearch}>
                  <Text style={{ color: colors.textSecondary }}>No users found</Text>
                </View>
              ) : null
            }
          />
        )
      ) : loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={suggestedUsers}
          key="suggested-users-list"
          keyExtractor={(item) => item._id}
          renderItem={renderSuggestedUserItem}
          ListHeaderComponent={
            <Text style={[styles.sectionHeader, { color: colors.text }]}>Suggested for you</Text>
          }
          ListEmptyComponent={
            <View style={styles.emptySearch}>
              <Text style={{ color: colors.textSecondary }}>No suggestions available</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchHeader: { paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 40,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, outlineStyle: 'none' },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  userAvatar: { width: 50, height: 50, borderRadius: 25 },
  userInfo: { marginLeft: 12, flex: 1 },
  usernameRow: { flexDirection: 'row', alignItems: 'center' },
  username: { fontSize: 14, fontWeight: '600' },
  fullName: { fontSize: 13, marginTop: 2 },
  emptySearch: { alignItems: 'center', paddingTop: 40 },
  
  // Suggested Users styles
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },
  suggestedUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  suggestedUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  suggestedAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  suggestedDetails: {
    marginLeft: 12,
    flex: 1,
    paddingRight: 12,
  },
  suggestedUsername: {
    fontSize: 14,
    fontWeight: '600',
  },
  suggestedFullName: {
    fontSize: 13,
    marginTop: 2,
  },
  suggestedReason: {
    fontSize: 11,
    marginTop: 2,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 90,
  },
  followButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default ExploreScreen;
