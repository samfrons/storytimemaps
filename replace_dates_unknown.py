#!/usr/bin/env python3
"""
Replace null endDate values with "Unknown" in storymaps.json
"""

import json

def replace_null_with_unknown():
    """Replace null endDate values with 'Unknown'"""
    
    # Load existing storymaps
    with open('data/storymaps.json', 'r', encoding='utf-8') as f:
        stories = json.load(f)
    
    updated_count = 0
    
    for story in stories:
        # Replace null endDate with "Unknown"
        if story.get('endDate') is None:
            story['endDate'] = "Unknown"
            updated_count += 1
            print(f"Updated {story['title']}: endDate = Unknown")
    
    # Save updated data
    with open('data/storymaps.json', 'w', encoding='utf-8') as f:
        json.dump(stories, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Updated {updated_count} businesses with endDate = 'Unknown'")

if __name__ == "__main__":
    replace_null_with_unknown()