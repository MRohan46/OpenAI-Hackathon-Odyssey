# Odyssey Tide Observatory Production QA

## QA target

- Source visual truth: `docs/awwwards-today-demo/02-tide-observatory.png`
- Final implementation capture: `qa/tide-observatory/main-upgrade/final-top-390x844.png`
- Full-roadmap evidence: `qa/tide-observatory/main-upgrade/final-roadmap-scroll-390x844.png`
- Quest-navigator evidence: `qa/tide-observatory/main-upgrade/final-navigator-open-390x844.png`
- Full-view comparison evidence: `qa/tide-observatory/main-upgrade/comparison-source-vs-main.png`
- Responsive evidence: `qa/tide-observatory/main-upgrade/final-responsive-320x700.png`
- Target viewport: 390 × 844 CSS pixels, light mode
- Target state: Today, Friday 17 July; overall streak 14; roadmap level 4 of 10; Study Boss at 62% health; Calculus Focus Session scheduled for 7:00 PM
- Browser: agent-browser Chromium session against the exported production web build

The comparison uses an unframed 390 × 844 rendering for both source and implementation. Separate top, scrolled-roadmap, navigator, and narrow-mobile captures prove that the visual direction survives the utility-complete production state instead of only matching a static hero frame.

## Findings

- P0: none.
- P1: none.
- P2: none after the iterations below.

The final implementation preserves the source's coastal-map composition, luminous water, curved route, lighthouse destination, shell waypoint, gold active island, sea-glass completion marker, editorial hierarchy, and floating navigation. Every real quest is now placed on the scrollable route, and the dropdown provides direct navigation without flattening or hiding task state. Remaining differences are intentional product adaptations rather than unresolved fidelity defects.

## Required fidelity surfaces

### Fonts and typography

- Bricolage Grotesque remains the display face and Manrope remains the interface/data face.
- The implementation increases active-quest metadata and CTA sizing relative to the generated mock so the primary action remains readable and touch-safe.
- Text remains native rather than rasterized. Wrapping is stable at 390 × 844, and the 320 × 700 pass keeps `Begin quest` on one line.

### Spacing and layout rhythm

- The five visual bands remain recognizable: orientation, horizon, route, active action, and navigation.
- The route, quest labels, marker layers, lighthouse and shoreline stay aligned at both tested viewports.
- The bottom navigation floats over the scene while the content scrolls beneath it; every card can be brought fully above the navigation.

### Colors and visual tokens

- The screen uses Odyssey's locked navy, sun gold, coral, turquoise, sky and sand tokens.
- High-priority copy uses the accessible coral text token rather than the brighter decorative coral.
- Roadmap level and boss health remain separate labeled progress bars.

### Image quality and asset fidelity

- `coastal-route-scroll-background.png` is a dedicated 853 × 1844 continuous scene plate with no baked UI, duplicated landmarks, or repeated texture seam.
- `active-sun-island.png` and `tide-glint.png` are separate transparent RGBA layers, not CSS or SVG approximations.
- The active island sits on the scene's existing pedestal without a halo or double base.

### Copy and content

- The screen retains the selected concept's date, streak, headline, roadmap level, boss state, active quest, upcoming quest and four-tab navigation.
- The completed label intentionally shows `Completed · 6:52 AM`, sourced from the completion record, rather than copying the generated mock's `6:30 PM`. Product truth outranks visual-reference copy.
- Timed problems, Calculus Focus Session, Formula review, and Evening mobility each render as their own roadmap card.
- Each card exposes status, truthful time, duration, priority, planned intensity, earned rewards or boss damage, recurrence, and proof policy. Completed work also distinguishes planned from actual intensity.
- The `Today's route` dropdown lists every quest and jumps directly to its roadmap position.

## Comparison history

| Pass | Severity | Earlier finding | Fix made | Post-fix evidence |
| --- | --- | --- | --- | --- |
| 1 | P1 | Rich metadata cards overlapped the active quest and obstructed its CTA. | Compacted the metadata grid, reserved explicit vertical bands, and made scene height data-driven. | `qa/tide-observatory/main-upgrade/history/pass1-top-390x844.png` → final capture |
| 2 | P1 | Repeating the original scene plate created a hard horizontal seam when the roadmap scrolled. | Generated one continuous long-route background and removed the repeated plate. | `qa/tide-observatory/main-upgrade/history/pass2-roadmap-scroll-390x844.png` → final scrolled capture |
| 3 | P2 | The lighthouse cropped too aggressively at 320 px and the long date wrapped. | Added compact scene positioning and a short date treatment below 360 px. | `qa/tide-observatory/main-upgrade/final-responsive-320x700.png` |
| 4 | P2 | The quest navigator initially repeated scheduled time for completed work. | Bound completed entries to `completedAt` and kept scheduled time for active/upcoming entries. | Final navigator capture and focused tests |

## Interaction, accessibility and runtime evidence

- `Begin quest` navigated to `/quest/quest-calculus/complete`; the completion screen exposed Light, Normal, Intense, Add proof and Confirm completed quest controls.
- The dropdown exposed four named jump controls with distinct scheduled, upcoming, completed, and overdue states. Selecting Evening mobility moved the roadmap scroll position to 506 px.
- The final interactive snapshot exposed named buttons for notifications, quest creation, all four quests, the primary CTA, and single-name Today/Journey/Calendar/Profile tabs.
- Roadmap level and boss health remain named progress bars in component tests.
- With browser reduced motion enabled, screenshots captured two seconds apart were byte-identical, proving the drift and pulse layers became static.
- The production export reported no browser application errors or console warnings during the final Today capture.
- Expo's development server remains susceptible to a host watcher/DevTools sandbox failure, so final browser QA used the stable exported production bundle. This is an environment limitation, not an application runtime error.

## Open questions and follow-up polish

- P3: notification and create-quest controls are intentionally present even though the generated source omits them; they preserve current Today functionality.
- P3: metadata makes the production state denser than the concept image; the density is intentional and remains organized by card hierarchy, route position, and dropdown navigation.
- Native-device GPU and memory profiling remains a release concern, not a blocker for this branch experiment.

## Implementation checklist

- [x] Source and implementation compared at the same 390 × 844 viewport.
- [x] Top, full-roadmap, dropdown, and narrow-mobile states reviewed.
- [x] All P0/P1/P2 findings fixed and recaptured.
- [x] Primary CTA and direct quest navigation exercised in the browser.
- [x] Reduced-motion and narrow-viewport behavior verified.
- [x] Native text, progress semantics and backend-ready data paths preserved.
- [x] Prior card-based Today screen retained as a compilable rollback component.

final result: passed
