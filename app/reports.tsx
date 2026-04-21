import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, Modal, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import db from './db';

const Theme = {
  primary: '#0f172a',
  secondary: '#10b981',
  accent: '#6366f1',
  background: '#f8fafc',
  surface: '#ffffff',
  text: '#1e293b',
  textLight: '#64748b',
};

export default function Reports() {
  const router = useRouter();
  const [tab, setTab] = useState<'stats' | 'bills' | 'recoveries'>('stats');
  const [areaModalVisible, setAreaModalVisible] = useState(false);
  const [areas, setAreas] = useState<string[]>([]);
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRecoveries: 0,
    totalCustomers: 0,
    topCustomers: [] as any[],
  });
  const [bills, setBills] = useState<any[]>([]);
  const [recoveries, setRecoveries] = useState<any[]>([]);
  const [shopName, setShopName] = useState('My Shop');

  /**
   * REFACTOR: Optimized Fetching (Performance)
   * We only refetch what is necessary based on tab changes.
   */
  useEffect(() => {
    if (tab === 'stats') fetchStats();
    if (tab === 'bills') fetchBills();
    if (tab === 'recoveries') fetchRecoveries();
    fetchAreas();
    
    // Fetch shop name dynamically for reports
    try {
      const nameSet = db.getAllSync("SELECT value FROM settings WHERE key = 'shop_name'")[0] as any;
      if (nameSet?.value) setShopName(nameSet.value);
    } catch (e) {}
  }, [tab, selectedAreaFilter]);

  // REFACTOR: Parameterized Query for Security
  const fetchAreas = React.useCallback(() => {
    try {
      const data = db.getAllSync(`
        SELECT DISTINCT COALESCE(address, ?) as area 
        FROM customers 
        WHERE address IS NOT NULL AND address != ?
      `, ['General', '']) as any[];
      setAreas(data.map(i => i.area));
    } catch (e) {
      console.error("REPORT_FETCH_AREAS_ERROR", e);
    }
  }, []);

  // REFACTOR: Optimized calculations
  const totalPending = React.useMemo(() => {
    return stats.totalSales - stats.totalRecoveries;
  }, [stats]);

  const fetchStats = () => {
    try {
      const sales = db.getAllSync('SELECT SUM(total_amount) as total FROM orders') as any;
      const recs = db.getAllSync('SELECT SUM(amount) as total FROM recoveries') as any;
      const customers = db.getAllSync('SELECT COUNT(*) as count FROM customers') as any;
      const topCust = db.getAllSync(`
        SELECT c.name, SUM(o.total_amount) as total 
        FROM customers c 
        JOIN orders o ON c.id = o.customer_id 
        GROUP BY c.id 
        ORDER BY total DESC 
        LIMIT 5
      `) as any[];

      setStats({
        totalSales: sales[0]?.total || 0,
        totalRecoveries: recs[0]?.total || 0,
        totalCustomers: customers[0]?.count || 0,
        topCustomers: topCust,
      });
    } catch (e) { console.error(e); }
  };

  const fetchBills = () => {
    try {
      const data = db.getAllSync(`
        SELECT o.*, c.name as customer_name 
        FROM orders o 
        JOIN customers c ON o.customer_id = c.id 
        ORDER BY o.timestamp DESC 
        LIMIT 30
      `);
      setBills(data);
    } catch (e) { console.error(e); }
  };

  const fetchRecoveries = () => {
    try {
      let query = `
        SELECT r.*, c.name as customer_name, COALESCE(c.address, 'General') as area 
        FROM recoveries r 
        JOIN customers c ON r.customer_id = c.id 
      `;
      let params: any[] = [];
      
      if (selectedAreaFilter) {
        query += ` WHERE COALESCE(c.address, 'General') = ? `;
        params.push(selectedAreaFilter);
        query += ` ORDER BY r.timestamp DESC LIMIT 50 `;
      } else {
        query += ` ORDER BY area ASC, r.timestamp DESC LIMIT 100 `;
      }
      
      const data = db.getAllSync(query, params);
      setRecoveries(data);
    } catch (e) { console.error(e); }
  };

  const generatePDF = async () => {
    const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica'; padding: 20px; color: #1e293b; }
            h1 { color: #0f172a; text-align: center; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 20px; }
            .stat-box { background: #f1f5f9; padding: 15px; border-radius: 10px; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
            th { background-color: #0f172a; color: white; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${shopName}</h1>
            <p style="text-align: center;">Business Summary Report - ${new Date().toLocaleDateString()}</p>
          </div>
          <div class="stat-box">
            <p><strong>Total Sales:</strong> Rs. ${stats.totalSales.toLocaleString()}</p>
            <p><strong>Total Cash Recovered:</strong> Rs. ${stats.totalRecoveries.toLocaleString()}</p>
            <p><strong>Active Customers:</strong> ${stats.totalCustomers}</p>
          </div>
          <h2>Top 5 Customers</h2>
          <table>
            <tr><th>Customer Name</th><th>Total Purchase</th></tr>
            ${stats.topCustomers.map(c => `<tr><td>${c.name}</td><td>Rs. ${c.total.toLocaleString()}</td></tr>`).join('')}
          </table>
          <p style="margin-top: 50px; text-align: center; font-size: 10px; color: #64748b;">
            Generated by Order Booker App
          </p>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (e) {
      Alert.alert("Error", "Failed to generate report");
    }
  };

  const printBill = async (bill: any) => {
    try {
      const items = db.getAllSync('SELECT * FROM order_items WHERE order_id = ?', [bill.id]) as any[];
      const html = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica'; padding: 10px; color: #000; }
              .center { text-align: center; }
              .header { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
              table { width: 100%; border-collapse: collapse; }
              th { border-bottom: 1px solid #000; text-align: left; }
              td { padding: 5px 0; }
              .total-row { border-top: 1px solid #000; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="header center">
              <h2 style="margin:0; text-transform: uppercase;">${shopName}</h2>
              <p style="margin:5px 0">Purani Galla Mandi</p>
              <p><strong>INVOICE #${bill.id}</strong></p>
            </div>
            <p><strong>Customer:</strong> ${bill.customer_name}</p>
            <p><strong>Date:</strong> ${new Date(bill.timestamp).toLocaleString()}</p>
            <table>
              <thead>
                <tr><th>Item</th><th>Qty</th><th>Rate</th><th>Total</th></tr>
              </thead>
              <tbody>
                ${items.map(i => `
                  <tr>
                    <td>${i.product_name}</td>
                    <td>${i.quantity} ${i.unit}</td>
                    <td>${i.rate}</td>
                    <td>${i.subtotal}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div style="margin-top:10px; border-top:1px dashed #000; padding-top:10px">
              <div style="display:flex; justify-content:space-between">
                <span>Grand Total:</span> <span>Rs. ${bill.total_amount}</span>
              </div>
              <div style="display:flex; justify-content:space-between">
                <span>Cash Paid:</span> <span>Rs. ${bill.cash_paid}</span>
              </div>
              <div style="display:flex; justify-content:space-between; font-weight:bold">
                <span>Balance:</span> <span>Rs. ${bill.total_amount - bill.cash_paid}</span>
              </div>
            </div>
            <p class="center" style="margin-top:30px">--- Thank You ---</p>
          </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (e) { Alert.alert("Error", "Print Failed"); }
  };

  const printRecovery = async (rec: any) => {
    const html = `
      <html>
        <body style="font-family: 'Helvetica'; padding: 40px; text-align: center;">
          <h1 style="margin:0; text-transform: uppercase;">${shopName}</h1>
          <p>Purani Galla Mandi</p>
          <div style="border: 2px solid #000; padding: 20px; margin-top: 30px; border-radius: 10px;">
            <h2 style="text-decoration: underline;">RECOVERY RECEIPT</h2>
            <p style="text-align: left; font-size: 1.2em;">
              <strong>Receipt No:</strong> REC-${rec.id}<br>
              <strong>Date:</strong> ${new Date(rec.timestamp).toLocaleString()}<br>
              <strong>Customer:</strong> ${rec.customer_name}<br>
              <strong>Amount Received:</strong> <span style="font-size: 1.5em; font-weight: bold;">Rs. ${rec.amount.toLocaleString()}</span>
            </p>
            <p style="margin-top: 50px;">_________________________<br>Authorized Signature</p>
          </div>
        </body>
      </html>
    `;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (e) { Alert.alert("Error", "Print Failed"); }
  };

  const generateAreaReport = async (selectedArea: string | null) => {
    try {
      const query = selectedArea 
        ? `SELECT address as area, balance as total_pending, (SELECT SUM(amount) FROM recoveries WHERE customer_id = c.id) as total_recovered FROM customers c WHERE address = ?`
        : `SELECT COALESCE(address, 'General') as area, SUM(balance) as total_pending, (SELECT SUM(r.amount) FROM recoveries r JOIN customers c2 ON r.customer_id = c2.id WHERE COALESCE(c2.address, 'General') = COALESCE(c1.address, 'General')) as total_recovered FROM customers c1 GROUP BY area`;
      
      const areaStats = db.getAllSync(query, selectedArea ? [selectedArea] : []) as any[];

      const html = `
        <html>
          <head>
            <style>
              body { font-family: 'Helvetica'; padding: 20px; color: #1e293b; }
              h1 { color: #0f172a; text-align: center; }
              .header { border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
              th { background-color: #0f172a; color: white; }
              .pending { color: #ef4444; font-weight: bold; }
              .recovered { color: #10b981; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Area-Wise Recovery Report</h1>
              <p style="text-align: center;">${shopName} - ${selectedArea || 'All Areas'}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Area Name</th>
                  <th>Total Recovered (Rs)</th>
                  <th>Total Pending (Rs)</th>
                </tr>
              </thead>
              <tbody>
                ${areaStats.map(s => `
                  <tr>
                    <td>${s.area || 'Unknown'}</td>
                    <td class="recovered">Rs. ${(s.total_recovered || 0).toLocaleString()}</td>
                    <td class="pending">Rs. ${(s.total_pending || 0).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      setAreaModalVisible(false);
    } catch (e) {
      Alert.alert("Error", "Failed to generate area report");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Business Reports</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity style={[styles.tab, tab === 'stats' && styles.activeTab]} onPress={() => setTab('stats')}>
          <Text style={[styles.tabText, tab === 'stats' && styles.activeTabText]}>Stats</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'bills' && styles.activeTab]} onPress={() => setTab('bills')}>
          <Text style={[styles.tabText, tab === 'bills' && styles.activeTabText]}>Bills</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'recoveries' && styles.activeTab]} onPress={() => setTab('recoveries')}>
          <Text style={[styles.tabText, tab === 'recoveries' && styles.activeTabText]}>Recoveries</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {tab === 'stats' && (
          <>
            <View style={styles.heroCard}>
              <Text style={styles.heroLabel}>Total Revenue</Text>
              <Text style={styles.heroValue}>Rs. {stats.totalSales.toLocaleString()}</Text>
              <View style={styles.progressRow}>
                <View style={styles.statMini}>
                  <Text style={styles.miniLabel}>Recovered</Text>
                  <Text style={styles.miniValue}>Rs. {stats.totalRecoveries.toLocaleString()}</Text>
                </View>
                <View style={styles.statMini}>
                  <Text style={styles.miniLabel}>Pending</Text>
                  <Text style={[styles.miniValue, { color: '#ef4444' }]}>
                    Rs. {totalPending.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={[styles.pdfBtn, { backgroundColor: Theme.secondary, marginTop: 20 }]} onPress={() => setAreaModalVisible(true)}>
              <MaterialCommunityIcons name="map-marker-radius" size={24} color="#fff" />
              <Text style={styles.pdfBtnText}>Download Area Report</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Top 5 Customers</Text>
            {stats.topCustomers.map((c, i) => (
              <View key={i} style={styles.custRow}>
                <Text style={styles.custName}>{c.name}</Text>
                <Text style={styles.custTotal}>Rs. {c.total.toLocaleString()}</Text>
              </View>
            ))}

            <TouchableOpacity style={styles.pdfBtn} onPress={generatePDF}>
              <MaterialCommunityIcons name="file-pdf-box" size={24} color="#fff" />
              <Text style={styles.pdfBtnText}>Download Full Report</Text>
            </TouchableOpacity>
          </>
        )}

        {tab === 'bills' && bills.map((b, i) => (
          <TouchableOpacity key={i} style={styles.custRow} onPress={() => printBill(b)}>
            <View>
              <Text style={styles.custName}>{b.customer_name}</Text>
              <Text style={styles.miniLabel}>{new Date(b.timestamp).toLocaleDateString()}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.custTotal}>Rs. {b.total_amount.toLocaleString()}</Text>
              <MaterialCommunityIcons name="printer" size={16} color={Theme.accent} />
            </View>
          </TouchableOpacity>
        ))}

        {tab === 'recoveries' && (
          <View>
            <View style={styles.filterBar}>
               <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                 <TouchableOpacity 
                   style={[styles.filterChip, !selectedAreaFilter && styles.filterChipActive]}
                   onPress={() => setSelectedAreaFilter(null)}
                 >
                   <Text style={[styles.filterChipText, !selectedAreaFilter && styles.filterChipActiveText]}>All Areas</Text>
                 </TouchableOpacity>
                 {areas.map(area => (
                   <TouchableOpacity 
                     key={area}
                     style={[styles.filterChip, selectedAreaFilter === area && styles.filterChipActive]}
                     onPress={() => setSelectedAreaFilter(area)}
                   >
                     <Text style={[styles.filterChipText, selectedAreaFilter === area && styles.filterChipActiveText]}>{area}</Text>
                   </TouchableOpacity>
                 ))}
               </ScrollView>
            </View>
            {recoveries.map((r, i) => {
              const showHeader = !selectedAreaFilter && (i === 0 || recoveries[i-1].area !== r.area);
              return (
                <React.Fragment key={i}>
                  {showHeader && (
                    <View style={styles.areaHeader}>
                      <MaterialCommunityIcons name="map-marker" size={18} color={Theme.primary} />
                      <Text style={styles.areaHeaderText}>{r.area}</Text>
                    </View>
                  )}
                  <TouchableOpacity style={styles.custRow} onPress={() => printRecovery(r)}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.custName}>{r.customer_name}</Text>
                      <Text style={styles.miniLabel}>{r.area} • {new Date(r.timestamp).toLocaleDateString()}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.custTotal, { color: Theme.secondary }]}>Rs. {r.amount.toLocaleString()}</Text>
                      <MaterialCommunityIcons name="printer" size={16} color={Theme.accent} />
                    </View>
                  </TouchableOpacity>
                </React.Fragment>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal visible={areaModalVisible} transparent animationType="slide" onRequestClose={() => setAreaModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Area for Report</Text>
            <FlatList
              data={['Full (All Areas)', ...areas]}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.areaItem} 
                  onPress={() => generateAreaReport(item === 'Full (All Areas)' ? null : item)}
                >
                  <MaterialCommunityIcons name={item === 'Full (All Areas)' ? "earth" : "map-marker"} size={20} color={Theme.primary} />
                  <Text style={styles.areaItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setAreaModalVisible(false)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.background },
  header: { backgroundColor: Theme.primary, height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', padding: 5, margin: 15, borderRadius: 15, elevation: 2 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 12 },
  activeTab: { backgroundColor: Theme.primary },
  tabText: { fontWeight: '600', color: Theme.textLight },
  activeTabText: { color: '#fff' },
  scroll: { padding: 15 },
  heroCard: { backgroundColor: Theme.primary, padding: 25, borderRadius: 25, elevation: 5 },
  heroLabel: { color: '#94a3b8', fontSize: 14 },
  heroValue: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginVertical: 10 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 15 },
  statMini: { flex: 1 },
  miniLabel: { color: '#94a3b8', fontSize: 11 },
  miniValue: { color: Theme.secondary, fontSize: 15, fontWeight: 'bold' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Theme.text, marginVertical: 20 },
  custRow: { backgroundColor: '#fff', padding: 15, borderRadius: 15, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, elevation: 1 },
  custName: { fontWeight: '600', color: Theme.text },
  custTotal: { fontWeight: 'bold', color: Theme.primary },
  pdfBtn: { backgroundColor: Theme.accent, padding: 20, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 30 },
  pdfBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 10 },
  filterBar: { marginBottom: 15, paddingHorizontal: 5 },
  filterChip: { backgroundColor: '#fff', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: '#e2e8f0', elevation: 1 },
  filterChipActive: { backgroundColor: Theme.primary, borderColor: Theme.primary },
  filterChipText: { color: Theme.textLight, fontSize: 13, fontWeight: '600' },
  filterChipActiveText: { color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', padding: 25, borderTopLeftRadius: 30, borderTopRightRadius: 30, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  areaItem: { flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  areaItemText: { fontSize: 16, color: Theme.text, marginLeft: 15 },
  closeBtn: { marginTop: 10, padding: 15, alignItems: 'center' },
  closeBtnText: { color: '#ef4444', fontWeight: 'bold', fontSize: 16 },
  areaHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 5, marginTop: 10, marginBottom: 5 },
  areaHeaderText: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginLeft: 5, textTransform: 'uppercase', letterSpacing: 1 }
});