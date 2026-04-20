import React, { useState, useRef } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, 
    ScrollView, Platform, Modal, Animated, StatusBar, useWindowDimensions
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { API_URL } from '../config';

const COLORS = {
    primary: '#14B8A6',
    primaryDark: '#0D9488',
    danger: '#EF4444',
    dangerLight: '#FEF2F2',
    slate: '#64748B',
    slateLight: '#F8FAFC',
    white: '#FFFFFF',
    border: '#E2E8F0'
};

export default function ProfileScreen({ user, setUser, navigate }) {
    const { width: windowWidth } = useWindowDimensions();
    const isLargeScreen = windowWidth > 768;
    const containerWidth = isLargeScreen ? 600 : '100%';

    const [name, setName] = useState(user?.full_name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false); // New state for delete loading
    const [focusedField, setFocusedField] = useState(null);

    const [modalVisible, setModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState({ type: 'info', title: '', message: '', onConfirm: null });

    const showBanner = (type, title, message, onConfirm = null) => {
        setModalConfig({ type, title, message, onConfirm });
        setModalVisible(true);
    };

    const hasChanges = () => {
        return (
            name !== (user?.full_name || '') ||
            email !== (user?.email || '') ||
            phone !== (user?.phone || '')
        );
    };

    // --- LOGIC FIX: DELETE ACCOUNT ---
    const executeDelete = async () => {
        setModalVisible(false);
        setDeleting(true);
        try {
            const response = await fetch(`${API_URL}api/auth/users/${user?.id}`, {
                method: 'DELETE',
            });
            
            if (response.ok) {
                // Clear user data and send to landing
                setUser(null);
                navigate('LANDING');
            } else {
                showBanner('error', "Deletion Failed", "We couldn't delete your account at this time.");
            }
        } catch (err) {
            showBanner('error', "Network Error", "Please check your connection.");
        } finally {
            setDeleting(false);
        }
    };

    const executeUpdate = async () => {
        setModalVisible(false);
        setSaving(true);
        try {
            const response = await fetch(`${API_URL}api/auth/users/${user?.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ full_name: name, email, phone })
            });
            if (response.ok) {
                const data = await response.json();
                setUser({ ...user, ...data });
                setTimeout(() => showBanner('success', "Success", "Your profile is up to date."), 500);
            } else {
                showBanner('error', "Update Failed", "We couldn't save your changes.");
            }
        } catch (err) {
            showBanner('error', "Network Error", "Please check your connection.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#F1F5F9', '#E2E8F0']} style={StyleSheet.absoluteFill} />
            <StatusBar barStyle="dark-content" />
            
            <SafeAreaView style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={[styles.wrapper, { width: containerWidth }]}>
                        
                        <View style={styles.header}>
                            <View style={styles.avatarBase}>
                                <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.avatarInner}>
                                    <Text style={styles.avatarText}>{name ? name[0].toUpperCase() : 'U'}</Text>
                                </LinearGradient>
                            </View>
                            <Text style={styles.userName}>{name || 'User Profile'}</Text>
                        </View>

                        <View style={styles.mainCard}>
                            <Text style={styles.cardHeading}>Personal Information</Text>
                            
                            {[
                                { id: 'name', label: 'Full Name', val: name, set: setName, icon: 'user' },
                                { id: 'email', label: 'Email Address', val: email, set: setEmail, icon: 'mail' },
                                { id: 'phone', label: 'Phone Number', val: phone, set: setPhone, icon: 'phone' }
                            ].map((field) => (
                                <View key={field.id} style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>{field.label}</Text>
                                    <View style={[styles.inputBox, focusedField === field.id && styles.inputBoxActive]}>
                                        <Feather name={field.icon} size={18} color={focusedField === field.id ? COLORS.primary : COLORS.slate} />
                                        <TextInput 
                                            style={styles.textInput}
                                            value={field.val}
                                            onChangeText={field.set}
                                            onFocus={() => setFocusedField(field.id)}
                                            onBlur={() => setFocusedField(null)}
                                            placeholderTextColor={COLORS.slate}
                                        />
                                    </View>
                                </View>
                            ))}

                            <TouchableOpacity 
                                style={styles.saveBtn} 
                                activeOpacity={0.8}
                                onPress={() => {
                                    if (!hasChanges()) showBanner('info', "No Changes", "No modifications were detected.");
                                    else showBanner('confirm', "Save Changes", "Update your profile information?", executeUpdate);
                                }}
                            >
                                <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.saveGradient}>
                                    {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.managementSection}>
                            <Text style={styles.managementTitle}>Account Management</Text>
                            <View style={[styles.buttonGrid, isLargeScreen && styles.buttonGridDesktop]}>
                                
                                <TouchableOpacity 
                                    style={styles.tileBtn} 
                                    onPress={() => showBanner('confirm', "Log Out", "Are you sure you want to log out?", () => {setUser(null); navigate('LANDING')})}
                                >
                                    <View style={[styles.tileIcon, { backgroundColor: '#F1F5F9' }]}>
                                        <Feather name="log-out" size={20} color={COLORS.slate} />
                                    </View>
                                    <View>
                                        <Text style={styles.tileTitle}>Log Out</Text>
                                        <Text style={styles.tileSub}>Exit your account safely</Text>
                                    </View>
                                </TouchableOpacity>

                                {/* --- FIXED BUTTON: DELETE ACCOUNT --- */}
                                <TouchableOpacity 
                                    style={[styles.tileBtn, styles.tileBtnDanger]} 
                                    onPress={() => showBanner(
                                        'danger', 
                                        "Delete Account", 
                                        "This will permanently erase all your data. This cannot be undone. Proceed?", 
                                        executeDelete
                                    )}
                                    disabled={deleting}
                                >
                                    <View style={[styles.tileIcon, { backgroundColor: '#FEF2F2' }]}>
                                        {deleting ? <ActivityIndicator size="small" color={COLORS.danger} /> : <Feather name="trash-2" size={20} color={COLORS.danger} />}
                                    </View>
                                    <View>
                                        <Text style={[styles.tileTitle, { color: COLORS.danger }]}>Delete Account</Text>
                                        <Text style={styles.tileSub}>Permanent action</Text>
                                    </View>
                                </TouchableOpacity>

                            </View>
                        </View>

                    </View>
                </ScrollView>
            </SafeAreaView>

            {/* Modal */}
            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalBox, { width: isLargeScreen ? 400 : '85%' }]}>
                        <View style={[styles.modalIconWrap, { backgroundColor: modalConfig.type === 'danger' ? COLORS.dangerLight : '#F0FDF4' }]}>
                            <Feather 
                                name={modalConfig.type === 'danger' ? 'alert-triangle' : (modalConfig.type === 'success' ? 'check-circle' : 'info')} 
                                size={28} 
                                color={modalConfig.type === 'danger' ? COLORS.danger : COLORS.primary} 
                            />
                        </View>
                        <Text style={styles.modalTitle}>{modalConfig.title}</Text>
                        <Text style={styles.modalMsg}>{modalConfig.message}</Text>
                        <View style={styles.modalActions}>
                            {/* Show Cancel if it's a confirmation or danger type */}
                            {(modalConfig.type === 'confirm' || modalConfig.type === 'danger') && (
                                <TouchableOpacity style={styles.mBtnSecondary} onPress={() => setModalVisible(false)}>
                                    <Text style={styles.mBtnSecondaryText}>Cancel</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity 
                                style={[styles.mBtnPrimary, { backgroundColor: modalConfig.type === 'danger' ? COLORS.danger : COLORS.primary }]} 
                                onPress={() => modalConfig.onConfirm ? modalConfig.onConfirm() : setModalVisible(false)}
                            >
                                <Text style={styles.mBtnPrimaryText}>
                                    {modalConfig.type === 'success' || modalConfig.type === 'info' ? 'OK' : 'Confirm'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingVertical: 40, paddingHorizontal: 20, alignItems: 'center' },
    wrapper: { alignSelf: 'center' },

    header: { alignItems: 'center', marginBottom: 35 },
    avatarBase: { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.white, padding: 4, elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
    avatarInner: { flex: 1, borderRadius: 41, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: COLORS.white, fontSize: 32, fontWeight: '800' },
    userName: { fontSize: 22, fontWeight: '800', color: '#1E293B', marginTop: 15 },

    mainCard: { backgroundColor: COLORS.white, borderRadius: 24, padding: 25, elevation: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 15 },
    cardHeading: { fontSize: 16, fontWeight: '800', color: COLORS.slate, marginBottom: 20, textTransform: 'uppercase', letterSpacing: 0.5 },

    inputGroup: { marginBottom: 18 },
    inputLabel: { fontSize: 12, fontWeight: '700', color: COLORS.slate, marginBottom: 8, marginLeft: 4 },
    inputBox: { flexDirection: 'row', alignItems: 'center', height: 56, backgroundColor: COLORS.slateLight, borderRadius: 16, paddingHorizontal: 16, borderWidth: 1, borderColor: 'transparent' },
    inputBoxActive: { borderColor: COLORS.primary, backgroundColor: COLORS.white, elevation: 2 },
    textInput: { flex: 1, marginLeft: 12, fontSize: 16, color: '#1E293B', fontWeight: '600' },

    saveBtn: { marginTop: 10, borderRadius: 16, overflow: 'hidden', elevation: 4, shadowColor: COLORS.primary },
    saveGradient: { height: 56, justifyContent: 'center', alignItems: 'center' },
    saveBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },

    managementSection: { marginTop: 30, width: '100%' },
    managementTitle: { fontSize: 13, fontWeight: '800', color: COLORS.slate, marginBottom: 15, textAlign: 'center', opacity: 0.7 },
    
    buttonGrid: { gap: 12 },
    buttonGridDesktop: { flexDirection: 'row' },
    
    tileBtn: { 
        flex: 1, 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: COLORS.white, 
        padding: 16, 
        borderRadius: 20, 
        borderWidth: 1, 
        borderColor: COLORS.border,
        gap: 15
    },
    tileBtnDanger: { borderColor: '#FEE2E2' },
    tileIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    tileTitle: { fontSize: 15, fontWeight: '700', color: '#334155' },
    tileSub: { fontSize: 12, color: COLORS.slate, marginTop: 2 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.7)', justifyContent: 'center', alignItems: 'center' },
    modalBox: { backgroundColor: COLORS.white, borderRadius: 28, padding: 30, alignItems: 'center' },
    modalIconWrap: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
    modalMsg: { fontSize: 15, color: COLORS.slate, textAlign: 'center', lineHeight: 22, marginBottom: 25 },
    modalActions: { flexDirection: 'row', gap: 10, width: '100%' },
    mBtnSecondary: { flex: 1, height: 50, borderRadius: 12, backgroundColor: COLORS.slateLight, justifyContent: 'center', alignItems: 'center' },
    mBtnPrimary: { flex: 1.5, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    mBtnSecondaryText: { fontWeight: '700', color: COLORS.slate },
    mBtnPrimaryText: { fontWeight: '800', color: COLORS.white }
});