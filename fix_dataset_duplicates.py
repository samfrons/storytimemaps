#!/usr/bin/env python3
"""
Fix duplicate issues in the full dataset:
1. Remove duplicate numbers in descriptions (e.g., "Str. 38 38")
2. Remove duplicate "Berlin" in descriptions
3. Remove redundant "Located at..." descriptions
4. Clean up addresses for better geocoding
"""

import json
import re
import logging
from datetime import datetime
from typing import Dict, List, Tuple

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DatasetCleaner:
    def __init__(self):
        self.stats = {
            'total_processed': 0,
            'descriptions_removed': 0,
            'descriptions_fixed': 0,
            'addresses_fixed': 0,
            'duplicate_numbers_fixed': 0,
            'duplicate_berlin_fixed': 0,
            'berliner_str_fixed': 0
        }
        
    def fix_description(self, business: Dict) -> bool:
        """Fix or remove redundant descriptions"""
        description = business.get('description', '')
        address = business.get('address', '')
        business_type = business.get('businessType', '') or business.get('category', '')
        
        if not description:
            return False
        
        # Check if description is just "Located at..." boilerplate
        if 'Located at' in description:
            # This is a redundant description - remove it entirely
            business['description'] = ''
            self.stats['descriptions_removed'] += 1
            return True
        
        # For other descriptions, fix any duplicate patterns
        original_desc = description
        
        # Fix duplicate numbers (e.g., "38 38" -> "38")
        description = re.sub(r'\b(\d+)\s+\1\b', r'\1', description)
        if description != original_desc:
            self.stats['duplicate_numbers_fixed'] += 1
        
        # Fix duplicate Berlin
        if description.count('Berlin') > 1:
            # Replace "Berlin, Berlin" with just "Berlin"
            description = re.sub(r'Berlin,\s*Berlin', 'Berlin', description)
            self.stats['duplicate_berlin_fixed'] += 1
        
        if description != original_desc:
            business['description'] = description
            self.stats['descriptions_fixed'] += 1
            return True
            
        return False
    
    def fix_address(self, business: Dict) -> bool:
        """Fix address issues"""
        address = business.get('address', '')
        if not address:
            return False
            
        original_address = address
        changed = False
        
        # Fix duplicate numbers in address (though data shows this is rare)
        address = re.sub(r'\b(\d+)\s+\1\b', r'\1', address)
        
        # Fix duplicate Berlin
        if address.count('Berlin') > 1:
            address = re.sub(r'Berlin,\s*Berlin', 'Berlin', address)
            changed = True
        
        # Special handling for "Berliner Str." which is a street name, not duplicate Berlin
        # These are valid street names and should not be considered duplicates
        if 'Berliner Str' in address or 'Berliner Allee' in address:
            self.stats['berliner_str_fixed'] += 1
            # These are correct as-is
        
        # Ensure proper formatting
        address = re.sub(r'\s+', ' ', address).strip()
        
        # Ensure it ends with ", Berlin" not just "Berlin"
        if address.endswith('Berlin') and not address.endswith(', Berlin'):
            address = address[:-6] + ', Berlin'
            changed = True
        
        if address != original_address:
            business['address'] = address
            self.stats['addresses_fixed'] += 1
            return True
            
        return False
    
    def process_dataset(self, input_file: str, output_file: str):
        """Process the entire dataset"""
        logger.info(f"Loading dataset from {input_file}...")
        
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        logger.info(f"Processing {len(data)} businesses...")
        
        for business in data:
            self.stats['total_processed'] += 1
            
            # Fix description issues
            self.fix_description(business)
            
            # Fix address issues  
            self.fix_address(business)
            
            # Log progress
            if self.stats['total_processed'] % 1000 == 0:
                logger.info(f"Processed {self.stats['total_processed']} businesses...")
        
        # Create backup before saving
        backup_file = input_file.replace('.json', f'_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json')
        with open(backup_file, 'w', encoding='utf-8') as f:
            with open(input_file, 'r', encoding='utf-8') as original:
                f.write(original.read())
        logger.info(f"Created backup at {backup_file}")
        
        # Save cleaned data
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Saved cleaned dataset to {output_file}")
        
        # Print statistics
        self.print_statistics()
        
        return data
    
    def print_statistics(self):
        """Print cleaning statistics"""
        print("\n" + "="*60)
        print("DATASET CLEANING STATISTICS")
        print("="*60)
        print(f"Total businesses processed: {self.stats['total_processed']}")
        print(f"\nDescription changes:")
        print(f"  Redundant descriptions removed: {self.stats['descriptions_removed']}")
        print(f"  Descriptions fixed: {self.stats['descriptions_fixed']}")
        print(f"  Duplicate numbers fixed: {self.stats['duplicate_numbers_fixed']}")
        print(f"  Duplicate 'Berlin' fixed: {self.stats['duplicate_berlin_fixed']}")
        print(f"\nAddress changes:")
        print(f"  Addresses fixed: {self.stats['addresses_fixed']}")
        print(f"  'Berliner Str/Allee' preserved: {self.stats['berliner_str_fixed']}")
        
        total_changes = (self.stats['descriptions_removed'] + 
                        self.stats['descriptions_fixed'] + 
                        self.stats['addresses_fixed'])
        print(f"\nTotal changes made: {total_changes}")
        print("="*60)

def main():
    cleaner = DatasetCleaner()
    
    input_file = "data/storymaps_test_full.json"
    output_file = "data/storymaps_test_full.json"  # Overwrite the same file
    
    try:
        cleaner.process_dataset(input_file, output_file)
        print("\n✓ Dataset successfully cleaned")
        print("✓ Redundant descriptions removed")
        print("✓ Duplicate patterns fixed")
        print("✓ Ready for geocoding")
    except Exception as e:
        logger.error(f"Error processing dataset: {e}")
        raise

if __name__ == "__main__":
    main()