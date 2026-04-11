import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { COLORS } from '../theme';
import { Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { API_URL } from '../config';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const generateWeek = () => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - 3 + i);
        return {
            label: DAYS[d.getDay()],
            date: d.getDate(),
            isToday: i === 3,
            hasDose: i <= 3,
            done: i < 3,
        };
    });
};

export default function DoseTrackerScreen({ user }) {
    const [meds, setMeds] = useState([]);
    const [selectedDay, setSelectedDay] = useState(3);
    const week = generateWeek();

    useEffect(() => {
        if (user?.id) fetchMeds();
    }, [user]);

    const fetchMeds = async () => {
        try {
            const response = await fetch(`${API_URL}api/medications?user_id=${user.id}`);
            const data = await response.json();
            setMeds(data);
        } catch (err) {
            console.error('Error fetching meds:', err);
        }
    };

    const toggleDose = async (medId, timeId) => {
        // Optimistic UI update
        setMeds(prev => prev.map(m => {
            if (m.id !== medId) return m;
            return {
                ...m,
                times: m.times.map(t => t.id === timeId ? { ...t, taken: !t.taken } : t),
            };
        }));
        try {
            await fetch(`${API_URL}api/medications/${medId}/times/${timeId}/toggle`, {
                method: 'PUT'
            });
        } catch (err) {
            console.error('Failed to toggle dose:', err);
            // Revert state on failure (simple strategy, optimally would re-fetch or revert exactly)
            fetchMeds();
        }
    };

    const totalDoses = meds.reduce((acc, m) => acc + m.times.length, 0);
    const takenDoses = meds.reduce((acc, m) => acc + m.times.filter(t => t.taken).length, 0);
    const pct = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Dose Tracker</Text>
                    <View style={styles.streakBadge}>
                        <Text style={styles.streakEmoji}>🔥</Text>
                        <Text style={styles.streakText}>7 day streak</Text>
                    </View>
                </View>

                {/* Calendar strip */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calStrip}>
                    {week.map((day, i) => (
                        <TouchableOpacity
                            key={i}
                            style={[styles.dayPill, selectedDay === i && styles.dayPillActive]}
                            onPress={() => setSelectedDay(i)}
                        >
                            <Text style={[styles.dayLabel, selectedDay === i && styles.dayLabelActive]}>{day.label}</Text>
                            <Text style={[styles.dayNum, selectedDay === i && styles.dayNumActive]}>{day.date}</Text>
                            {day.hasDose && (
                                <View style={[styles.dayDot, day.done ? styles.dayDotDone : styles.dayDotPending]} />
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Progress card */}
                <View style={styles.progressCard}>
                    <View style={styles.progressTop}>
                        <View>
                            <Text style={styles.progressTitle}>Today's progress</Text>
                            <Text style={styles.progressSub}>{takenDoses} of {totalDoses} doses taken</Text>
                        </View>
                        <Text style={styles.progressPct}>{pct}%</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
                    </View>
                    {pct === 100 && (
                        <View style={styles.allDoneRow}>
                            <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                            <Text style={styles.allDoneText}>All doses complete for today! 🎉</Text>
                        </View>
                    )}
                </View>

                {/* Medicine list */}
                {meds.map(med => (
                    <View key={med.id} style={styles.medSection}>
                        <View style={styles.medSectionHeader}>
                            <View style={[styles.medColorDot, { backgroundColor: med.color }]} />
                            <Text style={styles.medSectionName}>{med.name}</Text>
                            <Text style={styles.medSectionDose}>{med.dose}</Text>
                        </View>

                        {med.times.map(t => (
                            <TouchableOpacity
                                key={t.id}
                                style={[styles.doseRow, t.taken && styles.doseRowDone]}
                                onPress={() => toggleDose(med.id, t.id)}
                                activeOpacity={0.75}
                            >
                                <View style={[styles.timeIcon, { backgroundColor: med.colorBg }]}>
                                    <MaterialCommunityIcons name={t.icon} size={18} color={med.color} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.doseTime, t.taken && styles.doseTimeDone]}>{t.time}</Text>
                                    <Text style={styles.doseLabel}>{t.label}</Text>
                                </View>
                                <View style={[styles.checkCircle, t.taken && { backgroundColor: med.color, borderColor: med.color }]}>
                                    {t.taken && <Feather name="check" size={14} color={COLORS.white} />}
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}

                {/* Add reminder tip */}
                <View style={styles.tipRow}>
                    <Ionicons name="notifications-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.tipText}>Set phone reminders for your medicine times to never miss a dose.</Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12,
    },
    headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
    streakBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: '#FFF7ED', paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 20, borderWidth: 1, borderColor: '#FDE68A',
    },
    streakEmoji: { fontSize: 16 },
    streakText: { fontSize: 13, fontWeight: '700', color: COLORS.warningText },
    calStrip: { paddingHorizontal: 20, gap: 8, paddingBottom: 4 },
    dayPill: {
        alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14,
        borderRadius: 14, backgroundColor: COLORS.white,
        borderWidth: 1, borderColor: COLORS.border, gap: 4,
    },
    dayPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    dayLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
    dayLabelActive: { color: 'rgba(255,255,255,0.8)' },
    dayNum: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
    dayNumActive: { color: COLORS.white },
    dayDot: { width: 6, height: 6, borderRadius: 3 },
    dayDotDone: { backgroundColor: '#22C55E' },
    dayDotPending: { backgroundColor: COLORS.warningText },
    progressCard: {
        margin: 20, marginBottom: 12, backgroundColor: COLORS.white,
        borderRadius: 18, padding: 18, borderWidth: 1, borderColor: COLORS.border,
    },
    progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
    progressTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
    progressSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
    progressPct: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
    progressBarBg: { height: 8, backgroundColor: COLORS.lightGray, borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: 8, backgroundColor: COLORS.primary, borderRadius: 4, minWidth: 4 },
    allDoneRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
    allDoneText: { fontSize: 13, fontWeight: '600', color: '#16A34A' },
    medSection: {
        marginHorizontal: 20, marginBottom: 16, backgroundColor: COLORS.white,
        borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border,
    },
    medSectionHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        padding: 14, backgroundColor: COLORS.lightGray,
        borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    medColorDot: { width: 10, height: 10, borderRadius: 5 },
    medSectionName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
    medSectionDose: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
    doseRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 14, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    doseRowDone: { opacity: 0.65 },
    timeIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    doseTime: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
    doseTimeDone: { textDecorationLine: 'line-through' },
    doseLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
    checkCircle: {
        width: 28, height: 28, borderRadius: 14,
        borderWidth: 2, borderColor: COLORS.border,
        justifyContent: 'center', alignItems: 'center',
    },
    tipRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        marginHorizontal: 20, padding: 14, backgroundColor: COLORS.successBg,
        borderRadius: 14, borderWidth: 1, borderColor: COLORS.border,
    },
    tipText: { flex: 1, fontSize: 13, color: COLORS.primaryDark, lineHeight: 19 },
});
