#!/usr/bin/env python3
"""
Generate a list of businesses with default coordinates for verification
"""

import json
import csv
from datetime import datetime

def export_default_coordinate_businesses():
    """Export businesses with default coordinates to CSV and JSON"""
    print("=== Exporting Businesses with Default Coordinates ===")
    
    # Load current data
    with open('data/storymaps_test_full.json', 'r', encoding='utf-8') as f:
        businesses = json.load(f)
    
    # Default coordinates
    DEFAULT_LAT = 52.52
    DEFAULT_LNG = 13.405
    
    # Find businesses with default coordinates
    default_businesses = []
    for business in businesses:
        lat = business.get('lat', DEFAULT_LAT)
        lng = business.get('lng', DEFAULT_LNG)
        
        if lat == DEFAULT_LAT and lng == DEFAULT_LNG:
            default_businesses.append({
                'id': business.get('id', ''),
                'title': business.get('title', 'Unknown'),
                'address': business.get('address', ''),
                'owner': business.get('owner', ''),
                'business_type': business.get('business_type', ''),
                'registration_info': business.get('registration_info', ''),
                'raw_text': business.get('raw_text', '')[:200] if business.get('raw_text') else '',
                'source_url': business.get('source_url', ''),
                'batch_file': business.get('batch_file', ''),
                'startDate': business.get('startDate', ''),
                'endDate': business.get('endDate', '')
            })
    
    print(f"Found {len(default_businesses):,} businesses with default coordinates")
    
    # Sort by title for easier review
    default_businesses.sort(key=lambda x: x['title'])
    
    # Save as CSV for easy viewing in Excel/Google Sheets
    csv_file = 'businesses_with_default_coordinates.csv'
    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
        if default_businesses:
            writer = csv.DictWriter(f, fieldnames=default_businesses[0].keys())
            writer.writeheader()
            writer.writerows(default_businesses)
    
    print(f"Saved to {csv_file}")
    
    # Also save as JSON for programmatic access
    json_file = 'businesses_with_default_coordinates.json'
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(default_businesses, f, indent=2, ensure_ascii=False)
    
    print(f"Saved to {json_file}")
    
    # Show some statistics
    print(f"\n=== Statistics ===")
    
    # Count by presence of address
    with_address = sum(1 for b in default_businesses if b['address'] and len(b['address']) > 5)
    without_address = len(default_businesses) - with_address
    
    print(f"With address: {with_address:,}")
    print(f"Without address: {without_address:,}")
    
    # Show examples of businesses with addresses that couldn't be geocoded
    print(f"\n=== Examples with addresses that couldn't be geocoded ===")
    examples_with_address = [b for b in default_businesses if b['address'] and len(b['address']) > 5][:10]
    
    for business in examples_with_address:
        print(f"\nTitle: {business['title']}")
        print(f"Address: {business['address']}")
        if business['owner']:
            print(f"Owner: {business['owner']}")
        if business['registration_info']:
            print(f"Registration: {business['registration_info'][:100]}")
    
    # Show examples without addresses
    print(f"\n=== Examples without addresses ===")
    examples_without_address = [b for b in default_businesses if not b['address'] or len(b['address']) <= 5][:10]
    
    for business in examples_without_address:
        print(f"\nTitle: {business['title']}")
        print(f"Address: '{business['address']}'")
        if business['raw_text']:
            print(f"Raw text snippet: {business['raw_text'][:100]}...")
    
    print(f"\n✅ Export complete!")
    print(f"📄 CSV file: {csv_file}")
    print(f"📄 JSON file: {json_file}")
    print(f"\nYou can open the CSV file in Excel or Google Sheets to review all {len(default_businesses):,} businesses")

if __name__ == "__main__":
    export_default_coordinate_businesses()