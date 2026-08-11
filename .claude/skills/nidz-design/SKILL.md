---
name: nidz-design
description: Source de vérité Produit, UX/UI et Design System de Nidz. Use for any task involving Nidz screens, components, layouts, colors, typography, spacing, navigation, forms, responsive behavior, mobile UX, trust signals, accessibility, UX writing, or visual design.
---

# Nidz Design

Before creating, modifying, reviewing, or refactoring any user-facing Nidz interface, read:

`NIDZ_DESIGN_SYSTEM.md`

Treat that document as the source of truth for Nidz product UX, UI and design decisions.

## Priority

When another skill, agent, design pattern, existing legacy UI, or generic recommendation conflicts with the Nidz design system:

**Nidz rules win.**

This includes recommendations from:
- Impeccable
- ui-designer
- generic Apple-inspired design principles
- shadcn examples
- Tailwind examples
- existing legacy UI in the application

## Rules

- Do not invent new brand colors, typography, spacing rules, trust badges, or visual conventions when the Nidz design system already defines them.
- Reuse existing semantic design tokens and components whenever possible.
- Preserve mobile-first behavior, accessibility, i18n and RTL.
- Never make a simulated feature look genuinely functional.
- Never invent verification, reviews, availability, payment protection, booking confirmation, insurance, trust metrics, or user data.
- Prefer clarity, trust and serenity over decorative effects.
- Use Lucide as the interface icon family when icons are needed.
- Keep Inter as the main interface font unless the Nidz design system explicitly says otherwise.
- Keep one visually dominant primary action per decision context.
- Avoid unnecessary gradients, heavy shadows, decorative hover zoom, glassmorphism, and visual noise.
- If the requested change conflicts with the source of truth, identify the conflict before implementing it.
- For each UI task, read only the relevant sections of `NIDZ_DESIGN_SYSTEM.md` rather than repeating or rewriting the whole document.

## Working Principle

Before changing the design, first ask:

1. Does this make the user's decision easier?
2. Does this make compatibility more understandable?
3. Does this make trust more honest?
4. Does this make the next action more obvious?

Only then improve aesthetics within the Nidz design system.
