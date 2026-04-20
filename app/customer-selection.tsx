import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, SafeAreaView, Alert, Keyboard } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import db from './db';

export default function CustomerSelection() {
  const router = useRouter();
  const { mode } = useLocalSearchParams();
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = () => {
    let query = 'SELECT * FROM customers ORDER BY name ASC;';
    if (mode === 'recovery') {
      query = 'SELECT * FROM customers ORDER BY address ASC, name ASC;';
    }
    const results = db.getAllSync(query);
    setCustomers(results);
  };

  const deleteCustomer = (id: number, name: string) => {
    Alert.alert(
      "Delete Customer",
      `Are you sure you want to delete ${name}? This will remove all their records.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: () => {
            db.runSync('DELETE FROM customers WHERE id = ?', [id]);
            db.runSync('DELETE FROM orders WHERE customer_id = ?', [id]);
            db.runSync('DELETE FROM recoveries WHERE customer_id = ?', [id]);
            fetchCustomers();
          } 
        }
      ]
    );
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }: { item: any }) => {
    if (item.isHeader) {
      return (
        <View style={styles.areaHeader}>
          <MaterialCommunityIcons name="map-marker" size={18} color={Theme.primary} />
          <Text style={styles.areaHeaderText}>{item.title || 'General'}</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity 
        style={styles.customerCard}
        onLongPress={() => deleteCustomer(item.id, item.name)}
        onPress={() => {
          Keyboard.dismiss();
          if (mode === 'recovery') {
            router.push({ pathname: '/recovery', params: { customer: JSON.stringify(item) } });
          } else if (mode === 'ledger') {
            router.push({ pathname: '/customer-ledger', params: { customer: JSON.stringify(item) } });
          } else {
            router.push({ pathname: '/order-entry', params: { customer: JSON.stringify(item) } });
          }
        }}
      >
        <View>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.address}>{item.address || 'Purani Galla Mandi'}</Text>
        </View>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceValue}>
            Rs. {item.balance.toFixed(0)}
          </Text>
          <Text style={styles.balanceLabel}>Khata Balance</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const dataWithHeaders = React.useMemo(() => {
    if (mode !== 'recovery' || search) return filteredCustomers;
    
    const sections: any[] = [];
    let lastArea = '';
    
    filteredCustomers.forEach(c => {
      const area = c.address || 'General';
      if (area !== lastArea) {
        sections.push({ isHeader: true, title: area });
        lastArea = area;
      }
      sections.push(c);
    });
    return sections;
  }, [filteredCustomers, mode, search]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchSection}>
        <MaterialCommunityIcons name="magnify" size={24} color="#94a3b8" style={styles.searchIcon} />
        <TextInput 
          style={styles.searchBar} 
          placeholder="Search Customer..." 
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={dataWithHeaders}
        keyExtractor={(item, index) => item.isHeader ? `header-${item.title}` : item.id.toString()}
        contentContainerStyle={{ padding: 15 }}
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
}

const Theme = {
  primary: '#0f172a',
  secondary: '#10b981',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  searchSection: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', 
    margin: 15, borderRadius: 15, paddingHorizontal: 15, elevation: 2 
  },
  searchIcon: { marginRight: 10 },
  searchBar: { flex: 1, paddingVertical: 15, fontSize: 16 },
  areaHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 5, marginTop: 10, marginBottom: 5 },
  areaHeaderText: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginLeft: 5, textTransform: 'uppercase', letterSpacing: 1 },
  customerCard: { 
    backgroundColor: '#fff', padding: 20, borderRadius: 20, 
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, elevation: 1 
  },
  name: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  address: { fontSize: 13, color: '#64748b', marginTop: 3 },
  balanceContainer: { alignItems: 'flex-end' },
  balanceLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  balanceValue: { fontSize: 16, fontWeight: 'bold', color: '#ef4444' }
});
