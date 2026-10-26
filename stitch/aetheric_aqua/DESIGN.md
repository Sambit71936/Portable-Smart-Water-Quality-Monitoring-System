# Design System: Liquid Intelligence

## 1. Overview & Creative North Star

The creative north star for this design system is **"The Submerged Command."** 

We are moving away from the standard "SaaS dashboard" aesthetic. Instead, we are building a high-end, editorial tool for industrial water management. The interface should feel like a piece of precision glass submerged in deep water—layered, luminous, and authoritative. 

We break the "template" look by utilizing **intentional asymmetry** and **tonal depth**. Data is not just displayed; it is curated. By using extreme typographic scales (pairing massive `display-lg` numbers with micro `label-sm` technical metadata) and overlapping glass containers, we create a sense of professional-grade sophistication that feels both futuristic and grounded.

---

## 2. Colors & Surface Philosophy

The palette is rooted in the abyss. We use a deep `background` (#080e17) to provide the canvas for our "bioluminescent" functional accents.

### The "No-Line" Rule
Standard 1px solid borders are strictly prohibited for sectioning. They create visual noise and a "cheap" boxed feel. Instead, boundaries must be defined through:
- **Background Color Shifts:** Use `surface-container-low` vs. `surface-container-high` to distinguish areas.
- **Glassmorphism:** Use the `surface-variant` token at 40-60% opacity with a `backdrop-filter: blur(20px)` to define a container’s edge.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of frosted glass.
- **Base:** `surface-dim` (#080e17).
- **Navigation/Large Containers:** `surface-container-low` (#0d141e).
- **Interactive Cards:** `surface-container-highest` (#1e2633).
- **Floating Overlays:** Use `surface-bright` with a 10-20% opacity `Ghost Border`.

### The "Glass & Gradient" Rule
To inject "soul" into the professional environment, main CTAs and hero gauges should utilize gradients. Transitioning from `primary` (#81ecff) to `primary-container` (#00e3fd) creates a sense of glowing energy that flat colors lack.

---

## 3. Typography

This system utilizes two distinct typefaces to balance technical precision with modern aesthetics.

*   **Headlines (Space Grotesk):** This is our "Technical Editorial" voice. Use `display` and `headline` scales for key metrics and section headers. Its geometric quirks suggest industrial innovation.
*   **Body & Data (Inter):** Our workhorse. Use `body` and `label` scales for all functional data, descriptions, and system logs.

**Hierarchy Strategy:** 
To achieve a premium look, push the contrast. Don't be afraid to put a `display-lg` metric next to a `label-sm` unit descriptor. This "Big/Small" relationship is a hallmark of high-end data visualization.

---

## 4. Elevation & Depth

We convey importance through **Tonal Layering** rather than structural lines or heavy drop shadows.

*   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` section to create a "recessed" feel. Place a `surface-container-highest` card on a `surface-dim` background to create "lift."
*   **Ambient Shadows:** For floating elements, use extremely diffused shadows. 
    *   *Blur:* 32px to 64px.
    *   *Opacity:* 6% - 10%.
    *   *Color:* Use a tinted version of `primary` or `on-surface`, never pure black.
*   **The "Ghost Border" Fallback:** If a card needs more definition against a busy background, use a 1px border with the `outline-variant` token at **15% opacity**. This provides a "shimmer" effect rather than a hard line.

---

## 5. Components

### Buttons
*   **Primary:** Solid `primary` fill with `on-primary` text. Add a `secondary` (#00ffab) outer glow (5px blur) for "Active/Running" states.
*   **Secondary (Interactive Glass):** `surface-variant` at 40% opacity, `backdrop-blur`, and a `primary` Ghost Border.
*   **Rounding:** Always use `full` (9999px) for buttons to contrast against the `xl` (24px) corners of cards.

### Semi-Circular Gauges
The heart of the Aqua Monitor. Use a 12px stroke width. The "track" should be `surface-container-highest`. The "progress" should be a gradient of `primary` to `secondary`. For critical alerts, the gradient shifts to `error_dim` to `error`.

### Cards & Lists
*   **No Dividers:** Never use a line to separate list items. Use 16px (`spacing-4`) of vertical breathing room or a subtle background shift on hover/tap (`surface-bright` at 5% opacity).
*   **Corner Radii:** Use `xl` (1.5rem/24px) for parent cards and `md` (0.75rem/12px) for nested elements.

### Progress Bars
Horizontal bars should use the `secondary` (#00ffab) token for healthy water levels, transitioning to `tertiary` (#a68cff) for chemical additives, and `error` (#ff716c) for contamination alerts.

---

## 6. Do’s and Don’ts

### Do:
*   **DO** use `xl` (24px) rounded corners for a soft, premium industrial feel.
*   **DO** leave ample white space (`spacing-8` or `spacing-10`) between major data clusters to allow the "Liquid" UI to breathe.
*   **DO** use typography to lead the eye—make the most important data point the largest thing on the screen.

### Don’t:
*   **DON'T** use 100% opaque `outline` tokens. It breaks the glass illusion.
*   **DON'T** use standard Material Design "elevated" shadows. They feel dated in a futuristic IoT context.
*   **DON'T** crowd the screen. If a user is monitoring critical water quality, cognitive load must be low. Use the `surface-container` hierarchy to group related items so the eye doesn't have to hunt for information.