#!/usr/bin/env python3
import json
import time
import requests
from pathlib import Path
from typing import Dict, List, Optional, Tuple

def geocode_address_nominatim(address: str, attempt: int = 1) -> Optional[Tuple[float, float]]:
    """
    Geocode an address using Nominatim API.
    Returns (longitude, latitude) tuple or None if not found.
    """
    # Add delay to respect Nominatim rate limits
    time.sleep(1.2)  # Nominatim requires max 1 request per second
    
    # Clean and format address
    full_address = f"{address}, Frankfurt am Main, Germany" if "Frankfurt" not in address else f"{address}, Germany"
    
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        'q': full_address,
        'format': 'json',
        'limit': 1,
        'countrycodes': 'de'
    }
    headers = {
        'User-Agent': 'StoryMaps Frankfurt Geocoder/1.0'
    }
    
    try:
        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if data and len(data) > 0:
            result = data[0]
            return (float(result['lon']), float(result['lat']))
        elif attempt == 1:
            # Try with simplified address
            simplified = address.split(',')[0] + ", Frankfurt, Germany"
            return geocode_address_nominatim(simplified, attempt=2)
    except Exception as e:
        print(f"Error geocoding {address}: {e}")
    
    return None

def get_frankfurt_district_coordinates() -> Dict[str, Tuple[float, float]]:
    """
    Return approximate center coordinates for Frankfurt districts.
    Used as fallback when exact geocoding fails.
    """
    return {
        'Altstadt': (8.6821, 50.1109),  # City center
        'Westend': (8.6650, 50.1200),   # West of center
        'Ostend': (8.7000, 50.1100),    # East of center
        'Nordend': (8.6850, 50.1250),   # North of center
        'Sachsenhausen': (8.6850, 50.1000),  # South of river
        'Bornheim': (8.7100, 50.1200),  # Northeast
        'Bockenheim': (8.6500, 50.1300),  # Northwest
        'Bahnhofsviertel': (8.6700, 50.1070),  # Station area
        'Innenstadt': (8.6821, 50.1109),  # City center
        'Frankfurt': (8.6821, 50.1109)  # Default center
    }

def geocode_frankfurt_businesses():
    """
    Geocode all Frankfurt businesses and create GeoJSON file.
    """
    # Load the complete Frankfurt dataset
    input_path = Path('/Users/samfrons/Desktop/storymaps/Frankfurt/frankfurt_businesses_complete.json')
    
    if not input_path.exists():
        print(f"Error: {input_path} not found")
        return
    
    with open(input_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    businesses = data['businesses']
    district_coords = get_frankfurt_district_coordinates()
    
    geocoded_count = 0
    failed_count = 0
    fallback_count = 0
    
    # Create GeoJSON feature collection
    features = []
    
    for i, business in enumerate(businesses):
        print(f"Processing {i+1}/{len(businesses)}: {business['name']}")
        
        address = business['address']
        district = business.get('district', 'Frankfurt')
        
        # Try to geocode the address
        coords = geocode_address_nominatim(address)
        
        if coords:
            geocoded_count += 1
            print(f"  ✓ Geocoded: {coords}")
        else:
            # Use district center as fallback
            if district in district_coords:
                coords = district_coords[district]
                # Add small random offset to prevent exact overlapping
                import random
                coords = (
                    coords[0] + random.uniform(-0.005, 0.005),
                    coords[1] + random.uniform(-0.005, 0.005)
                )
                fallback_count += 1
                print(f"  ⚠ Using district center for {district}")
            else:
                coords = district_coords['Frankfurt']
                failed_count += 1
                print(f"  ✗ Failed to geocode, using city center")
        
        # Store coordinates in the business object
        business['coordinates'] = coords
        
        # Create GeoJSON feature
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": coords
            },
            "properties": {
                "id": business['id'],
                "name": business['name'],
                "owner": business['owner'],
                "address": business['address'],
                "district": district,
                "category": business['category'],
                "subcategory": business.get('subcategory', ''),
                "business_type": business.get('business_type', ''),
                "founded_date": business.get('founded_date', '1920-01-01'),
                "closing_date": business.get('closing_date', '1938-11-09'),
                "source": business['source']
            }
        }
        features.append(feature)
    
    # Create GeoJSON object
    geojson = {
        "type": "FeatureCollection",
        "metadata": {
            "title": "Frankfurt am Main Jewish Businesses 1935",
            "total_features": len(features),
            "geocoded": geocoded_count,
            "fallback": fallback_count,
            "failed": failed_count,
            "extraction_date": data['metadata']['extraction_date'],
            "center": [8.6821, 50.1109],  # Frankfurt center
            "zoom": 12
        },
        "features": features
    }
    
    # Save GeoJSON file to public directory
    geojson_path = Path('/Users/samfrons/Desktop/storymaps/public/frankfurt_businesses.geojson')
    with open(geojson_path, 'w', encoding='utf-8') as f:
        json.dump(geojson, f, ensure_ascii=False, indent=2)
    
    # Also update the complete JSON with coordinates
    output_path = Path('/Users/samfrons/Desktop/storymaps/Frankfurt/frankfurt_businesses_geocoded.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\n=== GEOCODING COMPLETE ===")
    print(f"Total businesses: {len(businesses)}")
    print(f"Successfully geocoded: {geocoded_count}")
    print(f"Used district fallback: {fallback_count}")
    print(f"Failed (using city center): {failed_count}")
    print(f"\nGeoJSON saved to: {geojson_path}")
    print(f"Updated JSON saved to: {output_path}")

if __name__ == "__main__":
    print("Starting Frankfurt business geocoding...")
    print("This will take several minutes due to rate limiting...")
    geocode_frankfurt_businesses()