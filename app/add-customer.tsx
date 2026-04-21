import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Contacts from 'expo-contacts';
import db from './db';

const Theme = {
  primary: '#0f172a',
  background: '#f8fafc',
  text: '#1e293b',
  textLight: '#64748b',
};

const InputField = ({ label, icon, rightIcon, onRightIconPress, ...props }: any) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrapper}>
      <MaterialCommunityIcons name={icon} size={20} color={Theme.textLight} style={styles.icon} />
      <TextInput style={styles.input} placeholderTextColor="#94a3b8" {...props} />
      {rightIcon && (
        <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
          <MaterialCommunityIcons name={rightIcon} size={24} color={Theme.primary} />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

export default function AddCustomer() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', person_name: '', contact: '', address: '', balance: '0' });
  const [balanceType, setBalanceType] = useState<'debit' | 'credit'>('debit');

  const pickContact = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status === 'granted') {
        const { contact } = await Contacts.presentContactPickerAsync();
        if (contact) {
          const name = contact.name || '';
          const phone = contact.phoneNumbers && contact.phoneNumbers.length > 0 
            ? contact.phoneNumbers[0].number?.replace(/\s/g, '') 
            : '';
          
          setForm(prev => ({
            ...prev,
            person_name: name,
            contact: phone || prev.contact
          }));
        }
      } else {
        Alert.alert("Permission Denied", "We need contact permissions to pick a phone number.");
      }
    } catch (e) {
      Alert.alert("Error", "Could not open contact picker");
    }
  };

  const saveCustomer = () => {
    if (!form.name) return Alert.alert("Error", "Shop/Business Name is required");
    try {
      let finalBalance = parseFloat(form.balance) || 0;
      if (balanceType === 'credit') {
        finalBalance = -Math.abs(finalBalance);
      } else {
        finalBalance = Math.abs(finalBalance);
      }

      db.runSync(
        'INSERT INTO customers (name, person_name, contact, address, balance) VALUES (?, ?, ?, ?, ?)',
        [form.name, form.person_name, form.contact, form.address, finalBalance]
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
          <InputField label="Shop/Business Name" icon="store" placeholder="Ali Keryana Store" value={form.name} onChangeText={(t: string) => setForm({...form, name: t})} />
          <InputField label="Person Name" icon="account" placeholder="Ali Ahmed" value={form.person_name} onChangeText={(t: string) => setForm({...form, person_name: t})} />
          <InputField 
            label="WhatsApp Number" 
            icon="whatsapp" 
            placeholder="03001234567" 
            keyboardType="phone-pad" 
            value={form.contact} 
            onChangeText={(t: string) => setForm({...form, contact: t})}
            rightIcon="contacts-outline"
            onRightIconPress={pickContact}
          />
          <InputField label="Shop Address" icon="map-marker" placeholder="Galla Mandi" value={form.address} onChangeText={(t: string) => setForm({...form, address: t})} />
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Opening Balance</Text>
            <View style={styles.balanceTypeRow}>
              <TouchableOpacity 
                style={[styles.typeBtn, balanceType === 'debit' && styles.typeBtnActive]} 
                onPress={() => setBalanceType('debit')}
              >
                <Text style={[styles.typeBtnText, balanceType === 'debit' && styles.typeBtnTextActive]}>Debit (Receivable)</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.typeBtn, balanceType === 'credit' && styles.typeBtnActive]} 
                onPress={() => setBalanceType('credit')}
              >
                <Text style={[styles.typeBtnText, balanceType === 'credit' && styles.typeBtnTextActive]}>Credit (Advance)</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="cash" size={20} color={Theme.textLight} style={styles.icon} />
              <TextInput 
                style={styles.input} 
                placeholder="0.00" 
                placeholderTextColor="#94a3b8" 
                keyboardType="numeric" 
                value={form.balance} 
                onChangeText={(t: string) => setForm({...form, balance: t})} 
              />
            </View>
          </View>
          
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
  balanceTypeRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  typeBtn: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  typeBtnActive: { backgroundColor: Theme.primary, borderColor: Theme.primary },
  typeBtnText: { fontSize: 12, fontWeight: 'bold', color: Theme.textLight },
  typeBtnTextActive: { color: '#fff' },
  icon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 15, fontSize: 16, color: Theme.text },
  rightIcon: { padding: 10 },
  saveBtn: { backgroundColor: Theme.primary, padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});