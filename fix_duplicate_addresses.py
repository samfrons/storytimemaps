#!/usr/bin/env python3
"""
Fix duplicate numbers in enhanced addresses and re-geocode them properly
"""

import json
import time
import requests
import sqlite3
import hashlib
import re
from datetime import datetime

# Default coordinates
DEFAULT_LAT = 52.52
DEFAULT_LNG = 13.405

# Nominatim API
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "StoryTimeMaps/1.0 (historical.research@example.com)"

def clean_duplicate_numbers(address):
    """Clean duplicate numbers from addresses like 'Str. 16 16'"""
    if not address:
        return address
    
    # Pattern to match street + number + duplicate number
    # E.g., "Wusterhausener Str. 16 16, Berlin" -> "Wusterhausener Str. 16, Berlin"
    pattern = r'(\b\w+str\w*\.?\s+)(\d+[a-zA-Z]?)\s+\2(\s*,?\s*Berlin)'
    cleaned = re.sub(pattern, r'\1\2\3', address, flags=re.IGNORECASE)
    
    # Also handle cases where the pattern is different
    # Look for any repeated consecutive numbers
    parts = address.split()
    cleaned_parts = []
    i = 0
    while i < len(parts):
        cleaned_parts.append(parts[i])
        # Skip if next part is identical and looks like a number
        if (i + 1 < len(parts) and 
            parts[i].replace(',', '').isdigit() and 
            parts[i+1] == parts[i]):
            i += 2  # Skip the duplicate
        else:
            i += 1
    
    return ' '.join(cleaned_parts)

def geocode_address_expanded(address):
    """Geocode address with expanded search beyond Berlin"""
    try:
        # Clean the address first
        clean_address = clean_duplicate_numbers(address)
        
        params = {
            'q': clean_address + ', Germany',
            'format': 'json',
            'limit': 3,  # Get multiple results
            'countrycodes': 'de'
            # Remove Berlin bounding box to allow suburbs
        }
        headers = {'User-Agent': USER_AGENT}
        
        response = requests.get(NOMINATIM_URL, params=params, headers=headers, timeout=10)
        time.sleep(1.2)  # Respect rate limit
        
        if response.status_code == 200:
            data = response.json()
            if data and len(data) > 0:
                # Try to find the best match
                for result in data:
                    lat = float(result['lat'])
                    lng = float(result['lon'])
                    display_name = result.get('display_name', '').lower()
                    
                    # Accept if it's in Berlin area OR mentions the street name
                    street_in_address = re.search(r'(\w+)\s*str', clean_address, re.IGNORECASE)
                    if street_in_address:
                        street_name = street_in_address.group(1).lower()
                        if street_name in display_name:
                            return lat, lng, clean_address, result.get('display_name', '')
                    
                    # Also accept if coordinates are reasonable for Berlin metro area
                    if 52.2 <= lat <= 52.8 and 13.0 <= lng <= 13.8:
                        return lat, lng, clean_address, result.get('display_name', '')
                        
    except Exception as e:
        print(f"    Error geocoding {address}: {e}")
    
    return None, None, address, None

def fix_enhanced_addresses():
    """Fix addresses with duplicate numbers and re-geocode"""
    print("=== Fixing Duplicate Address Numbers ===")
    
    # Load current data
    with open('data/storymaps_test_full.json', 'r', encoding='utf-8') as f:
        businesses = json.load(f)
    
    print(f"Loaded {len(businesses)} businesses")
    
    # Find businesses with duplicate numbers that need fixing
    to_fix = []
    
    for i, business in enumerate(businesses):
        address = business.get('address', '')
        cleaned = clean_duplicate_numbers(address)
        
        # If address changed, it had duplicates
        if cleaned != address:
            to_fix.append((i, business, address, cleaned))
    
    print(f"Found {len(to_fix)} addresses with duplicate numbers to fix")
    
    if not to_fix:
        print("No duplicate numbers found!")
        return
    
    # Show examples
    print(f"\\nExamples:")
    for i, (idx, business, original, cleaned) in enumerate(to_fix[:5]):
        print(f"  {business.get('title', '')[:40]}")
        print(f"    Before: {original}")
        print(f"    After:  {cleaned}")
    
    # Fix and re-geocode
    fixed_count = 0
    geocoded_count = 0
    
    for idx, (i, business, original, cleaned) in enumerate(to_fix):
        print(f"\\n[{idx+1}/{len(to_fix)}] Fixing: {business.get('title', '')[:50]}")
        print(f"  Original: {original}")
        print(f"  Cleaned:  {cleaned}")
        
        # Update address
        business['address'] = cleaned
        fixed_count += 1
        
        # Try to geocode the cleaned address
        lat, lng, final_address, display_name = geocode_address_expanded(cleaned)
        
        if lat and lng:
            business['lat'] = lat
            business['lng'] = lng
            business['address'] = final_address
            geocoded_count += 1
            print(f"  ✅ Geocoded: ({lat:.6f}, {lng:.6f})")
            if display_name:
                print(f"     Location: {display_name}")
        else:
            print(f"  ❌ Failed to geocode")
    
    # Save results
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_file = f'data/storymaps_fixed_duplicates_backup_{timestamp}.json'
    
    # Create backup
    with open(backup_file, 'w', encoding='utf-8') as f:
        json.dump(businesses, f, indent=2, ensure_ascii=False)
    
    # Update main file
    with open('data/storymaps_test_full.json', 'w', encoding='utf-8') as f:
        json.dump(businesses, f, indent=2, ensure_ascii=False)
    
    # Final statistics
    total_geocoded = sum(1 for b in businesses if b.get('lat') != DEFAULT_LAT or b.get('lng') != DEFAULT_LNG)
    
    print(f"\\n=== Fix Complete ===")
    print(f"Addresses fixed: {fixed_count}")
    print(f"Successfully re-geocoded: {geocoded_count}")
    print(f"Total geocoded in dataset: {total_geocoded:,}")
    print(f"Backup saved: {backup_file}")
    
    # Check for Robert Gohlke specifically
    for business in businesses:
        if 'Robert Gohlke' in business.get('title', ''):
            print(f"\\n🔍 Robert Gohlke status:")
            print(f"  Address: {business['address']}")
            print(f"  Coordinates: ({business.get('lat')}, {business.get('lng')})")
            break

if __name__ == "__main__":
    fix_enhanced_addresses()