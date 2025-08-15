#!/usr/bin/env python3
"""
Cost-optimized scraper for HU Berlin Jewish Businesses Database - Batch 3 (Pages 151-400)
Uses the same successful pattern-based extraction approach as batches 1 and 2.
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
    """Enhanced data structure for a business entry"""
    business_name: str
    owner_name: Optional[str] = None
    address: str = ""
    main_category: str = ""
    subcategory: str = ""
    detailed_subcategory: str = ""
    founded_year: Optional[str] = None
    closed_year: Optional[str] = None
    liquidation_date: Optional[str] = None
    registration_info: str = ""
    additional_details: str = ""
    raw_text: str = ""
    confidence_score: float = 0.0

class Batch3BusinessScraper:
    """Cost-optimized scraper for pages 151-400 using successful pattern-based approach"""
    
    def __init__(self, cache_dir: str = './scrape_cache'):
        self.cache = diskcache.Cache(cache_dir)
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        
        # Enhanced business categories mapping (same as successful scraper)
        self.category_patterns = {
            'trade': ['trade', 'trading', 'commerce', 'wholesale', 'retail', 'import', 'export', 'handel'],
            'services': ['services', 'service', 'consulting', 'agency', 'office', 'bureau', 'dienstleistung'],
            'handicraft': ['handicraft', 'craft', 'workshop', 'artisan', 'maker', 'handwerk'],
            'industry': ['industry', 'industrial', 'manufacturing', 'factory', 'production', 'industrie']
        }
        
        # Enhanced date extraction patterns (same as successful scraper)
        self.date_patterns = [
            r'Gründung\s+(\d{4})',  # German founding
            r'Erloschen\s+(\d{4})',  # German dissolution
            r'Liquidation.*?(\d{4})',  # Liquidation
            r'Besitzübernahme\s+(\d{4})',  # Takeover
            r'(\d{4})\s*[-–]\s*(\d{4})',  # Year range
            r'ab\s+(\d{4}-\d{2}-\d{2})',  # From specific date
        ]
        
        # Subcategory extraction patterns (same as successful scraper)
        self.subcategory_patterns = [
            r'([a-zA-Z\s,&-]+)\s*\(\s*Trade\s*\)',
            r'([a-zA-Z\s,&-]+)\s*\(\s*Industry\s*\)',
            r'([a-zA-Z\s,&-]+)\s*\(\s*Services\s*\)',
            r'([a-zA-Z\s,&-]+)\s*\(\s*Handicraft\s*\)',
        ]

    def fetch_page_content(self, url: str) -> Optional[str]:
        """Fetch page content with caching"""
        cache_key = f"batch3_page_{url}"
        
        # Check cache first
        if cached_content := self.cache.get(cache_key):
            logger.info(f"Using cached content for {url}")
            return cached_content
        
        try:
            logger.info(f"Fetching {url}")
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            content = response.text
            # Cache for 2 hours (longer than original to minimize re-fetching)
            self.cache.set(cache_key, content, expire=7200)
            return content
            
        except requests.RequestException as e:
            logger.error(f"Failed to fetch {url}: {e}")
            return None

    def extract_with_enhanced_patterns(self, soup_entry) -> BusinessEntry:
        """Enhanced pattern-based extraction (same logic as successful scraper)"""
        try:
            # Extract raw text for fallback
            raw_text = soup_entry.get_text(strip=True, separator=' ')
            
            # Extract business name (usually in h4)
            business_name = ""
            h4_tag = soup_entry.find('h4')
            if h4_tag:
                business_name = h4_tag.get_text(strip=True)
            
            # Enhanced category and subcategory extraction
            main_category, subcategory, detailed_subcategory = self._extract_enhanced_categories(soup_entry, raw_text)
            
            # Enhanced date extraction
            founded_year, closed_year, liquidation_date = self._extract_enhanced_dates(raw_text)
            
            # Extract address with better patterns
            address = self._extract_enhanced_address(soup_entry, raw_text)
            
            # Extract owner name
            owner_name = self._extract_owner_name(business_name, raw_text)
            
            # Enhanced registration info extraction
            registration_info = self._extract_enhanced_registration_info(raw_text)
            
            # Extract additional business details
            additional_details = self._extract_additional_details(raw_text)
            
            entry = BusinessEntry(
                business_name=business_name,
                owner_name=owner_name,
                address=address,
                main_category=main_category,
                subcategory=subcategory,
                detailed_subcategory=detailed_subcategory,
                founded_year=founded_year,
                closed_year=closed_year,
                liquidation_date=liquidation_date,
                registration_info=registration_info,
                additional_details=additional_details,
                raw_text=raw_text,
                confidence_score=0.9  # High confidence for pattern-based extraction
            )
            
            return entry
            
        except Exception as e:
            logger.error(f"Enhanced extraction failed: {e}")
            return BusinessEntry(
                business_name="EXTRACTION_FAILED",
                raw_text=soup_entry.get_text(strip=True) if soup_entry else "",
                confidence_score=0.0
            )

    def _extract_enhanced_categories(self, soup_entry, raw_text: str) -> tuple[str, str, str]:
        """Extract main category, subcategory, and detailed subcategory (same as successful scraper)"""
        # Extract the detailed subcategory from the text before the category in parentheses
        detailed_subcategory = ""
        
        # Look for patterns like "textiles and clothing ( Trade )"
        for pattern in self.subcategory_patterns:
            match = re.search(pattern, raw_text, re.IGNORECASE)
            if match:
                detailed_subcategory = match.group(1).strip()
                break
        
        # Look for strong tags or text in parentheses for main category
        strong_tags = soup_entry.find_all('strong')
        category_text = ""
        
        for strong in strong_tags:
            text = strong.get_text(strip=True).lower()
            if any(cat in text for cats in self.category_patterns.values() for cat in cats):
                category_text = strong.get_text(strip=True)
                break
        
        if not category_text:
            # Look for text in parentheses
            parentheses_match = re.search(r'\(\s*([^)]+)\s*\)', raw_text)
            if parentheses_match:
                category_text = parentheses_match.group(1)
        
        # Determine main category
        main_category = ""
        subcategory = category_text
        
        for main_cat, keywords in self.category_patterns.items():
            if any(keyword in category_text.lower() for keyword in keywords):
                main_category = main_cat
                break
        
        return main_category, subcategory, detailed_subcategory

    def _extract_enhanced_dates(self, text: str) -> tuple[Optional[str], Optional[str], Optional[str]]:
        """Enhanced date extraction with liquidation dates (same as successful scraper)"""
        founded_year = None
        closed_year = None
        liquidation_date = None
        
        # Extract specific liquidation dates
        liquidation_match = re.search(r'Liquidation ab (\d{4}-\d{2}-\d{2})', text)
        if liquidation_match:
            liquidation_date = liquidation_match.group(1)
        
        # Extract founding year
        founding_match = re.search(r'Gründung\s+(\d{4})', text)
        if founding_match:
            founded_year = founding_match.group(1)
        
        # Extract closing year
        closing_patterns = [r'Erloschen\s+(\d{4})', r'Besitzübernahme\s+(\d{4})']
        for pattern in closing_patterns:
            match = re.search(pattern, text)
            if match:
                closed_year = match.group(1)
                break
        
        # Fallback to general year extraction if specific patterns don't match
        if not founded_year or not closed_year:
            year_matches = re.findall(r'\b(19\d{2}|20\d{2})\b', text)
            if year_matches:
                if not founded_year and len(year_matches) >= 1:
                    founded_year = year_matches[0]
                if not closed_year and len(year_matches) >= 2:
                    closed_year = year_matches[-1]
        
        return founded_year, closed_year, liquidation_date

    def _extract_enhanced_address(self, soup_entry, raw_text: str) -> str:
        """Enhanced address extraction with better patterns (same as successful scraper)"""
        # Enhanced street patterns for German addresses
        street_patterns = [
            r'([A-Za-zäöüß]+(?:str\.|straße|strasse)\s*\d+(?:\/\d+)?(?:,\s*Berlin)?)',
            r'([A-Za-zäöüß\s]+\d+(?:\/\d+)?,\s*Berlin)',
            r'(Berlin[^,\n]*,[^,\n]*)',
            r'([A-Za-zäöüß\s]+Ufer\s+\d+(?:,\s*Berlin)?)',  # For "Ufer" streets
            r'([A-Za-zäöüß\s]+Platz\s+\d+(?:,\s*Berlin)?)', # For "Platz" addresses
        ]
        
        for pattern in street_patterns:
            match = re.search(pattern, raw_text, re.IGNORECASE)
            if match:
                address = match.group(1).strip()
                # Clean up the address
                address = re.sub(r',\s*Berlin$', ', Berlin', address)
                if not address.endswith('Berlin') and 'berlin' not in address.lower():
                    address += ', Berlin'
                return address
        
        # Fallback: extract any line with numbers that might be an address
        lines = raw_text.split('\n')
        for line in lines:
            line = line.strip()
            if re.search(r'\d+', line) and len(line) < 100:  # Has numbers and not too long
                if 'berlin' in line.lower() or any(street_word in line.lower() for street_word in ['str.', 'straße', 'strasse', 'ufer', 'platz']):
                    return line
        
        return ""

    def _extract_owner_name(self, business_name: str, raw_text: str) -> Optional[str]:
        """Extract owner/proprietor name (same as successful scraper)"""
        # If business name contains personal names (A. & B. Cohn), extract it
        if re.search(r'^[A-Z]\.\s*(?:&\s*[A-Z]\.\s*)?[A-Z][a-z]+', business_name):
            return business_name
        
        # Look for patterns like "Inhaber:" or owner information
        owner_patterns = [
            r'(?:Owner|Proprietor|Inhaber):\s*([A-Za-zäöüß\s]+)',
            r'([A-Z][a-zäöüß]+\s+[A-Z][a-zäöüß]+)(?:\s+&\s+(?:Co\.|Company|Cie))?'
        ]
        
        for pattern in owner_patterns:
            match = re.search(pattern, raw_text)
            if match:
                return match.group(1).strip()
        
        return None

    def _extract_enhanced_registration_info(self, raw_text: str) -> str:
        """Extract enhanced registration information (same as successful scraper)"""
        registration_patterns = [
            r'Eingetragen im Handelsregister[^.]*',
            r'Gründung \d{4}[^.]*',
            r'Erloschen \d{4}[^.]*',
            r'Liquidation[^.]*',
            r'Besitzübernahme[^.]*'
        ]
        
        registration_parts = []
        for pattern in registration_patterns:
            matches = re.findall(pattern, raw_text, re.IGNORECASE)
            registration_parts.extend(matches)
        
        return '; '.join(registration_parts)

    def _extract_additional_details(self, raw_text: str) -> str:
        """Extract additional business details and context (same as successful scraper)"""
        # Look for any additional business information
        details = []
        
        # Extract company type information
        company_types = re.findall(r'\b(GmbH|AG|KG|Nachf\.|& Co|& Cie)\b', raw_text)
        if company_types:
            details.append(f"Company types: {', '.join(set(company_types))}")
        
        # Extract any special business designations
        special_designations = re.findall(r'\b(Apotheke|Verlag|Fabrik|Bankgeschäft)\b', raw_text)
        if special_designations:
            details.append(f"Business type: {', '.join(set(special_designations))}")
        
        return '; '.join(details)

    def scrape_page(self, url: str) -> List[BusinessEntry]:
        """Scrape all businesses from a single page with enhanced extraction"""
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
                
            business = self.extract_with_enhanced_patterns(entry)
            if business.business_name and business.business_name != "EXTRACTION_FAILED":
                businesses.append(business)
                logger.info(f"Extracted: {business.business_name} ({business.main_category})")
        
        logger.info(f"Extracted {len(businesses)} businesses from {url}")
        return businesses

    def scrape_all_pages(self, base_url: str, pages: List[int]) -> List[BusinessEntry]:
        """Scrape all specified pages with concurrent processing and rate limiting"""
        all_businesses = []
        urls = [f"{base_url}&page={page}" for page in pages]
        
        # Process pages concurrently but with conservative rate limiting (3 workers max)
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
                
                # Conservative rate limiting - 2 second delay between requests
                time.sleep(2)
        
        return all_businesses

    def save_to_json(self, businesses: List[BusinessEntry], filename: str, pages_range: str):
        """Save businesses to JSON file with enhanced metadata"""
        # Convert dataclasses to dictionaries
        business_dicts = [asdict(business) for business in businesses]
        
        # Create detailed category statistics
        category_stats = {}
        subcategory_stats = {}
        detailed_subcategory_stats = {}
        
        for business in business_dicts:
            # Main categories
            main_cat = business["main_category"] or "uncategorized"
            category_stats[main_cat] = category_stats.get(main_cat, 0) + 1
            
            # Subcategories
            sub_cat = business["subcategory"] or "unspecified"
            subcategory_stats[sub_cat] = subcategory_stats.get(sub_cat, 0) + 1
            
            # Detailed subcategories
            detailed_sub = business["detailed_subcategory"] or "unspecified"
            detailed_subcategory_stats[detailed_sub] = detailed_subcategory_stats.get(detailed_sub, 0) + 1
        
        # Add enhanced metadata
        output = {
            "metadata": {
                "total_businesses": len(business_dicts),
                "extraction_date": time.strftime("%Y-%m-%d %H:%M:%S"),
                "source": "HU Berlin Jewish Businesses Database",
                "pages_scraped": pages_range,
                "extraction_method": "Cost-optimized pattern-based extraction with enhanced categorization",
                "scraper_version": "batch_3_v1.0",
                "rate_limiting": "3 concurrent workers, 2 second delays",
                "categories_found": list(category_stats.keys()),
                "category_statistics": category_stats,
                "subcategory_statistics": subcategory_stats,
                "detailed_subcategory_statistics": detailed_subcategory_stats
            },
            "businesses": business_dicts
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(output, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Saved {len(businesses)} businesses to {filename}")

def main():
    """Main scraping function for pages 151-400"""
    scraper = Batch3BusinessScraper()
    
    base_url = "https://www2.hu-berlin.de/djgb/public/en/find?q=&fq=&sort=unternehmenasc"
    pages_to_scrape = list(range(151, 401))  # Pages 151-400 (250 pages total)
    
    logger.info("Starting Jewish businesses database scrape for pages 151-400...")
    logger.info(f"Total pages to scrape: {len(pages_to_scrape)}")
    
    # Scrape all pages
    all_businesses = scraper.scrape_all_pages(base_url, pages_to_scrape)
    
    if all_businesses:
        # Save to JSON
        output_file = "/Users/samfrons/Desktop/storymaps/jewish_businesses_batch_3.json"
        scraper.save_to_json(all_businesses, output_file, "151-400")
        
        # Print detailed summary statistics
        categories = {}
        detailed_subcategories = {}
        founding_years = []
        closing_years = []
        
        for business in all_businesses:
            cat = business.main_category or "uncategorized"
            categories[cat] = categories.get(cat, 0) + 1
            
            detailed_sub = business.detailed_subcategory or "unspecified"
            detailed_subcategories[detailed_sub] = detailed_subcategories.get(detailed_sub, 0) + 1
            
            if business.founded_year:
                try:
                    founding_years.append(int(business.founded_year))
                except ValueError:
                    pass
            
            if business.closed_year:
                try:
                    closing_years.append(int(business.closed_year))
                except ValueError:
                    pass
        
        logger.info("=== BATCH 3 SCRAPING SUMMARY ===")
        logger.info(f"Total businesses extracted: {len(all_businesses)}")
        logger.info(f"Expected businesses (approx.): ~2500 (10 per page × 250 pages)")
        logger.info(f"Extraction rate: {len(all_businesses)/2500*100:.1f}%")
        
        logger.info("\nMain category breakdown:")
        for cat, count in sorted(categories.items()):
            logger.info(f"  {cat}: {count}")
        
        if founding_years:
            logger.info(f"\nFounding years range: {min(founding_years)} - {max(founding_years)}")
        if closing_years:
            logger.info(f"Closing years range: {min(closing_years)} - {max(closing_years)}")
        
        logger.info("\nTop detailed subcategories:")
        sorted_subcats = sorted(detailed_subcategories.items(), key=lambda x: x[1], reverse=True)[:15]
        for subcat, count in sorted_subcats:
            if subcat and subcat != "unspecified" and count > 1:
                logger.info(f"  {subcat}: {count}")
        
        # Show sample entries
        logger.info("\n=== SAMPLE ENTRIES ===")
        for i, business in enumerate(all_businesses[:3]):
            logger.info(f"\nBusiness {i+1}:")
            logger.info(f"  Name: {business.business_name}")
            logger.info(f"  Category: {business.main_category}")
            if business.detailed_subcategory:
                logger.info(f"  Detailed Subcategory: {business.detailed_subcategory}")
            logger.info(f"  Address: {business.address}")
            logger.info(f"  Years: {business.founded_year} - {business.closed_year}")
            if business.liquidation_date:
                logger.info(f"  Liquidation: {business.liquidation_date}")
    else:
        logger.error("No businesses were extracted!")

if __name__ == "__main__":
    main()