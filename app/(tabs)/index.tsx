import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, RefreshControl } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import db from '../db';

const Theme = {
  primary: '#0f172a',
  secondary: '#10b981',
  accent: '#6366f1',
  background: '#f8fafc',
  surface: '#ffffff',
  text: '#1e293b',
};

export default function Dashboard() {
  const router = useRouter();
  const [sales, setSales] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchData();
    setRefreshing(false);
  }, []);

  const fetchData = () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const data = db.getAllSync(`SELECT SUM(total_amount) as total FROM orders WHERE timestamp LIKE '${today}%'`) as any;
      setSales(data[0]?.total || 0);
    } catch (e) {
      console.error("Dashboard DB fetch error:", e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const MenuCard = ({ title, icon, color, href, params }: any) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => router.push({ pathname: href, params })}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <MaterialCommunityIcons name={icon} size={35} color={color} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.welcome}>Welcome Back,</Text>
            <Text style={styles.shopName}>{shopName}</Text>
          </View>
          <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/settings')}>
            <MaterialCommunityIcons name="cloud-sync" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Today's Total Sales</Text>
          <Text style={styles.summaryValue}>Rs. {sales.toLocaleString()}</Text>
        </View>

        <View style={styles.grid}>
          <MenuCard title="New Order" icon="cart-plus" color={Theme.secondary} href="/customer-selection" params={{ mode: 'order' }} />
          <MenuCard title="Recovery" icon="cash-check" color={Theme.accent} href="/customer-selection" params={{ mode: 'recovery' }} />
          <MenuCard title="Reports" icon="chart-box-outline" color="#3b82f6" href="/reports" />
          <MenuCard title="Ledger" icon="notebook-outline" color="#8e44ad" href="/customer-selection" params={{ mode: 'ledger' }} />
          <MenuCard title="Add Product" icon="package-variant-closed-plus" color="#f59e0b" href="/add-product" />
          <MenuCard title="Add Customer" icon="account-multiple-plus" color="#3498db" href="/add-customer" />
          <MenuCard title="Settings" icon="cog-outline" color="#64748b" href="/settings" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  header: { padding: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Theme.primary, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, paddingBottom: 50 },
  welcome: { color: '#94a3b8', fontSize: 14 },
  shopName: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  summaryCard: { margin: 20, marginTop: -30, backgroundColor: '#fff', padding: 25, borderRadius: 20, elevation: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  summaryLabel: { color: '#64748b', fontSize: 14, fontWeight: '600' },
  summaryValue: { fontSize: 24, fontWeight: 'bold', color: Theme.text, marginTop: 5 },
  grid: { padding: 15, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '47%', backgroundColor: '#fff', padding: 20, borderRadius: 20, marginBottom: 15, alignItems: 'center', elevation: 2 },
  iconContainer: { width: 60, height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: Theme.text, textAlign: 'center' },
  profileBtn: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' }
});
fontSize: 14, fontWeight: 'bold', color: Theme.text, textAlign: 'center' },
  profileBtn: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' }
});
