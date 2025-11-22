#!/usr/bin/env tsx
/**
 * QR Code Generator for StoryMaps Featured Stories
 *
 * Generates SVG QR codes for outdoor plaques pointing to specific businesses
 * on the storytimemaps.com website.
 *
 * Usage: pnpm run generate-qr
 */

import * as fs from 'fs';
import * as path from 'path';
import QRCode from 'qrcode';

// Configuration
const BASE_URL = 'https://storytimemaps.com';
const DATA_FILE = path.join(__dirname, '../data/storymaps.json');
const OUTPUT_DIR = path.join(__dirname, '../public/qr-codes');
const FEATURED_STORY_IDS = ['1', '2', '3', '4', '5', '6', '7', '8'];

// QR Code options optimized for outdoor plaques
const QR_OPTIONS = {
  errorCorrectionLevel: 'H' as const, // Highest error correction (30% recovery)
  type: 'svg' as const,
  margin: 4, // White border around QR code for better scanning
  width: 1000, // Large size for printing
  color: {
    dark: '#000000', // Pure black for maximum contrast
    light: '#FFFFFF' // Pure white background
  }
};

interface StoryMap {
  id: string;
  title: string;
  description: string;
  address?: string;
  lat: number;
  lng: number;
  startDate: string;
  endDate: string;
  category?: string;
  imageUrls?: string[];
}

interface QRMetadata {
  generated: string;
  baseUrl: string;
  qrOptions: typeof QR_OPTIONS;
  businesses: Array<{
    id: string;
    name: string;
    address: string;
    url: string;
    qrFile: string;
  }>;
}

/**
 * Slugify a string for use in filenames
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
}

/**
 * Generate QR code SVG for a business
 */
async function generateQRCode(business: StoryMap): Promise<string> {
  const url = `${BASE_URL}/?business=${business.id}`;
  const slug = slugify(business.title);
  const filename = `business-${business.id}-${slug}.svg`;
  const filepath = path.join(OUTPUT_DIR, filename);

  // Generate SVG QR code
  const svgString = await QRCode.toString(url, QR_OPTIONS);

  // Write to file
  fs.writeFileSync(filepath, svgString, 'utf8');

  console.log(`✓ Generated: ${filename}`);
  console.log(`  URL: ${url}`);

  return filename;
}

/**
 * Main execution
 */
async function main() {
  console.log('StoryMaps QR Code Generator');
  console.log('===========================\n');

  // Create output directory if it doesn't exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created directory: ${OUTPUT_DIR}\n`);
  }

  // Read storymaps data
  console.log('Reading business data...');
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) as StoryMap[];
  console.log(`Total businesses: ${data.length}\n`);

  // Filter for featured stories
  const featuredStories = data.filter(story =>
    FEATURED_STORY_IDS.includes(story.id)
  );

  console.log(`Featured stories to generate: ${featuredStories.length}`);
  console.log('IDs:', featuredStories.map(s => s.id).join(', '));
  console.log('');

  // Generate QR codes
  const metadata: QRMetadata = {
    generated: new Date().toISOString(),
    baseUrl: BASE_URL,
    qrOptions: QR_OPTIONS,
    businesses: []
  };

  for (const business of featuredStories) {
    try {
      const qrFile = await generateQRCode(business);

      metadata.businesses.push({
        id: business.id,
        name: business.title,
        address: business.address || 'Unknown address',
        url: `${BASE_URL}/?business=${business.id}`,
        qrFile
      });
    } catch (error) {
      console.error(`✗ Failed to generate QR for ${business.title}:`, error);
    }
  }

  // Write metadata file
  const metadataPath = path.join(OUTPUT_DIR, 'metadata.json');
  fs.writeFileSync(
    metadataPath,
    JSON.stringify(metadata, null, 2),
    'utf8'
  );
  console.log(`\n✓ Metadata saved: metadata.json`);

  // Create README
  const readme = generateReadme(metadata);
  const readmePath = path.join(OUTPUT_DIR, 'README.md');
  fs.writeFileSync(readmePath, readme, 'utf8');
  console.log(`✓ Documentation saved: README.md`);

  console.log('\n===========================');
  console.log('QR Code Generation Complete!');
  console.log(`${metadata.businesses.length} QR codes generated in:`);
  console.log(OUTPUT_DIR);
}

/**
 * Generate README documentation
 */
function generateReadme(metadata: QRMetadata): string {
  return `# StoryMaps QR Codes for Outdoor Plaques

Generated: ${new Date(metadata.generated).toLocaleString()}

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

${metadata.businesses.map((business, index) => `
### ${index + 1}. ${business.name}

- **ID:** ${business.id}
- **Address:** ${business.address}
- **URL:** ${business.url}
- **File:** \`${business.qrFile}\`
`).join('\n')}

## Usage Instructions

### For Plaque Designers

1. **Import SVG:** Open the desired QR code SVG file in Adobe Illustrator, Inkscape, or similar vector software
2. **Scale:** The SVG can be scaled to any size without quality loss
3. **Minimum Size:** Ensure printed QR code is at least 2" x 2" (5cm x 5cm)
4. **Contrast:** Maintain pure black and white colors for best scanning
5. **Testing:** Print a test version and scan from 2-3 feet away before final production

### For Web Integration

Although these QR codes are designed for physical plaques, the SVG files can also be used digitally:

\`\`\`html
<img src="/qr-codes/business-1-elias-braun-tailor-shop.svg" alt="QR Code for Elias Braun Tailor Shop" />
\`\`\`

### Testing QR Codes

1. Print a test version at actual size
2. Test scanning in various lighting conditions
3. Test from different angles (direct, 45°)
4. Test with multiple phone models if possible
5. Verify the URL opens correctly and shows the right business

## Regenerating QR Codes

To regenerate all QR codes:

\`\`\`bash
pnpm run generate-qr
\`\`\`

This will overwrite existing files and update the metadata.

## File Naming Convention

\`business-{id}-{name-slug}.svg\`

Example: \`business-1-elias-braun-tailor-shop.svg\`

## Base URL

All QR codes point to: **${metadata.baseUrl}**

With parameter format: \`?business={id}\`

## Support

For questions about the QR codes or plaque implementation, please contact the StoryMaps team.

---

*These QR codes are part of the StoryMaps project to preserve and share the history of Jewish businesses in Berlin from 1900-1945.*
`;
}

// Execute
main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
