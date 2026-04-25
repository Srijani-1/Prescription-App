import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform,
    TextInput, Animated, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '../theme';
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
            fullDate: d,
            isToday: i === 3,
            isPast: i < 3,
            isFuture: i > 3,
        };
    });
};

const getDateString = (dayIndex) => {
    const today = new Date();
    const d = new Date(today);
    d.setDate(today.getDate() - 3 + dayIndex);
    return d.toISOString().split('T')[0];
};

// ─── Member Header Strip ───────────────────────────────────────────────────────
const MemberStrip = ({ memberName, onClear, avatarGrad = ['#7C3AED', '#6D28D9'] }) => (
    <View style={ms.wrap}>
        <LinearGradient colors={avatarGrad} style={ms.avatar}>
            <Text style={ms.avatarText}>{memberName[0].toUpperCase()}</Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
            <Text style={ms.sub}>Tracking doses for</Text>
            <Text style={ms.name}>{memberName}</Text>
        </View>
        <TouchableOpacity style={ms.btn} onPress={onClear}>
            <Feather name="user" size={12} color={COLORS.primary} />
            <Text style={ms.btnText}>My Doses</Text>
        </TouchableOpacity>
    </View>
);
const ms = StyleSheet.create({
    wrap: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        marginHorizontal: 16, marginTop: 10, marginBottom: 2,
        backgroundColor: '#fff', borderRadius: 16, padding: 12,
        borderWidth: 1.5, borderColor: COLORS.primary + '40', ...SHADOWS.sm,
    },
    avatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 15, fontWeight: '900', color: '#fff' },
    sub: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600' },
    name: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
    btn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        backgroundColor: COLORS.successBg, paddingHorizontal: 10, paddingVertical: 6,
        borderRadius: 10, borderWidth: 1, borderColor: COLORS.border,
    },
    btnText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DoseTrackerScreen({
    user, navigate, goBack, currentScreen,
    memberId: propMemberId, memberName: propMemberName,
}) {
    const [activeMemberId, setActiveMemberId] = useState(propMemberId || null);
    const [activeMemberName, setActiveMemberName] = useState(propMemberName || null);

    const [meds, setMeds] = useState([]);
    const [selectedDay, setSelectedDay] = useState(3);
    const [editingTimeId, setEditingTimeId] = useState(null);
    const [editHour, setEditHour] = useState('');
    const [editMin, setEditMin] = useState('');
    const [editAmPm, setEditAmPm] = useState('');
    const [streak, setStreak] = useState(0);

    const week = generateWeek();

    // ── Animation refs ────────────────────────────────────────────────────────
    const progressAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;  // screen mount
    const listFade = useRef(new Animated.Value(1)).current;  // list swap
    const listSlide = useRef(new Animated.Value(0)).current;  // list swap

    // ── Sync props ────────────────────────────────────────────────────────────
    useEffect(() => {
        setActiveMemberId(propMemberId || null);
        setActiveMemberName(propMemberName || null);
    }, [propMemberId, propMemberName]);

    // ── fetchMeds: fade out → fetch → fade in ────────────────────────────────
    const fetchMeds = useCallback(async (dayIndex) => {
        if (!user?.id) return;

        // Fade + slide list out
        await new Promise(resolve =>
            Animated.parallel([
                Animated.timing(listFade, { toValue: 0, duration: 110, useNativeDriver: true }),
                Animated.timing(listSlide, { toValue: 10, duration: 110, useNativeDriver: true }),
            ]).start(resolve)
        );

        try {
            const dateStr = getDateString(dayIndex);
            let url = `${API_URL}api/medications?user_id=${user.id}&date=${dateStr}`;
            if (activeMemberId) url += `&member_id=${activeMemberId}`;
            const res = await fetch(url);
            const data = await res.json();
            setMeds(data);
        } catch (err) {
            console.error('Error fetching meds:', err);
        }

        // Fade + spring list back in
        Animated.parallel([
            Animated.timing(listFade, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.spring(listSlide, { toValue: 0, speed: 30, bounciness: 5, useNativeDriver: true }),
        ]).start();

    }, [user, activeMemberId]);

    const fetchStreak = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}api/user/health-score?user_id=${user.id}`);
            const data = await res.json();
            if (data.status === 'success') setStreak(data.streak || 0);
        } catch (err) { console.error('Error fetching streak:', err); }
    }, [user]);

    // Screen mount animation
    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
        fetchStreak();
    }, []);

    // Re-fetch on day / member change
    useEffect(() => {
        fetchMeds(selectedDay);
    }, [fetchMeds, selectedDay]);

    // ── Progress — animates smoothly between values, never jumps to 0 ─────────
    const totalDoses = meds.reduce((acc, m) => acc + (m.times?.length || 0), 0);
    const takenDoses = meds.reduce((acc, m) => acc + (m.times?.filter(t => t.taken).length || 0), 0);
    const pct = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

    useEffect(() => {
        Animated.timing(progressAnim, { toValue: pct, duration: 500, useNativeDriver: false }).start();
    }, [pct]);

    const progressWidth = progressAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
    const getProgressColor = () =>
        pct >= 80 ? ['#059669', '#10B981'] :
            pct >= 50 ? ['#D97706', '#F59E0B'] :
                ['#DC2626', '#EF4444'];

    // ── Day pill tap ──────────────────────────────────────────────────────────
    const handleDayPress = (i) => {
        if (i === selectedDay) return;
        setSelectedDay(i); // triggers fetchMeds via useEffect above
    };

    // ── Header label ──────────────────────────────────────────────────────────
    const selectedDayInfo = week[selectedDay];
    const dayLabel = selectedDayInfo.isToday
        ? "Today's Progress"
        : selectedDayInfo.isPast
            ? `${selectedDayInfo.label} ${selectedDayInfo.date} Progress`
            : `${selectedDayInfo.label} ${selectedDayInfo.date} (Upcoming)`;

    const isFutureDay = selectedDayInfo?.isFuture;

    // ── Toggle dose ───────────────────────────────────────────────────────────
    const toggleDose = async (medId, timeId) => {
        // Optimistic update — no fade needed, instant feel
        setMeds(prev => prev.map(m => {
            if (m.id !== medId) return m;
            return { ...m, times: m.times.map(t => t.id === timeId ? { ...t, taken: !t.taken } : t) };
        }));

        const dateStr = getDateString(selectedDay);
        try {
            const res = await fetch(
                `${API_URL}api/medications/${medId}/times/${timeId}/toggle?date=${dateStr}`,
                { method: 'PUT' }
            );
            if (res.ok) fetchStreak();
            else fetchMeds(selectedDay);
        } catch {
            fetchMeds(selectedDay);
        }
    };

    const handleDeleteMed = async (medId) => {
        try {
            const res = await fetch(`${API_URL}api/medications/${medId}`, { method: 'DELETE' });
            if (res.ok) fetchMeds(selectedDay);
        } catch (err) { console.error('Failed to delete med:', err); }
    };

    const handleUpdateTime = async (medId, timeId) => {
        const timeStr = `${editHour}:${editMin} ${editAmPm}`;
        try {
            const res = await fetch(`${API_URL}api/medications/${medId}/times/${timeId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ time: timeStr }),
            });
            if (res.ok) { setEditingTimeId(null); fetchMeds(selectedDay); }
        } catch (err) { console.error('Failed to update time:', err); }
    };

    const startEditing = (t) => {
        const [time, ampm] = t.time.split(' ');
        const [h, m] = time.split(':');
        setEditHour(h); setEditMin(m); setEditAmPm(ampm);
        setEditingTimeId(t.id);
    };

    const screenTitle = activeMemberName ? `${activeMemberName}'s Doses` : 'Dose Tracker';

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

                {/* ── Header ── */}
                <LinearGradient colors={['#0A1628', '#0F2535']} style={styles.header}>
                    <View style={styles.bgDeco} />
                    <View style={styles.headerTop}>
                        <TouchableOpacity style={styles.backBtn} onPress={() => goBack()}>
                            <Feather name="arrow-left" size={20} color="rgba(255,255,255,0.8)" />
                        </TouchableOpacity>
                        <View style={{ flex: 1, paddingLeft: 14 }}>
                            <Text style={styles.headerTitle}>{screenTitle}</Text>
                            <Text style={styles.headerSub}>
                                {activeMemberName ? `Daily schedule for ${activeMemberName}` : 'Stay consistent, stay healthy'}
                            </Text>
                        </View>
                        <View style={styles.headerRight}>
                            <View style={styles.streakBadge}>
                                <Text style={styles.streakEmoji}>🔥</Text>
                                <Text style={styles.streakText}>{streak}d</Text>
                            </View>
                        </View>
                    </View>

                    {/* Progress card */}
                    <View style={styles.progressCard}>
                        <View style={styles.progressTop}>
                            <View>
                                <Text style={styles.progressLabel}>{dayLabel}</Text>
                                <Text style={styles.progressSub}>{takenDoses} of {totalDoses} doses taken</Text>
                            </View>
                            <Text style={styles.progressPct}>{pct}%</Text>
                        </View>
                        <View style={styles.progressBarBg}>
                            <Animated.View style={[styles.progressBarFill, { width: progressWidth }]}>
                                <LinearGradient
                                    colors={getProgressColor()}
                                    style={StyleSheet.absoluteFillObject}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                />
                            </Animated.View>
                        </View>
                        {pct === 100 && totalDoses > 0 && (
                            <View style={styles.allDoneRow}>
                                <Ionicons name="checkmark-circle" size={16} color="#34D399" />
                                <Text style={styles.allDoneText}>
                                    All doses complete{activeMemberName ? ` for ${activeMemberName}` : ''}! 🎉
                                </Text>
                            </View>
                        )}
                    </View>
                </LinearGradient>

                {/* Member strip */}
                {activeMemberName && (
                    <MemberStrip
                        memberName={activeMemberName}
                        onClear={() => { setActiveMemberId(null); setActiveMemberName(null); }}
                    />
                )}

                {/* ── Calendar strip ── */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calStrip}>
                    {week.map((day, i) => {
                        const isActive = i === selectedDay;
                        return (
                            <TouchableOpacity
                                key={i}
                                style={[
                                    styles.dayPill,
                                    isActive && styles.dayPillActive,
                                    day.isFuture && !isActive && styles.dayPillFuture,
                                ]}
                                onPress={() => handleDayPress(i)}
                                activeOpacity={0.75}
                            >
                                <Text style={[
                                    styles.dayLabel,
                                    isActive && styles.dayLabelActive,
                                    day.isFuture && !isActive && styles.dayLabelFuture,
                                ]}>
                                    {day.label}
                                </Text>
                                <Text style={[
                                    styles.dayNum,
                                    isActive && styles.dayNumActive,
                                    day.isFuture && !isActive && styles.dayNumFuture,
                                ]}>
                                    {day.date}
                                </Text>
                                <View style={[
                                    styles.dayDot,
                                    day.isPast ? styles.dayDotDone :
                                        day.isToday ? styles.dayDotToday :
                                            styles.dayDotFuture,
                                ]} />
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Future-day banner */}
                {isFutureDay && (
                    <View style={styles.futureBanner}>
                        <Ionicons name="time-outline" size={15} color={COLORS.textMuted} />
                        <Text style={styles.futureBannerText}>
                            You can't mark future doses. Come back on {week[selectedDay].label} {week[selectedDay].date}.
                        </Text>
                    </View>
                )}

                {/* ── Medicine list — fades + slides on day switch ── */}
                <Animated.View style={{
                    opacity: listFade,
                    transform: [{ translateY: listSlide }],
                    paddingHorizontal: 16,
                    paddingTop: 8,
                }}>
                    {meds.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="pill-off" size={40} color={COLORS.border} />
                            <Text style={styles.emptyTitle}>No medications</Text>
                            <Text style={styles.emptyText}>
                                {activeMemberName
                                    ? `No medications found for ${activeMemberName}`
                                    : 'No medications found'}
                            </Text>
                        </View>
                    ) : meds.map(med => (
                        <View key={med.id} style={styles.medSection}>
                            <View style={styles.medSectionHeader}>
                                <View style={[styles.medColorDot, { backgroundColor: med.color || COLORS.primary }]} />
                                <Text style={styles.medSectionName}>{med.name}</Text>
                                <View style={{ alignItems: 'flex-end', marginRight: 10 }}>
                                    <Text style={styles.medSectionDose}>{med.dose || '-'}</Text>
                                    <Text style={[styles.medSectionDose, { fontSize: 10, opacity: 0.6 }]}>{med.frequency || '-'}</Text>
                                </View>
                                <TouchableOpacity onPress={() => handleDeleteMed(med.id)} style={styles.deleteBtn}>
                                    <Feather name="trash-2" size={14} color={COLORS.dangerText} />
                                </TouchableOpacity>
                            </View>

                            {(med.times || []).map(t => (
                                <View key={t.id} style={[styles.doseRow, t.taken && styles.doseRowDone]}>
                                    {editingTimeId === t.id ? (
                                        <View style={[styles.doseMainArea, { backgroundColor: '#fff' }]}>
                                            <View style={[styles.timeIcon, { backgroundColor: med.colorBg || COLORS.successBg }]}>
                                                <MaterialCommunityIcons name={t.icon || 'pill'} size={18} color={med.color || COLORS.primary} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <View style={styles.inlineEditor}>
                                                    <View style={styles.inlineInputs}>
                                                        <TextInput
                                                            style={styles.inlineInput}
                                                            value={editHour}
                                                            onChangeText={setEditHour}
                                                            keyboardType="numeric"
                                                            maxLength={2}
                                                            placeholder="HH"
                                                            placeholderTextColor={COLORS.textMuted}
                                                            selectTextOnFocus
                                                        />
                                                        <Text style={styles.inlineSeparator}>:</Text>
                                                        <TextInput
                                                            style={styles.inlineInput}
                                                            value={editMin}
                                                            onChangeText={setEditMin}
                                                            keyboardType="numeric"
                                                            maxLength={2}
                                                            placeholder="MM"
                                                            placeholderTextColor={COLORS.textMuted}
                                                            selectTextOnFocus
                                                        />
                                                        <TouchableOpacity
                                                            onPress={() => setEditAmPm(editAmPm === 'AM' ? 'PM' : 'AM')}
                                                            style={styles.inlineAmPm}
                                                        >
                                                            <Text style={styles.inlineAmPmText}>{editAmPm}</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                    <TouchableOpacity onPress={() => handleUpdateTime(med.id, t.id)} style={styles.inlineSave}>
                                                        <Feather name="check" size={16} color={COLORS.primary} />
                                                    </TouchableOpacity>
                                                    <TouchableOpacity onPress={() => setEditingTimeId(null)} style={styles.inlineCancel}>
                                                        <Feather name="x" size={16} color={COLORS.textMuted} />
                                                    </TouchableOpacity>
                                                </View>
                                                <Text style={styles.doseLabel}>{t.label}</Text>
                                            </View>
                                        </View>
                                    ) : (
                                        <TouchableOpacity
                                            style={styles.doseMainArea}
                                            onPress={() => !isFutureDay && toggleDose(med.id, t.id)}
                                            activeOpacity={isFutureDay ? 1 : 0.7}
                                        >
                                            <View style={[styles.timeIcon, { backgroundColor: med.colorBg || COLORS.successBg }]}>
                                                <MaterialCommunityIcons name={t.icon || 'pill'} size={18} color={med.color || COLORS.primary} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <View style={styles.doseTimeRow}>
                                                    <Text style={[styles.doseTime, t.taken && styles.doseTimeDone]}>{t.time}</Text>
                                                    {!isFutureDay && (
                                                        <TouchableOpacity onPress={() => startEditing(t)} style={styles.editTimeBtn}>
                                                            <Feather name="edit-2" size={12} color={COLORS.textMuted} />
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                                <Text style={styles.doseLabel}>{t.label}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    )}

                                    {editingTimeId !== t.id && (
                                        <TouchableOpacity
                                            onPress={() => !isFutureDay && toggleDose(med.id, t.id)}
                                            activeOpacity={isFutureDay ? 1 : 0.7}
                                            style={[
                                                styles.checkCircle,
                                                t.taken && { backgroundColor: med.color || COLORS.primary, borderColor: med.color || COLORS.primary },
                                                isFutureDay && styles.checkCircleDisabled,
                                            ]}
                                        >
                                            {t.taken
                                                ? <Feather name="check" size={13} color="#fff" />
                                                : <View style={styles.checkCircleInner} />
                                            }
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ))}
                        </View>
                    ))}
                </Animated.View>

                {/* Tip */}
                <View style={[styles.tipCard, { marginHorizontal: 16, marginTop: 8 }]}>
                    <LinearGradient colors={['#0D9488', '#0891B2']} style={styles.tipIcon}>
                        <Ionicons name="notifications-outline" size={16} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.tipText}>
                        {activeMemberName
                            ? `Set phone reminders for ${activeMemberName}'s medicine times to never miss a dose.`
                            : 'Set phone reminders for your medicine times to never miss a dose.'}
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { paddingBottom: 24, position: 'relative', overflow: 'hidden' },
    bgDeco: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(13,148,136,0.1)', top: -80, right: -60 },
    headerTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 44 : 18, paddingBottom: 16 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
    headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
    headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(245,158,11,0.2)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(252,211,77,0.3)' },
    streakEmoji: { fontSize: 14 },
    streakText: { fontSize: 12, fontWeight: '800', color: '#FCD34D' },

    progressCard: { marginHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    progressLabel: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
    progressSub: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
    progressPct: { fontSize: 30, fontWeight: '900', color: '#fff', letterSpacing: -1 },
    progressBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: 8, borderRadius: 4, minWidth: 4, overflow: 'hidden' },
    allDoneRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
    allDoneText: { fontSize: 13, fontWeight: '600', color: '#34D399' },

    calStrip: { paddingHorizontal: 16, paddingVertical: 16, gap: 8 },
    dayPill: { alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, gap: 4, minWidth: 52, ...SHADOWS.sm },
    dayPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    dayPillFuture: { backgroundColor: COLORS.lightGray, borderColor: COLORS.border, opacity: 0.65 },
    dayLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 0.3 },
    dayLabelActive: { color: 'rgba(255,255,255,0.75)' },
    dayLabelFuture: { color: COLORS.textMuted },
    dayNum: { fontSize: 17, fontWeight: '900', color: COLORS.textPrimary },
    dayNumActive: { color: '#fff' },
    dayNumFuture: { color: COLORS.textMuted },
    dayDot: { width: 5, height: 5, borderRadius: 2.5 },
    dayDotDone: { backgroundColor: '#34D399' },
    dayDotToday: { backgroundColor: COLORS.warningText },
    dayDotFuture: { backgroundColor: COLORS.border },

    futureBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        marginHorizontal: 16, marginBottom: 4,
        backgroundColor: COLORS.lightGray, borderRadius: 12, padding: 10,
        borderWidth: 1, borderColor: COLORS.border,
    },
    futureBannerText: { fontSize: 12, color: COLORS.textMuted, flex: 1 },

    doseTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    editTimeBtn: { padding: 4 },
    inlineEditor: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    inlineInputs: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: COLORS.border },
    inlineInput: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, width: 30, textAlign: 'center', paddingHorizontal: 4 },
    inlineSeparator: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
    inlineAmPm: { marginLeft: 4, paddingHorizontal: 4 },
    inlineAmPmText: { fontSize: 12, fontWeight: '800', color: COLORS.primary },
    inlineSave: { padding: 4, backgroundColor: COLORS.primaryGlow, borderRadius: 6 },
    inlineCancel: { padding: 4 },

    emptyState: { alignItems: 'center', paddingVertical: 48, gap: 10, backgroundColor: '#fff', borderRadius: 20, marginVertical: 8, borderWidth: 1.5, borderColor: COLORS.border, borderStyle: 'dashed' },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
    emptyText: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 20 },

    medSection: { backgroundColor: '#fff', borderRadius: 18, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', ...SHADOWS.sm },
    medSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: COLORS.lightGray, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    medColorDot: { width: 10, height: 10, borderRadius: 5 },
    medSectionName: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary, flex: 1 },
    medSectionDose: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
    deleteBtn: { padding: 4 },
    doseRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    doseRowDone: { opacity: 0.6 },
    doseMainArea: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
    timeIcon: { width: 40, height: 40, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
    doseTime: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
    doseTimeDone: { textDecorationLine: 'line-through', color: COLORS.textSecondary },
    doseLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
    checkCircle: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
    checkCircleInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.lightGray },
    checkCircleDisabled: { opacity: 0.35 },

    tipCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: COLORS.successBg, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
    tipIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    tipText: { flex: 1, fontSize: 13, color: COLORS.primaryDark, lineHeight: 19 },
});
