#!/usr/bin/env python3
"""
Geocoding Optimizer - Cost-effective geocoding with free services first
Uses OSM Nominatim (free) as primary, with caching and batch optimization
"""

import json
import time
import hashlib
import os
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from collections import defaultdict
import logging
import requests
from urllib.parse import quote

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class GeocodingResult:
    """Geocoding result with metadata"""
    latitude: float
    longitude: float
    confidence: float
    source: str
    formatted_address: str
    cache_hit: bool = False

class GeocodingOptimizer:
    def __init__(self, cache_file: str = "geocoding_cache.json"):
        self.cache_file = cache_file
        self.cache = self._load_cache()
        self.stats = defaultdict(int)
        
        # Free service configuration
        self.nominatim_base = "https://nominatim.openstreetmap.org/search"
        self.headers = {
            'User-Agent': 'Jewish Business History Project/1.0'
        }
        
        # Rate limiting for free services
        self.last_request_time = 0
        self.min_delay = 1.0  # 1 second between requests for OSM Nominatim
        
        # Batch similar addresses
        self.address_patterns = defaultdict(list)
        
    def _load_cache(self) -> Dict:
        """Load geocoding cache from file"""
        if os.path.exists(self.cache_file):
            try:
                with open(self.cache_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                return {}
        return {}
    
    def _save_cache(self):
        """Save geocoding cache to file"""
        with open(self.cache_file, 'w', encoding='utf-8') as f:
            json.dump(self.cache, f, indent=2, ensure_ascii=False)
    
    def _get_cache_key(self, address: str) -> str:
        """Generate cache key for address"""
        normalized = address.lower().strip()
        return hashlib.md5(normalized.encode()).hexdigest()
    
    def _rate_limit(self):
        """Enforce rate limiting for free services"""
        elapsed = time.time() - self.last_request_time
        if elapsed < self.min_delay:
            time.sleep(self.min_delay - elapsed)
        self.last_request_time = time.time()
    
    def geocode_with_nominatim(self, address: str) -> Optional[GeocodingResult]:
        """Geocode using free OSM Nominatim service"""
        # Check cache first
        cache_key = self._get_cache_key(address)
        if cache_key in self.cache:
            self.stats['cache_hits'] += 1
            cached = self.cache[cache_key]
            return GeocodingResult(
                latitude=cached['lat'],
                longitude=cached['lon'],
                confidence=cached.get('confidence', 0.8),
                source='nominatim_cached',
                formatted_address=cached.get('display_name', address),
                cache_hit=True
            )
        
        # Rate limiting
        self._rate_limit()
        
        # Prepare request
        params = {
            'q': address,
            'format': 'json',
            'limit': 1,
            'countrycodes': 'de',  # Restrict to Germany
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
                    
                    # Calculate confidence based on result type
                    confidence = self._calculate_confidence(result)
                    
                    # Cache the result
                    self.cache[cache_key] = {
                        'lat': float(result['lat']),
                        'lon': float(result['lon']),
                        'display_name': result.get('display_name', ''),
                        'confidence': confidence,
                        'source': 'nominatim'
                    }
                    
                    self.stats['nominatim_success'] += 1
                    
                    return GeocodingResult(
                        latitude=float(result['lat']),
                        longitude=float(result['lon']),
                        confidence=confidence,
                        source='nominatim',
                        formatted_address=result.get('display_name', ''),
                        cache_hit=False
                    )
            
            self.stats['nominatim_failed'] += 1
            return None
            
        except Exception as e:
            logger.warning(f"Nominatim geocoding failed for '{address}': {e}")
            self.stats['nominatim_errors'] += 1
            return None
    
    def _calculate_confidence(self, nominatim_result: Dict) -> float:
        """Calculate confidence score based on result quality"""
        confidence = 0.5  # Base confidence
        
        # Boost confidence based on result type
        place_type = nominatim_result.get('type', '')
        if place_type in ['house', 'building']:
            confidence += 0.4
        elif place_type in ['street', 'road']:
            confidence += 0.3
        elif place_type in ['suburb', 'neighbourhood']:
            confidence += 0.2
        elif place_type in ['city', 'town']:
            confidence += 0.1
            
        # Check if house number was matched
        if 'house_number' in nominatim_result.get('address', {}):
            confidence += 0.1
            
        return min(confidence, 1.0)
    
    def geocode_batch(self, addresses: List[Dict]) -> List[Dict]:
        """
        Geocode a batch of addresses efficiently
        Input: List of business dictionaries with 'address' field
        Output: List of businesses with added geocoding results
        """
        results = []
        total = len(addresses)
        
        logger.info(f"Starting batch geocoding for {total} addresses...")
        
        for i, business in enumerate(addresses, 1):
            address = business.get('cleaned_address') or business.get('address', '')
            
            if not address or address.strip() == "":
                business['geocoding_result'] = None
                business['geocoding_status'] = 'empty_address'
                results.append(business)
                continue
            
            # Try geocoding
            result = self.geocode_with_nominatim(address)
            
            if result:
                business['latitude'] = result.latitude
                business['longitude'] = result.longitude
                business['geocoding_confidence'] = result.confidence
                business['geocoding_source'] = result.source
                business['formatted_address'] = result.formatted_address
                business['geocoding_status'] = 'success'
            else:
                business['geocoding_status'] = 'failed'
                business['latitude'] = None
                business['longitude'] = None
            
            results.append(business)
            
            # Progress update
            if i % 10 == 0:
                success_rate = (self.stats['nominatim_success'] + self.stats['cache_hits']) / i * 100
                logger.info(f"Progress: {i}/{total} ({i/total*100:.1f}%) - Success rate: {success_rate:.1f}%")
                # Save cache periodically
                self._save_cache()
        
        # Final cache save
        self._save_cache()
        
        return results
    
    def print_statistics(self):
        """Print geocoding statistics"""
        print("\n" + "="*60)
        print("GEOCODING STATISTICS")
        print("="*60)
        
        total_attempts = sum(self.stats.values())
        
        for stat, count in sorted(self.stats.items(), key=lambda x: x[1], reverse=True):
            percentage = (count / total_attempts * 100) if total_attempts > 0 else 0
            print(f"  {stat:25s}: {count:5d} ({percentage:5.1f}%)")
        
        # Calculate success rate
        successes = self.stats['nominatim_success'] + self.stats['cache_hits']
        if total_attempts > 0:
            success_rate = (successes / total_attempts) * 100
            print(f"\nOverall success rate: {success_rate:.1f}%")
            
        # Calculate cost savings
        cache_hits = self.stats['cache_hits']
        if cache_hits > 0:
            print(f"API calls saved by cache: {cache_hits}")
            print(f"Estimated cost savings: ${cache_hits * 0.001:.2f} (if using paid service)")
            
        print("="*60)

def process_cleaned_addresses(input_file: str, output_file: str):
    """Process cleaned addresses file with geocoding"""
    
    # Load cleaned addresses
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Filter businesses that need geocoding
    needs_geocoding = []
    already_geocoded = []
    
    for business in data:
        # Check if already has valid coordinates
        lat = business.get('latitude')
        lon = business.get('longitude')
        
        if lat and lon and lat != 0 and lon != 0:
            already_geocoded.append(business)
        else:
            needs_geocoding.append(business)
    
    logger.info(f"Already geocoded: {len(already_geocoded)}")
    logger.info(f"Needs geocoding: {len(needs_geocoding)}")
    
    # Initialize geocoder
    geocoder = GeocodingOptimizer()
    
    # Geocode businesses
    geocoded = geocoder.geocode_batch(needs_geocoding)
    
    # Combine results
    all_businesses = already_geocoded + geocoded
    
    # Separate by success status
    successful = [b for b in geocoded if b.get('geocoding_status') == 'success']
    failed = [b for b in geocoded if b.get('geocoding_status') == 'failed']
    
    # Save results
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_businesses, f, indent=2, ensure_ascii=False)
    
    # Save failed geocoding for review
    if failed:
        failed_file = output_file.replace('.json', '_geocoding_failed.json')
        with open(failed_file, 'w', encoding='utf-8') as f:
            json.dump(failed, f, indent=2, ensure_ascii=False)
        logger.info(f"Saved {len(failed)} failed geocodings to {failed_file}")
    
    # Print statistics
    geocoder.print_statistics()
    
    print(f"\n✓ Successfully geocoded: {len(successful)}/{len(needs_geocoding)}")
    print(f"✓ Output saved to: {output_file}")
    
    return all_businesses

def main():
    """Main execution"""
    input_file = "businesses_cleaned_addresses.json"
    output_file = "businesses_geocoded.json"
    
    # Check if cleaned file exists
    if not os.path.exists(input_file):
        logger.error(f"Cleaned addresses file not found: {input_file}")
        logger.info("Please run advanced_address_cleaner.py first")
        return
    
    try:
        process_cleaned_addresses(input_file, output_file)
    except Exception as e:
        logger.error(f"Error during geocoding: {e}")
        raise

if __name__ == "__main__":
    main()