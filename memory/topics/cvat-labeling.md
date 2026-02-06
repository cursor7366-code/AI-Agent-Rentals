# Al Brooks Slides Labeling Specification

## Overview
Two-layer labeling system for trading chart annotation.
- **Layer 1:** Candles (OHLC geometry)
- **Layer 2:** Overlays (human interpretation)
- **Merge:** Snap overlays to bar indices

---

## Layer 1: Candles

### What You Label
For every candle (81-85 per slide):

| Label | Type | Purpose |
|-------|------|---------|
| `candle_box` | rectangle | Grouping, ordering, overlap tests |
| `candle_kp` | skeleton (4 pts) | Exact candle geometry |

### Skeleton Keypoints
```
    wick_top (High)
        │
    body_top ─── Close (bull) / Open (bear)
        │
    body_bottom ── Open (bull) / Close (bear)
        │
    wick_bottom (Low)
```

### Attributes
- `polarity`: bull | bear | doji | unknown
- `occluded`: 0 | 1 (for partially hidden candles)

### OHLC Derivation
| Polarity | Open | High | Low | Close |
|----------|------|------|-----|-------|
| Bull | body_bottom | wick_top | wick_bottom | body_top |
| Bear | body_top | wick_top | wick_bottom | body_bottom |
| Doji | body_bottom ≈ body_top | wick_top | wick_bottom | body_top |

### Bar Indexing
After labeling: sort candle_box by x-center left→right → bars 0..N-1

---

## Layer 2: Overlays

### What You Label
| Label | Type | Description |
|-------|------|-------------|
| `zone` | rectangle/polygon | Entry/exit zones, highlights |
| `trendline` | 2-point polyline | Wedge boundaries, channels |
| `arrow` | 2-point polyline | Tail → head (points at bar) |
| `text_callout` | rectangle | Tight box around annotation text |

### What Overlays Represent
- Which region of chart matters
- Which bars are being referenced
- Pattern boundaries
- Attention direction (arrows)
- Pattern names (text)

---

## Labeling Workflow

### Why Two Passes
Overlays cover candles. Labeling both at once causes:
- Distraction from overlay colors
- Drift on wick-tip precision
- Missed candles / misplaced keypoints
- Noisy candle data → broken pattern logic

### Process
1. **Pass A:** Candles only, ignore overlays
2. **Pass B:** Overlays only, ignore candles
3. **Merge:** Snap overlays to bar indices

---

## Merge Logic

### Zone → Bar Range
```python
for each zone:
    bars_inside = [b for b in candles if zone.contains(b.center_x)]
    output: "zone applies to bars [12..18]"
```

### Arrow → Target Bar
```python
arrow_head = arrow.points[1]  # tail→head
target_bar = nearest_candle_by_x(arrow_head)
output: "arrow points to bar 27"
```

### Trendline → High/Low References
```python
for endpoint in trendline.points:
    bar = nearest_candle_by_x(endpoint)
    if closer_to(endpoint, bar.wick_top):
        ref = f"bar {bar.index} high"
    else:
        ref = f"bar {bar.index} low"
output: "trendline uses (bar 5 high) → (bar 21 high)"
```

### Text Callout → Attachment
```python
target = nearest_arrow_or_zone(text_box)
output: "'Wedge Bottom' attached to zone z3 / bars 30-44"
```

---

## Final Output Structure

```json
{
  "bars": [
    {"index": 0, "ohlc": {...}, "keypoints": {...}},
    {"index": 1, "ohlc": {...}, "keypoints": {...}},
    ...
  ],
  "overlays": {
    "zones": [{"id": "z1", "bars": [12, 18], "type": "entry"}],
    "arrows": [{"id": "a1", "target_bar": 27}],
    "trendlines": [{"id": "t1", "from": "bar5.high", "to": "bar21.high"}],
    "text_callouts": [{"id": "tc1", "text": "Wedge Bottom", "attached_to": "z3"}]
  }
}
```

---

## CVAT Setup

### Project
- ID: #365228
- URL: https://app.cvat.ai/projects/365228

### Labels Required
| Name | Type | Attributes |
|------|------|------------|
| candle_box | rectangle | polarity, occluded |
| candle_kp | skeleton | (4 keypoints) |
| zone | rectangle | - |
| trendline | polyline | - |
| arrow | polyline | - |
| text_callout | rectangle | - |

### Skeleton: candle_kp
Must be created via visual editor with 4 points:
1. wick_top
2. body_top
3. body_bottom
4. wick_bottom

---

## One-Sentence Summary
> Candles are the raw price geometry. Overlays are the human interpretation. Label them separately for accuracy, then merge by snapping overlay geometry onto candle bar indices.
