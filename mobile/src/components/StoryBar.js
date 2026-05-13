import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import storyApi from '../services/api/storyApi';

const StoryBar = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const [storyGroups, setStoryGroups] = useState([]);

  const isSmallDevice = width < 360;
  const storySize = isSmallDevice ? 60 : 68;
  const avatarSize = isSmallDevice ? 50 : 58;
  const ringRadius = storySize / 2;

  useEffect(() => {
    fetchStories();

    // Refresh stories when screen comes into focus (e.g. after deleting or adding a story)
    const unsubscribe = navigation.addListener('focus', () => {
      fetchStories();
    });

    return unsubscribe;
  }, [navigation]);

  const fetchStories = async () => {
    try {
      const response = await storyApi.getStories();
      setStoryGroups(response.data.data.stories);
    } catch (error) {
      console.error('Error fetching stories:', error);
    }
  };

  const renderStoryCircle = (group, index) => {
    const isOwn = group.user?._id === user?._id;
    const hasUnviewed = group.hasUnviewed;

    return (
      <TouchableOpacity
        key={group.user?._id || index}
        style={[styles.storyItem, { width: isSmallDevice ? 66 : 72 }]}
        onPress={() => {
          navigation.navigate('StoryViewer', {
            storyGroup: group,
            initialIndex: 0,
          });
        }}
      >
        <View style={styles.storyCircleWrapper}>
          {hasUnviewed ? (
            <LinearGradient
              colors={['#E040FB', '#536DFE', '#00E5FF']}
              style={[styles.gradientRing, { width: storySize, height: storySize, borderRadius: ringRadius }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View
                style={[
                  styles.innerRing,
                  {
                    width: storySize - 6,
                    height: storySize - 6,
                    borderRadius: ringRadius - 3,
                    backgroundColor: colors.background,
                  },
                ]}
              >
                {group.user?.avatar?.url ? (
                  <Image source={{ uri: group.user.avatar.url }} style={[styles.storyAvatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]} />
                ) : (
                  <View style={[styles.storyAvatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, backgroundColor: colors.surfaceLight, justifyContent: 'center', alignItems: 'center' }]}> 
                    <Ionicons name="person" size={20} color={colors.textTertiary} />
                  </View>
                )}
              </View>
            </LinearGradient>
          ) : (
            <View style={[styles.seenRing, { width: storySize, height: storySize, borderRadius: ringRadius, borderColor: colors.border }]}> 
              {group.user?.avatar?.url ? (
                <Image source={{ uri: group.user.avatar.url }} style={[styles.storyAvatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]} />
              ) : (
                <View style={[styles.storyAvatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, backgroundColor: colors.surfaceLight, justifyContent: 'center', alignItems: 'center' }]}> 
                  <Ionicons name="person" size={20} color={colors.textTertiary} />
                </View>
              )}
            </View>
          )}
        </View>
        <Text style={[styles.storyUsername, { color: colors.textSecondary }]} numberOfLines={1}>
          {isOwn ? 'Your story' : group.user?.username}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      {/* Add Story */}
      <TouchableOpacity
        style={[styles.storyItem, { width: isSmallDevice ? 66 : 72 }]}
        onPress={() => navigation.navigate('CreateStory')}
      >
        <View style={styles.storyCircleWrapper}>
          <View style={[styles.addStoryCircle, { width: storySize, height: storySize, borderRadius: ringRadius, borderColor: colors.border }]}> 
            {user?.avatar?.url ? (
              <Image source={{ uri: user.avatar.url }} style={[styles.storyAvatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]} />
            ) : (
              <View style={[styles.storyAvatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, backgroundColor: colors.surfaceLight, justifyContent: 'center', alignItems: 'center' }]}> 
                <Ionicons name="person" size={20} color={colors.textTertiary} />
              </View>
            )}
          </View>
          <View style={[styles.addBadge, { backgroundColor: colors.primary }]}>
            <Ionicons name="add" size={14} color="#FFF" />
          </View>
        </View>
        <Text style={[styles.storyUsername, { width: isSmallDevice ? 64 : 70, color: colors.textSecondary }]}>Your story</Text>
      </TouchableOpacity>

      {storyGroups.map((group, index) => renderStoryCircle(group, index))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingLeft: 8,
  },
  storyItem: {
    alignItems: 'center',
    marginHorizontal: 6,
  },
  storyCircleWrapper: {
    position: 'relative',
    marginBottom: 4,
  },
  gradientRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seenRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 3,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  addStoryCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 3,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  storyUsername: {
    fontSize: 11,
    textAlign: 'center',
  },
});

export default StoryBar;
