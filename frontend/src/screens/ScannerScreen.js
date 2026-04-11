import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Image,
  ActivityIndicator, Animated, Dimensions, Alert,
  LayoutAnimation, UIManager, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme';
import { API_URL, COUNTRIES } from '../config';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { height: SCREEN_H } = Dimensions.get('window');

// ─── Medicine Card (unchanged from your original) ──────────────────────────
const MedicineCard = ({ item, index, cardAnim }) => {
  const [expanded, setExpanded] = useState(false);
  const [showSimple, setShowSimple] = useState(true);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const exp = item.explanation || {};

  return (
    <Animated.View style={[
      styles.medCard,
      {
        opacity: cardAnim,
        transform: [{ translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
      },
    ]}>
      <TouchableOpacity style={styles.medHeader} onPress={toggle} activeOpacity={0.7}>
        <View style={styles.medHeaderLeft}>
          <View style={styles.medIndex}>
            <Text style={styles.medIndexText}>{index + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.medName}>{item.medicine}</Text>
            <Text style={styles.medBrief}>{item.dosage || '—'} · {item.frequency || '—'}</Text>
          </View>
        </View>
        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.medBody}>
          {/* Simple / Medical toggle */}
          <View style={styles.langToggle}>
            <TouchableOpacity
              style={[styles.langBtn, showSimple && styles.langBtnActive]}
              onPress={() => setShowSimple(true)}
            >
              <Text style={[styles.langBtnText, showSimple && styles.langBtnTextActive]}>Simple</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langBtn, !showSimple && styles.langBtnActive]}
              onPress={() => setShowSimple(false)}
            >
              <Text style={[styles.langBtnText, !showSimple && styles.langBtnTextActive]}>Medical</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>WHAT IT DOES</Text>
          <Text style={styles.medDesc}>
            {showSimple ? exp.what_it_does : exp.simple_summary}
          </Text>

          {/* Generic name + class */}
          {exp.generic_name && (
            <Text style={styles.genericText}>Generic: {exp.generic_name} · {exp.medicine_class || ''}</Text>
          )}

          {/* Dosage / Frequency / Duration grid */}
          <View style={styles.detailGrid}>
            {[
              { label: 'DOSAGE', value: item.dosage },
              { label: 'FREQUENCY', value: item.frequency },
              { label: 'DURATION', value: item.duration },
            ].map((d, i) => (
              <View key={i} style={[styles.detailBox, i < 2 && styles.detailBoxBorder]}>
                <Text style={styles.detailLabel}>{d.label}</Text>
                <Text style={styles.detailValue}>{d.value || '—'}</Text>
              </View>
            ))}
          </View>

          {/* How to take */}
          {exp.how_to_take && (
            <>
              <Text style={styles.sectionLabel}>HOW TO TAKE</Text>
              <Text style={styles.medDesc}>{exp.how_to_take}</Text>
            </>
          )}

          {/* Side effects */}
          {(exp.common_side_effects || []).length > 0 && (
            <>
              <View style={styles.badgeHeader}>
                <Ionicons name="warning-outline" size={14} color={COLORS.dangerText} />
                <Text style={styles.badgeHeaderText}>SIDE EFFECTS</Text>
              </View>
              <View style={styles.badgeRow}>
                {exp.common_side_effects.map((e, i) => (
                  <View key={i} style={styles.dangerBadge}>
                    <Text style={styles.dangerBadgeText}>{e}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Warning */}
          {exp.important_warning && (
            <View style={styles.warningBanner}>
              <Ionicons name="warning" size={16} color={COLORS.dangerText} />
              <Text style={styles.warningText}>{exp.important_warning}</Text>
            </View>
          )}

          {/* Price */}
          {exp.approximate_price && (
            <Text style={styles.priceText}>💰 Approx: {exp.approximate_price}</Text>
          )}

          {/* Alternatives */}
          {(exp.alternatives || []).length > 0 && (
            <>
              <View style={[styles.badgeHeader, { marginTop: 16 }]}>
                <MaterialCommunityIcons name="swap-horizontal" size={16} color={COLORS.primary} />
                <Text style={[styles.badgeHeaderText, { color: COLORS.primary }]}>ALTERNATIVES</Text>
              </View>
              {exp.alternatives.map((alt, i) => (
                <View key={i} style={styles.subCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.subName}>{alt.name}</Text>
                    <Text style={styles.subType}>{alt.type}</Text>
                  </View>
                  {alt.approximate_price ? (
                    <Text style={styles.altPrice}>{alt.approximate_price}</Text>
                  ) : null}
                </View>
              ))}
            </>
          )}
        </View>
      )}
    </Animated.View>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────────────
export default function ScannerScreen({ navigate, user, route }) {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);

  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef([]);

  useEffect(() => {
    if (route?.params?.analysisResult) {
      setResult(route.params.analysisResult);
      animateCards(route.params.analysisResult.results?.length || 0);
    }
  }, [route?.params?.analysisResult]);

  const startScanLine = () => {
    scanLineAnim.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(scanLineAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  };

  const animateCards = (count) => {
    cardAnims.current = Array.from({ length: count }, () => new Animated.Value(0));
    Animated.stagger(
      120,
      cardAnims.current.map(a =>
        Animated.spring(a, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 })
      )
    ).start();
  };

  const analyzeImage = async (uri) => {
    setLoading(true);
    setError(null);
    startScanLine();

    try {
      const formData = new FormData();

      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append('file', blob, 'prescription.jpg');
      } else {
        formData.append('file', {
          uri,
          name: 'prescription.jpg',
          type: 'image/jpeg',
        });
      }

      formData.append('country', selectedCountry.value);
      formData.append('currency', selectedCountry.currency);
      if (user?.id) {
        formData.append('user_id', user.id);
      }

      const response = await fetch(`${API_URL}analyze-prescription`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.status === 'error') {
        throw new Error(data.message || 'Analysis failed');
      }

      scanLineAnim.stopAnimation();
      navigate('CONFIRM_MEDICINES', {
        imageUri: uri,
        medicineHighlights: data.medicine_highlights,
        ocrWords: data.ocr_words,
        rawResult: data,
        country: selectedCountry.value,
        currency: selectedCountry.currency,
        userId: user?.id,
        image_url: data.image_url,
      });

    } catch (err) {
      scanLineAnim.stopAnimation();
      console.error(err);
      setError('Could not analyze prescription. Please ensure the image is clear and try again.');
    } finally {
      setLoading(false);
    }
  };

  const pickCamera = async () => {
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!res.canceled) {
      setImage(res.assets[0].uri);
      analyzeImage(res.assets[0].uri);
    }
  };

  const pickGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
    });
    if (!res.canceled) {
      setImage(res.assets[0].uri);
      analyzeImage(res.assets[0].uri);
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setError(null);
  };

  const scanLineY = scanLineAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 300] });

  // ── Upload screen ──────────────────────────────────────────────────────
  if (!loading && !result) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.uploadContent}>
          <View style={styles.uploadHero}>
            <View style={styles.uploadIconRing}>
              <View style={styles.uploadIconInner}>
                <Feather name="file-text" size={48} color={COLORS.primary} />
              </View>
            </View>
            <Text style={styles.uploadTitle}>Scan Prescription</Text>
            <Text style={styles.uploadSub}>
              Upload any handwritten or printed prescription. Our AI will decode and explain every medicine.
            </Text>
            <View style={styles.featureRow}>
              {[
                { icon: 'zap', label: 'AI-powered OCR' },
                { icon: 'shield', label: 'Drug interaction check' },
                { icon: 'dollar-sign', label: 'Local alternatives' },
              ].map((f, i) => (
                <View key={i} style={styles.featureChip}>
                  <Feather name={f.icon} size={13} color={COLORS.primary} />
                  <Text style={styles.featureChipText}>{f.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Country Selector ── */}
          <View style={styles.countryCard}>
            <Text style={styles.countryLabel}>🌍 Your Country</Text>
            <Picker
              selectedValue={selectedCountry.value}
              onValueChange={(val) => {
                const found = COUNTRIES.find(c => c.value === val);
                setSelectedCountry(found);
              }}
              style={styles.picker}
            >
              {COUNTRIES.map(c => (
                <Picker.Item key={c.value} label={c.label} value={c.value} />
              ))}
            </Picker>
            <Text style={styles.currencyHint}>
              Prices and alternatives will be shown in {selectedCountry.currency}
            </Text>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={pickCamera} activeOpacity={0.85}>
            <Feather name="camera" size={20} color={COLORS.white} />
            <Text style={styles.primaryBtnText}>Open Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={pickGallery} activeOpacity={0.85}>
            <Feather name="image" size={20} color={COLORS.primary} />
            <Text style={styles.secondaryBtnText}>Choose from Gallery</Text>
          </TouchableOpacity>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={COLORS.dangerText} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.disclaimer}>
            <Ionicons name="warning" size={15} color={COLORS.warningText} />
            <Text style={styles.disclaimerText}>
              For informational purposes only. Always consult your doctor before changing medication.
            </Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── Loading screen ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          {image && <Image source={{ uri: image }} style={styles.loadingImage} blurRadius={3} />}
          <View style={styles.loadingOverlay}>
            <View style={styles.scanFrame}>
              {['tl', 'tr', 'bl', 'br'].map(c => (
                <View key={c} style={[styles.corner, styles[c]]} />
              ))}
              <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineY }] }]} />
            </View>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingTitle}>Analyzing prescription...</Text>
              <Text style={styles.loadingSubText}>
                Reading text · Identifying medicines · Finding {selectedCountry.value} alternatives
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // ── Results screen ─────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        <View style={styles.resultHeader}>
          <Text style={styles.resultTitle}>Analysis Complete</Text>
          <TouchableOpacity onPress={reset} style={styles.rescanBtn}>
            <Feather name="refresh-cw" size={15} color={COLORS.primary} />
            <Text style={styles.rescanText}>Rescan</Text>
          </TouchableOpacity>
        </View>

        {/* Country + Confidence */}
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>🌍 {result.country} · 💱 {result.currency}</Text>
          <Text style={styles.metaText}>📊 Scan quality: {result.avg_confidence}%</Text>
        </View>

        {/* Medicines */}
        <View style={styles.medsSection}>
          <View style={styles.medsSectionHeader}>
            <MaterialCommunityIcons name="pill" size={20} color={COLORS.primary} />
            <Text style={styles.medsSectionTitle}>
              Prescribed Medicines ({result.results?.length || 0})
            </Text>
          </View>
          {(result.results || []).map((med, i) => (
            <MedicineCard
              key={i}
              item={med}
              index={i}
              cardAnim={cardAnims.current[i] || new Animated.Value(1)}
            />
          ))}
        </View>

        <View style={styles.disclaimer}>
          <Ionicons name="warning" size={15} color={COLORS.warningText} />
          <Text style={styles.disclaimerText}>
            For informational purposes only. Always consult your doctor before changing medication.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  uploadContent: { flexGrow: 1, padding: 24, paddingTop: 40 },
  uploadHero: { alignItems: 'center', marginBottom: 28 },
  uploadIconRing: {
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: COLORS.successBg, justifyContent: 'center', alignItems: 'center',
    marginBottom: 24, borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed',
  },
  uploadIconInner: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center',
  },
  uploadTitle: { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 10 },
  uploadSub: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 16 },
  featureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  featureChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.successBg, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.border,
  },
  featureChipText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  countryCard: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 14,
    marginBottom: 20, borderWidth: 1, borderColor: COLORS.border,
  },
  countryLabel: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 },
  picker: { height: 48 },
  currencyHint: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 14, marginBottom: 12,
  },
  primaryBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: COLORS.successBg, paddingVertical: 16, borderRadius: 14,
    borderWidth: 1.5, borderColor: COLORS.border, marginBottom: 20,
  },
  secondaryBtnText: { color: COLORS.primary, fontSize: 16, fontWeight: '700' },
  errorBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: COLORS.dangerBg, padding: 14, borderRadius: 12, marginBottom: 16,
    borderWidth: 1, borderColor: '#FECACA',
  },
  errorText: { flex: 1, fontSize: 14, color: COLORS.dangerText, lineHeight: 20 },
  disclaimer: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: COLORS.warningBg, padding: 14, borderRadius: 12,
  },
  disclaimerText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18 },
  loadingContainer: { flex: 1, backgroundColor: '#000' },
  loadingImage: { ...StyleSheet.absoluteFillObject, opacity: 0.35, resizeMode: 'cover' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', gap: 32 },
  scanFrame: { width: 260, height: 320, position: 'relative', justifyContent: 'flex-start', overflow: 'hidden' },
  corner: { position: 'absolute', width: 28, height: 28, borderColor: COLORS.primaryLight, borderWidth: 3 },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanLine: {
    position: 'absolute', left: 0, right: 0, height: 2,
    backgroundColor: COLORS.primaryLight,
  },
  loadingCard: {
    backgroundColor: 'rgba(255,255,255,0.95)', padding: 28, borderRadius: 20,
    alignItems: 'center', marginHorizontal: 40,
  },
  loadingTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginTop: 16, marginBottom: 8 },
  loadingSubText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  resultTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  rescanBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.successBg, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20,
  },
  rescanText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  metaRow: { marginBottom: 16, gap: 4 },
  metaText: { fontSize: 13, color: COLORS.textSecondary },
  medsSection: {
    backgroundColor: COLORS.white, borderRadius: 20, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  medsSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  medsSectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  medCard: { borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: 14, marginBottom: 10, overflow: 'hidden' },
  medHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, backgroundColor: COLORS.lightGray,
  },
  medHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  medIndex: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.successBg, justifyContent: 'center', alignItems: 'center',
  },
  medIndexText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  medName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  medBrief: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  medBody: { padding: 14, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.lightGray },
  langToggle: {
    flexDirection: 'row', backgroundColor: COLORS.lightGray,
    borderRadius: 10, padding: 3, marginBottom: 14, alignSelf: 'flex-start',
  },
  langBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  langBtnActive: { backgroundColor: COLORS.primary },
  langBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  langBtnTextActive: { color: COLORS.white },
  sectionLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, letterSpacing: 0.5, marginBottom: 6 },
  medDesc: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 21, marginBottom: 14 },
  genericText: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 12, fontStyle: 'italic' },
  detailGrid: {
    flexDirection: 'row', backgroundColor: COLORS.lightGray,
    borderRadius: 10, padding: 12, marginBottom: 14,
  },
  detailBox: { flex: 1, alignItems: 'center' },
  detailBoxBorder: { borderRightWidth: 1, borderRightColor: COLORS.border },
  detailLabel: { fontSize: 10, fontWeight: '600', color: COLORS.textSecondary, letterSpacing: 0.5, marginBottom: 4 },
  detailValue: { fontSize: 13, fontWeight: '700', color: COLORS.primary, textAlign: 'center' },
  badgeHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  badgeHeaderText: { fontSize: 11, fontWeight: '700', color: COLORS.dangerText, letterSpacing: 0.5 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dangerBadge: {
    backgroundColor: COLORS.dangerBg, paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, borderColor: '#FECACA',
  },
  dangerBadgeText: { color: COLORS.dangerText, fontSize: 12, fontWeight: '500' },
  warningBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: COLORS.dangerBg, padding: 12, borderRadius: 10,
    marginTop: 10, borderWidth: 1, borderColor: '#FECACA',
  },
  warningText: { flex: 1, fontSize: 13, color: COLORS.dangerText, lineHeight: 19 },
  priceText: { fontSize: 14, color: '#27ae60', fontWeight: '700', marginTop: 10 },
  subCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.successBg, padding: 12, borderRadius: 10, marginBottom: 8,
  },
  subName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  subType: { fontSize: 12, color: COLORS.textSecondary },
  altPrice: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
});
