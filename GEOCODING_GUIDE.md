# Berlin Historical Address Geocoding Guide

## Overview

This geocoding solution converts 4,000+ historical Berlin business addresses (1900-1945) from default coordinates to accurate lat/lng positions using free Nominatim/OpenStreetMap services.

## Features

- **Cost-Optimized**: Uses free Nominatim API with intelligent rate limiting
- **Historical Address Support**: Handles 1900-1945 Berlin street name formats
- **Smart Caching**: SQLite-based cache prevents re-geocoding same addresses
- **Collision Avoidance**: Adds random offsets for businesses at same address
- **Robust Error Handling**: Fallback strategies and comprehensive logging
- **Backup Protection**: Automatic backup before processing

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Test the Geocoder (Recommended)
```bash
python test_geocoder.py
```

### 3. Run Full Geocoding
```bash
python geocode_addresses.py
```

## Current Data Status

Based on analysis of your `storymaps.json`:
- **Total entries**: ~4,000
- **Entries needing geocoding**: ~3,899 (with lat: 52.52, lng: 13.405)
- **Already geocoded**: ~100 entries with proper coordinates
- **Target**: HU Berlin Database entries with default coordinates

## How It Works

### Address Processing Pipeline
1. **Load Data**: Reads storymaps.json file
2. **Identify Targets**: Finds entries with default coordinates (52.52, 13.405) and author="HU Berlin Database"
3. **Normalize Addresses**: Converts historical formats to modern equivalents
4. **Check Cache**: Avoids duplicate API calls using SQLite cache
5. **Geocode**: Queries Nominatim API with fallback strategies
6. **Validate**: Ensures coordinates are within Berlin bounds
7. **Add Offsets**: Prevents overlapping for same-address businesses
8. **Update & Save**: Updates coordinates and saves to file

### Historical Address Handling
The script handles historical Berlin street names:
- `Friedrichstr.` → `Friedrichstraße`
- `Kantstr.` → `Kantstraße`
- `Wallstr.` → `Wallstraße`
- `Str.` → `Straße`
- Adds `Berlin, Germany` if missing

### Rate Limiting & Cost Optimization
- **1.2 second delay** between API requests (respects Nominatim policy)
- **SQLite caching** prevents duplicate geocoding
- **Batch processing** by unique addresses
- **Multiple query fallbacks** improve success rate

## Example Addresses

Your dataset contains addresses like:
- `Wallstr. 9/10, Berlin`
- `Neue Friedrichstr. 44, Berlin` 
- `Kantstr. 160, Berlin`
- `Probststr. 10/11, Berlin`

## Output

### Successful Geocoding
```json
{
  "address": "Wallstr. 9/10, Berlin",
  "lat": 52.5112193,
  "lng": 13.4058639
}
```

### File Structure After Processing
- **storymaps.json**: Updated with new coordinates
- **storymaps.json.backup_YYYYMMDD_HHMMSS**: Automatic backup
- **geocoding_cache.db**: SQLite cache for future runs
- **geocoding_YYYYMMDD_HHMMSS.log**: Detailed processing log

## Configuration

### Key Settings (in geocode_addresses.py)
```python
REQUEST_DELAY = 1.2          # Seconds between API requests
MAX_RETRIES = 3              # Retry attempts for failed requests
CACHE_DB_PATH = "geocoding_cache.db"  # Cache database location
```

### Berlin Bounds Validation
```python
BERLIN_BOUNDS = {
    'min_lat': 52.33, 'max_lat': 52.68,
    'min_lng': 13.09, 'max_lng': 13.76
}
```

## Monitoring Progress

The script provides real-time feedback:
```
Processing address 1/3899: Wallstr. 9/10, Berlin
Geocoded: Wallstr. 9/10, Berlin -> (52.5112193, 13.4058639) confidence: 0.8
Updated Test Business 1: (52.5112193, 13.4058639)
Progress: 100/3899 addresses processed
```

## Expected Results

### Performance Estimates
- **Processing Time**: ~2-3 hours for 4,000 addresses (with 1.2s delays)
- **Success Rate**: 85-95% (depends on address quality)
- **API Calls**: ~3,000-3,500 unique addresses
- **Cost**: $0 (free Nominatim service)

### Common Issues & Solutions

1. **Incomplete Addresses** (e.g., "22, Berlin")
   - Script detects and logs these
   - Manual review recommended

2. **Rate Limiting**
   - Built-in 1.2s delay respects Nominatim policy
   - Automatic retry with exponential backoff

3. **Coordinates Outside Berlin**
   - Validation rejects coordinates outside Berlin bounds
   - Logged for manual review

## Advanced Usage

### Resume Interrupted Processing
The cache system allows resuming interrupted runs:
```bash
# Simply re-run the script - it will skip cached addresses
python geocode_addresses.py
```

### Adjust Rate Limiting
For faster processing (if you have permission):
```python
REQUEST_DELAY = 0.5  # Reduce delay (use responsibly)
```

### Custom Address Mappings
Add historical street mappings:
```python
HISTORICAL_STREET_MAPPINGS = {
    'Your-Historical-Name': 'Modern-Name',
    # Add more mappings as needed
}
```

## Troubleshooting

### Common Error Messages

**"Incomplete address detected"**
- Address has only numbers, no street name
- These will be logged for manual review

**"Coordinates outside Berlin bounds"**
- Geocoded location not in Berlin area
- May indicate address parsing issues

**"Failed to geocode"**
- Nominatim couldn't find the address
- Will retry with different query formats

### Recovery Steps

1. Check log files for specific errors
2. Review failed_addresses list in log output
3. Manually verify problematic addresses
4. Re-run script (uses cache, only processes failures)

## Best Practices

1. **Always test first** with `test_geocoder.py`
2. **Run during off-peak hours** to be respectful to free service
3. **Monitor logs** for quality issues
4. **Keep backups** (automatic, but verify)
5. **Validate results** by spot-checking coordinates

## Support

The script includes comprehensive logging and error handling. Check log files for detailed information about any issues encountered during processing.