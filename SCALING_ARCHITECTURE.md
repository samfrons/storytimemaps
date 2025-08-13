# Scaling Architecture Plan for Historical Map Platform

> **Status**: Future Implementation Plan  
> **Current**: 102 entries in single JSON file  
> **Target**: 10,000+ markers with optimized performance

## Current Analysis

Your platform currently handles 15 enriched stories + 87 scraped businesses with two separate data formats. The architecture shows good practices with clustering (Supercluster) and caching, but needs optimization for 10,000+ markers.

## 1. Recommended Unified Data Schema

### Core Schema (GeoJSON-based)

```typescript
interface UnifiedHistoricalMarker {
  type: "Feature"
  geometry: {
    type: "Point"
    coordinates: [lng: number, lat: number]
  }
  properties: {
    // Core identifiers
    id: string
    source: "enriched" | "scraped" | "user_import"
    
    // Basic info (required)
    name: string
    address: string
    
    // Temporal data
    dates: {
      start?: string  // ISO date or year
      end?: string
      peak?: string   // equivalent to midDate
      certainty?: "exact" | "approximate" | "estimated"
    }
    
    // Categorization
    category: string  // "business", "institution", "residence"
    business_type?: string
    tags?: string[]
    
    // Enrichment levels
    enrichment_level: "basic" | "enhanced" | "full"
    
    // Content (progressive enhancement)
    description?: string
    long_description?: string
    images?: Array<{url: string, caption?: string, source?: string}>
    
    // Metadata
    confidence_score?: number  // geocoding confidence
    data_source?: string
    last_updated?: string
    verification_status?: "verified" | "needs_review" | "unverified"
  }
}
```

## 2. Storage Architecture

### File-Based Approach (Recommended for your scale)

- **Primary storage**: GeoJSON files chunked by geographic regions
- **Chunk strategy**: 25 Berlin districts → ~400 markers per chunk
- **File structure**:
  ```
  /data/
    ├── metadata.json (index of all chunks)
    ├── districts/
    │   ├── mitte.geojson
    │   ├── kreuzberg.geojson
    │   └── ...
    └── enriched/
        ├── stories_batch_1.json
        └── images/
  ```

### Alternative: Hybrid Approach

- **Basic markers**: File-based (for performance)
- **Enriched content**: Database (PostgreSQL + PostGIS)
- **Benefits**: SQL queries for complex filtering, file performance for rendering

## 3. Performance Optimization Strategy

### Client-Side Rendering

- **Viewport-based loading**: Load only visible + buffer zone
- **Level-of-detail**: Progressive marker detail based on zoom
- **Clustering**: Current Supercluster approach is excellent
- **Marker density limits**: Max 500 visible markers, rest clustered

### Data Loading Strategy

```typescript
// Load strategy by zoom level
const LOAD_STRATEGY = {
  zoom_1_8: "clustered_summary",     // Show only major clusters
  zoom_9_12: "district_level",       // Load by district chunks
  zoom_13_16: "neighborhood_level",  // Full marker detail
  zoom_17_20: "enhanced_detail"      // Rich tooltips + content
}
```

## 4. Import/Export Workflow

### User Data Import Pipeline

1. **Supported formats**: CSV, GeoJSON, KML, Excel
2. **Validation pipeline**:
   - Format detection
   - Schema mapping UI
   - Geocoding (if needed)
   - Data quality scoring
3. **Import wizard**:
   - Column mapping interface
   - Preview with sample markers
   - Batch processing with progress tracking

### Export Options

- **Filtered exports**: By date range, category, region
- **Multiple formats**: GeoJSON, CSV, KML for GIS tools
- **Metadata preservation**: Source attribution, quality scores

## 5. Data Quality & Enrichment System

### Progressive Enhancement

```typescript
interface EnrichmentPipeline {
  basic: {           // Minimum viable data
    name: string
    coordinates: [number, number]
    approximate_date: string
  }
  enhanced: {        // Additional research
    precise_dates: DateRange
    business_type: string
    historical_context: string
  }
  full: {           // Rich multimedia content
    detailed_story: string
    primary_sources: Source[]
    images: Image[]
    related_markers: string[]
  }
}
```

### Quality Scoring

- **Geocoding confidence**: Already implemented
- **Source reliability**: Primary/secondary/tertiary sources
- **Date accuracy**: Exact/year/decade/estimated
- **Completeness score**: Percentage of fields populated

## 6. Technical Implementation Plan

### Phase 1: Data Migration & Unification

- Merge current formats into unified schema
- Implement chunking by Berlin districts
- Create data validation pipeline

### Phase 2: Performance Optimization

- Implement viewport-based loading
- Add progressive enhancement system
- Optimize clustering parameters for larger datasets

### Phase 3: User Tools

- Import/export interface
- Data quality dashboard
- Collaborative editing tools

### Phase 4: Advanced Features

- Temporal queries with date range sliders
- Category filtering with performance optimization
- Related marker suggestions
- Data provenance tracking

## 7. Recommended File Structure

```
/data/
├── schema.json              # Schema version & definitions
├── metadata.json           # Global metadata & stats  
├── districts/              # Geographic chunks
│   ├── index.json         # District boundaries & stats
│   ├── mitte.geojson      # ~400 markers
│   ├── kreuzberg.geojson
│   └── ...
├── enriched/              # Enhanced content
│   ├── stories/           # Rich text content
│   ├── images/           # Media files
│   └── sources/          # Primary source documents
└── user_imports/          # User-contributed data
    ├── validated/
    └── pending_review/
```

## Migration Strategy from Current System

### Current State (102 entries)
- Single `storymaps.json` file works perfectly
- All data loads at once
- Simple API structure

### Migration Triggers
Consider implementing this architecture when:
- **1,000+ entries**: Start noticing load times
- **5,000+ entries**: Performance becomes critical
- **10,000+ entries**: Must implement chunking

### Backward Compatibility
- Current single-file system remains as fallback
- API endpoints support both formats
- Gradual migration of data chunks

---

**This architecture provides scalability to 100,000+ markers while maintaining fast load times and enabling easy user contributions.**

> **Implementation Timeline**: Plan for future when dataset grows beyond current performance thresholds. Current system is optimal for 102 entries and can handle up to ~1,000 efficiently.