# Jewish Business Database Scraper Documentation

## Overview
This document describes how to scrape the HU Berlin Jewish Business Database (https://www2.hu-berlin.de/djgb/public/en/find) and integrate the data into the StoryMaps project, using local LLMs to minimize API token usage.

## Database Information
- **Total Pages**: 1,013 pages
- **Businesses per page**: ~8-10 entries
- **Total businesses**: ~8,000-10,000 entries
- **Base URL**: https://www2.hu-berlin.de/djgb/public/en/find?page={page_number}

## Using Local LLMs with Ollama (Token-Free Processing)

### Why Use Ollama?
- **No API costs**: Run models locally without using Claude/OpenAI tokens
- **Privacy**: Data stays on your machine
- **Batch processing**: Can run continuously without cost concerns

### Setting Up Ollama

1. **Install Ollama**
   ```bash
   # macOS
   brew install ollama
   
   # Linux
   curl -fsSL https://ollama.ai/install.sh | sh
   ```

2. **Download Models**
   ```bash
   # For code generation and data processing
   ollama pull codellama:7b
   
   # For text extraction and analysis
   ollama pull llama2:7b
   
   # For lighter tasks
   ollama pull mistral:7b
   ```

3. **Start Ollama Server**
   ```bash
   ollama serve
   ```

### Using Ollama for Data Extraction

```python
import requests
import json

class OllamaProcessor:
    def __init__(self, model="mistral:7b"):
        self.model = model
        self.api_url = "http://localhost:11434/api/generate"
    
    def extract_business_info(self, html_content):
        """Use Ollama to extract structured data from HTML"""
        prompt = f"""
        Extract business information from this HTML as JSON:
        
        HTML:
        {html_content}
        
        Return JSON with these fields:
        - name: business name
        - business_type: type of business
        - address: full address
        - registration_date: founding/registration year
        - dissolution_date: closing/dissolution year
        - takeover_date: ownership transfer year
        - liquidation_date: liquidation year
        
        Return ONLY valid JSON, no explanation.
        """
        
        response = requests.post(self.api_url, json={
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "format": "json"
        })
        
        result = response.json()
        return json.loads(result['response'])
    
    def clean_addresses_batch(self, addresses):
        """Use Ollama to normalize addresses"""
        prompt = f"""
        Normalize these German addresses for geocoding.
        Add 'Berlin, Germany' if missing.
        Fix formatting issues.
        
        Addresses:
        {json.dumps(addresses)}
        
        Return as JSON array of cleaned addresses.
        """
        
        response = requests.post(self.api_url, json={
            "model": self.model,
            "prompt": prompt,
            "stream": False
        })
        
        return response.json()['response']
```

### Hybrid Approach: BeautifulSoup + Ollama

For best results, combine traditional parsing with LLM enhancement:

```python
def hybrid_extraction(self, listing_html):
    """Combine BeautifulSoup for structure, Ollama for complex text"""
    
    # Step 1: Basic extraction with BeautifulSoup
    soup = BeautifulSoup(listing_html, 'html.parser')
    basic_data = {
        'name': soup.find('h4').get_text(strip=True) if soup.find('h4') else None,
        'raw_text': soup.get_text(strip=True)
    }
    
    # Step 2: Use Ollama for complex date extraction
    if 'Erloschen' in basic_data['raw_text'] or 'Liquidation' in basic_data['raw_text']:
        ollama = OllamaProcessor()
        dates = ollama.extract_dates(basic_data['raw_text'])
        basic_data.update(dates)
    
    return basic_data
```

### Batch Processing with Ollama

```python
def process_page_with_ollama(page_html):
    """Process entire page with local LLM"""
    
    ollama = OllamaProcessor(model="codellama:7b")
    
    # Send entire page to Ollama for extraction
    prompt = f"""
    Extract all Jewish businesses from this HTML page.
    Each business should have: name, type, address, dates.
    
    HTML:
    {page_html[:5000]}  # Limit context size
    
    Return as JSON array.
    """
    
    businesses = ollama.extract_business_info(page_html)
    return businesses
```

### Running Ollama in Docker (Optional)

```yaml
# docker-compose.yml
version: '3.8'
services:
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ./ollama:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]  # If you have GPU
```

### Cost Comparison

| Method | 1,000 pages | 10,000 businesses | Cost |
|--------|------------|-------------------|------|
| Claude API | ~500K tokens | ~2M tokens | $15-30 |
| GPT-4 API | ~500K tokens | ~2M tokens | $20-40 |
| Ollama (local) | Unlimited | Unlimited | $0 |

### Ollama Script for Full Scraping

```python
#!/usr/bin/env python3
"""
Scrape Jewish Business Database using Ollama for processing
No API tokens required!
"""

import requests
from bs4 import BeautifulSoup
import json
import time
from typing import Dict, List

class TokenFreeScraper:
    def __init__(self):
        self.base_url = "https://www2.hu-berlin.de/djgb/public/en/find"
        self.ollama_url = "http://localhost:11434/api/generate"
        self.model = "mistral:7b"  # or codellama:7b for better structure
    
    def extract_with_ollama(self, html_content):
        """Use local LLM to extract business data"""
        
        # Create focused prompt
        prompt = f"""
        Extract business information from HTML.
        Look for:
        - Business name (in <h4> tags)
        - Business type (in <em> tags)  
        - Address (near calendar icon)
        - Dates: Gründung (founding), Erloschen (dissolved), Besitzübernahme (takeover), Liquidation
        
        HTML snippet:
        {html_content[:2000]}
        
        Return ONLY JSON:
        {{"name": "", "type": "", "address": "", "founding": "", "dissolved": "", "takeover": "", "liquidation": ""}}
        """
        
        try:
            response = requests.post(self.ollama_url, json={
                "model": self.model,
                "prompt": prompt,
                "stream": False,
                "temperature": 0.1  # Low temperature for consistency
            }, timeout=30)
            
            result = response.json()
            return json.loads(result['response'])
        except:
            # Fallback to BeautifulSoup if Ollama fails
            return self.fallback_extraction(html_content)
    
    def fallback_extraction(self, html_content):
        """Pure Python extraction without LLM"""
        soup = BeautifulSoup(html_content, 'html.parser')
        # ... regular BeautifulSoup extraction ...
        return extracted_data
    
    def run_complete_scraping(self, start_page=1, end_page=1013):
        """Run full scraping with Ollama"""
        
        print("Starting token-free scraping with Ollama...")
        print(f"Model: {self.model}")
        
        all_businesses = []
        
        for page_num in range(start_page, end_page + 1):
            print(f"Page {page_num}/{end_page}")
            
            # Fetch page
            response = requests.get(f"{self.base_url}?page={page_num}")
            
            # Extract with Ollama
            businesses = self.extract_with_ollama(response.text)
            all_businesses.extend(businesses)
            
            # Save progress
            if page_num % 10 == 0:
                with open(f'progress_{page_num}.json', 'w') as f:
                    json.dump(all_businesses, f)
            
            time.sleep(0.5)  # Be nice to the server
        
        return all_businesses

if __name__ == "__main__":
    # Check Ollama is running
    try:
        response = requests.get("http://localhost:11434/api/tags")
        print("✓ Ollama is running")
    except:
        print("✗ Please start Ollama: ollama serve")
        exit(1)
    
    scraper = TokenFreeScraper()
    businesses = scraper.run_complete_scraping(1, 10)  # Test with 10 pages
    
    print(f"Extracted {len(businesses)} businesses with zero API tokens!")
```

### Advanced: Using Multiple Models

```python
class MultiModelProcessor:
    """Use different models for different tasks"""
    
    def __init__(self):
        self.models = {
            'extraction': 'codellama:7b',     # Good at structured data
            'translation': 'llama2:7b',       # Good at German->English
            'cleaning': 'mistral:7b',         # Fast for simple tasks
        }
    
    def process_business(self, html):
        # Use CodeLlama for extraction
        data = self.extract_with_model(html, self.models['extraction'])
        
        # Use Llama2 for German text
        if self.has_german_text(data):
            data = self.translate_with_model(data, self.models['translation'])
        
        # Use Mistral for cleaning
        data = self.clean_with_model(data, self.models['cleaning'])
        
        return data
```

### Memory Management for Large Datasets

```python
def stream_process_with_ollama(start_page, end_page):
    """Process in chunks to manage memory"""
    
    CHUNK_SIZE = 50  # Process 50 pages at a time
    
    for chunk_start in range(start_page, end_page, CHUNK_SIZE):
        chunk_end = min(chunk_start + CHUNK_SIZE, end_page)
        
        # Process chunk with Ollama
        chunk_data = process_chunk(chunk_start, chunk_end)
        
        # Save chunk immediately
        save_chunk(chunk_data, f"chunk_{chunk_start}_{chunk_end}.json")
        
        # Clear memory
        del chunk_data
        
        print(f"Completed pages {chunk_start}-{chunk_end}")
```

### Performance Tips for Ollama

1. **Model Selection**
   - `mistral:7b` - Fastest, good for simple extraction
   - `codellama:7b` - Best for structured data
   - `llama2:13b` - More accurate but slower
   - `phi-2` - Very fast, small model (2.7B)

2. **Optimization**
   ```python
   # Preload model
   ollama run mistral:7b "test"
   
   # Use lower temperature for consistency
   "temperature": 0.1
   
   # Limit context to relevant parts
   html_content[:2000]  # Don't send entire page
   ```

3. **Parallel Processing**
   ```python
   from concurrent.futures import ThreadPoolExecutor
   
   def parallel_ollama_processing(pages):
       with ThreadPoolExecutor(max_workers=4) as executor:
           results = executor.map(process_with_ollama, pages)
       return list(results)
   ```

## Data Fields to Extract

### Primary Fields
1. **Business Name** - Found in `<h4>` tags
2. **Business Type** - Found in `<em>` tags (e.g., "textiles and clothing", "banks and insurance")
3. **Address** - Found in divs with calendar icon
4. **Registration Date** - Look for "Eingetragen" or "Gründung"
5. **Dissolution Date** - Look for "Erloschen" (dissolved/expired)
6. **Takeover Date** - Look for "Besitzübernahme" (ownership transfer)
7. **Liquidation Date** - Look for "Liquidation ab" patterns

### Date Extraction Patterns
```python
# Registration/Founding
if 'Gründung' in text:
    # Extract: "Gründung 1931"
if 'Eingetragen' in text:
    # Extract: "Eingetragen 1870"

# Dissolution
if 'Erloschen' in text:
    # Extract: "Erloschen 1937"
if 'Löschung' in text:
    # Extract: "Löschung 1940"

# Takeover
if 'Besitzübernahme' in text:
    # Extract: "Besitzübernahme 1938"

# Liquidation
if 'Liquidation' in text:
    # Extract: "Liquidation ab 1930-12-30"
```

## Scraping Process

### 1. Initial Setup
```python
import requests
from bs4 import BeautifulSoup
import json
import time
from typing import Dict, List, Optional

class JewishBusinessScraper:
    def __init__(self):
        self.base_url = "https://www2.hu-berlin.de/djgb/public/en/find"
        self.headers = {
            'User-Agent': 'JewishBusinessDatabase/1.0 (your-email@example.com)'
        }
```

### 2. Page Scraping
```python
def scrape_page(self, page_num: int) -> List[Dict]:
    url = f"{self.base_url}?page={page_num}"
    response = requests.get(url, headers=self.headers, timeout=30)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    businesses = []
    listings = soup.find_all('li', class_='list-group-item')
    
    for listing in listings:
        business = self.extract_business_info(listing)
        businesses.append(business)
    
    return businesses
```

### 3. Business Information Extraction
```python
def extract_business_info(self, listing):
    business = {}
    
    # Extract name
    h4 = listing.find('h4')
    if h4:
        business['name'] = h4.get_text(strip=True)
    
    # Extract business type
    em = listing.find('em')
    if em:
        business['business_type'] = em.get_text(strip=True)
    
    # Extract address
    address_div = listing.find('div', class_='col-md-4')
    if address_div and address_div.find('i', class_='fa-calendar-o'):
        business['address'] = self.clean_address(address_div.get_text())
    
    # Extract all dates
    date_divs = listing.find_all('div', class_='mt5')
    business['dates'] = self.extract_dates(date_divs)
    
    return business
```

### 4. Geocoding with Nominatim
```python
def geocode_address(self, address: str) -> Optional[Dict]:
    """
    Geocode using Nominatim (OpenStreetMap)
    IMPORTANT: Respect rate limits (1 request per second)
    """
    time.sleep(1.1)  # Rate limiting
    
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        'q': f"{address}, Berlin, Germany",
        'format': 'json',
        'limit': 1
    }
    headers = {
        'User-Agent': 'JewishBusinessDatabase/1.0 (your-email@example.com)'
    }
    
    try:
        response = requests.get(url, params=params, headers=headers)
        data = response.json()
        if data:
            return {
                'lat': float(data[0]['lat']),
                'lng': float(data[0]['lon'])
            }
    except Exception as e:
        print(f"Geocoding error for {address}: {e}")
    
    return None
```

## Data Format

### StoryMap Format (storymaps.json)
```json
{
    "id": "16",
    "title": "A. & B. Cohn",
    "author": "HU Berlin Database",
    "description": "textiles and clothing business",
    "longDescription": null,
    "address": "Wallstr. 9/10, Berlin",
    "lat": 52.5112193,
    "lng": 13.4058639,
    "category": "business",
    "businessType": "textiles and clothing",
    "startDate": "1931-01-01",
    "midDate": null,
    "endDate": "1937-01-01",
    "media": null,
    "imageUrls": []
}
```

### GeoJSON Format (jewish_businesses.geojson)
```json
{
    "type": "Feature",
    "geometry": {
        "type": "Point",
        "coordinates": [13.4058639, 52.5112193]
    },
    "properties": {
        "name": "A. & B. Cohn",
        "business_type": "textiles and clothing",
        "address": "Wallstr. 9/10, Berlin",
        "registration_date": "1931",
        "dissolution_date": "1937",
        "takeover_date": null,
        "liquidation_date": null
    }
}
```

## Batch Processing Strategy

### For Large-Scale Scraping (1,013 pages)

1. **Batch Processing**
   ```python
   def scrape_in_batches(start_page=1, end_page=1013, batch_size=50):
       for batch_start in range(start_page, end_page + 1, batch_size):
           batch_end = min(batch_start + batch_size - 1, end_page)
           
           # Scrape batch
           batch_data = scrape_batch(batch_start, batch_end)
           
           # Save intermediate results
           save_batch(batch_data, f"batch_{batch_start}_{batch_end}.json")
           
           # Longer pause between batches
           time.sleep(30)
   ```

2. **Resume Capability**
   ```python
   def get_last_processed_page():
       # Check existing data files to find last processed page
       # This allows resuming if interrupted
       pass
   ```

3. **Error Handling**
   ```python
   def scrape_with_retry(page_num, max_retries=3):
       for attempt in range(max_retries):
           try:
               return scrape_page(page_num)
           except Exception as e:
               print(f"Error on page {page_num}, attempt {attempt + 1}: {e}")
               if attempt < max_retries - 1:
                   time.sleep(5 * (attempt + 1))
       return []
   ```

## Rate Limiting & Best Practices

1. **Respect Server Resources**
   - Add delays between requests: `time.sleep(0.5)` minimum
   - Longer delays between batches: `time.sleep(30)`
   - Use proper User-Agent headers

2. **Nominatim Geocoding**
   - **STRICT LIMIT**: 1 request per second
   - Consider caching geocoded addresses
   - Batch geocoding separately from scraping

3. **Data Validation**
   - Check for duplicate businesses
   - Validate date formats
   - Ensure coordinates are within Berlin bounds

## Integration Steps

1. **Run Initial Scraper**
   ```bash
   python3 scrape_jewish_businesses.py --pages 1-100
   ```

2. **Geocode Addresses**
   ```bash
   python3 geocode_addresses.py
   ```

3. **Convert to StoryMap Format**
   ```bash
   python3 convert_businesses.py
   ```

4. **Update Date Information**
   ```bash
   python3 rescrape_dates.py
   ```

5. **Clean Data**
   ```bash
   python3 replace_dates_unknown.py
   ```

## Handling Special Cases

### Missing Dates
- If no endDate found, use "Unknown" instead of null
- If liquidation date exists but no dissolution, estimate 1-2 years after

### Address Normalization
```python
def clean_address(address: str) -> str:
    # Remove extra whitespace
    address = ' '.join(address.split())
    # Ensure "Berlin" is included
    if "Berlin" not in address:
        address += ", Berlin"
    return address
```

### Business Type Mapping
```python
BUSINESS_TYPE_MAP = {
    "Textilien und Bekleidung": "textiles and clothing",
    "Banken und Versicherungen": "banks and insurance",
    "Nahrungs- und Genussmittel": "food and beverages",
    # Add more mappings as discovered
}
```

## Performance Optimization

### Parallel Processing (for geocoding)
```python
from concurrent.futures import ThreadPoolExecutor
import threading

rate_limiter = threading.Semaphore(1)  # One request at a time

def geocode_with_rate_limit(address):
    with rate_limiter:
        time.sleep(1.1)
        return geocode_address(address)

# Process addresses in parallel but rate-limited
with ThreadPoolExecutor(max_workers=1) as executor:
    results = executor.map(geocode_with_rate_limit, addresses)
```

## Monitoring Progress

### Progress Tracking
```python
def log_progress(current_page, total_pages, businesses_found):
    percent = (current_page / total_pages) * 100
    print(f"Progress: {current_page}/{total_pages} ({percent:.1f}%)")
    print(f"Businesses found: {businesses_found}")
    
    # Save progress to file
    with open('scraper_progress.json', 'w') as f:
        json.dump({
            'last_page': current_page,
            'total_businesses': businesses_found,
            'timestamp': datetime.now().isoformat()
        }, f)
```

## Data Quality Checks

1. **Verify Required Fields**
   - Name (required)
   - Address (required for geocoding)
   - At least one date field

2. **Coordinate Validation**
   - Berlin approximate bounds: 
     - Latitude: 52.3 to 52.7
     - Longitude: 13.1 to 13.8

3. **Date Consistency**
   - startDate < midDate < endDate
   - No future dates
   - Years between 1800-1945 (typical range)

## Next Steps for Full Database Scraping

1. **Estimate Time**
   - 1,013 pages × 1 second/page = ~17 minutes (scraping only)
   - ~8,000 businesses × 1.1 seconds/geocode = ~2.5 hours (geocoding)
   - Total: ~3 hours with breaks

2. **Storage Requirements**
   - Estimated ~5-10 MB for complete JSON data
   - Keep backups of raw scraped data

3. **Incremental Updates**
   - Save page number checkpoints
   - Allow resuming from last successful page
   - Merge batches into final dataset

## Troubleshooting

### Common Issues

1. **403 Forbidden from Nominatim**
   - Update User-Agent to include valid email
   - Increase delay between requests
   - Check if IP is temporarily blocked

2. **Missing Businesses**
   - Some pages may have different HTML structure
   - Log and review pages with no results
   - Manual inspection may be needed

3. **Geocoding Failures**
   - Some historical addresses may not exist anymore
   - Try broader search (just street name + Berlin)
   - Fall back to district center coordinates

## Example Full Scraping Script Structure

```python
if __name__ == "__main__":
    scraper = JewishBusinessScraper()
    
    # Configuration
    START_PAGE = 1
    END_PAGE = 1013
    BATCH_SIZE = 50
    
    # Check for previous progress
    last_page = get_last_processed_page()
    if last_page:
        START_PAGE = last_page + 1
        print(f"Resuming from page {START_PAGE}")
    
    # Main scraping loop
    all_businesses = []
    for page in range(START_PAGE, END_PAGE + 1):
        print(f"Scraping page {page}...")
        businesses = scraper.scrape_page(page)
        all_businesses.extend(businesses)
        
        # Save checkpoint every 10 pages
        if page % 10 == 0:
            save_checkpoint(all_businesses, page)
        
        # Respect rate limits
        time.sleep(0.5)
    
    # Geocode all addresses
    print("Geocoding addresses...")
    for business in all_businesses:
        coords = scraper.geocode_address(business['address'])
        if coords:
            business['lat'] = coords['lat']
            business['lng'] = coords['lng']
    
    # Save final results
    save_to_geojson(all_businesses, 'jewish_businesses_complete.geojson')
    convert_to_storymap_format(all_businesses, 'storymaps_complete.json')
    
    print(f"Complete! Scraped {len(all_businesses)} businesses")
```

## Important Notes

- **Always test with small batches first** (10-20 pages)
- **Monitor server response times** - if slow, increase delays
- **Keep raw scraped data** separate from processed data
- **Document any anomalies** or special cases found
- **Use version control** for data files with clear commit messages

## Contact & Attribution

When using this data, please attribute:
- Source: HU Berlin Jewish Business Database
- URL: https://www2.hu-berlin.de/djgb/public/en/find
- Geocoding: OpenStreetMap Contributors via Nominatim