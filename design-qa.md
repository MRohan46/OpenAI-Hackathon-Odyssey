# Design QA — Infinite three-panel quest roadmap

## Comparison target

- **Source visual truth:** `qa/today-390x844-final.png` for the pre-change Today hierarchy and navigation contract; `assets/images/quest-roadmap/coastal-road-01.png`, `coastal-road-02.png`, and `coastal-road-03.png` for the three-road environment set; the two user-supplied dragon references preserved as `dragon-flame.png` and `dragon-guide.png`.
- **Rendered implementation:** Odyssey Today from the local Expo web build.
- **Primary viewport/state:** 390 × 844 touch viewport, top-of-road and mid-road states with four seeded quests.
- **Compact viewport/state:** 320 × 700 touch viewport, top-of-road and quest navigator open.
- **Full-view comparison evidence:** `qa/infinite-roadmap/full-view-comparison.png` combines the prior Today baseline with the final top and mid-road implementation.
- **Focused comparison evidence:** `qa/infinite-roadmap/focused-road-assets-comparison.png` combines all three source road panels with the rendered mid-road state.

## Findings

No actionable P0, P1, or P2 findings remain.

- **Core journey and interaction:** Every quest for the focused day is represented once on the data-driven route. The focused quest retains its status, time/deadline, duration, priority, planned/actual intensity, rewards, boss damage, recurrence, proof policy, attention reason, detail navigation, and Begin action. The navigator contains every quest, closes after selection, and scrolls to the correct quest.
- **Fonts and typography:** Bricolage Grotesque remains the display face and Manrope remains the body/UI face. The stronger 39 px headline, 21 px focused-card title, compact 12–14 px metadata, and abbreviated 320 px date preserve hierarchy without clipping or unreadable wrapping.
- **Spacing and layout rhythm:** The top glass card, goal/boss panel, first route marker, quest spacing, and persistent tab bar create a deliberate vertical cadence. Cards alternate sides without colliding with the route or characters. At 320 px, the scene uses one 2023 px triptych cycle rather than rounding to an empty second cycle.
- **Colors and visual tokens:** The implementation stays inside Odyssey’s turquoise, warm sand, navy, white-mist, coral, success-teal, and sun-gold system. Status colors remain semantic, while the route receives a white contrast rail and navy dashed core for reliable visibility over all three environments.
- **Image quality and asset fidelity:** The three generated 864 × 1821 road panels are real raster assets with matched camera, road width, lighting, and palette. They are feather-composited into a 504 KB 864 × 5143 WebP triptych, eliminating visible joins without loading three multi-megabyte PNGs at runtime. Both supplied characters remain recognizable and are treated as softly animated sticker companions; isolated checkerboard fragments were removed without replacing them with look-alikes.
- **Copy and content:** “One clear step” is preserved. “Every quest is on one living road” explains the new interaction without exposing implementation language. “The road continues” closes the daily route without implying unearned progress.
- **Icons and controls:** Existing Lucide iconography remains consistent. Notification, navigator, add, Begin, tab, close, and quest controls preserve 42–48 px practical touch targets and accessible labels.
- **Responsiveness:** Browser metrics show `bodyWidth === documentWidth === viewportWidth` at both 390 and 320 px. The 320 px navigator remains inside the screen, and all four tab destinations remain visible. The unchanged application pages continue to use the shared 100%-width, 620 px-max `LivingScreen` shell; the 15-screen 390 × 844 evidence set under `.agents/audits/product-ui-2026-07-18/` covers welcome, journey, goal detail/builder, roadmap review, month/week calendar, quest builder, completion, proof, profile, rewards, analytics, and reminders.
- **Accessibility and motion:** The route art, character companions, and SVG path are hidden from the accessibility tree and never intercept input. Quest cards and progress indicators remain semantic. Reduced-motion mode freezes character drift. High-contrast mode strengthens the route rail and image wash.
- **Runtime quality:** Final managed isolated Chrome checks found no console errors, warnings, issues, error overlay, or horizontal overflow. The production export includes only the 504 KB triptych and two approximately 50 KB character assets for this feature.

## Comparison history

### Pass 1 — blocked

- **[P2] Visible road-panel junction:** The initial runtime stacked the three PNGs directly, producing a horizontal brightness/geometry seam between panels 1 and 2.
  - **Fix:** Feather-composited the three originals into `coastal-road-triptych.webp` and rendered that triptych as the repeatable cycle.
- **[P2] Checkerboard fragments around supplied decorations:** The input PNGs contained an opaque checkerboard rather than alpha, and the first conservative mask left visible fragments at mobile scale.
  - **Fix:** Applied a connected color mask and small-component cleanup, then placed the exact supplied characters inside restrained white sticker auras.
- **[P2] Development error overlay:** Accessibility-only props were initially forwarded through the SVG web element, triggering a React development overlay.
  - **Fix:** Moved the path into a decorative React Native wrapper with `aria-hidden`, then moved non-interactive pointer behavior into styles. Final console inspection is empty.
- **[P2] Compact scene over-allocation:** A 37 px minimum-height mismatch at 320 px rounded one triptych into two complete cycles and created an unnecessary empty road tail.
  - **Fix:** Matched the minimum scene bound to compact content. Final 320 px metrics are one triptych, 2023 px scroll height, and 700 px viewport height.

### Pass 2 — passed

- The combined full-view comparison shows stronger hierarchy and a materially more continuous quest journey than the prior Today layout.
- The focused comparison shows all three road sources preserved in the rendered art direction with no visible runtime junction in the inspected mid-road state.
- Final 390 × 844 and 320 × 700 captures show legible text, clean cards, working persistent tabs, correctly contained navigator, and intentional character placement.
- Final browser metrics and console inspection contain no remaining P0/P1/P2 issue.

## Primary interactions tested

- Open and close Today’s quest navigator.
- Select “Calculus Focus Session” from the navigator and confirm the menu closes and scroll position changes to the selected quest.
- Confirm Begin quest and every quest-detail control remain represented in the accessibility tree and covered by the Today interaction tests.
- Confirm the 320 px and 390 px routes have no horizontal overflow or error overlay.

## Follow-up polish

- **P3:** The user-supplied character files are only 148–156 px wide, so their intentional sticker treatment is preferable to enlarging them further. Higher-resolution transparent originals could improve edge fidelity later without changing layout or behavior.

## Final result

final result: passed
