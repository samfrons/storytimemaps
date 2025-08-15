# Detail Questions

These questions clarify specific implementation details based on the codebase analysis.

## Q6: Should the customizer panel be a floating overlay that can be dragged/repositioned?
**Default if unknown:** No (fixed sidebar panel is simpler and more stable)
**Rationale:** Based on the current sidebar pattern in the app, a fixed panel maintains consistency with existing UI patterns and is less complex to implement

## Q7: Do you want to group color controls by category (Core Colors, Accent Colors, Map Colors)?
**Default if unknown:** Yes (makes it easier to find specific colors)
**Rationale:** With 45+ color variables, grouping them logically prevents overwhelming users and matches how they're organized in the CSS

## Q8: Should color changes update the map style immediately or require a "Apply to Map" button?
**Default if unknown:** No (immediate updates are better for live preview)
**Rationale:** Immediate feedback helps users understand how colors affect the map, though map updates may be slightly delayed due to WebGL rendering

## Q9: Do you need to reset individual themes back to their original defaults?
**Default if unknown:** Yes (users need an escape hatch if customization goes wrong)
**Rationale:** A reset button per theme allows users to experiment freely knowing they can always return to the original design

## Q10: Should the exported JSON include only changed values or all theme variables?
**Default if unknown:** All variables (complete theme definition is more portable)
**Rationale:** Exporting all variables ensures the theme works correctly when imported elsewhere, avoiding dependency on default values