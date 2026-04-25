import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    SafeAreaView, StatusBar, Animated, Dimensions, Platform, Easing
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SHADOWS } from '../theme';
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import { API_URL } from '../config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Today's date as "YYYY-MM-DD" — used for all DoseLog-aware API calls
const TODAY = new Date().toISOString().split('T')[0];

const ADDITIONAL_FEATURES = [
    { label: 'Pharmacy', icon: 'map-marker-radius-outline', bg: ['#F43F5E', '#E11D48'], screen: 'PHARMACY' },
    { label: 'Timeline', icon: 'timeline-clock-outline', bg: GRADIENTS.teal, screen: 'PRESCRIPTION_TIMELINE' },
    { label: 'Family', icon: 'account-group-outline', bg: GRADIENTS.purple, screen: 'FAMILY_PROFILE' },
    { label: 'Guide', icon: 'book-open-variant', bg: ['#F59E0B', '#D97706'], screen: 'MEDICINE_EXPLAINER' },
    { label: 'Reminders', icon: 'bell-ring-outline', bg: ['#EF4444', '#DC2626'], screen: 'REFILL_REMINDER' },
    { label: 'Symptoms', icon: 'stethoscope', bg: ['#8B5CF6', '#7C3AED'], screen: 'SYMPTOM_LOOKUP' },
];

const HEALTH_TIPS = [
    { title: "Generic = Same Medicine", body: "Generic medicines contain identical active ingredients and work the same way." },
    { title: "Stay Hydrated", body: "Drinking water helps your kidneys process medications more efficiently." },
    { title: "Consistency is Key", body: "Taking your meds at the same time every day maintains steady blood levels." },
    { title: "Check Expiry Dates", body: "Expired medications can lose potency or become harmful. Check your cabinet!" },
    { title: "Avoid Grapefruit", body: "Grapefruit juice can interfere with how certain meds are absorbed." },
];

export default function DashboardScreen({ user, navigate }) {
    const [meds, setMeds] = useState([]);
    const [recentScans, setRecentScans] = useState([]);
    const [medsLoaded, setMedsLoaded] = useState(false);
    const [activeTip, setActiveTip] = useState(HEALTH_TIPS[0]);
    const [healthScore, setHealthScore] = useState(0);
    const [streak, setStreak] = useState(0);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(24)).current;
    const beamAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        setActiveTip(HEALTH_TIPS[Math.floor(Math.random() * HEALTH_TIPS.length)]);

        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 10, useNativeDriver: true }),
        ]).start();

        Animated.loop(
            Animated.timing(beamAnim, {
                toValue: 1, duration: 3500,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
                useNativeDriver: true,
            })
        ).start();

        if (user && (user.id || user._id)) {
            fetchDashboardData();
        }
    }, [user]);

    // ── Fetch ─────────────────────────────────────────────────────────────────
    const fetchDashboardData = async () => {
        const userId = user?.id || user?._id;
        if (!userId) return;

        try {
            const [histRes, medsRes, scoreRes] = await Promise.all([
                fetch(`${API_URL}api/prescriptions/history?user_id=${userId}`),
                // ✅ Pass today's date so the backend overlays DoseLog taken status correctly
                fetch(`${API_URL}api/medications?user_id=${userId}&date=${TODAY}`),
                fetch(`${API_URL}api/user/health-score?user_id=${userId}`),
            ]);

            // Health score
            if (scoreRes.ok) {
                const scoreData = await scoreRes.json();
                if (scoreData.status === 'success') {
                    setHealthScore(scoreData.score ?? 0);
                    setStreak(scoreData.streak ?? 0);
                }
            }

            // Prescription history
            const histData = await histRes.json();
            if (histData.status === 'success') {
                const formattedScans = histData.history.map(item => {
                    const d = new Date(item.date);
                    return {
                        id: item.id,
                        date: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
                        condition: item.results?.[0]?.explanation?.medicine_class || 'General',
                        meds: item.results ? item.results.length : 0,
                        fullRecord: item,
                    };
                }).slice(0, 5);
                setRecentScans(formattedScans);
            }

            // Medications — flatten into one row per dose time
            const medsData = await medsRes.json();
            if (medsData && Array.isArray(medsData)) {
                const flat = [];
                medsData.forEach(med => {
                    (med.times || []).forEach(t => {
                        flat.push({
                            id: `${med.id}_${t.id}`,
                            medId: med.id,
                            timeId: t.id,
                            name: med.name,
                            dose: med.dose,
                            time: t.time,
                            taken: t.taken,   // ← populated correctly from DoseLog via backend
                            icon: t.icon || 'pill',
                        });
                    });
                });
                setMeds(flat);
                setMedsLoaded(true);
            }
        } catch (err) {
            console.error('Dashboard fetch error:', err);
        }
    };

    const refreshScore = async () => {
        const userId = user?.id || user?._id;
        if (!userId) return;
        try {
            const res = await fetch(`${API_URL}api/user/health-score?user_id=${userId}`);
            const data = await res.json();
            if (data.status === 'success') {
                setHealthScore(data.score ?? 0);
                setStreak(data.streak ?? 0);
            }
        } catch (_) { }
    };

    // ── Toggle dose ───────────────────────────────────────────────────────────
    const toggleMed = async (id) => {
        const med = meds.find(m => m.id === id);
        if (!med) return;

        // Optimistic update
        setMeds(prev => prev.map(m => m.id === id ? { ...m, taken: !m.taken } : m));

        try {
            // ✅ Pass today's date so the backend writes to DoseLog for today
            await fetch(
                `${API_URL}api/medications/${med.medId}/times/${med.timeId}/toggle?date=${TODAY}`,
                { method: 'PUT' }
            );
            refreshScore();
        } catch (_) {
            // Revert optimistic update on failure
            setMeds(prev => prev.map(m => m.id === id ? { ...m, taken: med.taken } : m));
        }
    };

    // ── Derived stats ─────────────────────────────────────────────────────────
    const takenCount = meds.filter(m => m.taken).length;
    const adherencePct = meds.length > 0 ? Math.round((takenCount / meds.length) * 100) : 0;
    const weeklyTrend = meds.length > 0 ? (takenCount > 0 ? `+${takenCount + 1}` : '0') : '0';
    const firstName = user?.name?.split(' ')[0] || user?.full_name?.split(' ')[0] || 'User';

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.midnight} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                <LinearGradient colors={GRADIENTS.hero} style={styles.header}>
                    <View style={styles.bgDeco1} />
                    <View style={styles.bgDeco2} />
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.greeting}>Good morning,</Text>
                            <Text style={styles.userName}>{firstName} 👋</Text>
                        </View>
                        <View style={styles.headerActions}>
                            <TouchableOpacity style={styles.headerBtn} onPress={() => navigate('HISTORY')}>
                                <MaterialCommunityIcons name="clipboard-text-outline" size={19} color="rgba(255,255,255,0.8)" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => navigate('PROFILE')}>
                                <LinearGradient colors={GRADIENTS.teal} style={styles.avatarGradient}>
                                    <Text style={styles.avatarText}>{firstName[0]?.toUpperCase()}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.healthCard}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.healthCardLabel}>Health Score</Text>
                            <Text style={styles.healthScore}>{healthScore}</Text>
                            <View style={styles.trendRow}>
                                <Ionicons name="trending-up" size={14} color="#34D399" />
                                <Text style={styles.trendText}>{weeklyTrend} this week</Text>
                            </View>
                            <View style={styles.adherenceBarBg}>
                                <View style={[styles.adherenceBarFill, { width: `${adherencePct}%` }]} />
                            </View>
                            <Text style={styles.adherenceLabel}>{takenCount}/{meds.length} doses today</Text>
                        </View>
                        <View style={styles.scoreCircleWrap}>
                            <View style={styles.scoreCircle}>
                                <Text style={styles.scoreCircleVal}>{healthScore}</Text>
                                <Text style={styles.scoreCircleSub}>/ 100</Text>
                            </View>
                            <View style={styles.streakBadge}>
                                <Text style={styles.streakText}>🔥 {streak} Day Streak</Text>
                            </View>
                        </View>
                    </View>
                </LinearGradient>

                <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <Text style={styles.sectionTitle}>Additional Features</Text>
                    <View style={[styles.actionsGrid, { flexWrap: 'wrap' }]}>
                        {ADDITIONAL_FEATURES.map((action, i) => (
                            <TouchableOpacity
                                key={i}
                                style={[styles.actionCard, { width: '30%', marginBottom: 14 }]}
                                onPress={() => navigate(action.screen)}
                                activeOpacity={0.8}
                            >
                                <LinearGradient colors={action.bg} style={styles.actionIconBox}>
                                    <MaterialCommunityIcons name={action.icon} size={22} color="#fff" />
                                </LinearGradient>
                                <Text style={styles.actionLabel}>{action.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Today's Medicines</Text>
                        <TouchableOpacity onPress={() => navigate('DOSE_TRACKER')}>
                            <Text style={styles.seeAllText}>See all</Text>
                        </TouchableOpacity>
                    </View>
                    {meds.length === 0 ? (
                        <TouchableOpacity style={styles.emptyCard} onPress={() => navigate('SCANNER')}>
                            <Text style={styles.emptyTitle}>No medicines yet</Text>
                            <Text style={styles.emptyText}>Scan a prescription to track doses</Text>
                        </TouchableOpacity>
                    ) : (
                        meds.slice(0, 4).map(med => (
                            <TouchableOpacity
                                key={med.id}
                                style={[styles.medRow, med.taken && styles.medRowDone]}
                                onPress={() => toggleMed(med.id)}
                                activeOpacity={0.75}
                            >
                                <View style={[styles.medTimeBox, med.taken && styles.medTimeBoxDone]}>
                                    <Text style={[styles.medTimeText, med.taken && styles.textDone]}>{med.time}</Text>
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={[styles.medName, med.taken && styles.medNameDone]}>{med.name}</Text>
                                    <Text style={styles.medDose}>{med.dose}</Text>
                                </View>
                                <View style={[styles.medCheck, med.taken && styles.medCheckDone]}>
                                    {med.taken && <Feather name="check" size={14} color="#fff" />}
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Recent Rx</Text>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rxScrollContent}>
                        <TouchableOpacity style={styles.rxCardNew} onPress={() => navigate('SCANNER')}>
                            <LinearGradient colors={GRADIENTS.teal} style={styles.rxNewIconBox}>
                                <Feather name="plus" size={22} color="#fff" />
                            </LinearGradient>
                            <Text style={styles.rxNewText}>Scan New Rx</Text>
                        </TouchableOpacity>
                        {recentScans.map(scan => (
                            <TouchableOpacity
                                key={scan.id}
                                style={styles.rxCard}
                                onPress={() => navigate('PRESCRIPTION_DETAIL', { record: scan.fullRecord, refreshHistory: fetchDashboardData })}
                            >
                                <View style={styles.rxCardTop}>
                                    <LinearGradient colors={GRADIENTS.teal} style={styles.rxIconBox}>
                                        <Feather name="file-text" size={14} color="#fff" />
                                    </LinearGradient>
                                    <Text style={styles.rxDate}>{scan.date}</Text>
                                </View>
                                <Text style={styles.rxCondition} numberOfLines={2}>{scan.condition}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                <View style={styles.section}>
                    <LinearGradient colors={['#0F766E', '#0891B2']} style={styles.insightCard}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.insightTag}>💡  HEALTH TIP</Text>
                            <Text style={styles.insightTitle}>{activeTip.title}</Text>
                            <Text style={styles.insightBody}>{activeTip.body}</Text>
                        </View>
                    </LinearGradient>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { paddingBottom: 28, overflow: 'hidden', position: 'relative' },
    bgDeco1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(13,148,136,0.1)', top: -50, right: -50 },
    bgDeco2: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(8,145,178,0.07)', bottom: 0, left: -30 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 44 : 20, paddingBottom: 18 },
    greeting: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '600', letterSpacing: 0.3 },
    userName: { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -0.5, marginTop: 2 },
    headerActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
    avatarGradient: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 15, fontWeight: '800', color: '#fff' },
    healthCard: { marginHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.11)' },
    healthCardLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: 2 },
    healthScore: { fontSize: 44, fontWeight: '900', color: '#fff', lineHeight: 50, letterSpacing: -1 },
    trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
    trendText: { fontSize: 12, fontWeight: '600', color: '#34D399' },
    adherenceBarBg: { flex: 1, height: 5, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden' },
    adherenceBarFill: { height: 5, backgroundColor: '#5EEAD4', borderRadius: 3 },
    adherenceLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: '500' },
    scoreCircleWrap: { alignItems: 'center', gap: 10, paddingLeft: 14 },
    scoreCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(13,148,136,0.25)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(94,234,212,0.35)' },
    scoreCircleVal: { fontSize: 19, fontWeight: '900', color: '#fff' },
    scoreCircleSub: { fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.45)' },
    streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(245,158,11,0.2)', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10 },
    streakText: { fontSize: 10, fontWeight: '700', color: '#FCD34D' },
    section: { paddingHorizontal: 20, marginTop: 28 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
    seeAllText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
    actionsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
    actionCard: { alignItems: 'center', gap: 8 },
    actionIconBox: { width: 54, height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center', ...SHADOWS.colored },
    actionLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
    medRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.white, borderRadius: 16, padding: 13, marginBottom: 9, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm },
    medRowDone: { opacity: 0.6, backgroundColor: COLORS.lightGray },
    medTimeBox: { alignItems: 'center', minWidth: 36, backgroundColor: COLORS.successBg, paddingVertical: 7, paddingHorizontal: 8, borderRadius: 10 },
    medTimeBoxDone: { backgroundColor: COLORS.lightGray },
    medTimeText: { fontSize: 13, fontWeight: '800', color: COLORS.primary },
    textDone: { color: COLORS.textMuted },
    medName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
    medNameDone: { textDecorationLine: 'line-through', color: COLORS.textSecondary },
    medDose: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
    medCheck: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
    medCheckDone: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    emptyCard: { backgroundColor: COLORS.white, borderRadius: 20, padding: 28, alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border, borderStyle: 'dashed', gap: 8 },
    emptyTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
    emptyText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
    rxScrollContent: { paddingRight: 20, gap: 12 },
    rxCardNew: { width: 120, backgroundColor: COLORS.successBg, borderRadius: 18, padding: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: COLORS.primary, borderStyle: 'dashed' },
    rxNewIconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    rxNewText: { fontSize: 12, fontWeight: '700', color: COLORS.primary, textAlign: 'center' },
    rxCard: { width: 140, backgroundColor: COLORS.white, borderRadius: 18, padding: 15, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm },
    rxCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    rxIconBox: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    rxDate: { fontSize: 10, color: COLORS.textSecondary },
    rxCondition: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
    insightCard: { borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 12, overflow: 'hidden' },
    insightTag: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
    insightTitle: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 4 },
    insightBody: { fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 18 },
});
