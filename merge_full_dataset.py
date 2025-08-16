#!/usr/bin/env python3
"""
Merge all batch files into a complete test dataset for the test page
"""

import json
import os
from datetime import datetime

def load_batch_data():
    """Load all batch files and merge them"""
    all_businesses = []
    batch_files = [
        'jewish_businesses_batch_1.json',
        'jewish_businesses_batch_2.json', 
        'jewish_businesses_batch_3.json',
        'jewish_businesses_batch_4.json'
    ]
    
    for batch_file in batch_files:
        if os.path.exists(batch_file):
            print(f"Loading {batch_file}...")
            with open(batch_file, 'r', encoding='utf-8') as f:
                batch_data = json.load(f)
                if 'businesses' in batch_data:
                    businesses = batch_data['businesses']
                    print(f"  Found {len(businesses)} businesses")
                    all_businesses.extend(businesses)
                else:
                    print(f"  Warning: No 'businesses' key found in {batch_file}")
        else:
            print(f"  Warning: {batch_file} not found")
    
    return all_businesses

def convert_to_storymaps_format(businesses):
    """Convert business data to storymaps format"""
    storymaps_data = []
    
    for i, business in enumerate(businesses):
        # Generate unique ID
        story_id = f"business_{i+1:05d}"
        
        # Extract dates
        start_date = business.get('founded_year', '1900')
        if start_date and start_date != 'unknown':
            start_date = f"{start_date}-01-01"
        else:
            start_date = "1900-01-01"
            
        end_date = business.get('closed_year', '1945')
        if end_date and end_date != 'unknown':
            end_date = f"{end_date}-12-31"
        else:
            end_date = "1945-12-31"
        
        # Default coordinates (will be geocoded later)
        lat = 52.52  # Default Berlin coordinates
        lng = 13.405
        
        # Create storymaps entry
        business_name = business.get('business_name') or business.get('name', 'Unknown Business')
        
        story_entry = {
            "id": story_id,
            "title": business_name,
            "author": "HU Berlin Database",
            "description": f"A {business.get('main_category', 'business')} establishment. Located at {business.get('address', 'Unknown address')}, Berlin",
            "address": business.get('address', 'Unknown address'),
            "lat": lat,
            "lng": lng,
            "startDate": start_date,
            "endDate": end_date,
            "category": business.get('main_category', 'uncategorized'),
            "state": "active"  # Will be determined by timeline logic
        }
        
        storymaps_data.append(story_entry)
    
    return storymaps_data

def remove_duplicates(businesses):
    """Remove duplicate businesses based on name and address"""
    seen = set()
    unique_businesses = []
    
    for business in businesses:
        # Create a key based on business_name and address
        business_name = business.get('business_name') or business.get('name', '')
        key = (
            business_name.strip().lower(),
            business.get('address', '').strip().lower()
        )
        
        if key not in seen and key != ('', ''):
            seen.add(key)
            unique_businesses.append(business)
    
    duplicates_removed = len(businesses) - len(unique_businesses)
    if duplicates_removed > 0:
        print(f"Removed {duplicates_removed} duplicate businesses")
    
    return unique_businesses

def main():
    print("=== Merging Full Dataset for Test Environment ===")
    
    # Load all batch data
    print("\n1. Loading batch files...")
    all_businesses = load_batch_data()
    print(f"Total businesses loaded: {len(all_businesses)}")
    
    # Remove duplicates
    print("\n2. Removing duplicates...")
    unique_businesses = remove_duplicates(all_businesses)
    print(f"Unique businesses: {len(unique_businesses)}")
    
    # Convert to storymaps format
    print("\n3. Converting to storymaps format...")
    storymaps_data = convert_to_storymaps_format(unique_businesses)
    print(f"Converted {len(storymaps_data)} businesses")
    
    # Save raw data (before geocoding)
    raw_filename = 'data/storymaps_test_full_raw.json'
    os.makedirs('data', exist_ok=True)
    
    with open(raw_filename, 'w', encoding='utf-8') as f:
        json.dump(storymaps_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n4. Saved raw dataset to: {raw_filename}")
    print(f"   Total businesses: {len(storymaps_data)}")
    print("   Status: Ready for geocoding")
    
    # Create initial test file (copy of raw for now)
    test_filename = 'data/storymaps_test_full.json'
    with open(test_filename, 'w', encoding='utf-8') as f:
        json.dump(storymaps_data, f, indent=2, ensure_ascii=False)
    
    print(f"   Created initial test file: {test_filename}")
    print("   Note: This file will be updated after geocoding")
    
    # Print statistics
    print("\n=== Dataset Statistics ===")
    categories = {}
    for business in storymaps_data:
        cat = business.get('category', 'uncategorized')
        categories[cat] = categories.get(cat, 0) + 1
    
    print("Categories:")
    for cat, count in sorted(categories.items()):
        print(f"  {cat}: {count}")
    
    print(f"\nDataset ready for geocoding!")
    print(f"Next step: Run geocoding script to process {len(storymaps_data)} businesses")

if __name__ == "__main__":
    main()