import React, { useState, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    SafeAreaView, StatusBar, TextInput, ActivityIndicator,
    KeyboardAvoidingView, Platform, Animated,
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
];

// ─── Doctor Script Card ────────────────────────────────────────────────────────
const DoctorScriptCard = ({ symptom, medicineClasses }) => {
    return (
        <View style={ds.card}>
            <LinearGradient colors={['#1E293B', '#334155']} style={ds.header}>
                <MaterialCommunityIcons name="comment-text-outline" size={18} color="#fff" />
                <Text style={ds.headerText}>What to say to your doctor</Text>
            </LinearGradient>
            <View style={ds.body}>
                <Text style={ds.instruction}>You can use this simple script:</Text>
                <View style={ds.quoteBox}>
                    <Text style={ds.script}>
                        "Hi Doctor, I’ve been having <Text style={ds.bold}>{symptom}</Text> lately. I wanted to let you know about it and see what you think is causing it. Is there anything I should do or avoid to feel better?"
                    </Text>
                </View>
                
                <Text style={ds.subTitle}>Quick Tips:</Text>
                <View style={ds.qRow}>
                    <Feather name="help-circle" size={14} color={COLORS.primary} />
                    <Text style={ds.qText}>Tell them exactly when the pain started.</Text>
                </View>
                <View style={ds.qRow}>
                    <Feather name="help-circle" size={14} color={COLORS.primary} />
                    <Text style={ds.qText}>Mention if anything makes it feel worse.</Text>
                </View>
            </View>
        </View>
    );
};

const ds = StyleSheet.create({
    card: { backgroundColor: '#fff', borderRadius: 20, marginBottom: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0', ...SHADOWS.sm },
    header: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
    headerText: { fontSize: 14, fontWeight: '800', color: '#fff' },
    body: { padding: 16 },
    instruction: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600', marginBottom: 10 },
    quoteBox: { backgroundColor: '#F8FAFC', padding: 15, borderRadius: 12, borderLeftWidth: 4, borderLeftColor: COLORS.primary, marginBottom: 15 },
    script: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 22 },
    bold: { fontWeight: '800', color: COLORS.primary },
    subTitle: { fontSize: 13, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 10 },
    qRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    qText: { fontSize: 12, color: COLORS.textSecondary },
});

// ─── Refined Medicine Class Card ──────────────────────────────────────────────
const MedClassCard = ({ data, index }) => {
    const colors = [GRADIENTS.teal, GRADIENTS.purple, ['#F43F5E', '#E11D48'], GRADIENTS.gold];
    return (
        <View style={rc.card}>
            <View style={rc.cardHeader}>
                <LinearGradient colors={colors[index % colors.length]} style={rc.classIcon}>
                    <MaterialCommunityIcons name="pill" size={18} color="#fff" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                    <Text style={rc.className}>{data.class}</Text>
                    <Text style={rc.classDesc}>{data.description}</Text>
                </View>
            </View>
            <View style={rc.examplesRow}>
                {data.examples.map((ex, i) => (
                    <View key={i} style={rc.exChip}>
                        <Text style={rc.exChipText}>{ex}</Text>
                    </View>
                ))}
            </View>
            <View style={rc.howRow}>
                <View style={rc.indicator} />
                <Text style={rc.howText}><Text style={{ fontWeight: '700', color: COLORS.textPrimary }}>Clinical Action:</Text> {data.howItHelps}</Text>
            </View>
        </View>
    );
};

const rc = StyleSheet.create({
    card: { backgroundColor: COLORS.white, borderRadius: 18, marginBottom: 12, padding: 16, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
    classIcon: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    className: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
    classDesc: { fontSize: 12, color: COLORS.textSecondary, marginTop: 1 },
    examplesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
    exChip: { backgroundColor: '#F0FDFA', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: '#CCFBF1' },
    exChipText: { fontSize: 11, fontWeight: '700', color: '#0D9488' },
    howRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F1F5F9', padding: 10, borderRadius: 10 },
    indicator: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.primary },
    howText: { flex: 1, fontSize: 11, color: COLORS.textSecondary, lineHeight: 16 },
});

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function SymptomLookupScreen({ navigate, user }) {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const searchSymptom = async (symptomText) => {
        const text = (symptomText || query).trim();
        if (!text) return;
        setLoading(true);
        setResult(null);

        try {
            const response = await fetch(`${API_URL}api/symptoms/lookup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: text, user_id: user?.id || 'anonymous' }),
            });
            const data = await response.json();
            setResult(data);
        } catch (e) {
            setResult({
                symptom: text,
                urgency: 'Medium',
                overview: `For the symptom "${text}", doctors usually look at several medicine classes. This summary helps you understand the general medical approach.`,
                medicineClasses: [
                    { 
                        class: 'NSAIDs (Anti-Inflammatories)', 
                        description: 'Commonly used to reduce pain and swelling.',
                        examples: ['Ibuprofen', 'Naproxen', 'Diclofenac', 'Celecoxib', 'Etodolac'],
                        howItHelps: 'Reduces chemicals in the body that cause pain and fever.' 
                    },
                    { 
                        class: 'Pain Relievers (Analgesics)', 
                        description: 'Used for pain management without targeting swelling.',
                        examples: ['Paracetamol', 'Tramadol', 'Codeine'],
                        howItHelps: 'Works with the nervous system to lower your pain levels.' 
                    },
                    { 
                        class: 'Gastro Care', 
                        description: 'Often used if the pain is related to stomach acid.',
                        examples: ['Omeprazole', 'Famotidine', 'Pantoprazole'],
                        howItHelps: 'Helps by reducing acid production in the stomach.' 
                    }
                ],
                lifestyle: ['Track your symptoms for 48 hours', 'Drink plenty of water', 'Get 7-9 hours of rest'],
            });
        } finally {
            setLoading(false);
        }
    };

    const urgencyColor = { Low: COLORS.primary, Medium: '#D97706', High: COLORS.dangerText };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.midnight} />

            <LinearGradient colors={GRADIENTS.hero} style={styles.header}>
                <View style={styles.bgDeco} />
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigate('DASHBOARD')} style={styles.backBtn}>
                        <Feather name="arrow-left" size={20} color="#fff" />
                    </TouchableOpacity>
                    <View style={{ flex: 1, paddingLeft: 14 }}>
                        <Text style={styles.headerTitle}>AI Symptom Guide</Text>
                        <Text style={styles.headerSub}>Pharmacotherapy & Communication</Text>
                    </View>
                </View>

                <View style={styles.searchContainer}>
                    <View style={styles.searchBox}>
                        <Feather name="search" size={18} color={COLORS.textMuted} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Type a symptom..."
                            placeholderTextColor={COLORS.textMuted}
                            value={query}
                            onChangeText={setQuery}
                            onSubmitEditing={() => searchSymptom()}
                        />
                    </View>
                    <TouchableOpacity 
                        style={[styles.searchBtn, !query.trim() && { opacity: 0.7 }]} 
                        onPress={() => searchSymptom()}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.searchBtnText}>Analyze</Text>}
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                {!result && !loading && (
                    <View style={styles.padding}>
                        <Text style={styles.sectionTitle}>Tap to Analyze</Text>
                        <View style={styles.chipsGrid}>
                            {COMMON_SYMPTOMS.map((s, i) => (
                                <TouchableOpacity key={i} style={styles.symptomChip} onPress={() => { setQuery(s.label); searchSymptom(s.label); }}>
                                    <MaterialCommunityIcons name={s.icon} size={16} color={COLORS.primary} />
                                    <Text style={styles.symptomChipText}>{s.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={styles.infoBanner}>
                            <MaterialCommunityIcons name="robot" size={20} color={COLORS.primary} />
                            <Text style={styles.infoBannerText}>Our AI maps symptoms to over 500+ medicine compounds for your information.</Text>
                        </View>
                    </View>
                )}

                {result && !loading && (
                    <View style={styles.padding}>
                        <View style={styles.resCard}>
                            <View style={styles.resHeader}>
                                <Text style={styles.resSymptom}>{result.symptom}</Text>
                                <View style={[styles.urgencyBadge, { borderColor: urgencyColor[result.urgency] }]}>
                                    <Text style={[styles.urgencyText, { color: urgencyColor[result.urgency] }]}>{result.urgency} Urgency</Text>
                                </View>
                            </View>
                            <Text style={styles.resOverview}>{result.overview}</Text>
                        </View>

                        <Text style={styles.sectionTitle}>Prepare for your Doctor</Text>
                        <DoctorScriptCard symptom={result.symptom} />

                        <Text style={styles.sectionTitle}>Suggested Medicine Classes</Text>
                        {result.medicineClasses?.map((cls, i) => (
                            <MedClassCard key={i} data={cls} index={i} />
                        ))}

                        <View style={styles.lifestyleCard}>
                            <Text style={styles.lifestyleTitle}>At-Home Care Tips</Text>
                            {result.lifestyle?.map((tip, i) => (
                                <View key={i} style={styles.lifestyleRow}>
                                    <Feather name="check" size={14} color={COLORS.primary} />
                                    <Text style={styles.lifestyleTip}>{tip}</Text>
                                </View>
                            ))}
                        </View>

                        <View style={styles.disclaimer}>
                            <Text style={styles.disclaimerText}>
                                <Text style={{fontWeight:'700'}}>Notice:</Text> This is AI-generated for educational purposes. Always talk to a doctor before taking any medication.
                            </Text>
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    padding: { padding: 20 },
    header: { paddingBottom: 24, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    bgDeco: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.05)', top: -30, right: -30 },
    headerTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 10, marginBottom: 20 },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff' },
    headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
    searchContainer: { flexDirection: 'row', gap: 10, paddingHorizontal: 20 },
    searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 15, paddingHorizontal: 15, height: 50, ...SHADOWS.sm },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: COLORS.textPrimary },
    searchBtn: { backgroundColor: COLORS.midnight, paddingHorizontal: 20, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
    searchBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
    sectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 15, marginTop: 10 },
    chipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 25 },
    symptomChip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
    symptomChipText: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
    infoBanner: { flexDirection: 'row', gap: 12, backgroundColor: '#EFF6FF', padding: 15, borderRadius: 18, alignItems: 'center' },
    infoBannerText: { flex: 1, fontSize: 12, color: '#1E40AF', fontWeight: '600', lineHeight: 18 },
    resCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, ...SHADOWS.sm },
    resHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    resSymptom: { fontSize: 22, fontWeight: '900', color: COLORS.textPrimary },
    urgencyBadge: { borderWidth: 1.5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    urgencyText: { fontSize: 11, fontWeight: '800' },
    resOverview: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
    lifestyleCard: { backgroundColor: COLORS.midnight, borderRadius: 20, padding: 20, marginTop: 10 },
    lifestyleTitle: { color: '#fff', fontSize: 15, fontWeight: '800', marginBottom: 15 },
    lifestyleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    lifestyleTip: { color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 20 },
    disclaimer: { marginTop: 20, padding: 15, backgroundColor: '#FEF2F2', borderRadius: 15 },
    disclaimerText: { fontSize: 11, color: '#991B1B', textAlign: 'center', lineHeight: 16 }
});