import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, ActivityIndicator, Image,
} from 'react-native';
import { COLORS } from '../theme';
import { MaterialCommunityIcons, Feather, Ionicons } from '@expo/vector-icons';
import { API_URL } from '../config';

export default function MedicalHistoryScreen({ user }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [newCondition, setNewCondition] = useState('');
  const [newDoctor, setNewDoctor] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingResults, setEditingResults] = useState([]);

  useEffect(() => {
    if (user?.id) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}api/prescriptions/history?user_id=${user.id}`);
      const data = await response.json();
      if (data.status === 'success') {
        const formatted = data.history.map(item => ({
          id: item.id,
          date: item.date,
          condition: item.results?.[0]?.explanation?.medicine_class || 'General Checkup',
          doctor: item.results?.[0]?.explanation?.brand_name || 'Prescription Scan',
          medicines: item.results.map(r => r.medicine),
          notes: item.results?.[0]?.explanation?.what_it_does || item.raw_text?.substring(0, 100),
          image_url: item.image_url,
        }));
        setRecords(formatted);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    if (!newCondition) return;
    setRecords([{
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      condition: newCondition,
      doctor: newDoctor || 'Unknown Doctor',
      medicines: [],
      notes: newNotes,
    }, ...records]);
    setAdding(false);
    setNewCondition(''); setNewDoctor(''); setNewNotes('');
  };

  const handleSaveEdit = async (id) => {
    try {
      const response = await fetch(`${API_URL}api/prescriptions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results: editingResults }),
      });
      if (response.ok) {
        setEditingId(null);
        fetchHistory(); // refresh to show updated data
      }
    } catch (err) {
      console.error('Failed to update prescription:', err);
    }
  };

  const handleDeleteRecord = async (id) => {
    try {
      const response = await fetch(`${API_URL}api/prescriptions/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setExpanded(null);
        fetchHistory();
      }
    } catch (err) {
      console.error('Failed to delete prescription:', err);
    }
  };

  const filtered = records.filter(r =>
    r.condition.toLowerCase().includes(search.toLowerCase()) ||
    r.doctor.toLowerCase().includes(search.toLowerCase())
  );

  const stats = [
    { label: 'Total scans', value: records.length.toString(), icon: 'file-document-outline', color: COLORS.primary, bg: COLORS.successBg },
    { label: 'Classes', value: [...new Set(records.map(r => r.condition))].length.toString(), icon: 'clipboard-pulse-outline', color: COLORS.accent, bg: COLORS.accentBg },
    { label: 'Tracked', value: records.length > 0 ? '1 mo' : '0', icon: 'calendar-month-outline', color: COLORS.warningText, bg: COLORS.warningBg },
  ];

  const formatDate = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Medical History</Text>
            <Text style={styles.headerSub}>Your complete health record</Text>
          </View>
          <TouchableOpacity
            style={[styles.addBtn, adding && styles.addBtnClose]}
            onPress={() => setAdding(!adding)}
          >
            <Feather name={adding ? 'x' : 'plus'} size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{user?.name || 'Patient'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'patient@example.com'}</Text>
          </View>
          <View style={styles.profileBadge}>
            <Ionicons name="shield-checkmark" size={14} color={COLORS.primary} />
            <Text style={styles.profileBadgeText}>Verified</Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {stats.map((s, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: s.bg }]}>
              <MaterialCommunityIcons name={s.icon} size={20} color={s.color} />
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {loading && <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 20 }} />}

        {/* Add form */}
        {adding && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Add new record</Text>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Condition / Diagnosis</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Seasonal Allergies"
                placeholderTextColor={COLORS.textSecondary + '80'}
                value={newCondition}
                onChangeText={setNewCondition}
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Doctor Name</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Dr. Sharma"
                placeholderTextColor={COLORS.textSecondary + '80'}
                value={newDoctor}
                onChangeText={setNewDoctor}
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Notes</Text>
              <TextInput
                style={[styles.formInput, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Any additional notes..."
                placeholderTextColor={COLORS.textSecondary + '80'}
                multiline
                value={newNotes}
                onChangeText={setNewNotes}
              />
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
              <Feather name="check" size={16} color={COLORS.white} />
              <Text style={styles.saveBtnText}>Save Record</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Search */}
        <View style={styles.searchBar}>
          <Feather name="search" size={16} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conditions or doctors..."
            placeholderTextColor={COLORS.textSecondary + '80'}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Feather name="x" size={15} color={COLORS.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Records */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Past records</Text>
          <Text style={styles.sectionCount}>{filtered.length} records</Text>
        </View>

        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Feather name="inbox" size={36} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>No records found</Text>
          </View>
        )}

        {filtered.map(record => {
          return (
            <TouchableOpacity
              key={record.id}
              style={styles.recordCard}
              onPress={() => navigate('PRESCRIPTION_DETAIL', { record, refreshHistory: fetchHistory })}
              activeOpacity={0.8}
            >
              <View style={styles.recordTop}>
                <View style={styles.recordIcon}>
                  <MaterialCommunityIcons name="clipboard-pulse" size={18} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recordCondition}>{record.condition}</Text>
                  <Text style={styles.recordMeta}>{record.doctor} · {formatDate(record.date)}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteRecord(record.id)}>
                    <Feather name="trash-2" size={18} color={COLORS.dangerText} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary },
  headerSub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
  },
  addBtnClose: { backgroundColor: COLORS.dangerText },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: 20, marginBottom: 16, padding: 16,
    backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border,
  },
  profileAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.successBg, justifyContent: 'center', alignItems: 'center',
  },
  profileAvatarText: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  profileName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  profileEmail: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  profileBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.successBg, paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.border,
  },
  profileBadgeText: { fontSize: 12, fontWeight: '600', color: COLORS.primaryDark },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, alignItems: 'center', padding: 14, borderRadius: 14, gap: 4,
  },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600', textAlign: 'center' },
  formCard: {
    marginHorizontal: 20, marginBottom: 16, padding: 18,
    backgroundColor: COLORS.white, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border,
  },
  formTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16 },
  formField: { marginBottom: 14 },
  formLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8 },
  formInput: {
    backgroundColor: COLORS.lightGray, borderRadius: 10, padding: 12,
    fontSize: 15, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 12, marginTop: 4,
  },
  saveBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 20, marginBottom: 16, paddingHorizontal: 14, height: 46,
    backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
  },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.textPrimary },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  sectionCount: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 15, color: COLORS.textSecondary },
  recordCard: {
    marginHorizontal: 20, marginBottom: 10, backgroundColor: COLORS.white,
    borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  recordTop: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
  },
  recordIcon: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: COLORS.successBg, justifyContent: 'center', alignItems: 'center',
  },
  recordCondition: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  recordMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  recordBody: {
    padding: 14, paddingTop: 0, borderTopWidth: 1, borderTopColor: COLORS.border,
    backgroundColor: COLORS.lightGray, gap: 12,
  },
  recordSection: { paddingTop: 14 },
  recordLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 0.5, marginBottom: 8 },
  medBadgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  medBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: COLORS.successBg, paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.border,
  },
  medBadgeText: { fontSize: 12, fontWeight: '600', color: COLORS.primaryDark },
  recordNotes: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 21 },
  // Edit Mode Styles
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8, backgroundColor: COLORS.white, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  editInput: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10, fontSize: 13, color: '#111827' },
  deleteBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center' },
  addMedBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, backgroundColor: COLORS.successBg },
  readOnlyMedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  readOnlyMedName: { fontSize: 14, fontWeight: '600', color: '#374151', flex: 1 },
  readOnlyMedDose: { fontSize: 13, fontWeight: '500', color: '#6B7280', flexShrink: 0, marginLeft: 10 },
});
