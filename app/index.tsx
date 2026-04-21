import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import db from './db';

const { width } = Dimensions.get('window');

const Theme = {
  primary: '#0f172a',
  secondary: '#10b981',
  background: '#f8fafc',
  text: '#1e293b',
};

export default function Login() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [storedPin, setStoredPin] = useState('1234');

  useEffect(() => {
    try {
      const res = db.getAllSync("SELECT value FROM settings WHERE key = 'app_pin'")[0] as any;
      if (res?.value) setStoredPin(res.value);
    } catch (e) {
      console.error("Login: DB check failed", e);
    }
  }, []);

  const handlePress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      
      if (newPin.length === 4) {
        // Use timeout to allow UI to fill the 4th dot before navigation/alert
        setTimeout(() => {
          if (newPin === storedPin) {
            router.replace('/(tabs)');
          } else {
            Alert.alert("Incorrect PIN", "Please try again.");
            setPin('');
          }
        }, 100);
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoBox}>
          <MaterialCommunityIcons name="shield-lock" size={50} color="#fff" />
        </View>
        <Text style={styles.title}>Secure Access</Text>
        <Text style={styles.subtitle}>Enter PIN to unlock Order Booker</Text>
      </View>

      <View style={styles.pinDisplay}>
        {[1, 2, 3, 4].map((_, i) => (
          <View key={i} style={[styles.dot, pin.length > i && styles.dotFilled]} />
        ))}
      </View>

      <View style={styles.numpad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <TouchableOpacity key={num} style={styles.numBtn} onPress={() => handlePress(num.toString())}>
            <Text style={styles.numText}>{num}</Text>
          </TouchableOpacity>
        ))}
        <View style={styles.numBtn} />
        <TouchableOpacity style={styles.numBtn} onPress={() => handlePress('0')}>
          <Text style={styles.numText}>0</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.numBtn} onPress={handleBackspace}>
          <MaterialCommunityIcons name="backspace-outline" size={28} color={Theme.primary} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background, alignItems: 'center', justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 50 },
  logoBox: { width: 100, height: 100, backgroundColor: Theme.primary, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: Theme.primary, marginTop: 20 },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 5 },
  pinDisplay: { flexDirection: 'row', gap: 20, marginBottom: 50 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#cbd5e1' },
  dotFilled: { backgroundColor: Theme.primary, borderColor: Theme.primary },
  numpad: { flexDirection: 'row', flexWrap: 'wrap', width: width * 0.8, justifyContent: 'center' },
  numBtn: { width: width * 0.22, height: width * 0.22, justifyContent: 'center', alignItems: 'center', margin: 10, borderRadius: width * 0.11, backgroundColor: '#fff', elevation: 2 },
  numText: { fontSize: 28, fontWeight: 'bold', color: Theme.primary }
});
