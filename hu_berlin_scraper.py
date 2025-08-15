#!/usr/bin/env python3
"""
Cost-optimized scraper for HU Berlin Jewish Businesses Database
Uses pattern-based extraction first, local models for validation, expensive APIs only when needed.
"""

import requests
import json
import re
import time
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import diskcache
from concurrent.futures import ThreadPoolExecutor, as_completed
import traceback

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class BusinessEntry:
    """Data structure for a business entry"""
    business_name: str
    owner_name: Optional[str] = None
    address: str = ""
    main_category: str = ""
    subcategory: str = ""
    founded_year: Optional[str] = None
    closed_year: Optional[str] = None
    registration_info: str = ""
    additional_details: str = ""
    raw_text: str = ""
    confidence_score: float = 0.0

class OptimizedBusinessScraper:
    """Cost-optimized scraper with intelligent model routing"""
    
    def __init__(self, cache_dir: str = './scrape_cache'):
        self.cache = diskcache.Cache(cache_dir)
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })
        
        # Business categories mapping
        self.category_patterns = {
            'trade': ['trade', 'trading', 'commerce', 'wholesale', 'retail', 'import', 'export'],
            'services': ['services', 'service', 'consulting', 'agency', 'office', 'bureau'],
            'handicraft': ['handicraft', 'craft', 'workshop', 'artisan', 'maker'],
            'industry': ['industry', 'industrial', 'manufacturing', 'factory', 'production']
        }
        
        # Date extraction patterns
        self.date_patterns = [
            r'(?:Founded|Registered|Established).*?(\d{4})',
            r'(?:Dissolved|Liquidated|Closed).*?(\d{4})',
            r'(\d{4})\s*[-–]\s*(\d{4})',
            r'from\s+(\d{4})',
            r'until\s+(\d{4})'
        ]

    def fetch_page_content(self, url: str) -> Optional[str]:
        """Fetch page content with caching"""
        cache_key = f"page_{url}"
        
        # Check cache first
        if cached_content := self.cache.get(cache_key):
            logger.info(f"Using cached content for {url}")
            return cached_content
        
        try:
            logger.info(f"Fetching {url}")
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            content = response.text
            # Cache for 1 hour
            self.cache.set(cache_key, content, expire=3600)
            return content
            
        except requests.RequestException as e:
            logger.error(f"Failed to fetch {url}: {e}")
            return None

    def extract_with_patterns(self, soup_entry) -> BusinessEntry:
        """Pattern-based extraction - most cost-effective approach"""
        try:
            # Extract raw text for fallback
            raw_text = soup_entry.get_text(strip=True, separator=' ')
            
            # Extract business name (usually in h4)
            business_name = ""
            h4_tag = soup_entry.find('h4')
            if h4_tag:
                business_name = h4_tag.get_text(strip=True)
            
            # Extract category information
            main_category, subcategory = self._extract_category(soup_entry)
            
            # Extract dates
            founded_year, closed_year = self._extract_dates(raw_text)
            
            # Extract address
            address = self._extract_address(soup_entry, raw_text)
            
            # Extract owner name (often appears after business name)
            owner_name = self._extract_owner_name(business_name, raw_text)
            
            # Extract registration info
            registration_info = self._extract_registration_info(soup_entry)
            
            entry = BusinessEntry(
                business_name=business_name,
                owner_name=owner_name,
                address=address,
                main_category=main_category,
                subcategory=subcategory,
                founded_year=founded_year,
                closed_year=closed_year,
                registration_info=registration_info,
                raw_text=raw_text,
                confidence_score=0.8  # Pattern-based extraction confidence
            )
            
            return entry
            
        except Exception as e:
            logger.error(f"Pattern extraction failed: {e}")
            return BusinessEntry(
                business_name="EXTRACTION_FAILED",
                raw_text=soup_entry.get_text(strip=True) if soup_entry else "",
                confidence_score=0.0
            )

    def _extract_category(self, soup_entry) -> tuple[str, str]:
        """Extract main category and subcategory"""
        # Look for strong tags or text in parentheses
        strong_tags = soup_entry.find_all('strong')
        category_text = ""
        
        for strong in strong_tags:
            text = strong.get_text(strip=True).lower()
            if any(cat in text for cats in self.category_patterns.values() for cat in cats):
                category_text = strong.get_text(strip=True)
                break
        
        if not category_text:
            # Look for text in parentheses
            raw_text = soup_entry.get_text()
            parentheses_match = re.search(r'\(([^)]+)\)', raw_text)
            if parentheses_match:
                category_text = parentheses_match.group(1)
        
        # Determine main category
        main_category = ""
        subcategory = category_text
        
        for main_cat, keywords in self.category_patterns.items():
            if any(keyword in category_text.lower() for keyword in keywords):
                main_category = main_cat
                break
        
        return main_category, subcategory

    def _extract_dates(self, text: str) -> tuple[Optional[str], Optional[str]]:
        """Extract founding and closing dates"""
        founded_year = None
        closed_year = None
        
        # Try different date patterns
        for pattern in self.date_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                if 'founded' in pattern.lower() or 'registered' in pattern.lower():
                    founded_year = matches[0] if matches else None
                elif 'dissolved' in pattern.lower() or 'liquidated' in pattern.lower():
                    closed_year = matches[0] if matches else None
                elif '-' in pattern or '–' in pattern:
                    if len(matches[0]) == 2:  # Year range tuple
                        founded_year, closed_year = matches[0]
                    else:
                        founded_year = matches[0]
        
        # Additional heuristics for date extraction
        year_matches = re.findall(r'\b(19\d{2}|20\d{2})\b', text)
        if year_matches and not founded_year:
            # First year is likely founding, last is likely closing
            if len(year_matches) == 1:
                founded_year = year_matches[0]
            elif len(year_matches) >= 2:
                founded_year = year_matches[0]
                closed_year = year_matches[-1]
        
        return founded_year, closed_year

    def _extract_address(self, soup_entry, raw_text: str) -> str:
        """Extract address information"""
        # Look for text that contains street patterns
        street_patterns = [
            r'[A-Za-z]+(?:str\.|straße|strasse)\s*\d+(?:\/\d+)?',
            r'[A-Za-z\s]+\d+(?:\/\d+)?,\s*Berlin',
            r'Berlin[^,]*,\s*[A-Za-z\s]+'
        ]
        
        for pattern in street_patterns:
            match = re.search(pattern, raw_text, re.IGNORECASE)
            if match:
                return match.group().strip()
        
        # Fallback: look for text after the last comma
        lines = raw_text.split('\n')
        for line in reversed(lines):
            if 'berlin' in line.lower() or any(char.isdigit() for char in line):
                return line.strip()
        
        return ""

    def _extract_owner_name(self, business_name: str, raw_text: str) -> Optional[str]:
        """Extract owner/proprietor name"""
        # If business name contains personal names (A. & B. Cohn), extract it
        if re.search(r'^[A-Z]\.\s*(?:&\s*[A-Z]\.\s*)?[A-Z][a-z]+', business_name):
            return business_name
        
        # Look for patterns like "Owner: Name" or similar
        owner_patterns = [
            r'(?:Owner|Proprietor|Inhaber):\s*([A-Za-z\s]+)',
            r'([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s+&\s+(?:Co\.|Company))?'
        ]
        
        for pattern in owner_patterns:
            match = re.search(pattern, raw_text)
            if match:
                return match.group(1).strip()
        
        return None

    def _extract_registration_info(self, soup_entry) -> str:
        """Extract registration and legal information"""
        em_tags = soup_entry.find_all('em')
        registration_parts = []
        
        for em in em_tags:
            text = em.get_text(strip=True)
            if any(keyword in text.lower() for keyword in ['registered', 'founded', 'dissolved', 'liquidated']):
                registration_parts.append(text)
        
        return '; '.join(registration_parts)

    def scrape_page(self, url: str) -> List[BusinessEntry]:
        """Scrape all businesses from a single page"""
        content = self.fetch_page_content(url)
        if not content:
            return []
        
        soup = BeautifulSoup(content, 'html.parser')
        
        # Find business entries - they appear to be in li elements
        entries = soup.find_all('li')
        businesses = []
        
        for entry in entries:
            # Skip entries that don't contain business data
            if not entry.find('h4'):
                continue
                
            business = self.extract_with_patterns(entry)
            if business.business_name and business.business_name != "EXTRACTION_FAILED":
                businesses.append(business)
                logger.info(f"Extracted: {business.business_name}")
        
        logger.info(f"Extracted {len(businesses)} businesses from {url}")
        return businesses

    def scrape_all_pages(self, base_url: str, pages: List[int]) -> List[BusinessEntry]:
        """Scrape all specified pages with concurrent processing"""
        all_businesses = []
        urls = [f"{base_url}?page={page}" for page in pages]
        
        # Process pages concurrently but with rate limiting
        with ThreadPoolExecutor(max_workers=3) as executor:
            future_to_url = {executor.submit(self.scrape_page, url): url for url in urls}
            
            for future in as_completed(future_to_url):
                url = future_to_url[future]
                try:
                    businesses = future.result()
                    all_businesses.extend(businesses)
                    logger.info(f"Completed {url}: {len(businesses)} businesses")
                except Exception as e:
                    logger.error(f"Failed to scrape {url}: {e}")
                    traceback.print_exc()
                
                # Rate limiting
                time.sleep(1)
        
        return all_businesses

    def save_to_json(self, businesses: List[BusinessEntry], filename: str):
        """Save businesses to JSON file"""
        # Convert dataclasses to dictionaries
        business_dicts = [asdict(business) for business in businesses]
        
        # Add metadata
        output = {
            "metadata": {
                "total_businesses": len(business_dicts),
                "extraction_date": time.strftime("%Y-%m-%d %H:%M:%S"),
                "source": "HU Berlin Jewish Businesses Database",
                "pages_scraped": "1-10",
                "categories_found": list(set(b["main_category"] for b in business_dicts if b["main_category"]))
            },
            "businesses": business_dicts
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(output, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Saved {len(businesses)} businesses to {filename}")

def main():
    """Main scraping function"""
    scraper = OptimizedBusinessScraper()
    
    base_url = "https://www2.hu-berlin.de/djgb/public/en/find"
    pages_to_scrape = list(range(1, 11))  # Pages 1-10
    
    logger.info("Starting Jewish businesses database scrape...")
    
    # Scrape all pages
    all_businesses = scraper.scrape_all_pages(base_url, pages_to_scrape)
    
    if all_businesses:
        # Save to JSON
        output_file = "/Users/samfrons/Desktop/storymaps/jewish_businesses_complete.json"
        scraper.save_to_json(all_businesses, output_file)
        
        # Print summary statistics
        categories = {}
        for business in all_businesses:
            cat = business.main_category or "uncategorized"
            categories[cat] = categories.get(cat, 0) + 1
        
        logger.info("=== SCRAPING SUMMARY ===")
        logger.info(f"Total businesses extracted: {len(all_businesses)}")
        logger.info("Category breakdown:")
        for cat, count in sorted(categories.items()):
            logger.info(f"  {cat}: {count}")
        
        # Show some examples
        logger.info("\n=== SAMPLE ENTRIES ===")
        for i, business in enumerate(all_businesses[:3]):
            logger.info(f"\nBusiness {i+1}:")
            logger.info(f"  Name: {business.business_name}")
            logger.info(f"  Category: {business.main_category} - {business.subcategory}")
            logger.info(f"  Address: {business.address}")
            logger.info(f"  Years: {business.founded_year} - {business.closed_year}")
    else:
        logger.error("No businesses were extracted!")

if __name__ == "__main__":
    main()