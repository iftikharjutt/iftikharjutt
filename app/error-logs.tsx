import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { getErrorLogs, clearErrorLogs } from './error-logger';

const Theme = {
  primary: '#0f172a',
  background: '#f8fafc',
  text: '#1e293b',
  textLight: '#64748b',
};

export default function ErrorLogs() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    setLogs(getErrorLogs());
  }, []);

  const handleClear = () => {
    Alert.alert("Clear Logs", "Delete all error logs?", [
      { text: "No" },
      { text: "Yes", style: 'destructive', onPress: () => { clearErrorLogs(); setLogs([]); } }
    ]);
  };

  const shareLogs = async () => {
    if (logs.length === 0) return Alert.alert("Empty", "No logs to share");
    const logText = logs.map(l => `[${l.timestamp}]\nMsg: ${l.message}\nStack: ${l.stack}\n---\n`).join('\n');
    const path = `${FileSystem.cacheDirectory}error_report.txt`;
    await FileSystem.writeAsStringAsync(path, logText);
    await Sharing.shareAsync(path);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Crash & Error Logs</Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity onPress={shareLogs} style={styles.headerBtn}>
            <MaterialCommunityIcons name="share-variant" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClear} style={styles.headerBtn}>
            <MaterialCommunityIcons name="trash-can-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="check-circle-outline" size={60} color={Theme.textLight} />
            <Text style={styles.emptyText}>No crashes or errors logged!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.logCard}>
            <View style={styles.logHeader}>
              <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleString()}</Text>
              <MaterialCommunityIcons name="alert-circle" size={20} color="#ef4444" />
            </View>
            <Text style={styles.message}>{item.message}</Text>
            <ScrollView style={styles.stackScroll} nestedScrollEnabled>
              <Text style={styles.stack}>{item.stack}</Text>
            </ScrollView>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  header: { backgroundColor: Theme.primary, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: 5 },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  headerBtn: { padding: 5, marginLeft: 15 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyText: { color: Theme.textLight, marginTop: 10, fontSize: 16 },
  logCard: { backgroundColor: '#fff', margin: 10, padding: 15, borderRadius: 15, elevation: 2 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  timestamp: { fontSize: 12, color: Theme.textLight, fontWeight: 'bold' },
  message: { fontSize: 14, color: Theme.text, fontWeight: 'bold', marginBottom: 10 },
  stackScroll: { maxHeight: 100, backgroundColor: '#f1f5f9', padding: 10, borderRadius: 10 },
  stack: { fontSize: 11, color: Theme.textLight, fontFamily: 'monospace' }
});
