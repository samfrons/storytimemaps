# Expert Detail Questions

## Q6: Should we extend the existing MediaItem interface to include date ranges, or create a new TimelineMediaItem interface?
**Default if unknown:** Extend MediaItem (maintains backward compatibility since the interface already supports optional fields, and adding optional `startDate`/`endDate` fields won't break existing implementations)

## Q7: Will timeline data be loaded lazily when a business modal opens, or pre-loaded with the main business data?
**Default if unknown:** Lazy loading (follows performance best practices for large datasets - timeline data only loads when users actually view business details, reducing initial load time for the 4000+ business database)

## Q8: Should the 300ms transition duration used throughout the app apply to timeline content changes, or do you need different timing for historical narrative flows?
**Default if unknown:** Use 300ms (maintains consistency with existing BusinessDetailModal and AnimatedBusinessCarousel transition patterns, providing familiar UX)

## Q9: Will you need timeline data for all businesses, or only for the ~20 detailed stories that have rich media and descriptions?
**Default if unknown:** Only detailed stories (provides maximum storytelling impact where rich media already exists, while keeping implementation scope manageable and focused on high-value content)

## Q10: Should timeline descriptions completely replace the base description during that time period, or supplement it with additional context?
**Default if unknown:** Replace completely (creates more dramatic historical storytelling - e.g., showing "thriving tailor shop serving Berlin's theater district" in 1920s, then "forced closure after Kristallnacht violence" in 1938, providing clearer narrative progression)