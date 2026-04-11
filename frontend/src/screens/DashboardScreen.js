import React, { useState, useEffect } from 'react';import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    SafeAreaView, StatusBar,
} from 'react-native';
import { COLORS } from '../theme';
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import { API_URL } from '../config';


const QUICK_ACTIONS = [
    { label: 'Scan Rx', icon: 'camera-outline', iconLib: 'Ionicons', color: COLORS.primary, bg: COLORS.successBg, screen: 'SCANNER' },
    { label: 'Drug Check', icon: 'alert-circle-outline', iconLib: 'Ionicons', color: COLORS.accent, bg: COLORS.accentBg, screen: 'DRUG_INTERACTION' },
    { label: 'Pharmacy', icon: 'location-outline', iconLib: 'Ionicons', color: COLORS.warningText, bg: COLORS.warningBg, screen: 'PHARMACY' },
    { label: 'Ask AI', icon: 'chatbubble-ellipses-outline', iconLib: 'Ionicons', color: '#06B6D4', bg: '#ECFEFF', screen: 'ASK_AI' },
];

const RECENT_SCANS = [
    { id: '1', date: 'Today', doctor: 'Dr. Mehta', meds: 3, condition: 'Fever & Cold' },
    { id: '2', date: 'Jun 12', doctor: 'Dr. Patel', meds: 2, condition: 'Seasonal Allergy' },
    { id: '3', date: 'May 28', doctor: 'Dr. Roy', meds: 4, condition: 'Hypertension' },
];

export default function DashboardScreen({ user, navigate }) {
    const [meds, setMeds] = useState([]);
    const [recentScans, setRecentScans] = useState(RECENT_SCANS);

    useEffect(() => {
        if (user?.id) {
            fetchDashboardData();
        }
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            const [histRes, medsRes] = await Promise.all([
                fetch(`${API_URL}api/prescriptions/history?user_id=${user.id}`),
                fetch(`${API_URL}api/medications?user_id=${user.id}`)
            ]);

            const data = await histRes.json();
            if (data.status === 'success') {
                const formattedScans = data.history.map(item => {
                    const d = new Date(item.date);
                    const isToday = new Date().toDateString() === d.toDateString();
                    return {
                        id: item.id.toString(),
                        date: isToday ? 'Today' : d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
                        doctor: item.results?.[0]?.explanation?.brand_name || 'Rx Scan',
                        meds: item.results ? item.results.length : 0,
                        condition: item.results?.[0]?.explanation?.medicine_class || 'General'
                    };
                }).slice(0, 5);
                
                if (formattedScans.length > 0) {
                    setRecentScans(formattedScans);
                }
            }

            const medsData = await medsRes.json();
            if (medsData && Array.isArray(medsData)) {
                let flattenedMeds = [];
                medsData.forEach(med => {
                    if (med.times && med.times.length > 0) {
                        med.times.forEach(t => {
                            flattenedMeds.push({
                                id: `${med.id}_${t.id}`,
                                medId: med.id,
                                timeId: t.id,
                                name: med.name,
                                dose: med.dose,
                                time: t.time,
                                taken: t.taken,
                                icon: t.icon || 'pill'
                            });
                        });
                    }
                });
                setMeds(flattenedMeds);
            }
        } catch (err) {
            console.error('Dashboard fetch error:', err);
        }
    };

    const takenCount = meds.filter(m => m.taken).length;
    const adherencePct = meds.length > 0 ? Math.round((takenCount / meds.length) * 100) : 0;

    const toggleMed = async (id) => {
        const medToToggle = meds.find(m => m.id === id);
        if(!medToToggle) return;

        setMeds(prev => prev.map(m => m.id === id ? { ...m, taken: !m.taken } : m));
        
        if (medToToggle.medId && medToToggle.timeId) {
            try {
                await fetch(`${API_URL}api/medications/${medToToggle.medId}/times/${medToToggle.timeId}/toggle`, {
                    method: 'PUT'
                });
            } catch (err) {
                console.error('Toggle error:', err);
            }
        }
    };

    const getGreeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const renderIcon = (action) => {
        if (action.iconLib === 'Ionicons') return <Ionicons name={action.icon} size={22} color={action.color} />;
        return <MaterialCommunityIcons name={action.icon} size={22} color={action.color} />;
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>{getGreeting()},</Text>
                        <Text style={styles.userName}>{user?.name?.split(' ')[0] || user?.full_name?.split(' ')[0] || 'there'} 👋</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity style={styles.notifBtn} onPress={() => navigate('HISTORY')}>
                            <MaterialCommunityIcons name="clipboard-text-outline" size={20} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.notifBtn} onPress={() => navigate('PROFILE')}>
                            <Feather name="user" size={20} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Adherence card */}
                <View style={styles.adherenceCard}>
                    <View style={styles.adherenceLeft}>
                        <Text style={styles.adherenceTitle}>Today's adherence</Text>
                        <Text style={styles.adherencePct}>{adherencePct}%</Text>
                        <Text style={styles.adherenceSub}>{takenCount} of {meds.length} medicines taken</Text>
                        <View style={styles.adherenceBar}>
                            <View style={[styles.adherenceFill, { width: `${adherencePct}%` }]} />
                        </View>
                    </View>
                    <View style={styles.streakBox}>
                        <Text style={styles.streakEmoji}>🔥</Text>
                        <Text style={styles.streakNum}>7</Text>
                        <Text style={styles.streakLabel}>day streak</Text>
                    </View>
                </View>

                {/* Quick actions */}
                <Text style={styles.sectionTitle}>Quick actions</Text>
                <View style={styles.actionsGrid}>
                    {QUICK_ACTIONS.map((action, i) => (
                        <TouchableOpacity
                            key={i}
                            style={[styles.actionCard, { backgroundColor: action.bg }]}
                            onPress={() => navigate(action.screen)}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.actionIconBox, { backgroundColor: action.color + '20' }]}>
                                {renderIcon(action)}
                            </View>
                            <Text style={[styles.actionLabel, { color: action.color }]}>{action.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Today's medicines */}
                <View style={styles.sectionRow}>
                    <Text style={styles.sectionTitle}>Today's medicines</Text>
                    <TouchableOpacity onPress={() => navigate('DOSE_TRACKER')}>
                        <Text style={styles.seeAll}>See all</Text>
                    </TouchableOpacity>
                </View>

                {meds.map((med) => (
                    <TouchableOpacity
                        key={med.id}
                        style={styles.medRow}
                        onPress={() => toggleMed(med.id)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.medCheck, med.taken && styles.medCheckDone]}>
                            {med.taken && <Feather name="check" size={14} color={COLORS.white} />}
                        </View>
                        <View style={styles.medIconBox}>
                            <MaterialCommunityIcons name={med.icon} size={20} color={med.taken ? COLORS.textSecondary : COLORS.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.medName, med.taken && styles.medNameDone]}>{med.name}</Text>
                            <Text style={styles.medDose}>{med.dose} · {med.time}</Text>
                        </View>
                        <View style={[styles.medStatus, med.taken ? styles.medStatusDone : styles.medStatusPending]}>
                            <Text style={[styles.medStatusText, med.taken ? styles.medStatusTextDone : styles.medStatusTextPending]}>
                                {med.taken ? 'Taken' : 'Pending'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}

                {/* Recent scans */}
                <View style={styles.sectionRow}>
                    <Text style={styles.sectionTitle}>Recent prescriptions</Text>
                    <TouchableOpacity onPress={() => navigate('HISTORY')}>
                        <Text style={styles.seeAll}>See all</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scanScroll}>
                    <TouchableOpacity style={[styles.scanCard, styles.scanCardNew]} onPress={() => navigate('SCANNER')}>
                        <View style={styles.scanNewIcon}>
                            <Feather name="plus" size={28} color={COLORS.primary} />
                        </View>
                        <Text style={styles.scanNewText}>Scan new prescription</Text>
                    </TouchableOpacity>
                    {recentScans.map(scan => (
                        <TouchableOpacity key={scan.id} style={styles.scanCard} onPress={() => navigate('SCANNER')} activeOpacity={0.8}>
                            <View style={styles.scanTop}>
                                <View style={styles.scanIcon}>
                                    <Feather name="file-text" size={20} color={COLORS.primary} />
                                </View>
                                <Text style={styles.scanDate}>{scan.date}</Text>
                            </View>
                            <Text style={styles.scanCondition}>{scan.condition}</Text>
                            <Text style={styles.scanDoctor}>{scan.doctor}</Text>
                            <View style={styles.scanBadge}>
                                <MaterialCommunityIcons name="pill" size={12} color={COLORS.primary} />
                                <Text style={styles.scanMeds}>{scan.meds} medicines</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Health tip */}
                <View style={styles.tipCard}>
                    <View style={styles.tipIcon}>
                        <Ionicons name="bulb-outline" size={20} color={COLORS.warningText} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.tipTitle}>Health tip</Text>
                        <Text style={styles.tipText}>Generic medicines contain the same active ingredient as branded ones. Ask your pharmacist about generics to save up to 80%.</Text>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
        paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16,
    },
    greeting: { fontSize: 14, color: COLORS.textSecondary },
    userName: { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary },
    notifBtn: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: COLORS.border, position: 'relative',
    },
    notifDot: {
        position: 'absolute', top: 10, right: 10,
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: COLORS.dangerText, borderWidth: 1.5, borderColor: COLORS.white,
    },
    adherenceCard: {
        marginHorizontal: 20, marginBottom: 24, padding: 20,
        backgroundColor: COLORS.primary, borderRadius: 20,
        flexDirection: 'row', alignItems: 'center',
    },
    adherenceLeft: { flex: 1 },
    adherenceTitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 4, fontWeight: '600' },
    adherencePct: { fontSize: 36, fontWeight: '800', color: COLORS.white, lineHeight: 40 },
    adherenceSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2, marginBottom: 12 },
    adherenceBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 3, overflow: 'hidden' },
    adherenceFill: { height: 6, backgroundColor: COLORS.white, borderRadius: 3 },
    streakBox: { alignItems: 'center', paddingLeft: 20 },
    streakEmoji: { fontSize: 28 },
    streakNum: { fontSize: 24, fontWeight: '800', color: COLORS.white },
    streakLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, paddingHorizontal: 20, marginBottom: 12 },
    sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 20 },
    seeAll: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
    actionsGrid: {
        flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 12, marginBottom: 24,
    },
    actionCard: {
        width: '47%', padding: 16, borderRadius: 16, alignItems: 'flex-start', gap: 10,
    },
    actionIconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    actionLabel: { fontSize: 14, fontWeight: '700' },
    medRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: COLORS.white, marginHorizontal: 20, marginBottom: 8,
        padding: 14, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border,
    },
    medCheck: {
        width: 24, height: 24, borderRadius: 12, borderWidth: 2,
        borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center',
    },
    medCheckDone: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    medIconBox: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: COLORS.lightGray, justifyContent: 'center', alignItems: 'center',
    },
    medName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
    medNameDone: { textDecorationLine: 'line-through', color: COLORS.textSecondary },
    medDose: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
    medStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
    medStatusDone: { backgroundColor: COLORS.successBg },
    medStatusPending: { backgroundColor: COLORS.warningBg },
    medStatusText: { fontSize: 12, fontWeight: '600' },
    medStatusTextDone: { color: COLORS.primary },
    medStatusTextPending: { color: COLORS.warningText },
    scanScroll: { paddingHorizontal: 20, gap: 12, paddingBottom: 4 },
    scanCard: {
        width: 160, backgroundColor: COLORS.white, borderRadius: 16, padding: 16,
        borderWidth: 1, borderColor: COLORS.border,
    },
    scanTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    scanIcon: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: COLORS.successBg, justifyContent: 'center', alignItems: 'center',
    },
    scanDate: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
    scanCondition: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
    scanDoctor: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 10 },
    scanBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: COLORS.successBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
        alignSelf: 'flex-start',
    },
    scanMeds: { fontSize: 11, fontWeight: '600', color: COLORS.primary },
    scanCardNew: {
        justifyContent: 'center', alignItems: 'center', gap: 8,
        borderStyle: 'dashed', borderColor: COLORS.primary + '60', backgroundColor: COLORS.successBg,
    },
    scanNewIcon: {
        width: 52, height: 52, borderRadius: 26,
        backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center',
    },
    scanNewText: { fontSize: 13, fontWeight: '600', color: COLORS.primary, textAlign: 'center' },
    tipCard: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 12,
        margin: 20, padding: 16, backgroundColor: COLORS.warningBg,
        borderRadius: 16, borderWidth: 1, borderColor: '#FDE68A',
    },
    tipIcon: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center',
    },
    tipTitle: { fontSize: 13, fontWeight: '700', color: COLORS.warningText, marginBottom: 4 },
    tipText: { fontSize: 13, color: '#92400E', lineHeight: 19 },
});
