#!/usr/bin/env python3
"""
Fix geocoding to only accept locations within 100km of Berlin center
"""

import json
import math

# Berlin center coordinates
BERLIN_CENTER_LAT = 52.5200
BERLIN_CENTER_LNG = 13.4050

# Default coordinates (for ungeocodeable addresses)
DEFAULT_LAT = 52.52
DEFAULT_LNG = 13.405

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points in kilometers using Haversine formula"""
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

def fix_out_of_range_geocoding():
    """Reset coordinates for businesses too far from Berlin"""
    print("=== Fixing Out-of-Range Geocoding ===")
    print("Resetting businesses more than 100km from Berlin center...")
    
    # Load current data
    with open('data/storymaps_test_full.json', 'r', encoding='utf-8') as f:
        businesses = json.load(f)
    
    print(f"Checking {len(businesses):,} businesses...")
    
    # Track fixes
    out_of_range = []
    within_range = 0
    already_default = 0
    
    for business in businesses:
        lat = business.get('lat', DEFAULT_LAT)
        lng = business.get('lng', DEFAULT_LNG)
        
        # Skip if already default
        if lat == DEFAULT_LAT and lng == DEFAULT_LNG:
            already_default += 1
            continue
        
        # Calculate distance from Berlin center
        distance = calculate_distance(BERLIN_CENTER_LAT, BERLIN_CENTER_LNG, lat, lng)
        
        if distance > 100:  # More than 100km from Berlin
            out_of_range.append({
                'name': business.get('title', 'Unknown'),
                'address': business.get('address', ''),
                'distance': distance,
                'old_lat': lat,
                'old_lng': lng
            })
            
            # Reset to default coordinates
            business['lat'] = DEFAULT_LAT
            business['lng'] = DEFAULT_LNG
        else:
            within_range += 1
    
    print(f"\nResults:")
    print(f"  Within 100km of Berlin: {within_range:,}")
    print(f"  Out of range (reset): {len(out_of_range):,}")
    print(f"  Already default coords: {already_default:,}")
    
    if out_of_range:
        print(f"\nExamples of businesses reset (too far from Berlin):")
        for item in out_of_range[:10]:
            print(f"  {item['name'][:50]}")
            print(f"    Address: {item['address'][:60]}")
            print(f"    Distance: {item['distance']:.1f} km from Berlin")
            print(f"    Old coords: ({item['old_lat']:.4f}, {item['old_lng']:.4f})")
    
    # Save corrected data
    with open('data/storymaps_test_full.json', 'w', encoding='utf-8') as f:
        json.dump(businesses, f, indent=2, ensure_ascii=False)
    
    # Final statistics
    total_geocoded = sum(1 for b in businesses if b.get('lat') != DEFAULT_LAT or b.get('lng') != DEFAULT_LNG)
    total_default = len(businesses) - total_geocoded
    
    print(f"\n=== Final Statistics ===")
    print(f"Total businesses: {len(businesses):,}")
    print(f"Properly geocoded (within 100km): {total_geocoded:,} ({total_geocoded/len(businesses)*100:.1f}%)")
    print(f"Default coordinates: {total_default:,} ({total_default/len(businesses)*100:.1f}%)")
    
    # Check Robert Gohlke specifically
    for business in businesses:
        if 'Robert Gohlke' in business.get('title', ''):
            lat = business.get('lat')
            lng = business.get('lng')
            if lat and lng:
                distance = calculate_distance(BERLIN_CENTER_LAT, BERLIN_CENTER_LNG, lat, lng)
                print(f"\n🔍 Robert Gohlke status:")
                print(f"  Address: {business['address']}")
                print(f"  Coordinates: ({lat}, {lng})")
                print(f"  Distance from Berlin: {distance:.1f} km")
                if distance > 100:
                    print(f"  ⚠️ Outside 100km range - will be reset to default")
            break

if __name__ == "__main__":
    fix_out_of_range_geocoding()