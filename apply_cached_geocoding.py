#!/usr/bin/env python3
"""
Apply cached geocoding results to businesses at default coordinates
"""

import json
import sqlite3
from datetime import datetime

# Default coordinates that indicate geocoding failure
DEFAULT_LAT = 52.52
DEFAULT_LNG = 13.405

def apply_cached_geocoding():
    # Load current data
    with open('data/storymaps.json', 'r') as f:
        businesses = json.load(f)
    
    # Connect to geocoding cache
    conn = sqlite3.connect('geocoding_cache.db')
    cursor = conn.cursor()
    
    # Statistics
    fixed_count = 0
    still_default = 0
    already_good = 0
    
    for business in businesses:
        lat = business.get('lat')
        lng = business.get('lng')
        address = business.get('address', '').strip()
        
        # Skip if already has good coordinates
        if lat != DEFAULT_LAT or lng != DEFAULT_LNG:
            already_good += 1
            continue
        
        # Try to find in cache
        if address:
            # Try exact match first
            cursor.execute("""
                SELECT lat, lng FROM geocoding_cache 
                WHERE (original_address = ? OR normalized_address = ?)
                AND lat IS NOT NULL AND lng IS NOT NULL
                AND (lat != ? OR lng != ?)
            """, (address, address, DEFAULT_LAT, DEFAULT_LNG))
            
            result = cursor.fetchone()
            
            if result:
                business['lat'] = result[0]
                business['lng'] = result[1]
                fixed_count += 1
                print(f"✅ Fixed: {business['title']} at '{address}' -> ({result[0]}, {result[1]})")
            else:
                # Try partial match for street name
                street_parts = address.split(',')[0].strip() if ',' in address else address
                if len(street_parts) > 3:  # Don't search for very short strings
                    cursor.execute("""
                        SELECT lat, lng, original_address FROM geocoding_cache 
                        WHERE original_address LIKE ?
                        AND lat IS NOT NULL AND lng IS NOT NULL
                        AND (lat != ? OR lng != ?)
                        LIMIT 1
                    """, (f'%{street_parts}%', DEFAULT_LAT, DEFAULT_LNG))
                    
                    result = cursor.fetchone()
                    if result:
                        business['lat'] = result[0]
                        business['lng'] = result[1]
                        fixed_count += 1
                        print(f"✅ Fixed (partial match): {business['title']} at '{address}' -> ({result[0]}, {result[1]})")
                    else:
                        still_default += 1
                else:
                    still_default += 1
        else:
            still_default += 1
    
    conn.close()
    
    # Save results
    if fixed_count > 0:
        # Create backup
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = f'data/storymaps_backup_before_cache_fix_{timestamp}.json'
        with open('data/storymaps.json', 'r') as f:
            backup_data = json.load(f)
        with open(backup_file, 'w') as f:
            json.dump(backup_data, f, indent=2, ensure_ascii=False)
        print(f"\n✅ Created backup: {backup_file}")
        
        # Save updated data
        with open('data/storymaps.json', 'w') as f:
            json.dump(businesses, f, indent=2, ensure_ascii=False)
        
        print("\n" + "="*60)
        print("GEOCODING RESULTS:")
        print(f"  ✅ Already had good coordinates: {already_good}")
        print(f"  ✅ Fixed with cached geocoding: {fixed_count}")
        print(f"  ❌ Still at default coordinates: {still_default}")
        print(f"  Total businesses: {len(businesses)}")
        print("="*60)
    else:
        print(f"\n❌ No addresses could be fixed from cache")
        print(f"  {already_good} already have good coordinates")
        print(f"  {still_default} remain at default coordinates")

if __name__ == "__main__":
    apply_cached_geocoding()