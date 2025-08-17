#!/usr/bin/env python3
"""
Test geocoding on a small sample to verify the process works
"""

import json
import sys
from geocoding_optimizer import GeocodingOptimizer

def test_sample():
    # Load cleaned addresses
    with open('businesses_cleaned_addresses.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Take a sample of 20 businesses
    sample = data[:20]
    
    print("Testing geocoding on 20 sample addresses...")
    print("="*60)
    
    # Initialize geocoder
    geocoder = GeocodingOptimizer()
    
    # Geocode the sample
    results = geocoder.geocode_batch(sample)
    
    # Analyze results
    successful = [b for b in results if b.get('geocoding_status') == 'success']
    failed = [b for b in results if b.get('geocoding_status') == 'failed']
    
    print("\nSample Results:")
    print(f"Successfully geocoded: {len(successful)}/20 ({len(successful)/20*100:.1f}%)")
    
    print("\nSuccessful geocoding examples:")
    for business in successful[:5]:
        print(f"  • {business['title']}")
        print(f"    Address: {business['cleaned_address']}")
        print(f"    Coordinates: ({business['latitude']:.6f}, {business['longitude']:.6f})")
        print(f"    Confidence: {business['geocoding_confidence']:.2f}")
    
    if failed:
        print(f"\nFailed geocoding examples:")
        for business in failed[:5]:
            print(f"  • {business['title']}")
            print(f"    Address: {business['cleaned_address']}")
    
    # Save sample results
    with open('sample_geocoded.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print("\n✓ Sample results saved to sample_geocoded.json")
    
    # Print statistics
    geocoder.print_statistics()
    
    # Estimate time for full dataset
    if successful:
        success_rate = len(successful) / 20
        estimated_successful = int(2079 * success_rate)
        estimated_time = 2079 * 1.1 / 60  # 1.1 seconds per address average
        print(f"\nEstimated for full dataset (2079 addresses):")
        print(f"  • Expected successful geocodings: ~{estimated_successful}")
        print(f"  • Estimated time: ~{estimated_time:.0f} minutes")

if __name__ == "__main__":
    test_sample()