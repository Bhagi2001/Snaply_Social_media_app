import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, Image, StyleSheet, TouchableOpacity,
  Animated, StatusBar, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import storyApi from '../../services/api/storyApi';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STORY_DURATION = 5000; // 5 seconds

const StoryViewerScreen = ({ route, navigation }) => {
  const { storyGroup, initialIndex = 0 } = route.params;
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const progress = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);
  const stories = storyGroup?.stories || [];

  useEffect(() => {
    if (stories.length > 0) {
      startTimer();
      markViewed(stories[currentIndex]?._id);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [currentIndex]);

  const startTimer = () => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) goNext();
    });
  };

  const markViewed = async (storyId) => {
    try {
      if (storyId) await storyApi.viewStory(storyId);
    } catch (e) {}
  };

  const goNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      navigation.goBack();
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const currentStory = stories[currentIndex];
  if (!currentStory) return null;

  const user = storyGroup?.user;
  const timeAgo = currentStory.createdAt
    ? `${Math.floor((Date.now() - new Date(currentStory.createdAt)) / 3600000)}h`
    : '';

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Story Image */}
      <Image
        source={{ uri: currentStory.media?.url }}
        style={[styles.storyImage, { width, height }]}
        resizeMode="contain"
      />

      {/* Progress Bars */}
      <View style={[styles.progressContainer, { paddingTop: insets.top + 8 }]}>
        {stories.map((_, index) => (
          <View key={index} style={styles.progressBg}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: index < currentIndex
                    ? '100%'
                    : index === currentIndex
                    ? progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      })
                    : '0%',
                },
              ]}
            />
          </View>
        ))}
      </View>

      {/* Header */}
      <View style={[styles.header, { paddingTop: 12 }]}>
        <View style={styles.headerLeft}>
          {user?.avatar?.url ? (
            <Image source={{ uri: user.avatar.url }} style={styles.avatar} />
          ) : (
            <LinearGradient colors={['#E040FB', '#536DFE']} style={styles.avatar}>
              <Text style={styles.avatarLetter}>{user?.fullName?.charAt(0) || '?'}</Text>
            </LinearGradient>
          )}
          <Text style={styles.username}>{user?.username || 'user'}</Text>
          <Text style={styles.timeAgo}>{timeAgo}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Caption */}
      {currentStory.caption ? (
        <View style={styles.captionContainer}>
          <Text style={styles.captionText}>{currentStory.caption}</Text>
        </View>
      ) : null}

      {/* Touch Areas */}
      <View style={[styles.touchAreas, { top: insets.top + 90 }]}> 
        <TouchableOpacity style={styles.touchLeft} onPress={goPrev} />
        <TouchableOpacity style={styles.touchRight} onPress={goNext} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  storyImage: { ...StyleSheet.absoluteFillObject },
  progressContainer: {
    flexDirection: 'row', paddingHorizontal: 8, gap: 4,
  },
  progressBg: {
    flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 1, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#FFF', borderRadius: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  username: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  timeAgo: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  captionContainer: {
    position: 'absolute', bottom: 80, left: 16, right: 16,
    backgroundColor: 'rgba(0,0,0,0.4)', padding: 12, borderRadius: 12,
  },
  captionText: { color: '#FFF', fontSize: 15 },
  touchAreas: {
    ...StyleSheet.absoluteFillObject, flexDirection: 'row', top: 100,
  },
  touchLeft: { flex: 1 },
  touchRight: { flex: 2 },
});

export default StoryViewerScreen;
