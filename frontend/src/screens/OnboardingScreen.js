import React, { useRef, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    SafeAreaView, FlatList, useWindowDimensions, Animated,
} from 'react-native';
import { COLORS } from '../theme';
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';

const SLIDES = [
    {
        key: '1',
        icon: 'camera-outline',
        iconLib: 'Ionicons',
        bg: COLORS.successBg,
        accent: COLORS.primary,
        title: 'Scan any prescription',
        body: "Point your camera at any handwritten or printed prescription — even messy doctor handwriting. Our AI reads it in seconds.",
    },
    {
        key: '2',
        icon: 'robot-outline',
        iconLib: 'MaterialCommunityIcons',
        bg: COLORS.accentBg,
        accent: COLORS.accent,
        title: 'Your Personal Health AI',
        body: "Chat 24/7 with our intelligent medical assistant. Ask questions about your condition, side effects, or diet plans.",
    },
    {
        key: '3',
        icon: 'shield-check-outline',
        iconLib: 'MaterialCommunityIcons',
        bg: '#FFF7ED',
        accent: COLORS.warningText,
        title: 'Total Safety Included',
        body: "We automatically cross-check your medical history and current prescriptions to warn you about dangerous drug interactions.",
    },
];

export default function OnboardingScreen({ navigate }) {
    const { width } = useWindowDimensions();
    const [activeIndex, setActiveIndex] = useState(0);
    const flatRef = useRef(null);

    const goNext = () => {
        if (activeIndex < SLIDES.length - 1) {
            flatRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
            setActiveIndex(activeIndex + 1);
        } else {
            navigate('SIGNUP');
        }
    };

    const renderSlide = ({ item }) => (
        <View style={[styles.slide, { width }]}>
            <View style={[styles.iconBubble, { backgroundColor: item.bg }]}>
                <View style={[styles.iconInner, { backgroundColor: item.bg }]}>
                    {item.iconLib === 'Ionicons'
                        ? <Ionicons name={item.icon} size={72} color={item.accent} />
                        : <MaterialCommunityIcons name={item.icon} size={72} color={item.accent} />}
                </View>
                {/* decorative rings */}
                <View style={[styles.ring, styles.ring1, { borderColor: item.accent + '30' }]} />
                <View style={[styles.ring, styles.ring2, { borderColor: item.accent + '18' }]} />
            </View>

            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={styles.slideBody}>{item.body}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigate('SIGNUP')}>
                    <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                ref={flatRef}
                data={SLIDES}
                renderItem={renderSlide}
                keyExtractor={i => i.key}
                horizontal pagingEnabled showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={e => {
                    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
                    setActiveIndex(idx);
                }}
            />

            {/* Dots */}
            <View style={styles.dotsRow}>
                {SLIDES.map((_, i) => (
                    <View
                        key={i}
                        style={[styles.dot, i === activeIndex && styles.dotActive]}
                    />
                ))}
            </View>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.nextBtn} onPress={goNext} activeOpacity={0.85}>
                    <Text style={styles.nextBtnText}>
                        {activeIndex === SLIDES.length - 1 ? 'Create Account' : 'Next'}
                    </Text>
                    <Feather name="arrow-right" size={18} color={COLORS.white} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    topBar: { alignItems: 'flex-end', paddingHorizontal: 24, paddingTop: 12 },
    skipText: { fontSize: 15, fontWeight: '600', color: COLORS.textSecondary },
    slide: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 40 },
    iconBubble: {
        width: 200, height: 200, borderRadius: 100,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 48, position: 'relative',
    },
    iconInner: {
        width: 140, height: 140, borderRadius: 70,
        justifyContent: 'center', alignItems: 'center',
    },
    ring: { position: 'absolute', borderRadius: 200, borderWidth: 1 },
    ring1: { width: 160, height: 160 },
    ring2: { width: 190, height: 190 },
    slideTitle: {
        fontSize: 28, fontWeight: '800', color: COLORS.textPrimary,
        textAlign: 'center', marginBottom: 16, lineHeight: 36,
    },
    slideBody: {
        fontSize: 16, color: COLORS.textSecondary, textAlign: 'center',
        lineHeight: 26, paddingHorizontal: 8,
    },
    dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
    dot: {
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: COLORS.border,
    },
    dotActive: { width: 24, backgroundColor: COLORS.primary },
    footer: { paddingHorizontal: 24, paddingBottom: 32 },
    nextBtn: {
        backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 14,
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
    },
    nextBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});
