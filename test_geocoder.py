#!/usr/bin/env python3
"""
Test script for the Berlin Historical Address Geocoder

This script tests the geocoder with a small subset of addresses to verify
functionality before running the full geocoding process.
"""

import json
import sys
from geocode_addresses import BerlinGeocoder

def create_test_data():
    """Create a small test dataset with sample addresses"""
    test_data = [
        {
            "id": "test1",
            "title": "Test Business 1",
            "author": "HU Berlin Database",
            "description": "Test entry 1",
            "address": "Wallstr. 9/10, Berlin",
            "lat": 52.52,
            "lng": 13.405,
            "category": "business"
        },
        {
            "id": "test2", 
            "title": "Test Business 2",
            "author": "HU Berlin Database",
            "description": "Test entry 2",
            "address": "Neue Friedrichstr. 44, Berlin",
            "lat": 52.52,
            "lng": 13.405,
            "category": "business"
        },
        {
            "id": "test3",
            "title": "Test Business 3", 
            "author": "HU Berlin Database",
            "description": "Test entry 3",
            "address": "Kantstr. 160, Berlin",
            "lat": 52.52,
            "lng": 13.405,
            "category": "business"
        },
        {
            "id": "test4",
            "title": "Already Geocoded",
            "author": "HU Berlin Database",
            "description": "This should be skipped",
            "address": "Some Address, Berlin",
            "lat": 52.5112193,
            "lng": 13.4058639,
            "category": "business"
        }
    ]
    
    # Save test data
    with open('test_storymaps.json', 'w', encoding='utf-8') as f:
        json.dump(test_data, f, indent=2, ensure_ascii=False)
    
    return 'test_storymaps.json'

def run_test():
    """Run the geocoder test"""
    print("Creating test dataset...")
    test_file = create_test_data()
    
    print("Initializing geocoder...")
    geocoder = BerlinGeocoder(test_file)
    
    print("Running geocoding test...")
    try:
        geocoder.geocode_all_addresses()
        
        # Load and display results
        with open(test_file, 'r', encoding='utf-8') as f:
            results = json.load(f)
            
        print("\nTest Results:")
        print("-" * 50)
        for entry in results:
            status = "GEOCODED" if entry['lat'] != 52.52 or entry['lng'] != 13.405 else "UNCHANGED"
            print(f"{entry['title']}: {entry['address']}")
            print(f"  Coordinates: ({entry['lat']}, {entry['lng']}) - {status}")
            print()
            
    except Exception as e:
        print(f"Test failed: {e}")
        return False
    finally:
        geocoder.conn.close()
        
    print("Test completed successfully!")
    return True

if __name__ == "__main__":
    success = run_test()
    sys.exit(0 if success else 1)