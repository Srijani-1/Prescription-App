import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList,
    SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { COLORS } from '../theme';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { API_URL, COUNTRIES } from '../config';
import { Picker } from '@react-native-picker/picker';

const SUGGESTIONS = [
    'What are the side effects of Paracetamol?',
    'Can I take ibuprofen on an empty stomach?',
    'What does it mean if my prescription says "SOS"?',
    'Is it safe to split tablets?',
    'What does "bd" mean on a prescription?',
    'How do I store medicines properly?',
];

const SYSTEM_PROMPT = `You are a friendly, knowledgeable medical assistant helping patients in India understand their prescriptions and medicines. 

Rules:
- Explain everything in simple, clear English (10th-grade level)
- When mentioning Indian brand names, also mention generic equivalents
- Always add a brief disclaimer when giving medical advice
- Never diagnose conditions — only explain medicines, dosages, and general health info
- Be warm, empathetic, and reassuring
- Keep responses concise — 3-4 sentences max unless more detail is clearly needed
- Use symbols (like •, 💊, ⚠️) and bold text (**important**) to make information scanable`;

const WELCOME_MESSAGE = `Hello! 👋 I’m here to help you understand medicines in simple terms. If you have any questions about:  

• **Medicines** (like paracetamol, cetirizine, omeprazole, etc.)  
• **How to take them** (with/without food, dosage)  
• **Side effects** (common ones to watch for)  
• **Generics vs. brands** (cheaper alternatives with the same effect)  

Just ask!  

⚠️ **Disclaimer**: I can’t diagnose or prescribe. Always check with your doctor before starting/stopping any medicine.  

What would you like to know? 😊`;

export default function AskAIScreen() {
    const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
    const [messages, setMessages] = useState([
        {
            id: '0', role: 'assistant',
            content: WELCOME_MESSAGE,
        },
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const flatRef = useRef(null);

    useEffect(() => {
        if (messages.length > 1) {
            setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
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
            // Build conversation history for context (last 10 messages)
            const history = [...messages.slice(-9), userMsg]
                .filter(m => m.role !== 'assistant' || m.id !== '0') // exclude welcome
                .map(m => ({ role: m.role, content: m.content }));

            const response = await fetch(`${API_URL}chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    messages: history,
                    country: selectedCountry.value 
                }),
            });

            const data = await response.json();
            if (data.status !== 'success') throw new Error(data.detail || 'Chat error');

            const assistantMsg = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.content,
            };
            setMessages(prev => [...prev, assistantMsg]);
        } catch (e) {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "Sorry, I couldn't connect right now. Please check your internet connection and try again.",
                isError: true,
            }]);
        } finally {
            setLoading(false);
        }
    };

    const renderMessage = ({ item }) => {
        const isUser = item.role === 'user';

        // Simple formatter for bold text
        const formatText = (text) => {
            if (!text) return null;
            const parts = text.split(/(\*\*.*?\*\*)/g);
            return parts.map((part, index) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    const content = part.substring(2, part.length - 2);
                    return (
                        <Text key={index} style={[styles.boldText, isUser && styles.bubbleTextUser]}>
                            {content}
                        </Text>
                    );
                }
                return part;
            });
        };

        return (
            <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
                {!isUser && (
                    <View style={styles.aiAvatar}>
                        <MaterialCommunityIcons name="robot-outline" size={16} color={COLORS.primary} />
                    </View>
                )}
                <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI, item.isError && styles.bubbleError]}>
                    <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
                        {formatText(item.content)}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }} keyboardVerticalOffset={80}>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={styles.headerAvatar}>
                            <MaterialCommunityIcons name="robot-outline" size={22} color={COLORS.white} />
                        </View>
                        <View>
                            <Text style={styles.headerName}>Health Assistant</Text>
                            <View style={styles.onlineRow}>
                                <View style={styles.onlineDot} />
                                <Text style={styles.onlineText}>AI-powered · Online</Text>
                            </View>
                        </View>
                    </View>
                    
                    <View style={styles.headerRight}>
                        <View style={styles.countryPickerWrap}>
                            <Picker
                                selectedValue={selectedCountry.value}
                                onValueChange={(val) => setSelectedCountry(COUNTRIES.find(c => c.value === val))}
                                style={styles.miniPicker}
                                dropdownIconColor={COLORS.primary}
                            >
                                {COUNTRIES.map(c => (
                                    <Picker.Item key={c.value} label={c.label.split(' ')[0]} value={c.value} />
                                ))}
                            </Picker>
                        </View>

                        <TouchableOpacity
                            style={styles.clearBtn}
                            onPress={() => setMessages([{
                                id: '0', role: 'assistant',
                                content: WELCOME_MESSAGE,
                            }])}
                        >
                            <Feather name="trash-2" size={16} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>

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
                            <View style={styles.aiAvatar}>
                                <MaterialCommunityIcons name="robot-outline" size={16} color={COLORS.primary} />
                            </View>
                            <View style={styles.typingBubble}>
                                <ActivityIndicator size="small" color={COLORS.primary} />
                                <Text style={styles.typingText}>Thinking...</Text>
                            </View>
                        </View>
                    ) : null}
                />

                {/* Suggestions (shown only at start) */}
                {messages.length <= 1 && (
                    <View style={styles.suggestionsWrapper}>
                        <Text style={styles.suggestLabel}>Suggested questions</Text>
                        <FlatList
                            data={SUGGESTIONS}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(_, i) => i.toString()}
                            contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 8 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.suggChip} onPress={() => sendMessage(item)}>
                                    <Text style={styles.suggChipText}>{item}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                )}

                {/* Disclaimer */}
                <View style={styles.disclaimer}>
                    <Ionicons name="information-circle-outline" size={13} color={COLORS.textSecondary} />
                    <Text style={styles.disclaimerText}>Not a substitute for professional medical advice.</Text>
                </View>

                {/* Input bar */}
                <View style={styles.inputBar}>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Ask about any medicine or prescription..."
                        placeholderTextColor={COLORS.textSecondary + '80'}
                        value={input}
                        onChangeText={setInput}
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
                        onPress={() => sendMessage()}
                        disabled={!input.trim() || loading}
                    >
                        <Feather name="send" size={18} color={COLORS.white} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 14,
        backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerAvatar: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    },
    headerName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
    onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
    onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22C55E' },
    onlineText: { fontSize: 12, color: COLORS.textSecondary },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    countryPickerWrap: {
        backgroundColor: COLORS.lightGray,
        borderRadius: 12,
        height: 36,
        width: 70,
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    miniPicker: {
        height: 36,
        width: 100, // wider than wrap to hide arrow/padding if needed
        color: COLORS.textPrimary,
    },
    clearBtn: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: COLORS.lightGray, justifyContent: 'center', alignItems: 'center',
    },
    messagesList: { padding: 16, gap: 12 },
    msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '85%' },
    msgRowUser: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
    aiAvatar: {
        width: 30, height: 30, borderRadius: 15, flexShrink: 0,
        backgroundColor: COLORS.successBg, justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: COLORS.border,
    },
    bubble: {
        paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, flexShrink: 1,
    },
    bubbleAI: {
        backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border,
        borderBottomLeftRadius: 4,
    },
    bubbleUser: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
    bubbleError: { backgroundColor: COLORS.dangerBg, borderColor: '#FECACA' },
    bubbleText: { fontSize: 15, color: COLORS.textPrimary, lineHeight: 22 },
    bubbleTextUser: { color: COLORS.white },
    boldText: { fontWeight: 'bold', color: COLORS.textPrimary },
    typingRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 4 },
    typingBubble: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: COLORS.white, paddingHorizontal: 14, paddingVertical: 10,
        borderRadius: 18, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.border,
    },
    typingText: { fontSize: 13, color: COLORS.textSecondary },
    suggestionsWrapper: { paddingTop: 8 },
    suggestLabel: {
        fontSize: 12, fontWeight: '600', color: COLORS.textSecondary,
        paddingHorizontal: 16, marginBottom: 8,
    },
    suggChip: {
        backgroundColor: COLORS.white, paddingHorizontal: 14, paddingVertical: 10,
        borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, maxWidth: 200,
    },
    suggChipText: { fontSize: 13, color: COLORS.textPrimary },
    disclaimer: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
        paddingHorizontal: 16, paddingVertical: 4,
    },
    disclaimerText: { fontSize: 11, color: COLORS.textSecondary },
    inputBar: {
        flexDirection: 'row', alignItems: 'flex-end', gap: 10,
        paddingHorizontal: 16, paddingVertical: 12,
        backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.border,
    },
    textInput: {
        flex: 1, fontSize: 15, color: COLORS.textPrimary,
        backgroundColor: COLORS.lightGray, borderRadius: 20,
        paddingHorizontal: 16, paddingVertical: 10, maxHeight: 100,
        borderWidth: 1, borderColor: COLORS.border,
    },
    sendBtn: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    },
    sendBtnDisabled: { opacity: 0.4 },
});
