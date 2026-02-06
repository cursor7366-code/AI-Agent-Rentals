# CURRENT PROJECT: Al Brooks CVAT Labeling

**Status:** Setting up CVAT project for labeling
**Updated:** 2026-02-05 22:37 UTC

---

## What We're Building

Training dataset for trading pattern detection from Al Brooks course slides.
- 17 slides extracted, ready to upload
- Two-pass labeling system (candles → overlays → merge)

## CVAT Project

- **ID:** #365228
- **URL:** https://app.cvat.ai/projects/365228
- **Creds:** nicholas02 / Allen04348

## Current State

| Item | Status |
|------|--------|
| Project created | ✅ #365228 |
| Labels | ✅ 9 labels (see below) |
| Task + slides upload | ✅ Task #2000588 "Al Brooks Slides - Batch 1" |
| Job ready | ✅ Job #3586048 (17 frames, 0-16) |
| Labeling | 🔄 IN PROGRESS - 38 annotations on slide 1 |

### Labels (9 total)
- **candle_box** (rectangle) - with polarity + occluded attributes
- **wick_top** (point)
- **body_top** (point)
- **body_bottom** (point)
- **wick_bottom** (point)
- **zone** (rectangle)
- **trendline** (polyline)
- **arrow** (polyline)
- **text_callout** (rectangle)

## Workflow Validated ✅
- Rectangle tool → candle_box
- Points tool → wick_top, body_top, body_bottom, wick_bottom
- User successfully labeled 38 objects on slide 1

## Next Steps

1. **Continue Pass A** (candles) on remaining slides
2. **Set polarity attribute** on each candle_box
3. **Pass B** (overlays) - after Pass A complete

## Key Files

- Detailed spec: `memory/topics/cvat-labeling.md`
- Slides: `cvat-slides/Slides/` (17 images)

## Quick Reference

**Layer 1 (Candles):** candle_box + candle_kp (4 keypoints) per bar
**Layer 2 (Overlays):** zone, trendline, arrow, text_callout
**Merge:** Snap overlays to bar indices 0..N-1

**Polarity → OHLC:**
- Bull: Open=body_bottom, Close=body_top
- Bear: Open=body_top, Close=body_bottom
