#!/usr/bin/env python3
"""
Re-geocode businesses in the cleaned dataset that need better coordinates
"""

import json
import logging
import time
from typing import Dict, List, Optional
import requests
from collections import defaultdict

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DatasetGeocoder:
    def __init__(self):
        self.stats = defaultdict(int)
        self.cache = {}
        
        # Default coordinates for businesses without proper geocoding
        self.default_coords = {
            'lat': 52.5200,
            'lng': 13.4050
        }
        
        # OSM Nominatim setup
        self.nominatim_base = "https://nominatim.openstreetmap.org/search"
        self.headers = {
            'User-Agent': 'Jewish Business History Project/1.0'
        }
        self.last_request_time = 0
        self.min_delay = 1.0
        
    def needs_geocoding(self, business: Dict) -> bool:
        """Check if a business needs geocoding"""
        lat = business.get('lat')
        lng = business.get('lng')
        
        # Check if coordinates are missing or default
        if lat is None or lng is None:
            return True
            
        # Check if using default Berlin center coordinates
        if (abs(lat - self.default_coords['lat']) < 0.001 and 
            abs(lng - self.default_coords['lng']) < 0.001):
            return True
            
        # Check if coordinates are 0,0
        if lat == 0 and lng == 0:
            return True
            
        return False
    
    def _rate_limit(self):
        """Enforce rate limiting"""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.min_delay:
            time.sleep(self.min_delay - elapsed)
        self.last_request_time = time.time()
    
    def geocode_address(self, address: str) -> Optional[Dict]:
        """Geocode a single address using OSM Nominatim"""
        if not address or address.strip() == "":
            return None
            
        # Check cache
        if address in self.cache:
            self.stats['cache_hits'] += 1
            return self.cache[address]
        
        # Rate limiting
        self._rate_limit()
        
        # Clean address for better geocoding
        clean_address = address.strip()
        
        # Ensure we're searching in Berlin, Germany
        if 'Berlin' in clean_address and 'Germany' not in clean_address:
            clean_address = clean_address.replace('Berlin', 'Berlin, Germany')
        
        params = {
            'q': clean_address,
            'format': 'json',
            'limit': 1,
            'countrycodes': 'de',
            'addressdetails': 1
        }
        
        try:
            response = requests.get(
                self.nominatim_base,
                params=params,
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    result = data[0]
                    
                    coords = {
                        'lat': float(result['lat']),
                        'lng': float(result['lon']),
                        'display_name': result.get('display_name', ''),
                        'confidence': self._calculate_confidence(result)
                    }
                    
                    # Cache the result
                    self.cache[address] = coords
                    self.stats['geocoding_success'] += 1
                    
                    return coords
            
            self.stats['geocoding_failed'] += 1
            return None
            
        except Exception as e:
            logger.warning(f"Geocoding failed for '{address}': {e}")
            self.stats['geocoding_errors'] += 1
            return None
    
    def _calculate_confidence(self, nominatim_result: Dict) -> float:
        """Calculate confidence score"""
        confidence = 0.5
        
        place_type = nominatim_result.get('type', '')
        if place_type in ['house', 'building']:
            confidence += 0.4
        elif place_type in ['street', 'road']:
            confidence += 0.3
        elif place_type in ['suburb', 'neighbourhood']:
            confidence += 0.2
            
        if 'house_number' in nominatim_result.get('address', {}):
            confidence += 0.1
            
        return min(confidence, 1.0)
    
    def process_dataset(self, input_file: str, output_file: str, limit: Optional[int] = None):
        """Process and geocode the dataset"""
        logger.info(f"Loading dataset from {input_file}...")
        
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Identify businesses needing geocoding
        needs_geocoding = []
        for business in data:
            if self.needs_geocoding(business):
                needs_geocoding.append(business)
        
        logger.info(f"Found {len(needs_geocoding)} businesses needing geocoding")
        
        if limit:
            needs_geocoding = needs_geocoding[:limit]
            logger.info(f"Limited to {limit} businesses for testing")
        
        # Geocode businesses
        for i, business in enumerate(needs_geocoding, 1):
            address = business.get('address', '')
            
            if not address:
                self.stats['no_address'] += 1
                continue
            
            result = self.geocode_address(address)
            
            if result:
                business['lat'] = result['lat']
                business['lng'] = result['lng']
                business['geocode_confidence'] = result['confidence']
                business['geocode_method'] = 'nominatim_2024'
                self.stats['updated'] += 1
            else:
                self.stats['failed'] += 1
            
            # Progress update
            if i % 10 == 0:
                success_rate = (self.stats['geocoding_success'] / i) * 100 if i > 0 else 0
                logger.info(f"Progress: {i}/{len(needs_geocoding)} - Success rate: {success_rate:.1f}%")
        
        # Save updated dataset
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Saved updated dataset to {output_file}")
        
        # Print statistics
        self.print_statistics(len(needs_geocoding))
        
        return data
    
    def print_statistics(self, total_attempted: int):
        """Print geocoding statistics"""
        print("\n" + "="*60)
        print("GEOCODING STATISTICS")
        print("="*60)
        print(f"Total businesses attempted: {total_attempted}")
        print(f"\nResults:")
        print(f"  Successfully geocoded: {self.stats['geocoding_success']}")
        print(f"  Failed to geocode: {self.stats['geocoding_failed']}")
        print(f"  No address available: {self.stats['no_address']}")
        print(f"  Geocoding errors: {self.stats['geocoding_errors']}")
        print(f"  Cache hits: {self.stats['cache_hits']}")
        print(f"\nDatabase updates:")
        print(f"  Coordinates updated: {self.stats['updated']}")
        print(f"  Failed updates: {self.stats['failed']}")
        
        if total_attempted > 0:
            success_rate = (self.stats['geocoding_success'] / total_attempted) * 100
            print(f"\nSuccess rate: {success_rate:.1f}%")
        
        print("="*60)

def main():
    geocoder = DatasetGeocoder()
    
    input_file = "data/storymaps_test_full.json"
    output_file = "data/storymaps_test_full.json"
    
    # Run full geocoding - no limit
    limit = None
    
    try:
        logger.info(f"Starting geocoding process (limit: {limit})...")
        geocoder.process_dataset(input_file, output_file, limit=limit)
        print("\n✓ Geocoding complete")
        print("✓ Dataset updated with new coordinates")
    except Exception as e:
        logger.error(f"Error during geocoding: {e}")
        raise

if __name__ == "__main__":
    main()