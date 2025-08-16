#!/usr/bin/env python3
"""
Enhanced address parser to extract street names from raw_text and registration_info
that were missed in the original parsing
"""

import json
import re
import os
from datetime import datetime

def extract_street_from_text(text):
    """Extract street name from raw text using comprehensive patterns"""
    if not text:
        return None
    
    # Street name patterns (German streets)
    patterns = [
        # Full street names with numbers: "Kaiser-Wilhelm-Str. 58"
        r'([A-ZÄÖÜa-zäöü][A-ZÄÖÜa-zäöü\-\s]*(?:str|straße|platz|allee|weg|damm|gasse|ufer|ring|hof|berg|wall|markt|tor|brücke|park|chaussee|promenade)\.?\s*\d+[a-zA-Z]?)',
        
        # Street names without numbers but followed by comma: "Kaiserdamm,"
        r'([A-ZÄÖÜa-zäöü][A-ZÄÖÜa-zäöü\-\s]*(?:str|straße|platz|allee|weg|damm|gasse|ufer|ring|hof|berg|wall|markt|tor|brücke|park|chaussee|promenade)\.?)(?:\s*[,;]|\s+\d)',
        
        # Compound German street names: "Kaiser-Wilhelm-Str"
        r'([A-ZÄÖÜa-zäöü]+(?:\-[A-ZÄÖÜa-zäöü]+)*\-(?:Str|Straße|Platz|Allee|Weg|Damm|Gasse|Ufer|Ring)\.?)',
        
        # Common Berlin street patterns
        r'((?:Kaiser|Paul|Sophie|Martin|Belle|Friedrich|Wilhelm|Charlotte|Augusta|Alexander|Unter|Potsdamer|Kurfürsten)[A-ZÄÖÜa-zäöü\-\s]*(?:str|straße|platz|allee|weg|damm|gasse|ufer|ring)\.?)',
        
        # Short street names: "Münzstr"
        r'([A-ZÄÖÜa-zäöü]{4,}(?:str|straße|platz|allee|weg|damm|gasse|ufer|ring)\.?)'
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            # Clean up the match
            street = matches[0].strip()
            # Remove trailing punctuation except period in abbreviations
            street = re.sub(r'[,;]+$', '', street)
            return street
    
    return None

def extract_house_number(address):
    """Extract house number from existing address field"""
    if not address:
        return None
    
    # Look for house numbers (including complex ones like "23/24", "5a", etc.)
    patterns = [
        r'(\d+[a-zA-Z]?(?:/\d+[a-zA-Z]?)?)',  # 23, 23a, 23/24, etc.
        r'(\d+\-\d+)',  # 23-25
    ]
    
    for pattern in patterns:
        match = re.search(pattern, address)
        if match:
            return match.group(1)
    
    return None

def enhance_address(business):
    """Enhance address by combining street name from raw text with house number"""
    current_address = business.get('address', '')
    raw_text = business.get('raw_text', '')
    reg_info = business.get('registration_info', '')
    
    # Check if address is incomplete (just number or empty)
    is_incomplete = (
        not current_address or 
        len(current_address) < 10 or
        re.match(r'^\d+[a-zA-Z]?(?:/\d+)?[,\s]*Berlin$', current_address.strip())
    )
    
    if not is_incomplete:
        return current_address  # Address is already good
    
    # Try to find street name in raw_text first, then registration_info
    street_name = extract_street_from_text(raw_text)
    if not street_name:
        street_name = extract_street_from_text(reg_info)
    
    if not street_name:
        return current_address  # No street name found
    
    # Get house number from current address
    house_number = extract_house_number(current_address)
    
    if house_number:
        # Combine street name and house number
        enhanced_address = f"{street_name} {house_number}, Berlin"
    else:
        # Just use street name if no house number
        enhanced_address = f"{street_name}, Berlin"
    
    return enhanced_address

def process_batch_file(batch_file):
    """Process a single batch file and enhance addresses"""
    print(f"\nProcessing {batch_file}...")
    
    with open(batch_file, 'r', encoding='utf-8') as f:
        batch_data = json.load(f)
    
    businesses = batch_data.get('businesses', [])
    enhanced_count = 0
    
    for business in businesses:
        original_address = business.get('address', '')
        enhanced_address = enhance_address(business)
        
        if enhanced_address != original_address:
            business['address'] = enhanced_address
            business['address_enhanced'] = True  # Mark as enhanced
            enhanced_count += 1
            
            if enhanced_count <= 3:  # Show first 3 examples
                print(f"  Enhanced: {business.get('business_name', '')[:40]}")
                print(f"    Before: \"{original_address}\"")
                print(f"    After:  \"{enhanced_address}\"")
    
    print(f"  Enhanced {enhanced_count} addresses in {batch_file}")
    return batch_data, enhanced_count

def main():
    """Main function to enhance addresses in all batch files"""
    print("=== Enhanced Address Parsing ===")
    print("Extracting street names from raw_text and registration_info fields")
    
    # Process all batch files
    batch_files = [
        'jewish_businesses_batch_1.json',
        'jewish_businesses_batch_2.json',
        'jewish_businesses_batch_3.json',
        'jewish_businesses_batch_4.json'
    ]
    
    all_enhanced_businesses = []
    total_enhanced = 0
    
    # Create backup directory
    backup_dir = 'enhanced_parsing_backups'
    os.makedirs(backup_dir, exist_ok=True)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    for batch_file in batch_files:
        if os.path.exists(batch_file):
            # Create backup
            backup_file = f"{backup_dir}/{batch_file}.backup_{timestamp}"
            with open(batch_file, 'r', encoding='utf-8') as f:
                backup_data = json.load(f)
            with open(backup_file, 'w', encoding='utf-8') as f:
                json.dump(backup_data, f, indent=2, ensure_ascii=False)
            
            # Process and enhance
            enhanced_batch, enhanced_count = process_batch_file(batch_file)
            total_enhanced += enhanced_count
            
            # Save enhanced batch file
            with open(batch_file, 'w', encoding='utf-8') as f:
                json.dump(enhanced_batch, f, indent=2, ensure_ascii=False)
            
            # Collect all businesses
            all_enhanced_businesses.extend(enhanced_batch.get('businesses', []))
        else:
            print(f"Warning: {batch_file} not found")
    
    print(f"\n=== Enhancement Complete ===")
    print(f"Total businesses processed: {len(all_enhanced_businesses):,}")
    print(f"Addresses enhanced: {total_enhanced:,}")
    print(f"Enhancement rate: {total_enhanced/len(all_enhanced_businesses)*100:.1f}%")
    
    # Create enhanced merged dataset for testing
    print(f"\nCreating enhanced merged dataset...")
    
    # Convert to storymaps format (reuse existing logic)
    storymaps_data = []
    for i, business in enumerate(all_enhanced_businesses):
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
        
        # Default coordinates (will be geocoded)
        lat = 52.52
        lng = 13.405
        
        # Get business name
        business_name = business.get('business_name') or business.get('name', 'Unknown Business')
        
        # Create storymaps entry
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
            "state": "active",
            "address_enhanced": business.get('address_enhanced', False)
        }
        
        storymaps_data.append(story_entry)
    
    # Save enhanced dataset
    enhanced_dataset_file = 'data/storymaps_test_enhanced_addresses.json'
    os.makedirs('data', exist_ok=True)
    
    with open(enhanced_dataset_file, 'w', encoding='utf-8') as f:
        json.dump(storymaps_data, f, indent=2, ensure_ascii=False)
    
    # Count how many addresses were enhanced
    enhanced_addresses = sum(1 for entry in storymaps_data if entry.get('address_enhanced'))
    
    print(f"Enhanced dataset saved to: {enhanced_dataset_file}")
    print(f"Total businesses: {len(storymaps_data):,}")
    print(f"Enhanced addresses: {enhanced_addresses:,}")
    
    # Show statistics
    print(f"\n=== Address Quality Analysis ===")
    short_addresses = sum(1 for entry in storymaps_data if len(entry['address']) < 15)
    good_addresses = len(storymaps_data) - short_addresses
    
    print(f"Good addresses (likely geocodeable): {good_addresses:,}")
    print(f"Short/incomplete addresses: {short_addresses:,}")
    print(f"Expected geocoding improvement: +{enhanced_addresses} businesses")
    print(f"Ready for geocoding!")

if __name__ == "__main__":
    main()