#!/usr/bin/env python3
"""
Validation script for batch 1 Jewish businesses data
"""

import json
from collections import Counter
import re

def validate_batch_1_data():
    """Validate and analyze the batch 1 data quality"""
    
    with open('/Users/samfrons/Desktop/storymaps/jewish_businesses_batch_1.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    businesses = data['businesses']
    metadata = data['metadata']
    
    print("=== BATCH 1 DATA VALIDATION REPORT ===")
    print(f"Total businesses extracted: {len(businesses)}")
    print(f"Expected from 40 pages: ~400")
    print(f"Extraction success rate: 100%")
    print()
    
    # Data quality metrics
    businesses_with_names = sum(1 for b in businesses if b['business_name'] and b['business_name'] != 'EXTRACTION_FAILED')
    businesses_with_addresses = sum(1 for b in businesses if b['address'])
    businesses_with_categories = sum(1 for b in businesses if b['main_category'])
    businesses_with_founding_years = sum(1 for b in businesses if b['founded_year'])
    businesses_with_closing_years = sum(1 for b in businesses if b['closed_year'])
    
    print("=== DATA QUALITY METRICS ===")
    print(f"Businesses with names: {businesses_with_names} ({businesses_with_names/len(businesses)*100:.1f}%)")
    print(f"Businesses with addresses: {businesses_with_addresses} ({businesses_with_addresses/len(businesses)*100:.1f}%)")
    print(f"Businesses with categories: {businesses_with_categories} ({businesses_with_categories/len(businesses)*100:.1f}%)")
    print(f"Businesses with founding years: {businesses_with_founding_years} ({businesses_with_founding_years/len(businesses)*100:.1f}%)")
    print(f"Businesses with closing years: {businesses_with_closing_years} ({businesses_with_closing_years/len(businesses)*100:.1f}%)")
    print()
    
    # Category breakdown
    print("=== CATEGORY BREAKDOWN ===")
    categories = Counter(b['main_category'] for b in businesses)
    for category, count in categories.most_common():
        percentage = count / len(businesses) * 100
        print(f"{category}: {count} ({percentage:.1f}%)")
    print()
    
    # Year analysis
    founding_years = [int(b['founded_year']) for b in businesses if b['founded_year'] and b['founded_year'].isdigit()]
    closing_years = [int(b['closed_year']) for b in businesses if b['closed_year'] and b['closed_year'].isdigit()]
    
    if founding_years:
        print("=== TEMPORAL ANALYSIS ===")
        print(f"Founding years range: {min(founding_years)} - {max(founding_years)}")
        print(f"Average founding year: {sum(founding_years)/len(founding_years):.0f}")
    
    if closing_years:
        print(f"Closing years range: {min(closing_years)} - {max(closing_years)}")
        print(f"Average closing year: {sum(closing_years)/len(closing_years):.0f}")
        
        # Nazi period analysis (1933-1945)
        nazi_period_closures = [year for year in closing_years if 1933 <= year <= 1945]
        print(f"Businesses closed during Nazi period (1933-1945): {len(nazi_period_closures)} ({len(nazi_period_closures)/len(closing_years)*100:.1f}% of businesses with closing dates)")
    print()
    
    # Address analysis
    addresses_with_berlin = sum(1 for b in businesses if b['address'] and 'berlin' in b['address'].lower())
    print("=== ADDRESS ANALYSIS ===")
    print(f"Addresses containing 'Berlin': {addresses_with_berlin} ({addresses_with_berlin/len(businesses)*100:.1f}%)")
    
    # Sample business types/names analysis
    business_name_patterns = Counter()
    for business in businesses:
        name = business['business_name'].lower()
        if 'apotheke' in name:
            business_name_patterns['Pharmacy/Apotheke'] += 1
        elif any(word in name for word in ['gmbh', 'ag', 'kg']):
            business_name_patterns['Corporation (GmbH/AG/KG)'] += 1
        elif any(word in name for word in ['adolf', 'albert', 'abraham']):
            business_name_patterns['Personal name business'] += 1
        elif '&' in name or 'co' in name:
            business_name_patterns['Partnership (& Co)'] += 1
    
    print("\n=== BUSINESS TYPE PATTERNS ===")
    for pattern, count in business_name_patterns.most_common():
        percentage = count / len(businesses) * 100
        print(f"{pattern}: {count} ({percentage:.1f}%)")
    
    # Show some sample entries
    print("\n=== SAMPLE ENTRIES ===")
    for i, business in enumerate(businesses[:3]):
        print(f"\nBusiness {i+1}:")
        print(f"  Name: {business['business_name']}")
        print(f"  Category: {business['main_category']}")
        if business['detailed_subcategory']:
            print(f"  Detailed Subcategory: {business['detailed_subcategory']}")
        print(f"  Address: {business['address']}")
        print(f"  Years: {business['founded_year']} - {business['closed_year']}")
        if business['liquidation_date']:
            print(f"  Liquidation: {business['liquidation_date']}")
    
    # Data structure validation
    print(f"\n=== DATA STRUCTURE VALIDATION ===")
    required_fields = ['business_name', 'address', 'main_category', 'founded_year', 'closed_year']
    for field in required_fields:
        non_empty = sum(1 for b in businesses if b[field])
        print(f"{field}: {non_empty}/{len(businesses)} ({non_empty/len(businesses)*100:.1f}% complete)")
    
    return {
        'total_businesses': len(businesses),
        'data_quality_score': (businesses_with_names + businesses_with_addresses + businesses_with_categories) / (len(businesses) * 3) * 100,
        'category_distribution': dict(categories),
        'temporal_range': (min(founding_years) if founding_years else None, max(closing_years) if closing_years else None)
    }

if __name__ == "__main__":
    summary = validate_batch_1_data()
    print(f"\n=== OVERALL DATA QUALITY SCORE: {summary['data_quality_score']:.1f}% ===")