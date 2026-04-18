import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, ScrollView, Platform, Modal, Animated
} from 'react-native';
import { COLORS } from '../theme';
import { Feather, Ionicons } from '@expo/vector-icons';
import { API_URL } from '../config';

export default function ProfileScreen({ user, setUser, navigate }) {
    const [name, setName] = useState(user?.full_name || user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');
    
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    
    // Custom Banner/Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState({ type: 'info', title: '', message: '', onConfirm: null });

    const showBanner = (type, title, message, onConfirm = null) => {
        setModalConfig({ type, title, message, onConfirm });
        setModalVisible(true);
    };

    const handleUpdate = async () => {
        setSaving(true);
        try {
            const response = await fetch(`${API_URL}api/auth/users/${user?.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ full_name: name, email, phone })
            });
            const data = await response.json();
            if (response.ok) {
                setUser({ ...user, name: data.full_name, full_name: data.full_name, email: data.email, phone: data.phone });
                showBanner('success', "Success", "Profile updated successfully!");
            } else {
                showBanner('error', "Error", data.detail || "Failed to update profile.");
            }
        } catch (err) {
            showBanner('error', "Network Error", "Could not connect to the server.");
        } finally {
            setSaving(false);
        }
    };

    const executeLogout = () => {
        setUser(null);
        navigate('LANDING');
    };

    const handleLogout = () => {
        showBanner('confirm', "Log Out", "Are you sure you want to log out?", executeLogout);
    };

    const executeDelete = async () => {
        setModalVisible(false);
        setDeleting(true);
        try {
            const response = await fetch(`${API_URL}api/auth/users/${user?.id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                setUser(null);
                navigate('LANDING');
            } else {
                showBanner('error', "Error", "Failed to delete account. It may have already been deleted.");
            }
        } catch (err) {
            showBanner('error', "Network Error", "Could not connect to the server.");
        } finally {
            setDeleting(false);
        }
    };

    const handleDelete = () => {
        showBanner(
            'Danger', 
            "Delete Account", 
            "Are you sure you want to delete your account? This action cannot be undone and all your medical data will be lost.",
            executeDelete
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                
                <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{name ? name[0].toUpperCase() : 'U'}</Text>
                    </View>
                    <Text style={styles.title}>Your Profile</Text>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your full name" />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Email Address</Text>
                    <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="Your email" />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Your phone number" />
                </View>

                <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate} disabled={saving}>
                    {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Feather name="log-out" size={18} color={COLORS.primary} />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={deleting}>
                    {deleting ? <ActivityIndicator color={COLORS.dangerText} /> : (
                        <>
                            <Feather name="trash-2" size={18} color={COLORS.dangerText} />
                            <Text style={styles.deleteText}>Delete Account</Text>
                        </>
                    )}
                </TouchableOpacity>

            </ScrollView>

            {/* Custom Modal Popup */}
            <Modal visible={modalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={[
                            styles.modalIconBox, 
                            { backgroundColor: modalConfig.type === 'error' || modalConfig.type === 'danger' ? COLORS.dangerBg : COLORS.successBg }
                        ]}>
                            <Feather 
                                name={modalConfig.type === 'error' || modalConfig.type === 'danger' ? 'alert-triangle' : 'check-circle'} 
                                size={24} 
                                color={modalConfig.type === 'error' || modalConfig.type === 'danger' ? COLORS.dangerText : COLORS.primary} 
                            />
                        </View>
                        
                        <Text style={styles.modalTitle}>{modalConfig.title}</Text>
                        <Text style={styles.modalMessage}>{modalConfig.message}</Text>
                        
                        <View style={styles.modalButtons}>
                            {(modalConfig.type === 'confirm' || modalConfig.type === 'danger') && (
                                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                                    <Text style={styles.modalCancelText}>Cancel</Text>
                                </TouchableOpacity>
                            )}
                            
                            <TouchableOpacity 
                                style={[
                                    styles.modalActionBtn, 
                                    { backgroundColor: modalConfig.type === 'danger' ? COLORS.dangerText : COLORS.primary }
                                ]} 
                                onPress={() => {
                                    if (modalConfig.onConfirm) {
                                        modalConfig.onConfirm();
                                    } else {
                                        setModalVisible(false);
                                    }
                                }}
                            >
                                <Text style={styles.modalActionText}>
                                    {modalConfig.type === 'confirm' || modalConfig.type === 'danger' ? 'Yes, Continue' : 'Okay'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    content: { padding: 24, paddingBottom: 100 },
    avatarContainer: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    avatarText: { fontSize: 32, fontWeight: '800', color: COLORS.white },
    title: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
    formGroup: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8 },
    input: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 14, fontSize: 16, color: COLORS.textPrimary },
    saveBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    saveBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
    divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 30 },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: COLORS.successBg, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: COLORS.primary + '30' },
    logoutText: { color: COLORS.primaryDark, fontSize: 16, fontWeight: '700', marginLeft: 8 },
    deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: COLORS.dangerBg, borderRadius: 12, borderWidth: 1, borderColor: '#FECACA' },
    deleteText: { color: COLORS.dangerText, fontSize: 16, fontWeight: '700', marginLeft: 8 },
    
    /* Modal Styles */
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: COLORS.white, width: '100%', maxWidth: 340, borderRadius: 24, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
    modalIconBox: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8, textAlign: 'center' },
    modalMessage: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
    modalButtons: { flexDirection: 'row', width: '100%', gap: 12 },
    modalCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: COLORS.lightGray, alignItems: 'center' },
    modalCancelText: { color: COLORS.textSecondary, fontSize: 15, fontWeight: '600' },
    modalActionBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    modalActionText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
});
