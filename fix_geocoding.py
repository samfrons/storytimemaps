#!/usr/bin/env python3
"""
Quick fix for businesses at default coordinates
Uses the geocoding cache if available
"""

import json
import sqlite3
import os
from pathlib import Path

# Default coordinates that indicate geocoding failure
DEFAULT_LAT = 52.52
DEFAULT_LNG = 13.405

def load_cached_geocodes():
    """Load geocoding results from cache database if it exists"""
    cache_db = "geocoding_cache.db"
    cached_coords = {}
    
    if os.path.exists(cache_db):
        conn = sqlite3.connect(cache_db)
        cursor = conn.cursor()
        try:
            cursor.execute("SELECT address, lat, lng FROM geocoding_cache WHERE lat IS NOT NULL AND lng IS NOT NULL")
            for address, lat, lng in cursor.fetchall():
                # Skip if these are the default coordinates
                if lat != DEFAULT_LAT or lng != DEFAULT_LNG:
                    cached_coords[address] = (lat, lng)
        except:
            pass
        conn.close()
    
    return cached_coords

def fix_storymaps_geocoding():
    """Fix businesses that have default coordinates"""
    
    # Load current data
    with open('data/storymaps.json', 'r') as f:
        businesses = json.load(f)
    
    # Load cached geocodes
    cached = load_cached_geocodes()
    print(f"Loaded {len(cached)} cached geocoding results")
    
    # Count and fix businesses
    fixed_count = 0
    still_default = 0
    
    for business in businesses:
        # Check if this business has default coordinates
        if business.get('lat') == DEFAULT_LAT and business.get('lng') == DEFAULT_LNG:
            address = business.get('address', '')
            
            # Try to find cached coordinates
            if address in cached:
                lat, lng = cached[address]
                business['lat'] = lat
                business['lng'] = lng
                fixed_count += 1
                print(f"Fixed: {business['title']} -> ({lat}, {lng})")
            else:
                still_default += 1
    
    # Save updated data
    if fixed_count > 0:
        # Backup current file
        from datetime import datetime
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = f'data/storymaps_backup_before_geocode_fix_{timestamp}.json'
        
        with open('data/storymaps.json', 'r') as f:
            backup_data = f.read()
        with open(backup_file, 'w') as f:
            f.write(backup_data)
        print(f"Created backup: {backup_file}")
        
        # Save fixed data
        with open('data/storymaps.json', 'w') as f:
            json.dump(businesses, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ Fixed {fixed_count} businesses with cached coordinates")
        print(f"⚠️  {still_default} businesses still at default coordinates (no cache available)")
    else:
        print(f"\n❌ No cached coordinates found to fix the {still_default} businesses at default coordinates")
        print("The geocoding cache database may be missing or empty")
        
        # Try to use some common Berlin coordinates for known streets
        manual_fixes = {
            "Rosenthaler": (52.5243, 13.4014),  # Rosenthaler Straße area
            "Unter den Linden": (52.5170, 13.3886),  # Unter den Linden
            "Kurfürstendamm": (52.5050, 13.3300),  # Kurfürstendamm
            "Friedrichstraße": (52.5200, 13.3888),  # Friedrichstraße
            "Potsdamer": (52.5096, 13.3761),  # Potsdamer Platz area
            "Alexanderplatz": (52.5219, 13.4132),  # Alexanderplatz area
        }
        
        manual_fixed = 0
        for business in businesses:
            if business.get('lat') == DEFAULT_LAT and business.get('lng') == DEFAULT_LNG:
                address = business.get('address', '')
                for street_key, coords in manual_fixes.items():
                    if street_key in address:
                        business['lat'] = coords[0] + (0.001 * manual_fixed)  # Slight offset
                        business['lng'] = coords[1] + (0.001 * manual_fixed)
                        manual_fixed += 1
                        print(f"Manual fix: {business['title']} -> {street_key} area")
                        break
        
        if manual_fixed > 0:
            with open('data/storymaps.json', 'w') as f:
                json.dump(businesses, f, indent=2, ensure_ascii=False)
            print(f"\n✅ Applied manual fixes to {manual_fixed} businesses based on street names")

if __name__ == "__main__":
    fix_storymaps_geocoding()