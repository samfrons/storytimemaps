#!/usr/bin/env python3
"""
Fix duplicate coordinates by adding small offsets to businesses at the same location
This ensures all 10,021 businesses appear as separate markers on the map
"""

import json
import math
from collections import defaultdict

def add_coordinate_offsets():
    """Add small offsets to duplicate coordinates"""
    print("=== Fixing Duplicate Coordinates ===")
    
    # Load current data
    with open('data/storymaps_test_full.json', 'r', encoding='utf-8') as f:
        businesses = json.load(f)
    
    print(f"Processing {len(businesses):,} businesses...")
    
    # Group businesses by coordinate
    coord_groups = defaultdict(list)
    for i, business in enumerate(businesses):
        lat = business.get('lat', 52.52)
        lng = business.get('lng', 13.405)
        key = f"{lat},{lng}"
        coord_groups[key].append(i)
    
    # Count duplicates (excluding default coordinates)
    default_key = "52.52,13.405"
    duplicate_groups = {k: v for k, v in coord_groups.items() 
                       if len(v) > 1 and k != default_key}
    
    print(f"Found {len(duplicate_groups):,} locations with multiple businesses")
    total_duplicates = sum(len(v) - 1 for v in duplicate_groups.values())
    print(f"Total duplicate businesses to offset: {total_duplicates:,}")
    
    # Apply offsets to duplicates
    offset_count = 0
    for coord_key, indices in duplicate_groups.items():
        if len(indices) <= 1:
            continue
            
        # Parse original coordinates
        lat_str, lng_str = coord_key.split(',')
        base_lat = float(lat_str)
        base_lng = float(lng_str)
        
        # Calculate offsets in a circle pattern
        num_businesses = len(indices)
        
        # Keep first business at original location
        for i, idx in enumerate(indices[1:], 1):  # Skip first one
            # Create a circle pattern with small radius
            # ~10 meters offset at Berlin's latitude
            radius = 0.0001 * (1 + (i // 8) * 0.5)  # Increase radius for outer rings
            angle = (2 * math.pi * i) / min(8, num_businesses - 1)  # Max 8 per ring
            
            # Calculate offset
            lat_offset = radius * math.cos(angle)
            lng_offset = radius * math.sin(angle) * 1.5  # Adjust for latitude
            
            # Apply offset
            businesses[idx]['lat'] = base_lat + lat_offset
            businesses[idx]['lng'] = base_lng + lng_offset
            businesses[idx]['coordinate_offset'] = True  # Mark as offset
            offset_count += 1
    
    print(f"\nApplied offsets to {offset_count:,} businesses")
    
    # Save updated data
    with open('data/storymaps_test_full.json', 'w', encoding='utf-8') as f:
        json.dump(businesses, f, indent=2, ensure_ascii=False)
    
    # Verify unique coordinates
    final_coords = set()
    for business in businesses:
        lat = business.get('lat', 52.52)
        lng = business.get('lng', 13.405)
        # Use higher precision for uniqueness check
        key = f"{lat:.8f},{lng:.8f}"
        final_coords.add(key)
    
    # Subtract 1 for the default coordinate group
    unique_non_default = len(final_coords) - 1 if "52.52000000,13.40500000" in final_coords else len(final_coords)
    
    print(f"\n=== Final Statistics ===")
    print(f"Total businesses: {len(businesses):,}")
    print(f"Unique coordinate locations: {len(final_coords):,}")
    print(f"Unique non-default locations: {unique_non_default:,}")
    print(f"Businesses with offsets applied: {offset_count:,}")
    
    # Check specific examples
    print(f"\nExample offsets applied:")
    example_count = 0
    for i, business in enumerate(businesses):
        if business.get('coordinate_offset'):
            print(f"  {business.get('title', 'Unknown')[:50]}")
            print(f"    Lat: {business['lat']:.8f}, Lng: {business['lng']:.8f}")
            example_count += 1
            if example_count >= 5:
                break

if __name__ == "__main__":
    add_coordinate_offsets()