# Initial Request

**Date:** 2025-08-21 13:41
**Request:** adding ability to change business details and media based on dates so as you go through the timeline the detail information can change too. be compatible so not all places need to have it

## Context
This is a historical data visualization project showing Jewish businesses in Berlin from 1900-1945. The application must be respectful and historically accurate while providing an engaging user experience.

## Current System Analysis
- **Timeline System**: TimeSlider component allows users to scrub through dates from 1920-1945
- **Business States**: Currently businesses show as active/declining/closed/future based on timeline position
- **Detail Display**: BusinessDetailModal + StoryDetail components show static business information
- **Media Support**: Existing MediaItem[] array with image/video support and captions
- **Data Structure**: StoryMap interface with startDate, midDate, endDate fields

## User Goal
Enable businesses to have different details and media at different time periods, so when users move the timeline slider, the business information shown in the detail modal can change to reflect what was happening at that specific time period.

## Compatibility Requirement
The solution must be backward compatible - businesses that don't have time-varying information should continue to work exactly as they do now.