import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList,
    SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
    Animated, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '../theme';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { API_URL, COUNTRIES } from '../config';

const SUGGESTIONS = [
    { icon: '💊', text: 'What are Paracetamol side effects?' },
    { icon: '🍽️', text: 'Can I take ibuprofen on empty stomach?' },
    { icon: '📋', text: 'What does "bd" mean on a prescription?' },
    { icon: '🔄', text: 'Generic vs brand medicines?' },
    { icon: '💉', text: 'Is it safe to split tablets?' },
    { icon: '🌡️', text: 'How to store medicines properly?' },
];

const SYSTEM_PROMPT = `You are a friendly, knowledgeable medical assistant helping patients understand their prescriptions and medicines. 
Rules:
- Explain everything in simple, clear English (10th-grade level)
- When mentioning Indian brand names, also mention generic equivalents
- Always add a brief disclaimer when giving medical advice
- Never diagnose conditions — only explain medicines, dosages, and general health info
- Be warm, empathetic, and reassuring
- Keep responses concise — 3-4 sentences max unless more detail is clearly needed
- Use symbols (like •, 💊, ⚠️) and bold text (**important**) to make information scanable`;

const WELCOME_MESSAGE = `Hey there! 👋 I'm your personal **Health AI**.\n\nAsk me anything about:\n• 💊 **Medicines** — dosage, side effects, interactions\n• 🔄 **Generics** — cheaper alternatives with same effect\n• 📋 **Prescriptions** — decode doctor shorthand\n• 🌡️ **Health tips** — storage, timing, diet\n\n⚠️ *I'm here to inform, not diagnose. Always consult your doctor for medical decisions.*\n\nWhat would you like to know?`;

const formatText = (text, isUser) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            const content = part.substring(2, part.length - 2);
            return <Text key={index} style={[styles.boldText, isUser && styles.boldTextUser]}>{content}</Text>;
        }
        if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
            const content = part.substring(1, part.length - 1);
            return <Text key={index} style={styles.italicText}>{content}</Text>;
        }
        return <Text key={index}>{part}</Text>;
    });
};

export default function AskAIScreen() {
    const [messages, setMessages] = useState([
        { id: '0', role: 'assistant', content: WELCOME_MESSAGE },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const flatRef = useRef(null);
    const inputRef = useRef(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, []);

    useEffect(() => {
        if (messages.length > 1) {
            setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 120);
        }
    }, [messages]);

    const sendMessage = async (text) => {
        const userText = (text || input).trim();
        if (!userText || loading) return;

        const userMsg = { id: Date.now().toString(), role: 'user', content: userText };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const history = [...messages.slice(-9), userMsg]
                .filter(m => m.role !== 'assistant' || m.id !== '0')
                .map(m => ({ role: m.role, content: m.content }));

            const response = await fetch(`${API_URL}chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: history }),
            });

            const data = await response.json();
            if (data.status !== 'success') throw new Error(data.detail || 'Chat error');

            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.content,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            }]);
        } catch (e) {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "Connection issue — please check your internet and try again.",
                isError: true,
            }]);
        } finally {
            setLoading(false);
        }
    };

    const clearChat = () => setMessages([{ id: '0', role: 'assistant', content: WELCOME_MESSAGE }]);

    const renderMessage = ({ item, index }) => {
        const isUser = item.role === 'user';
        return (
            <Animated.View style={[
                styles.msgRow,
                isUser && styles.msgRowUser,
                { opacity: fadeAnim },
            ]}>
                {!isUser && (
                    <LinearGradient colors={['#0D9488', '#0891B2']} style={styles.aiAvatar}>
                        <MaterialCommunityIcons name="robot-outline" size={14} color="#fff" />
                    </LinearGradient>
                )}
                <View style={[
                    styles.bubble,
                    isUser ? styles.bubbleUser : styles.bubbleAI,
                    item.isError && styles.bubbleError,
                ]}>
                    <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
                        {formatText(item.content, isUser)}
                    </Text>
                    {item.timestamp && !isUser && (
                        <Text style={styles.bubbleTime}>{item.timestamp}</Text>
                    )}
                </View>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />


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
                            <Text style={styles.headerTitle}>Ask AI</Text>
                            <Text style={styles.headerSub}>Personal Health Assistant</Text>
                        </View>
                        <View style={{ width: 32 }} />
                    </View>
                </LinearGradient>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={0}
            >
                {/* Messages */}
                <FlatList
                    ref={flatRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={m => m.id}
                    contentContainerStyle={styles.messagesList}
                    showsVerticalScrollIndicator={false}
                    ListFooterComponent={loading ? (
                        <View style={styles.typingRow}>
                            <Text style={styles.typingText}>AI is thinking...</Text>
                        </View>
                    ) : null}
                />

                {/* Suggestions */}
                {messages.length <= 1 && (
                    <View style={styles.suggestionsWrapper}>
                        <Text style={styles.suggestLabel}>✨ Suggested</Text>
                        <FlatList
                            data={SUGGESTIONS}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(_, i) => i.toString()}
                            contentContainerStyle={styles.suggList}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.suggChip} onPress={() => sendMessage(item.text)}>
                                    <Text style={styles.suggEmoji}>{item.icon}</Text>
                                    <Text style={styles.suggText}>{item.text}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                )}

                {/* Disclaimer */}
                <View style={styles.disclaimer}>
                    <Ionicons name="information-circle-outline" size={12} color={COLORS.textMuted} />
                    <Text style={styles.disclaimerText}>Not a substitute for professional medical advice.</Text>
                </View>

                {/* Input Bar */}
                <View style={styles.footer}>
                    <View style={styles.inputBar}>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                ref={inputRef}
                                style={styles.textInput}
                                placeholder="Ask about any medicine..."
                                placeholderTextColor={COLORS.textMuted}
                                value={input}
                                onChangeText={setInput}
                                multiline
                                maxLength={500}
                                onSubmitEditing={() => sendMessage()}
                            />
                        </View>
                        <TouchableOpacity
                            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
                            onPress={() => sendMessage()}
                            disabled={!input.trim() || loading}
                        >
                            <LinearGradient
                                colors={(!input.trim() || loading) ? ['#94A3B8', '#94A3B8'] : ['#0D9488', '#0891B2']}
                                style={styles.sendGradient}
                            >
                                {loading
                                    ? <ActivityIndicator size="small" color="#fff" />
                                    : <Feather name="send" size={18} color="#fff" />
                                }
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
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
    headerTitle: { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
    headerSub: { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },
    clearBtn: {
        width: 32, height: 32, justifyContent: 'center', alignItems: 'center',
    },

    messagesList: { paddingHorizontal: 16, paddingVertical: 20, gap: 16 },

    msgRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, maxWidth: '85%' },
    msgRowUser: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },

    aiAvatar: {
        width: 32, height: 32, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginTop: 4,
        ...SHADOWS.sm,
    },

    bubble: {
        paddingHorizontal: 18, paddingVertical: 14, borderRadius: 24, flexShrink: 1,
        ...SHADOWS.md,
    },
    bubbleAI: {
        backgroundColor: '#FFFFFF', borderTopLeftRadius: 4,
        borderWidth: 1, borderColor: 'rgba(226,232,240,0.5)',
        borderLeftWidth: 4, borderLeftColor: COLORS.primary,
    },
    bubbleUser: {
        borderTopRightRadius: 4,
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary, shadowOpacity: 0.2, shadowRadius: 10,
    },
    bubbleError: { backgroundColor: '#FFF1F2', borderColor: '#FECACA', borderWidth: 1 },
    bubbleText: { fontSize: 15, color: COLORS.textPrimary, lineHeight: 24, fontWeight: '500' },
    bubbleTextUser: { color: '#FFFFFF', fontWeight: '600' },
    bubbleTime: { fontSize: 10, color: COLORS.textMuted, marginTop: 8, alignSelf: 'flex-end', fontWeight: '700' },
    boldText: { fontWeight: '800', color: COLORS.primaryDark },
    boldTextUser: { color: '#FFFFFF', fontWeight: '900' },
    italicText: { fontStyle: 'italic', color: COLORS.textSecondary },

    typingRow: { paddingHorizontal: 16, marginTop: -4 },
    typingText: { fontSize: 12, color: COLORS.primary, fontStyle: 'italic', fontWeight: '700' },

    suggestionsWrapper: { paddingBottom: 12 },
    suggestLabel: {
        fontSize: 10, fontWeight: '800', color: COLORS.textSecondary,
        paddingHorizontal: 20, marginBottom: 12, letterSpacing: 1.2, textTransform: 'uppercase',
    },
    suggList: { paddingHorizontal: 16, gap: 10 },
    suggChip: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#FFFFFF', paddingHorizontal: 18, paddingVertical: 14,
        borderRadius: 24, borderWidth: 1, borderColor: 'rgba(226,232,240,0.8)',
        ...SHADOWS.sm,
    },
    suggEmoji: { fontSize: 16 },
    suggText: { fontSize: 14, color: COLORS.textPrimary, fontWeight: '800', letterSpacing: -0.2 },

    disclaimer: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        paddingVertical: 12,
    },
    disclaimerText: { fontSize: 10, color: COLORS.textMuted, fontWeight: '600' },

    footer: {
        backgroundColor: 'transparent',
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    },
    inputBar: {
        flexDirection: 'row', alignItems: 'flex-end', gap: 12,
        paddingHorizontal: 12, paddingVertical: 8,
        backgroundColor: '#fff', 
        marginHorizontal: 16, borderRadius: 32,
        borderWidth: 1, borderColor: 'rgba(226,232,240,0.8)',
        ...SHADOWS.lg,
    },
    inputWrapper: {
        flex: 1, paddingHorizontal: 12, paddingVertical: 8,
    },
    textInput: {
        fontSize: 15, color: COLORS.textPrimary, maxHeight: 150, lineHeight: 22,
        fontWeight: '600',
    },
    sendBtn: { flexShrink: 0 },
    sendGradient: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', ...SHADOWS.colored },
    sendBtnDisabled: { opacity: 0.4 },
});
