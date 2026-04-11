import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  SafeAreaView, Animated, StatusBar, Dimensions,
} from 'react-native';
import { COLORS } from '../theme';
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const FEATURES = [
  { icon: 'camera-outline', lib: 'Ionicons', label: 'AI Prescription Scan', sub: 'Handwriting decoded instantly' },
  { icon: 'swap-horizontal', lib: 'MaterialCommunityIcons', label: 'Cheaper Substitutes', sub: 'Save up to 60% on medicines' },
  { icon: 'warning-outline', lib: 'Ionicons', label: 'Drug Interaction Alert', sub: 'Stay safe from dangerous combos' },
];

export default function LandingScreen({ navigate }) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    // Fade in content
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();

    // Float illustration
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -14, duration: 2000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Background blob decoration */}
      <View style={styles.blobTop} />
      <View style={styles.blobBottom} />

      {/* Logo */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <MaterialCommunityIcons name="pill" size={22} color={COLORS.white} />
          </View>
          <Text style={styles.logoText}>PrescribePal</Text>
        </View>
        <View style={styles.tagBadge}>
          <Text style={styles.tagText}>Free · No ads</Text>
        </View>
      </View>

      {/* Hero illustration */}
      <Animated.View style={[styles.heroArea, { transform: [{ translateY: floatAnim }] }]}>
        <View style={styles.illustrationRing}>
          <View style={styles.illustrationInner}>
            <MaterialCommunityIcons name="file-document-edit-outline" size={64} color={COLORS.primary} />
          </View>
          {/* Orbiting badges */}
          <View style={[styles.orbitBadge, styles.orbitBadge1]}>
            <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
          </View>
          <View style={[styles.orbitBadge, styles.orbitBadge2]}>
            <MaterialCommunityIcons name="pill" size={20} color={COLORS.accent} />
          </View>
          <View style={[styles.orbitBadge, styles.orbitBadge3]}>
            <Feather name="shield" size={18} color={COLORS.primary} />
          </View>
        </View>
      </Animated.View>

      {/* Content */}
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.headline}>Prescriptions,{'\n'}finally explained.</Text>
          <Text style={styles.subheadline}>
            Scan any handwritten prescription. Get plain-English explanations, cheaper alternatives, and safety warnings.
          </Text>

          {/* Feature rows */}
          <View style={styles.featuresGrid}>
            {FEATURES.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <View style={styles.featureIconBox}>
                  {f.lib === 'Ionicons'
                    ? <Ionicons name={f.icon} size={18} color={COLORS.primary} />
                    : <MaterialCommunityIcons name={f.icon} size={18} color={COLORS.primary} />
                  }
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureLabel}>{f.label}</Text>
                  <Text style={styles.featureSub}>{f.sub}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Social proof */}
          <View style={styles.socialProof}>
            <View style={styles.avatarRow}>
              {['A', 'R', 'S', 'M'].map((l, i) => (
                <View key={i} style={[styles.avatar, { marginLeft: i === 0 ? 0 : -10, zIndex: 4 - i }]}>
                  <Text style={styles.avatarText}>{l}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.socialText}>
              <Text style={styles.socialBold}>14,200+</Text> prescriptions analyzed
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Footer CTAs */}
      <View style={styles.footerContainer}>
        <View style={styles.footer}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigate('ONBOARDING')} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Get Started — It's Free</Text>
            <Feather name="arrow-right" size={18} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigate('LOGIN')}>
            <Text style={styles.secondaryBtnText}>I already have an account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  blobTop: {
    position: 'absolute', top: -60, right: -60,
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: COLORS.successBg, opacity: 0.6,
  },
  blobBottom: {
    position: 'absolute', bottom: 120, left: -80,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: COLORS.accentBg, opacity: 0.4,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 16,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
  },
  logoText: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
  tagBadge: {
    backgroundColor: COLORS.successBg, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.border,
  },
  tagText: { fontSize: 12, fontWeight: '600', color: COLORS.primaryDark },
  heroArea: { alignItems: 'center', paddingVertical: 28 },
  illustrationRing: {
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: COLORS.successBg, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: COLORS.border,
  },
  illustrationInner: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6,
  },
  orbitBadge: {
    position: 'absolute', width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  orbitBadge1: { top: 8, right: 8 },
  orbitBadge2: { bottom: 8, right: 16 },
  orbitBadge3: { top: 16, left: 0 },
  content: { paddingHorizontal: 24 },
  headline: { fontSize: 32, fontWeight: '800', color: COLORS.textPrimary, lineHeight: 40, marginBottom: 12 },
  subheadline: { fontSize: 15, color: COLORS.textSecondary, lineHeight: 23, marginBottom: 24 },
  featuresGrid: { gap: 10, marginBottom: 24 },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: COLORS.white, padding: 14, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  featureIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.successBg, justifyContent: 'center', alignItems: 'center',
  },
  featureLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  featureSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  socialProof: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarRow: { flexDirection: 'row' },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: COLORS.white,
  },
  avatarText: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
  socialText: { fontSize: 13, color: COLORS.textSecondary },
  socialBold: { fontWeight: '700', color: COLORS.textPrimary },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background,
  },
  footer: { paddingHorizontal: 24, paddingBottom: 32, paddingTop: 16, gap: 12 },
  primaryBtn: {
    backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 14,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
  },
  primaryBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  secondaryBtn: { alignItems: 'center', paddingVertical: 12 },
  secondaryBtnText: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '600' },
});
