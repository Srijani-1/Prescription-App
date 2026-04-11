import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator
} from 'react-native';
import { COLORS } from '../theme';
import { API_URL } from '../config';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

export default function SignupScreen({ navigate, setUser }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [agreed, setAgreed] = useState(false);
  
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Signup, 2: OTP
  const [userId, setUserId] = useState(null);
  
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setErrorMsg(null);
    if (!name || !email || !password || !confirmPassword) {
      setErrorMsg('Please fill all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (!agreed) {
      setErrorMsg('You must agree to the Terms of Service.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUserId(data.user_id);
        setStep(2);
      } else {
        setErrorMsg(data.detail || 'Signup failed');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Connection error. Please check your backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
        setErrorMsg('Please enter the 6-digit code');
        return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
        const response = await fetch(`${API_URL}api/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, otp }),
        });
        const data = await response.json();
        if (response.ok) {
            setUser(data.user);
            navigate('DASHBOARD');
        } else {
            setErrorMsg(data.detail || 'Invalid verification code');
        }
    } catch (err) {
        setErrorMsg('Verification failed. Try again.');
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => step === 2 ? setStep(1) : navigate('LANDING')} style={styles.backBtn}>
              <Feather name="arrow-left" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.topSection}>
              <View style={styles.logoIcon}>
                <MaterialCommunityIcons name="pill" size={28} color={COLORS.white} />
              </View>
              <Text style={styles.title}>{step === 1 ? 'Create account' : 'Verify Email'}</Text>
              <Text style={styles.subtitle}>
                  {step === 1 
                  ? 'Join 14,200+ users managing their health smarter.' 
                  : `We've sent a 6-digit code to ${email}`}
              </Text>
            </View>

            <View style={styles.form}>
              {step === 1 ? (
                <>
                  <View>
                    <Text style={styles.label}>Full name</Text>
                    <View style={inputStyle('name')}>
                      <Feather name="user" size={18} color={focusedField === 'name' ? COLORS.primary : COLORS.textSecondary} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Riya Sharma"
                        placeholderTextColor={COLORS.textSecondary + '80'}
                        onChangeText={setName}
                        value={name}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                      />
                    </View>
                  </View>

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

                  <View>
                    <Text style={styles.label}>Password</Text>
                    <View style={inputStyle('password')}>
                      <Feather name="lock" size={18} color={focusedField === 'password' ? COLORS.primary : COLORS.textSecondary} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="Minimum 8 characters"
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

                  <View>
                    <Text style={styles.label}>Confirm password</Text>
                    <View style={inputStyle('confirmPassword')}>
                      <Feather name="lock" size={18} color={focusedField === 'confirmPassword' ? COLORS.primary : COLORS.textSecondary} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { flex: 1 }]}
                        placeholder="Repeat password"
                        placeholderTextColor={COLORS.textSecondary + '80'}
                        secureTextEntry={!showPassword}
                        onChangeText={setConfirmPassword}
                        value={confirmPassword}
                        onFocus={() => setFocusedField('confirmPassword')}
                        onBlur={() => setFocusedField(null)}
                      />
                    </View>
                  </View>

                  <TouchableOpacity style={styles.termsRow} onPress={() => setAgreed(!agreed)} activeOpacity={0.7}>
                    <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                      {agreed && <Feather name="check" size={12} color={COLORS.white} />}
                    </View>
                    <Text style={styles.termsText}>
                      I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.primaryBtn, (!agreed || loading) && styles.primaryBtnDisabled]}
                    onPress={handleSignup}
                    activeOpacity={0.85}
                    disabled={loading}
                  >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Create Account</Text>}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View>
                    <Text style={styles.label}>Verification Code</Text>
                    <View style={inputStyle('otp')}>
                      <Feather name="shield" size={18} color={focusedField === 'otp' ? COLORS.primary : COLORS.textSecondary} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { letterSpacing: 8, fontSize: 20, fontWeight: 'bold' }]}
                        placeholder="000000"
                        placeholderTextColor={COLORS.textSecondary + '40'}
                        onChangeText={setOtp}
                        value={otp}
                        keyboardType="number-pad"
                        maxLength={6}
                        onFocus={() => setFocusedField('otp')}
                        onBlur={() => setFocusedField(null)}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                    onPress={handleVerifyOtp}
                    activeOpacity={0.85}
                    disabled={loading}
                  >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Verify & Finish</Text>}
                  </TouchableOpacity>

                  <TouchableOpacity style={{ alignItems: 'center' }} onPress={() => setStep(1)}>
                    <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Change Email</Text>
                  </TouchableOpacity>
                </>
              )}

              {errorMsg && (
                <Text style={{ color: COLORS.dangerText, fontSize: 14, textAlign: 'center', marginTop: 10 }}>
                  {errorMsg}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigate('LOGIN')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
  topSection: { alignItems: 'center', marginBottom: 36 },
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
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  checkbox: {
    width: 20, height: 20, borderRadius: 6, borderWidth: 2,
    borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center',
    marginTop: 2, flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  termsText: { flex: 1, fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  termsLink: { color: COLORS.primary, fontWeight: '600' },
  primaryBtn: {
    backgroundColor: COLORS.primary, height: 52, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginTop: 4,
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  footer: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: { color: COLORS.textSecondary, fontSize: 15 },
  footerLink: { color: COLORS.primary, fontSize: 15, fontWeight: '700' },
});
