#!/usr/bin/env python3
"""
Scraper for Jewish Business Database from HU Berlin
Outputs CSV and GeoJSON for Mapbox GL visualization
"""

import requests
from bs4 import BeautifulSoup
import csv
import json
import time
import re
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class JewishBusinessScraper:
    def __init__(self, start_page=1, end_page=10):
        self.base_url = "https://www2.hu-berlin.de/djgb/public/en/find"
        self.start_page = start_page
        self.end_page = end_page
        self.businesses = []
        self.geocode_cache = {}
        
    def scrape_page(self, page_num: int) -> List[Dict]:
        """Scrape a single page of business listings"""
        url = f"{self.base_url}?page={page_num}"
        logger.info(f"Scraping page {page_num}")
        
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            
            businesses = []
            listings = soup.find_all('li', class_='list-group-item')
            
            for listing in listings:
                business = self.extract_business_data(listing, page_num)
                if business:
                    businesses.append(business)
                    
            logger.info(f"Found {len(businesses)} businesses on page {page_num}")
            return businesses
            
        except Exception as e:
            logger.error(f"Error scraping page {page_num}: {e}")
            return []
    
    def extract_business_data(self, listing, page_num: int) -> Optional[Dict]:
        """Extract business data from a single listing"""
        try:
            business = {
                'page_number': page_num,
                'primary_name': '',
                'alternative_names': [],
                'business_type': '',
                'business_category': '',
                'registration_date': '',
                'takeover_date': '',
                'liquidation_date': '',
                'other_dates': [],
                'address': '',
                'latitude': None,
                'longitude': None,
                'geocode_confidence': None
            }
            
            # Extract primary name
            h4 = listing.find('h4')
            if h4:
                business['primary_name'] = h4.get_text(strip=True)
            
            # Extract alternative names
            alt_names_div = listing.find('div')
            if alt_names_div:
                ul = alt_names_div.find('ul')
                if ul:
                    for li in ul.find_all('li'):
                        alt_name = li.get_text(strip=True)
                        if alt_name:
                            business['alternative_names'].append(alt_name)
            
            # Extract business type and category
            type_divs = listing.find_all('div')
            for div in type_divs:
                if div.find('b') and not div.find('ul'):
                    text = div.get_text(strip=True)
                    # Look for pattern like "books and art (Trade)"
                    match = re.search(r'(.+?)\s*\((\w+)\)', text)
                    if match:
                        business['business_type'] = match.group(1).strip()
                        business['business_category'] = match.group(2).strip()
                    elif text and not text.startswith(business['primary_name']):
                        business['business_type'] = text
            
            # Extract dates
            date_divs = listing.find_all('div', class_='mt5')
            for div in date_divs:
                if div.find('i'):
                    date_text = div.get_text(strip=True)
                    if 'Gründung' in date_text:
                        # Extract foundation year
                        year_match = re.search(r'\d{4}', date_text)
                        if year_match:
                            business['registration_date'] = year_match.group()
                    elif 'Besitzübernahme' in date_text:
                        # Extract takeover date
                        year_match = re.search(r'\d{4}', date_text)
                        if year_match:
                            business['takeover_date'] = year_match.group()
                    elif 'Liquidation' in date_text or 'Löschung' in date_text:
                        # Extract liquidation date
                        year_match = re.search(r'\d{4}', date_text)
                        if year_match:
                            business['liquidation_date'] = year_match.group()
                    
                    business['other_dates'].append(date_text)
            
            # Extract address (last mt5 div without italic)
            for div in date_divs:
                if not div.find('i'):
                    address_text = div.get_text(strip=True)
                    if address_text and 'Berlin' in address_text:
                        business['address'] = address_text
            
            return business
            
        except Exception as e:
            logger.error(f"Error extracting business data: {e}")
            return None
    
    def geocode_address(self, address: str) -> Tuple[Optional[float], Optional[float], Optional[float]]:
        """Geocode an address using Nominatim"""
        if not address:
            return None, None, None
            
        # Check cache first
        if address in self.geocode_cache:
            return self.geocode_cache[address]
        
        try:
            # Clean and prepare address
            clean_address = address.strip()
            if 'Berlin' not in clean_address:
                clean_address += ', Berlin'
            if 'Germany' not in clean_address:
                clean_address += ', Germany'
            
            logger.info(f"Geocoding: {clean_address}")
            
            # Nominatim API request
            url = "https://nominatim.openstreetmap.org/search"
            params = {
                'q': clean_address,
                'format': 'json',
                'limit': 1
            }
            headers = {
                'User-Agent': 'JewishBusinessDatabase/1.0 (samfrons@gmail.com)'
            }
            
            response = requests.get(url, params=params, headers=headers, timeout=10)
            response.raise_for_status()
            
            # Respect rate limit
            time.sleep(1.1)  # Nominatim requires max 1 request per second
            
            data = response.json()
            if data:
                lat = float(data[0]['lat'])
                lon = float(data[0]['lon'])
                importance = float(data[0].get('importance', 0.5))
                
                # Cache the result
                self.geocode_cache[address] = (lat, lon, importance)
                return lat, lon, importance
            else:
                logger.warning(f"No geocoding results for: {address}")
                self.geocode_cache[address] = (None, None, None)
                return None, None, None
                
        except Exception as e:
            logger.error(f"Geocoding error for {address}: {e}")
            self.geocode_cache[address] = (None, None, None)
            return None, None, None
    
    def scrape_all(self):
        """Scrape all pages and geocode addresses"""
        # Scrape all pages first
        for page in range(self.start_page, self.end_page + 1):
            page_businesses = self.scrape_page(page)
            self.businesses.extend(page_businesses)
            time.sleep(0.5)  # Be respectful to the server
        
        logger.info(f"Total businesses scraped: {len(self.businesses)}")
        
        # Geocode addresses
        logger.info("Starting geocoding...")
        for i, business in enumerate(self.businesses):
            if business['address']:
                lat, lon, confidence = self.geocode_address(business['address'])
                business['latitude'] = lat
                business['longitude'] = lon
                business['geocode_confidence'] = confidence
                
            if (i + 1) % 10 == 0:
                logger.info(f"Geocoded {i + 1}/{len(self.businesses)} businesses")
    
    def save_csv(self, filename='jewish_businesses.csv'):
        """Save data to CSV file"""
        if not self.businesses:
            logger.warning("No data to save")
            return
            
        fieldnames = [
            'primary_name', 'alternative_names', 'business_type', 'business_category',
            'registration_date', 'takeover_date', 'liquidation_date', 'other_dates',
            'address', 'latitude', 'longitude', 'geocode_confidence', 'page_number'
        ]
        
        with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            
            for business in self.businesses:
                # Convert lists to pipe-separated strings
                row = business.copy()
                row['alternative_names'] = '|'.join(business['alternative_names'])
                row['other_dates'] = '|'.join(business['other_dates'])
                writer.writerow(row)
        
        logger.info(f"Saved {len(self.businesses)} businesses to {filename}")
    
    def save_geojson(self, filename='jewish_businesses.geojson'):
        """Save data as GeoJSON for Mapbox GL"""
        features = []
        
        for business in self.businesses:
            # Only create features for geocoded businesses
            if business['latitude'] and business['longitude']:
                # Create display dates
                date_range = ''
                if business['registration_date']:
                    date_range = business['registration_date']
                    if business['liquidation_date']:
                        date_range += f"-{business['liquidation_date']}"
                
                feature = {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [business['longitude'], business['latitude']]
                    },
                    "properties": {
                        "name": business['primary_name'],
                        "alternative_names": business['alternative_names'],
                        "business_type": business['business_type'],
                        "category": business['business_category'],
                        "address": business['address'],
                        "date_range": date_range,
                        "registration_date": business['registration_date'],
                        "takeover_date": business['takeover_date'],
                        "liquidation_date": business['liquidation_date'],
                        "geocode_confidence": business['geocode_confidence']
                    }
                }
                features.append(feature)
        
        geojson = {
            "type": "FeatureCollection",
            "features": features
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(geojson, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Saved {len(features)} geocoded businesses to {filename}")
    
def main():
    """Main execution"""
    print("=" * 60)
    print("Jewish Business Database Scraper")
    print("Scraping pages 1-10 from HU Berlin database")
    print("=" * 60)
    
    scraper = JewishBusinessScraper(start_page=1, end_page=10)
    
    # Scrape and geocode
    scraper.scrape_all()
    
    # Save outputs
    scraper.save_csv('jewish_businesses.csv')
    scraper.save_geojson('jewish_businesses.geojson')
    
    print("\n" + "=" * 60)
    print("Scraping complete!")
    print(f"Total businesses: {len(scraper.businesses)}")
    geocoded = sum(1 for b in scraper.businesses if b['latitude'])
    print(f"Successfully geocoded: {geocoded}/{len(scraper.businesses)}")
    print("\nOutput files:")
    print("  - jewish_businesses.csv")
    print("  - jewish_businesses.geojson (ready for Mapbox GL)")
    print("=" * 60)

if __name__ == "__main__":
    main()