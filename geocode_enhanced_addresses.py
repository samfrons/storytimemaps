#!/usr/bin/env python3
"""
Geocode the newly enhanced addresses while preserving existing geocoded data
"""

import json
import time
import requests
import sqlite3
import hashlib
from datetime import datetime
import os

# Default coordinates
DEFAULT_LAT = 52.52
DEFAULT_LNG = 13.405

# Nominatim API
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "StoryTimeMaps/1.0 (historical.research@example.com)"

# Files
ENHANCED_DATA_FILE = 'data/storymaps_test_enhanced_addresses.json'
CACHE_DB = 'geocoding_cache.db'

def init_cache():
    """Initialize geocoding cache database"""
    conn = sqlite3.connect(CACHE_DB)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS geocoding_cache (
            address_hash TEXT PRIMARY KEY,
            original_address TEXT,
            normalized_address TEXT,
            lat REAL,
            lng REAL,
            confidence REAL,
            timestamp TEXT,
            source TEXT
        )
    ''')
    
    conn.commit()
    return conn

def get_address_hash(address):
    """Generate hash for address caching"""
    return hashlib.md5(address.encode('utf-8')).hexdigest()

def check_cache(conn, address):
    """Check if address is already geocoded in cache"""
    address_hash = get_address_hash(address)
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT lat, lng, confidence FROM geocoding_cache 
        WHERE address_hash = ?
    ''', (address_hash,))
    
    result = cursor.fetchone()
    if result:
        lat, lng, confidence = result
        return lat, lng, confidence
    
    return None, None, None

def save_to_cache(conn, original_address, normalized_address, lat, lng, confidence=0.0):
    """Save geocoding result to cache"""
    address_hash = get_address_hash(original_address)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT OR REPLACE INTO geocoding_cache 
        (address_hash, original_address, normalized_address, lat, lng, confidence, timestamp, source)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        address_hash,
        original_address,
        normalized_address,
        lat,
        lng,
        confidence,
        datetime.now().isoformat(),
        'nominatim'
    ))
    
    conn.commit()

def is_good_address(address):
    """Check if address is good enough for geocoding"""
    if not address or len(address) < 10:
        return False
    
    # Must have some street indicator
    street_indicators = [
        'str', 'straße', 'platz', 'allee', 'weg', 'damm', 'gasse', 'ufer', 
        'ring', 'markt', 'tor', 'brücke', 'park', 'hof', 'wall', 'chaussee', 'promenade'
    ]
    
    return any(indicator in address.lower() for indicator in street_indicators)

def geocode_address(address, conn):
    """Geocode a single address using cache first, then Nominatim"""
    # Check cache first
    cached_lat, cached_lng, cached_confidence = check_cache(conn, address)
    if cached_lat is not None and cached_lng is not None:
        return cached_lat, cached_lng, True  # True indicates cache hit
    
    # If not in cache, use Nominatim API
    try:
        # Clean up address for better geocoding
        clean_address = address.replace('  ', ' ').strip()
        
        params = {
            'q': f"{clean_address}, Germany",
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
                    # Save to cache
                    normalized_address = f"{clean_address}, Germany"
                    confidence = float(result.get('importance', 0.0))
                    save_to_cache(conn, address, normalized_address, lat, lng, confidence)
                    return lat, lng, False  # False indicates API call
                    
    except Exception as e:
        print(f"    Error geocoding {address}: {e}")
    
    return None, None, False

def geocode_enhanced_addresses():
    """Geocode the enhanced addresses"""
    print("=== Geocoding Enhanced Addresses ===")
    print("Processing addresses that were fixed by enhanced parsing")
    
    # Initialize cache
    conn = init_cache()
    
    # Check cache statistics
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM geocoding_cache")
    cache_count = cursor.fetchone()[0]
    print(f"Existing cache entries: {cache_count}")
    
    # Load enhanced dataset
    if not os.path.exists(ENHANCED_DATA_FILE):
        print(f"Error: {ENHANCED_DATA_FILE} not found.")
        return
    
    with open(ENHANCED_DATA_FILE, 'r', encoding='utf-8') as f:
        businesses = json.load(f)
    
    print(f"Loaded {len(businesses)} businesses from enhanced dataset")
    
    # First, copy over any existing geocoded data from the current test file
    if os.path.exists('data/storymaps_test_full.json'):
        with open('data/storymaps_test_full.json', 'r', encoding='utf-8') as f:
            existing_data = json.load(f)
        
        print(f"Copying existing geocoded data from {len(existing_data)} businesses...")
        
        # Create lookup by title for existing geocoded businesses
        existing_geocoded = {}
        for business in existing_data:
            if business.get('lat') != DEFAULT_LAT or business.get('lng') != DEFAULT_LNG:
                existing_geocoded[business.get('title', '')] = {
                    'lat': business['lat'],
                    'lng': business['lng']
                }
        
        # Apply existing geocoded data
        preserved_count = 0
        for business in businesses:
            title = business.get('title', '')
            if title in existing_geocoded:
                business['lat'] = existing_geocoded[title]['lat']
                business['lng'] = existing_geocoded[title]['lng']
                preserved_count += 1
        
        print(f"Preserved {preserved_count} existing geocoded businesses")
    
    # Find businesses that need geocoding
    to_geocode = []
    already_geocoded = 0
    enhanced_need_geocoding = 0
    
    for i, business in enumerate(businesses):
        if business.get('lat') == DEFAULT_LAT and business.get('lng') == DEFAULT_LNG:
            address = business.get('address', '')
            if is_good_address(address):
                to_geocode.append((i, business, address))
                if business.get('address_enhanced'):
                    enhanced_need_geocoding += 1
        else:
            already_geocoded += 1
    
    print(f"\\nGeocoding status:")
    print(f"  Already geocoded: {already_geocoded:,}")
    print(f"  Need geocoding: {len(to_geocode):,}")
    print(f"  Of which enhanced addresses: {enhanced_need_geocoding:,}")
    
    if not to_geocode:
        print("No addresses to geocode!")
        conn.close()
        return
    
    # Prioritize enhanced addresses
    enhanced_addresses = [(i, b, a) for i, b, a in to_geocode if b.get('address_enhanced')]
    other_addresses = [(i, b, a) for i, b, a in to_geocode if not b.get('address_enhanced')]
    
    print(f"\\nProcessing in priority order:")
    print(f"  1. Enhanced addresses: {len(enhanced_addresses):,}")
    print(f"  2. Other addresses: {len(other_addresses):,}")
    
    all_to_process = enhanced_addresses + other_addresses
    
    geocoded_count = 0
    enhanced_geocoded = 0
    cache_hits = 0
    api_calls = 0
    failed_count = 0
    
    for idx, (i, business, address) in enumerate(all_to_process):
        is_enhanced = business.get('address_enhanced', False)
        prefix = "🔧" if is_enhanced else "📍"
        
        print(f"[{idx+1}/{len(all_to_process)}] {prefix} {address[:60]}...")
        
        lat, lng, is_cache_hit = geocode_address(address, conn)
        
        if lat and lng:
            businesses[i]['lat'] = lat
            businesses[i]['lng'] = lng
            geocoded_count += 1
            
            if is_enhanced:
                enhanced_geocoded += 1
            
            if is_cache_hit:
                cache_hits += 1
                print(f"  ✅ Cache hit: ({lat:.6f}, {lng:.6f})")
            else:
                api_calls += 1
                print(f"  ✅ API call: ({lat:.6f}, {lng:.6f})")
        else:
            failed_count += 1
            print(f"  ❌ Failed")
        
        # Save progress every 100 addresses
        if (idx + 1) % 100 == 0:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_file = f'data/storymaps_enhanced_backup_{timestamp}.json'
            
            with open(backup_file, 'w', encoding='utf-8') as f:
                json.dump(businesses, f, indent=2, ensure_ascii=False)
            
            with open(ENHANCED_DATA_FILE, 'w', encoding='utf-8') as f:
                json.dump(businesses, f, indent=2, ensure_ascii=False)
            
            print(f"  💾 Progress saved ({geocoded_count} geocoded so far)")
    
    # Final save
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    final_backup = f'data/storymaps_enhanced_final_{timestamp}.json'
    
    with open(final_backup, 'w', encoding='utf-8') as f:
        json.dump(businesses, f, indent=2, ensure_ascii=False)
    
    with open(ENHANCED_DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(businesses, f, indent=2, ensure_ascii=False)
    
    # Calculate final statistics
    total_geocoded = sum(1 for b in businesses if b.get('lat') != DEFAULT_LAT or b.get('lng') != DEFAULT_LNG)
    total_default = len(businesses) - total_geocoded
    
    print(f"\\n=== Enhanced Geocoding Complete ===")
    print(f"Processed: {len(all_to_process):,} addresses")
    print(f"Successfully geocoded: {geocoded_count:,}")
    print(f"  - Enhanced addresses geocoded: {enhanced_geocoded:,}")
    print(f"Cache hits: {cache_hits:,}")
    print(f"API calls: {api_calls:,}")
    print(f"Failed: {failed_count:,}")
    
    print(f"\\n=== Final Dataset Statistics ===")
    print(f"Total businesses: {len(businesses):,}")
    print(f"Properly geocoded: {total_geocoded:,} ({total_geocoded/len(businesses)*100:.1f}%)")
    print(f"Still default coordinates: {total_default:,} ({total_default/len(businesses)*100:.1f}%)")
    
    improvement = total_geocoded - already_geocoded
    print(f"\\n🎉 Improvement: +{improvement:,} newly geocoded businesses!")
    
    conn.close()
    
    print(f"\\n✅ Enhanced geocoding complete!")
    print(f"📁 Final dataset: {ENHANCED_DATA_FILE}")

if __name__ == "__main__":
    geocode_enhanced_addresses()