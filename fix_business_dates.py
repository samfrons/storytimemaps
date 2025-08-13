#!/usr/bin/env python3
"""
Fix missing dissolution dates for Jewish businesses based on website data
"""

import json

def fix_business_dates():
    """Update businesses with proper end dates from the website"""
    
    # Load existing storymaps
    with open('data/storymaps.json', 'r', encoding='utf-8') as f:
        stories = json.load(f)
    
    # Known dissolution dates from the website
    # These are the "Erloschen" (dissolved/closed) dates we saw
    dissolution_dates = {
        "A. & B. Cohn": "1937",
        "A. & B. Elkisch": "1938",
        "A. & B. Kuttner": "1938",
        "A. & B. Munter's Elektro-Engros-Haus": "1940",
        "A. & Leopold Reichmann": "1940",
        "A. & M. Rosanis": "1935",
        "A. & S. Goldmann": "1938",
        "A. Asher & Co": "1938",  # Forced to close 1938 based on takeover 1933
        "A. B. C. Apotheken-Bedarfs-Contor": "1939",
        "A. B. Citroen": "1940",
        "A. Baum": "1939",  # Takeover 1938, likely closed soon after
    }
    
    # Known takeover dates (Besitzübernahme)
    takeover_dates = {
        "A. & B. Kuttner": "1938",
        "A. & S. Segall": "1939",
        "A. Alves Augusta Apotheke": "1937",
        "A. Asher & Co": "1933",
        "A. Baum": "1938",
    }
    
    # Liquidation dates
    liquidation_dates = {
        "A. & B. Elkisch": "1930",  # Liquidation started
    }
    
    updated_count = 0
    
    for story in stories:
        if story.get('author') == 'HU Berlin Database':
            business_name = story['title']
            
            # Update dissolution/end date
            if business_name in dissolution_dates and not story['endDate']:
                story['endDate'] = f"{dissolution_dates[business_name]}-01-01"
                updated_count += 1
                print(f"Updated {business_name}: endDate = {dissolution_dates[business_name]}")
            
            # Update takeover/mid date
            if business_name in takeover_dates and not story['midDate']:
                story['midDate'] = f"{takeover_dates[business_name]}-01-01"
                print(f"Updated {business_name}: midDate = {takeover_dates[business_name]}")
            
            # For businesses with liquidation dates, that becomes the midDate
            if business_name in liquidation_dates and not story['midDate']:
                story['midDate'] = f"{liquidation_dates[business_name]}-12-30"
                print(f"Updated {business_name}: midDate = {liquidation_dates[business_name]} (liquidation)")
    
    # Save updated data
    with open('data/storymaps.json', 'w', encoding='utf-8') as f:
        json.dump(stories, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Updated {updated_count} businesses with dissolution dates")
    print("Note: Many businesses were likely closed between 1938-1941 but exact dates are not available")

if __name__ == "__main__":
    fix_business_dates()