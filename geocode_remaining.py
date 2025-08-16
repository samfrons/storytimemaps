#!/usr/bin/env python3
"""
Geocode the remaining businesses with valid addresses using Nominatim
"""

import json
import time
import requests
from datetime import datetime

# Default coordinates
DEFAULT_LAT = 52.52
DEFAULT_LNG = 13.405

# Nominatim API
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "StoryTimeMaps/1.0 (historical.research@example.com)"

def is_valid_address(address):
    """Check if address is valid for geocoding"""
    if not address or len(address) < 5:
        return False
    # Skip if just a number
    if address.replace(',', '').replace(' ', '').isdigit():
        return False
    # Should contain at least a street indicator
    street_indicators = ['str', 'Str', 'platz', 'Platz', 'weg', 'allee', 'damm', 'ufer', 'berg', 'gasse']
    return any(indicator in address for indicator in street_indicators)

def geocode_address(address):
    """Geocode a single address using Nominatim"""
    try:
        params = {
            'q': f"{address}, Berlin, Germany",
            'format': 'json',
            'limit': 1,
            'countrycodes': 'de',
            'viewbox': '13.09,52.33,13.76,52.68',  # Berlin bounding box
            'bounded': 1
        }
        headers = {'User-Agent': USER_AGENT}
        
        response = requests.get(NOMINATIM_URL, params=params, headers=headers, timeout=10)
        time.sleep(1.2)  # Respect rate limit
        
        if response.status_code == 200:
            data = response.json()
            if data and len(data) > 0:
                result = data[0]
                lat = float(result['lat'])
                lng = float(result['lon'])
                # Verify it's in Berlin area
                if 52.33 <= lat <= 52.68 and 13.09 <= lng <= 13.76:
                    return lat, lng
    except Exception as e:
        print(f"Error geocoding {address}: {e}")
    
    return None, None

def geocode_remaining():
    # Load data
    with open('data/storymaps.json', 'r') as f:
        businesses = json.load(f)
    
    # Find businesses needing geocoding
    to_geocode = []
    for i, business in enumerate(businesses):
        if business.get('lat') == DEFAULT_LAT and business.get('lng') == DEFAULT_LNG:
            address = business.get('address', '')
            if is_valid_address(address):
                to_geocode.append((i, business, address))
    
    print(f"Found {len(to_geocode)} businesses with valid addresses to geocode")
    
    if not to_geocode:
        print("No valid addresses to geocode")
        return
    
    # Limit to first 50 to avoid rate limiting
    to_geocode = to_geocode[:50]
    print(f"Geocoding first {len(to_geocode)} addresses...")
    
    fixed_count = 0
    for idx, (i, business, address) in enumerate(to_geocode):
        print(f"[{idx+1}/{len(to_geocode)}] Geocoding: {address}")
        lat, lng = geocode_address(address)
        
        if lat and lng:
            businesses[i]['lat'] = lat
            businesses[i]['lng'] = lng
            fixed_count += 1
            print(f"  ✅ Success: ({lat}, {lng})")
        else:
            print(f"  ❌ Failed")
    
    if fixed_count > 0:
        # Backup and save
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = f'data/storymaps_backup_before_geocoding_{timestamp}.json'
        
        with open('data/storymaps.json', 'r') as f:
            backup_data = json.load(f)
        with open(backup_file, 'w') as f:
            json.dump(backup_data, f, indent=2, ensure_ascii=False)
        
        with open('data/storymaps.json', 'w') as f:
            json.dump(businesses, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ Geocoded {fixed_count} addresses")
        print(f"Backup saved to: {backup_file}")
    else:
        print("\n❌ No addresses could be geocoded")

if __name__ == "__main__":
    geocode_remaining()