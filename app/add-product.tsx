import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Keyboard, TouchableWithoutFeedback, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import db from './db';

const Theme = {
  primary: '#0f172a',
  secondary: '#10b981',
  background: '#f8fafc',
  text: '#1e293b',
  textLight: '#64748b',
};

export default function AddProduct() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', category: '', price: '' });

  const saveProduct = () => {
    Keyboard.dismiss(); 
    if (!form.name || !form.price) return Alert.alert("Error", "Name and Price are required");
    
    try {
      db.runSync(
        'INSERT INTO products (name, category, base_price) VALUES (?, ?, ?)',
        [form.name, form.category || 'General', parseFloat(form.price)]
      );
      Alert.alert("Success", "New Product Added");
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to add product");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View style={styles.card}>
            <Text style={styles.label}>Product Name</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. Red Chilli Powder" 
              value={form.name} 
              onChangeText={t => setForm({...form, name: t})} 
            />

            <Text style={styles.label}>Category</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. Spices" 
              value={form.category} 
              onChangeText={t => setForm({...form, category: t})} 
            />

            <Text style={styles.label}>Base Rate (PKR)</Text>
            <TextInput 
              style={styles.input} 
              placeholder="0.00" 
              keyboardType="numeric" 
              value={form.price} 
              onChangeText={t => setForm({...form, price: t})} 
            />

            <TouchableOpacity style={styles.btn} onPress={saveProduct}>
              <Text style={styles.btnText}>📦 Save Product</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  card: { backgroundColor: '#fff', padding: 25, borderRadius: 25, elevation: 4 },
  label: { fontSize: 13, fontWeight: '700', color: Theme.text, marginBottom: 8, marginTop: 15 },
  input: { backgroundColor: '#f1f5f9', borderRadius: 12, padding: 15, fontSize: 16 },
  btn: { backgroundColor: Theme.primary, padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 30 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
