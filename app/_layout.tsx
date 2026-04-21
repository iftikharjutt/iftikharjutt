import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { initDatabase } from './db';
import { logError } from './error-logger';

// Global error handler for the app
const setupErrorHandler = () => {
  const originalHandler = ErrorUtils.getGlobalHandler();
  
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    logError(error, `GlobalCrash (Fatal: ${isFatal})`);
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
};

export default function RootLayout() {
  useEffect(() => {
    try {
      setupErrorHandler();
    } catch (e) {
      console.error("Initialization error:", e);
    }
  }, []);

  return (
    <Stack
      initialRouteName="index"
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="add-customer" options={{ title: 'Add New Customer' }} />
      <Stack.Screen name="add-product" options={{ title: 'Add New Product' }} />
      <Stack.Screen name="customer-selection" options={{ title: 'Select Customer' }} />
      <Stack.Screen name="order-entry" options={{ title: 'New Order' }} />
      <Stack.Screen name="checkout" options={{ title: 'Checkout & Receipt' }} />
      <Stack.Screen name="recovery" options={{ title: 'Cash Recovery' }} />
      <Stack.Screen name="customer-ledger" options={{ title: 'Customer Ledger' }} />
      <Stack.Screen name="reports" options={{ title: 'Business Reports' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="error-logs" options={{ title: 'Crash Reports', headerShown: false }} />
    </Stack>
  );
}
