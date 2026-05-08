import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, FlatList, Image, TouchableOpacity,
  StyleSheet, Dimensions, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import postApi from '../../services/api/postApi';
import userApi from '../../services/api/userApi';

const { width } = Dimensions.get('window');
const GRID_SIZE = (width - 4) / 3;

const ExploreScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [explorePosts, setExplorePosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);

  useEffect(() => {
    fetchExplore();
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

  const fetchExplore = async () => {
    try {
      const response = await postApi.getExplorePosts();
      setExplorePosts(response.data.data.posts);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
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

  const renderGridItem = ({ item }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => navigation.navigate('PostDetail', { postId: item._id })}
    >
      <Image source={{ uri: item.media[0]?.url }} style={styles.gridImage} />
      {item.media.length > 1 && (
        <View style={styles.multiIcon}>
          <Ionicons name="copy" size={14} color="#FFF" />
        </View>
      )}
    </TouchableOpacity>
  );

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
          data={explorePosts}
          key="explore-grid-3"
          numColumns={3}
          keyExtractor={(item) => item._id}
          renderItem={renderGridItem}
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
  gridItem: { width: GRID_SIZE, height: GRID_SIZE, padding: 1 },
  gridImage: { flex: 1, borderRadius: 2 },
  multiIcon: { position: 'absolute', top: 6, right: 6 },
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
});

export default ExploreScreen;
