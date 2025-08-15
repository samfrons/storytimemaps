#!/usr/bin/env python3
"""
Convert the enhanced JSON data to CSV format for easier analysis and integration.
"""

import json
import csv
import sys
from typing import Dict, Any

def json_to_csv(json_file: str, csv_file: str):
    """Convert the enhanced JSON data to CSV format"""
    
    # Read the JSON data
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    businesses = data['businesses']
    
    # Define CSV headers
    headers = [
        'business_name',
        'owner_name', 
        'address',
        'main_category',
        'subcategory',
        'detailed_subcategory',
        'founded_year',
        'closed_year',
        'liquidation_date',
        'registration_info',
        'additional_details',
        'confidence_score'
    ]
    
    # Write to CSV
    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        
        for business in businesses:
            # Create a row with only the required headers
            row = {header: business.get(header, '') for header in headers}
            
            # Clean up empty values
            for key, value in row.items():
                if value is None:
                    row[key] = ''
                elif isinstance(value, str):
                    # Clean up the text
                    row[key] = value.strip()
            
            writer.writerow(row)
    
    print(f"Converted {len(businesses)} businesses to {csv_file}")
    
    # Print summary statistics
    print("\n=== CONVERSION SUMMARY ===")
    print(f"Total businesses: {len(businesses)}")
    
    # Category breakdown
    categories = {}
    for business in businesses:
        cat = business.get('main_category', '') or 'uncategorized'
        categories[cat] = categories.get(cat, 0) + 1
    
    print("\nCategory breakdown:")
    for cat, count in sorted(categories.items()):
        print(f"  {cat}: {count}")
    
    # Top detailed subcategories
    detailed_subcats = {}
    for business in businesses:
        subcat = business.get('detailed_subcategory', '') or 'unspecified'
        if subcat and subcat != 'unspecified':
            detailed_subcats[subcat] = detailed_subcats.get(subcat, 0) + 1
    
    print("\nTop detailed subcategories:")
    sorted_subcats = sorted(detailed_subcats.items(), key=lambda x: x[1], reverse=True)[:15]
    for subcat, count in sorted_subcats:
        print(f"  {subcat}: {count}")

def main():
    input_file = "/Users/samfrons/Desktop/storymaps/jewish_businesses_complete_enhanced.json"
    output_file = "/Users/samfrons/Desktop/storymaps/jewish_businesses_complete.csv"
    
    try:
        json_to_csv(input_file, output_file)
        print(f"\nSuccess! CSV file created at: {output_file}")
    except Exception as e:
        print(f"Error converting to CSV: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()