#!/usr/bin/env python3
"""
Fix geocoding for businesses at default location (52.52, 13.405)
Uses free OSM Nominatim service with proper address cleaning
"""

import json
import time
import hashlib
import re
import random
from typing import Dict, Optional, Tuple
import requests
from urllib.parse import quote
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Default coordinates
DEFAULT_LAT = 52.52
DEFAULT_LNG = 13.405

# Berlin center for validation
BERLIN_CENTER_LAT = 52.5200
BERLIN_CENTER_LNG = 13.4050

class AddressCleaner:
    """Clean and standardize addresses for better geocoding"""
    
    @staticmethod
    def clean_address(address: str) -> str:
        """Clean common address issues"""
        if not address:
            return ""
            
        original = address
        
        # Remove business type prefixes
        business_prefixes = [
            'electrical goods', 'in publishing and printing', 'pharmacies',
            'wholesale', 'retail', 'factory', 'workshop', 'store'
        ]
        for prefix in business_prefixes:
            if address.lower().startswith(prefix):
                address = address[len(prefix):].strip()
        
        # Fix doubled prefixes (typos)
        address = re.sub(r'^SchSch', 'Sch', address)
        address = re.sub(r'^OraniOff', 'Off', address)
        
        # Replace periods with nothing when between street and number
        address = re.sub(r'(\w+)\.\s*(\d+)', r'\1 \2', address)
        
        # Fix "straße." to "straße"
        address = re.sub(r'straße\.', 'straße', address, flags=re.IGNORECASE)
        address = re.sub(r'str\.', 'str', address, flags=re.IGNORECASE)
        
        # Ensure proper spacing around numbers
        address = re.sub(r'([a-zA-ZäöüÄÖÜß])(\d)', r'\1 \2', address)
        address = re.sub(r'(\d)([a-zA-ZäöüÄÖÜß])', r'\1 \2', address)
        
        # Clean up multiple spaces
        address = ' '.join(address.split())
        
        # Ensure it ends with ", Berlin" if not already
        if not address.endswith('Berlin') and not address.endswith('berlin'):
            if ',' in address:
                parts = address.split(',')
                if 'Berlin' not in parts[-1] and 'berlin' not in parts[-1]:
                    address = address + ', Berlin'
            else:
                address = address + ', Berlin'
        
        if address != original:
            logger.debug(f"Cleaned: '{original}' -> '{address}'")
            
        return address

class GeocodingService:
    """Geocoding using free OSM Nominatim service"""
    
    def __init__(self, cache_file: str = "geocoding_cache_fix.json"):
        self.cache_file = cache_file
        self.cache = self._load_cache()
        self.last_request_time = 0
        self.min_delay = 1.0  # 1 second between requests for OSM
        self.headers = {
            'User-Agent': 'Jewish Business History Project/1.0 (geocoding fix)'
        }
        
    def _load_cache(self) -> Dict:
        """Load geocoding cache"""
        try:
            with open(self.cache_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {}
    
    def _save_cache(self):
        """Save geocoding cache"""
        with open(self.cache_file, 'w', encoding='utf-8') as f:
            json.dump(self.cache, f, indent=2, ensure_ascii=False)
    
    def _get_cache_key(self, address: str) -> str:
        """Generate cache key for address"""
        normalized = address.lower().strip()
        return hashlib.md5(normalized.encode()).hexdigest()
    
    def _rate_limit(self):
        """Enforce rate limiting"""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.min_delay:
            time.sleep(self.min_delay - elapsed)
        self.last_request_time = time.time()
    
    def geocode(self, address: str) -> Optional[Tuple[float, float]]:
        """Geocode an address using OSM Nominatim"""
        if not address or len(address) < 5:
            return None
            
        # Check cache first
        cache_key = self._get_cache_key(address)
        if cache_key in self.cache:
            cached = self.cache[cache_key]
            if cached and 'lat' in cached and 'lon' in cached:
                return (cached['lat'], cached['lon'])
        
        # Rate limiting
        self._rate_limit()
        
        try:
            # Make request to Nominatim
            params = {
                'q': address,
                'format': 'json',
                'limit': 1,
                'bounded': 1,  # Prefer results in Berlin area
                'viewbox': '13.0,52.3,13.8,52.7',  # Berlin bounding box
                'countrycodes': 'de'
            }
            
            response = requests.get(
                'https://nominatim.openstreetmap.org/search',
                params=params,
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    result = data[0]
                    lat = float(result['lat'])
                    lon = float(result['lon'])
                    
                    # Validate it's in Berlin area (within 50km)
                    distance = self._calculate_distance(lat, lon, BERLIN_CENTER_LAT, BERLIN_CENTER_LNG)
                    if distance <= 50:
                        # Cache the result
                        self.cache[cache_key] = {
                            'lat': lat,
                            'lon': lon,
                            'display_name': result.get('display_name', ''),
                            'source': 'nominatim'
                        }
                        return (lat, lon)
                    else:
                        logger.warning(f"Result too far from Berlin ({distance:.1f}km): {address}")
        except Exception as e:
            logger.error(f"Geocoding error for '{address}': {e}")
        
        # Cache as failed
        self.cache[cache_key] = None
        return None
    
    def geocode_street_level(self, address: str) -> Optional[Tuple[float, float]]:
        """Try geocoding at street level (without house number)"""
        # Remove house numbers
        cleaned = re.sub(r'\s+\d+[a-zA-Z]?\b', '', address)
        cleaned = re.sub(r'\s+\d+-\d+\b', '', cleaned)  # Remove range numbers
        
        if cleaned != address:
            logger.debug(f"Trying street level: '{address}' -> '{cleaned}'")
            result = self.geocode(cleaned)
            if result:
                # Add small random offset to avoid exact stacking
                lat, lon = result
                lat += random.uniform(-0.0005, 0.0005)  # ~50m offset
                lon += random.uniform(-0.0005, 0.0005)
                return (lat, lon)
        return None
    
    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance in km between two points"""
        from math import radians, sin, cos, sqrt, atan2
        
        R = 6371  # Earth's radius in km
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        
        return R * c

def main():
    """Main function to fix geocoding for default location businesses"""
    logger.info("=== Starting Geocoding Fix for Default Location Businesses ===")
    
    # Load data
    with open('data/storymaps_test_full.json', 'r', encoding='utf-8') as f:
        businesses = json.load(f)
    
    # Find businesses at default location
    default_businesses = []
    for i, business in enumerate(businesses):
        if business.get('lat') == DEFAULT_LAT and business.get('lng') == DEFAULT_LNG:
            default_businesses.append((i, business))
    
    logger.info(f"Found {len(default_businesses)} businesses at default location")
    
    # Filter to those with addresses
    with_addresses = [(i, b) for i, b in default_businesses if b.get('address') and len(b.get('address', '')) > 5]
    logger.info(f"Found {len(with_addresses)} with addresses to geocode")
    
    # Initialize services
    cleaner = AddressCleaner()
    geocoder = GeocodingService()
    
    # Process addresses
    fixed_count = 0
    street_level_count = 0
    failed_addresses = []
    
    for idx, (business_idx, business) in enumerate(with_addresses):
        original_address = business.get('address', '')
        cleaned_address = cleaner.clean_address(original_address)
        
        if idx % 10 == 0:
            logger.info(f"Processing {idx+1}/{len(with_addresses)} - Fixed so far: {fixed_count}")
        
        # Try exact geocoding first
        result = geocoder.geocode(cleaned_address)
        
        if not result:
            # Try street-level as fallback
            result = geocoder.geocode_street_level(cleaned_address)
            if result:
                street_level_count += 1
        
        if result:
            lat, lon = result
            businesses[business_idx]['lat'] = round(lat, 7)
            businesses[business_idx]['lng'] = round(lon, 7)
            fixed_count += 1
            logger.debug(f"Fixed: {business['title']} - {cleaned_address}")
        else:
            failed_addresses.append({
                'title': business.get('title', ''),
                'original': original_address,
                'cleaned': cleaned_address
            })
        
        # Save cache periodically
        if idx % 50 == 0:
            geocoder._save_cache()
    
    # Final cache save
    geocoder._save_cache()
    
    # Create backup
    timestamp = time.strftime('%Y%m%d_%H%M%S')
    backup_file = f'data/storymaps_test_full_backup_{timestamp}.json'
    with open('data/storymaps_test_full.json', 'r', encoding='utf-8') as f:
        backup_data = json.load(f)
    with open(backup_file, 'w', encoding='utf-8') as f:
        json.dump(backup_data, f, indent=2, ensure_ascii=False)
    logger.info(f"Created backup: {backup_file}")
    
    # Save updated data
    with open('data/storymaps_test_full.json', 'w', encoding='utf-8') as f:
        json.dump(businesses, f, indent=2, ensure_ascii=False)
    
    # Save failed addresses for manual review
    if failed_addresses:
        with open('failed_geocoding.json', 'w', encoding='utf-8') as f:
            json.dump(failed_addresses, f, indent=2, ensure_ascii=False)
        logger.info(f"Saved {len(failed_addresses)} failed addresses to failed_geocoding.json")
    
    # Final statistics
    logger.info("\n=== Geocoding Fix Complete ===")
    logger.info(f"Total businesses at default location: {len(default_businesses)}")
    logger.info(f"Businesses with addresses: {len(with_addresses)}")
    logger.info(f"Successfully geocoded: {fixed_count}")
    logger.info(f"  - Exact matches: {fixed_count - street_level_count}")
    logger.info(f"  - Street-level fallbacks: {street_level_count}")
    logger.info(f"Failed to geocode: {len(failed_addresses)}")
    
    # Check remaining at default
    remaining_default = sum(1 for b in businesses if b.get('lat') == DEFAULT_LAT and b.get('lng') == DEFAULT_LNG)
    logger.info(f"Remaining at default location: {remaining_default}")

if __name__ == "__main__":
    main()