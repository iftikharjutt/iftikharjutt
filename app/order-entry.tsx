import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Modal, KeyboardAvoidingView, Platform, SafeAreaView, Keyboard } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import db from './db';

const Theme = {
  primary: '#0f172a',
  secondary: '#10b981',
  background: '#f8fafc',
  text: '#1e293b',
  textLight: '#64748b',
};

export default function OrderEntry() {
  const router = useRouter();
  const { customer: customerStr } = useLocalSearchParams();
  const customer = JSON.parse(customerStr as string);

  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProd, setSelectedProd] = useState<any>(null);
  
  const [qty, setQty] = useState('1');
  const [unit, setUnit] = useState('Piece');
  const [price, setPrice] = useState('0');

  useEffect(() => {
    try {
      const data = db.getAllSync('SELECT * FROM products');
      setProducts(data || []);
    } catch (e) {
      console.error("Failed to fetch products:", e);
      setProducts([]);
    }
  }, []);

  const openModal = (p: any) => {
    Keyboard.dismiss();
    setSelectedProd(p);
    setPrice(p.base_price.toString());
    setModalVisible(true);
  };

  const addToCart = () => {
    Keyboard.dismiss();
    const q = parseFloat(qty) || 0;
    const p = parseFloat(price) || 0;
    setCart([...cart, { ...selectedProd, qty: q, unit, price: p, subtotal: q * p }]);
    setModalVisible(false);
  };

  const total = cart.reduce((s, i) => s + i.subtotal, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.custName}>{customer.name}</Text>
        <Text style={styles.custBal}>Current Balance: Rs. {customer.balance.toFixed(0)}</Text>
      </View>

      <TextInput 
        style={styles.search} 
        placeholder="Search Rice, Sugar, Ghee..." 
        onChangeText={setSearch} 
      />

      <FlatList
        data={products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.pCard} onPress={() => openModal(item)}>
            <View>
              <Text style={styles.pName}>{item.name}</Text>
              <Text style={styles.pCat}>{item.category}</Text>
            </View>
            <Text style={styles.pPrice}>Rs. {item.base_price}</Text>
          </TouchableOpacity>
        )}
      />

      {cart.length > 0 && (
        <View style={styles.footer}>
          <View>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalVal}>Rs. {total.toFixed(0)}</Text>
          </View>
          <TouchableOpacity 
            style={styles.checkBtn}
            onPress={() => router.push({ 
              pathname: '/checkout', 
              params: { customer: JSON.stringify(customer), cart: JSON.stringify(cart), total } 
            })}
          >
            <Text style={styles.checkText}>Checkout</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedProd?.name}</Text>
            
            <Text style={styles.label}>Select Unit</Text>
            <View style={styles.unitRow}>
              {['Bag', 'Carton', 'KG', 'Piece', 'Gram'].map(u => (
                <TouchableOpacity 
                  key={u} 
                  style={[styles.uBtn, unit === u && styles.uSelected]} 
                  onPress={() => setUnit(u)}
                >
                  <Text style={{color: unit === u ? '#fff' : Theme.text}}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputRow}>
              <View style={{flex:1, marginRight: 10}}>
                <Text style={styles.label}>Quantity</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={qty} onChangeText={setQty} />
              </View>
              <View style={{flex:1}}>
                <Text style={styles.label}>Rate (Editable)</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={price} onChangeText={setPrice} />
              </View>
            </View>

            <TouchableOpacity style={styles.addBtn} onPress={addToCart}>
              <Text style={styles.addText}>Add to Order</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{marginTop: 15, padding: 10}}>
              <Text style={{color: '#ef4444', textAlign: 'center'}}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  header: { padding: 20, backgroundColor: Theme.primary, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  custName: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  custBal: { color: '#94a3b8', fontSize: 13, marginTop: 4 },
  search: { backgroundColor: '#fff', margin: 15, padding: 15, borderRadius: 15, elevation: 2 },
  pCard: { backgroundColor: '#fff', padding: 20, marginBottom: 10, borderRadius: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1 },
  pName: { fontSize: 16, fontWeight: 'bold', color: Theme.text },
  pCat: { fontSize: 12, color: Theme.textLight, marginTop: 2 },
  pPrice: { fontSize: 16, fontWeight: 'bold', color: Theme.secondary },
  footer: { backgroundColor: '#fff', padding: 25, borderTopLeftRadius: 30, borderTopRightRadius: 30, elevation: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: Theme.textLight, fontSize: 12 },
  totalVal: { fontSize: 24, fontWeight: 'bold', color: Theme.primary },
  checkBtn: { backgroundColor: Theme.primary, paddingVertical: 12, paddingHorizontal: 25, borderRadius: 15, flexDirection: 'row', alignItems: 'center' },
  checkText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginRight: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', padding: 25, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  unitRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 },
  uBtn: { padding: 12, backgroundColor: '#f1f5f9', borderRadius: 12, marginRight: 8, marginBottom: 8 },
  uSelected: { backgroundColor: Theme.secondary },
  label: { fontSize: 12, color: Theme.textLight, marginBottom: 8 },
  inputRow: { flexDirection: 'row', marginBottom: 25 },
  input: { backgroundColor: '#f1f5f9', padding: 15, borderRadius: 12, fontSize: 16 },
  addBtn: { backgroundColor: Theme.primary, padding: 18, borderRadius: 15, alignItems: 'center' },
  addText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});
