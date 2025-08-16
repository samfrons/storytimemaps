#!/usr/bin/env python3
"""
Geocode the remaining valid addresses that were missed
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
TEST_DATA_FILE = 'data/storymaps_test_full.json'
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

def is_valid_address(address):
    """Check if address is valid for geocoding"""
    if not address or len(address) < 5:
        return False
    # Skip if just a number
    if address.replace(',', '').replace(' ', '').isdigit():
        return False
    # More comprehensive street indicators
    street_indicators = [
        'str', 'Str', 'platz', 'Platz', 'weg', 'allee', 'damm', 'ufer', 
        'berg', 'gasse', 'ring', 'markt', 'tor', 'brücke', 'park', 'hof', 
        'wall', 'chaussee', 'promenade', 'Allee'
    ]
    return any(indicator in address for indicator in street_indicators)

def geocode_address(address, conn):
    """Geocode a single address using cache first, then Nominatim"""
    # Check cache first
    cached_lat, cached_lng, cached_confidence = check_cache(conn, address)
    if cached_lat is not None and cached_lng is not None:
        return cached_lat, cached_lng, True  # True indicates cache hit
    
    # If not in cache, use Nominatim API
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
                    # Save to cache
                    normalized_address = f"{address}, Berlin, Germany"
                    confidence = float(result.get('importance', 0.0))
                    save_to_cache(conn, address, normalized_address, lat, lng, confidence)
                    return lat, lng, False  # False indicates API call
                    
    except Exception as e:
        print(f"    Error geocoding {address}: {e}")
    
    return None, None, False

def geocode_remaining():
    """Geocode only the remaining valid addresses"""
    print("=== Geocoding Remaining Valid Addresses ===")
    
    # Initialize cache
    conn = init_cache()
    
    # Check cache statistics
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM geocoding_cache")
    cache_count = cursor.fetchone()[0]
    print(f"Existing cache entries: {cache_count}")
    
    # Load test dataset
    if not os.path.exists(TEST_DATA_FILE):
        print(f"Error: {TEST_DATA_FILE} not found.")
        return
    
    with open(TEST_DATA_FILE, 'r', encoding='utf-8') as f:
        businesses = json.load(f)
    
    print(f"Loaded {len(businesses)} businesses from test dataset")
    
    # Find businesses needing geocoding
    to_geocode = []
    already_geocoded = 0
    invalid_addresses = 0
    
    for i, business in enumerate(businesses):
        if business.get('lat') == DEFAULT_LAT and business.get('lng') == DEFAULT_LNG:
            address = business.get('address', '')
            if is_valid_address(address):
                to_geocode.append((i, business, address))
            else:
                invalid_addresses += 1
        else:
            already_geocoded += 1
    
    print(f"Status breakdown:")
    print(f"  Already geocoded: {already_geocoded}")
    print(f"  Valid addresses to geocode: {len(to_geocode)}")
    print(f"  Invalid addresses: {invalid_addresses}")
    
    if not to_geocode:
        print("No valid addresses to geocode!")
        conn.close()
        return
    
    print(f"\nProcessing {len(to_geocode)} addresses...")
    
    geocoded_count = 0
    cache_hits = 0
    api_calls = 0
    failed_count = 0
    
    for idx, (i, business, address) in enumerate(to_geocode):
        print(f"[{idx+1}/{len(to_geocode)}] {address[:50]}...")
        
        lat, lng, is_cache_hit = geocode_address(address, conn)
        
        if lat and lng:
            businesses[i]['lat'] = lat
            businesses[i]['lng'] = lng
            geocoded_count += 1
            
            if is_cache_hit:
                cache_hits += 1
                print(f"  ✅ Cache hit: ({lat:.6f}, {lng:.6f})")
            else:
                api_calls += 1
                print(f"  ✅ API call: ({lat:.6f}, {lng:.6f})")
        else:
            failed_count += 1
            print(f"  ❌ Failed")
        
        # Save progress every 50 addresses
        if (idx + 1) % 50 == 0:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_file = f'data/storymaps_test_full_backup_remaining_{timestamp}.json'
            
            with open(backup_file, 'w', encoding='utf-8') as f:
                json.dump(businesses, f, indent=2, ensure_ascii=False)
            
            with open(TEST_DATA_FILE, 'w', encoding='utf-8') as f:
                json.dump(businesses, f, indent=2, ensure_ascii=False)
            
            print(f"  💾 Progress saved")
    
    # Final save
    if geocoded_count > 0:
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = f'data/storymaps_test_full_backup_final_{timestamp}.json'
        
        with open(backup_file, 'w', encoding='utf-8') as f:
            json.dump(businesses, f, indent=2, ensure_ascii=False)
        
        with open(TEST_DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(businesses, f, indent=2, ensure_ascii=False)
    
    # Final statistics
    print(f"\n=== Geocoding Complete ===")
    print(f"Total processed: {len(to_geocode)}")
    print(f"Successfully geocoded: {geocoded_count}")
    print(f"Cache hits: {cache_hits}")
    print(f"API calls: {api_calls}")
    print(f"Failed: {failed_count}")
    
    conn.close()
    
    print(f"\n✅ Additional geocoding complete!")
    print(f"📁 Updated file: {TEST_DATA_FILE}")

if __name__ == "__main__":
    geocode_remaining()