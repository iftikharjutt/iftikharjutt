import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, ScrollView, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import db from './db';

const Theme = {
  primary: '#0f172a',
  secondary: '#10b981',
  background: '#f8fafc',
  text: '#1e293b',
  textLight: '#64748b',
};

export default function Settings() {
  const router = useRouter();
  const [shopName, setShopName] = useState('');
  const [shopWhatsApp, setShopWhatsApp] = useState('');
  const [appPin, setAppPin] = useState('');

  useEffect(() => {
    const name = db.getAllSync("SELECT value FROM settings WHERE key = 'shop_name'")[0] as any;
    const whatsapp = db.getAllSync("SELECT value FROM settings WHERE key = 'shop_whatsapp'")[0] as any;
    const pin = db.getAllSync("SELECT value FROM settings WHERE key = 'app_pin'")[0] as any;
    setShopName(name?.value || 'Iftikhar Brothers');
    setShopWhatsApp(whatsapp?.value || '');
    setAppPin(pin?.value || '1234');
  }, []);

  const updateSetting = (key: string, value: string) => {
    db.runSync("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", [key, value]);
  };

  const exportDB = async () => {
    Alert.alert(
      "Cloud Sync",
      "Google Drive integration requires OAuth Client ID. Would you like to save a local copy of the database to your documents folder instead?",
      [
        { text: "Later", style: "cancel" },
        { text: "Backup Locally", onPress: async () => {
          try {
            const dbUri = `${FileSystem.documentDirectory}SQLite/iftikhar_brothers.db`;
            const backupUri = `${FileSystem.cacheDirectory}iftikhar_brothers_backup.db`;
            await FileSystem.copyAsync({ from: dbUri, to: backupUri });
            Alert.alert("Success", "Local backup created in cache.");
          } catch (e) {
            Alert.alert("Error", "Local backup failed");
          }
        }}
      ]
    );
  };

  const resetDB = () => {
    Alert.alert(
      "Warning",
      "This will delete ALL customers, orders, and products. This cannot be undone!",
      [
        { text: "Cancel", style: "cancel" },
        { text: "RESET ALL", style: "destructive", onPress: () => {
          db.runSync('DELETE FROM customers');
          db.runSync('DELETE FROM orders');
          db.runSync('DELETE FROM recoveries');
          db.runSync('DELETE FROM order_items');
          Alert.alert("Reset", "All data has been cleared.");
        }}
      ]
    );
  };

  const SettingRow = ({ title, sub, icon, color, onPress }: any) => (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <View style={{ flex: 1, marginLeft: 15 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{sub}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color="#cbd5e1" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shop Details</Text>
          <View style={styles.inputCard}>
            <Text style={styles.label}>Shop Name</Text>
            <TextInput 
              style={styles.input} 
              value={shopName} 
              onChangeText={(t) => { setShopName(t); updateSetting('shop_name', t); }}
              placeholder="Shop Name"
            />
            <Text style={[styles.label, { marginTop: 15 }]}>Shop WhatsApp (Receipt Target)</Text>
            <TextInput 
              style={styles.input} 
              value={shopWhatsApp} 
              onChangeText={(t) => { setShopWhatsApp(t); updateSetting('shop_whatsapp', t); }}
              placeholder="03001234567"
              keyboardType="phone-pad"
            />
            <Text style={[styles.label, { marginTop: 15 }]}>Security PIN (4 Digits)</Text>
            <TextInput 
              style={styles.input} 
              value={appPin} 
              onChangeText={(t) => { 
                if (t.length <= 4) {
                  setAppPin(t); 
                  if (t.length === 4) {
                    updateSetting('app_pin', t);
                    Alert.alert("PIN Updated", "New security PIN has been saved.");
                  }
                }
              }}
              placeholder="1234"
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cloud & Sync</Text>
          <SettingRow 
            title="Google Drive Backup" 
            sub="Save your Khata to the cloud" 
            icon="google-drive" 
            color="#4285F4" 
            onPress={exportDB}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support & Debugging</Text>
          <SettingRow 
            title="Crash & Error Logs" 
            sub="View application error reports" 
            icon="bug-outline" 
            color="#ef4444" 
            onPress={() => router.push('/error-logs')}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>Danger Zone</Text>
          <SettingRow 
            title="Clear All Data" 
            sub="Wipe entire database (Careful!)" 
            icon="database-remove" 
            color="#ef4444" 
            onPress={resetDB}
          />
        </View>

        <Text style={styles.version}>Version 1.2.5 (Security Build)</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  section: { marginVertical: 10, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: Theme.textLight, marginBottom: 10, textTransform: 'uppercase', marginLeft: 5 },
  inputCard: { backgroundColor: '#fff', padding: 20, borderRadius: 20, elevation: 1 },
  label: { fontSize: 12, fontWeight: 'bold', color: Theme.textLight, marginBottom: 5 },
  input: { backgroundColor: '#f1f5f9', padding: 12, borderRadius: 10, fontSize: 16, color: Theme.text },
  row: { backgroundColor: '#fff', padding: 18, borderRadius: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 10, elevation: 1 },
  iconBox: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  rowTitle: { fontSize: 16, fontWeight: 'bold', color: Theme.text },
  rowSub: { fontSize: 12, color: Theme.textLight, marginTop: 2 },
  version: { textAlign: 'center', color: '#94a3b8', fontSize: 12, marginVertical: 30 }
});
