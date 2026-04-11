import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Image,
  Animated, LayoutAnimation, UIManager, Platform, TextInput
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme';
import { API_URL } from '../config';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MedicineCard = ({ item, index, editing, onChange }) => {
  const [expanded, setExpanded] = useState(false);
  const [showSimple, setShowSimple] = useState(true); // default to simple

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  const exp = item.explanation || {};

  if (editing) {
    return (
      <View style={[styles.medCard, { padding: 14 }]}>
        <Text style={styles.sectionLabel}>MEDICINE NAME</Text>
        <TextInput
          style={styles.editInput}
          value={item.medicine || item.name}
          onChangeText={(v) => onChange({ ...item, medicine: v, name: v })}
        />
        <Text style={[styles.sectionLabel, { marginTop: 10 }]}>DOSAGE</Text>
        <TextInput
          style={styles.editInput}
          value={item.dosage || item.dose}
          onChangeText={(v) => onChange({ ...item, dosage: v, dose: v })}
        />
        <Text style={[styles.sectionLabel, { marginTop: 10 }]}>FREQUENCY</Text>
        <TextInput
          style={styles.editInput}
          value={item.frequency || ''}
          onChangeText={(v) => onChange({ ...item, frequency: v })}
        />
        <Text style={[styles.sectionLabel, { marginTop: 10 }]}>DURATION</Text>
        <TextInput
          style={styles.editInput}
          value={item.duration || ''}
          onChangeText={(v) => onChange({ ...item, duration: v })}
        />
      </View>
    );
  }

  return (
    <View style={styles.medCard}>
      <TouchableOpacity style={styles.medHeader} onPress={toggle} activeOpacity={0.7}>
        <View style={styles.medHeaderLeft}>
          <View style={styles.medIndex}>
            <Text style={styles.medIndexText}>{index + 1}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.medName}>{item.medicine || item.name}</Text>
            <Text style={styles.medBrief}>{item.dosage || '—'} · {item.frequency || '—'}</Text>
          </View>
        </View>
        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.medBody}>
          <View style={styles.langToggle}>
            <TouchableOpacity
              style={[styles.langBtn, showSimple && styles.langBtnActive]}
              onPress={() => setShowSimple(true)}
            >
              <Text style={[styles.langBtnText, showSimple && styles.langBtnTextActive]}>Simple</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langBtn, !showSimple && styles.langBtnActive]}
              onPress={() => setShowSimple(false)}
            >
              <Text style={[styles.langBtnText, !showSimple && styles.langBtnTextActive]}>Medical</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>WHAT IT DOES</Text>
          <Text style={styles.medDesc}>
            {showSimple ? exp.what_it_does : exp.simple_summary}
          </Text>

          {exp.generic_name && (
            <Text style={styles.genericText}>Generic: {exp.generic_name} · {exp.medicine_class || ''}</Text>
          )}

          <View style={styles.detailGrid}>
            {[
              { label: 'DOSAGE', value: item.dosage || item.dose },
              { label: 'FREQUENCY', value: item.frequency },
              { label: 'DURATION', value: item.duration },
            ].map((d, i) => (
              <View key={i} style={[styles.detailBox, i < 2 && styles.detailBoxBorder]}>
                <Text style={styles.detailLabel}>{d.label}</Text>
                <Text style={styles.detailValue}>{d.value || '—'}</Text>
              </View>
            ))}
          </View>

          {exp.how_to_take && (
            <>
              <Text style={styles.sectionLabel}>HOW TO TAKE</Text>
              <Text style={styles.medDesc}>{exp.how_to_take}</Text>
            </>
          )}

          {(exp.common_side_effects || []).length > 0 && (
            <>
              <View style={styles.badgeHeader}>
                <Ionicons name="warning-outline" size={14} color={COLORS.dangerText} />
                <Text style={styles.badgeHeaderText}>SIDE EFFECTS</Text>
              </View>
              <View style={styles.badgeRow}>
                {exp.common_side_effects.map((e, i) => (
                  <View key={i} style={styles.dangerBadge}>
                    <Text style={styles.dangerBadgeText}>{e}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {exp.important_warning && (
            <View style={styles.warningBanner}>
              <Ionicons name="warning" size={16} color={COLORS.dangerText} />
              <Text style={styles.warningText}>{exp.important_warning}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

export default function PrescriptionDetailScreen({ route, navigation }) {
  const { record, refreshHistory } = route.params;
  const [editing, setEditing] = useState(false);
  const [results, setResults] = useState(record.results || []);

  const handleSave = async () => {
    try {
      const response = await fetch(`${API_URL}api/prescriptions/${record.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results }),
      });
      if (response.ok) {
        setEditing(false);
        if (refreshHistory) refreshHistory();
      }
    } catch (err) {
      console.error('Failed to update prescription:', err);
    }
  };

  const handleUpdateMed = (index, newVal) => {
    const arr = [...results];
    arr[index] = newVal;
    setResults(arr);
  };

  const handleDeleteMed = (index) => {
    const arr = results.filter((_, i) => i !== index);
    setResults(arr);
  };

  const formatDate = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        
        <View style={styles.metaCard}>
            <View style={styles.metaTop}>
                <View style={styles.metaIcon}>
                    <Feather name="file-text" size={24} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.metaCondition}>{record.condition}</Text>
                    <Text style={styles.metaDate}>{formatDate(record.date)}</Text>
                </View>
            </View>
            <View style={styles.metaRowInfo}>
                <Text style={styles.metaLabel}>Doctor / Issuer</Text>
                <Text style={styles.metaValue}>{record.doctor}</Text>
            </View>
            {record.notes && (
                <View style={styles.metaRowInfo}>
                    <Text style={styles.metaLabel}>Extracted Notes</Text>
                    <Text style={styles.metaValue}>{record.notes}</Text>
                </View>
            )}
        </View>

        <View style={styles.medsSection}>
          <View style={styles.medsSectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="pill" size={20} color={COLORS.primary} />
                <Text style={styles.medsSectionTitle}>
                Medicines
                </Text>
            </View>
            <TouchableOpacity onPress={() => editing ? handleSave() : setEditing(true)}>
                <Text style={styles.editAction}>{editing ? 'Save Changes' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>
          
          {results.map((med, i) => (
            <View key={i} style={{ marginBottom: editing ? 14 : 0 }}>
                <MedicineCard
                    item={med}
                    index={i}
                    editing={editing}
                    onChange={(v) => handleUpdateMed(i, v)}
                />
                {editing && (
                    <TouchableOpacity style={styles.delBtn} onPress={() => handleDeleteMed(i)}>
                        <Feather name="trash-2" size={16} color="#EF4444" />
                        <Text style={{color: '#EF4444', fontSize: 13, fontWeight: '600'}}>Delete</Text>
                    </TouchableOpacity>
                )}
            </View>
          ))}
          {editing && (
            <TouchableOpacity style={styles.addMedBtn} onPress={() => setResults([...results, {}])}>
                <Feather name="plus" size={16} color={COLORS.primary} />
                <Text style={{color: COLORS.primary, fontSize: 14, fontWeight: '600'}}>Add Medicine</Text>
            </TouchableOpacity>
          )}
        </View>

        {record.image_url && (
            <View style={styles.medsSection}>
                <Text style={styles.medsSectionTitle}>Original Scan</Text>
                <Image 
                    source={{ uri: `${API_URL.replace(/\/$/, '')}${record.image_url}` }} 
                    style={{ width: '100%', height: 350, borderRadius: 12, marginTop: 12 }}
                    resizeMode="contain"
                />
            </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  metaCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  metaTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  metaIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.successBg, justifyContent: 'center', alignItems: 'center' },
  metaCondition: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  metaDate: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  metaRowInfo: { paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: 4, paddingBottom: 4 },
  metaLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textSecondary, letterSpacing: 0.5, marginBottom: 4 },
  metaValue: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 20 },
  medsSection: { backgroundColor: COLORS.white, borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  medsSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  medsSectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  editAction: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  medCard: { borderWidth: 1, borderColor: COLORS.lightGray, borderRadius: 14, marginBottom: 10, overflow: 'hidden' },
  medHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, backgroundColor: COLORS.lightGray },
  medHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  medIndex: { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.successBg, justifyContent: 'center', alignItems: 'center' },
  medIndexText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  medName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  medBrief: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  medBody: { padding: 14, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.lightGray },
  langToggle: { flexDirection: 'row', backgroundColor: COLORS.lightGray, borderRadius: 10, padding: 3, marginBottom: 14, alignSelf: 'flex-start' },
  langBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  langBtnActive: { backgroundColor: COLORS.primary },
  langBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  langBtnTextActive: { color: COLORS.white },
  sectionLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, letterSpacing: 0.5, marginBottom: 6 },
  medDesc: { fontSize: 14, color: COLORS.textPrimary, lineHeight: 21, marginBottom: 14 },
  genericText: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 12, fontStyle: 'italic' },
  detailGrid: { flexDirection: 'row', backgroundColor: COLORS.lightGray, borderRadius: 10, padding: 12, marginBottom: 14 },
  detailBox: { flex: 1, alignItems: 'center' },
  detailBoxBorder: { borderRightWidth: 1, borderRightColor: COLORS.border },
  detailLabel: { fontSize: 10, fontWeight: '600', color: COLORS.textSecondary, letterSpacing: 0.5, marginBottom: 4 },
  detailValue: { fontSize: 13, fontWeight: '700', color: COLORS.primary, textAlign: 'center' },
  badgeHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  badgeHeaderText: { fontSize: 11, fontWeight: '700', color: COLORS.dangerText, letterSpacing: 0.5 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dangerBadge: { backgroundColor: COLORS.dangerBg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: '#FECACA' },
  dangerBadgeText: { color: COLORS.dangerText, fontSize: 12, fontWeight: '500' },
  warningBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: COLORS.dangerBg, padding: 12, borderRadius: 10, marginTop: 10, borderWidth: 1, borderColor: '#FECACA' },
  warningText: { flex: 1, fontSize: 13, color: COLORS.dangerText, lineHeight: 19 },
  editInput: { backgroundColor: COLORS.lightGray, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: COLORS.textPrimary },
  delBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FEF2F2', paddingVertical: 10, borderRadius: 10, marginTop: -6 },
  addMedBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.successBg, paddingVertical: 14, borderRadius: 12, marginTop: 10 }
});
