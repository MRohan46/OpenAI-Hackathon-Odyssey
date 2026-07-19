# First Island Hero — Design QA

- **Source visual truth:** `.agents/audits/hero-2026-07-19/source-visual-truth.jpg`
- **Mobile implementation:** `.agents/audits/hero-2026-07-19/mobile-production.png`
- **Desktop implementation with WebGL:** `.agents/audits/hero-2026-07-19/desktop-production-webgl.png`
- **Mobile comparison:** `.agents/audits/hero-2026-07-19/mobile-source-comparison.jpg`
- **Desktop comparison:** `.agents/audits/hero-2026-07-19/desktop-source-comparison.jpg`
- **Viewports:** 390 × 844 mobile; 320 × 700 compact; 1440 × 900 desktop
- **State:** Welcome route, normal motion; reduced-motion and WebGL-unavailable fallbacks checked separately

## Full-view comparison evidence

The comparison boards place the supplied left/right creature references, the selected coastal-route background, and Odyssey's locked Living Shore north-star beside the rendered production export. The implementation preserves the bright turquoise route, editorial Bricolage hierarchy, calm native controls, and broad Living Shore radii while introducing the requested game-world progression framing.

Both supplied creatures are present as clean transparent assets, placed on opposite sides, tilted in opposing directions, and scaled without stretching. The route artwork remains visible through the center. Native text and controls sit above the image/Three.js world, so the visual spectacle does not rasterize or obscure the product's authority and navigation boundaries.

A separate focused crop was not needed: the 390 × 844 production capture preserves the source assets, headline, supporting copy, route approval panel, and both primary navigation controls at readable inspection size. Exact browser geometry supplements the visual evidence: `bodyScrollWidth` equals `bodyClientWidth` at 320, 390, and 1440 pixels, and all principal controls remain inside the target viewport.

## Required fidelity surfaces

### Fonts and typography

- Bricolage Grotesque remains the display family and Manrope remains the UI/body family, matching Odyssey's locked system.
- The mobile headline resolves into a deliberate three-line silhouette at 390 px, with no truncation or horizontal overflow.
- Desktop hierarchy expands to 78 px without displacing the two main calls to action beyond the 900 px viewport.
- Eyebrows use restrained tracking and remain supporting labels rather than a third display style.

### Spacing and layout rhythm

- The hero uses one centered world composition instead of stacked generic cards.
- Mobile companion placement frames the central route and avoids the headline and calls to action.
- The route approval panel bridges the cinematic world and native action area; its three stages stay evenly distributed at 320, 390, and 1440 px.
- 390 × 844: primary action spans x=16–374 and y=695–751; secondary spans x=16–374 and y=759–815.
- 320 × 700: primary spans y=559–615 and secondary spans y=623–679.
- 1440 × 900: primary and secondary actions remain aligned as a balanced pair.

### Colors and visual tokens

- Deep Odyssey ink, warm sun yellow, turquoise water, and mist-white surfaces map to the existing product tokens.
- The lower translucent ink veil preserves button/card contrast without hiding the route artwork.
- Yellow remains an accent rather than body text; white and ink carry the readable content.

### Image quality and asset fidelity

- The supplied creature images were background-cleaned non-destructively into `assets/images/first-island/` and retain their original line art and color treatment.
- Both outputs have RGBA channels with transparent corners and no visible checkerboard in production captures.
- The route background uses the existing 2.5 MB coastal artwork at cover sizing, with no stretched sprite sheets or placeholder imagery.
- WebGL adds 36 drift particles, 11 animated haze volumes, three route rings, three light shafts, and three refractive route shards. Unsupported WebGL renders the same complete hero without a blank region or error overlay.

### Copy and content

- “World 01 / First Island,” “Choose / Chart / Conquer,” and the ten-level/mini-boss/final-victory language provide game progression without copying another game's UI.
- “Your route · always editable” and “You approve every level” preserve Odyssey's user-control rule for AI-generated roadmaps.
- Sign-up, sign-in, and demo labels remain explicit and all three routes are live.

## Accessibility and interaction states

- Decorative companions, background, and Three.js atmosphere are removed from the accessibility tree.
- Buttons retain native roles, labels, hints, focusability, and 44–56 px minimum heights.
- Reduced-motion preference stops entrance loops, companion float, background drift, and the Three.js scene's continuous motion.
- Trusted browser input verified `/sign-up`, `/sign-in`, and `/today` navigation from the production export with no application console errors.

## Comparison history

### Iteration 1 — P0 WebGL capability failure

- **Earlier finding:** Headless Chrome without a WebGL context received a renderer creation error because the new Canvas mounted unconditionally.
- **Fix:** Added a capability probe and made the raster/native motion composition the intentional fallback.
- **Post-fix evidence:** 390 × 844 production fallback reports zero canvases, no error toast, no console errors, and a complete rendered hero. SwiftShader verification reports one canvas and a complete rendered hero.

### Iteration 2 — P2 compact vertical fit

- **Earlier finding:** At 320 × 700, the primary and secondary actions began below the viewport.
- **Fix:** Added compact headline/body scale, tightened short-screen spacing, and reduced the companion-stage scale without changing the 390 or desktop composition.
- **Post-fix evidence:** At 320 × 700, the primary action ends at y=615 and secondary ends at y=679; horizontal scroll width remains exactly 320.

## Findings

- No actionable P0, P1, or P2 design issues remain.
- P3 follow-up: the third “Explore the living world” action intentionally begins just below the initial 390 × 844 fold; it remains reachable by a short scroll while the two decision-critical actions stay fully visible.

## Implementation checklist

- [x] Supplied creatures placed left and right with transparent backgrounds
- [x] Existing Living Shore route converted into a First Island world map
- [x] Ambient, responsive, entrance, and reduced-motion states implemented
- [x] WebGL capability fallback implemented
- [x] Mobile, compact, desktop, and production-export captures inspected
- [x] Primary navigation interactions verified
- [x] Fonts, spacing, tokens, imagery, and copy checked

final result: passed
