import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator
} from 'react-native';
import { COLORS } from '../theme';
import { API_URL } from '../config';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

export default function LoginScreen({ navigate, setUser }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg('Please enter email and password');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch(`${API_URL}api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Successful login
        setUser(data.user);
        // data.access_token can be stored in AsyncStorage if needed
        navigate('DASHBOARD');
      } else {
        setErrorMsg(data.detail || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Connection error. Please check your backend.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field) => [
    styles.inputWrapper,
    focusedField === field && styles.inputFocused,
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigate('LANDING')} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.topSection}>
            <View style={styles.logoIcon}>
              <MaterialCommunityIcons name="pill" size={28} color={COLORS.white} />
            </View>
            <Text style={styles.title}>Welcome back</Text>
            <Text style={styles.subtitle}>Sign in to access your prescriptions and medical history.</Text>
          </View>

          <View style={styles.form}>
            {/* Email */}
            <View>
              <Text style={styles.label}>Email address</Text>
              <View style={inputStyle('email')}>
                <Feather name="mail" size={18} color={focusedField === 'email' ? COLORS.primary : COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={COLORS.textSecondary + '80'}
                  onChangeText={setEmail}
                  value={email}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Password */}
            <View>
              <Text style={styles.label}>Password</Text>
              <View style={inputStyle('password')}>
                <Feather name="lock" size={18} color={focusedField === 'password' ? COLORS.primary : COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Enter your password"
                  placeholderTextColor={COLORS.textSecondary + '80'}
                  secureTextEntry={!showPassword}
                  onChangeText={setPassword}
                  value={password}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                  <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {errorMsg && (
              <Text style={{ color: COLORS.dangerText, fontSize: 13, textAlign: 'center' }}>
                {errorMsg}
              </Text>
            )}

            <TouchableOpacity style={{ alignSelf: 'flex-end' }}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.primaryBtn, loading && { opacity: 0.7 }]} 
                onPress={handleLogin} 
                activeOpacity={0.85}
                disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Sign In</Text>}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google mock button */}
            <TouchableOpacity style={styles.googleBtn} onPress={handleLogin}>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleText}>Continue with Google</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigate('SIGNUP')}>
            <Text style={styles.footerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 20, paddingTop: 16 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  topSection: { alignItems: 'center', marginBottom: 40 },
  logoIcon: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  form: { gap: 18 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: COLORS.border,
    borderRadius: 12, paddingHorizontal: 14, height: 52,
  },
  inputFocused: { borderColor: COLORS.primary, backgroundColor: COLORS.successBg + '60' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: COLORS.textPrimary },
  forgotText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  primaryBtn: {
    backgroundColor: COLORS.primary, height: 52, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginTop: 4,
  },
  primaryBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { fontSize: 13, color: COLORS.textSecondary },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, height: 52, borderRadius: 12,
    borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white,
  },
  googleIcon: { fontSize: 18, fontWeight: '800', color: '#4285F4' },
  googleText: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  footer: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingBottom: 32,
  },
  footerText: { color: COLORS.textSecondary, fontSize: 15 },
  footerLink: { color: COLORS.primary, fontSize: 15, fontWeight: '700' },
});
