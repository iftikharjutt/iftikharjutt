import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, SafeAreaView, Keyboard } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import db from './db';

const Theme = {
  primary: '#0f172a',
  secondary: '#10b981',
  background: '#f8fafc',
  text: '#1e293b',
  textLight: '#64748b',
  danger: '#ef4444',
  border: '#e2e8f0',
};

export default function Checkout() {
  const router = useRouter();
  const { customer: customerStr, cart: cartStr, total: totalStr } = useLocalSearchParams();
  
  const customer = JSON.parse(customerStr as string);
  const cart = JSON.parse(cartStr as string);
  const total = parseFloat(totalStr as string);

  const [cash, setCash] = useState('');

  const finalize = () => {
    Keyboard.dismiss();
    const paid = parseFloat(cash) || 0;
    const remaining = total - paid;
    const newBalance = customer.balance + remaining;

    try {
      // 1. Save Order Header
      const res = db.runSync(
        'INSERT INTO orders (customer_id, total_amount, cash_paid) VALUES (?, ?, ?)', 
        [customer.id, total, paid]
      );
      const orderId = (res as any).lastInsertRowId;

      // 2. Save Order Items
      cart.forEach((i: any) => {
        db.runSync(
          'INSERT INTO order_items (order_id, product_name, unit, quantity, rate, subtotal) VALUES (?, ?, ?, ?, ?, ?)', 
          [orderId, i.name, i.unit, i.qty, i.price, i.subtotal]
        );
      });

      // 3. Update Customer Balance
      db.runSync('UPDATE customers SET balance = ? WHERE id = ?', [newBalance, customer.id]);

      Alert.alert(
        "Order Saved", 
        "Where would you like to send the receipt?",
        [
          { text: "Customer WhatsApp", onPress: () => sendWhatsApp(newBalance, paid, 'customer') },
          { text: "Shop WhatsApp", onPress: () => sendWhatsApp(newBalance, paid, 'shop') },
          { text: "Finish", onPress: () => { router.dismissAll(); router.replace('/(tabs)'); } }
        ]
      );
    } catch (e) { 
      console.error(e);
      Alert.alert("Error", "Save Failed"); 
    }
  };

  const sendWhatsApp = (newBal: number, paid: number, target: 'customer' | 'shop') => {
    const shopNameSet = db.getAllSync("SELECT value FROM settings WHERE key = 'shop_name'")[0] as any;
    const shopWhatsAppSet = db.getAllSync("SELECT value FROM settings WHERE key = 'shop_whatsapp'")[0] as any;
    
    const msg = `
🌟 *${(shopNameSet?.value || 'IFTIKHAR BROTHERS').toUpperCase()}*
📍 _Purani Galla Mandi_
━━━━━━━━━━━━━━━━━━
👤 *CUSTOMER:* ${customer.name}
📅 *DATE:* ${new Date().toLocaleDateString()}
━━━━━━━━━━━━━━━━━━
📦 *ITEMS:*
${cart.map((i: any) => `▫️ ${i.name} (${i.qty} ${i.unit}) = *Rs.${i.subtotal.toFixed(0)}*`).join('\n')}
━━━━━━━━━━━━━━━━━━
💰 *SUMMARY:*
TOTAL BILL : *Rs.${total.toFixed(0)}*
CASH PAID  : *Rs.${paid.toFixed(0)}*
KHATA BAL  : *Rs.${newBal.toFixed(0)}*
━━━━━━━━━━━━━━━━━━
_Thank you for your business!_`;

    let phone = customer.contact;
    if (target === 'shop') {
      phone = shopWhatsAppSet?.value || '';
    }

    const url = `whatsapp://send?text=${encodeURIComponent(msg)}${phone ? '&phone=92' + phone.slice(1) : ''}`;
    Linking.openURL(url)
      .then(() => {
        router.dismissAll();
        router.replace('/(tabs)');
      })
      .catch(() => Alert.alert("Error", "WhatsApp is not installed"));
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: Theme.background}}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.billCard}>
          <Text style={styles.billTitle}>Bill Summary</Text>
          {cart.map((item: any, idx: number) => (
            <View key={idx} style={styles.billRow}>
              <Text style={styles.billItem}>{item.name} ({item.qty} {item.unit})</Text>
              <Text style={styles.billPrice}>Rs. {item.subtotal.toFixed(0)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>Rs. {total.toFixed(0)}</Text>
          </View>
        </View>

        <View style={styles.paymentCard}>
          <Text style={styles.payLabel}>Cash Received (PKR)</Text>
          <TextInput 
            style={styles.payInput} 
            keyboardType="numeric" 
            placeholder="0" 
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={cash} 
            onChangeText={setCash} 
            autoFocus 
          />
          
          <View style={styles.khataBox}>
            <Text style={styles.khataText}>Moving to Khata:</Text>
            <Text style={styles.khataValue}>Rs. {(total - (parseFloat(cash) || 0)).toFixed(0)}</Text>
          </View>

          <TouchableOpacity style={styles.finalBtn} onPress={finalize}>
            <Text style={styles.finalText}>Save & Send WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  billCard: { backgroundColor: '#fff', margin: 20, padding: 25, borderRadius: 25, elevation: 4 },
  billTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: Theme.primary },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  billItem: { color: Theme.textLight, fontSize: 15 },
  billPrice: { fontWeight: '600', color: Theme.text },
  divider: { height: 1, backgroundColor: Theme.border, marginVertical: 15 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontSize: 16, fontWeight: 'bold', color: Theme.text },
  totalValue: { fontSize: 24, fontWeight: '900', color: Theme.secondary },
  paymentCard: { backgroundColor: Theme.primary, margin: 20, marginTop: 0, padding: 25, borderRadius: 25 },
  payLabel: { color: '#94a3b8', textAlign: 'center', fontSize: 14 },
  payInput: { color: '#fff', fontSize: 40, fontWeight: 'bold', textAlign: 'center', marginVertical: 15, borderBottomWidth: 1, borderBottomColor: '#334155' },
  khataBox: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  khataText: { color: '#94a3b8' },
  khataValue: { color: Theme.danger, fontWeight: 'bold' },
  finalBtn: { backgroundColor: Theme.secondary, padding: 20, borderRadius: 15, alignItems: 'center' },
  finalText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
