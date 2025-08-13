#!/usr/bin/env python3
"""
Convert Jewish businesses GeoJSON to StoryMap format and append to storymaps.json
"""

import json
from datetime import datetime

def convert_geojson_to_storymap():
    """Convert Jewish businesses from GeoJSON to StoryMap format"""
    
    # Load the GeoJSON data
    with open('public/jewish_businesses.geojson', 'r', encoding='utf-8') as f:
        geojson_data = json.load(f)
    
    # Load existing storymaps
    with open('data/storymaps.json', 'r', encoding='utf-8') as f:
        existing_stories = json.load(f)
    
    print(f"Found {len(existing_stories)} existing enriched stories")
    print(f"Found {len(geojson_data['features'])} businesses to convert")
    
    # Get the highest existing ID to continue numbering
    existing_ids = [int(story['id']) for story in existing_stories if story['id'].isdigit()]
    next_id = max(existing_ids, default=0) + 1
    
    converted_businesses = []
    
    for feature in geojson_data['features']:
        props = feature['properties']
        coords = feature['geometry']['coordinates']  # [lng, lat]
        
        # Create the StoryMap entry
        story_entry = {
            "id": str(next_id),
            "title": props['name'],
            "author": "HU Berlin Database",
            "description": f"{props['business_type']} business" if props['business_type'] else "Jewish-owned business",
            "longDescription": None,  # Can be enriched later
            "address": props['address'],
            "lat": coords[1],  # latitude
            "lng": coords[0],  # longitude
            "category": "business",
            "businessType": props['business_type'],
            "startDate": f"{props['registration_date']}-01-01" if props['registration_date'] else None,
            "midDate": f"{props['takeover_date']}-01-01" if props['takeover_date'] else None,
            "endDate": f"{props['liquidation_date']}-01-01" if props['liquidation_date'] else None,
            "media": None,  # Can be enriched later
            "imageUrls": []  # Backward compatibility
        }
        
        converted_businesses.append(story_entry)
        next_id += 1
    
    # Combine existing stories with new businesses
    all_stories = existing_stories + converted_businesses
    
    # Create backup of original file
    backup_filename = f"data/storymaps_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(backup_filename, 'w', encoding='utf-8') as f:
        json.dump(existing_stories, f, indent=2, ensure_ascii=False)
    print(f"Created backup: {backup_filename}")
    
    # Write the combined data
    with open('data/storymaps.json', 'w', encoding='utf-8') as f:
        json.dump(all_stories, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Conversion complete!")
    print(f"   • Kept {len(existing_stories)} enriched stories")
    print(f"   • Added {len(converted_businesses)} business entries")
    print(f"   • Total: {len(all_stories)} entries")
    print(f"   • Backup saved: {backup_filename}")
    
    # Show some sample converted entries
    print(f"\n📝 Sample converted entries:")
    for i, entry in enumerate(converted_businesses[:3]):
        print(f"   {i+1}. {entry['title']} - {entry['businessType']}")
        if entry['startDate']:
            start_year = entry['startDate'][:4]
            end_year = entry['endDate'][:4] if entry['endDate'] else 'Present'
            print(f"      ({start_year} - {end_year})")

if __name__ == "__main__":
    convert_geojson_to_storymap()