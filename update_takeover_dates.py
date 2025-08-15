#!/usr/bin/env python3
"""
Update takeover dates (Besitzübernahme) as midDate in storymaps.json
"""

import json

def update_takeover_dates():
    # Load scraped data with all dates
    with open('scraped_pages_1_10_verified.json', 'r', encoding='utf-8') as f:
        scraped_data = json.load(f)
    
    # Load current storymaps
    with open('data/storymaps.json', 'r', encoding='utf-8') as f:
        stories = json.load(f)
    
    updates_made = 0
    businesses_updated = []
    
    for story in stories:
        if story.get('author') == 'HU Berlin Database':
            name = story['title']
            
            if name in scraped_data:
                dates = scraped_data[name]['dates']
                
                # Priority for midDate:
                # 1. Takeover date (most significant event)
                # 2. Liquidation date (if no takeover)
                takeover = dates.get('takeover_date')
                liquidation = dates.get('liquidation_date')
                dissolution = dates.get('dissolution_date')
                
                # Update midDate with takeover or liquidation
                if takeover and (not story.get('midDate') or story['midDate'] != f"{takeover}-01-01"):
                    old_mid = story.get('midDate', 'None')
                    story['midDate'] = f"{takeover}-01-01"
                    updates_made += 1
                    businesses_updated.append(f"{name}: midDate = {takeover} (takeover)")
                    print(f"Updated {name}: midDate = {takeover} (takeover) [was: {old_mid}]")
                elif liquidation and not takeover and not story.get('midDate'):
                    story['midDate'] = f"{liquidation}-01-01"
                    updates_made += 1
                    businesses_updated.append(f"{name}: midDate = {liquidation} (liquidation)")
                    print(f"Updated {name}: midDate = {liquidation} (liquidation)")
                
                # Update endDate if we have dissolution date and currently Unknown
                if dissolution and story.get('endDate') == 'Unknown':
                    story['endDate'] = f"{dissolution}-01-01"
                    updates_made += 1
                    print(f"Updated {name}: endDate = {dissolution} (was Unknown)")
    
    # Save updated data
    with open('data/storymaps.json', 'w', encoding='utf-8') as f:
        json.dump(stories, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Made {updates_made} updates to dates")
    
    # Print summary of businesses with takeover dates
    print("\n" + "=" * 60)
    print("Summary of businesses with takeover dates:")
    print("=" * 60)
    
    takeover_count = 0
    for name, data in scraped_data.items():
        if data['dates'].get('takeover_date'):
            takeover_count += 1
            print(f"  {name}: Takeover {data['dates']['takeover_date']}", end="")
            if data['dates'].get('dissolution_date'):
                print(f" → Dissolved {data['dates']['dissolution_date']}")
            else:
                print()
    
    print(f"\nTotal businesses with takeover dates: {takeover_count}")
    
    return updates_made

if __name__ == "__main__":
    update_takeover_dates()