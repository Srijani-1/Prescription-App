import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, Dimensions, TouchableOpacity } from 'react-native';
import { MapView, Marker, PROVIDER_GOOGLE } from '../components/Map';
import * as Location from 'expo-location';
import { COLORS } from '../theme';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { API_URL } from '../config';

export default function PharmacyScreen() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pharmacies, setPharmacies] = useState([]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setLoading(false);
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);

      try {
        const response = await fetch(`${API_URL}api/pharmacies/nearby?lat=${loc.coords.latitude}&lng=${loc.coords.longitude}`);
        const data = await response.json();
        if (data.pharmacies) {
            setPharmacies(data.pharmacies);
        } else {
            setPharmacies([]);
        }
      } catch(err) {
        console.error("Pharmacy API fetch error", err);
        setErrorMsg("Failed to load nearby pharmacies.");
      }
      setLoading(false);
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nearby Pharmacies</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Finding nearest pharmacies...</Text>
        </View>
      ) : errorMsg ? (
        <View style={styles.center}>
          <Feather name="map-pin" size={48} color={COLORS.textSecondary} />
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : location ? (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
            showsUserLocation={true}
          >
            {pharmacies.map(pharmacy => (
              <Marker
                key={pharmacy.id}
                coordinate={{ latitude: pharmacy.latitude, longitude: pharmacy.longitude }}
                title={pharmacy.title}
                description="Medicine Shop"
              >
                 <View style={styles.markerBadge}>
                    <MaterialCommunityIcons name="medical-bag" size={16} color="#FFF" />
                 </View>
              </Marker>
            ))}
          </MapView>
          
          <View style={styles.bottomSheet}>
             <View style={styles.sheetHandle} />
             <Text style={styles.sheetTitle}>{pharmacies.length} Pharmacies Nearby</Text>
             {pharmacies.map(p => (
                <View key={p.id} style={styles.pharmacyCard}>
                   <View style={styles.pharmacyIcon}>
                      <MaterialCommunityIcons name="medical-bag" size={20} color={COLORS.primary} />
                   </View>
                   <View style={{flex: 1}}>
                      <Text style={styles.pharmacyName}>{p.title}</Text>
                      <Text style={styles.pharmacySub}>Open until 9:00 PM</Text>
                   </View>
                   <TouchableOpacity style={styles.dirBtn}>
                      <Feather name="navigation" size={16} color="#FFF" />
                   </TouchableOpacity>
                </View>
             ))}
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 20, paddingTop: 40, backgroundColor: COLORS.cardBg, borderBottomWidth: 1, borderBottomColor: COLORS.border, zIndex: 10 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 16, fontSize: 16, color: COLORS.textSecondary },
  errorText: { marginTop: 16, fontSize: 16, color: COLORS.dangerText, textAlign: 'center' },
  mapContainer: { flex: 1, position: 'relative' },
  map: { width: Dimensions.get('window').width, height: Dimensions.get('window').height },
  markerBadge: { backgroundColor: COLORS.primary, padding: 6, borderRadius: 16, borderWidth: 2, borderColor: '#FFF' },
  bottomSheet: {
     position: 'absolute', bottom: 0, left: 0, right: 0,
     backgroundColor: COLORS.cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
     padding: 20, shadowColor: '#000', shadowOffset: {width:0, height:-4}, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: COLORS.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16 },
  pharmacyCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  pharmacyIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.successBg, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  pharmacyName: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  pharmacySub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  dirBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' }
});
