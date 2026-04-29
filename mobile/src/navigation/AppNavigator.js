import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import SplashScreen from '../screens/SplashScreen';

// Main Screens
import HomeFeedScreen from '../screens/home/HomeFeedScreen';
import CreatePostScreen from '../screens/home/CreatePostScreen';
import PostDetailScreen from '../screens/home/PostDetailScreen';
import ExploreScreen from '../screens/explore/ExploreScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import FollowersScreen from '../screens/profile/FollowersScreen';
import FollowingScreen from '../screens/profile/FollowingScreen';
import ChatListScreen from '../screens/chat/ChatListScreen';
import ChatDetailScreen from '../screens/chat/ChatDetailScreen';
import NotificationScreen from '../screens/notifications/NotificationScreen';
import StoryViewerScreen from '../screens/stories/StoryViewerScreen';
import CreateStoryScreen from '../screens/stories/CreateStoryScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import PrivacyScreen from '../screens/settings/PrivacyScreen';
import SecurityScreen from '../screens/settings/SecurityScreen';
import NotificationSettingsScreen from '../screens/settings/NotificationSettingsScreen';
import HelpCenterScreen from '../screens/settings/HelpCenterScreen';
import AboutScreen from '../screens/settings/AboutScreen';
import InteractionListScreen from '../screens/settings/InteractionListScreen';
import ChangePasswordScreen from '../screens/settings/ChangePasswordScreen';
import HelpTopicDetailScreen from '../screens/settings/HelpTopicDetailScreen';
import SupportRequestScreen from '../screens/settings/SupportRequestScreen';
import LegalDocumentScreen from '../screens/settings/LegalDocumentScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="LegalDocument" component={LegalDocumentScreen} />
  </Stack.Navigator>
);

// Home Stack
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeFeed" component={HomeFeedScreen} />
    <Stack.Screen name="PostDetail" component={PostDetailScreen} />
    <Stack.Screen name="UserProfile" component={ProfileScreen} />
    <Stack.Screen name="Followers" component={FollowersScreen} />
    <Stack.Screen name="Following" component={FollowingScreen} />
    <Stack.Screen name="ChatList" component={ChatListScreen} />
    <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
    <Stack.Screen name="Notifications" component={NotificationScreen} />
    <Stack.Screen name="StoryViewer" component={StoryViewerScreen} options={{ animation: 'fade' }} />
    <Stack.Screen name="CreateStory" component={CreateStoryScreen} />
  </Stack.Navigator>
);

// Explore Stack
const ExploreStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ExploreMain" component={ExploreScreen} />
    <Stack.Screen name="PostDetail" component={PostDetailScreen} />
    <Stack.Screen name="UserProfile" component={ProfileScreen} />
    <Stack.Screen name="Followers" component={FollowersScreen} />
    <Stack.Screen name="Following" component={FollowingScreen} />
  </Stack.Navigator>
);

// Profile Stack
const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileMain" component={ProfileScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="PostDetail" component={PostDetailScreen} />
    <Stack.Screen name="Followers" component={FollowersScreen} />
    <Stack.Screen name="Following" component={FollowingScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="Privacy" component={PrivacyScreen} />
    <Stack.Screen name="Security" component={SecurityScreen} />
    <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
    <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
    <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
    <Stack.Screen name="HelpTopicDetail" component={HelpTopicDetailScreen} />
    <Stack.Screen name="SupportRequest" component={SupportRequestScreen} />
    <Stack.Screen name="About" component={AboutScreen} />
    <Stack.Screen name="LegalDocument" component={LegalDocumentScreen} />
    <Stack.Screen name="InteractionList" component={InteractionListScreen} />
    <Stack.Screen name="UserProfile" component={ProfileScreen} />
  </Stack.Navigator>
);

// Notification Stack
const NotificationStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="NotificationMain" component={NotificationScreen} />
    <Stack.Screen name="PostDetail" component={PostDetailScreen} />
    <Stack.Screen name="UserProfile" component={ProfileScreen} />
  </Stack.Navigator>
);

// Bottom Tab Navigator
const MainTabs = () => {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      tabBar={(props) => (
        <LinearGradient
          colors={['#FEDA75', '#FA7E1E', '#D62976', '#962FBF', '#4F5BD5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ paddingBottom: 8, paddingTop: 8 }}
        >
          <View style={{ flexDirection: 'row', height: 44 }}>
            {props.state.routes.map((route, index) => {
              const isFocused = props.state.index === index;
              let iconName;

              switch (route.name) {
                case 'Home':
                  iconName = isFocused ? 'home' : 'home-outline';
                  break;
                case 'Explore':
                  iconName = isFocused ? 'search' : 'search-outline';
                  break;
                case 'CreatePost':
                  iconName = 'add';
                  break;
                case 'Activity':
                  iconName = isFocused ? 'notifications' : 'notifications-outline';
                  break;
                case 'Profile':
                  iconName = isFocused ? 'person' : 'person-outline';
                  break;
              }

              return (
                <TouchableOpacity
                  key={route.name}
                  onPress={() => {
                    const event = props.navigation.emit({ type: 'tabPress', target: route.key });
                    if (!isFocused && !event.defaultPrevented) {
                      props.navigation.navigate(route.name);
                    }
                  }}
                  style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                >
                  {route.name === 'CreatePost' ? (
                    <View style={[styles.createButton, { backgroundColor: 'rgba(255,255,255,0.3)' }]}> 
                      <Ionicons name="add" size={26} color="#FFF" />
                    </View>
                  ) : (
                    <Ionicons
                      name={iconName}
                      size={isFocused ? 26 : 24}
                      color={isFocused ? '#FFFFFF' : 'rgba(255,255,255,0.6)'}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </LinearGradient>
      )}
      screenOptions={({ route }) => ({
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Explore" component={ExploreStack} />
      <Tab.Screen
        name="CreatePost"
        component={CreatePostScreen}
        options={{
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tab.Screen name="Activity" component={NotificationStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { isDark, colors } = useTheme();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer
      documentTitle={{
        formatter: (options, route) =>
          `${options?.title ?? route?.name} | Snaply`,
      }}
      theme={{
        dark: isDark,
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          notification: colors.primary,
        },
      }}
    >
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AppNavigator;
