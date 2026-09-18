---
name: Rakshi Coco ERP Design System
colors:
  primary: '#0B4A28'
  primary-dark: '#07321A'
  secondary: '#D97706'
  background: '#F8FAFC'
  surface: '#FFFFFF'
  text: '#0F172A'
  muted: '#64748B'
  border: '#E2E8F0'
  success: '#16A34A'
  warning: '#F59E0B'
  error: '#DC2626'
typography:
  headings:
    fontFamily: Inter
    fontWeight: '600'
  body:
    fontFamily: Inter
    fontWeight: '400'
  labels:
    fontFamily: Inter
    fontWeight: '500'
rounded:
  sm: 4px
  DEFAULT: 6px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px
---

## Brand & Style
The design system for Rakshi Coco ERP visually communicates **professionalism, agriculture, and operational efficiency**. It is a **production-quality business management system** designed for high information density and fast data entry.
- Do NOT imitate consumer apps. It must feel like a credible, premium ERP system.
- Avoid excessive gradients, shadows, or decorative elements. Focus on data readability.
- The interface uses clean cards, subtle borders, and professional charts.

## Colors
The color palette uses a semantic language suited for agriculture and finance:
- **Deep Green (`#0B4A28`)**: Primary actions, branding, active states.
- **Amber/Husk (`#D97706`)**: Highlights, secondary actions, and important statuses like pending.
- **Slate Backgrounds**: To reduce eye strain during long operational use.

## Typography
- **Inter** is the core typeface for all text. It offers excellent legibility for dense tables and forms.
- Use tabular numerals for financial data so digits align vertically in tables.
- Keep headings clear but not overly large to maximize screen space for data.

## Layout & Components
- **Tables**: Compact but comfortable. Always include 1px borders for structure. Rows should highlight on hover.
- **Cards**: Flat or very subtle shadows (e.g., `box-shadow: 0 1px 3px rgba(0,0,0,0.1)`). 6px or 8px border radius.
- **Forms**: Clear input fields with a light background on focus. Use a 1px border.
- **Badges**: Use semantic colors (Green for Ready/Completed, Amber for Pending/Processing, Red for Cancelled/Error, Gray for Draft).

## Application Rules
- Ensure large touch targets for mobile usability (drivers, field workers), but allow dense layouts on desktop for the owner/accountant.
- Use explicit visual separation for financial vs operational data.
- Emphasize traceability timelines using vertical steppers or clean flowcharts.
