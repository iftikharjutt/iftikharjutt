import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import db from './db';

const Theme = {
  primary: '#0f172a',
  background: '#f8fafc',
  text: '#1e293b',
  textLight: '#64748b',
};

const InputField = ({ label, icon, ...props }: any) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrapper}>
      <MaterialCommunityIcons name={icon} size={20} color={Theme.textLight} style={styles.icon} />
      <TextInput style={styles.input} placeholderTextColor="#94a3b8" {...props} />
    </View>
  </View>
);

export default function AddCustomer() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', contact: '', address: '', balance: '0' });

  const saveCustomer = () => {
    if (!form.name) return Alert.alert("Error", "Customer Name is required");
    try {
      db.runSync(
        'INSERT INTO customers (name, contact, address, balance) VALUES (?, ?, ?, ?)',
        [form.name, form.contact, form.address, parseFloat(form.balance) || 0]
      );
      Alert.alert("Success", "Customer Profile Created");
      router.back();
    } catch (e) { 
      console.error(e);
      Alert.alert("Error", "Failed to save"); 
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.formCard}>
          <InputField label="Full Name" icon="account" placeholder="Ali Ahmed" value={form.name} onChangeText={(t: string) => setForm({...form, name: t})} />
          <InputField label="WhatsApp Number" icon="whatsapp" placeholder="03001234567" keyboardType="phone-pad" value={form.contact} onChangeText={(t: string) => setForm({...form, contact: t})} />
          <InputField label="Shop Address" icon="map-marker" placeholder="Galla Mandi" value={form.address} onChangeText={(t: string) => setForm({...form, address: t})} />
          <InputField label="Opening Balance (Khata)" icon="cash" placeholder="0.00" keyboardType="numeric" value={form.balance} onChangeText={(t: string) => setForm({...form, balance: t})} />
          
          <TouchableOpacity style={styles.saveBtn} onPress={saveCustomer}>
            <Text style={styles.saveText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  scroll: { padding: 20 },
  formCard: { backgroundColor: '#fff', padding: 25, borderRadius: 25, elevation: 4 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: Theme.text, marginBottom: 8, marginLeft: 5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 15, paddingHorizontal: 15 },
  icon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 15, fontSize: 16, color: Theme.text },
  saveBtn: { backgroundColor: Theme.primary, padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
