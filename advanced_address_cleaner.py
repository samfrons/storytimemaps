#!/usr/bin/env python3
"""
Advanced Address Cleaner for Jewish Business Geocoding
Fixes common data quality issues preventing proper geocoding
"""

import json
import re
import csv
from typing import Dict, List, Tuple, Optional
from collections import Counter, defaultdict
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AddressCleaner:
    def __init__(self):
        self.stats = defaultdict(int)
        self.manual_review = []
        
        # Common business type indicators that contaminate addresses
        self.business_type_indicators = [
            'textiles and clothing', 'textile', 'clothing', 'grocer', 'butcher',
            'baker', 'pharmacy', 'restaurant', 'cafe', 'hotel', 'bank',
            'insurance', 'lawyer', 'doctor', 'dentist', 'tailor', 'shoemaker',
            'furniture', 'books', 'tobacco', 'jewelry', 'optician', 'hairdresser'
        ]
        
        # Street name patterns
        self.street_patterns = [
            r'str\.?', r'straße', r'strasse', r'platz', r'damm', r'allee',
            r'weg', r'ring', r'ufer', r'brücke', r'gasse', r'markt'
        ]
        
        # Known street prefixes that might be truncated
        self.truncated_streets = {
            'enburger': 'Offenbacher',
            'nziger': 'Danziger', 
            'öneberger': 'Schöneberger',
            'arlottenburger': 'Charlottenburger'
        }

    def clean_address(self, address: str, business_title: str = "") -> Tuple[str, str]:
        """
        Clean a single address string
        Returns: (cleaned_address, issue_type)
        """
        if not address or address.strip() == "":
            self.stats['empty_address'] += 1
            return "", "empty"
        
        original = address
        issues = []
        
        # Step 1: Remove business type contamination
        address = self._remove_business_type(address, business_title)
        if address != original:
            issues.append("business_type_removed")
            
        # Step 2: Fix multiple spaces
        address = self._fix_multiple_spaces(address)
        if '  ' in original:
            issues.append("multiple_spaces_fixed")
            
        # Step 3: Fix truncated street names
        address = self._fix_truncated_streets(address)
        if any(trunc in original for trunc in self.truncated_streets.keys()):
            issues.append("truncated_street_fixed")
            
        # Step 4: Fix corner addresses (Ecke)
        address = self._fix_corner_addresses(address)
        if 'Ecke' in original:
            issues.append("corner_address_fixed")
            
        # Step 5: Ensure proper Berlin suffix
        address = self._ensure_berlin_suffix(address)
        if not original.strip().endswith('Berlin'):
            issues.append("berlin_suffix_added")
            
        # Step 6: Fix missing commas
        address = self._fix_missing_commas(address)
        
        # Step 7: Handle special cases
        address = self._handle_special_cases(address)
        
        # Track statistics
        for issue in issues:
            self.stats[issue] += 1
            
        return address, ",".join(issues) if issues else "clean"
    
    def _remove_business_type(self, address: str, business_title: str) -> str:
        """Remove business type information from address"""
        # Check if business owner name is in the address
        if business_title and business_title in address:
            address = address.replace(business_title, "").strip()
            
        # Remove common business type phrases
        for indicator in self.business_type_indicators:
            pattern = re.compile(r'\b' + re.escape(indicator) + r'\b', re.IGNORECASE)
            address = pattern.sub('', address).strip()
            
        return address
    
    def _fix_multiple_spaces(self, address: str) -> str:
        """Replace multiple spaces with single space"""
        return re.sub(r'\s+', ' ', address).strip()
    
    def _fix_truncated_streets(self, address: str) -> str:
        """Fix known truncated street names"""
        for truncated, full in self.truncated_streets.items():
            if truncated in address:
                address = address.replace(truncated, full)
        return address
    
    def _fix_corner_addresses(self, address: str) -> str:
        """Fix corner addresses (Ecke format)"""
        if 'Ecke' in address:
            # Try to extract the main street
            parts = address.split('Ecke')
            if len(parts) == 2:
                street1 = parts[0].strip()
                street2 = parts[1].replace('Berlin', '').replace(',', '').strip()
                # Use the first street as primary
                if street1:
                    address = f"{street1}, Berlin"
                elif street2:
                    address = f"{street2}, Berlin"
        return address
    
    def _ensure_berlin_suffix(self, address: str) -> str:
        """Ensure address ends with Berlin"""
        address = address.strip()
        if not address.endswith('Berlin'):
            if address.endswith(','):
                address += ' Berlin'
            else:
                address += ', Berlin'
        return address
    
    def _fix_missing_commas(self, address: str) -> str:
        """Add missing commas before Berlin"""
        if 'Berlin' in address and ', Berlin' not in address:
            address = address.replace(' Berlin', ', Berlin')
        return address
    
    def _handle_special_cases(self, address: str) -> str:
        """Handle special address formats"""
        # Fix "und" at the beginning (partial addresses)
        if address.startswith('und '):
            self.manual_review.append(('partial_address', address))
            return address
            
        # Fix market stall addresses
        if 'Markthalle' in address or 'Stand' in address:
            # Extract the market hall name and stand number
            match = re.search(r'Markthalle\s+(\w+).*Stand\s+(\d+)', address)
            if match:
                hall = match.group(1)
                stand = match.group(2)
                address = f"Markthalle {hall} Stand {stand}, Berlin"
                
        return address
    
    def process_file(self, input_file: str, output_file: str):
        """Process the entire JSON file"""
        logger.info(f"Processing {input_file}...")
        
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        cleaned_data = []
        
        for business in data:
            original_address = business.get('address', '')
            business_title = business.get('title', '')
            
            cleaned_address, issue_type = self.clean_address(original_address, business_title)
            
            # Create enhanced record
            enhanced_business = business.copy()
            enhanced_business['original_address'] = original_address
            enhanced_business['cleaned_address'] = cleaned_address
            enhanced_business['cleaning_issues'] = issue_type
            enhanced_business['needs_manual_review'] = cleaned_address == "" or 'und' in cleaned_address
            
            # Use cleaned address as the main address
            enhanced_business['address'] = cleaned_address
            
            cleaned_data.append(enhanced_business)
            
        # Save cleaned data
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(cleaned_data, f, indent=2, ensure_ascii=False)
            
        logger.info(f"Saved cleaned data to {output_file}")
        
        # Print statistics
        self.print_statistics(len(data))
        
        # Save manual review list
        if self.manual_review:
            review_file = output_file.replace('.json', '_manual_review.json')
            with open(review_file, 'w', encoding='utf-8') as f:
                json.dump(self.manual_review, f, indent=2, ensure_ascii=False)
            logger.info(f"Saved {len(self.manual_review)} addresses for manual review to {review_file}")
    
    def print_statistics(self, total_records: int):
        """Print cleaning statistics"""
        print("\n" + "="*60)
        print("ADDRESS CLEANING STATISTICS")
        print("="*60)
        print(f"Total records processed: {total_records}")
        print("\nIssues fixed:")
        
        for issue, count in sorted(self.stats.items(), key=lambda x: x[1], reverse=True):
            percentage = (count / total_records) * 100
            print(f"  {issue:30s}: {count:5d} ({percentage:5.1f}%)")
            
        print("\nAddresses needing manual review:", len(self.manual_review))
        print("="*60)

def main():
    cleaner = AddressCleaner()
    
    # Process the JSON file
    input_file = "businesses_with_default_coordinates.json"
    output_file = "businesses_cleaned_addresses.json"
    
    try:
        cleaner.process_file(input_file, output_file)
        print(f"\n✓ Successfully cleaned addresses")
        print(f"✓ Output saved to: {output_file}")
    except Exception as e:
        logger.error(f"Error processing file: {e}")
        raise

if __name__ == "__main__":
    main()