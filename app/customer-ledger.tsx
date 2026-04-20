import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import db from './db';

const Theme = {
  primary: '#0f172a',
  secondary: '#10b981', // Debit (Recovery)
  danger: '#ef4444',    // Credit (Order)
  background: '#f8fafc',
  text: '#1e293b',
  textLight: '#64748b',
};

export default function CustomerLedger() {
  const router = useRouter();
  const { customer: customerStr } = useLocalSearchParams();
  const customer = JSON.parse(customerStr as string);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = () => {
    try {
      const orders = db.getAllSync('SELECT id, total_amount as amount, timestamp, "Order" as type FROM orders WHERE customer_id = ?', [customer.id]);
      const recoveries = db.getAllSync('SELECT id, amount, timestamp, "Payment" as type FROM recoveries WHERE customer_id = ?', [customer.id]);
      
      const combined = [...orders, ...recoveries].sort((a: any, b: any) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setHistory(combined);
    } catch (e) {
      console.error(e);
    }
  };

  const downloadPDF = async () => {
    const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica'; padding: 20px; color: #1e293b; }
            h1 { color: #0f172a; text-align: center; margin-bottom: 5px; }
            h3 { text-align: center; color: #64748b; margin-top: 0; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 20px; }
            .customer-info { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: left; }
            th { background-color: #0f172a; color: white; }
            .order { color: #ef4444; }
            .payment { color: #10b981; }
            .total-box { margin-top: 20px; text-align: right; font-size: 1.2em; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>IFTIKHAR BROTHERS</h1>
            <h3>Customer Statement / Ledger</h3>
          </div>
          <div class="customer-info">
            <p><strong>Customer:</strong> ${customer.name}</p>
            <p><strong>Contact:</strong> ${customer.contact || 'N/A'}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Amount (Rs)</th>
              </tr>
            </thead>
            <tbody>
              ${history.map(item => `
                <tr>
                  <td>${new Date(item.timestamp).toLocaleDateString()}</td>
                  <td>${item.type === 'Order' ? 'Booking (Credit)' : 'Recovery (Debit)'}</td>
                  <td class="${item.type === 'Order' ? 'order' : 'payment'}">
                    ${item.type === 'Order' ? '+' : '-'} ${item.amount.toLocaleString()}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total-box">
            Net Balance Due: Rs. ${customer.balance.toLocaleString()}
          </div>
          <p style="margin-top: 40px; text-align: center; font-size: 10px; color: #64748b;">
            Digital Statement Generated via Order Booker
          </p>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (e) {
      Alert.alert("Error", "Failed to generate PDF");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()} style={{ flex: 1 }}>
            <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 2, alignItems: 'center' }}>
            <Text style={styles.name}>{customer.name}</Text>
          </View>
          <TouchableOpacity onPress={downloadPDF} style={{ flex: 1, alignItems: 'flex-end' }}>
            <MaterialCommunityIcons name="file-pdf-box" size={32} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.label}>Net Balance Due</Text>
        <Text style={styles.totalBalance}>Rs. {customer.balance.toFixed(0)}</Text>

        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: Theme.secondary }]} 
            onPress={() => router.push({ pathname: '/order-entry', params: { customer: JSON.stringify(customer) } })}
          >
            <MaterialCommunityIcons name="cart-plus" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>New Order</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: '#6366f1' }]} 
            onPress={() => router.push({ pathname: '/recovery', params: { customer: JSON.stringify(customer) } })}
          >
            <MaterialCommunityIcons name="cash-plus" size={20} color="#fff" />
            <Text style={styles.actionBtnText}>Recovery</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{ padding: 15 }}
        renderItem={({ item }) => (
          <View style={styles.logCard}>
            <View style={[styles.iconBox, { backgroundColor: item.type === 'Order' ? Theme.danger + '15' : Theme.secondary + '15' }]}>
              <MaterialCommunityIcons 
                name={item.type === 'Order' ? "cart-arrow-up" : "cash-check"} 
                size={24} 
                color={item.type === 'Order' ? Theme.danger : Theme.secondary} 
              />
            </View>
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={styles.logType}>{item.type === 'Order' ? "Credit (Booking)" : "Debit (Recovery)"}</Text>
              <Text style={styles.logDate}>{new Date(item.timestamp).toLocaleDateString()}</Text>
            </View>
            <Text style={[styles.logAmount, { color: item.type === 'Order' ? Theme.danger : Theme.secondary }]}>
              {item.type === 'Order' ? "+" : "-"} Rs. {item.amount.toFixed(0)}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  header: { padding: 30, backgroundColor: Theme.primary, alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  name: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  label: { fontSize: 13, color: '#94a3b8', marginTop: 10 },
  totalBalance: { fontSize: 36, fontWeight: 'bold', color: '#fff', marginTop: 5 },
  actionRow: { flexDirection: 'row', marginTop: 20, gap: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 12, elevation: 2 },
  actionBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 8, fontSize: 13 },
  logCard: { backgroundColor: '#fff', padding: 18, borderRadius: 20, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 1 },
  iconBox: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  logType: { fontSize: 16, fontWeight: 'bold', color: Theme.text },
  logDate: { fontSize: 12, color: Theme.textLight, marginTop: 2 },
  logAmount: { fontSize: 18, fontWeight: 'bold' }
});
