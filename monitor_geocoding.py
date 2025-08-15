#!/usr/bin/env python3
"""
Monitor geocoding progress and map integration in real-time
"""

import json
import time
import requests
from datetime import datetime

def check_status():
    # Load from file
    with open('data/storymaps.json', 'r', encoding='utf-8') as f:
        file_data = json.load(f)
    
    # Check API
    try:
        response = requests.get('http://localhost:3000/api/storymaps')
        api_data = response.json() if response.status_code == 200 else []
    except:
        api_data = []
    
    # Analyze
    file_geocoded = len([d for d in file_data if d.get('author') == 'HU Berlin Database' and (d['lat'] != 52.52 or d['lng'] != 13.405)])
    file_default = len([d for d in file_data if d.get('author') == 'HU Berlin Database' and d['lat'] == 52.52 and d['lng'] == 13.405])
    
    api_geocoded = len([d for d in api_data if d.get('author') == 'HU Berlin Database' and (d['lat'] != 52.52 or d['lng'] != 13.405)])
    
    return {
        'file_total': len(file_data),
        'file_geocoded': file_geocoded,
        'file_default': file_default,
        'api_total': len(api_data),
        'api_geocoded': api_geocoded,
        'timestamp': datetime.now().strftime('%H:%M:%S')
    }

print("=" * 70)
print("STORYMAPS GEOCODING & MAP INTEGRATION MONITOR")
print("=" * 70)
print("\nPress Ctrl+C to stop monitoring\n")

try:
    prev_geocoded = 0
    while True:
        status = check_status()
        
        # Calculate progress
        total_hu = status['file_geocoded'] + status['file_default']
        progress = (status['file_geocoded'] / total_hu * 100) if total_hu > 0 else 0
        
        # Calculate rate
        new_geocoded = status['file_geocoded'] - prev_geocoded
        prev_geocoded = status['file_geocoded']
        
        print(f"\r[{status['timestamp']}] File: {status['file_geocoded']}/{total_hu} ({progress:.1f}%) | "
              f"API: {status['api_geocoded']}/{status['api_total']} | "
              f"Rate: +{new_geocoded}/10s", end='', flush=True)
        
        time.sleep(10)  # Check every 10 seconds
        
except KeyboardInterrupt:
    print("\n\nMonitoring stopped.")
    
    # Final status
    final = check_status()
    total_hu = final['file_geocoded'] + final['file_default']
    progress = (final['file_geocoded'] / total_hu * 100) if total_hu > 0 else 0
    
    print("\n" + "=" * 70)
    print("FINAL STATUS")
    print("=" * 70)
    print(f"Data file: {final['file_geocoded']}/{total_hu} geocoded ({progress:.1f}%)")
    print(f"API endpoint: {final['api_geocoded']} geocoded entries available")
    print(f"Map should display {final['api_geocoded']} businesses at correct locations")
    print(f"Remaining {final['file_default']} businesses still at default location")