import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const MapView = ({ children, style }) => (
  <View style={[style, styles.container]}>
    <Text style={styles.text}>Interactive Map Not Supported on Web</Text>
    <View style={{ display: 'none' }}>
      {children}
    </View>
  </View>
);

export const Marker = ({ children }) => <>{children}</>;

export const PROVIDER_GOOGLE = null;

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#eaeaea',
  },
  text: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  }
});
