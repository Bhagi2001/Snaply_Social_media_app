import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, StatusBar,
  Dimensions, useWindowDimensions, Image, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const GRADIENT = ['#FEDA75', '#FA7E1E', '#D62976', '#962FBF', '#4F5BD5'];

const LoginScreen = ({ navigation }) => {
  const { login, isLoading, error, clearError } = useAuth();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width > 768;
  const showHeroSection = Platform.OS === 'web';
  const useWideLayout = showHeroSection && isWide;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  // Animation values
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const anim3 = useRef(new Animated.Value(0)).current;
  const anim4 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createFloatingAnim = (val, delay = 0) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(val, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
            delay,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
    };

    createFloatingAnim(anim1, 0).start();
    createFloatingAnim(anim2, 500).start();
    createFloatingAnim(anim3, 1000).start();
    createFloatingAnim(anim4, 1500).start();
  }, []);

  const getInterpolatedStyle = (val, range = [-10, 10]) => ({
    transform: [{
      translateY: val.interpolate({
        inputRange: [0, 1],
        outputRange: range,
      })
    }]
  });

  const handleLogin = async () => {
    setLocalError('');
    clearError();
    if (!email.trim()) { setLocalError('Email is required'); return; }
    if (!password) { setLocalError('Password is required'); return; }
    const result = await login(email.trim().toLowerCase(), password);
    if (!result.success) setLocalError(result.message);
  };

  const displayError = localError || error;

  if (!showHeroSection) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <ScrollView contentContainerStyle={styles.mobileScrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.mobileBrandWrap}>
            <Image source={require('../../assets/logo.png')} style={styles.mobileLogo} resizeMode="contain" />
            <Text style={styles.mobileBrandTitle}>Snaply</Text>
          </View>

          <View style={styles.mobileCard}>
            <Text style={styles.mobileTitle}>Log into Snaply</Text>

            {displayError ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#FF4757" />
                <Text style={styles.errorText}>{displayError}</Text>
              </View>
            ) : null}

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Mobile number, username or email"
                placeholderTextColor="#555"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#555"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#555" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={handleLogin} disabled={isLoading} activeOpacity={0.8}>
              <LinearGradient
                colors={GRADIENT}
                style={styles.loginButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.loginButtonText}>Log in</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotButton}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.mobileBottomLink}>
            <Text style={styles.mobileBottomLinkText}>
              Don't have an account? <Text style={styles.createBtnText}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView contentContainerStyle={[styles.scrollContent, useWideLayout && styles.scrollContentWide]} keyboardShouldPersistTaps="handled">
        <View style={[styles.mainLayout, useWideLayout && styles.mainLayoutWide]}>

          {/* ============ LEFT SIDE - Hero ============ */}
          {showHeroSection && <View style={[styles.heroSide, useWideLayout && styles.heroSideWide]}>

            <Text style={styles.heroTitle}>
              See everyday moments{'\n'}from your
            </Text>
            <Text style={styles.heroGradientText}>
              <Text style={{ color: '#D62976' }}>close </Text>
              <Text style={{ color: '#FA7E1E' }}>friends</Text>
              <Text style={{ color: '#FEDA75' }}>.</Text>
            </Text>

            {/* Hero Image */}
            <View style={styles.heroImageContainer}>
              <Image
                source={require('../../assets/download.jpg')}
                style={styles.heroImage}
                resizeMode="cover"
              />
              {/* Floating badges over image */}
              <Animated.View style={[styles.floatingBadge, { top: -8, right: 30, backgroundColor: '#1A1A2E' }, getInterpolatedStyle(anim1)]}>
                <Ionicons name="camera" size={24} color="#D62976" />
              </Animated.View>
              <Animated.View style={[styles.floatingBadge, { top: 40, right: -10, backgroundColor: '#1A1A2E' }, getInterpolatedStyle(anim2)]}>
                <Ionicons name="heart" size={24} color="#FF4757" />
              </Animated.View>
              <Animated.View style={[styles.floatingBadge, { bottom: 30, right: 5, backgroundColor: '#1A1A2E' }, getInterpolatedStyle(anim3)]}>
                <Ionicons name="chatbubble" size={24} color="#4F5BD5" />
              </Animated.View>
              <Animated.View style={[styles.floatingBadge, { bottom: -5, left: 40, backgroundColor: '#1A1A2E' }, getInterpolatedStyle(anim4)]}>
                <Ionicons name="paper-plane" size={24} color="#FA7E1E" />
              </Animated.View>
            </View>
          </View>}

          {/* ============ RIGHT SIDE - Form ============ */}
          <View style={[styles.formSide, useWideLayout && styles.formSideWide]}>
            {/* Vertical divider on wide screens */}
            {useWideLayout && <View style={styles.verticalDivider} />}

            <View style={[styles.formContainer, useWideLayout && styles.formContainerWide]}>
              <Text style={styles.formTitle}>Log into Snaply</Text>

              {/* Error */}
              {displayError ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={16} color="#FF4757" />
                  <Text style={styles.errorText}>{displayError}</Text>
                </View>
              ) : null}

              {/* Email */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Mobile number, username or email"
                  placeholderTextColor="#555"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Password */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#555"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#555" />
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <TouchableOpacity onPress={handleLogin} disabled={isLoading} activeOpacity={0.8}>
                <LinearGradient
                  colors={GRADIENT}
                  style={styles.loginButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.loginButtonText}>Log in</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Forgot Password */}
              <TouchableOpacity style={styles.forgotButton}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Create Account */}
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <LinearGradient
                  colors={GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.createBtnBorder}
                >
                  <View style={styles.createBtnInner}>
                    <Text style={styles.createBtnText}>Create new account</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  mobileScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  mobileBrandWrap: {
    alignItems: 'center',
    marginBottom: 26,
  },
  mobileLogo: {
    width: 92,
    height: 92,
  },
  mobileBrandTitle: {
    marginTop: 8,
    color: '#FFF',
    fontSize: 44,
    fontWeight: '700',
    lineHeight: 50,
  },
  mobileCard: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    backgroundColor: '#1A1A2E',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A2A3E',
    padding: 16,
  },
  mobileTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 18,
    textAlign: 'center',
  },
  mobileBottomLink: {
    marginTop: 14,
    alignItems: 'center',
  },
  mobileBottomLinkText: {
    color: '#A0A0B0',
    fontSize: 14,
  },
  scrollContent: { flexGrow: 1 },
  scrollContentWide: { justifyContent: 'center' },
  mainLayout: { flex: 1, padding: 24, paddingTop: 60 },
  mainLayoutWide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 60,
    paddingTop: 24,
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
  },

  // Hero Side
  heroSide: { marginBottom: 36 },
  heroSideWide: { flex: 1, marginBottom: 0, paddingRight: 50 },
  logoIcon: { width: 56, height: 56, borderRadius: 16, padding: 3, marginBottom: 32 },
  logoInner: {
    flex: 1, backgroundColor: '#0A0A0F', borderRadius: 13,
    justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  logoDot: {
    position: 'absolute', top: 8, right: 10,
    width: 6, height: 6, borderRadius: 3, backgroundColor: '#D62976',
  },
  logoCircle: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 3, borderColor: '#FFF',
  },
  heroTitle: { fontSize: 36, fontWeight: '300', color: '#D0D0D0', lineHeight: 50 },
  heroGradientText: { fontSize: 36, fontWeight: '700', lineHeight: 50 },

  // Hero Image
  heroImageContainer: {
    marginTop: 36,
    position: 'relative',
    alignSelf: 'flex-start',
  },
  heroImage: {
    width: 320,
    height: 300,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#2A2A3E',
  },
  floatingBadge: {
    position: 'absolute', width: 48, height: 48, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#2A2A3E',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },

  // Form Side
  formSide: {},
  formSideWide: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  verticalDivider: {
    width: 1, height: '80%', backgroundColor: '#1E1E2E', marginRight: 50,
  },
  formContainer: { flex: 1 },
  formContainerWide: { maxWidth: 440 },
  formTitle: { fontSize: 24, fontWeight: '700', color: '#FFF', marginBottom: 28 },

  errorContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,71,87,0.1)', padding: 14, borderRadius: 10, marginBottom: 16,
  },
  errorText: { color: '#FF4757', marginLeft: 10, fontSize: 15, flex: 1 },

  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1A1A2E', borderRadius: 8,
    borderWidth: 1, borderColor: '#2A2A3E',
    marginBottom: 14, height: 54, paddingHorizontal: 16,
  },
  input: { flex: 1, fontSize: 16, color: '#FFF', height: '100%', outlineStyle: 'none' },
  eyeButton: { padding: 6 },

  loginButton: {
    height: 54, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 8,
  },
  loginButtonText: { color: '#FFF', fontSize: 17, fontWeight: '700' },

  forgotButton: { alignItems: 'center', marginTop: 20 },
  forgotText: { color: '#A0A0B0', fontSize: 15, fontWeight: '500' },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#1E1E2E' },
  dividerText: { marginHorizontal: 16, fontSize: 14, fontWeight: '600', color: '#555' },

  createBtnBorder: { padding: 2, borderRadius: 8 },
  createBtnInner: {
    backgroundColor: '#0A0A0F', borderRadius: 6, height: 50,
    justifyContent: 'center', alignItems: 'center',
  },
  createBtnText: { color: '#D62976', fontSize: 16, fontWeight: '600' },
});

export default LoginScreen;
