import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ScrollView, SafeAreaView, ActivityIndicator, StatusBar, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '../theme';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { API_URL, COUNTRIES } from '../config';

const SEVERITY_CONFIG = {
    safe: {
        label: 'Safe Combination',
        sub: 'These medicines are safe to take together',
        icon: 'shield-check',
        colors: ['#059669', '#10B981'],
        textColor: '#065F46',
        bg: '#ECFDF5',
        border: '#6EE7B7',
        barColor: '#10B981',
        barPct: 15,
    },
    mild: {
        label: 'Mild Interaction',
        sub: 'Use with caution — monitor for symptoms',
        icon: 'alert-circle-outline',
        colors: ['#D97706', '#F59E0B'],
        textColor: '#92400E',
        bg: '#FFFBEB',
        border: '#FCD34D',
        barColor: '#F59E0B',
        barPct: 55,
    },
    dangerous: {
        label: 'Dangerous Interaction',
        sub: 'Consult your doctor immediately',
        icon: 'alert-octagon',
        colors: ['#DC2626', '#EF4444'],
        textColor: '#991B1B',
        bg: '#FEF2F2',
        border: '#FCA5A5',
        barColor: '#EF4444',
        barPct: 95,
    },
};

export default function DrugInteractionScreen() {
    const [drug1, setDrug1] = useState('');
    const [drug2, setDrug2] = useState('');
    const [focusedField, setFocusedField] = useState(null);
    const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
    const [showCountryPicker, setShowCountryPicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const checkInteraction = async () => {
        if (!drug1.trim() || !drug2.trim()) return;
        setLoading(true); setResult(null); setError(null);
        try {
            const response = await fetch(`${API_URL}drug-interaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ drug1: drug1.trim(), drug2: drug2.trim(), country: selectedCountry.value }),
            });
            const data = await response.json();
            if (data.status !== 'success') throw new Error(data.detail || 'Server error');
            setResult(data.result);
        } catch (e) {
            setError('Could not check interaction. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const sev = result ? SEVERITY_CONFIG[result.severity] || SEVERITY_CONFIG.safe : null;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header Area */}
            <View style={styles.headerContainer}>
                <LinearGradient 
                    colors={['#0D9488', '#0891B2']} 
                    style={styles.header}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                    <View style={styles.headerTop}>
                        <View style={{ width: 32 }} />
                        <View style={styles.headerTitleCenter}>
                            <Text style={styles.headerTitle}>Drug Check</Text>
                            <Text style={styles.headerSub}>Check safety of medicine pairs</Text>
                        </View>
                        <View style={{ width: 32 }} />
                    </View>
                </LinearGradient>
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                {!result && !error && (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="shield-search" size={48} color="#10B981" />
                        <Text style={styles.emptyTitle}>Enter two medicines below</Text>
                        <Text style={styles.emptyText}>We'll instantly check if they're safe to take together using medical databases</Text>
                    </View>
                )}
                {/* Input Card */}
                <View style={styles.inputCard}>

                    {/* Country */}
                    <TouchableOpacity
                        style={styles.countryBtn}
                        onPress={() => setShowCountryPicker(!showCountryPicker)}
                    >
                        <MaterialCommunityIcons name="earth" size={16} color={COLORS.primary} />
                        <Text style={styles.countryBtnText}>{selectedCountry.label}</Text>
                        <Feather name={showCountryPicker ? 'chevron-up' : 'chevron-down'} size={14} color={COLORS.textSecondary} />
                    </TouchableOpacity>

                    {showCountryPicker && (
                        <View style={styles.countryDropdown}>
                            {COUNTRIES.map(c => (
                                <TouchableOpacity
                                    key={c.value}
                                    style={[styles.countryOption, selectedCountry.value === c.value && styles.countryOptionActive]}
                                    onPress={() => { setSelectedCountry(c); setShowCountryPicker(false); }}
                                >
                                    <Text style={[styles.countryOptionText, selectedCountry.value === c.value && { color: COLORS.primary, fontWeight: '700' }]}>
                                        {c.label}
                                    </Text>
                                    {selectedCountry.value === c.value && <Feather name="check" size={14} color={COLORS.primary} />}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <View style={styles.drugsContainer}>
                        {/* Drug 1 */}
                        <View style={[styles.drugInput, focusedField === 'drug1' && styles.drugInputFocused]}>
                            <LinearGradient colors={['#0D9488', '#0891B2']} style={styles.drugPillIcon}>
                                <MaterialCommunityIcons name="pill" size={14} color="#fff" />
                            </LinearGradient>
                            <TextInput
                                style={styles.drugTextInput}
                                placeholder="First medicine"
                                placeholderTextColor={COLORS.textMuted}
                                value={drug1}
                                onChangeText={setDrug1}
                                onFocus={() => setFocusedField('drug1')}
                                onBlur={() => setFocusedField(null)}
                            />
                            {drug1 ? (
                                <TouchableOpacity onPress={() => setDrug1('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                    <Feather name="x-circle" size={16} color={COLORS.textMuted} />
                                </TouchableOpacity>
                            ) : null}
                        </View>

                        {/* VS divider */}
                        <View style={styles.vsDivider}>
                            <View style={styles.vsDividerLine} />
                            <TouchableOpacity
                                style={styles.swapBtn}
                                onPress={() => { setDrug1(drug2); setDrug2(drug1); }}
                            >
                                <MaterialCommunityIcons name="swap-vertical" size={18} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                            <View style={styles.vsDividerLine} />
                        </View>

                        {/* Drug 2 */}
                        <View style={[styles.drugInput, focusedField === 'drug2' && styles.drugInputFocused]}>
                            <LinearGradient colors={['#7C3AED', '#6D28D9']} style={styles.drugPillIcon}>
                                <MaterialCommunityIcons name="pill" size={14} color="#fff" />
                            </LinearGradient>
                            <TextInput
                                style={styles.drugTextInput}
                                placeholder="Second medicine"
                                placeholderTextColor={COLORS.textMuted}
                                value={drug2}
                                onChangeText={setDrug2}
                                onFocus={() => setFocusedField('drug2')}
                                onBlur={() => setFocusedField(null)}
                            />
                            {drug2 ? (
                                <TouchableOpacity onPress={() => setDrug2('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                    <Feather name="x-circle" size={16} color={COLORS.textMuted} />
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    </View>

                    {/* Check Button */}
                    <TouchableOpacity
                        disabled={!drug1 || !drug2 || loading}
                        onPress={checkInteraction}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={(!drug1 || !drug2 || loading) ? ['#94A3B8', '#94A3B8'] : ['#7C3AED', '#6D28D9']}
                            style={styles.checkBtn}
                        >
                            {loading
                                ? <ActivityIndicator color="#fff" />
                                : <>
                                    <Feather name="shield" size={18} color="#fff" />
                                    <Text style={styles.checkBtnText}>Check Interaction</Text>
                                </>
                            }
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Error */}
                {error && (
                    <View style={styles.errorBox}>
                        <Ionicons name="alert-circle" size={18} color={COLORS.dangerText} />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {/* Results */}
                {result && sev && (
                    <View style={styles.results}>

                        {/* Severity Banner */}
                        <LinearGradient colors={sev.colors} style={styles.severityBanner}>
                            <MaterialCommunityIcons name={sev.icon} size={32} color="#fff" />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.severityLabel}>{sev.label}</Text>
                                <Text style={styles.severitySub}>{sev.sub}</Text>
                            </View>
                        </LinearGradient>

                        {/* Risk meter */}
                        <View style={styles.riskCard}>
                            <Text style={styles.riskTitle}>Risk Level</Text>
                            <View style={styles.riskBar}>
                                <View style={[styles.riskFill, {
                                    width: `${sev.barPct}%`,
                                    backgroundColor: sev.barColor,
                                }]} />
                            </View>
                            <View style={styles.riskLabels}>
                                <Text style={styles.riskLabelText}>Low</Text>
                                <Text style={styles.riskLabelText}>Moderate</Text>
                                <Text style={styles.riskLabelText}>High</Text>
                            </View>
                        </View>

                        {/* Drug pair */}
                        <View style={styles.drugPairCard}>
                            <View style={styles.drugPairItem}>
                                <LinearGradient colors={['#0D9488', '#0891B2']} style={styles.drugPairDot} />
                                <Text style={styles.drugPairName}>{drug1}</Text>
                            </View>
                            <View style={styles.drugPairSep}>
                                <MaterialCommunityIcons name="plus" size={16} color={COLORS.textSecondary} />
                            </View>
                            <View style={styles.drugPairItem}>
                                <LinearGradient colors={['#7C3AED', '#6D28D9']} style={styles.drugPairDot} />
                                <Text style={styles.drugPairName}>{drug2}</Text>
                            </View>
                        </View>

                        {/* FDA verified */}
                        {result.fda_verified && (
                            <View style={styles.fdaBadge}>
                                <Ionicons name="shield-checkmark" size={15} color="#059669" />
                                <Text style={styles.fdaText}>Verified against FDA drug label database</Text>
                            </View>
                        )}

                        {/* Info cards */}
                        {[
                            { label: '📋 SUMMARY', value: result.summary, bg: '#fff', textColor: COLORS.textPrimary },
                            { label: '🔬 HOW IT WORKS', value: result.mechanism, bg: '#fff', textColor: COLORS.textPrimary },
                            result.whatHappens && result.severity !== 'safe' && { label: '⚠️ WHAT COULD HAPPEN', value: result.whatHappens, bg: COLORS.dangerBg, textColor: COLORS.dangerText },
                            { label: '✅ RECOMMENDATION', value: result.recommendation, bg: COLORS.successBg, textColor: COLORS.primaryDark },
                            result.diceyConditions && { label: '🎯 CONDITIONAL RISKS', value: result.diceyConditions, bg: '#FFF7ED', textColor: '#9A3412' },
                        ].filter(Boolean).map((card, i) => (
                            <View key={i} style={[styles.infoCard, { backgroundColor: card.bg }]}>
                                <Text style={[styles.infoLabel, { color: card.textColor }]}>{card.label}</Text>
                                <Text style={[styles.infoText, { color: card.textColor }]}>{card.value}</Text>
                            </View>
                        ))}

                        {/* Alternatives */}
                        {result.alternatives?.length > 0 && result.severity !== 'safe' && (
                            <View style={styles.infoCard}>
                                <Text style={styles.infoLabel}>💡 CONSIDER INSTEAD</Text>
                                {result.alternatives.map((a, i) => (
                                    <View key={i} style={styles.altRow}>
                                        <LinearGradient colors={['#0D9488', '#0891B2']} style={styles.altDot} />
                                        <Text style={styles.altText}>{a}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* New check */}
                        <TouchableOpacity
                            onPress={() => { setResult(null); setDrug1(''); setDrug2(''); }}
                            activeOpacity={0.8}
                        >
                            <LinearGradient colors={['#0D9488', '#0891B2']} style={styles.newCheckBtn}>
                                <Feather name="refresh-cw" size={15} color="#fff" />
                                <Text style={styles.newCheckText}>Check Another Pair</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Disclaimer */}
                        <View style={styles.disclaimer}>
                            <Ionicons name="warning-outline" size={13} color={COLORS.warningText} />
                            <Text style={styles.disclaimerText}>For informational purposes only. Consult a licensed pharmacist or doctor.</Text>
                        </View>
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F0F9F9' },

    headerContainer: {
        paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 0 : 10,
        backgroundColor: '#F0F9F9', paddingBottom: 16,
    },
    header: {
        paddingHorizontal: 16, paddingVertical: 14, borderRadius: 24,
        ...SHADOWS.md,
    },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitleCenter: { alignItems: 'center', flex: 1 },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
    headerSub: { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },

    content: { padding: 16, paddingBottom: 100 },

    inputCard: {
        backgroundColor: '#fff', borderRadius: 24, padding: 20,
        borderWidth: 1, borderColor: 'rgba(226,232,240,0.8)', ...SHADOWS.md, gap: 16, marginBottom: 20,
    },

    countryBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
        borderWidth: 1, borderColor: '#E2E8F0', alignSelf: 'flex-start',
    },
    countryBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
    countryDropdown: {
        backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0',
        overflow: 'hidden', ...SHADOWS.md, marginBottom: 12,
    },
    countryOption: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    },
    countryOptionActive: { backgroundColor: '#F0F9F9' },
    countryOptionText: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '600' },

    drugsContainer: { gap: 8 },
    drugInput: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#F8FAFC', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14,
        borderWidth: 1.5, borderColor: '#E2E8F0',
    },
    drugInputFocused: { borderColor: COLORS.primary, backgroundColor: '#fff' },
    drugPillIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    drugTextInput: { flex: 1, fontSize: 15, color: COLORS.textPrimary, fontWeight: '700' },

    vsDivider: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
    vsDividerLine: { flex: 1, height: 1.5, backgroundColor: '#F1F5F9' },
    swapBtn: {
        width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff',
        justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#E2E8F0',
        ...SHADOWS.sm,
    },

    checkBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        height: 54, borderRadius: 16, marginTop: 4, ...SHADOWS.colored,
    },
    checkBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

    errorBox: {
        flexDirection: 'row', gap: 10, backgroundColor: '#FFF1F2',
        padding: 16, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#FECACA',
    },
    errorText: { flex: 1, fontSize: 14, color: '#E11D48', fontWeight: '600' },

    results: { gap: 16 },

    severityBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 16,
        padding: 20, borderRadius: 24, ...SHADOWS.colored,
    },
    severityLabel: { fontSize: 18, fontWeight: '900', color: '#fff' },
    severitySub: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 2, fontWeight: '600' },

    riskCard: {
        backgroundColor: '#fff', borderRadius: 20, padding: 18,
        borderWidth: 1, borderColor: 'rgba(226,232,240,0.8)', ...SHADOWS.md,
    },
    riskTitle: { fontSize: 11, fontWeight: '800', color: COLORS.textSecondary, marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase' },
    riskBar: { height: 12, backgroundColor: '#F1F5F9', borderRadius: 6, overflow: 'hidden', marginBottom: 8 },
    riskFill: { height: 12, borderRadius: 6 },
    riskLabels: { flexDirection: 'row', justifyContent: 'space-between' },
    riskLabelText: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted },

    drugPairCard: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#fff', borderRadius: 20, padding: 18, gap: 14,
        borderWidth: 1, borderColor: 'rgba(226,232,240,0.8)', ...SHADOWS.sm,
    },
    drugPairItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    drugPairDot: { width: 12, height: 12, borderRadius: 6 },
    drugPairName: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary, flex: 1, letterSpacing: -0.3 },
    drugPairSep: {
        width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9',
        justifyContent: 'center', alignItems: 'center',
    },

    fdaBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#ECFDF5', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#6EE7B7',
    },
    fdaText: { fontSize: 13, fontWeight: '700', color: '#065F46' },

    infoCard: {
        backgroundColor: '#fff', borderRadius: 20, padding: 18,
        borderWidth: 1, borderColor: 'rgba(226,232,240,0.8)', ...SHADOWS.sm,
    },
    infoLabel: {
        fontSize: 10, fontWeight: '800', letterSpacing: 1,
        marginBottom: 10, color: COLORS.textSecondary, textTransform: 'uppercase',
    },
    infoText: { fontSize: 14, lineHeight: 22, color: COLORS.textPrimary, fontWeight: '500' },

    altRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 },
    altDot: { width: 8, height: 8, borderRadius: 4 },
    altText: { fontSize: 14, color: COLORS.textPrimary, flex: 1, fontWeight: '600' },

    newCheckBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 10, paddingVertical: 16, borderRadius: 16, ...SHADOWS.colored,
    },
    newCheckText: { fontSize: 16, fontWeight: '800', color: '#fff' },

    disclaimer: {
        flexDirection: 'row', gap: 10, backgroundColor: 'rgba(251,191,36,0.1)',
        padding: 14, borderRadius: 16, alignItems: 'flex-start',
    },
    disclaimerText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18, fontWeight: '500' },

    emptyState: { alignItems: 'center', paddingTop: 60, marginBottom: 60, gap: 16 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
    emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: 32, fontWeight: '500' },
});
