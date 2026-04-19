import React, { useState, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    SafeAreaView, StatusBar, TextInput, ActivityIndicator,
    KeyboardAvoidingView, Platform, Animated, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SHADOWS } from '../theme';
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import { API_URL } from '../config';

const COMMON_SYMPTOMS = [
    { label: 'Migraine', icon: 'head-flash-outline' },
    { label: 'Acid Reflux', icon: 'fire' },
    { label: 'Dry Cough', icon: 'weather-dust' },
    { label: 'Muscle Spasm', icon: 'arm-flex' },
    { label: 'Hypertension', icon: 'heart-pulse' },
    { label: 'Insomnia', icon: 'moon-waning-crescent' },
    { label: 'Skin Rash', icon: 'dots-vertical-circle' },
    { label: 'Sinusitis', icon: 'nose' },
    { label: 'Diabetes', icon: 'needle' },
    { label: 'Anxiety', icon: 'brain' },
    { label: 'Back Pain', icon: 'human' },
    { label: 'Allergy', icon: 'flower-pollen' },
];

const URGENCY_CONFIG = {
    Low: { color: '#10B981', bg: COLORS.successBg, border: '#6EE7B7', icon: 'shield-check-outline', label: 'Low Urgency' },
    Medium: { color: '#D97706', bg: '#FFFBEB', border: '#FCD34D', icon: 'shield-alert-outline', label: 'Medium Urgency' },
    High: { color: '#EF4444', bg: '#FEF2F2', border: '#FCA5A5', icon: 'shield-off-outline', label: 'High Urgency' },
};

const CHIP_GRADIENTS = [GRADIENTS.teal, GRADIENTS.purple, ['#F43F5E', '#E11D48'], GRADIENTS.gold, ['#0EA5E9', '#0369A1']];

// ── Doctor Script Card ────────────────────────────────────────────────────────
const DoctorScriptCard = ({ symptom }) => (
    <View style={ds.card}>
        <View style={ds.titleRow}>
            <LinearGradient colors={GRADIENTS.teal} style={ds.iconWrap}>
                <MaterialCommunityIcons name="stethoscope" size={18} color="#fff" />
            </LinearGradient>
            <View>
                <Text style={ds.title}>Doctor Script</Text>
                <Text style={ds.titleSub}>What to say at your appointment</Text>
            </View>
        </View>

        <View style={ds.quoteBox}>
            <Text style={ds.quoteChar}>"</Text>
            <Text style={ds.script}>
                Hi Doctor, I've been having{' '}
                <Text style={ds.bold}>{symptom}</Text>
                {' '}lately. I wanted to discuss what might be causing it and what I should do to feel better.
            </Text>
        </View>

        <View style={ds.tipsBox}>
            {[
                'Tell them exactly when symptoms started',
                'Mention anything that makes it worse',
                'List any medicines you already take',
            ].map((tip, i) => (
                <View key={i} style={ds.tipRow}>
                    <View style={ds.tipDot}>
                        <Feather name="check" size={10} color="#fff" />
                    </View>
                    <Text style={ds.tipText}>{tip}</Text>
                </View>
            ))}
        </View>
    </View>
);

const ds = StyleSheet.create({
    card: {
        backgroundColor: COLORS.white, borderRadius: 20, marginBottom: 14,
        borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', ...SHADOWS.sm,
    },
    titleRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        padding: 16, paddingBottom: 14,
        borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    iconWrap: {
        width: 40, height: 40, borderRadius: 13,
        justifyContent: 'center', alignItems: 'center',
    },
    title: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
    titleSub: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
    quoteBox: {
        margin: 14, backgroundColor: COLORS.successBg, padding: 14,
        borderRadius: 14, borderLeftWidth: 3, borderLeftColor: COLORS.primary,
    },
    quoteChar: { fontSize: 32, color: COLORS.primary, lineHeight: 28, fontWeight: '900', marginBottom: 2 },
    script: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
    bold: { fontWeight: '800', color: COLORS.primary },
    tipsBox: { paddingHorizontal: 14, paddingBottom: 14, gap: 10 },
    tipRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    tipDot: {
        width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.primary,
        justifyContent: 'center', alignItems: 'center',
    },
    tipText: { fontSize: 13, color: COLORS.textSecondary, flex: 1, lineHeight: 19 },
});

// ── Medicine Class Card ───────────────────────────────────────────────────────
const MedClassCard = ({ data, index }) => {
    const grad = CHIP_GRADIENTS[index % CHIP_GRADIENTS.length];
    return (
        <View style={mc.card}>
            <View style={mc.header}>
                <LinearGradient colors={grad} style={mc.iconBox}>
                    <MaterialCommunityIcons name="pill" size={16} color="#fff" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                    <Text style={mc.name}>{data.class}</Text>
                    <Text style={mc.desc} numberOfLines={2}>{data.description}</Text>
                </View>
            </View>

            <View style={mc.chips}>
                {data.examples?.map((ex, i) => (
                    <View key={i} style={mc.chip}>
                        <MaterialCommunityIcons name="pill" size={10} color={COLORS.primary} />
                        <Text style={mc.chipText}>{ex}</Text>
                    </View>
                ))}
            </View>

            <View style={mc.actionBox}>
                <MaterialCommunityIcons name="information-outline" size={13} color={COLORS.primary} />
                <Text style={mc.actionText}>
                    <Text style={mc.actionBold}>How it helps: </Text>
                    {data.howItHelps}
                </Text>
            </View>
        </View>
    );
};

const mc = StyleSheet.create({
    card: {
        backgroundColor: COLORS.white, borderRadius: 18, marginBottom: 10,
        borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', ...SHADOWS.sm,
    },
    header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, paddingBottom: 10 },
    iconBox: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    name: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
    desc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, lineHeight: 17 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 14, paddingBottom: 10 },
    chip: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: COLORS.successBg, paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 20, borderWidth: 1, borderColor: COLORS.border,
    },
    chipText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
    actionBox: {
        flexDirection: 'row', gap: 8, alignItems: 'flex-start',
        padding: 12, margin: 12, marginTop: 0,
        borderRadius: 12, backgroundColor: COLORS.background,
        borderWidth: 1, borderColor: COLORS.border,
    },
    actionText: { flex: 1, fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
    actionBold: { fontWeight: '700', color: COLORS.textPrimary },
});

// ── Lifestyle Card ────────────────────────────────────────────────────────────
const LifestyleCard = ({ tips }) => (
    <LinearGradient colors={['#0F766E', '#0891B2']} style={lc.card}>
        <View style={lc.titleRow}>
            <View style={lc.iconWrap}>
                <MaterialCommunityIcons name="leaf" size={18} color="#5EEAD4" />
            </View>
            <View>
                <Text style={lc.title}>At-Home Care Tips</Text>
                <Text style={lc.titleSub}>What you can do right now</Text>
            </View>
        </View>
        {tips?.map((tip, i) => (
            <View key={i} style={lc.row}>
                <View style={lc.check}>
                    <Feather name="check" size={11} color="#0F172A" />
                </View>
                <Text style={lc.tip}>{tip}</Text>
            </View>
        ))}
    </LinearGradient>
);

const lc = StyleSheet.create({
    card: { borderRadius: 20, padding: 18, marginTop: 4, marginBottom: 14 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
    iconWrap: {
        width: 40, height: 40, borderRadius: 13,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center', alignItems: 'center',
    },
    title: { fontSize: 15, fontWeight: '800', color: '#fff' },
    titleSub: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
    check: {
        width: 22, height: 22, borderRadius: 11, backgroundColor: '#5EEAD4',
        justifyContent: 'center', alignItems: 'center', marginTop: 1,
    },
    tip: { flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 20 },
});

// ── Urgency Ring (matches HealthRing from FamilyProfiles) ─────────────────────
const UrgencyBadge = ({ urgency }) => {
    const cfg = URGENCY_CONFIG[urgency] || URGENCY_CONFIG.Medium;
    return (
        <View style={[ub.wrap, { borderColor: cfg.color, backgroundColor: cfg.bg }]}>
            <MaterialCommunityIcons name={cfg.icon} size={14} color={cfg.color} />
            <Text style={[ub.label, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
    );
};
const ub = StyleSheet.create({
    wrap: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 12, borderWidth: 1.5, marginBottom: 12,
    },
    label: { fontSize: 12, fontWeight: '800' },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function SymptomLookupScreen({ navigate, user }) {
    const { width } = useWindowDimensions();
    const isWide = width >= 768;

    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scrollRef = useRef(null);

    const searchSymptom = async (symptomText) => {
        const text = (symptomText || query).trim();
        if (!text) return;
        setLoading(true);
        setResult(null);
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start();

        try {
            const response = await fetch(`${API_URL}api/symptoms/lookup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: text, user_id: user?.id || 'anonymous' }),
            });
            const data = await response.json();
            setResult(data);
        } catch {
            setResult({
                symptom: text,
                urgency: 'Medium',
                overview: `For "${text}", doctors usually look at several medicine classes. This summary helps you understand the general medical approach.`,
                medicineClasses: [
                    {
                        class: 'NSAIDs (Anti-Inflammatories)',
                        description: 'Commonly used to reduce pain and swelling.',
                        examples: ['Ibuprofen', 'Naproxen', 'Diclofenac'],
                        howItHelps: 'Reduces chemicals in the body that cause pain and fever.',
                    },
                    {
                        class: 'Pain Relievers (Analgesics)',
                        description: 'Used for pain management without targeting swelling.',
                        examples: ['Paracetamol', 'Tramadol', 'Codeine'],
                        howItHelps: 'Works with the nervous system to lower your pain levels.',
                    },
                ],
                lifestyle: ['Track symptoms for 48 hours', 'Drink plenty of water', 'Get 7–9 hours of rest'],
            });
        } finally {
            setLoading(false);
            Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
            setTimeout(() => scrollRef.current?.scrollTo({ y: 0, animated: true }), 100);
        }
    };

    const clearResult = () => { setResult(null); setQuery(''); };

    const urgCfg = URGENCY_CONFIG[result?.urgency] || URGENCY_CONFIG.Medium;

    // ── Result content ────────────────────────────────────────────────────────
    const renderResults = () => (
        <Animated.View style={{ opacity: fadeAnim, padding: 20, paddingBottom: 50 }}>

            {/* Overview card */}
            <View style={s.overviewCard}>
                <UrgencyBadge urgency={result.urgency} />
                <Text style={s.overviewTitle}>{result.symptom}</Text>
                <Text style={s.overviewText}>{result.overview}</Text>

                {/* Quick stat row */}
                <View style={s.statRow}>
                    {[
                        { icon: 'pill', label: 'Med Classes', value: result.medicineClasses?.length || 0, color: COLORS.primary },
                        { icon: 'leaf', label: 'Home Tips', value: result.lifestyle?.length || 0, color: '#10B981' },
                        { icon: 'shield-check-outline', label: 'Urgency', value: result.urgency, color: urgCfg.color },
                    ].map((s2, i) => (
                        <View key={i} style={s.statItem}>
                            <MaterialCommunityIcons name={s2.icon} size={14} color={s2.color} />
                            <Text style={[s.statVal, { color: s2.color }]}>{s2.value}</Text>
                            <Text style={s.statLabel}>{s2.label}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Doctor Script */}
            <Text style={s.secTitle}>Prepare for your Doctor</Text>
            <DoctorScriptCard symptom={result.symptom} />

            {/* Medicine Classes */}
            <Text style={s.secTitle}>Medicine Classes</Text>
            {result.medicineClasses?.map((cls, i) => (
                <MedClassCard key={i} data={cls} index={i} />
            ))}

            {/* Lifestyle */}
            <Text style={s.secTitle}>Lifestyle & Home Care</Text>
            <LifestyleCard tips={result.lifestyle} />

            {/* Disclaimer */}
            <View style={s.disclaimer}>
                <View style={s.disclaimerIcon}>
                    <MaterialCommunityIcons name="shield-check-outline" size={18} color={COLORS.dangerText} />
                </View>
                <Text style={s.disclaimerText}>
                    AI-generated for education only. Always consult a licensed doctor before taking any medication.
                </Text>
            </View>
        </Animated.View>
    );

    // ── Empty / chip grid ─────────────────────────────────────────────────────
    const renderEmpty = () => (
        <View style={{ paddingBottom: 50 }}>
            <View style={s.sectionHeader}>
                <Text style={s.secTitle}>Quick Search</Text>
                <Text style={s.secSub}>Tap a condition to analyse it</Text>
            </View>

            <View style={s.chipGrid}>
                {COMMON_SYMPTOMS.map((sym, i) => (
                    <TouchableOpacity
                        key={i}
                        style={s.chip}
                        onPress={() => { setQuery(sym.label); searchSymptom(sym.label); }}
                        activeOpacity={0.75}
                    >
                        <LinearGradient colors={CHIP_GRADIENTS[i % CHIP_GRADIENTS.length]} style={s.chipIcon}>
                            <MaterialCommunityIcons name={sym.icon} size={18} color="#fff" />
                        </LinearGradient>
                        <Text style={s.chipLabel}>{sym.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={s.bottomSection}>
                <LinearGradient colors={['#0F766E', '#0891B2']} style={s.infoBanner}>
                    <View style={s.infoBannerIconWrap}>
                        <MaterialCommunityIcons name="robot-outline" size={22} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={s.infoBannerTitle}>AI-Powered Analysis</Text>
                        <Text style={s.infoBannerSub}>
                            Maps symptoms to 500+ medicine compounds with clinical context.
                        </Text>
                    </View>
                </LinearGradient>

                <View style={s.howCard}>
                    <Text style={s.howTitle}>How it works</Text>
                    <View style={s.howSteps}>
                        {[
                            { icon: 'magnify', text: 'Pick a symptom', colors: GRADIENTS.teal },
                            { icon: 'brain', text: 'AI analyses', colors: GRADIENTS.purple },
                            { icon: 'stethoscope', text: 'Doc script', colors: ['#F43F5E', '#E11D48'] },
                            { icon: 'leaf', text: 'Home care', colors: GRADIENTS.gold },
                        ].map((step, i, arr) => (
                            <React.Fragment key={i}>
                                <View style={s.howStep}>
                                    <LinearGradient colors={step.colors} style={s.howStepIcon}>
                                        <MaterialCommunityIcons name={step.icon} size={14} color="#fff" />
                                    </LinearGradient>
                                    <Text style={s.howStepText}>{step.text}</Text>
                                </View>
                                {i < arr.length - 1 && (
                                    <Feather name="chevron-right" size={13} color={COLORS.border} />
                                )}
                            </React.Fragment>
                        ))}
                    </View>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={s.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.midnight} />

            {/* ── Header — matches MedicalHistoryScreen / FamilyProfilesScreen ── */}
            <LinearGradient colors={['#0A1628', '#0F2535']} style={s.header}>
                <View style={s.bgCircle} />
                <View style={s.bgCircle2} />

                <View style={s.headerTop}>
                    <TouchableOpacity onPress={() => navigate('DASHBOARD')} style={s.backBtn}>
                        <Feather name="arrow-left" size={20} color="rgba(255,255,255,0.8)" />
                    </TouchableOpacity>

                    <View style={{ flex: 1, paddingLeft: 14 }}>
                        <Text style={s.headerTitle}>Symptom Guide</Text>
                        <Text style={s.headerSub}>Pharmacotherapy & Doctor Communication</Text>
                    </View>

                    {result && (
                        <TouchableOpacity style={s.clearBtn} onPress={clearResult}>
                            <Feather name="x" size={16} color="rgba(255,255,255,0.8)" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* User context card — matches MedicalHistoryScreen's userCard */}
                {result && (
                    <View style={s.resultContextCard}>
                        <View style={[s.resultContextIcon, { backgroundColor: urgCfg.bg, borderColor: urgCfg.border }]}>
                            <MaterialCommunityIcons name={urgCfg.icon} size={18} color={urgCfg.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.resultContextLabel}>Showing results for</Text>
                            <Text style={s.resultContextSymptom}>{result.symptom}</Text>
                        </View>
                        <View style={[s.urgencyChip, { backgroundColor: urgCfg.bg, borderColor: urgCfg.border }]}>
                            <Text style={[s.urgencyChipText, { color: urgCfg.color }]}>
                                {result.urgency}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Stat strip when result loaded — matches statsRow from History/Family */}
                {result && (
                    <View style={s.headerStats}>
                        {[
                            { icon: 'pill', value: result.medicineClasses?.length || 0, label: 'Med Classes', colors: GRADIENTS.teal },
                            { icon: 'leaf', value: result.lifestyle?.length || 0, label: 'Home Tips', colors: GRADIENTS.purple },
                            { icon: 'stethoscope', value: 1, label: 'Doc Script', colors: ['#F43F5E', '#E11D48'] },
                        ].map((item, i) => (
                            <View key={i} style={s.headerStatCard}>
                                <LinearGradient colors={item.colors} style={s.headerStatIcon}>
                                    <MaterialCommunityIcons name={item.icon} size={14} color="#fff" />
                                </LinearGradient>
                                <Text style={s.headerStatVal}>{item.value}</Text>
                                <Text style={s.headerStatLabel}>{item.label}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Search bar */}
                <View style={s.searchRow}>
                    <View style={s.searchBox}>
                        <Feather name="search" size={16} color="rgba(255,255,255,0.5)" />
                        <TextInput
                            style={s.searchInput}
                            placeholder="e.g. Headache, Back Pain, Fever…"
                            placeholderTextColor="rgba(255,255,255,0.35)"
                            value={query}
                            onChangeText={setQuery}
                            onSubmitEditing={() => searchSymptom()}
                            returnKeyType="search"
                        />
                        {query.length > 0 && (
                            <TouchableOpacity onPress={() => setQuery('')}>
                                <Feather name="x-circle" size={15} color="rgba(255,255,255,0.4)" />
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity
                        style={[s.searchBtn, (!query.trim() || loading) && s.searchBtnDisabled]}
                        onPress={() => searchSymptom()}
                        disabled={!query.trim() || loading}
                        activeOpacity={0.85}
                    >
                        {loading
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <Text style={s.searchBtnText}>Analyze</Text>
                        }
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* ── Body ── */}
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView
                    ref={scrollRef}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {loading ? (
                        <View style={s.loadingBox}>
                            <LinearGradient colors={GRADIENTS.teal} style={s.loadingIcon}>
                                <MaterialCommunityIcons name="brain" size={30} color="#fff" />
                            </LinearGradient>
                            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 8 }} />
                            <Text style={s.loadingText}>Analyzing symptom…</Text>
                            <Text style={s.loadingSub}>Mapping to medicine classes</Text>
                        </View>
                    ) : result ? renderResults() : renderEmpty()}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },

    // ── Header ────────────────────────────────────────────────────────────────
    header: { paddingBottom: 20, position: 'relative', overflow: 'hidden' },
    bgCircle: {
        position: 'absolute', width: 240, height: 240, borderRadius: 120,
        backgroundColor: 'rgba(13,148,136,0.08)', top: -80, right: -60,
    },
    bgCircle2: {
        position: 'absolute', width: 120, height: 120, borderRadius: 60,
        backgroundColor: 'rgba(13,148,136,0.06)', bottom: -30, left: 40,
    },
    headerTop: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14,
    },
    headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
    headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    },
    clearBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    },

    // Result context card (mirrors userCard from MedicalHistoryScreen)
    resultContextCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        marginHorizontal: 20, marginBottom: 12,
        backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 16, padding: 14,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    resultContextIcon: {
        width: 44, height: 44, borderRadius: 13,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1.5,
    },
    resultContextLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
    resultContextSymptom: { fontSize: 16, fontWeight: '800', color: '#fff', marginTop: 1 },
    urgencyChip: {
        paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1.5,
    },
    urgencyChipText: { fontSize: 12, fontWeight: '800' },

    // Stat strip (mirrors statsRow)
    headerStats: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 14 },
    headerStatCard: {
        flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 14,
        padding: 12, alignItems: 'center', gap: 5,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    headerStatIcon: { width: 30, height: 30, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    headerStatVal: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
    headerStatLabel: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.45)', textAlign: 'center' },

    // Search bar (dark variant to sit in the gradient header)
    searchRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20 },
    searchBox: {
        flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14,
        paddingHorizontal: 14, height: 50,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    },
    searchInput: { flex: 1, fontSize: 14, color: '#fff', fontWeight: '500' },
    searchBtn: {
        backgroundColor: COLORS.primary, paddingHorizontal: 18, height: 50,
        borderRadius: 14, justifyContent: 'center', alignItems: 'center', minWidth: 90,
        ...SHADOWS.colored,
    },
    searchBtnDisabled: { opacity: 0.45 },
    searchBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },

    // ── Overview card ─────────────────────────────────────────────────────────
    overviewCard: {
        backgroundColor: COLORS.white, borderRadius: 20, padding: 18,
        marginBottom: 14, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm,
    },
    overviewTitle: { fontSize: 24, fontWeight: '900', color: COLORS.textPrimary, marginBottom: 8, letterSpacing: -0.5 },
    overviewText: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, marginBottom: 14 },

    // Stat row inside overview (mirrors memberStats)
    statRow: {
        flexDirection: 'row', backgroundColor: COLORS.background,
        borderRadius: 12, padding: 10,
    },
    statItem: { flex: 1, alignItems: 'center', gap: 4 },
    statVal: { fontSize: 18, fontWeight: '900' },
    statLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600', textAlign: 'center' },

    // ── Section header ────────────────────────────────────────────────────────
    sectionHeader: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 },
    secTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 3 },
    secSub: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },

    // ── Symptom chip grid — 3 per row, icon-only tiles ────────────────────────
    chipGrid: {
        flexDirection: 'row', flexWrap: 'wrap', gap: 10,
        paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20,
    },
    chip: {
        width: '30%', flexGrow: 1,
        alignItems: 'center', gap: 8,
        backgroundColor: COLORS.white, paddingVertical: 14,
        borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm,
    },
    chipIcon: {
        width: 42, height: 42, borderRadius: 13,
        justifyContent: 'center', alignItems: 'center',
    },
    chipLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },

    // ── Bottom section (banner + how-it-works) ────────────────────────────────
    bottomSection: { paddingHorizontal: 20, gap: 12 },

    // ── Info banner ───────────────────────────────────────────────────────────
    infoBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        padding: 16, borderRadius: 18,
    },
    infoBannerIconWrap: {
        width: 44, height: 44, borderRadius: 13,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center', alignItems: 'center',
    },
    infoBannerTitle: { fontSize: 14, fontWeight: '800', color: '#fff', marginBottom: 3 },
    infoBannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 18 },

    // ── How it works — horizontal steps ──────────────────────────────────────
    howCard: {
        backgroundColor: COLORS.white, borderRadius: 18, padding: 16,
        borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm,
    },
    howTitle: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 14 },
    howSteps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    howStep: { alignItems: 'center', gap: 6, flex: 1 },
    howStepIcon: {
        width: 40, height: 40, borderRadius: 13,
        justifyContent: 'center', alignItems: 'center', ...SHADOWS.colored,
    },
    howStepText: { fontSize: 10, fontWeight: '700', color: COLORS.textSecondary, textAlign: 'center' },

    // ── Loading ───────────────────────────────────────────────────────────────
    loadingBox: { alignItems: 'center', paddingVertical: 80, gap: 10 },
    loadingIcon: {
        width: 72, height: 72, borderRadius: 22,
        justifyContent: 'center', alignItems: 'center', ...SHADOWS.colored,
    },
    loadingText: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, marginTop: 8 },
    loadingSub: { fontSize: 13, color: COLORS.textSecondary },

    // ── Disclaimer ────────────────────────────────────────────────────────────
    disclaimer: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 12,
        backgroundColor: '#FEF2F2', padding: 14, borderRadius: 16,
        borderWidth: 1, borderColor: '#FECACA', marginTop: 6,
    },
    disclaimerIcon: {
        width: 34, height: 34, borderRadius: 10,
        backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center',
    },
    disclaimerText: { flex: 1, fontSize: 12, color: '#991B1B', lineHeight: 18, fontWeight: '500' },
});
