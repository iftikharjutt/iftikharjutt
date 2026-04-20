#!/bin/bash
# 1. Define Paths
DB_SOURCE="/data/data/com.termux/files/home/.expo/SQLite/iftikhar_brothers.db"
DRIVE_DEST="gdrive:Iftikhar_Bros_Backup"

# 2. Check if DB exists
if [ -f "$DB_SOURCE" ]; then
    echo "🔄 Backing up Khata to Google Drive..."
    rclone copy "$DB_SOURCE" "$DRIVE_DEST"
    echo "✅ Backup Complete: $(date)"
else
    echo "❌ Error: Database file not found. Have you opened the app yet?"
fi
