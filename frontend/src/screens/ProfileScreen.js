import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, ScrollView
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

    const handleUpdate = async () => {
        setSaving(true);
        try {
            const response = await fetch(`${API_URL}api/auth/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ full_name: name, email, phone })
            });
            const data = await response.json();
            if (response.ok) {
                // Update local user state
                setUser({ ...user, name: data.full_name, full_name: data.full_name, email: data.email, phone: data.phone });
                Alert.alert("Success", "Profile updated successfully");
            } else {
                Alert.alert("Error", data.detail || "Failed to update profile");
            }
        } catch (err) {
            Alert.alert("Error", "Network error updating profile");
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        setUser(null);
        navigate('LANDING');
    };

    const handleDelete = async () => {
        Alert.alert(
            "Delete Account",
            "Are you sure you want to delete your account? This action cannot be undone and will erase all your medical history.",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Delete", style: "destructive",
                    onPress: async () => {
                        setDeleting(true);
                        try {
                            const response = await fetch(`${API_URL}api/auth/users/${user.id}`, {
                                method: 'DELETE'
                            });
                            if (response.ok) {
                                setUser(null);
                                navigate('LANDING');
                            } else {
                                Alert.alert("Error", "Failed to delete account");
                            }
                        } catch (err) {
                            Alert.alert("Error", "Network error deleting account");
                        } finally {
                            setDeleting(false);
                        }
                    }
                }
            ]
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
                    <Feather name="trash-2" size={18} color={COLORS.dangerText} />
                    <Text style={styles.deleteText}>Delete Account</Text>
                </TouchableOpacity>

            </ScrollView>
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
});
