#!/usr/bin/env node
/**
 * Plaque SVG Generator for Featured Stories
 * Generates memorial plaques for Jewish businesses in Berlin 1900-1945
 */

const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

// Configuration
const BASE_URL = 'https://storymaps.storytimemaps.com';
const OUTPUT_DIR = path.join(__dirname, '../public/plaques');

// Plaque dimensions (in pixels, designed for print at 300dpi)
const PLAQUE_WIDTH = 600;
const PLAQUE_HEIGHT = 800;

// Colors matching the archival theme
const COLORS = {
  background: '#f5f5dc', // Warm parchment
  border: '#2c2c2c',
  text: '#1a1a1a',
  accent: '#8b4513', // Saddle brown for accent
  muted: '#4a4a4a',
  qrBackground: '#ffffff'
};

/**
 * Extract business type from the description or category
 */
function extractBusinessType(business) {
  const title = business.title || '';
  const description = business.description || '';

  // Common business type patterns
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
    { pattern: /gourmet|food shop/i, type: 'Gourmet Foods' },
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
 * Clean and format address
 */
function formatAddress(address) {
  if (!address) return 'Berlin, Germany';
  // Remove "Germany" if present since all are in Berlin
  return address.replace(/, Germany$/i, '').trim();
}

/**
 * Generate QR code as SVG path data
 */
async function generateQRCodeSVG(url, size = 120) {
  try {
    const svgString = await QRCode.toString(url, {
      type: 'svg',
      width: size,
      margin: 1,
      color: {
        dark: COLORS.text,
        light: COLORS.qrBackground
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
 * Word wrap text for SVG
 */
function wrapText(text, maxWidth, fontSize = 14) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  const charsPerLine = Math.floor(maxWidth / (fontSize * 0.6));

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= charsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines;
}

/**
 * Generate SVG plaque for a business
 */
async function generatePlaqueSVG(business) {
  const name = escapeXML(business.title || 'Unknown Business');
  const address = escapeXML(formatAddress(business.address));
  const businessType = escapeXML(extractBusinessType(business));
  const startDate = formatDate(business.startDate);
  const endDate = formatDate(business.endDate);
  const dateRange = startDate && endDate ? `${startDate} – ${endDate}` : (startDate || endDate || 'Dates Unknown');

  // Generate QR code
  const businessUrl = `${BASE_URL}/?id=${business.id}`;
  const qrSvg = await generateQRCodeSVG(businessUrl);

  // Extract QR code content (remove outer SVG wrapper)
  let qrContent = '';
  if (qrSvg) {
    // Extract the inner content of the QR SVG
    const match = qrSvg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
    if (match) {
      qrContent = match[1];
    }
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${PLAQUE_WIDTH} ${PLAQUE_HEIGHT}" width="${PLAQUE_WIDTH}" height="${PLAQUE_HEIGHT}">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&amp;family=Playfair+Display:wght@400;600&amp;display=swap');
      .title { font-family: 'Playfair Display', Georgia, serif; font-weight: 600; }
      .mono { font-family: 'Space Mono', 'Courier New', monospace; }
      .serif { font-family: 'Playfair Display', Georgia, serif; }
    </style>
  </defs>

  <!-- Background -->
  <rect width="${PLAQUE_WIDTH}" height="${PLAQUE_HEIGHT}" fill="${COLORS.background}"/>

  <!-- Border -->
  <rect x="15" y="15" width="${PLAQUE_WIDTH - 30}" height="${PLAQUE_HEIGHT - 30}"
        fill="none" stroke="${COLORS.border}" stroke-width="3"/>
  <rect x="25" y="25" width="${PLAQUE_WIDTH - 50}" height="${PLAQUE_HEIGHT - 50}"
        fill="none" stroke="${COLORS.border}" stroke-width="1"/>

  <!-- Header decoration -->
  <line x1="50" y1="80" x2="${PLAQUE_WIDTH - 50}" y2="80" stroke="${COLORS.accent}" stroke-width="2"/>
  <text x="${PLAQUE_WIDTH / 2}" y="60" text-anchor="middle" class="mono"
        font-size="11" fill="${COLORS.muted}" letter-spacing="3">
    STOLPERSTEIN MEMORIAL
  </text>

  <!-- Star of David icon -->
  <g transform="translate(${PLAQUE_WIDTH / 2 - 15}, 90)">
    <polygon points="15,0 19,10 30,10 21,17 24,28 15,21 6,28 9,17 0,10 11,10"
             fill="none" stroke="${COLORS.accent}" stroke-width="1.5"/>
  </g>

  <!-- Business Type -->
  <text x="${PLAQUE_WIDTH / 2}" y="145" text-anchor="middle" class="mono"
        font-size="13" fill="${COLORS.accent}" letter-spacing="2">
    ${businessType.toUpperCase()}
  </text>

  <!-- Business Name -->
  <text x="${PLAQUE_WIDTH / 2}" y="200" text-anchor="middle" class="title"
        font-size="32" fill="${COLORS.text}">
    ${name.length > 28 ? name.substring(0, 25) + '...' : name}
  </text>
  ${name.length > 28 ? `
  <text x="${PLAQUE_WIDTH / 2}" y="235" text-anchor="middle" class="title"
        font-size="22" fill="${COLORS.text}">
    ${name.substring(25, 50)}
  </text>` : ''}

  <!-- Decorative line -->
  <line x1="150" y1="260" x2="${PLAQUE_WIDTH - 150}" y2="260" stroke="${COLORS.muted}" stroke-width="1"/>

  <!-- Location -->
  <g transform="translate(${PLAQUE_WIDTH / 2}, 300)">
    <text x="0" y="0" text-anchor="middle" class="mono" font-size="11" fill="${COLORS.muted}" letter-spacing="2">
      LOCATION
    </text>
    <text x="0" y="25" text-anchor="middle" class="serif" font-size="18" fill="${COLORS.text}">
      ${address.length > 35 ? address.substring(0, 32) + '...' : address}
    </text>
  </g>

  <!-- Dates -->
  <g transform="translate(${PLAQUE_WIDTH / 2}, 380)">
    <text x="0" y="0" text-anchor="middle" class="mono" font-size="11" fill="${COLORS.muted}" letter-spacing="2">
      OPERATED
    </text>
    <text x="0" y="25" text-anchor="middle" class="serif" font-size="22" fill="${COLORS.text}">
      ${dateRange}
    </text>
  </g>

  <!-- Horizontal rule -->
  <line x1="100" y1="440" x2="${PLAQUE_WIDTH - 100}" y2="440" stroke="${COLORS.border}" stroke-width="1"/>

  <!-- Memorial text -->
  <text x="${PLAQUE_WIDTH / 2}" y="480" text-anchor="middle" class="serif"
        font-size="12" fill="${COLORS.muted}" font-style="italic">
    Jewish-owned business, Berlin
  </text>
  <text x="${PLAQUE_WIDTH / 2}" y="500" text-anchor="middle" class="serif"
        font-size="12" fill="${COLORS.muted}" font-style="italic">
    Forced to close during the Nazi regime
  </text>

  <!-- QR Code Section -->
  <g transform="translate(${PLAQUE_WIDTH / 2 - 60}, 530)">
    <rect x="-10" y="-10" width="140" height="140" fill="${COLORS.qrBackground}" stroke="${COLORS.border}" stroke-width="1"/>
    <g transform="scale(1)">
      ${qrContent}
    </g>
  </g>

  <!-- QR Code label -->
  <text x="${PLAQUE_WIDTH / 2}" y="700" text-anchor="middle" class="mono"
        font-size="10" fill="${COLORS.muted}" letter-spacing="1">
    SCAN FOR FULL STORY
  </text>

  <!-- Footer -->
  <line x1="50" y1="730" x2="${PLAQUE_WIDTH - 50}" y2="730" stroke="${COLORS.accent}" stroke-width="2"/>
  <text x="${PLAQUE_WIDTH / 2}" y="755" text-anchor="middle" class="mono"
        font-size="10" fill="${COLORS.muted}" letter-spacing="2">
    STORYTIMEMAPS.COM
  </text>
  <text x="${PLAQUE_WIDTH / 2}" y="775" text-anchor="middle" class="mono"
        font-size="9" fill="${COLORS.muted}">
    Research: Dr. Christoph Kreutzmüller
  </text>
</svg>`;

  return svg;
}

/**
 * Main function
 */
async function main() {
  console.log('🔨 Generating memorial plaques for featured stories...\n');

  // Read storymaps data
  const dataPath = path.join(__dirname, '../data/storymaps.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

  // Filter to featured stories (first 15 with images)
  const featuredStories = data.filter(b =>
    b.imageUrls && b.imageUrls.length > 0
  ).slice(0, 17);

  console.log(`Found ${featuredStories.length} featured stories\n`);

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Generate plaques
  for (const business of featuredStories) {
    const filename = `plaque-${business.id.toString().padStart(3, '0')}-${business.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}.svg`;
    const filepath = path.join(OUTPUT_DIR, filename);

    console.log(`📋 Generating: ${business.title}`);
    console.log(`   Type: ${extractBusinessType(business)}`);
    console.log(`   Address: ${formatAddress(business.address)}`);
    console.log(`   Dates: ${formatDate(business.startDate)} – ${formatDate(business.endDate)}`);

    const svg = await generatePlaqueSVG(business);
    fs.writeFileSync(filepath, svg, 'utf8');

    console.log(`   ✅ Saved: ${filename}\n`);
  }

  // Generate index file
  const indexContent = `# Memorial Plaques

Generated ${new Date().toISOString()}

## Featured Stories

${featuredStories.map((b, i) => `${i + 1}. **${b.title}**
   - Location: ${formatAddress(b.address)}
   - Operated: ${formatDate(b.startDate) || '?'} – ${formatDate(b.endDate) || '?'}
   - Type: ${extractBusinessType(b)}
   - URL: ${BASE_URL}/?id=${b.id}
`).join('\n')}

## Files

${featuredStories.map(b => `- plaque-${b.id.toString().padStart(3, '0')}-${b.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}.svg`).join('\n')}
`;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'README.md'), indexContent, 'utf8');

  console.log(`\n✨ Generated ${featuredStories.length} plaques in ${OUTPUT_DIR}`);
  console.log(`📄 Index saved to ${OUTPUT_DIR}/README.md`);
}

main().catch(console.error);
