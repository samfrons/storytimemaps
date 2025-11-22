# StoryMaps QR Codes for Outdoor Plaques

Generated: 11/22/2025, 4:31:14 PM

## Overview

This directory contains QR codes for featured StoryMaps businesses, designed for outdoor historical plaques in Berlin. Each QR code links directly to a specific business story on storytimemaps.com.

## QR Code Specifications

### Technical Details
- **Format:** SVG (vector, infinitely scalable)
- **Error Correction:** Level H (30% recovery - highest)
- **Colors:** Pure black (#000000) on white (#FFFFFF)
- **Margin:** 4 modules (white border for scanning)
- **Base Size:** 1000x1000px

### Physical Printing Guidelines

**Minimum Size:** 2" x 2" (5cm x 5cm) when printed
**Recommended:** 3" x 3" (7.6cm x 7.6cm) or larger
**Scanning Distance:** Optimized for 2-3 feet (60-90cm)

**Material Recommendations:**
- Weather-resistant materials (metal, treated wood, sealed acrylic)
- Matte or semi-gloss finish (avoid high gloss - causes glare)
- UV-resistant coating for outdoor durability
- High contrast printing (avoid color QR codes)

**Placement Guidelines:**
- Eye level (approximately 5 feet / 150cm from ground)
- Flat surface (not curved or textured)
- Avoid reflective backgrounds
- Protected from direct rain/snow when possible
- Well-lit area (avoid deep shadows)

## Generated QR Codes


### 1. Elias Braun - Tailor Shop

- **ID:** 1
- **Address:** Rosenthaler Straße 40, Berlin, Germany
- **URL:** https://storytimemaps.com/?business=1
- **File:** `business-1-elias-braun-tailor-shop.svg`


### 2. Breslauer Brothers Department Store

- **ID:** 2
- **Address:** Unter den Linden 15, Berlin, Germany
- **URL:** https://storytimemaps.com/?business=2
- **File:** `business-2-breslauer-brothers-department-store.svg`


### 3. Deutsches Theater Café

- **ID:** 3
- **Address:** Schumannstraße 13a, Berlin, Germany
- **URL:** https://storytimemaps.com/?business=3
- **File:** `business-3-deutsches-theater-caf.svg`


### 4. Ebro Textiles

- **ID:** 4
- **Address:** Alexanderstraße 125, Berlin, Germany
- **URL:** https://storytimemaps.com/?business=4
- **File:** `business-4-ebro-textiles.svg`


### 5. Hoxter & Sons Bookshop

- **ID:** 5
- **Address:** Oranienburger Straße 28, Berlin, Germany
- **URL:** https://storytimemaps.com/?business=5
- **File:** `business-5-hoxter-sons-bookshop.svg`


### 6. Pelz Furrier

- **ID:** 6
- **Address:** Friedrichstraße 180, Berlin, Germany
- **URL:** https://storytimemaps.com/?business=6
- **File:** `business-6-pelz-furrier.svg`


### 7. Product X Manufacturing

- **ID:** 7
- **Address:** Warschauer Straße 45, Berlin, Germany
- **URL:** https://storytimemaps.com/?business=7
- **File:** `business-7-product-x-manufacturing.svg`


### 8. Eggs & Dairy Distributors

- **ID:** 8
- **Address:** Hackescher Markt 12, Berlin, Germany
- **URL:** https://storytimemaps.com/?business=8
- **File:** `business-8-eggs-dairy-distributors.svg`


## Usage Instructions

### For Plaque Designers

1. **Import SVG:** Open the desired QR code SVG file in Adobe Illustrator, Inkscape, or similar vector software
2. **Scale:** The SVG can be scaled to any size without quality loss
3. **Minimum Size:** Ensure printed QR code is at least 2" x 2" (5cm x 5cm)
4. **Contrast:** Maintain pure black and white colors for best scanning
5. **Testing:** Print a test version and scan from 2-3 feet away before final production

### For Web Integration

Although these QR codes are designed for physical plaques, the SVG files can also be used digitally:

```html
<img src="/qr-codes/business-1-elias-braun-tailor-shop.svg" alt="QR Code for Elias Braun Tailor Shop" />
```

### Testing QR Codes

1. Print a test version at actual size
2. Test scanning in various lighting conditions
3. Test from different angles (direct, 45°)
4. Test with multiple phone models if possible
5. Verify the URL opens correctly and shows the right business

## Regenerating QR Codes

To regenerate all QR codes:

```bash
pnpm run generate-qr
```

This will overwrite existing files and update the metadata.

## File Naming Convention

`business-{id}-{name-slug}.svg`

Example: `business-1-elias-braun-tailor-shop.svg`

## Base URL

All QR codes point to: **https://storytimemaps.com**

With parameter format: `?business={id}`

## Support

For questions about the QR codes or plaque implementation, please contact the StoryMaps team.

---

*These QR codes are part of the StoryMaps project to preserve and share the history of Jewish businesses in Berlin from 1900-1945.*
