# Odyssey Living Shore Design QA

## QA target

- Source visual truth: `docs/assets/ui/living-shore-today-3d-direction.png`
- Final implementation capture: `qa/today-390x844-final.png`
- Final side-by-side evidence: `qa/today-comparison-final.png`
- Target viewport: 390 x 844 CSS pixels, DPR 1, touch/mobile emulation, light mode
- Target state: Today, Friday 17 July; Study Boss at 62% health; roadmap level 4
  of 10; Calculus Focus Session scheduled at 7:00 PM
- Data state: realistic synthetic presentation data through the replaceable mock
  API adapter
- Graphics state: real WebGL path verified with Chrome SwiftShader; poster-only
  fallback verified separately with WebGL unavailable

The final comparison uses the same viewport and state on both sides. A separate
focused crop was not required: both 390 x 844 panels remain readable at native
mobile size, including the type hierarchy, boss card, quest card, CTA, and tab
bar.

## Fidelity review

### Composition and hierarchy

- Preserved the source's open sky, bright turquoise water, warm sand path,
  footprint journey, compact top status, one dominant daily quest, boss health,
  and persistent four-destination navigation.
- Kept the featured quest and Begin quest action inside the first useful mobile
  viewport at 390 x 844.
- Deliberately converted the source's tiny free-floating labels into touch-safe
  white surfaces and a 56-point CTA. This is an accessibility and implementation
  adaptation, not a product-flow change.

### Typography and color

- Bricolage Grotesque provides the expressive editorial display voice; Manrope
  provides compact, readable body and control text.
- Navy, sun yellow, coral, sea-glass turquoise, sky blue, and warm sand stay
  aligned with the approved reference.
- Boss health, roadmap progress, status, priority, and intensity remain visibly
  distinct instead of sharing one ambiguous progress treatment.

### Assets and depth

- The background is a generated high-resolution Living Shore poster sized for
  the mobile composition; it is not CSS art or a stretched screenshot.
- Capable clients add a transparent React Three Fiber layer with moving
  sea-glass motes, a floating route marker, and a subtle footprint current.
- The 3D layer never owns navigation or success state. WebGL failure, reduced
  motion, or Calm graphics quality retains the complete poster experience.

## Comparison history and resolved findings

| Pass | Severity | Finding | Resolution | Evidence |
| --- | --- | --- | --- | --- |
| Welcome pass 1 | P0 | Headless Chrome could not create a WebGL context and React Three Fiber raised a full-screen error overlay. | Added an explicit WebGL capability probe and intentional poster fallback before mounting Canvas. | `qa/welcome-390x844-pass1.png` to `qa/welcome-390x844-pass2.png` |
| Today pass 1 | P2 | The featured quest consumed too much vertical space and pushed the primary CTA under the tab bar. | Reduced decorative world breathing room and card metadata while preserving quest semantics and touch sizes. | `qa/today-390x844-pass1.png` to `qa/today-390x844-pass2.png` |
| WebGL pass 1 | P2 | The first real-time scene duplicated the shore, sun, and water with large geometry that competed with the interface. | Rebuilt the scene as a transparent, restrained layer of sea-glass motes, route marker, and subtle footprints. | `qa/today-390x844-webgl.png` to `qa/today-390x844-webgl-pass3.png` |
| WebGL pass 2 | P2 | GPU composition could intermittently paint moving geometry over CTA text, and translucent tab chrome exposed content underneath. | Added explicit backdrop/content stacking and made the tab bar fully opaque. | `qa/today-390x844-webgl-pass2.png` to `qa/today-390x844-final.png` |
| Narrow viewport | P2 | At 320 x 700 the featured card continues below the first viewport. | Verified the content remains intentionally scrollable and the CTA clears the fixed tab bar after scroll, with no clipped action. | `qa/today-320x700-responsive.png` and `qa/today-320x700-scrolled.png` |

## Interaction and state verification

- Welcome -> Explore demo -> Today.
- Today -> Begin quest -> record actual intensity -> confirm completion.
- Confirmed completion receipt showed XP/rubies before navigation; the connected
  goal then showed Study Boss health moving from 62% to 55%.
- Goal creation -> protected roadmap generation -> editable proposal review ->
  rename level -> reorder level -> explicit acceptance -> active goal.
- Today, Journey, Calendar, and Profile tabs all navigated successfully.
- Settings -> Accessibility persisted reduced-motion and Calm graphics choices
  across reload, then returned to system/auto.
- Choice controls expose pressed state, switches expose checked state, progress
  bars expose names and bounds, and primary controls remain at least 48 points.
- The 320 x 700 Today layout scrolls to the CTA and additional quests without the
  fixed tab bar blocking interaction.
- The WebGL-capable path reported an active canvas; the no-WebGL path remained a
  clean, complete poster fallback.

## Console and runtime review

- Latest WebGL-capable Today pass: no console errors and no application warnings.
- Remaining P3: Three r185 emits one development-only deprecation warning because
  React Three Fiber still constructs `THREE.Clock`. The app does not call Clock
  directly, production export succeeds, and no safe SDK-compatible change is
  currently required.
- Agent Browser CLI was unavailable in the environment, so browser QA used the
  existing Chrome DevTools connection and the same required screenshot,
  accessibility-tree, interaction, console, and viewport checks.

## Open findings

- P0: none
- P1: none
- P2: none
- P3: upstream `THREE.Clock` development warning; native-device GPU performance
  should still be profiled on representative low-, mid-, and high-tier hardware
  before store release.

final result: passed
