import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    SafeAreaView, StatusBar, Animated, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SHADOWS } from '../theme';
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import { API_URL } from '../config';

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
    // We use a single consistent theme since type badges are removed
    const accentColor = GRADIENTS.teal;

    return (
        <TouchableOpacity style={tc.wrap} onPress={onPress} activeOpacity={0.8}>
            <View style={tc.lineCol}>
                <LinearGradient colors={accentColor} style={tc.dot} />
                {!isLast && <View style={tc.line} />}
            </View>

            <View style={tc.card}>
                <View style={tc.cardTop}>
                    <View style={{ flex: 1 }}>
                        <Text style={tc.dateText}>{formatRelative(item.date)}</Text>
                        <Text style={tc.titleText} numberOfLines={1}>{item.title}</Text>
                        {item.subtitle ? <Text style={tc.subtitle} numberOfLines={1}>{item.subtitle}</Text> : null}
                    </View>
                </View>

                {/* Medicine chips */}
                {item.medicines && item.medicines.length > 0 && (
                    <View style={tc.medRow}>
                        {item.medicines.slice(0, 3).map((m, i) => (
                            <View key={i} style={tc.medChip}>
                                <MaterialCommunityIcons name="pill" size={10} color={COLORS.primary} />
                                <Text style={tc.medChipText}>{m}</Text>
                            </View>
                        ))}
                        {item.medicines.length > 3 && (
                            <Text style={tc.moreText}>+{item.medicines.length - 3} more</Text>
                        )}
                    </View>
                )}

                {item.confidence != null && item.type === 'scan' && (
                    <View style={tc.confRow}>
                        <Feather name="bar-chart-2" size={11} color={COLORS.textMuted} />
                        <Text style={tc.confText}>
                            {Math.round(item.confidence * (item.confidence <= 1 ? 100 : 1))}% Analysis Accuracy
                        </Text>
                    </View>
                )}

                <Feather name="chevron-right" size={16} color={COLORS.border} style={tc.arrow} />
            </View>
        </TouchableOpacity>
    );
};

const tc = StyleSheet.create({
    wrap: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 4 },
    lineCol: { width: 32, alignItems: 'center' },
    dot: { width: 14, height: 14, borderRadius: 7, marginTop: 18, zIndex: 1 },
    line: { width: 2, flex: 1, backgroundColor: COLORS.border, marginTop: 2 },
    card: {
        flex: 1, marginLeft: 12, backgroundColor: COLORS.white,
        borderRadius: 16, padding: 14, marginBottom: 12,
        borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm,
    },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
    dateText: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, marginBottom: 2 },
    titleText: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
    subtitle: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
    medRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 6 },
    medChip: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: COLORS.successBg, paddingHorizontal: 7, paddingVertical: 3,
        borderRadius: 6, borderWidth: 1, borderColor: COLORS.border,
    },
    medChipText: { fontSize: 10, fontWeight: '600', color: COLORS.primary },
    moreText: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600', alignSelf: 'center' },
    confRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    confText: { fontSize: 11, color: COLORS.textMuted },
    arrow: { position: 'absolute', right: 12, top: 18 },
});

// ─── Stats Header ───────────────────────────────────────────────────────────────
const StatsRow = ({ total, meds }) => (
    <LinearGradient colors={['#134E4A', '#0F766E']} style={stats.card}>
        {[
            { value: total, label: 'Total Records' },
            { value: meds, label: 'Total Medicines' },
        ].map((s, i) => (
            <View key={i} style={[stats.item, i === 0 && stats.itemBorder]}>
                <Text style={stats.val}>{s.value}</Text>
                <Text style={stats.label}>{s.label}</Text>
            </View>
        ))}
    </LinearGradient>
);

const stats = StyleSheet.create({
    card: { flexDirection: 'row', marginHorizontal: 20, borderRadius: 18, padding: 16, marginBottom: 20 },
    item: { flex: 1, alignItems: 'center' },
    itemBorder: { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.2)' },
    val: { fontSize: 26, fontWeight: '900', color: '#fff' },
    label: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginTop: 3 },
});

// ─── Main Screen ────────────────────────────────────────────────────────────────
export default function PrescriptionTimelineScreen({ user, navigate, goBack, memberId: propMemberId, memberName: propMemberName }) {
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
            let url = `${API_URL}api/prescriptions/history?user_id=${user.id}`;
            if (propMemberId) url += `&member_id=${propMemberId}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.status === 'success') {
                setHistory(data.history.map(item => ({
                    id: item.id,
                    date: item.date,
                    type: item.country === 'Manual' ? 'manual' : 'scan',
                    title: item.results?.[0]?.explanation?.medicine_class || 'Medical Visit',
                    subtitle: `${item.results?.length || 0} items identified`,
                    medicines: item.results?.map(r => r.medicine) || [],
                    confidence: item.avg_confidence,
                    fullRecord: { ...item } // Store full data for detail screen
                })));
            }
        } catch (e) {
            console.error('Timeline fetch error', e);
        } finally {
            setLoading(false);
        }
    };

    const totalMeds = history.reduce((a, h) => a + (h.medicines?.length || 0), 0);

    // Group by month
    const grouped = {};
    history.forEach(h => {
        const key = new Date(h.date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(h);
    });

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.midnight} />

            <LinearGradient colors={GRADIENTS.hero} style={styles.header}>
                <View style={styles.bgDeco} />
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => goBack()} style={styles.backBtn}>
                        <Feather name="arrow-left" size={20} color="#fff" />
                    </TouchableOpacity>
                    <View style={{ flex: 1, paddingLeft: 14 }}>
                        <Text style={styles.headerTitle}>{propMemberName ? `${propMemberName}'s Timeline` : 'Health Timeline'}</Text>
                        <Text style={styles.headerSub}>Complete record of medications</Text>
                    </View>
                    <TouchableOpacity style={styles.refreshBtn} onPress={fetchHistory}>
                        <Feather name="refresh-cw" size={16} color="#fff" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {loading ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <Animated.ScrollView
                    style={{ opacity: fadeAnim }}
                    contentContainerStyle={{ paddingBottom: 60, paddingTop: 20 }}
                    showsVerticalScrollIndicator={false}
                >
                    <StatsRow total={history.length} meds={totalMeds} />

                    {history.length === 0 ? (
                        <View style={styles.emptyBox}>
                            <MaterialCommunityIcons name="calendar-clock" size={48} color={COLORS.border} />
                            <Text style={styles.emptyTitle}>No history yet</Text>
                            <Text style={styles.emptyText}>Your timeline will appear here once you add a record.</Text>
                        </View>
                    ) : (
                        Object.entries(grouped).map(([month, items]) => (
                            <View key={month}>
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
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { paddingBottom: 24, overflow: 'hidden' },
    bgDeco: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)', top: -60, right: -60 },
    headerTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    refreshBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff' },
    headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
    centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    monthRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15, gap: 10 },
    monthLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
    monthLabel: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
    emptyBox: { alignItems: 'center', padding: 40, marginTop: 40 },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary, marginTop: 15 },
    emptyText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8 },
});