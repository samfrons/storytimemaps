#!/usr/bin/env python3
import json
from datetime import datetime

def convert_business_to_story(business, story_id):
    """Convert a business from batch data to story format"""
    
    # Extract coordinates from address or use Berlin center as fallback
    lat = 52.5200  # Berlin center lat
    lng = 13.4050  # Berlin center lng
    
    # Parse dates
    start_date = "1900-01-01"  # Default start
    end_date = "1945-12-31"    # Default end
    mid_date = "1930-01-01"    # Default mid
    
    if business.get('founded_year'):
        try:
            year = str(business['founded_year'])[:4] if str(business['founded_year']) else "1900"
            start_date = f"{year}-01-01"
            mid_date = f"{int(year) + 10}-01-01"
        except:
            pass
    
    if business.get('closed_year'):
        try:
            year = str(business['closed_year'])[:4] if str(business['closed_year']) else "1945"
            end_date = f"{year}-12-31"
        except:
            pass
    
    # Create description based on business info
    description = f"A {business.get('main_category', 'business').lower()} establishment"
    if business.get('detailed_subcategory'):
        description += f" specializing in {business['detailed_subcategory'].lower()}"
    
    address_str = business.get('address', 'Berlin, Germany')
    if 'Berlin' not in address_str:
        address_str += ', Berlin, Germany'
    
    description += f". Located at {address_str}"
    
    if business.get('founded_year') and business.get('closed_year'):
        description += f". Operated from {business['founded_year']} to {business['closed_year']}."
    elif business.get('founded_year'):
        description += f". Founded in {business['founded_year']}."
    elif business.get('closed_year'):
        description += f". Closed in {business['closed_year']}."
    
    return {
        "id": str(story_id),
        "title": business.get('business_name', 'Unknown Business'),
        "author": "HU Berlin Database",
        "description": description,
        "address": address_str,
        "lat": lat,
        "lng": lng,
        "startDate": start_date,
        "midDate": mid_date,
        "endDate": end_date,
        "category": "business",
        "main_category": business.get('main_category', 'trade'),
        "business_type": business.get('detailed_subcategory', ''),
        "imageUrls": []
    }

def main():
    print("Adding 500 more businesses for 1,000 total test...")
    
    # Load current storymaps.json (should have 500 stories)
    with open('data/storymaps.json', 'r') as f:
        current_stories = json.load(f)
    
    # Load batch 2 data (1,000 businesses)
    with open('jewish_businesses_batch_2.json', 'r') as f:
        batch2_data = json.load(f)
    
    print(f"Current stories: {len(current_stories)}")
    print(f"Batch 2 businesses available: {len(batch2_data['businesses'])}")
    
    # Take exactly 500 businesses from batch 2 to reach 1,000 total
    businesses_to_add = batch2_data['businesses'][:500]
    print(f"Adding first {len(businesses_to_add)} businesses from batch 2")
    
    # Find next available ID
    next_id = max(int(story['id']) for story in current_stories) + 1
    
    # Convert businesses to stories
    new_stories = []
    for business in businesses_to_add:
        new_story = convert_business_to_story(business, next_id)
        new_stories.append(new_story)
        next_id += 1
    
    # Combine all stories
    all_stories = current_stories + new_stories
    
    print(f"Final total: {len(all_stories)} stories")
    print(f"  - Previous total: {len(current_stories)}")
    print(f"  - Added from batch 2: {len(new_stories)}")
    
    # Backup current file
    backup_name = f"data/storymaps_backup_1000test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(backup_name, 'w') as f:
        json.dump(current_stories, f, indent=2)
    print(f"Backed up current data to {backup_name}")
    
    # Save updated storymaps.json
    with open('data/storymaps.json', 'w') as f:
        json.dump(all_stories, f, indent=2)
    
    print("✓ Updated storymaps.json with 1,000 total stories")
    
    # Update GeoJSON to match
    print("Updating GeoJSON...")
    
    geojson_features = []
    for story in all_stories:
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [story['lng'], story['lat']]
            },
            "properties": {
                "name": story['title'],
                "alternative_names": [story['title']],
                "business_type": story.get('business_type', story.get('category', '')),
                "category": story.get('main_category', story.get('category', '')).title(),
                "address": story['address'],
                "date_range": f"{(story.get('startDate') or '1900')[:4]}-{(story.get('endDate') or '1945')[:4]}",
                "registration_date": (story.get('startDate') or '1900')[:4],
                "takeover_date": "",
                "liquidation_date": "",
                "dissolution_date": (story.get('endDate') or '1945')[:4] if (story.get('endDate') or '1945') != "1945-12-31" else "",
                "geocode_confidence": 0.5
            }
        }
        geojson_features.append(feature)
    
    geojson_data = {
        "type": "FeatureCollection",
        "features": geojson_features
    }
    
    with open('public/jewish_businesses.geojson', 'w') as f:
        json.dump(geojson_data, f, indent=2)
    
    print(f"✓ Updated GeoJSON with {len(geojson_features)} features")
    
    # Summary
    print(f"\nSummary:")
    print(f"  Total locations: {len(all_stories)}")
    print(f"  Ready to test 1,000-story performance")
    
    # Category breakdown for new businesses
    categories = {}
    for story in new_stories:
        cat = story.get('main_category', 'unknown')
        categories[cat] = categories.get(cat, 0) + 1
    
    print(f"\nNew business categories added from batch 2:")
    for cat, count in sorted(categories.items()):
        print(f"    {cat}: {count}")

if __name__ == "__main__":
    main()