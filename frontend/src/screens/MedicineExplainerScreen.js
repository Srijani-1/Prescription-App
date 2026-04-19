import React, { useState, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
    SafeAreaView, StatusBar, Animated, LayoutAnimation, UIManager, Platform, ActivityIndicator, Pressable
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, SHADOWS } from '../theme';
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import { API_URL } from '../config';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Section Row ───────────────────────────────────────────────────────────────
const InfoSection = ({ icon, iconColor, iconBg, title, children }) => (
    <View style={sec.wrap}>
        <View style={[sec.iconBox, { backgroundColor: iconBg }]}>
            <MaterialCommunityIcons name={icon} size={16} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
            <Text style={sec.title}>{title}</Text>
            {children}
        </View>
    </View>
);
const sec = StyleSheet.create({
    wrap: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    iconBox: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginTop: 1 },
    title: { fontSize: 13, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 5 },
});

// ─── Confidence Ring ───────────────────────────────────────────────────────────
const ConfidenceDot = ({ level }) => {
    const color = level === 'High' ? COLORS.primary : level === 'Medium' ? COLORS.warningText : COLORS.dangerText;
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
            <Text style={{ fontSize: 11, fontWeight: '700', color }}>{level} confidence</Text>
        </View>
    );
};

// ─── Medicine Explainer Card ───────────────────────────────────────────────────
const MedicineCard = ({ medicine, index }) => {
    const [expanded, setExpanded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(medicine);

    const rotateAnim = useRef(new Animated.Value(0)).current;

    const gradients = [GRADIENTS.teal, GRADIENTS.purple, ['#F43F5E', '#E11D48'], GRADIENTS.gold];
    const cardGrad = gradients[index % gradients.length];

    const fetchDetails = async () => {
        if (!medicine._id || medicine._id.toString().startsWith('search_')) return;
        if (data.fullLoaded) return;

        try {
            setLoading(true);
            const res = await fetch(`${API_URL}api/medications/${medicine._id}/explain`);
            const result = await res.json();

            const explanation = result.explanation || {};
            setData(prev => ({
                ...prev,
                class: explanation.medicine_class || prev.class,
                whatItDoes: explanation.what_it_does || "No data",
                sideEffects: explanation.side_effects || [],
                foodInteractions: explanation.food_interactions || [],
                generics: explanation.generics || [],
                doctorTip: explanation.doctor_tip || "",
                approximatePrice: explanation.approximate_price || "",
                confidence: 'High',
                fullLoaded: true
            }));

        } catch (e) {
            console.log("Explain API error:", e);
        } finally {
            setLoading(false);
        }
    };

    const toggle = async () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        const newExpanded = !expanded;
        setExpanded(newExpanded);

        if (newExpanded) {
            await fetchDetails();
        }

        Animated.timing(rotateAnim, {
            toValue: newExpanded ? 1 : 0,
            duration: 250,
            useNativeDriver: true,
        }).start();
    };

    const chevronRotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    return (
        <View style={card.wrap}>
            {/* Header */}
            <TouchableOpacity onPress={toggle} activeOpacity={0.8} style={card.header}>
                <LinearGradient colors={cardGrad} style={card.iconBox}>
                    <MaterialCommunityIcons name="pill" size={20} color="#fff" />
                </LinearGradient>

                <View style={{ flex: 1 }}>
                    <Text style={card.medName}>{data.name}</Text>
                    <Text style={card.medClass}>{data.class} · {data.dose}</Text>
                </View>

                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <ConfidenceDot level={data.confidence} />
                    <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
                        <Feather name="chevron-down" size={18} color={COLORS.textSecondary} />
                    </Animated.View>
                </View>
            </TouchableOpacity>

            {/* Tags */}
            <View style={card.chips}>
                {data.tags?.map((tag, i) => (
                    <View key={i} style={card.chip}>
                        <Text style={card.chipText}>{tag}</Text>
                    </View>
                ))}
            </View>

            {/* Expanded Content */}
            {expanded && (
                <View style={card.detail}>
                    <View style={card.divider} />

                    {loading ? (
                        <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 20 }} />
                    ) : (
                        <>
                            {/* What it does */}
                            <InfoSection
                                icon="information-outline"
                                iconColor={COLORS.primary}
                                iconBg={COLORS.successBg}
                                title="Medical Mechanism"
                            >
                                <Text style={card.bodyText}>{data.whatItDoes}</Text>
                            </InfoSection>

                            {/* Side Effects */}
                            <InfoSection
                                icon="alert-outline"
                                iconColor={COLORS.warningText}
                                iconBg={COLORS.warningBg}
                                title="Clinical Side Effects"
                            >
                                {data.sideEffects?.length ? (
                                    data.sideEffects.map((s, i) => (
                                        <Text key={i} style={card.bodyText}>• {s}</Text>
                                    ))
                                ) : (
                                    <Text style={card.bodyText}>No known specific side effects</Text>
                                )}
                            </InfoSection>

                            {/* Food Interactions */}
                            <InfoSection
                                icon="food-off"
                                iconColor={COLORS.dangerText}
                                iconBg={COLORS.dangerBg}
                                title="Interaction Alerts"
                            >
                                {data.foodInteractions?.length ? (
                                    data.foodInteractions.map((f, i) => (
                                        <View key={i} style={card.foodItem}>
                                            <Text style={card.foodTitle}>{f.emoji} {f.food}</Text>
                                            <Text style={card.bodyText}>{f.reason}</Text>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={card.bodyText}>No major food interactions documented</Text>
                                )}
                            </InfoSection>

                            {/* Doctor Tip */}
                            {data.doctorTip ? (
                                <View style={card.tipBox}>
                                    <Ionicons name="chatbubble-ellipses-outline" size={16} color={COLORS.primary} />
                                    <Text style={card.tipText}>{data.doctorTip}</Text>
                                </View>
                            ) : null}

                            {/* Generics */}
                            {data.generics?.length > 0 && (
                                <View style={{ marginTop: 20 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                        <Text style={sec.title}>Lower Cost Alternatives</Text>
                                        {data.approximatePrice ? (
                                            <View style={card.priceTag}>
                                                <Text style={card.priceLabel}>EST. PRICE</Text>
                                                <Text style={card.priceValue}>₹{data.approximatePrice}</Text>
                                            </View>
                                        ) : null}
                                    </View>
                                    {data.generics.map((g, i) => (
                                        <View key={i} style={card.genericRow}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={card.genericName}>{g.name}</Text>
                                                <Text style={card.genericMaker}>{g.manufacturer}</Text>
                                            </View>
                                            <View style={card.savingsBadge}>
                                                <Text style={card.originalPrice}>₹{g.originalPrice}</Text>
                                                <Text style={card.genericPrice}>₹{g.genericPrice}</Text>
                                                <View style={card.savePct}>
                                                    <Text style={card.savePctText}>{g.savingPct}% Less</Text>
                                                </View>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </>
                    )}
                </View>
            )}
        </View>
    );
};

const card = StyleSheet.create({
    wrap: {
        backgroundColor: COLORS.white, borderRadius: 20, marginHorizontal: 20, marginBottom: 12,
        borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', ...SHADOWS.sm,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
    iconBox: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    medName: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
    medClass: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16, paddingBottom: 14 },
    chip: {
        backgroundColor: COLORS.successBg, paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 10, borderWidth: 1, borderColor: COLORS.border,
    },
    chipText: { fontSize: 11, fontWeight: '600', color: COLORS.primary },
    divider: { height: 1, backgroundColor: COLORS.border, marginBottom: 16 },
    detail: { paddingHorizontal: 16, paddingBottom: 16 },
    bodyText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 19 },
    foodItem: { marginBottom: 12 },
    foodTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
    genericRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: COLORS.successBg, borderRadius: 12, padding: 12,
        borderWidth: 1, borderColor: COLORS.successBorder, marginBottom: 10
    },
    genericName: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
    genericMaker: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
    savingsBadge: { alignItems: 'flex-end', gap: 2 },
    originalPrice: { fontSize: 11, color: COLORS.textMuted, textDecorationLine: 'line-through' },
    genericPrice: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
    savePct: { backgroundColor: COLORS.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    savePctText: { fontSize: 11, fontWeight: '800', color: '#fff' },
    tipBox: {
        flexDirection: 'row', gap: 10, alignItems: 'flex-start',
        backgroundColor: COLORS.successBg, borderRadius: 12, padding: 12,
        borderWidth: 1, borderColor: COLORS.border, marginTop: 10
    },
    tipText: { flex: 1, fontSize: 13, color: COLORS.textPrimary, lineHeight: 19, fontStyle: 'italic' },
    priceTag: { backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E1' },
    priceLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textSecondary },
    priceValue: { fontSize: 16, fontWeight: '900', color: COLORS.textPrimary },
});

// ─── Screen ────────────────────────────────────────────────────────────────────
export default function MedicineExplainerScreen({ navigate, user, medicines: propMedicines }) {
    const [medicines, setMedicines] = React.useState(propMedicines || []);
    const [loading, setLoading] = React.useState(!propMedicines && !!user?.id);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [globalSearchLoading, setGlobalSearchLoading] = React.useState(false);
    const [globalResult, setGlobalResult] = React.useState(null);

    React.useEffect(() => {
        if (!propMedicines && user?.id) {
            loadMedicinesFromBackend();
        }
    }, [user]);

    const handleGlobalSearch = async () => {
        if (!searchQuery.trim()) return;
        try {
            setGlobalSearchLoading(true);
            setGlobalResult(null);

            const res = await fetch(`${API_URL}api/medications/search-explain?name=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();

            if (data && data.explanation) {
                const cached = data.explanation;
                setGlobalResult({
                    name: data.medicine || searchQuery,
                    class: cached.medicine_class || 'General Medicine',
                    dose: 'Information only',
                    confidence: 'AI Search',
                    tags: ['Generic Available'],
                    whatItDoes: cached.what_it_does || 'No summary available.',
                    sideEffects: cached.side_effects || [],
                    foodInteractions: cached.food_interactions || [],
                    generics: cached.generics || [],
                    doctorTip: cached.doctor_tip || cached.important_warning,
                    approximatePrice: cached.approximate_price,
                    _id: 'search_' + Date.now(),
                    fullLoaded: true
                });
            }
        } catch (e) {
            console.error("Global search error:", e);
        } finally {
            setGlobalSearchLoading(false);
        }
    };

    const loadMedicinesFromBackend = async () => {
        try {
            const res = await fetch(`${API_URL}api/medications?user_id=${user.id}`);
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                const mapped = data.map((med) => {
                    let cached = {};
                    if (med.explanation_json) {
                        try {
                            const parsed = JSON.parse(med.explanation_json);
                            cached = parsed.explanation || {};
                        } catch (e) { }
                    }

                    return {
                        name: med.name,
                        class: cached.medicine_class || 'Prescription Medicine',
                        dose: med.dose || 'As prescribed',
                        confidence: cached.medicine_class ? 'High' : 'High',
                        tags: ['Prescribed', med.dose ? 'Dosed' : 'Rx'].filter(Boolean),
                        whatItDoes: cached.what_it_does || 'Tap to load detailed medical mechanism...',
                        sideEffects: cached.side_effects || ['Loading...'],
                        foodInteractions: cached.food_interactions || [],
                        generics: cached.generics || [],
                        doctorTip: cached.doctor_tip || '',
                        approximatePrice: cached.approximate_price || "",
                        _id: med.id,
                        fullLoaded: !!cached.medicine_class
                    };
                });
                setMedicines(mapped);
            }
        } catch (e) {
            console.log('Error loading medicines');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.midnight} />

            <LinearGradient colors={GRADIENTS.hero} style={styles.header}>
                <View style={styles.bgDeco} />
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigate && navigate('DASHBOARD')} style={styles.backBtn}>
                        <Feather name="arrow-left" size={20} color="rgba(255,255,255,0.8)" />
                    </TouchableOpacity>
                    <View style={{ flex: 1, paddingLeft: 14 }}>
                        <Text style={styles.headerTitle}>AI Medicine Guide</Text>
                        <Text style={styles.headerSub}>Real-time pharmaceutical insights</Text>
                    </View>
                    <View style={styles.countBadge}>
                        <Text style={styles.countText}>{medicines.length} items</Text>
                    </View>
                </View>

                {/* UI Feature Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featureRow}>
                    {[
                        { icon: 'robot', label: 'AI Driven', color: '#5EEAD4' },
                        { icon: 'alert-outline', label: 'Side effects', color: '#FCD34D' },
                        { icon: 'food-off', label: 'Food alerts', color: '#FCA5A5' },
                        { icon: 'currency-inr', label: 'Price compare', color: '#A5F3D0' },
                    ].map((f, i) => (
                        <View key={i} style={styles.featureChip}>
                            <MaterialCommunityIcons name={f.icon} size={13} color={f.color} />
                            <Text style={styles.featureChipText}>{f.label}</Text>
                        </View>
                    ))}
                </ScrollView>

                <View style={styles.searchSection}>
                    <View style={styles.searchBar}>
                        <Feather name="search" size={18} color={COLORS.textMuted} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Enter medicine name..."
                            placeholderTextColor={COLORS.textMuted}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            onSubmitEditing={handleGlobalSearch}
                        />
                    </View>
                    <TouchableOpacity style={styles.searchBtn} onPress={handleGlobalSearch}>
                        {globalSearchLoading ? <ActivityIndicator size="small" color={COLORS.primary} /> : <Text style={styles.searchBtnText}>Analyze</Text>}
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ paddingVertical: 20 }} showsVerticalScrollIndicator={false}>
                    {globalResult && (
                        <View style={styles.searchResultsContainer}>
                            <Text style={styles.searchResultTitle}>AI SEARCH RESULT</Text>
                            <MedicineCard medicine={globalResult} index={0} />
                        </View>
                    )}

                    <Text style={styles.listTitle}>YOUR ACTIVE MEDICATIONS</Text>
                    {medicines.length === 0 && !globalResult ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>Search for a medicine to get an AI breakdown.</Text>
                        </View>
                    ) : (
                        medicines.map((med, i) => (
                            <MedicineCard key={med._id || i} medicine={med} index={i} />
                        ))
                    )}

                    <View style={styles.disclaimer}>
                        <MaterialCommunityIcons name="shield-alert-outline" size={16} color={COLORS.textMuted} />
                        <Text style={styles.disclaimerText}>
                            Always consult your physician. This data is AI-generated for educational purposes.
                        </Text>
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { paddingBottom: 16 },
    bgDeco: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(13,148,136,0.1)', top: -60, right: -60 },
    headerTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 14 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff' },
    headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
    countBadge: { backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    countText: { fontSize: 12, fontWeight: '700', color: '#fff' },
    featureRow: { paddingHorizontal: 20, gap: 8 },
    featureChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
    featureChipText: { fontSize: 12, fontWeight: '600', color: '#fff' },
    searchSection: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 16 },
    searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, height: 44, borderRadius: 12 },
    searchInput: { flex: 1, color: '#fff', fontSize: 14 },
    searchBtn: { backgroundColor: '#fff', height: 44, paddingHorizontal: 16, borderRadius: 12, justifyContent: 'center' },
    searchBtnText: { color: COLORS.primary, fontWeight: '800' },
    searchResultsContainer: { paddingHorizontal: 20, marginBottom: 20 },
    searchResultTitle: { fontSize: 11, fontWeight: '800', color: COLORS.primary, marginBottom: 10 },
    listTitle: { fontSize: 11, fontWeight: '800', color: COLORS.textMuted, marginLeft: 20, marginBottom: 12 },
    emptyState: { padding: 40, alignItems: 'center' },
    emptyText: { textAlign: 'center', color: COLORS.textMuted, fontSize: 13 },
    disclaimer: { flexDirection: 'row', gap: 10, marginHorizontal: 20, marginTop: 20, padding: 14, backgroundColor: COLORS.lightGray, borderRadius: 14 },
    disclaimerText: { flex: 1, fontSize: 11, color: COLORS.textMuted, lineHeight: 16 },
});