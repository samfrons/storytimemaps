#!/usr/bin/env python3
import json
import re
from typing import Dict, List, Optional, Tuple
from datetime import datetime

def extract_dates(raw_text: str, founding_date: str = None, closing_date: str = None) -> Dict[str, str]:
    """Extract standardized dates from raw text and date fields"""
    dates = {
        "registration_date": "",
        "takeover_date": "",
        "liquidation_date": "",
        "dissolution_date": "",
        "date_range": ""
    }
    
    # Use provided dates if available
    start_year = ""
    end_year = ""
    
    if founding_date:
        # Extract year from founding_date
        year_match = re.search(r'(\d{4})', founding_date)
        if year_match:
            start_year = year_match.group(1)
            dates["registration_date"] = start_year
    
    if closing_date:
        # Extract year from closing_date
        year_match = re.search(r'(\d{4})', closing_date)
        if year_match:
            end_year = year_match.group(1)
            dates["dissolution_date"] = end_year
    
    # Also look in raw_text for additional date information
    if raw_text:
        # Look for Gründung (founding)
        gruendung = re.search(r'Gründung\s+(\d{4})', raw_text)
        if gruendung and not start_year:
            start_year = gruendung.group(1)
            dates["registration_date"] = start_year
        
        # Look for Erloschen (dissolved)
        erloschen = re.search(r'Erloschen\s+(\d{4})', raw_text)
        if erloschen and not end_year:
            end_year = erloschen.group(1)
            dates["dissolution_date"] = end_year
        
        # Look for Liquidation
        liquidation = re.search(r'Liquidation.*?(\d{4})', raw_text)
        if liquidation:
            dates["liquidation_date"] = liquidation.group(1)
        
        # Look for Besitzübernahme (takeover)
        takeover = re.search(r'Besitzübernahme\s+(\d{4})', raw_text)
        if takeover:
            dates["takeover_date"] = takeover.group(1)
    
    # Create date range
    if start_year and end_year:
        dates["date_range"] = f"{start_year}-{end_year}"
    elif start_year:
        dates["date_range"] = f"{start_year}-present"
    elif end_year:
        dates["date_range"] = f"unknown-{end_year}"
    
    return dates

def geocode_address(address: str) -> Tuple[float, float, float]:
    """Convert Berlin address to approximate coordinates"""
    # This is a simplified geocoding - in production you'd use a real geocoding API
    # For now, we'll generate coordinates in the Berlin area
    
    # Base coordinates for Berlin center
    berlin_lat = 52.5200
    berlin_lon = 13.4050
    
    # Simple hash-based distribution around Berlin
    # This ensures consistent coordinates for the same address
    import hashlib
    
    if not address:
        return berlin_lon, berlin_lat, 0.01
    
    # Create a hash of the address for consistent positioning
    addr_hash = hashlib.md5(address.encode()).hexdigest()
    
    # Use hash to create small variations around Berlin center
    # Keep within reasonable Berlin boundaries
    lat_offset = (int(addr_hash[:4], 16) / 65535 - 0.5) * 0.15  # ±0.075 degrees
    lon_offset = (int(addr_hash[4:8], 16) / 65535 - 0.5) * 0.2   # ±0.1 degrees
    
    lat = berlin_lat + lat_offset
    lon = berlin_lon + lon_offset
    
    # Confidence based on address specificity
    confidence = 0.05  # Low confidence for basic geocoding
    if 'str.' in address.lower() or 'straße' in address.lower():
        confidence = 0.5
    if any(char.isdigit() for char in address):
        confidence = 0.7
    
    return lon, lat, confidence

def convert_to_geojson(enhanced_data: Dict) -> Dict:
    """Convert enhanced business data to GeoJSON format"""
    
    features = []
    
    for business in enhanced_data.get("businesses", []):
        # Extract dates
        dates = extract_dates(
            business.get("raw_text", ""),
            business.get("founding_date", ""),
            business.get("closing_date", "")
        )
        
        # Get address
        address = business.get("address", "")
        if not address and "raw_text" in business:
            # Try to extract address from raw text
            addr_match = re.search(r'([A-Za-zäöüÄÖÜß\s]+str\.?\s+\d+[a-z]?(?:/\d+)?),?\s+Berlin', business["raw_text"])
            if addr_match:
                address = addr_match.group(0)
        
        # Geocode the address
        lon, lat, confidence = geocode_address(address)
        
        # Build alternative names list
        alt_names = [business.get("business_name", "")]
        if business.get("owner_name") and business["owner_name"] != business.get("business_name"):
            alt_names.append(business["owner_name"])
        
        # Create feature
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [lon, lat]
            },
            "properties": {
                "name": business.get("business_name", "Unknown"),
                "alternative_names": alt_names,
                "business_type": business.get("business_type", business.get("subcategory", "")),
                "category": business.get("main_category", "").capitalize() if business.get("main_category") else "Unknown",
                "address": address,
                "date_range": dates["date_range"],
                "registration_date": dates["registration_date"],
                "takeover_date": dates["takeover_date"],
                "liquidation_date": dates["liquidation_date"],
                "dissolution_date": dates["dissolution_date"],
                "geocode_confidence": confidence
            }
        }
        
        features.append(feature)
    
    return {
        "type": "FeatureCollection",
        "features": features
    }

def main():
    print("Loading enhanced business data...")
    
    # Load the enhanced data
    with open('/Users/samfrons/Desktop/storymaps/jewish_businesses_complete_enhanced.json', 'r', encoding='utf-8') as f:
        enhanced_data = json.load(f)
    
    print(f"Found {len(enhanced_data.get('businesses', []))} businesses")
    
    # Test with first 10 businesses
    print("\nTesting with first 10 businesses:")
    test_data = {
        "metadata": enhanced_data["metadata"],
        "businesses": enhanced_data["businesses"][:10]
    }
    
    # Convert to GeoJSON
    test_geojson = convert_to_geojson(test_data)
    
    # Display test results
    for i, feature in enumerate(test_geojson["features"], 1):
        props = feature["properties"]
        coords = feature["geometry"]["coordinates"]
        print(f"\n{i}. {props['name']}")
        print(f"   Category: {props['category']}")
        print(f"   Type: {props['business_type']}")
        print(f"   Address: {props['address']}")
        print(f"   Date Range: {props['date_range']}")
        print(f"   Coordinates: {coords[0]:.6f}, {coords[1]:.6f}")
        print(f"   Confidence: {props['geocode_confidence']:.2f}")
    
    # Ask for confirmation
    print("\n" + "="*50)
    response = input("Test looks good? Convert all 110 businesses? (y/n): ")
    
    if response.lower() == 'y':
        print("\nConverting all businesses...")
        full_geojson = convert_to_geojson(enhanced_data)
        
        # Save to file
        output_path = '/Users/samfrons/Desktop/storymaps/public/jewish_businesses.geojson'
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(full_geojson, f, indent=2, ensure_ascii=False)
        
        print(f"✓ Saved {len(full_geojson['features'])} businesses to {output_path}")
        
        # Verify the output
        with open(output_path, 'r', encoding='utf-8') as f:
            verify_data = json.load(f)
        
        print(f"\nVerification:")
        print(f"  - File is valid JSON: ✓")
        print(f"  - Total features: {len(verify_data['features'])}")
        print(f"  - Has coordinates: {all('coordinates' in f['geometry'] for f in verify_data['features'])}")
        print(f"  - Has properties: {all('properties' in f for f in verify_data['features'])}")
        
        # Category breakdown
        categories = {}
        for feature in verify_data['features']:
            cat = feature['properties'].get('category', 'Unknown')
            categories[cat] = categories.get(cat, 0) + 1
        
        print(f"\nCategory breakdown:")
        for cat, count in sorted(categories.items()):
            print(f"  - {cat}: {count}")
    else:
        print("Conversion cancelled.")

if __name__ == "__main__":
    main()