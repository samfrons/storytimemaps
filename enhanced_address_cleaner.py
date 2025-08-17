#!/usr/bin/env python3
"""
Enhanced Address Cleaner with additional street name fixes
"""

import json
import re
from typing import Dict, List, Tuple, Optional
from collections import defaultdict
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class EnhancedAddressCleaner:
    def __init__(self):
        self.stats = defaultdict(int)
        self.manual_review = []
        
        # Common business type indicators
        self.business_type_indicators = [
            'textiles and clothing', 'textile', 'clothing', 'grocer', 'butcher',
            'baker', 'pharmacy', 'restaurant', 'cafe', 'hotel', 'bank',
            'insurance', 'lawyer', 'doctor', 'dentist', 'tailor', 'shoemaker',
            'furniture', 'books', 'tobacco', 'jewelry', 'optician', 'hairdresser'
        ]
        
        # Known street spelling corrections
        self.street_corrections = {
            'Wusterhausener': 'Wusterhauser',
            'Matthaikirchstr': 'Matthäikirchstraße',
            'Segelfliederdamm': 'Segelfliegerweg',
            'Gollnowstr': 'Gollnowstraße',
            'Belle-Alliance-Str': 'Belle-Alliance-Straße',
            'Weissenburgstr': 'Weißenburger Straße',
            'Allensteinerstr': 'Allensteiner Straße',
            'Saarlandstr': 'Saarlandstraße',
            'Bischofstr': 'Bischofstraße',
            'Meineckestr': 'Meineckestraße',
            'Paul-Singer-Str': 'Paul-Singer-Straße',
            'Martin-Luther-Str': 'Martin-Luther-Straße',
            'Freisinger Str': 'Freisinger Straße',
            # Add more common abbreviations
            'str.': 'straße',
            'Str.': 'Straße',
            'str ': 'straße ',
            'Str ': 'Straße '
        }
        
        # Truncated street fixes
        self.truncated_streets = {
            'enburger': 'Offenbacher',
            'nziger': 'Danziger',
            'öneberger': 'Schöneberger',
            'arlottenburger': 'Charlottenburger'
        }

    def clean_address(self, address: str, business_title: str = "") -> Tuple[str, str]:
        """Clean a single address string"""
        if not address or address.strip() == "":
            self.stats['empty_address'] += 1
            return "", "empty"
        
        original = address
        issues = []
        
        # Handle partial addresses starting with "und"
        if address.startswith('und '):
            self.stats['partial_address'] += 1
            self.manual_review.append((business_title, address))
            return "", "partial_address"
        
        # Step 1: Remove business type contamination
        address = self._remove_business_type(address, business_title)
        if address != original:
            issues.append("business_type_removed")
        
        # Step 2: Fix multiple spaces
        address = self._fix_multiple_spaces(address)
        if '  ' in original:
            issues.append("multiple_spaces_fixed")
        
        # Step 3: Fix duplicate text (like "Ludwig Ludwig")
        address = self._fix_duplicate_text(address, business_title)
        
        # Step 4: Fix truncated streets
        address = self._fix_truncated_streets(address)
        if any(trunc in original for trunc in self.truncated_streets.keys()):
            issues.append("truncated_street_fixed")
        
        # Step 5: Fix street name spellings
        address = self._fix_street_spellings(address)
        
        # Step 6: Fix corner addresses
        address = self._fix_corner_addresses(address)
        if 'Ecke' in original:
            issues.append("corner_address_fixed")
        
        # Step 7: Ensure proper Berlin suffix
        address = self._ensure_berlin_suffix(address)
        if not original.strip().endswith('Berlin'):
            issues.append("berlin_suffix_added")
        
        # Step 8: Fix missing commas
        address = self._fix_missing_commas(address)
        
        # Track statistics
        for issue in issues:
            self.stats[issue] += 1
        
        return address, ",".join(issues) if issues else "clean"
    
    def _remove_business_type(self, address: str, business_title: str) -> str:
        """Remove business type and owner name contamination"""
        # Remove owner name if it appears in address
        if business_title:
            # Extract just the name part (before any business designation)
            name_parts = business_title.split(' ')
            if len(name_parts) > 1:
                # Check for personal name in address
                for name in name_parts:
                    if len(name) > 3 and name in address:
                        address = address.replace(name, "").strip()
        
        # Remove business type phrases
        for indicator in self.business_type_indicators:
            pattern = re.compile(r'\b' + re.escape(indicator) + r'\b', re.IGNORECASE)
            address = pattern.sub('', address).strip()
        
        return address
    
    def _fix_multiple_spaces(self, address: str) -> str:
        """Replace multiple spaces with single space"""
        return re.sub(r'\s+', ' ', address).strip()
    
    def _fix_duplicate_text(self, address: str, business_title: str) -> str:
        """Fix duplicated text in address"""
        # Check for patterns like "Ludwig Ludwig textiles..."
        words = address.split()
        if len(words) > 1:
            # Check for consecutive duplicate words
            for i in range(len(words) - 1):
                if words[i] == words[i + 1]:
                    words.pop(i)
                    break
        
        # Check for concatenated words (SchSchöneberger)
        address = ' '.join(words)
        address = re.sub(r'Sch(Sch\w+)', r'\1', address)
        
        return address
    
    def _fix_truncated_streets(self, address: str) -> str:
        """Fix known truncated street names"""
        for truncated, full in self.truncated_streets.items():
            if truncated in address:
                address = address.replace(truncated, full)
        return address
    
    def _fix_street_spellings(self, address: str) -> str:
        """Fix common street name spelling issues"""
        for wrong, correct in self.street_corrections.items():
            if wrong in address:
                address = address.replace(wrong, correct)
                self.stats['street_spelling_fixed'] += 1
        return address
    
    def _fix_corner_addresses(self, address: str) -> str:
        """Fix corner addresses (Ecke format)"""
        if 'Ecke' in address:
            parts = address.split('Ecke')
            if len(parts) == 2:
                street1 = parts[0].strip()
                street2 = parts[1].replace('Berlin', '').replace(',', '').strip()
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
            enhanced_business['needs_manual_review'] = (
                cleaned_address == "" or 
                'und' in cleaned_address or
                issue_type == "partial_address"
            )
            
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
            logger.info(f"Saved {len(self.manual_review)} addresses for manual review")
    
    def print_statistics(self, total_records: int):
        """Print cleaning statistics"""
        print("\n" + "="*60)
        print("ENHANCED ADDRESS CLEANING STATISTICS")
        print("="*60)
        print(f"Total records processed: {total_records}")
        print("\nIssues fixed:")
        
        for issue, count in sorted(self.stats.items(), key=lambda x: x[1], reverse=True):
            percentage = (count / total_records) * 100
            print(f"  {issue:30s}: {count:5d} ({percentage:5.1f}%)")
        
        print(f"\nAddresses needing manual review: {len(self.manual_review)}")
        print("="*60)

def main():
    cleaner = EnhancedAddressCleaner()
    
    # Process the JSON file
    input_file = "businesses_with_default_coordinates.json"
    output_file = "businesses_enhanced_cleaned.json"
    
    try:
        cleaner.process_file(input_file, output_file)
        print(f"\n✓ Successfully cleaned addresses with enhanced rules")
        print(f"✓ Output saved to: {output_file}")
    except Exception as e:
        logger.error(f"Error processing file: {e}")
        raise

if __name__ == "__main__":
    main()