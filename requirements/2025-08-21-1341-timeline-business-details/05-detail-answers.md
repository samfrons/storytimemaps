# Expert Detail Answers

## Q6: Should we extend the existing MediaItem interface to include date ranges, or create a new TimelineMediaItem interface?
**Answer:** TimelineMediaItem

## Q7: Will timeline data be loaded lazily when a business modal opens, or pre-loaded with the main business data?
**Answer:** Lazy

## Q8: Should the 300ms transition duration used throughout the app apply to timeline content changes, or do you need different timing for historical narrative flows?
**Answer:** 300 is fine

## Q9: Will you need timeline data for all businesses, or only for the ~20 detailed stories that have rich media and descriptions?
**Answer:** Only detailed stories

## Q10: Should timeline descriptions completely replace the base description during that time period, or supplement it with additional context?
**Answer:** Replace completely

## Summary
- Create separate TimelineMediaItem interface for clean separation
- Lazy load timeline data when business modals open for performance
- Use consistent 300ms transitions for familiar UX
- Focus implementation on ~20 detailed stories for maximum impact
- Replace descriptions completely for dramatic historical storytelling