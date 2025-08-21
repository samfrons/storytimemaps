# Discovery Questions

## Q1: Will users primarily interact with time-varying details through the existing timeline slider?
**Default if unknown:** Yes (the TimeSlider component is the primary temporal navigation mechanism, and users already understand scrubbing through dates to see business state changes)

## Q2: Should different time periods have completely different media galleries, or should media be additive over time?
**Default if unknown:** Different galleries (allows for more dramatic storytelling - e.g., showing prosperous shop photos in early periods, then damage photos after Kristallnacht)

## Q3: Will the time-varying information need to work with the existing business state system (active/declining/closed/future)?
**Default if unknown:** Yes (the existing state logic based on startDate/midDate/endDate should continue to work, with time-varying details overlaying this system)

## Q4: Should time-varying details be stored as part of the main business data files, or in separate timeline-specific files?
**Default if unknown:** Part of main data files (maintains data coherence and simplifies maintenance, following the project's current approach of keeping all business data in storymaps.json)

## Q5: Will users expect smooth transitions when the timeline changes, or is instant switching acceptable?
**Default if unknown:** Smooth transitions (consistent with the project's emphasis on polished UX and the existing modal animations - timeline changes should feel fluid and professional)