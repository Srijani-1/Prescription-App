import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    SafeAreaView, StatusBar, Animated, ActivityIndicator, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SHADOWS } from '../theme';
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import { API_URL } from '../config';

// ─── Helper ────────────────────────────────────────────────────────────────────
const formatDate = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatRelative = (d) => {
    const now = new Date();
    const date = new Date(d);
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return formatDate(d);
};

// ─── Timeline Event Card ────────────────────────────────────────────────────────
const TimelineEvent = ({ item, isLast, onPress }) => {
    return (
        <TouchableOpacity style={tc.wrap} onPress={onPress} activeOpacity={0.8}>
            {/* Vertical line */}
            <View style={tc.lineCol}>
                <LinearGradient colors={['#0D9488', '#0891B2']} style={tc.dot}>
                    <View style={tc.dotInner} />
                </LinearGradient>
                {!isLast && <View style={tc.line} />}
            </View>

            {/* Content */}
            <View style={tc.card}>
                <View style={tc.cardTop}>
                    <View style={{ flex: 1 }}>
                        <Text style={tc.dateText}>{formatRelative(item.date)}</Text>
                        <Text style={tc.titleText} numberOfLines={1}>{item.title}</Text>
                        {item.subtitle ? <Text style={tc.subtitle} numberOfLines={1}>{item.subtitle}</Text> : null}
                    </View>
                    <View style={tc.typeBadge}>
                        <Feather name="file-text" size={10} color={COLORS.textMuted} />
                        <Text style={tc.typeText}>Record</Text>
                    </View>
                </View>

                {/* Medicine chips */}
                {item.medicines && item.medicines.length > 0 && (
                    <View style={tc.medRow}>
                        {item.medicines.slice(0, 3).map((m, i) => (
                            <View key={i} style={tc.medChip}>
                                <Text style={tc.medChipText}>{m}</Text>
                            </View>
                        ))}
                        {item.medicines.length > 3 && (
                            <Text style={tc.moreText}>+{item.medicines.length - 3} more</Text>
                        )}
                    </View>
                )}

                <View style={tc.cardFooter}>
                    {item.confidence != null && (
                        <View style={tc.confRow}>
                            <Feather name="check-circle" size={11} color="#10B981" />
                            <Text style={tc.confText}>Verified AI Record</Text>
                        </View>
                    )}
                    <Feather name="chevron-right" size={14} color={COLORS.textMuted} />
                </View>
            </View>
        </TouchableOpacity>
    );
};

const tc = StyleSheet.create({
    wrap: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 0 },
    lineCol: { width: 32, alignItems: 'center' },
    dot: { 
        width: 18, height: 18, borderRadius: 9, marginTop: 16, zIndex: 1,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 3, borderColor: '#fff', ...SHADOWS.sm,
    },
    dotInner: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
    line: { width: 2, flex: 1, backgroundColor: '#E2E8F0', marginTop: -4, marginBottom: -4 },
    card: {
        flex: 1, marginLeft: 16, backgroundColor: '#FFFFFF',
        borderRadius: 24, padding: 16, marginBottom: 20,
        borderWidth: 1, borderColor: 'rgba(226,232,240,0.8)',
        borderLeftWidth: 4, borderLeftColor: COLORS.primary,
        ...SHADOWS.md,
    },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 12 },
    dateText: { fontSize: 10, fontWeight: '800', color: COLORS.primary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 },
    titleText: { fontSize: 16, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: -0.4 },
    subtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4, lineHeight: 18, fontWeight: '500' },
    typeBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
        backgroundColor: COLORS.lightGray,
    },
    typeText: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted },
    medRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
    medChip: {
        backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 8,
    },
    medChipText: { fontSize: 10, fontWeight: '700', color: COLORS.textPrimary },
    moreText: { fontSize: 10, color: COLORS.textMuted, fontWeight: '700', alignSelf: 'center' },
    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    confRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    confText: { fontSize: 11, color: '#10B981', fontWeight: '600' },
});

// Filter logic removed as requested

// ─── Stats Header ───────────────────────────────────────────────────────────────
const StatsRow = ({ total, thisMonth, meds }) => (
    <LinearGradient colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']} style={stats.card}>
        {[
            { value: total, label: 'Total Rx', icon: 'file-text' },
            { value: thisMonth, label: 'Current Month', icon: 'calendar' },
            { value: meds, label: 'Total Meds', icon: 'pill' },
        ].map((s, i) => (
            <View key={i} style={[stats.item, i < 2 && stats.itemBorder]}>
                <View style={stats.iconRow}>
                    <Feather name={s.icon} size={10} color={COLORS.primary} />
                    <Text style={stats.label}>{s.label}</Text>
                </View>
                <Text style={stats.val}>{s.value}</Text>
            </View>
        ))}
    </LinearGradient>
);

const stats = StyleSheet.create({
    card: {
        flexDirection: 'row', marginHorizontal: 20, borderRadius: 24,
        padding: 20, marginBottom: 24,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)',
        ...SHADOWS.md,
    },
    item: { flex: 1, alignItems: 'center' },
    itemBorder: { borderRightWidth: 1, borderRightColor: '#F1F5F9' },
    iconRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
    val: { fontSize: 24, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: -0.5 },
    label: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
});

export default function PrescriptionTimelineScreen({ user, navigate }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        if (!user?.id) { setLoading(false); return; }
        try {
            const res = await fetch(`${API_URL}api/prescriptions/history?user_id=${user.id}`);
            const data = await res.json();
            if (data.status === 'success') {
                setHistory(data.history.map(item => ({
                    id: item.id,
                    date: item.date,
                    type: item.country === 'Manual' ? 'manual' : 'scan',
                    title: item.results?.[0]?.explanation?.medicine_class || 'Rx Scan',
                    subtitle: `${item.results?.length || 0} medicine${item.results?.length !== 1 ? 's' : ''} · ${item.country || ''}`,
                    medicines: item.results?.map(r => r.medicine) || [],
                    confidence: item.avg_confidence,
                    image_url: item.image_url,
                    fullRecord: {
                        id: item.id,
                        date: item.date,
                        condition: item.results?.[0]?.explanation?.medicine_class || 'General Checkup',
                        doctor: item.results?.[0]?.explanation?.brand_name || 'Prescription Scan',
                        medicines: item.results?.map(r => r.medicine) || [],
                        fullResults: item.results,
                        notes: item.results?.[0]?.explanation?.what_it_does || item.raw_text?.substring(0, 100),
                        image_url: item.image_url
                            ? (item.image_url.startsWith('http') ? item.image_url : `${API_URL.replace(/\/$/, '')}${item.image_url}`)
                            : null,
                        raw_text: item.raw_text,
                        avg_confidence: item.avg_confidence,
                        country: item.country,
                        currency: item.currency,
                    },
                })));
            }
        } catch (e) {
            console.error('Timeline fetch error', e);
        } finally {
            setLoading(false);
        }
    };

    const filtered = history;

    const thisMonth = history.filter(h => {
        const d = new Date(h.date);
        const now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const totalMeds = history.reduce((a, h) => a + (h.medicines?.length || 0), 0);

    // Group by month
    const grouped = {};
    filtered.forEach(h => {
        const key = new Date(h.date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(h);
    });

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.midnight} />

            {/* Header Area */}
            <View style={styles.headerContainer}>
                <LinearGradient 
                    colors={['#0D9488', '#0891B2']} 
                    style={styles.header}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                    <View style={styles.headerTop}>
                        <TouchableOpacity onPress={() => navigate('DASHBOARD')} style={styles.backBtn}>
                            <Feather name="chevron-left" size={24} color="#fff" />
                        </TouchableOpacity>
                        <View style={styles.headerTitleCenter}>
                            <Text style={styles.headerTitle}>Timeline</Text>
                            <Text style={styles.headerSub}>Complete Medical History</Text>
                        </View>
                        <View style={{ width: 32 }} />
                    </View>
                </LinearGradient>
            </View>

            {loading ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Loading your history...</Text>
                </View>
            ) : (
                <Animated.ScrollView
                    style={{ opacity: fadeAnim }}
                    contentContainerStyle={{ paddingBottom: 60, paddingTop: 20 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Stats */}
                    <StatsRow total={history.length} thisMonth={thisMonth} meds={totalMeds} />

                    {filtered.length === 0 ? (
                        <View style={styles.emptyBox}>
                            <MaterialCommunityIcons name="timeline-outline" size={48} color={COLORS.border} />
                            <Text style={styles.emptyTitle}>No prescriptions yet</Text>
                            <Text style={styles.emptyText}>Scan your first prescription to start your health timeline</Text>
                            <TouchableOpacity style={styles.scanCta} onPress={() => navigate('SCANNER')}>
                                <LinearGradient colors={GRADIENTS.teal} style={styles.scanCtaGrad}>
                                    <Feather name="camera" size={16} color="#fff" />
                                    <Text style={styles.scanCtaText}>Scan Prescription</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        Object.entries(grouped).map(([month, items]) => (
                            <View key={month}>
                                {/* Month divider */}
                                <View style={styles.monthRow}>
                                    <View style={styles.monthLine} />
                                    <Text style={styles.monthLabel}>{month}</Text>
                                    <View style={styles.monthLine} />
                                </View>

                                {items.map((item, idx) => (
                                    <TimelineEvent
                                        key={item.id}
                                        item={item}
                                        isLast={idx === items.length - 1}
                                        onPress={() => navigate('PRESCRIPTION_DETAIL', { record: item.fullRecord })}
                                    />
                                ))}
                            </View>
                        ))
                    )}
                </Animated.ScrollView>
            )}
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
    backBtn: {
        width: 32, height: 32, justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
    headerSub: { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },

    centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '700' },

    monthRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16, gap: 12, marginTop: 10 },
    monthLine: { flex: 1, height: 1.5, backgroundColor: 'rgba(13,148,136,0.1)' },
    monthLabel: {
        fontSize: 12, fontWeight: '800', color: COLORS.primary,
        textTransform: 'uppercase', letterSpacing: 1.2,
    },

    emptyBox: {
        alignItems: 'center', padding: 40, gap: 12,
        marginHorizontal: 20, marginTop: 20,
        backgroundColor: COLORS.white, borderRadius: 24,
        borderWidth: 1, borderColor: '#E2E8F0', ...SHADOWS.md,
    },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
    emptyText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 21 },
    scanCta: { marginTop: 12, borderRadius: 16, overflow: 'hidden' },
    scanCtaGrad: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 28, paddingVertical: 14, ...SHADOWS.colored },
    scanCtaText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
