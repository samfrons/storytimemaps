# Contributing to Story Maps: Jewish Businesses in Berlin

Thank you for your interest in enriching the historical record! This guide will help you add rich content to existing business entries or suggest new ones.

## Quick Overview

We have **102 business entries** in our database:
- **15 enriched stories** with full details, images, and historical context
- **87 basic entries** from the HU Berlin database that can be enhanced

## How to Add Rich Content

### 1. Adding Images and Videos

To add media to a business story:

1. **Upload your files** to `/public/images/[business-name]/`
   ```
   /public/images/elias-braun/
   ├── storefront-1925.jpg
   ├── family-portrait.jpg
   └── interview-excerpt.mp4
   ```

2. **Edit the story entry** in `/data/storymaps.json`:
   ```json
   {
     "id": "1",
     "title": "Elias Braun - Tailor Shop",
     "media": [
       {
         "url": "/images/elias-braun/storefront-1925.jpg",
         "type": "image",
         "caption": "The shop's storefront in 1925"
       },
       {
         "url": "/images/elias-braun/family-portrait.jpg", 
         "type": "image",
         "caption": "The Braun family outside their shop"
       },
       {
         "url": "/images/elias-braun/interview-excerpt.mp4",
         "type": "video", 
         "caption": "Interview with Elias's grandson (1995)"
       }
     ]
   }
   ```

### 2. Adding Long-Form Text

To add detailed historical accounts:

```json
{
  "longDescription": "Elias Braun opened his tailoring shop in 1925 after apprenticing with master tailors in Vienna. The shop became known throughout the neighborhood for its fine craftsmanship, particularly men's suits and formal wear. The family lived above the shop, and Elias's wife Sarah helped with alterations while raising their three children.\n\nDuring the early 1930s, as anti-Jewish sentiment grew, the family noticed fewer customers coming to the shop. By 1935, regular clients who had been coming for years stopped visiting. The situation became untenable after Kristallnacht in November 1938, when the shop's windows were smashed and the interior vandalized.\n\nThe family was forced to close the business and sell their equipment for a fraction of its value. They emigrated to New York in early 1939, where Elias worked in a garment factory in the Lower East Side until his retirement."
}
```

### 3. Finding Stories to Enhance

Look for entries with:
- Empty or basic `description` fields
- No `longDescription`
- No `media` array
- Missing `businessType` information

Example of a basic entry that needs enrichment:
```json
{
  "id": "16",
  "title": "A. & B. Cohn",
  "description": "textiles and clothing business",  // Basic
  "longDescription": null,                         // Needs content
  "media": null,                                   // Needs media
  "businessType": "textiles and clothing"
}
```

## Supported Media Formats

### Images
- **JPG, PNG** (recommended: under 2MB each)
- **Naming**: Use descriptive names like `storefront-1930.jpg`

### Videos  
- **MP4, WebM** (recommended: under 10MB each)
- **Audio interviews, historical footage, family videos**

## Research Guidelines

### Primary Sources (Preferred)
- Family photographs and documents
- Business records and advertisements
- Newspaper articles from the period
- Government documentation
- Personal testimonies and interviews

### Secondary Sources
- Academic research
- Historical society records
- Museum collections
- Documented oral histories

### Always Include
- **Source attribution** for all media
- **Date information** when known
- **Context** about the business and family
- **What happened** to the business and owners

## Example of a Fully Enriched Entry

```json
{
  "id": "29",
  "title": "A. Asher & Co",
  "author": "Berlin Historical Society", 
  "description": "Renowned bookstore specializing in academic and Jewish texts",
  "longDescription": "Founded in 1900 by Abraham Asher, A. Asher & Co became one of Berlin's most respected academic bookstores. Located on Behrenstr. 17, the shop specialized in scholarly works, Jewish religious texts, and rare manuscripts.\n\nThe business flourished in the 1920s, serving universities and private collectors across Europe. Abraham's son David joined the business in 1928, bringing expertise in modern literature and philosophy.\n\nAfter 1933, the bookstore faced increasing restrictions. Jewish authors were banned, and the shop's academic clientele dwindled. The business was forced to close in 1938, and the family's valuable book collection was confiscated.\n\nDavid Asher managed to emigrate to Palestine in 1939, where he established a small bookshop in Jerusalem that operated until the 1970s.",
  "address": "Behrenstr. 17, Berlin",
  "lat": 52.5148529,
  "lng": 13.380006,
  "category": "business",
  "businessType": "books and art",
  "startDate": "1900-01-01",
  "endDate": "1938-01-01",
  "media": [
    {
      "url": "/images/asher-co/exterior-1925.jpg",
      "type": "image", 
      "caption": "The bookstore's exterior in 1925"
    },
    {
      "url": "/images/asher-co/interior-rare-books.jpg",
      "type": "image",
      "caption": "Interior showing the rare manuscripts section"
    },
    {
      "url": "/images/asher-co/newspaper-ad-1930.jpg", 
      "type": "image",
      "caption": "Advertisement from Berliner Tageblatt, 1930"
    }
  ]
}
```

## Questions?

If you have:
- **Historical materials** to contribute
- **Questions** about specific businesses
- **Technical issues** with the format

Please reach out! Every contribution helps preserve these important stories.

---

*This project documents Jewish-owned businesses in Berlin from 1900-1945 to preserve their memory and honor the families who built them.*