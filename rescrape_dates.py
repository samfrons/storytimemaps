#!/usr/bin/env python3
"""
Re-scrape the HU Berlin database to get all date information properly
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import re
from typing import Dict, List, Optional

class DateScraper:
    def __init__(self):
        self.base_url = "https://www2.hu-berlin.de/djgb/public/en/find"
        self.businesses_to_update = {}
        
    def extract_dates_from_text(self, date_div):
        """Extract dates from the date div elements"""
        dates = {
            'registration_date': None,
            'takeover_date': None,
            'liquidation_date': None,
            'dissolution_date': None,
            'other_dates': []
        }
        
        if not date_div:
            return dates
            
        date_text = date_div.get_text(strip=True)
        dates['other_dates'].append(date_text)
        
        # Extract founding/registration date (Gründung)
        if 'Gründung' in date_text:
            year_match = re.search(r'Gründung\s*(\d{4})', date_text)
            if year_match:
                dates['registration_date'] = year_match.group(1)
        elif 'Eingetragen' in date_text:
            year_match = re.search(r'(\d{4})', date_text)
            if year_match:
                dates['registration_date'] = year_match.group(1)
        
        # Extract takeover date (Besitzübernahme)
        if 'Besitzübernahme' in date_text:
            year_match = re.search(r'Besitzübernahme\s*(\d{4})', date_text)
            if year_match:
                dates['takeover_date'] = year_match.group(1)
        
        # Extract liquidation date
        if 'Liquidation' in date_text:
            # Look for patterns like "Liquidation ab 1930-12-30"
            date_match = re.search(r'Liquidation\s*ab\s*(\d{4})', date_text)
            if date_match:
                dates['liquidation_date'] = date_match.group(1)
            else:
                year_match = re.search(r'Liquidation.*?(\d{4})', date_text)
                if year_match:
                    dates['liquidation_date'] = year_match.group(1)
        
        # Extract dissolution date (Erloschen)
        if 'Erloschen' in date_text:
            year_match = re.search(r'Erloschen\s*(\d{4})', date_text)
            if year_match:
                dates['dissolution_date'] = year_match.group(1)
        elif 'Löschung' in date_text:
            year_match = re.search(r'Löschung\s*(\d{4})', date_text)
            if year_match:
                dates['dissolution_date'] = year_match.group(1)
                
        return dates
    
    def scrape_page(self, page_num: int) -> List[Dict]:
        """Scrape a single page for business dates"""
        url = f"{self.base_url}?page={page_num}"
        print(f"Scraping page {page_num}...")
        
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            
            businesses = []
            listings = soup.find_all('li', class_='list-group-item')
            
            for listing in listings:
                business_data = {}
                
                # Get business name
                h4 = listing.find('h4')
                if h4:
                    business_data['name'] = h4.get_text(strip=True)
                    
                # Get all date information
                all_dates = {
                    'registration_date': None,
                    'takeover_date': None,
                    'liquidation_date': None,
                    'dissolution_date': None,
                    'all_date_texts': []
                }
                
                # Find all divs with class mt5 (these contain dates)
                date_divs = listing.find_all('div', class_='mt5')
                for div in date_divs:
                    if div.find('i'):
                        dates = self.extract_dates_from_text(div)
                        # Merge the dates
                        for key, value in dates.items():
                            if key == 'other_dates':
                                all_dates['all_date_texts'].extend(value)
                            elif value and not all_dates[key]:
                                all_dates[key] = value
                
                business_data['dates'] = all_dates
                businesses.append(business_data)
                
            return businesses
            
        except Exception as e:
            print(f"Error scraping page {page_num}: {e}")
            return []
    
    def scrape_first_10_pages(self):
        """Scrape the first 10 pages to update our 87 businesses"""
        all_businesses = {}
        
        for page in range(1, 11):
            businesses = self.scrape_page(page)
            for business in businesses:
                if 'name' in business:
                    all_businesses[business['name']] = business['dates']
            time.sleep(0.5)  # Be respectful
            
        return all_businesses
    
    def update_storymaps_json(self, scraped_dates):
        """Update the storymaps.json with the scraped dates"""
        # Load existing data
        with open('data/storymaps.json', 'r', encoding='utf-8') as f:
            stories = json.load(f)
        
        updated_count = 0
        
        for story in stories:
            if story.get('author') == 'HU Berlin Database':
                business_name = story['title']
                
                if business_name in scraped_dates:
                    dates = scraped_dates[business_name]
                    
                    # Update registration/start date
                    if dates['registration_date'] and not story['startDate']:
                        story['startDate'] = f"{dates['registration_date']}-01-01"
                        print(f"Updated {business_name}: startDate = {dates['registration_date']}")
                    
                    # Update takeover/mid date
                    if dates['takeover_date']:
                        story['midDate'] = f"{dates['takeover_date']}-01-01"
                        print(f"Updated {business_name}: midDate = {dates['takeover_date']} (takeover)")
                    elif dates['liquidation_date'] and not story['midDate']:
                        # If no takeover but has liquidation, use liquidation as midDate
                        story['midDate'] = f"{dates['liquidation_date']}-01-01"
                        print(f"Updated {business_name}: midDate = {dates['liquidation_date']} (liquidation)")
                    
                    # Update dissolution/end date
                    if dates['dissolution_date']:
                        story['endDate'] = f"{dates['dissolution_date']}-01-01"
                        print(f"Updated {business_name}: endDate = {dates['dissolution_date']}")
                        updated_count += 1
                    elif dates['liquidation_date'] and not story['endDate']:
                        # If liquidated but no dissolution date, estimate 1-2 years after liquidation
                        liq_year = int(dates['liquidation_date'])
                        story['endDate'] = f"{liq_year + 1}-01-01"
                        print(f"Updated {business_name}: endDate = {liq_year + 1} (estimated from liquidation)")
                        updated_count += 1
        
        # Save updated data
        with open('data/storymaps.json', 'w', encoding='utf-8') as f:
            json.dump(stories, f, indent=2, ensure_ascii=False)
        
        # Also update the GeoJSON file
        with open('public/jewish_businesses.geojson', 'r', encoding='utf-8') as f:
            geojson_data = json.load(f)
        
        for feature in geojson_data['features']:
            business_name = feature['properties']['name']
            if business_name in scraped_dates:
                dates = scraped_dates[business_name]
                
                if dates['registration_date']:
                    feature['properties']['registration_date'] = dates['registration_date']
                if dates['takeover_date']:
                    feature['properties']['takeover_date'] = dates['takeover_date']
                if dates['liquidation_date']:
                    feature['properties']['liquidation_date'] = dates['liquidation_date']
                if dates['dissolution_date']:
                    feature['properties']['dissolution_date'] = dates['dissolution_date']
                    
                # Update date_range field
                start = dates['registration_date'] or '?'
                end = dates['dissolution_date'] or dates['liquidation_date'] or '?'
                if start != '?' or end != '?':
                    feature['properties']['date_range'] = f"{start}-{end}"
        
        with open('public/jewish_businesses.geojson', 'w', encoding='utf-8') as f:
            json.dump(geojson_data, f, indent=2, ensure_ascii=False)
        
        return updated_count

def main():
    print("=" * 60)
    print("Re-scraping dates from HU Berlin Database")
    print("=" * 60)
    
    scraper = DateScraper()
    
    print("\nScraping first 10 pages for date information...")
    scraped_dates = scraper.scrape_first_10_pages()
    
    print(f"\nFound date information for {len(scraped_dates)} businesses")
    
    # Show sample of what we found
    sample_businesses = list(scraped_dates.items())[:3]
    print("\nSample scraped data:")
    for name, dates in sample_businesses:
        print(f"\n{name}:")
        for key, value in dates.items():
            if value and key != 'all_date_texts':
                print(f"  {key}: {value}")
    
    print("\nUpdating storymaps.json and jewish_businesses.geojson...")
    updated = scraper.update_storymaps_json(scraped_dates)
    
    print(f"\n✅ Updated {updated} businesses with proper dates")
    print("Both storymaps.json and jewish_businesses.geojson have been updated")

if __name__ == "__main__":
    main()