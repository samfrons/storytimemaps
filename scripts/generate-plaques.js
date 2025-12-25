#!/usr/bin/env node
/**
 * Plaque SVG Generator for Featured Stories
 * Generates memorial plaques for Jewish businesses in Berlin 1900-1945
 *
 * Two styles:
 * 1. Berlin Style - White background with blue text (like Berliner Gedenktafel)
 * 2. Brass Style - Gold/brass background with dark engraved text
 */

const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

// Configuration
const BASE_URL = 'https://storymaps.storytimemaps.com';
const OUTPUT_DIR = path.join(__dirname, '../public/plaques');

// Plaque dimensions - horizontal orientation
const PLAQUE_WIDTH = 800;
const PLAQUE_HEIGHT = 500;

// Style 1: Berlin Gedenktafel (white/blue)
const BERLIN_COLORS = {
  background: '#f8f6f0',
  frame: '#a0917a',
  frameInner: '#c4b8a8',
  text: '#1a365d',
  textMuted: '#2c5282',
  accent: '#1a365d'
};

// Style 2: Brass/Gold plaque
const BRASS_COLORS = {
  background: '#c9a227',
  backgroundGradient1: '#d4af37',
  backgroundGradient2: '#b8960f',
  text: '#2d2a24',
  textMuted: '#4a4639',
  screwColor: '#8b7355'
};

/**
 * Extract business type from the description or category
 */
function extractBusinessType(business) {
  const title = business.title || '';
  const description = business.description || '';

  const typePatterns = [
    { pattern: /tailor/i, type: 'Tailoring' },
    { pattern: /department store/i, type: 'Department Store' },
    { pattern: /café|cafe/i, type: 'Café' },
    { pattern: /textile/i, type: 'Textiles' },
    { pattern: /book/i, type: 'Bookshop' },
    { pattern: /furrier|fur/i, type: 'Furrier' },
    { pattern: /manufactur/i, type: 'Manufacturing' },
    { pattern: /dairy|eggs/i, type: 'Food Distribution' },
    { pattern: /law firm|attorney/i, type: 'Law Practice' },
    { pattern: /photo/i, type: 'Photography' },
    { pattern: /gallery|art/i, type: 'Art Gallery' },
    { pattern: /import|export/i, type: 'Import/Export' },
    { pattern: /medical|physician|doctor/i, type: 'Medical Practice' },
    { pattern: /gourmet|food shop|fine foods/i, type: 'Gourmet Foods' },
    { pattern: /agency/i, type: 'Agency' }
  ];

  for (const { pattern, type } of typePatterns) {
    if (pattern.test(title) || pattern.test(description)) {
      return type;
    }
  }

  return business.businessType || business.category || 'Business';
}

/**
 * Format date for display (MM.YYYY format)
 */
function formatDate(dateStr) {
  if (!dateStr || dateStr === 'Unknown') return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}.${year}`;
  } catch {
    return null;
  }
}

/**
 * Get just the year from a date string
 */
function getYear(dateStr) {
  if (!dateStr || dateStr === 'Unknown') return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.getFullYear();
  } catch {
    return null;
  }
}

/**
 * Clean and format address
 */
function formatAddress(address) {
  if (!address) return 'Berlin';
  return address.replace(/, Germany$/i, '').trim();
}

/**
 * Generate QR code as SVG path data
 */
async function generateQRCodeSVG(url, size = 100) {
  try {
    const svgString = await QRCode.toString(url, {
      type: 'svg',
      width: size,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    return svgString;
  } catch (err) {
    console.error('QR Code generation error:', err);
    return null;
  }
}

/**
 * Escape special XML characters
 */
function escapeXML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate Berlin-style SVG plaque (white with blue text)
 */
async function generateBerlinStyleSVG(business) {
  const name = escapeXML(business.title || 'Unknown Business');
  const address = escapeXML(formatAddress(business.address));
  const businessType = escapeXML(extractBusinessType(business));
  const startYear = getYear(business.startDate);
  const endYear = getYear(business.endDate);
  const dateRange = startYear && endYear ? `${startYear} – ${endYear}` : (startYear || endYear || '');

  const businessUrl = `${BASE_URL}/?id=${business.id}`;
  const qrSvg = await generateQRCodeSVG(businessUrl, 90);

  let qrContent = '';
  if (qrSvg) {
    const match = qrSvg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
    if (match) {
      qrContent = match[1];
    }
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PLAQUE_WIDTH} ${PLAQUE_HEIGHT}" width="${PLAQUE_WIDTH}" height="${PLAQUE_HEIGHT}">
  <defs>
    <style>
      .title { font-family: Georgia, 'Times New Roman', serif; font-weight: normal; }
      .text { font-family: Georgia, 'Times New Roman', serif; }
      .url { font-family: 'Helvetica Neue', Arial, sans-serif; }
    </style>
  </defs>

  <!-- Outer metallic frame -->
  <rect width="${PLAQUE_WIDTH}" height="${PLAQUE_HEIGHT}" fill="${BERLIN_COLORS.frame}"/>

  <!-- Inner frame border -->
  <rect x="8" y="8" width="${PLAQUE_WIDTH - 16}" height="${PLAQUE_HEIGHT - 16}"
        fill="${BERLIN_COLORS.frameInner}"/>

  <!-- Main white background -->
  <rect x="16" y="16" width="${PLAQUE_WIDTH - 32}" height="${PLAQUE_HEIGHT - 32}"
        fill="${BERLIN_COLORS.background}"/>

  <!-- Business Type (top, smaller) -->
  <text x="${PLAQUE_WIDTH / 2 - 60}" y="70" class="text"
        font-size="16" fill="${BERLIN_COLORS.textMuted}" font-style="italic">
    ${businessType}
  </text>

  <!-- Business Name (large, centered) -->
  <text x="${PLAQUE_WIDTH / 2 - 60}" y="130" class="title"
        font-size="36" fill="${BERLIN_COLORS.text}" font-weight="600" letter-spacing="1">
    ${name.length > 30 ? name.substring(0, 27) + '...' : name}
  </text>

  <!-- Dates -->
  <text x="${PLAQUE_WIDTH / 2 - 60}" y="180" class="text"
        font-size="22" fill="${BERLIN_COLORS.text}">
    ${dateRange}
  </text>

  <!-- Address -->
  <text x="${PLAQUE_WIDTH / 2 - 60}" y="240" class="text"
        font-size="18" fill="${BERLIN_COLORS.textMuted}">
    ${address}
  </text>

  <!-- Divider line -->
  <line x1="60" y1="280" x2="${PLAQUE_WIDTH - 180}" y2="280"
        stroke="${BERLIN_COLORS.textMuted}" stroke-width="0.5" opacity="0.5"/>

  <!-- URL at bottom -->
  <text x="${PLAQUE_WIDTH / 2 - 60}" y="450" class="url"
        font-size="14" fill="${BERLIN_COLORS.textMuted}" letter-spacing="1">
    storytimemaps.com
  </text>

  <!-- QR Code Section (right side) -->
  <g transform="translate(${PLAQUE_WIDTH - 150}, ${PLAQUE_HEIGHT / 2 - 60})">
    <rect x="-10" y="-10" width="120" height="120" fill="#ffffff" stroke="${BERLIN_COLORS.textMuted}" stroke-width="0.5"/>
    <g transform="translate(0, 0)">
      ${qrContent}
    </g>
  </g>

</svg>`;

  return svg;
}

/**
 * Generate Brass-style SVG plaque (gold with dark engraved text)
 */
async function generateBrassStyleSVG(business) {
  const name = escapeXML(business.title || 'Unknown Business');
  const address = escapeXML(formatAddress(business.address));
  const businessType = escapeXML(extractBusinessType(business));
  const startYear = getYear(business.startDate);
  const endYear = getYear(business.endDate);
  const dateRange = startYear && endYear ? `${startYear} – ${endYear}` : (startYear || endYear || '');

  const businessUrl = `${BASE_URL}/?id=${business.id}`;
  const qrSvg = await generateQRCodeSVG(businessUrl, 90);

  let qrContent = '';
  if (qrSvg) {
    const match = qrSvg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
    if (match) {
      qrContent = match[1];
    }
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PLAQUE_WIDTH} ${PLAQUE_HEIGHT}" width="${PLAQUE_WIDTH}" height="${PLAQUE_HEIGHT}">
  <defs>
    <style>
      .title { font-family: Georgia, 'Times New Roman', serif; }
      .text { font-family: Georgia, 'Times New Roman', serif; }
      .url { font-family: 'Helvetica Neue', Arial, sans-serif; }
    </style>
    <!-- Brass gradient for realistic look -->
    <linearGradient id="brassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#d4af37"/>
      <stop offset="25%" style="stop-color:#c9a227"/>
      <stop offset="50%" style="stop-color:#d4af37"/>
      <stop offset="75%" style="stop-color:#b8960f"/>
      <stop offset="100%" style="stop-color:#c9a227"/>
    </linearGradient>
    <!-- Subtle texture overlay -->
    <filter id="noise">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise"/>
      <feColorMatrix type="saturate" values="0"/>
      <feBlend in="SourceGraphic" in2="noise" mode="multiply"/>
    </filter>
  </defs>

  <!-- Main brass background -->
  <rect width="${PLAQUE_WIDTH}" height="${PLAQUE_HEIGHT}" fill="url(#brassGradient)"/>

  <!-- Subtle worn texture overlay -->
  <rect width="${PLAQUE_WIDTH}" height="${PLAQUE_HEIGHT}" fill="url(#brassGradient)" opacity="0.95"/>

  <!-- Corner screws -->
  <circle cx="25" cy="25" r="8" fill="${BRASS_COLORS.screwColor}" stroke="#6b5a45" stroke-width="1"/>
  <circle cx="25" cy="25" r="3" fill="#5a4a35"/>
  <circle cx="${PLAQUE_WIDTH - 25}" cy="25" r="8" fill="${BRASS_COLORS.screwColor}" stroke="#6b5a45" stroke-width="1"/>
  <circle cx="${PLAQUE_WIDTH - 25}" cy="25" r="3" fill="#5a4a35"/>
  <circle cx="25" cy="${PLAQUE_HEIGHT - 25}" r="8" fill="${BRASS_COLORS.screwColor}" stroke="#6b5a45" stroke-width="1"/>
  <circle cx="25" cy="${PLAQUE_HEIGHT - 25}" r="3" fill="#5a4a35"/>
  <circle cx="${PLAQUE_WIDTH - 25}" cy="${PLAQUE_HEIGHT - 25}" r="8" fill="${BRASS_COLORS.screwColor}" stroke="#6b5a45" stroke-width="1"/>
  <circle cx="${PLAQUE_WIDTH - 25}" cy="${PLAQUE_HEIGHT - 25}" r="3" fill="#5a4a35"/>

  <!-- Business Type (top, smaller) -->
  <text x="${PLAQUE_WIDTH / 2 - 60}" y="80" class="text"
        font-size="16" fill="${BRASS_COLORS.textMuted}" font-style="italic">
    ${businessType}
  </text>

  <!-- Business Name (large, centered) -->
  <text x="${PLAQUE_WIDTH / 2 - 60}" y="150" class="title"
        font-size="38" fill="${BRASS_COLORS.text}" font-weight="600">
    ${name.length > 30 ? name.substring(0, 27) + '...' : name}
  </text>

  <!-- Dates -->
  <text x="${PLAQUE_WIDTH / 2 - 60}" y="205" class="text"
        font-size="24" fill="${BRASS_COLORS.text}">
    ${dateRange}
  </text>

  <!-- Address -->
  <text x="${PLAQUE_WIDTH / 2 - 60}" y="270" class="text"
        font-size="18" fill="${BRASS_COLORS.textMuted}">
    ${address}
  </text>

  <!-- URL at bottom -->
  <text x="${PLAQUE_WIDTH / 2 - 60}" y="450" class="url"
        font-size="14" fill="${BRASS_COLORS.textMuted}" letter-spacing="1">
    storytimemaps.com
  </text>

  <!-- QR Code Section (right side) -->
  <g transform="translate(${PLAQUE_WIDTH - 150}, ${PLAQUE_HEIGHT / 2 - 60})">
    <rect x="-10" y="-10" width="120" height="120" fill="#ffffff" stroke="${BRASS_COLORS.text}" stroke-width="1"/>
    <g transform="translate(0, 0)">
      ${qrContent}
    </g>
  </g>

</svg>`;

  return svg;
}

/**
 * Main function
 */
async function main() {
  console.log('Generating memorial plaques for featured stories...\n');

  // Read storymaps data
  const dataPath = path.join(__dirname, '../data/storymaps.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  // Filter to featured stories (first entries with images)
  const featuredStories = data.filter(b =>
    b.imageUrls && b.imageUrls.length > 0
  ).slice(0, 17);

  console.log(`Found ${featuredStories.length} featured stories\n`);

  // Create output directories
  const berlinDir = path.join(OUTPUT_DIR, 'berlin-style');
  const brassDir = path.join(OUTPUT_DIR, 'brass-style');

  if (!fs.existsSync(berlinDir)) fs.mkdirSync(berlinDir, { recursive: true });
  if (!fs.existsSync(brassDir)) fs.mkdirSync(brassDir, { recursive: true });

  // Generate plaques
  for (const business of featuredStories) {
    const baseFilename = `plaque-${business.id.toString().padStart(3, '0')}-${business.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}`;

    console.log(`Generating: ${business.title}`);
    console.log(`   Type: ${extractBusinessType(business)}`);
    console.log(`   Address: ${formatAddress(business.address)}`);
    console.log(`   Dates: ${getYear(business.startDate)} – ${getYear(business.endDate)}`);

    // Generate Berlin style
    const berlinSvg = await generateBerlinStyleSVG(business);
    fs.writeFileSync(path.join(berlinDir, `${baseFilename}.svg`), berlinSvg, 'utf8');
    console.log(`   -> berlin-style/${baseFilename}.svg`);

    // Generate Brass style
    const brassSvg = await generateBrassStyleSVG(business);
    fs.writeFileSync(path.join(brassDir, `${baseFilename}.svg`), brassSvg, 'utf8');
    console.log(`   -> brass-style/${baseFilename}.svg`);

    console.log('');
  }

  // Generate index file
  const indexContent = `# Memorial Plaques

Generated ${new Date().toISOString()}

## Styles

Two plaque styles are available for each business:

1. **Berlin Style** (\`berlin-style/\`) - White background with blue text, inspired by Berliner Gedenktafel
2. **Brass Style** (\`brass-style/\`) - Gold/brass background with dark engraved text

## Featured Stories

${featuredStories.map((b, i) => `${i + 1}. **${b.title}**
   - Type: ${extractBusinessType(b)}
   - Location: ${formatAddress(b.address)}
   - Operated: ${getYear(b.startDate) || '?'} – ${getYear(b.endDate) || '?'}
   - QR Code URL: ${BASE_URL}/?id=${b.id}
`).join('\n')}

## Files

### Berlin Style
${featuredStories.map(b => `- berlin-style/plaque-${b.id.toString().padStart(3, '0')}-${b.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}.svg`).join('\n')}

### Brass Style
${featuredStories.map(b => `- brass-style/plaque-${b.id.toString().padStart(3, '0')}-${b.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}.svg`).join('\n')}
`;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'README.md'), indexContent, 'utf8');

  console.log(`\nGenerated ${featuredStories.length * 2} plaques (2 styles x ${featuredStories.length} businesses)`);
  console.log(`Berlin style: ${berlinDir}`);
  console.log(`Brass style: ${brassDir}`);
  console.log(`Index: ${OUTPUT_DIR}/README.md`);
}

main().catch(console.error);
