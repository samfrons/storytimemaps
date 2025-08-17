#!/usr/bin/env python3
"""
Enhanced geocoding fix for remaining businesses at default location
Includes improved address cleaning and multiple geocoding strategies
"""

import json
import time
import hashlib
import re
import random
from typing import Dict, Optional, Tuple, List
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

class EnhancedAddressCleaner:
    """Enhanced address cleaning with better pattern recognition"""
    
    @staticmethod
    def extract_address_from_registration_text(text: str) -> str:
        """Extract actual address from registration/business text"""
        if not text:
            return ""
        
        # Remove registration prefixes
        registration_patterns = [
            r'\(\s*Trade\s*\)\s*',
            r'\(\s*Industry\s*\)\s*',
            r'Eingetragen im Handelsregister/?\s*',
            r'Gründung \d{4}\s*',
            r'Erloschen \d{4}\s*',
            r'Besitzübernahme \d{4}\s*',
            r'Liquidation ab \d{4}-\d{2}-\d{2}.*?\s*',
            r'Nahrungs-\s*und\s*Genussmittel\s*',
            r'chemicals?\s*',
            r'pharmaceuticals?\s*',
            r'construction\s*',
            r'leather\s*',
            r'shoes?\s*',
            r'Trade\s*',
            r'goods?\s*'
        ]
        
        cleaned = text
        for pattern in registration_patterns:
            cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE)
        
        # Extract the actual street address
        # Look for patterns like "Straßename Nummer, Berlin"
        address_patterns = [
            r'([A-ZÄÖÜ][a-zäöüß]*(?:straße|str|allee|damm|platz|weg|ufer|gasse|hof)\.?\s+\d+[a-z]?)\s*,?\s*Berlin',
            r'([A-ZÄÖÜ][a-zäöüß]*(?:straße|str|allee|damm|platz|weg|ufer|gasse|hof))\s*,?\s*Berlin',
            r'([A-ZÄÖÜ][a-zäöüß]*\s+[A-ZÄÖÜ][a-zäöüß]*\s+\d+[a-z]?)\s*,?\s*Berlin'
        ]
        
        for pattern in address_patterns:
            match = re.search(pattern, cleaned, re.IGNORECASE)
            if match:
                return match.group(1).strip() + ', Berlin'
        
        # Fallback: just clean and return
        return cleaned.strip()
    
    @staticmethod
    def clean_address(address: str) -> str:
        """Enhanced address cleaning"""
        if not address:
            return ""
            
        original = address
        
        # First try to extract from registration text
        if 'Eingetragen' in address or 'Trade' in address or 'Handelsregister' in address:
            address = EnhancedAddressCleaner.extract_address_from_registration_text(address)
        
        # Skip if it's just a placeholder
        if any(placeholder in address.lower() for placeholder in 
               ['keine angabe', 'no information', 'unknown', '—', '–']):
            return ""
        
        # Remove business type prefixes
        business_prefixes = [
            'electrical goods', 'in publishing and printing', 'pharmacies',
            'wholesale', 'retail', 'factory', 'workshop', 'store', 'chemicals',
            'pharmaceuticals', 'construction', 'leather', 'shoes', 'goods',
            'trade', 'industry'
        ]
        for prefix in business_prefixes:
            if address.lower().startswith(prefix):
                address = address[len(prefix):].strip()
        
        # Fix merged words
        address = re.sub(r'^SchSch', 'Sch', address)
        address = re.sub(r'^OraniOff', 'Off', address)
        address = re.sub(r'^NeuOff', 'Off', address)  # New pattern found
        
        # Replace periods with nothing when between street and number
        address = re.sub(r'(\w+)\.\s*(\d+)', r'\1 \2', address)
        
        # Fix "straße." to "straße"
        address = re.sub(r'straße\.', 'straße', address, flags=re.IGNORECASE)
        address = re.sub(r'str\.', 'str', address, flags=re.IGNORECASE)
        
        # Fix number/letter combinations like "82d" → "82 d"
        address = re.sub(r'(\d+)([a-zA-Z])\b', r'\1 \2', address)
        
        # Ensure proper spacing around numbers
        address = re.sub(r'([a-zA-ZäöüÄÖÜß])(\d)', r'\1 \2', address)
        address = re.sub(r'(\d)([a-zA-ZäöüÄÖÜß])', r'\1 \2', address)
        
        # Clean up multiple spaces
        address = ' '.join(address.split())
        
        # Handle special location types
        special_locations = {
            'Ostbahnhof': 'Am Ostbahnhof, Berlin',
            'Potsdamer Bahnhof': 'Potsdamer Platz, Berlin',
            'Anhalter Bahnhof': 'Anhalter Bahnhof, Berlin',
            'Urbanhafen': 'Am Urbanhafen, Berlin',
            'Zentralmarkthalle': 'Zentralmarkthalle, Berlin'
        }
        
        for location, replacement in special_locations.items():
            if location.lower() in address.lower() and not any(x in address.lower() for x in ['straße', 'str', 'platz', 'allee']):
                address = replacement
                break
        
        # Ensure it ends with ", Berlin"
        if address and not address.endswith('Berlin') and not address.endswith('berlin'):
            if ',' in address:
                parts = address.split(',')
                if 'Berlin' not in parts[-1] and 'berlin' not in parts[-1]:
                    address = address + ', Berlin'
            else:
                address = address + ', Berlin'
        
        if address != original:
            logger.debug(f"Enhanced cleaning: '{original}' -> '{address}'")
            
        return address

class EnhancedGeocodingService:
    """Enhanced geocoding with multiple strategies"""
    
    def __init__(self, cache_file: str = "geocoding_cache_enhanced.json"):
        self.cache_file = cache_file
        self.cache = self._load_cache()
        self.last_request_time = 0
        self.min_delay = 1.0
        self.headers = {
            'User-Agent': 'Jewish Business History Project/1.0 (enhanced geocoding)'
        }
        
        # Load existing cache if available
        try:
            with open("geocoding_cache_fix.json", 'r') as f:
                existing_cache = json.load(f)
                self.cache.update(existing_cache)
                logger.info(f"Loaded {len(existing_cache)} entries from previous cache")
        except:
            pass
        
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
    
    def geocode_with_nominatim(self, address: str, strategy: str = "exact") -> Optional[Tuple[float, float]]:
        """Geocode using OSM Nominatim with different strategies"""
        if not address or len(address) < 5:
            return None
            
        # Check cache first
        cache_key = f"{strategy}:{self._get_cache_key(address)}"
        if cache_key in self.cache:
            cached = self.cache[cache_key]
            if cached and 'lat' in cached and 'lon' in cached:
                return (cached['lat'], cached['lon'])
            elif cached is None:
                return None
        
        # Rate limiting
        self._rate_limit()
        
        try:
            # Prepare different search strategies
            search_queries = []
            
            if strategy == "exact":
                search_queries = [address]
            elif strategy == "without_number":
                # Remove house numbers for street-level search
                no_number = re.sub(r'\s+\d+[a-zA-Z]?\b', '', address)
                no_number = re.sub(r'\s+\d+-\d+\b', '', no_number)
                search_queries = [no_number]
            elif strategy == "district":
                # Try with Berlin district names
                base_addr = address.replace(', Berlin', '')
                districts = ['Mitte', 'Charlottenburg', 'Kreuzberg', 'Prenzlauer Berg', 
                           'Friedrichshain', 'Schöneberg', 'Wilmersdorf', 'Neukölln']
                search_queries = [f"{base_addr}, {district}, Berlin" for district in districts]
            elif strategy == "fuzzy":
                # Try variations
                variations = [
                    address.replace('straße', 'str'),
                    address.replace('str', 'straße'),
                    address.replace('allee', 'alle'),
                    address.replace('platz', 'pl')
                ]
                search_queries = [v for v in variations if v != address]
            
            for query in search_queries:
                if not query or len(query) < 5:
                    continue
                    
                params = {
                    'q': query,
                    'format': 'json',
                    'limit': 1,
                    'bounded': 1,
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
                        
                        # Validate it's in Berlin area
                        distance = self._calculate_distance(lat, lon, BERLIN_CENTER_LAT, BERLIN_CENTER_LNG)
                        if distance <= 50:
                            # Cache the result
                            self.cache[cache_key] = {
                                'lat': lat,
                                'lon': lon,
                                'display_name': result.get('display_name', ''),
                                'source': f'nominatim_{strategy}',
                                'query': query
                            }
                            
                            # Add random offset for non-exact matches
                            if strategy != "exact":
                                lat += random.uniform(-0.0008, 0.0008)  # ~80m offset
                                lon += random.uniform(-0.0008, 0.0008)
                            
                            return (lat, lon)
                
                # Small delay between variations
                if len(search_queries) > 1:
                    time.sleep(0.2)
                    
        except Exception as e:
            logger.error(f"Geocoding error for '{address}' (strategy: {strategy}): {e}")
        
        # Cache as failed
        self.cache[cache_key] = None
        return None
    
    def geocode_with_multiple_strategies(self, address: str) -> Optional[Tuple[float, float]]:
        """Try multiple geocoding strategies in order"""
        strategies = ["exact", "without_number", "fuzzy", "district"]
        
        for strategy in strategies:
            result = self.geocode_with_nominatim(address, strategy)
            if result:
                logger.debug(f"Success with {strategy} strategy: {address}")
                return result
        
        return None

def main():
    """Enhanced geocoding for remaining default location businesses"""
    logger.info("=== Enhanced Geocoding Fix ===")
    
    # Load data
    with open('data/storymaps_test_full.json', 'r', encoding='utf-8') as f:
        businesses = json.load(f)
    
    # Find businesses still at default location
    default_businesses = []
    for i, business in enumerate(businesses):
        if business.get('lat') == DEFAULT_LAT and business.get('lng') == DEFAULT_LNG:
            default_businesses.append((i, business))
    
    logger.info(f"Found {len(default_businesses)} businesses still at default location")
    
    # Filter to those with addresses
    with_addresses = [(i, b) for i, b in default_businesses 
                     if b.get('address') and len(b.get('address', '')) > 5]
    logger.info(f"Found {len(with_addresses)} with addresses to process")
    
    # Initialize services
    cleaner = EnhancedAddressCleaner()
    geocoder = EnhancedGeocodingService()
    
    # Process addresses
    fixed_count = 0
    failed_addresses = []
    
    for idx, (business_idx, business) in enumerate(with_addresses):
        original_address = business.get('address', '')
        cleaned_address = cleaner.clean_address(original_address)
        
        if idx % 10 == 0:
            logger.info(f"Processing {idx+1}/{len(with_addresses)} - Fixed so far: {fixed_count}")
        
        if not cleaned_address or len(cleaned_address) < 5:
            failed_addresses.append({
                'title': business.get('title', ''),
                'original': original_address,
                'cleaned': cleaned_address,
                'reason': 'Address too short or empty after cleaning'
            })
            continue
        
        # Try enhanced geocoding
        result = geocoder.geocode_with_multiple_strategies(cleaned_address)
        
        if result:
            lat, lon = result
            businesses[business_idx]['lat'] = round(lat, 7)
            businesses[business_idx]['lng'] = round(lon, 7)
            fixed_count += 1
            logger.debug(f"Enhanced fix: {business['title']} - {cleaned_address}")
        else:
            failed_addresses.append({
                'title': business.get('title', ''),
                'original': original_address,
                'cleaned': cleaned_address,
                'reason': 'All geocoding strategies failed'
            })
        
        # Save cache periodically
        if idx % 50 == 0:
            geocoder._save_cache()
    
    # Final cache save
    geocoder._save_cache()
    
    # Create backup
    timestamp = time.strftime('%Y%m%d_%H%M%S')
    backup_file = f'data/storymaps_test_full_backup_enhanced_{timestamp}.json'
    with open('data/storymaps_test_full.json', 'r', encoding='utf-8') as f:
        backup_data = json.load(f)
    with open(backup_file, 'w', encoding='utf-8') as f:
        json.dump(backup_data, f, indent=2, ensure_ascii=False)
    logger.info(f"Created backup: {backup_file}")
    
    # Save updated data
    with open('data/storymaps_test_full.json', 'w', encoding='utf-8') as f:
        json.dump(businesses, f, indent=2, ensure_ascii=False)
    
    # Save failed addresses
    if failed_addresses:
        with open('failed_geocoding_enhanced.json', 'w', encoding='utf-8') as f:
            json.dump(failed_addresses, f, indent=2, ensure_ascii=False)
        logger.info(f"Saved {len(failed_addresses)} failed addresses to failed_geocoding_enhanced.json")
    
    # Final statistics
    remaining_default = sum(1 for b in businesses if b.get('lat') == DEFAULT_LAT and b.get('lng') == DEFAULT_LNG)
    
    logger.info("\n=== Enhanced Geocoding Complete ===")
    logger.info(f"Businesses processed: {len(with_addresses)}")
    logger.info(f"Successfully geocoded: {fixed_count}")
    logger.info(f"Failed to geocode: {len(failed_addresses)}")
    logger.info(f"Remaining at default location: {remaining_default}")
    logger.info(f"Total improvement this pass: {fixed_count} businesses moved")

if __name__ == "__main__":
    main()