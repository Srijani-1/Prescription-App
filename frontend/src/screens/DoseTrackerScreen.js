// ─── DoseTrackerScreen.js ────────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
    TextInput, Animated, StatusBar, Platform,
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
            isToday: i === 3,
            hasDose: i <= 3,
            done: i < 3,
        };
    });
};

export default function DoseTrackerScreen({ user, currentScreen }) {
    const [meds, setMeds] = useState([]);
    const [selectedDay, setSelectedDay] = useState(3);
    const [addingMed, setAddingMed] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDose, setNewDose] = useState('');
    const week = generateWeek();
    const progressAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Time editing state
    const [editingTimeId, setEditingTimeId] = useState(null);
    const [editHour, setEditHour] = useState('08');
    const [editMin, setEditMin] = useState('00');
    const [editAmPm, setEditAmPm] = useState('AM');

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
        if (user?.id && currentScreen === 'DOSE_TRACKER') fetchMeds();
    }, [user, currentScreen]);

    const fetchMeds = async () => {
        try {
            const response = await fetch(`${API_URL}api/medications?user_id=${user.id}`);
            const data = await response.json();
            setMeds(data);
        } catch (err) { console.error('Error fetching meds:', err); }
    };

    const totalDoses = meds.reduce((acc, m) => acc + (m.times?.length || 0), 0);
    const takenDoses = meds.reduce((acc, m) => acc + (m.times?.filter(t => t.taken).length || 0), 0);
    const pct = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;

    useEffect(() => {
        Animated.timing(progressAnim, { toValue: pct, duration: 1000, useNativeDriver: false }).start();
    }, [pct]);

    const toggleDose = async (medId, timeId) => {
        setMeds(prev => prev.map(m => {
            if (m.id !== medId) return m;
            return { ...m, times: m.times.map(t => t.id === timeId ? { ...t, taken: !t.taken } : t) };
        }));
        try {
            await fetch(`${API_URL}api/medications/${medId}/times/${timeId}/toggle`, { method: 'PUT' });
        } catch (err) { fetchMeds(); }
    };

    const handleAddMed = async () => {
        if (!newName || !newDose) return;
        try {
            const response = await fetch(`${API_URL}api/medications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user.id, name: newName, dose: newDose }),
            });
            if (response.ok) {
                setAddingMed(false); setNewName(''); setNewDose('');
                fetchMeds();
            }
        } catch (err) { console.error('Failed to add med:', err); }
    };

    const handleDeleteMed = async (medId) => {
        try {
            const response = await fetch(`${API_URL}api/medications/${medId}`, { method: 'DELETE' });
            if (response.ok) fetchMeds();
        } catch (err) { console.error('Failed to delete med:', err); }
    };

    const startEditing = (time) => {
        setEditingTimeId(time.id);
        const [t, ampm] = time.time.split(' ');
        const [h, m] = t.split(':');
        setEditHour(h);
        setEditMin(m);
        setEditAmPm(ampm);
    };

    const handleUpdateTime = async (medId, timeId) => {
        const newTimeStr = `${editHour}:${editMin} ${editAmPm}`;
        try {
            const response = await fetch(`${API_URL}api/medications/${medId}/times/${timeId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ time: newTimeStr }),
            });
            if (response.ok) {
                setEditingTimeId(null);
                fetchMeds();
            }
        } catch (err) { console.error('Failed to update time:', err); }
    };

    const progressWidth = progressAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
    const getProgressColor = () => pct >= 80 ? ['#059669', '#10B981'] : pct >= 50 ? ['#D97706', '#F59E0B'] : ['#DC2626', '#EF4444'];

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

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
                                <Text style={styles.headerTitle}>Dose Tracker</Text>
                                <Text style={styles.headerSub}>Stay consistent, stay healthy</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.addIconBtn}
                                onPress={() => setAddingMed(!addingMed)}
                            >
                                <Feather name={addingMed ? 'x' : 'plus'} size={22} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {/* Progress */}
                        <View style={styles.progressCard}>
                            <View style={styles.progressTop}>
                                <View>
                                    <Text style={styles.progressLabel}>TODAY'S ADHERENCE</Text>
                                    <Text style={styles.progressSub}>{takenDoses} of {totalDoses} doses taken</Text>
                                </View>
                                <Text style={styles.progressPct}>{pct}%</Text>
                            </View>
                            <View style={styles.progressBarBg}>
                                <Animated.View style={[styles.progressBarFill, { width: progressWidth }]}>
                                    <LinearGradient colors={getProgressColor()} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                                </Animated.View>
                            </View>
                            {pct === 100 && totalDoses > 0 && (
                                <View style={styles.allDoneRow}>
                                    <Ionicons name="checkmark-circle" size={16} color="#34D399" />
                                    <Text style={styles.allDoneText}>Daily goal achieved! 🎉</Text>
                                </View>
                            )}
                        </View>
                    </LinearGradient>
                </View>

                {/* Calendar strip */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calStrip}>
                    {week.map((day, i) => (
                        <TouchableOpacity
                            key={i}
                            style={[styles.dayPill, i === selectedDay && styles.dayPillActive]}
                            onPress={() => setSelectedDay(i)}
                        >
                            <Text style={[styles.dayLabel, i === selectedDay && styles.dayLabelActive]}>{day.label}</Text>
                            <Text style={[styles.dayNum, i === selectedDay && styles.dayNumActive]}>{day.date}</Text>
                            {day.hasDose && (
                                <View style={[styles.dayDot, day.done ? styles.dayDotDone : day.isToday ? styles.dayDotToday : styles.dayDotFuture]} />
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Add Med Form */}
                {addingMed && (
                    <Animated.View style={[styles.addForm, { opacity: fadeAnim }]}>
                        <Text style={styles.addFormTitle}>➕ Add Medication</Text>
                        <View style={styles.addFormRow}>
                            <View style={[styles.addInput, { flex: 2 }]}>
                                <TextInput
                                    style={styles.addInputText}
                                    placeholder="Medicine name"
                                    placeholderTextColor={COLORS.textMuted}
                                    value={newName}
                                    onChangeText={setNewName}
                                />
                            </View>
                            <View style={[styles.addInput, { flex: 1 }]}>
                                <TextInput
                                    style={styles.addInputText}
                                    placeholder="Dose"
                                    placeholderTextColor={COLORS.textMuted}
                                    value={newDose}
                                    onChangeText={setNewDose}
                                />
                            </View>
                        </View>
                        <TouchableOpacity onPress={handleAddMed} activeOpacity={0.85}>
                            <LinearGradient colors={['#0D9488', '#0891B2']} style={styles.saveBtn}>
                                <Text style={styles.saveBtnText}>Save Medication</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                )}

                {/* Medicine List */}
                <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
                    {meds.length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialCommunityIcons name="pill-off" size={40} color={COLORS.border} />
                            <Text style={styles.emptyTitle}>No medications yet</Text>
                            <Text style={styles.emptyText}>Tap + to add your first medication</Text>
                        </View>
                    ) : meds.map(med => (
                        <View key={med.id} style={[styles.medSection, { borderLeftColor: med.color || COLORS.primary }]}>
                            <View style={styles.medSectionHeader}>
                                <View style={[styles.medColorDot, { backgroundColor: med.color || COLORS.primary }]} />
                                <Text style={styles.medSectionName}>{med.name}</Text>
                                <Text style={styles.medSectionDose}>{med.dose}</Text>
                                <TouchableOpacity onPress={() => handleDeleteMed(med.id)} style={styles.deleteBtn}>
                                    <Feather name="trash-2" size={14} color="#EF4444" />
                                </TouchableOpacity>
                            </View>

                            {(med.times || []).map(t => (
                                <View key={t.id}>
                                    <TouchableOpacity
                                        style={[styles.doseRow, t.taken && styles.doseRowDone]}
                                        onPress={() => toggleDose(med.id, t.id)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[styles.timeIcon, { backgroundColor: (med.colorBg || COLORS.successBg) }]}>
                                            <MaterialCommunityIcons name={t.icon || 'pill'} size={18} color={med.color || COLORS.primary} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <TouchableOpacity 
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    startEditing(t);
                                                }}
                                                style={styles.timeClickArea}
                                            >
                                                <Text style={[styles.doseTime, t.taken && styles.doseTimeDone]}>{t.time}</Text>
                                                <Feather name="edit-2" size={10} color={COLORS.textMuted} style={{ marginLeft: 4 }} />
                                            </TouchableOpacity>
                                            <Text style={styles.doseLabel}>{t.label}</Text>
                                        </View>
                                        <View style={[
                                            styles.checkCircle,
                                            t.taken && { backgroundColor: med.color || COLORS.primary, borderColor: med.color || COLORS.primary },
                                        ]}>
                                            {t.taken
                                                ? <Feather name="check" size={13} color="#fff" />
                                                : <View style={styles.checkCircleInner} />
                                            }
                                        </View>
                                    </TouchableOpacity>

                                    {editingTimeId === t.id && (
                                        <View style={styles.timeEditor}>
                                            <View style={styles.editorRow}>
                                                <TextInput 
                                                    style={styles.editorInput} 
                                                    value={editHour} 
                                                    onChangeText={setEditHour}
                                                    keyboardType="numeric"
                                                    maxLength={2}
                                                />
                                                <Text style={styles.editorSep}>:</Text>
                                                <TextInput 
                                                    style={styles.editorInput} 
                                                    value={editMin} 
                                                    onChangeText={setEditMin}
                                                    keyboardType="numeric"
                                                    maxLength={2}
                                                />
                                                <View style={styles.ampmRow}>
                                                    <TouchableOpacity 
                                                        onPress={() => setEditAmPm('AM')}
                                                        style={[styles.ampmBtn, editAmPm === 'AM' && styles.ampmBtnActive]}
                                                    >
                                                        <Text style={[styles.ampmText, editAmPm === 'AM' && styles.ampmTextActive]}>AM</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity 
                                                        onPress={() => setEditAmPm('PM')}
                                                        style={[styles.ampmBtn, editAmPm === 'PM' && styles.ampmBtnActive]}
                                                    >
                                                        <Text style={[styles.ampmText, editAmPm === 'PM' && styles.ampmTextActive]}>PM</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                            <View style={styles.editorActions}>
                                                <TouchableOpacity onPress={() => setEditingTimeId(null)} style={styles.cancelEditBtn}>
                                                    <Text style={styles.cancelEditText}>Cancel</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => handleUpdateTime(med.id, t.id)} style={styles.saveEditBtn}>
                                                    <Text style={styles.saveEditText}>Save</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            ))}
                        </View>
                    ))}
                </View>

                {/* Tip */}
                <View style={[styles.tipCard, { marginHorizontal: 16 }]}>
                    <LinearGradient colors={['#0D9488', '#0891B2']} style={styles.tipIcon}>
                        <Ionicons name="notifications-outline" size={16} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.tipText}>Set phone reminders for your medicine times to never miss a dose.</Text>
                </View>

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
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    headerTitleCenter: { alignItems: 'center', flex: 1 },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
    headerSub: { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },
    addIconBtn: {
        width: 32, height: 32, justifyContent: 'center', alignItems: 'center',
    },

    progressCard: {
        backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20, padding: 16, 
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    },
    progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    progressLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.8)', letterSpacing: 0.8 },
    progressSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2, fontWeight: '600' },
    progressPct: { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -1 },
    progressBarBg: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: 8, borderRadius: 4, minWidth: 4, overflow: 'hidden' },
    allDoneRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
    allDoneText: { fontSize: 13, fontWeight: '700', color: '#34D399' },

    calStrip: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
    dayPill: {
        alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14,
        borderRadius: 18, backgroundColor: '#fff',
        borderWidth: 1, borderColor: 'rgba(226,232,240,0.8)', gap: 4, minWidth: 56, ...SHADOWS.sm,
    },
    dayPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    dayLabel: { fontSize: 10, fontWeight: '800', color: COLORS.textSecondary, textTransform: 'uppercase' },
    dayLabelActive: { color: 'rgba(255,255,255,0.8)' },
    dayNum: { fontSize: 18, fontWeight: '900', color: COLORS.textPrimary },
    dayNumActive: { color: '#fff' },
    dayDot: { width: 6, height: 6, borderRadius: 3, marginTop: 2 },
    dayDotDone: { backgroundColor: '#10B981' },
    dayDotToday: { backgroundColor: '#F59E0B' },
    dayDotFuture: { backgroundColor: '#E2E8F0' },

    addForm: {
        marginHorizontal: 16, marginBottom: 16, backgroundColor: '#fff',
        borderRadius: 20, padding: 20, borderWidth: 1, borderColor: 'rgba(226,232,240,0.8)',
        ...SHADOWS.md, gap: 14,
    },
    addFormTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
    addFormRow: { flexDirection: 'row', gap: 10 },
    addInput: {
        backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 14,
        paddingVertical: 12, borderWidth: 1, borderColor: '#E2E8F0',
    },
    addInputText: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '600' },
    saveBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', ...SHADOWS.colored },
    saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

    emptyState: {
        alignItems: 'center', paddingVertical: 56, gap: 12,
        backgroundColor: '#fff', borderRadius: 24, marginVertical: 8,
        borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed',
    },
    emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
    emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },

    medSection: {
        backgroundColor: '#fff', borderRadius: 24, marginBottom: 16,
        borderWidth: 1, borderColor: 'rgba(226,232,240,0.8)', overflow: 'hidden', ...SHADOWS.md,
        borderLeftWidth: 4,
    },
    medSectionHeader: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#F8FAFC',
        borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    },
    medColorDot: { width: 12, height: 12, borderRadius: 6 },
    medSectionName: { fontSize: 16, fontWeight: '900', color: COLORS.textPrimary, flex: 1, letterSpacing: -0.3 },
    medSectionDose: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
    deleteBtn: { padding: 6, backgroundColor: '#FFF1F2', borderRadius: 8 },

    doseRow: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    },
    doseRowDone: { opacity: 0.5 },
    timeIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    doseTime: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
    doseTimeDone: { textDecorationLine: 'line-through', color: COLORS.textSecondary },
    doseLabel: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, fontWeight: '600' },
    checkCircle: {
        width: 32, height: 32, borderRadius: 16,
        borderWidth: 2, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center',
    },
    checkCircleInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#F1F5F9' },

    tipCard: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        padding: 16, backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 20, borderWidth: 1, borderColor: 'rgba(226,232,240,0.8)', marginTop: 8,
        ...SHADOWS.sm,
    },
    tipIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    tipText: { flex: 1, fontSize: 13, color: COLORS.primaryDark, lineHeight: 20, fontWeight: '500' },

    timeClickArea: { flexDirection: 'row', alignItems: 'center' },
    timeEditor: {
        backgroundColor: '#F8FAFC', padding: 16,
        borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    },
    editorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center' },
    editorInput: {
        backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0',
        borderRadius: 10, width: 48, height: 44, textAlign: 'center',
        fontSize: 18, fontWeight: '800', color: COLORS.textPrimary,
    },
    editorSep: { fontSize: 20, fontWeight: '900', color: COLORS.textSecondary },
    ampmRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
    ampmBtn: { paddingHorizontal: 12, paddingVertical: 10 },
    ampmBtnActive: { backgroundColor: COLORS.primary },
    ampmText: { fontSize: 13, fontWeight: '800', color: COLORS.textSecondary },
    ampmTextActive: { color: '#fff' },
    editorActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
    cancelEditBtn: { paddingVertical: 8, paddingHorizontal: 14 },
    cancelEditText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '700' },
    saveEditBtn: { backgroundColor: COLORS.primary, paddingVertical: 8, paddingHorizontal: 20, borderRadius: 10, ...SHADOWS.sm },
    saveEditText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
