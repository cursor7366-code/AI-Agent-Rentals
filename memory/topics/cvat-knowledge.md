# CVAT Knowledge Base

## What is CVAT?
Computer Vision Annotation Tool - open source web-based tool for labeling images/videos for ML training.

## Core Concepts

### Structure
- **Project** → contains multiple Tasks
- **Task** → contains multiple Jobs (the actual annotation work)
- **Job** → a subset of frames/images to annotate

### Labels & Attributes
- **Label** = type of object (e.g., "bullish_bar", "support_zone", "pattern_wedge")
- **Attribute** = property of label (e.g., color, quality, confidence)
  - **Unique** = immutable across frames
  - **Temporary** = can change per frame

### Shape Types
- **Rectangle** - bounding boxes (most common)
- **Polygon** - irregular shapes
- **Polyline** - lines/paths
- **Points** - single points or point groups
- **Ellipse** - circular/oval shapes
- **Cuboid** - 3D boxes
- **Brush/Mask** - pixel-level segmentation
- **Tag** - frame-level labels (no shape)

### Modes
- **Shape mode** - for images, each frame independent
- **Track mode** - for video, objects tracked across frames with interpolation
- **Attribute mode** - focus on setting attributes

## Key Shortcuts
| Action | Shortcut |
|--------|----------|
| Cursor/Select | Esc |
| Move image | Hold left mouse |
| Zoom | Mouse wheel |
| Fit image | Double-click |
| Rotate CW | Ctrl+R |
| Rotate CCW | Ctrl+Shift+R |
| Undo | Ctrl+Z |
| Redo | Ctrl+Y or Ctrl+Shift+Z |
| Occluded toggle | Q |
| Lock object | L |
| Merge shapes | M |
| Group shapes | G |
| Next frame | F (or arrow) |
| Prev frame | D (or arrow) |

## UI Layout
1. **Top navbar** - navigation, menu, save
2. **Main workspace** - image/video display
3. **Objects sidebar** (right) - list of annotations, labels, appearance
4. **Controls sidebar** (left) - shape tools, navigation, zoom

## Annotation Workflow
1. Select shape tool (rectangle, polygon, etc.)
2. Select label from dropdown
3. Draw shape on image
4. Adjust position/size as needed
5. Set attributes if required
6. Move to next frame
7. Save periodically (Ctrl+S)

## Drawing Rectangles
- **2-point method**: Click top-left, drag to bottom-right
- **4-point method**: Click 4 extreme points (top, bottom, left, right) - auto-completes

## Tips
- Lock completed objects (L) to avoid accidental edits
- Use occluded (Q) for partially hidden objects
- Group related shapes (G) for organization
- Can copy/paste shapes between frames
