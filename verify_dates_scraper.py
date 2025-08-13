#!/usr/bin/env python3
"""
Verify and update dates for businesses from pages 1-10 of HU Berlin database
"""

import requests
from bs4 import BeautifulSoup
import json
import time
import re
from typing import Dict, List, Optional

class DateVerificationScraper:
    def __init__(self):
        self.base_url = "https://www2.hu-berlin.de/djgb/public/en/find"
        self.all_businesses = {}
        
    def extract_all_dates(self, listing):
        """Extract ALL date information from a business listing"""
        dates = {
            'registration_date': None,
            'dissolution_date': None,
            'takeover_date': None,
            'liquidation_date': None,
            'deletion_date': None,
            'all_date_texts': []
        }
        
        # Get all text content
        text_content = listing.get_text(' ', strip=True)
        
        # Find all divs that might contain dates
        date_divs = listing.find_all('div', class_='mt5')
        
        for div in date_divs:
            div_text = div.get_text(strip=True)
            if div_text:
                dates['all_date_texts'].append(div_text)
                
                # Registration/Founding dates
                if 'Gründung' in div_text:
                    match = re.search(r'Gründung\s*(\d{4})', div_text)
                    if match:
                        dates['registration_date'] = match.group(1)
                elif 'Eingetragen' in div_text:
                    match = re.search(r'Eingetragen\s*(\d{4})', div_text)
                    if match:
                        dates['registration_date'] = match.group(1)
                
                # Dissolution dates
                if 'Erloschen' in div_text:
                    match = re.search(r'Erloschen\s*(\d{4})', div_text)
                    if match:
                        dates['dissolution_date'] = match.group(1)
                
                # Deletion dates
                if 'Löschung' in div_text:
                    match = re.search(r'Löschung\s*(\d{4})', div_text)
                    if match:
                        dates['deletion_date'] = match.group(1)
                
                # Takeover dates
                if 'Besitzübernahme' in div_text:
                    match = re.search(r'Besitzübernahme\s*(\d{4})', div_text)
                    if match:
                        dates['takeover_date'] = match.group(1)
                
                # Liquidation dates
                if 'Liquidation' in div_text:
                    # Various patterns for liquidation
                    patterns = [
                        r'Liquidation\s*ab\s*(\d{4})',
                        r'Liquidation\s*(\d{4})',
                        r'Liquidation.*?(\d{4})'
                    ]
                    for pattern in patterns:
                        match = re.search(pattern, div_text)
                        if match:
                            dates['liquidation_date'] = match.group(1)
                            break
        
        # Also check for dates in any italic text
        em_tags = listing.find_all('em')
        for em in em_tags:
            em_text = em.get_text(strip=True)
            if re.search(r'\d{4}', em_text):
                dates['all_date_texts'].append(em_text)
        
        return dates
    
    def scrape_page(self, page_num: int) -> Dict:
        """Scrape a single page and extract all business information"""
        url = f"{self.base_url}?page={page_num}"
        print(f"\nScraping page {page_num}...")
        
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            
            listings = soup.find_all('li', class_='list-group-item')
            page_businesses = {}
            
            for listing in listings:
                # Get business name
                h4 = listing.find('h4')
                if h4:
                    name = h4.get_text(strip=True)
                    
                    # Get business type
                    business_type = None
                    em = listing.find('em')
                    if em:
                        business_type = em.get_text(strip=True)
                    
                    # Get address
                    address = None
                    for div in listing.find_all('div', class_='col-md-4'):
                        if div.find('i', class_='fa-calendar-o'):
                            address_text = div.get_text(strip=True)
                            # Clean address
                            address = re.sub(r'\s+', ' ', address_text)
                            if address and not address.endswith('Berlin'):
                                address += ', Berlin'
                    
                    # Extract all dates
                    dates = self.extract_all_dates(listing)
                    
                    page_businesses[name] = {
                        'name': name,
                        'business_type': business_type,
                        'address': address,
                        'dates': dates
                    }
                    
                    # Print summary for this business
                    if dates['dissolution_date'] or dates['takeover_date'] or dates['liquidation_date']:
                        print(f"  {name}:")
                        if dates['registration_date']:
                            print(f"    Registration: {dates['registration_date']}")
                        if dates['dissolution_date']:
                            print(f"    Dissolution: {dates['dissolution_date']}")
                        if dates['takeover_date']:
                            print(f"    Takeover: {dates['takeover_date']}")
                        if dates['liquidation_date']:
                            print(f"    Liquidation: {dates['liquidation_date']}")
            
            return page_businesses
            
        except Exception as e:
            print(f"Error scraping page {page_num}: {e}")
            return {}
    
    def scrape_pages_1_to_10(self):
        """Scrape pages 1-10 and collect all business data"""
        print("=" * 60)
        print("Verifying dates from pages 1-10 of HU Berlin Database")
        print("=" * 60)
        
        for page in range(1, 11):
            page_businesses = self.scrape_page(page)
            self.all_businesses.update(page_businesses)
            time.sleep(0.5)  # Be respectful to the server
        
        print(f"\n✓ Found {len(self.all_businesses)} businesses total")
        return self.all_businesses
    
    def compare_with_existing_data(self, scraped_data):
        """Compare scraped data with existing JSON to find missing dates"""
        # Load existing data
        with open('data/storymaps.json', 'r', encoding='utf-8') as f:
            existing_stories = json.load(f)
        
        updates_needed = []
        
        for story in existing_stories:
            if story.get('author') == 'HU Berlin Database':
                name = story['title']
                
                if name in scraped_data:
                    business_data = scraped_data[name]
                    dates = business_data['dates']
                    
                    update = {'id': story['id'], 'name': name, 'changes': []}
                    
                    # Check for missing or incorrect dates
                    if dates['registration_date'] and not story.get('startDate'):
                        update['changes'].append(('startDate', f"{dates['registration_date']}-01-01"))
                    
                    if dates['dissolution_date'] and story.get('endDate') in [None, 'Unknown']:
                        update['changes'].append(('endDate', f"{dates['dissolution_date']}-01-01"))
                    
                    if dates['takeover_date'] and not story.get('midDate'):
                        update['changes'].append(('midDate', f"{dates['takeover_date']}-01-01"))
                    elif dates['liquidation_date'] and not story.get('midDate'):
                        update['changes'].append(('midDate', f"{dates['liquidation_date']}-01-01"))
                    
                    if update['changes']:
                        updates_needed.append(update)
        
        return updates_needed
    
    def apply_updates(self, updates):
        """Apply the updates to storymaps.json"""
        with open('data/storymaps.json', 'r', encoding='utf-8') as f:
            stories = json.load(f)
        
        update_count = 0
        
        for update in updates:
            for story in stories:
                if story['id'] == update['id']:
                    for field, value in update['changes']:
                        story[field] = value
                        update_count += 1
                        print(f"Updated {update['name']}: {field} = {value}")
        
        # Save updated data
        with open('data/storymaps.json', 'w', encoding='utf-8') as f:
            json.dump(stories, f, indent=2, ensure_ascii=False)
        
        return update_count

def main():
    scraper = DateVerificationScraper()
    
    # Scrape pages 1-10
    scraped_data = scraper.scrape_pages_1_to_10()
    
    # Save raw scraped data for reference
    with open('scraped_pages_1_10_verified.json', 'w', encoding='utf-8') as f:
        json.dump(scraped_data, f, indent=2, ensure_ascii=False)
    print(f"\n✓ Saved raw scraped data to scraped_pages_1_10_verified.json")
    
    # Compare with existing data
    print("\n" + "=" * 60)
    print("Comparing with existing storymaps.json...")
    print("=" * 60)
    
    updates = scraper.compare_with_existing_data(scraped_data)
    
    if updates:
        print(f"\nFound {len(updates)} businesses needing updates:")
        for update in updates:
            print(f"\n{update['name']}:")
            for field, value in update['changes']:
                print(f"  {field}: {value}")
        
        # Apply updates
        print("\n" + "=" * 60)
        print("Applying updates to storymaps.json...")
        print("=" * 60)
        
        update_count = scraper.apply_updates(updates)
        print(f"\n✅ Applied {update_count} updates to storymaps.json")
    else:
        print("\n✅ All dates appear to be up to date!")
    
    # Print summary of businesses with important dates
    print("\n" + "=" * 60)
    print("Summary of businesses with dissolution/takeover dates:")
    print("=" * 60)
    
    businesses_with_dates = 0
    for name, data in scraped_data.items():
        dates = data['dates']
        if dates['dissolution_date'] or dates['takeover_date'] or dates['liquidation_date']:
            businesses_with_dates += 1
    
    print(f"\n✓ {businesses_with_dates} businesses have dissolution/takeover/liquidation dates")
    print(f"✓ {len(scraped_data) - businesses_with_dates} businesses have no end date information")

if __name__ == "__main__":
    main()