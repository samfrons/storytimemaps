#!/usr/bin/env python3
"""
Berlin Historical Address Geocoder

Cost-optimized geocoding solution for 4,000+ historical Berlin business addresses
from 1900-1945. Uses free Nominatim/OpenStreetMap API with intelligent caching
and rate limiting.

Author: Claude Code Assistant
"""

import json
import time
import random
import hashlib
import logging
import os
import requests
import sqlite3
from datetime import datetime
from typing import Dict, List, Tuple, Optional
from pathlib import Path
import re

# Configuration
NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "BerlinHistoricalMapping/1.0 (historical.research@example.com)"
REQUEST_DELAY = 1.2  # Seconds between requests (respects Nominatim usage policy)
CACHE_DB_PATH = "geocoding_cache.db"
MAX_RETRIES = 3
RETRY_DELAY = 2

# Berlin bounding box for validation
BERLIN_BOUNDS = {
    'min_lat': 52.33,
    'max_lat': 52.68,
    'min_lng': 13.09,
    'max_lng': 13.76
}

# Historical street name mappings for 1900-1945 Berlin
HISTORICAL_STREET_MAPPINGS = {
    'Kaiser-Wilhelm-Str.': 'Kaiser-Wilhelm-Straße',
    'Friedrichstr.': 'Friedrichstraße',
    'Kantstr.': 'Kantstraße',
    'Wallstr.': 'Wallstraße',
    'Neue Friedrichstr.': 'Neue Friedrichstraße',
    'Str.': 'Straße',
    'Pl.': 'Platz',
    'Ufer': 'Ufer',
    'Ring': 'Ring',
    'Damm': 'Damm'
}

class BerlinGeocoder:
    """Cost-optimized geocoder for historical Berlin addresses"""
    
    def __init__(self, data_file_path: str):
        self.data_file_path = data_file_path
        self.setup_logging()
        self.setup_cache()
        self.session = requests.Session()
        self.session.headers.update({'User-Agent': USER_AGENT})
        self.geocoded_count = 0
        self.cache_hits = 0
        self.failed_addresses = []
        
    def setup_logging(self):
        """Configure logging for geocoding process"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(f'geocoding_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
        
    def setup_cache(self):
        """Initialize SQLite cache for geocoded addresses"""
        self.conn = sqlite3.connect(CACHE_DB_PATH)
        self.conn.execute('''
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
        self.conn.commit()
        
    def normalize_address(self, address: str) -> str:
        """Normalize historical Berlin address for better geocoding"""
        # Remove extra spaces and standardize format
        normalized = re.sub(r'\s+', ' ', address.strip())
        
        # Apply historical street name mappings
        for old_name, new_name in HISTORICAL_STREET_MAPPINGS.items():
            normalized = normalized.replace(old_name, new_name)
        
        # Ensure Berlin is in the address
        if 'Berlin' not in normalized:
            normalized += ', Berlin, Germany'
        elif 'Germany' not in normalized:
            normalized += ', Germany'
            
        # Handle incomplete addresses (just numbers)
        if re.match(r'^\d+,?\s*Berlin', normalized):
            self.logger.warning(f"Incomplete address detected: {address}")
            return None
            
        return normalized
        
    def get_address_hash(self, address: str) -> str:
        """Generate hash for address caching"""
        return hashlib.md5(address.encode('utf-8')).hexdigest()
        
    def check_cache(self, address: str) -> Optional[Tuple[float, float, float]]:
        """Check if address is already geocoded in cache"""
        address_hash = self.get_address_hash(address)
        cursor = self.conn.execute(
            'SELECT lat, lng, confidence FROM geocoding_cache WHERE address_hash = ?',
            (address_hash,)
        )
        result = cursor.fetchone()
        if result:
            self.cache_hits += 1
            return result
        return None
        
    def save_to_cache(self, original_address: str, normalized_address: str, 
                     lat: float, lng: float, confidence: float, source: str):
        """Save geocoding result to cache"""
        address_hash = self.get_address_hash(original_address)
        timestamp = datetime.now().isoformat()
        
        self.conn.execute('''
            INSERT OR REPLACE INTO geocoding_cache 
            (address_hash, original_address, normalized_address, lat, lng, confidence, timestamp, source)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (address_hash, original_address, normalized_address, lat, lng, confidence, timestamp, source))
        self.conn.commit()
        
    def is_within_berlin_bounds(self, lat: float, lng: float) -> bool:
        """Validate coordinates are within Berlin area"""
        return (BERLIN_BOUNDS['min_lat'] <= lat <= BERLIN_BOUNDS['max_lat'] and
                BERLIN_BOUNDS['min_lng'] <= lng <= BERLIN_BOUNDS['max_lng'])
                
    def geocode_with_nominatim(self, address: str) -> Optional[Tuple[float, float, float]]:
        """Geocode address using Nominatim API with fallback strategies"""
        normalized_address = self.normalize_address(address)
        if not normalized_address:
            return None
            
        # Check cache first
        cached_result = self.check_cache(address)
        if cached_result:
            return cached_result
            
        # Try multiple query variations for better results
        query_variations = [
            normalized_address,
            normalized_address.replace(', Germany', ''),
            f"{normalized_address}, Deutschland",
            f"{normalized_address}, DE"
        ]
        
        for query in query_variations:
            try:
                # Rate limiting
                time.sleep(REQUEST_DELAY)
                
                params = {
                    'q': query,
                    'format': 'json',
                    'limit': 1,
                    'countrycodes': 'DE',
                    'bounded': 1,
                    'viewbox': f"{BERLIN_BOUNDS['min_lng']},{BERLIN_BOUNDS['min_lat']},{BERLIN_BOUNDS['max_lng']},{BERLIN_BOUNDS['max_lat']}",
                    'addressdetails': 1
                }
                
                response = self.session.get(NOMINATIM_BASE_URL, params=params, timeout=10)
                response.raise_for_status()
                
                data = response.json()
                if data and len(data) > 0:
                    result = data[0]
                    lat = float(result['lat'])
                    lng = float(result['lon'])
                    confidence = float(result.get('importance', 0.5))
                    
                    # Validate coordinates are in Berlin
                    if self.is_within_berlin_bounds(lat, lng):
                        self.save_to_cache(address, normalized_address, lat, lng, confidence, 'nominatim')
                        self.logger.info(f"Geocoded: {address} -> ({lat}, {lng}) confidence: {confidence}")
                        return lat, lng, confidence
                    else:
                        self.logger.warning(f"Coordinates outside Berlin bounds for: {address}")
                        
            except requests.exceptions.RequestException as e:
                self.logger.error(f"Request failed for {address}: {e}")
                continue
            except (ValueError, KeyError) as e:
                self.logger.error(f"Invalid response for {address}: {e}")
                continue
                
        self.logger.warning(f"Failed to geocode: {address}")
        self.failed_addresses.append(address)
        return None
        
    def add_random_offset(self, lat: float, lng: float, offset_meters: int = 50) -> Tuple[float, float]:
        """Add small random offset to prevent exact overlapping of businesses at same address"""
        # Convert meters to approximate degrees (rough approximation for Berlin)
        lat_offset = (random.uniform(-offset_meters, offset_meters) / 111000)  # ~111km per degree lat
        lng_offset = (random.uniform(-offset_meters, offset_meters) / (111000 * 0.7))  # adjusted for Berlin longitude
        
        return lat + lat_offset, lng + lng_offset
        
    def create_backup(self) -> str:
        """Create backup of original data file"""
        backup_path = f"{self.data_file_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        with open(self.data_file_path, 'r', encoding='utf-8') as src:
            with open(backup_path, 'w', encoding='utf-8') as dst:
                dst.write(src.read())
        self.logger.info(f"Backup created: {backup_path}")
        return backup_path
        
    def load_data(self) -> List[Dict]:
        """Load storymaps data from JSON file"""
        with open(self.data_file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
            
    def save_data(self, data: List[Dict]):
        """Save updated data back to JSON file"""
        with open(self.data_file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            
    def needs_geocoding(self, entry: Dict) -> bool:
        """Check if entry needs geocoding (has default coordinates)"""
        return (entry.get('author') == 'HU Berlin Database' and 
                entry.get('lat') == 52.52 and 
                entry.get('lng') == 13.405)
                
    def geocode_all_addresses(self):
        """Main method to geocode all addresses in the dataset"""
        self.logger.info("Starting geocoding process...")
        
        # Create backup
        backup_path = self.create_backup()
        
        # Load data
        data = self.load_data()
        self.logger.info(f"Loaded {len(data)} entries")
        
        # Find entries that need geocoding
        entries_to_geocode = [entry for entry in data if self.needs_geocoding(entry)]
        self.logger.info(f"Found {len(entries_to_geocode)} entries needing geocoding")
        
        if not entries_to_geocode:
            self.logger.info("No entries need geocoding!")
            return
            
        # Group by address to handle multiple businesses at same location
        address_groups = {}
        for entry in entries_to_geocode:
            address = entry['address']
            if address not in address_groups:
                address_groups[address] = []
            address_groups[address].append(entry)
            
        self.logger.info(f"Processing {len(address_groups)} unique addresses")
        
        # Process each address group
        processed_addresses = 0
        for address, entries in address_groups.items():
            self.logger.info(f"Processing address {processed_addresses + 1}/{len(address_groups)}: {address}")
            
            # Geocode the address
            result = self.geocode_with_nominatim(address)
            
            if result:
                base_lat, base_lng, confidence = result
                
                # Update all entries for this address with slight offsets
                for i, entry in enumerate(entries):
                    if len(entries) > 1:
                        # Add random offset for multiple businesses at same address
                        lat, lng = self.add_random_offset(base_lat, base_lng)
                    else:
                        lat, lng = base_lat, base_lng
                        
                    entry['lat'] = round(lat, 7)
                    entry['lng'] = round(lng, 7)
                    self.geocoded_count += 1
                    
                    self.logger.info(f"Updated {entry['title']}: ({lat}, {lng})")
            else:
                self.logger.error(f"Failed to geocode address: {address}")
                
            processed_addresses += 1
            
            # Progress update every 100 addresses
            if processed_addresses % 100 == 0:
                self.logger.info(f"Progress: {processed_addresses}/{len(address_groups)} addresses processed")
                # Save intermediate results
                self.save_data(data)
                
        # Final save
        self.save_data(data)
        
        # Print summary statistics
        self.print_summary(len(address_groups))
        
    def print_summary(self, total_addresses: int):
        """Print geocoding summary statistics"""
        self.logger.info("\n" + "="*50)
        self.logger.info("GEOCODING SUMMARY")
        self.logger.info("="*50)
        self.logger.info(f"Total unique addresses processed: {total_addresses}")
        self.logger.info(f"Successfully geocoded entries: {self.geocoded_count}")
        self.logger.info(f"Cache hits: {self.cache_hits}")
        self.logger.info(f"Failed addresses: {len(self.failed_addresses)}")
        
        if self.failed_addresses:
            self.logger.info("\nFailed addresses:")
            for addr in self.failed_addresses[:10]:  # Show first 10
                self.logger.info(f"  - {addr}")
            if len(self.failed_addresses) > 10:
                self.logger.info(f"  ... and {len(self.failed_addresses) - 10} more")
                
        success_rate = (self.geocoded_count / (self.geocoded_count + len(self.failed_addresses))) * 100 if (self.geocoded_count + len(self.failed_addresses)) > 0 else 0
        self.logger.info(f"\nSuccess rate: {success_rate:.1f}%")
        self.logger.info(f"Estimated API calls made: {total_addresses - self.cache_hits}")
        self.logger.info("="*50)

def main():
    """Main execution function"""
    # Path to the storymaps data file
    data_file = "/Users/samfrons/Desktop/storymaps/data/storymaps.json"
    
    if not os.path.exists(data_file):
        print(f"Error: Data file not found at {data_file}")
        return
        
    # Initialize geocoder
    geocoder = BerlinGeocoder(data_file)
    
    # Run geocoding process
    try:
        geocoder.geocode_all_addresses()
    except KeyboardInterrupt:
        print("\nGeocoding interrupted by user")
    except Exception as e:
        print(f"Error during geocoding: {e}")
    finally:
        geocoder.conn.close()

if __name__ == "__main__":
    main()