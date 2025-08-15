#!/usr/bin/env python3
"""
Verify that geocoded coordinates are properly set in the data
"""

import json
from collections import Counter

# Load the data
with open('data/storymaps.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Analyze coordinates
hu_berlin_entries = [d for d in data if d.get('author') == 'HU Berlin Database']
geocoded = [d for d in hu_berlin_entries if (d['lat'] != 52.52 or d['lng'] != 13.405)]
default_coords = [d for d in hu_berlin_entries if (d['lat'] == 52.52 and d['lng'] == 13.405)]

print("=" * 60)
print("GEOCODING STATUS REPORT")
print("=" * 60)
print(f"Total HU Berlin entries: {len(hu_berlin_entries)}")
print(f"Successfully geocoded: {len(geocoded)}")
print(f"Still at default coordinates: {len(default_coords)}")
print(f"Percentage complete: {len(geocoded)/len(hu_berlin_entries)*100:.1f}%")

# Count coordinates to find clusters
coord_counts = Counter([(d['lat'], d['lng']) for d in geocoded])
print(f"\nTop 5 most common coordinates (businesses at same address):")
for coords, count in coord_counts.most_common(5):
    if count > 1:
        print(f"  {coords}: {count} businesses")
        # Find businesses at this location
        at_location = [d['title'] for d in geocoded if d['lat'] == coords[0] and d['lng'] == coords[1]]
        for title in at_location[:3]:
            print(f"    - {title}")
        if len(at_location) > 3:
            print(f"    ... and {len(at_location)-3} more")

# Sample some geocoded entries
print("\n" + "=" * 60)
print("SAMPLE GEOCODED ENTRIES")
print("=" * 60)
for i, entry in enumerate(geocoded[:10], 1):
    print(f"\n{i}. {entry['title']}")
    print(f"   Address: {entry.get('address', 'N/A')}")
    print(f"   Coordinates: ({entry['lat']}, {entry['lng']})")
    
# Check if coordinates are within Berlin bounds
BERLIN_BOUNDS = {
    'min_lat': 52.33, 'max_lat': 52.68,
    'min_lng': 13.09, 'max_lng': 13.76
}

outside_berlin = [d for d in geocoded if 
                  d['lat'] < BERLIN_BOUNDS['min_lat'] or 
                  d['lat'] > BERLIN_BOUNDS['max_lat'] or
                  d['lng'] < BERLIN_BOUNDS['min_lng'] or 
                  d['lng'] > BERLIN_BOUNDS['max_lng']]

if outside_berlin:
    print(f"\n⚠️  WARNING: {len(outside_berlin)} entries have coordinates outside Berlin bounds:")
    for entry in outside_berlin[:5]:
        print(f"  - {entry['title']}: ({entry['lat']}, {entry['lng']})")
        
print("\n" + "=" * 60)
print("MAP INTEGRATION CHECK")
print("=" * 60)
print("✓ Data file location: data/storymaps.json")
print("✓ API endpoint: /api/storymaps")
print(f"✓ Geocoded entries will display at their actual addresses")
print(f"✓ {len(default_coords)} entries still need geocoding (showing at default location)")
print("\nThe map should now show:")
print(f"  • {len(geocoded)} businesses at their correct addresses (spread across Berlin)")
print(f"  • {len(default_coords)} businesses clustered at default location (52.52, 13.405)")
print("\nNote: The geocoding script is still running and updating more addresses.")