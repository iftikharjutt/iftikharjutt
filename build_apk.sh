#!/bin/bash
cd /data/data/com.termux/files/home/order-booker
# export EXPO_TOKEN=P15-5c63yYzCUwxXYeJbmwzw3zmixrpeXZ8E5MFg # Removed old token
export EAS_NO_VCS=1
export EAS_SKIP_AUTO_FINGERPRINT=1
eas build -p android --profile preview --non-interactive
