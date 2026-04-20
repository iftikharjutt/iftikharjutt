#!/bin/bash
cd /data/data/com.termux/files/home/order-booker

echo "------------------------------------------"
echo "🌟 IFTIKHAR BROTHERS - SYSTEM MASTER 🌟"
echo "------------------------------------------"

# 1. Cloud Backup Logic
DB_SOURCE="/data/data/com.termux/files/home/.expo/SQLite/iftikhar_brothers.db"
DRIVE_DEST="gdrive:Iftikhar_Bros_Backup"

if [ -f "$DB_SOURCE" ]; then
    echo "🔄 STEP 1: Syncing Khata to Google Drive..."
    rclone copy "$DB_SOURCE" "$DRIVE_DEST"
    echo "✅ Backup Complete."
else
    echo "ℹ️ STEP 1: Skipping Backup (Database not yet created on this device)."
fi

echo "------------------------------------------"

# 2. APK Build Logic
echo "🚀 STEP 2: Starting APK Build (V1.3.0)..."
export EXPO_TOKEN=P15-5c63yYzCUwxXYeJbmwzw3zmixrpeXZ8E5MFg
export EAS_NO_VCS=1
export EAS_SKIP_AUTO_FINGERPRINT=1

eas build -p android --profile preview --non-interactive

echo "------------------------------------------"
echo "✅ MASTER PROCESS FINISHED."
echo "Check your Expo Dashboard for the APK download link."
echo "------------------------------------------"
