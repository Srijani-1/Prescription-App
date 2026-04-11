import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    ScrollView, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { COLORS } from '../theme';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { API_URL, COUNTRIES } from '../config';

const SEVERITY = {
    safe: { color: '#16A34A', bg: '#DCFCE7', border: '#86EFAC', icon: 'checkmark-circle', label: 'Safe combination' },
    mild: { color: COLORS.warningText, bg: COLORS.warningBg, border: '#FDE68A', icon: 'warning-outline', label: 'Mild interaction — take with caution' },
    dangerous: { color: COLORS.dangerText, bg: COLORS.dangerBg, border: '#FECACA', icon: 'alert-circle', label: 'Dangerous interaction — consult doctor immediately' },
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
        setLoading(true);
        setResult(null);
        setError(null);

        try {
            const response = await fetch(`${API_URL}drug-interaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    drug1: drug1.trim(),
                    drug2: drug2.trim(),
                    country: selectedCountry.value,
                }),
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

    const inputStyle = (field) => [
        styles.inputWrapper,
        focusedField === field && styles.inputFocused,
    ];

    const SeverityBanner = ({ severity }) => {
        const s = SEVERITY[severity] || SEVERITY.safe;
        return (
            <View style={[styles.severityBanner, { backgroundColor: s.bg, borderColor: s.border }]}>
                <Ionicons name={s.icon} size={28} color={s.color} />
                <Text style={[styles.severityLabel, { color: s.color }]}>{s.label}</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

                {/* Header */}
                <View style={styles.heroCard}>
                    <View style={styles.heroIcon}>
                        <MaterialCommunityIcons name="shield-alert-outline" size={36} color={COLORS.accent} />
                    </View>
                    <Text style={styles.heroTitle}>Drug Interaction Checker</Text>
                    <Text style={styles.heroSub}>Enter two medicines to instantly check if they're safe to take together.</Text>
                </View>

                {/* Inputs */}
                <View style={styles.inputsCard}>

                    {/* Country Picker */}
                    <View>
                        <Text style={styles.label}>Your country</Text>
                        <TouchableOpacity
                            style={styles.countrySelector}
                            onPress={() => setShowCountryPicker(!showCountryPicker)}
                        >
                            <Text style={styles.countrySelectorText}>{selectedCountry.label}</Text>
                            <Feather name={showCountryPicker ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                        {showCountryPicker && (
                            <View style={styles.countryDropdown}>
                                {COUNTRIES.map((c) => (
                                    <TouchableOpacity
                                        key={c.value}
                                        style={[
                                            styles.countryOption,
                                            selectedCountry.value === c.value && styles.countryOptionSelected,
                                        ]}
                                        onPress={() => {
                                            setSelectedCountry(c);
                                            setShowCountryPicker(false);
                                        }}
                                    >
                                        <Text style={[
                                            styles.countryOptionText,
                                            selectedCountry.value === c.value && styles.countryOptionTextSelected,
                                        ]}>
                                            {c.label}
                                        </Text>
                                        {selectedCountry.value === c.value && (
                                            <Feather name="check" size={14} color={COLORS.primary} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Drug 1 */}
                    <View>
                        <Text style={styles.label}>First medicine</Text>
                        <View style={inputStyle('drug1')}>
                            <MaterialCommunityIcons
                                name="pill"
                                size={18}
                                color={focusedField === 'drug1' ? COLORS.primary : COLORS.textSecondary}
                                style={{ marginRight: 10 }}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Paracetamol"
                                placeholderTextColor={COLORS.textSecondary + '80'}
                                value={drug1}
                                onChangeText={setDrug1}
                                onFocus={() => setFocusedField('drug1')}
                                onBlur={() => setFocusedField(null)}
                            />
                            {drug1 ? (
                                <TouchableOpacity onPress={() => setDrug1('')}>
                                    <Feather name="x" size={16} color={COLORS.textSecondary} />
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    </View>

                    {/* Swap */}
                    <View style={styles.swapRow}>
                        <View style={styles.dividerLine} />
                        <TouchableOpacity
                            style={styles.swapBtn}
                            onPress={() => { setDrug1(drug2); setDrug2(drug1); }}
                        >
                            <MaterialCommunityIcons name="swap-vertical" size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Drug 2 */}
                    <View>
                        <Text style={styles.label}>Second medicine</Text>
                        <View style={inputStyle('drug2')}>
                            <MaterialCommunityIcons
                                name="pill"
                                size={18}
                                color={focusedField === 'drug2' ? COLORS.primary : COLORS.textSecondary}
                                style={{ marginRight: 10 }}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Ibuprofen"
                                placeholderTextColor={COLORS.textSecondary + '80'}
                                value={drug2}
                                onChangeText={setDrug2}
                                onFocus={() => setFocusedField('drug2')}
                                onBlur={() => setFocusedField(null)}
                            />
                            {drug2 ? (
                                <TouchableOpacity onPress={() => setDrug2('')}>
                                    <Feather name="x" size={16} color={COLORS.textSecondary} />
                                </TouchableOpacity>
                            ) : null}
                        </View>
                    </View>

                    {/* Check Button */}
                    <TouchableOpacity
                        style={[styles.checkBtn, (!drug1 || !drug2 || loading) && styles.checkBtnDisabled]}
                        onPress={checkInteraction}
                        disabled={!drug1 || !drug2 || loading}
                        activeOpacity={0.85}
                    >
                        {loading
                            ? <ActivityIndicator color={COLORS.white} />
                            : <>
                                <Feather name="shield" size={18} color={COLORS.white} />
                                <Text style={styles.checkBtnText}>Check Interaction</Text>
                            </>
                        }
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
                {result && (
                    <View style={styles.resultsSection}>
                        <SeverityBanner severity={result.severity} />
                        {result.fda_verified && (
                            <View style={styles.fdaBadge}>
                                <Ionicons name="shield-checkmark" size={16} color="#16A34A" />
                                <Text style={styles.fdaBadgeText}>Verified against FDA drug label database</Text>
                            </View>
                        )}
                        <View style={styles.resultCard}>
                            <Text style={styles.resultLabel}>SUMMARY</Text>
                            <Text style={styles.resultText}>{result.summary}</Text>
                        </View>

                        <View style={styles.resultCard}>
                            <Text style={styles.resultLabel}>HOW IT WORKS</Text>
                            <Text style={styles.resultText}>{result.mechanism}</Text>
                        </View>

                        {result.whatHappens && result.severity !== 'safe' && (
                            <View style={[styles.resultCard, { backgroundColor: COLORS.dangerBg, borderColor: '#FECACA' }]}>
                                <Text style={[styles.resultLabel, { color: COLORS.dangerText }]}>WHAT COULD HAPPEN</Text>
                                <Text style={[styles.resultText, { color: COLORS.dangerText }]}>{result.whatHappens}</Text>
                            </View>
                        )}

                        <View style={[styles.resultCard, { backgroundColor: COLORS.successBg, borderColor: COLORS.border }]}>
                            <Text style={[styles.resultLabel, { color: COLORS.primaryDark }]}>RECOMMENDATION</Text>
                            <Text style={[styles.resultText, { color: COLORS.primaryDark }]}>{result.recommendation}</Text>
                        </View>

                        {result.diceyConditions && (
                            <View style={[styles.resultCard, { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }]}>
                                <Text style={[styles.resultLabel, { color: '#C2410C' }]}>⚠️ DICEY CASES (CONDITIONAL RISKS)</Text>
                                <Text style={[styles.resultText, { color: '#9A3412' }]}>{result.diceyConditions}</Text>
                            </View>
                        )}

                        {result.alternatives?.length > 0 && result.severity !== 'safe' && (
                            <View style={styles.resultCard}>
                                <Text style={styles.resultLabel}>CONSIDER ALTERNATIVES</Text>
                                {result.alternatives.map((a, i) => (
                                    <View key={i} style={styles.altRow}>
                                        <MaterialCommunityIcons name="arrow-right" size={14} color={COLORS.primary} />
                                        <Text style={styles.altText}>{a}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.newCheckBtn}
                            onPress={() => { setResult(null); setDrug1(''); setDrug2(''); }}
                        >
                            <Feather name="refresh-cw" size={15} color={COLORS.primary} />
                            <Text style={styles.newCheckText}>Check another pair</Text>
                        </TouchableOpacity>

                        <View style={styles.disclaimer}>
                            <Ionicons name="warning" size={14} color={COLORS.warningText} />
                            <Text style={styles.disclaimerText}>This is for informational purposes only. Always consult a licensed pharmacist or doctor.</Text>
                        </View>
                    </View>
                )}

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    content: { padding: 20, paddingBottom: 60 },
    heroCard: {
        alignItems: 'center', backgroundColor: COLORS.accentBg, borderRadius: 20,
        padding: 24, marginBottom: 20, borderWidth: 1, borderColor: '#DDD6FE',
    },
    heroIcon: {
        width: 64, height: 64, borderRadius: 20,
        backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', marginBottom: 14,
    },
    heroTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8, textAlign: 'center' },
    heroSub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 21 },
    inputsCard: {
        backgroundColor: COLORS.white, borderRadius: 20, padding: 20,
        marginBottom: 20, borderWidth: 1, borderColor: COLORS.border, gap: 16,
    },
    label: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 8 },
    countrySelector: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: COLORS.lightGray, borderWidth: 1.5, borderColor: COLORS.border,
        borderRadius: 12, paddingHorizontal: 14, height: 52,
    },
    countrySelectorText: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '500' },
    countryDropdown: {
        marginTop: 4, backgroundColor: COLORS.white, borderRadius: 12,
        borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
    },
    countryOption: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    countryOptionSelected: { backgroundColor: COLORS.successBg },
    countryOptionText: { fontSize: 14, color: COLORS.textPrimary },
    countryOptionTextSelected: { fontWeight: '700', color: COLORS.primary },
    inputWrapper: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: COLORS.lightGray, borderWidth: 1.5, borderColor: COLORS.border,
        borderRadius: 12, paddingHorizontal: 14, height: 52,
    },
    inputFocused: { borderColor: COLORS.primary, backgroundColor: COLORS.successBg + '60' },
    input: { flex: 1, fontSize: 15, color: COLORS.textPrimary },
    swapRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
    swapBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: COLORS.lightGray, justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: COLORS.border,
    },
    checkBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        backgroundColor: COLORS.accent, height: 52, borderRadius: 12, marginTop: 4,
    },
    checkBtnDisabled: { opacity: 0.5 },
    checkBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
    errorBox: {
        flexDirection: 'row', gap: 10, backgroundColor: COLORS.dangerBg,
        padding: 14, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#FECACA',
    },
    errorText: { flex: 1, fontSize: 14, color: COLORS.dangerText },
    resultsSection: { gap: 12 },
    severityBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        padding: 16, borderRadius: 14, borderWidth: 1.5,
    },
    severityLabel: { fontSize: 16, fontWeight: '700', flex: 1 },
    resultCard: {
        backgroundColor: COLORS.white, borderRadius: 14, padding: 16,
        borderWidth: 1, borderColor: COLORS.border,
    },
    resultLabel: {
        fontSize: 11, fontWeight: '700', color: COLORS.textSecondary,
        letterSpacing: 0.5, marginBottom: 8,
    },
    resultText: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 21 },
    altRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
    altText: { fontSize: 14, color: COLORS.textPrimary },
    newCheckBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: COLORS.successBg, paddingVertical: 14, borderRadius: 12,
        borderWidth: 1, borderColor: COLORS.border,
    },
    newCheckText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
    disclaimer: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8,
        backgroundColor: COLORS.warningBg, padding: 12, borderRadius: 10,
    },
    disclaimerText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18 },
    fdaBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: '#DCFCE7', padding: 10, borderRadius: 10,
        borderWidth: 1, borderColor: '#86EFAC',
    },
    fdaBadgeText: { fontSize: 12, color: '#16A34A', fontWeight: '600' },
});
