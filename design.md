# AI Trip Planner -- Design System

> Dark theme only. Notion/Arc browser dark mode aesthetic with warm accents.
> Monospace-first typography. Premium travel guide feel, not generic AI chatbot.

---

## 1. Color Palette

All colors are defined as CSS custom properties on `:root`.

### Background Layers

| Variable              | Hex       | Usage                                      |
|-----------------------|-----------|--------------------------------------------|
| `--bg-primary`        | `#1A1A1E` | App root background, page canvas           |
| `--bg-secondary`      | `#222226` | Sidebar, navigation panels, grouped areas  |
| `--bg-surface`        | `#2A2A2F` | Cards, modals, dropdown menus              |
| `--bg-elevated`       | `#323238` | Hovered cards, popovers, floating elements |

### Text Layers

| Variable              | Hex       | Usage                                         |
|-----------------------|-----------|-----------------------------------------------|
| `--text-primary`      | `#EDEDEF` | Headings, primary body text                   |
| `--text-secondary`    | `#A0A0A8` | Descriptions, supporting text, labels         |
| `--text-tertiary`     | `#6B6B74` | Placeholders, disabled text, metadata         |

### Accent

| Variable              | Hex       | Usage                                           |
|-----------------------|-----------|-------------------------------------------------|
| `--accent`            | `#E49B5A` | Primary action buttons, active links, highlights |
| `--accent-hover`      | `#D88A47` | Hovered state of accent elements                |
| `--accent-muted`      | `#E49B5A1A` | Accent tinted backgrounds (10% opacity)       |

### Category Colors

| Variable              | Hex       | Category    | Usage                              |
|-----------------------|-----------|-------------|------------------------------------|
| `--cat-transport`     | `#5B9BD5` | Transport   | Flights, trains, buses, taxis      |
| `--cat-hotel`         | `#9B7FD4` | Hotel       | Hotels, hostels, stays             |
| `--cat-food`          | `#E08D54` | Food        | Restaurants, cafes, street food    |
| `--cat-activity`      | `#5BBD8A` | Activity    | Tours, sightseeing, experiences    |

Each category color also has a muted variant at 12% opacity for badge backgrounds:

| Variable                    | Hex           | Usage                        |
|-----------------------------|---------------|------------------------------|
| `--cat-transport-muted`     | `#5B9BD51F`   | Transport badge background   |
| `--cat-hotel-muted`         | `#9B7FD41F`   | Hotel badge background       |
| `--cat-food-muted`          | `#E08D541F`   | Food badge background        |
| `--cat-activity-muted`      | `#5BBD8A1F`   | Activity badge background    |

### Semantic Colors

| Variable              | Hex       | Usage                                    |
|-----------------------|-----------|------------------------------------------|
| `--success`           | `#5BBD8A` | Confirmed bookings, completed items      |
| `--warning`           | `#E4C65A` | Budget alerts, schedule conflicts        |
| `--error`             | `#D95555` | Errors, cancellations, failed actions    |
| `--info`              | `#5B9BD5` | Informational notices, help text         |

### Borders

| Variable              | Hex       | Usage                                      |
|-----------------------|-----------|--------------------------------------------|
| `--border-subtle`     | `#2E2E34` | Card borders, dividers between sections    |
| `--border-default`    | `#3A3A42` | Input borders, interactive card edges      |
| `--border-strong`     | `#4A4A54` | Focused inputs, active drag targets        |

### Tip Block Colors

| Variable              | Hex       | Usage                                      |
|-----------------------|-----------|--------------------------------------------|
| `--tip-teal`          | `#4DB8A4` | Tip block left border, tip icon fill       |
| `--tip-teal-bg`       | `#4DB8A40F` | Tip block background (6% opacity)        |
| `--warn-coral`        | `#D97B6B` | Warning block left border, warning icon    |
| `--warn-coral-bg`     | `#D97B6B0F` | Warning block background (6% opacity)    |

### Overlay

| Variable              | Hex           | Usage                          |
|-----------------------|---------------|--------------------------------|
| `--overlay`           | `#000000B3`   | Modal backdrop (70% black)     |

---

## 2. Typography

### Font Families

```css
--font-heading: 'JetBrains Mono', monospace;
--font-body: 'IBM Plex Mono', monospace;
--font-cost: 'JetBrains Mono', monospace; /* used with font-variant-numeric: tabular-nums */
```

Load from Google Fonts:

```
JetBrains Mono: 500, 600, 700
IBM Plex Mono: 400, 500, 600
```

### Type Scale -- Mobile (375px base)

| Element           | Font Family       | Size  | Weight | Line Height | Letter Spacing |
|-------------------|-------------------|-------|--------|-------------|----------------|
| Display / h1      | JetBrains Mono    | 28px  | 700    | 36px        | -0.5px         |
| Section title / h2| JetBrains Mono    | 22px  | 600    | 30px        | -0.3px         |
| Card title / h3   | JetBrains Mono    | 17px  | 600    | 24px        | 0px            |
| Body              | IBM Plex Mono     | 14px  | 400    | 22px        | 0px            |
| Body strong       | IBM Plex Mono     | 14px  | 600    | 22px        | 0px            |
| UI label / button | IBM Plex Mono     | 13px  | 500    | 18px        | 0.2px          |
| Caption / small   | IBM Plex Mono     | 12px  | 400    | 16px        | 0.1px          |
| Cost number       | JetBrains Mono    | 14px  | 600    | 22px        | 0px            |
| Cost total        | JetBrains Mono    | 18px  | 700    | 26px        | -0.2px         |

### Type Scale -- Desktop (1024px+)

| Element           | Font Family       | Size  | Weight | Line Height | Letter Spacing |
|-------------------|-------------------|-------|--------|-------------|----------------|
| Display / h1      | JetBrains Mono    | 36px  | 700    | 44px        | -0.8px         |
| Section title / h2| JetBrains Mono    | 26px  | 600    | 34px        | -0.4px         |
| Card title / h3   | JetBrains Mono    | 18px  | 600    | 26px        | 0px            |
| Body              | IBM Plex Mono     | 15px  | 400    | 24px        | 0px            |
| Body strong       | IBM Plex Mono     | 15px  | 600    | 24px        | 0px            |
| UI label / button | IBM Plex Mono     | 13px  | 500    | 18px        | 0.2px          |
| Caption / small   | IBM Plex Mono     | 12px  | 400    | 16px        | 0.1px          |
| Cost number       | JetBrains Mono    | 15px  | 600    | 24px        | 0px            |
| Cost total        | JetBrains Mono    | 22px  | 700    | 30px        | -0.3px         |

### Cost Number Formatting

```css
.cost {
  font-family: var(--font-cost);
  font-variant-numeric: tabular-nums;
  text-align: right;
}
```

---

## 3. Spacing

Base unit: **4px**

| Token      | Value | Usage                                                  |
|------------|-------|--------------------------------------------------------|
| `--sp-1`   | 4px   | Inline icon gap, tight internal padding                |
| `--sp-2`   | 8px   | Gap between badge and text, small internal padding     |
| `--sp-3`   | 12px  | Card internal padding (mobile), input padding          |
| `--sp-4`   | 16px  | Card internal padding (desktop), gap between elements  |
| `--sp-5`   | 20px  | Section sub-gap, form field spacing                    |
| `--sp-6`   | 24px  | Gap between cards, content padding on mobile           |
| `--sp-8`   | 32px  | Section padding, major layout gaps                     |
| `--sp-10`  | 40px  | Page-level top/bottom padding on mobile                |
| `--sp-12`  | 48px  | Page-level top/bottom padding on desktop               |
| `--sp-16`  | 64px  | Hero section vertical padding                          |

### Container Padding

- Mobile (375px): 16px horizontal padding
- Tablet (768px): 32px horizontal padding
- Desktop (1024px+): centered container, max-width 960px, 40px horizontal padding

---

## 4. Component Patterns

### 4.1 Cards

The primary container for itinerary items, day groups, and informational blocks.

```
Background:    var(--bg-surface)
Border:        1px solid var(--border-subtle)
Border radius: 12px
Padding:       16px (mobile) / 20px (desktop)
```

**Card hover state:**
```
Background:    var(--bg-elevated)
Border:        1px solid var(--border-default)
```

**Day card (collapsible):**
```
Header:        Day label (h3) + date + chevron icon (right-aligned)
                Chevron rotates 180deg on expand
Collapsed:     Shows header only, 52px height
Expanded:      Header + list of itinerary item cards nested inside
                Inner items have 8px gap between them
Left accent:   None by default; optional 3px left border using category color
```

**Category indicator on itinerary item cards:**
```
Left border:   3px solid var(--cat-{category})
               Applied to the card's left edge
```

### 4.2 Buttons

**Primary:**
```
Background:    var(--accent)
Color:         #1A1A1E
Font:          IBM Plex Mono, 13px, weight 600
Padding:       10px 20px
Border radius: 8px
Border:        none
Hover:         background var(--accent-hover)
Active:        opacity 0.85
Disabled:      opacity 0.4, pointer-events none
```

**Secondary:**
```
Background:    transparent
Color:         var(--text-primary)
Font:          IBM Plex Mono, 13px, weight 500
Padding:       10px 20px
Border radius: 8px
Border:        1px solid var(--border-default)
Hover:         background var(--bg-elevated), border-color var(--border-strong)
Active:        opacity 0.85
```

**Ghost:**
```
Background:    transparent
Color:         var(--text-secondary)
Font:          IBM Plex Mono, 13px, weight 500
Padding:       8px 12px
Border radius: 8px
Border:        none
Hover:         background var(--bg-elevated), color var(--text-primary)
```

**Icon-only:**
```
Width/Height:  36px
Border radius: 8px
Background:    transparent
Color:         var(--text-secondary)
Hover:         background var(--bg-elevated), color var(--text-primary)
Display:       flex, center-center
```

### 4.3 Inputs

```
Background:    var(--bg-secondary)
Color:         var(--text-primary)
Font:          IBM Plex Mono, 14px, weight 400
Padding:       10px 12px
Border:        1px solid var(--border-default)
Border radius: 8px
Placeholder:   color var(--text-tertiary)
Focus:         border-color var(--accent), box-shadow 0 0 0 3px var(--accent-muted)
Error:         border-color var(--error)
```

### 4.4 Badges / Chips

Used for category labels on itinerary items.

```
Font:          IBM Plex Mono, 11px, weight 600, uppercase
Letter spacing: 0.5px
Padding:       4px 8px
Border radius: 6px
Background:    var(--cat-{category}-muted)
Color:         var(--cat-{category})
```

### 4.5 Tip and Warning Blocks

**Tip block:**
```
Background:    var(--tip-teal-bg)
Border-left:   3px solid var(--tip-teal)
Border radius: 0 8px 8px 0
Padding:       12px 16px
Font:          IBM Plex Mono, 13px, weight 400
Color:         var(--text-secondary)
Icon:          Lightbulb, colored var(--tip-teal), 16px, left of text
```

**Warning block:**
```
Background:    var(--warn-coral-bg)
Border-left:   3px solid var(--warn-coral)
Border radius: 0 8px 8px 0
Padding:       12px 16px
Font:          IBM Plex Mono, 13px, weight 400
Color:         var(--text-secondary)
Icon:          AlertTriangle, colored var(--warn-coral), 16px, left of text
```

### 4.6 Skeleton Loaders

Replace content regions while data is loading. Three variants:

**Text skeleton:**
```
Height:        14px (single line)
Width:         randomized 60-90% to look natural
Border radius: 4px
Background:    var(--bg-elevated)
Shimmer:       linear-gradient moving left-to-right
               from transparent through #FFFFFF0D (5% white) back to transparent
```

**Card skeleton:**
```
Height:        120px
Border radius: 12px
Background:    var(--bg-surface)
Inner lines:   3 text skeletons at 80%, 65%, 40% widths, 8px gap
```

**Cost skeleton:**
```
Height:        14px
Width:         60px
Border radius: 4px
Aligned:       right within its container
```

### 4.7 Toast / Notification

```
Position:      fixed, bottom 24px, center horizontal (mobile) / right 24px (desktop)
Background:    var(--bg-elevated)
Border:        1px solid var(--border-default)
Border radius: 10px
Padding:       12px 16px
Font:          IBM Plex Mono, 13px, weight 500
Color:         var(--text-primary)
Max width:     360px
Left accent:   3px solid, colored by semantic type (success/warning/error/info)
Shadow:        0 4px 16px #0000004D
Auto-dismiss:  4000ms
```

### 4.8 Modal / Dialog

```
Overlay:       var(--overlay) covering viewport
Container:     var(--bg-surface)
Border:        1px solid var(--border-subtle)
Border radius: 16px
Padding:       24px (mobile) / 32px (desktop)
Max width:     480px
Width:         calc(100% - 32px) on mobile
Shadow:        0 8px 32px #00000066
Header:        JetBrains Mono, 18px, weight 600
Body:          IBM Plex Mono, 14px, weight 400
Footer:        Right-aligned action buttons, 8px gap
```

### 4.9 Timeline / Drag-and-Drop

The itinerary day view is a vertical timeline with drag-and-drop reordering.

**Timeline rail:**
```
Width:         2px
Color:         var(--border-default)
Position:      left 19px (mobile) / left 23px (desktop), spanning full height of day
```

**Timeline node:**
```
Width/Height:  12px
Border radius: 50%
Background:    var(--cat-{category})
Border:        2px solid var(--bg-surface)
Position:      centered on the rail, vertically aligned with card title
```

**Drag handle:**
```
Position:      right side of each itinerary card, vertically centered
Icon:          6-dot grip (GripVertical), 16px
Color:         var(--text-tertiary)
Hover:         color var(--text-secondary)
Cursor:        grab (grabbing while dragging)
```

**Drag active state:**
```
Card:          opacity 0.92, scale(1.02)
               border-color var(--accent)
               box-shadow 0 8px 24px #00000040
Drop zone:     2px dashed border, color var(--accent-muted)
               height 4px expanding to card height on hover
```

---

## 5. Animations

All animations are minimal and smooth. No bouncing, no elastic easing, no decorative motion.

| Element              | Property               | Duration | Easing                      | Notes                                     |
|----------------------|------------------------|----------|-----------------------------|--------------------------------------------|
| Card expand/collapse | height, opacity        | 250ms    | `cubic-bezier(0.25, 0.1, 0.25, 1)` | Chevron rotates 180deg in sync    |
| Card hover           | background, border     | 150ms    | `ease-out`                  |                                            |
| Page transition      | opacity, transform(Y)  | 200ms    | `cubic-bezier(0.25, 0.1, 0.25, 1)` | Enter: translateY(8px) to 0, fade in |
| Skeleton shimmer     | background-position    | 1500ms   | `linear`, infinite          | Gradient slides left to right continuously |
| Drag pickup          | scale, box-shadow      | 150ms    | `ease-out`                  | Scale to 1.02, shadow appears              |
| Drag drop            | scale, box-shadow      | 200ms    | `cubic-bezier(0.25, 0.1, 0.25, 1)` | Scale back to 1, shadow fades   |
| Toast enter          | opacity, translateY    | 200ms    | `cubic-bezier(0.25, 0.1, 0.25, 1)` | Slide up 12px + fade in         |
| Toast exit           | opacity, translateY    | 150ms    | `ease-in`                   | Slide down 8px + fade out                  |
| Button press         | opacity                | 100ms    | `ease-out`                  |                                            |
| Modal enter          | opacity, scale         | 200ms    | `cubic-bezier(0.25, 0.1, 0.25, 1)` | Scale from 0.97 to 1 + fade in |
| Modal overlay enter  | opacity                | 200ms    | `ease-out`                  | Backdrop fades in                          |
| Chevron rotation     | transform(rotate)      | 250ms    | `cubic-bezier(0.25, 0.1, 0.25, 1)` | Synced with card expand/collapse |
| Focus ring           | box-shadow             | 150ms    | `ease-out`                  | Accent glow appears on input focus         |

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 6. Responsive Breakpoints

### Mobile -- 375px (base)

- Single-column layout
- Full-width cards with 16px horizontal page padding
- Bottom navigation bar (fixed, 56px height)
- Day cards stack vertically, 16px gap
- Timeline rail hidden; category shown via left border on cards
- Collapsible day headers are tap targets (full-width, 52px height)
- Toasts appear centered at bottom, 16px from edge
- Modal takes near-full screen (16px margin all sides)
- Cost column right-aligned within card body

### Tablet -- 768px (md)

```css
@media (min-width: 768px) { ... }
```

- Content max-width: 720px, centered
- 32px horizontal page padding
- Sidebar navigation option (240px, collapsible)
- Day cards can show 2-column grid for itinerary items within a day
- Timeline rail visible on left
- Modal max-width 480px, centered with overlay
- Toasts positioned bottom-right

### Desktop -- 1024px (lg)

```css
@media (min-width: 1024px) { ... }
```

- Content max-width: 960px, centered
- 40px horizontal page padding
- Persistent left sidebar (260px)
- Main content area: full timeline view with rail + cards
- Day cards support drag-and-drop reordering
- Itinerary items in a day: single-column list along the timeline
- Side panel (right, 320px) for detail view / editing an item
- Cost summary table with right-aligned tabular numbers
- Toasts positioned bottom-right, 24px from edges

### Layout Summary

```
Mobile (< 768px):
  [  Full-width single column  ]
  [  Bottom nav (fixed 56px)   ]

Tablet (768px - 1023px):
  [ Sidebar 240px | Content (centered, max 720px) ]

Desktop (1024px+):
  [ Sidebar 260px | Timeline + Cards (max 960px) | Detail panel 320px ]
```

---

## 7. Inspiration References

### Notion Dark Mode
- Warm dark grays instead of pure black
- Clean card-based layout with subtle borders
- Restrained use of color -- most of the UI is neutral, color used only for meaning
- Generous whitespace, content-first hierarchy

### Arc Browser
- Warm accent tones (amber/orange range)
- Translucent layered surfaces
- Compact, information-dense UI that still feels breathable
- Sidebar-driven navigation

### Monospace / Developer Aesthetic
- JetBrains Mono and IBM Plex Mono carry a technical, precise personality
- Tabular number alignment for cost data gives a spreadsheet-grade clarity
- Code-block-style tip/warning containers with left border accents

### Premium Travel Guide Feel
- Category color coding brings editorial structure (like Monocle or Cereal magazine)
- Collapsible day-by-day structure mirrors a curated guidebook
- Tip blocks styled like editorial callouts, not chatbot bubbles
- Cost data presented with financial precision, not conversational filler

### What This Is Not
- No purple/blue AI gradients
- No Inter, Arial, Roboto, or other sans-serif body fonts
- No chatbot bubble UI
- No heavy drop shadows or glassmorphism
- No light mode
