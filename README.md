# Silk Vision — Ziplyft™ Eyelid Lift

The Ziplyft page, rebuilt on the Silk Vision design system from the
office-based surgery page
([silkvision-seal-of-approval](https://github.com/imageworksc/silkvision-seal-of-approval)).

**Staging:** <https://imageworksc.github.io/silkvision-ziplyft/>

## Structure

```
css/fonts.css        Poppins, embedded — shared, unchanged
css/tokens.css       colour, type, space, radius, motion — shared, unchanged
css/base.css         reset, layout primitives, dark-ground contract — shared, unchanged
css/components.css   the shared components, plus the Ziplyft set at the end
css/sections.css     this page's layouts; closing band and footer shared
css/motion.css       shared keyframes and reduced-motion contract, plus Ziplyft entries
js/main.js           shared menu/scroll/reveal code, plus slider, videos, sticky bar
```

The contract is the other project's `DESIGN.md`: no gradients, one typeface,
16px floor for sentences, 44px touch targets, motion only where it means
something, no CSS in the HTML.

### Bump `?v=` when you change a stylesheet or a script

GitHub Pages caches assets for ten minutes. Raise the version token on every
CSS/JS link in `index.html` on each deploy that touches them.

## What changed from the draft

- Inter dropped; Poppins only. All gradients replaced with flat fills.
- Hero is a split (flat navy + untouched photograph): a scrim would hide the
  eyelid, which is the point of the image.
- The "at a glance" box was removed — the comparison table says the same thing.
- Locations folded into the closing band and footer (one closing band, not two).
- The recovery timeline no longer animates on scroll — nothing in it is interactive.
- FAQ uses `<details name="faq">`: one open at a time, no script.
- The Dr. Silk video waits for a click and plays with sound; the mechanism
  loop plays silently only while on screen, with a pause button.

## Pending from the practice

- Approved price or starting price (dashed placeholder in the cost section).
- "Meet Dr. Silk" points to the About page until a bio URL exists.
- Before & after gallery link points to the slider on this page.
- Full transcript of Dr. Silk's video, for search.
