#!/usr/bin/env python3
import json
from datetime import datetime

def convert_business_to_story(business, story_id):
    """Convert a business from enhanced dataset to story format"""
    
    # Extract coordinates from address or use Berlin center as fallback
    lat = 52.5200  # Berlin center lat
    lng = 13.4050  # Berlin center lng
    
    # Parse dates
    start_date = "1900-01-01"  # Default start
    end_date = "1945-12-31"    # Default end
    mid_date = "1930-01-01"    # Default mid
    
    if business.get('founding_date'):
        try:
            year = business['founding_date'][:4] if len(business['founding_date']) >= 4 else "1900"
            start_date = f"{year}-01-01"
            mid_date = f"{int(year) + 10}-01-01"
        except:
            pass
    
    if business.get('closing_date'):
        try:
            year = business['closing_date'][:4] if len(business['closing_date']) >= 4 else "1945"
            end_date = f"{year}-12-31"
        except:
            pass
    
    # Create description based on business info
    description = f"A {business.get('main_category', 'business').lower()} establishment"
    if business.get('business_type'):
        description += f" specializing in {business['business_type'].lower()}"
    
    address_str = business.get('address', 'Berlin, Germany')
    if 'Berlin' not in address_str:
        address_str += ', Berlin, Germany'
    
    description += f". Located at {address_str}"
    
    if business.get('founding_date') and business.get('closing_date'):
        description += f". Operated from {business['founding_date']} to {business['closing_date']}."
    elif business.get('founding_date'):
        description += f". Founded in {business['founding_date']}."
    elif business.get('closing_date'):
        description += f". Closed in {business['closing_date']}."
    
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
        "business_type": business.get('business_type', ''),
        "imageUrls": []
    }

def main():
    print("Loading datasets...")
    
    # Load current storymaps.json
    with open('data/storymaps.json', 'r') as f:
        current_stories = json.load(f)
    
    # Load enhanced business data
    with open('jewish_businesses_complete_enhanced.json', 'r') as f:
        enhanced_data = json.load(f)
    
    print(f"Current stories: {len(current_stories)}")
    print(f"Enhanced businesses: {len(enhanced_data['businesses'])}")
    
    # Find which businesses are already in storymaps.json
    existing_business_names = set()
    original_stories = []
    scraped_stories = []
    
    for story in current_stories:
        is_business_match = False
        for business in enhanced_data['businesses']:
            if business['business_name'] in story['title']:
                existing_business_names.add(business['business_name'])
                is_business_match = True
                break
        
        if is_business_match:
            scraped_stories.append(story)
        else:
            original_stories.append(story)
    
    print(f"Original enriched stories: {len(original_stories)}")
    print(f"Already converted businesses: {len(scraped_stories)}")
    print(f"Existing business names: {len(existing_business_names)}")
    
    # Find missing businesses
    missing_businesses = []
    for business in enhanced_data['businesses']:
        if business['business_name'] not in existing_business_names:
            missing_businesses.append(business)
    
    print(f"Missing businesses to add: {len(missing_businesses)}")
    
    # Add main_category to existing scraped stories
    for story in scraped_stories:
        # Find matching business to get main_category
        for business in enhanced_data['businesses']:
            if business['business_name'] in story['title']:
                story['main_category'] = business.get('main_category', 'trade')
                story['business_type'] = business.get('business_type', story.get('business_type', ''))
                break
    
    # Convert missing businesses to stories
    next_id = max(int(story['id']) for story in current_stories) + 1
    
    for business in missing_businesses:
        new_story = convert_business_to_story(business, next_id)
        scraped_stories.append(new_story)
        next_id += 1
    
    # Combine all stories
    all_stories = original_stories + scraped_stories
    
    print(f"Final total: {len(all_stories)} stories")
    print(f"  - Original enriched: {len(original_stories)}")
    print(f"  - Scraped businesses: {len(scraped_stories)}")
    
    # Backup current file
    backup_name = f"data/storymaps_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(backup_name, 'w') as f:
        json.dump(current_stories, f, indent=2)
    print(f"Backed up current data to {backup_name}")
    
    # Save updated storymaps.json
    with open('data/storymaps.json', 'w') as f:
        json.dump(all_stories, f, indent=2)
    
    print("✓ Updated storymaps.json")
    
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
    print(f"  Original enriched stories: {len(original_stories)}")
    print(f"  Scraped businesses: {len(scraped_stories)}")
    
    # Category breakdown for scraped businesses
    categories = {}
    for story in scraped_stories:
        cat = story.get('main_category', 'unknown')
        categories[cat] = categories.get(cat, 0) + 1
    
    print(f"\nScraped business categories:")
    for cat, count in sorted(categories.items()):
        print(f"    {cat}: {count}")

if __name__ == "__main__":
    main()