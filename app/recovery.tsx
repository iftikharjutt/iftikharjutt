import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, Keyboard, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import db from './db';

const Theme = {
  primary: '#0f172a',
  accent: '#6366f1',
  background: '#f8fafc',
  text: '#1e293b',
  textLight: '#64748b',
};

export default function Recovery() {
  const router = useRouter();
  const { customer: customerStr } = useLocalSearchParams();
  const customer = JSON.parse(customerStr as string);
  const [amount, setAmount] = useState('');

  const saveRecovery = () => {
    Keyboard.dismiss();
    const recoveryAmount = parseFloat(amount) || 0;
    if (recoveryAmount <= 0) return Alert.alert("Error", "Enter valid amount");

    const newBalance = customer.balance - recoveryAmount;

    try {
      db.runSync('INSERT INTO recoveries (customer_id, amount) VALUES (?, ?)', [customer.id, recoveryAmount]);
      db.runSync('UPDATE customers SET balance = ? WHERE id = ?', [newBalance, customer.id]);

      Alert.alert(
        "Recovery Saved",
        "Where would you like to send the receipt?",
        [
          { text: "Customer WhatsApp", onPress: () => sendRecoveryWhatsApp(recoveryAmount, newBalance, 'customer') },
          { text: "Shop WhatsApp", onPress: () => sendRecoveryWhatsApp(recoveryAmount, newBalance, 'shop') },
          { text: "Finish", onPress: () => { router.dismissAll(); router.replace('/(tabs)'); } }
        ]
      );
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Save Failed");
    }
  };

  const sendRecoveryWhatsApp = (recAmount: number, newBal: number, target: 'customer' | 'shop') => {
    try {
      const shopNameSet = db.getAllSync("SELECT value FROM settings WHERE key = 'shop_name'")[0] as any;
      const shopWhatsAppSet = db.getAllSync("SELECT value FROM settings WHERE key = 'shop_whatsapp'")[0] as any;

      const message = `
💳 *RECOVERY RECEIPT*
🌟 *${(shopNameSet?.value || 'IFTIKHAR BROTHERS').toUpperCase()}*
━━━━━━━━━━━━━━━━━━
👤 *CUSTOMER:* ${customer.name}
━━━━━━━━━━━━━━━━━━
💰 *RECEIVED AMOUNT:* Rs. ${recAmount.toFixed(0)}
📉 *REMAINING KHATA:* Rs. ${newBal.toFixed(0)}
━━━━━━━━━━━━━━━━━━
_Received with thanks._
_Digital Receipt Generated via Order Booker_`;

      let phone = customer.contact;
      if (target === 'shop') {
        phone = shopWhatsAppSet?.value || '';
      }

      const url = `whatsapp://send?text=${encodeURIComponent(message)}${phone ? '&phone=92' + phone.slice(1) : ''}`;
      Linking.openURL(url)
        .then(() => {
          router.dismissAll();
          router.replace('/(tabs)');
        })
        .catch(() => Alert.alert("Error", "WhatsApp not found"));
    } catch (e) {
      Alert.alert("Error", "Failed to send WhatsApp message");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.infoCard}>
          <Text style={styles.customerName}>{customer.name}</Text>
          <Text style={styles.label}>Current Khata Balance</Text>
          <Text style={styles.balance}>Rs. {customer.balance.toFixed(0)}</Text>
        </View>

        <View style={styles.inputCard}>
          <Text style={styles.label}>Amount Received (Cash)</Text>
          <TextInput 
            style={styles.input} 
            keyboardType="numeric" 
            value={amount} 
            onChangeText={setAmount}
            placeholder="0"
            autoFocus={true}
          />

          <TouchableOpacity style={styles.saveBtn} onPress={saveRecovery}>
            <Text style={styles.btnText}>💰 Save Recovery & Notify</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  infoCard: { backgroundColor: Theme.accent, padding: 30, borderRadius: 25, alignItems: 'center', marginBottom: 20, elevation: 4 },
  customerName: { fontSize: 22, color: '#fff', fontWeight: 'bold' },
  label: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 10 },
  balance: { fontSize: 32, color: '#fff', fontWeight: 'bold', marginTop: 5 },
  inputCard: { backgroundColor: '#fff', padding: 30, borderRadius: 25, elevation: 2 },
  input: { borderBottomWidth: 2, borderBottomColor: Theme.accent, fontSize: 32, textAlign: 'center', marginVertical: 20, fontWeight: 'bold', color: Theme.text },
  saveBtn: { backgroundColor: Theme.accent, padding: 18, borderRadius: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
