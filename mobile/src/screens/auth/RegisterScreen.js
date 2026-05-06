import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, StatusBar,
  useWindowDimensions, Image, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const GRADIENT = ['#FEDA75', '#FA7E1E', '#D62976', '#962FBF', '#4F5BD5'];

const RegisterScreen = ({ navigation }) => {
  const { register, isLoading, clearError } = useAuth();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width > 768;
  const showHeroSection = Platform.OS === 'web';
  const useWideLayout = showHeroSection && isWide;

  const [form, setForm] = useState({
    fullName: '', username: '', email: '', password: '', confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  // Animation values
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const anim3 = useRef(new Animated.Value(0)).current;

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
    createFloatingAnim(anim2, 600).start();
    createFloatingAnim(anim3, 1200).start();
  }, []);

  const getInterpolatedStyle = (val, range = [-8, 8]) => ({
    transform: [{
      translateY: val.interpolate({
        inputRange: [0, 1],
        outputRange: range,
      })
    }]
  });

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setLocalError('');
  };

  const handleRegister = async () => {
    setLocalError('');
    clearError();
    if (!form.fullName.trim()) return setLocalError('Full name is required');
    if (!form.username.trim()) return setLocalError('Username is required');
    if (form.username.length < 3) return setLocalError('Username must be at least 3 characters');
    if (!/^[a-zA-Z0-9._]+$/.test(form.username)) return setLocalError('Username can only have letters, numbers, dots, underscores');
    if (!form.email.trim()) return setLocalError('Email is required');
    if (!form.password) return setLocalError('Password is required');
    if (form.password.length < 6) return setLocalError('Password must be at least 6 characters');
    if (!form.confirmPassword) return setLocalError('Confirm password is required');
    if (form.password !== form.confirmPassword) return setLocalError('Passwords do not match');

    const result = await register({
      fullName: form.fullName.trim(),
      username: form.username.trim().toLowerCase(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
    });
    if (!result.success) setLocalError(result.message);
  };

  const openLegal = (doc) => {
    navigation.navigate('LegalDocument', { doc });
  };

  const renderInput = (icon, placeholder, field, options = {}) => (
    <View style={styles.inputContainer}>
      <Ionicons name={icon} size={16} color="#555" style={{ marginRight: 10 }} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#555"
        value={form[field]}
        onChangeText={(v) => updateField(field, v)}
        autoCapitalize={options.autoCapitalize || 'none'}
        autoCorrect={false}
        secureTextEntry={options.secure && !showPassword}
        keyboardType={options.keyboardType || 'default'}
      />
      {options.secure && (
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
          <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={16} color="#555" />
        </TouchableOpacity>
      )}
    </View>
  );

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
            <Text style={styles.mobileSubtitle}>Sign up to share your moments.</Text>

            {localError ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={14} color="#FF4757" />
                <Text style={styles.errorText}>{localError}</Text>
              </View>
            ) : null}

            {renderInput('person-outline', 'Full Name', 'fullName', { autoCapitalize: 'words' })}
            {renderInput('at-outline', 'Username', 'username')}
            {renderInput('mail-outline', 'Mobile number or email', 'email', { keyboardType: 'email-address' })}
            {renderInput('lock-closed-outline', 'Password', 'password', { secure: true })}
            {renderInput('shield-checkmark-outline', 'Confirm Password', 'confirmPassword', { secure: true })}

            <Text style={styles.mobileTermsText}>
              By signing up, you agree to our{' '}
              <Text style={styles.legalLinkText} onPress={() => openLegal('terms')}>Terms</Text>,{' '}
              <Text style={styles.legalLinkText} onPress={() => openLegal('privacy')}>Privacy Policy</Text> and{' '}
              <Text style={styles.legalLinkText} onPress={() => openLegal('licenses')}>Cookies Policy</Text>.
            </Text>

            <TouchableOpacity onPress={handleRegister} disabled={isLoading} activeOpacity={0.8}>
              <LinearGradient colors={GRADIENT} style={styles.registerButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.registerButtonText}>Create Account</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.mobileBottomLink}>
            <Text style={styles.mobileBottomLinkText}>
              Have an account? <Text style={{ color: '#D62976', fontWeight: '700' }}>Log In</Text>
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
            {/* Back + Logo */}


            <Text style={styles.heroTitle}>
              Share your moments with
            </Text>
            <Text style={styles.heroGradientText}>
              <Text style={{ color: '#FA7E1E' }}>the </Text>
              <Text style={{ color: '#D62976' }}>world</Text>
              <Text style={{ color: '#962FBF' }}>.</Text>
            </Text>

            {/* Hero Image */}
            <View style={styles.heroImageContainer}>
              <Image
                source={require('../../assets/download.jpg')}
                style={styles.heroImage}
                resizeMode="cover"
              />
              <Animated.View style={[styles.floatingBadge, { top: -8, right: 20, backgroundColor: '#1A1A2E' }, getInterpolatedStyle(anim1)]}>
                <Ionicons name="add-circle" size={24} color="#D62976" />
              </Animated.View>
              <Animated.View style={[styles.floatingBadge, { bottom: 20, right: -5, backgroundColor: '#1A1A2E' }, getInterpolatedStyle(anim2)]}>
                <Ionicons name="sparkles" size={24} color="#FEDA75" />
              </Animated.View>
              <Animated.View style={[styles.floatingBadge, { bottom: -5, left: 30, backgroundColor: '#1A1A2E' }, getInterpolatedStyle(anim3)]}>
                <Ionicons name="people" size={24} color="#4F5BD5" />
              </Animated.View>
            </View>
          </View>}

          {/* ============ RIGHT SIDE - Form ============ */}
          <View style={[styles.formSide, useWideLayout && styles.formSideWide]}>
            {useWideLayout && <View style={styles.verticalDivider} />}

            <View style={[styles.formContainer, useWideLayout && styles.formContainerWide]}>
              <Text style={styles.formTitle}>Create your account</Text>
              <Text style={styles.formSubtitle}>
                Join <Text style={{ color: '#D62976', fontWeight: '700' }}>Snaply</Text> community
              </Text>

              {/* Error */}
              {localError ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={14} color="#FF4757" />
                  <Text style={styles.errorText}>{localError}</Text>
                </View>
              ) : null}

              {renderInput('person-outline', 'Full Name', 'fullName', { autoCapitalize: 'words' })}
              {renderInput('at-outline', 'Username', 'username')}
              {renderInput('mail-outline', 'Email address', 'email', { keyboardType: 'email-address' })}
              {renderInput('lock-closed-outline', 'Password', 'password', { secure: true })}
              {renderInput('shield-checkmark-outline', 'Confirm Password', 'confirmPassword', { secure: true })}

              {/* Register Button */}
              <TouchableOpacity onPress={handleRegister} disabled={isLoading} activeOpacity={0.8}>
                <LinearGradient colors={GRADIENT} style={styles.registerButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  {isLoading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.registerButtonText}>Create Account</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Terms */}
              <Text style={styles.termsText}>
                By signing up, you agree to our{' '}
                <Text style={styles.legalLinkText} onPress={() => openLegal('terms')}>Terms</Text>,{' '}
                <Text style={styles.legalLinkText} onPress={() => openLegal('privacy')}>Privacy Policy</Text> and{' '}
                <Text style={styles.legalLinkText} onPress={() => openLegal('licenses')}>Cookies Policy</Text>.
              </Text>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Login link */}
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.loginLink}>
                <Text style={styles.loginLinkText}>
                  Already have an account?{' '}
                  <Text style={{ color: '#D62976', fontWeight: '700' }}>Log In</Text>
                </Text>
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
    marginBottom: 22,
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
  mobileSubtitle: {
    color: '#A0A0B0',
    textAlign: 'center',
    marginBottom: 14,
    fontSize: 14,
    lineHeight: 20,
  },
  mobileTermsText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 10,
    lineHeight: 18,
  },
  legalLinkText: {
    color: '#4F5BD5',
  },
  mobileBottomLink: {
    marginTop: 12,
    alignItems: 'center',
  },
  mobileBottomLinkText: {
    color: '#666',
    fontSize: 14,
  },
  scrollContent: { flexGrow: 1 },
  scrollContentWide: { justifyContent: 'center' },
  mainLayout: { flex: 1, padding: 24, paddingTop: 50 },
  mainLayoutWide: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 60, paddingTop: 24,
    maxWidth: 1000, alignSelf: 'center', width: '100%',
  },

  // Hero
  heroSide: { marginBottom: 28 },
  heroSideWide: { flex: 1, marginBottom: 0, paddingRight: 50 },
  backButton: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#1A1A2E',
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  logoIcon: { width: 48, height: 48, borderRadius: 14, padding: 2.5, marginBottom: 28 },
  logoInner: {
    flex: 1, backgroundColor: '#0A0A0F', borderRadius: 11.5,
    justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  logoDot: {
    position: 'absolute', top: 6, right: 8,
    width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#D62976',
  },
  logoCircle: { width: 16, height: 16, borderRadius: 8, borderWidth: 2.5, borderColor: '#FFF' },
  heroTitle: { fontSize: 34, fontWeight: '300', color: '#D0D0D0', lineHeight: 48 },
  heroGradientText: { fontSize: 34, fontWeight: '700', lineHeight: 48 },

  // Decor
  heroImageContainer: {
    marginTop: 28,
    position: 'relative',
    alignSelf: 'flex-start',
  },
  heroImage: {
    width: 300,
    height: 280,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#2A2A3E',
  },
  floatingBadge: {
    position: 'absolute', width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#2A2A3E',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },

  // Form
  formSide: {},
  formSideWide: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  verticalDivider: { width: 1, height: '80%', backgroundColor: '#1E1E2E', marginRight: 50 },
  formContainer: { flex: 1 },
  formContainerWide: { maxWidth: 440 },
  formTitle: { fontSize: 24, fontWeight: '700', color: '#FFF', marginBottom: 6 },
  formSubtitle: { fontSize: 16, color: '#666', marginBottom: 24 },

  errorContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,71,87,0.1)', padding: 14, borderRadius: 10, marginBottom: 14,
  },
  errorText: { color: '#FF4757', marginLeft: 10, fontSize: 14, flex: 1 },

  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1A1A2E', borderRadius: 8,
    borderWidth: 1, borderColor: '#2A2A3E',
    marginBottom: 12, height: 52, paddingHorizontal: 16,
  },
  input: { flex: 1, fontSize: 15, color: '#FFF', height: '100%', outlineStyle: 'none' },

  registerButton: {
    height: 54, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 6,
  },
  registerButtonText: { color: '#FFF', fontSize: 17, fontWeight: '700' },

  termsText: { color: '#444', fontSize: 13, textAlign: 'center', marginTop: 16, lineHeight: 20 },

  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#1E1E2E' },
  dividerText: { marginHorizontal: 16, fontSize: 13, fontWeight: '600', color: '#444' },

  loginLink: { alignItems: 'center' },
  loginLinkText: { color: '#666', fontSize: 15 },
});

export default RegisterScreen;
