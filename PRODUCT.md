# Product

## Register

product

## Users

**Primary (Simple track) — non-technical first-time viewers.** Executives,
peer engineers, prospective collaborators, anyone reading the public URL
for the first time. Mobile or desktop; ambient lighting unknown. Job to
be done: understand what this tool tells them in under 30 seconds.

**Secondary (Advanced track) — capacity planners + hyperscaler PMs.**
Power users with their own fleet data, BoMs, and pricing. Job to be
done: model a fleet end-to-end, validate placement and profitability,
defend a planning decision. Desktop, focused work session.

Both audiences share one engine and one state; only presentation
differs.

## Product Purpose

A public-cloud VM packing simulator across Google Cloud, AWS, Azure, and
custom configurations. Given a fleet (hardware racks, regions, zones)
and a Bill of Materials (VM SKUs and quantities), it answers **five
questions** (v2.20.0 — the user's own words, now the front door on every
result surface; doctrine: the project docs):

1. **Supportable?** Is this deployment supportable on current capacity?
2. **Blocked?** Where are we blocked on the deployment, and why?
3. **Sellable?** How much more can we sell on this fleet?
4. **Investment?** Does new hardware investment make sense?
5. **Payback?** Will the investment pay off — and when?

The four metric families (Profitability · Headroom · Placement ·
Utilization) remain the supporting measurement vocabulary beneath the
questions; profitability-today is the standing context card.

Success: a first-time viewer leaves the URL knowing what the tool does,
and a capacity planner can defend their next placement — or purchase —
decision with specific numbers.

## Brand Personality

**Executive · premium · restrained.** Big numbers in service of small
decisions. Lots of whitespace. Color used for purpose, never decoration.
Voice is calm and direct: state the number, state the gap, name the
binding constraint, move on. No marketing register, no exclamation
points, no "supercharge your fleet."

References (in spirit, not in copy): Stripe Dashboard's hero numbers,
Notion Charts' chrome restraint, Linear's typographic confidence.

## Anti-references

Four explicit don'ts (locked in during product intake):

1. **Dense SaaS with 20 tabs.** The "every feature is equal" tab grid
   the peer feedback called out as "value buried under complexity."
2. **Vendor portal (Azure / AWS console).** Cluttered nav trees, info
   density without hierarchy, "I'm in someone else's UI" feel.
3. **Marketing-y SaaS hero with gradient text.** We're a tool, not a
   landing page. No "streamline your fleet planning today."
4. **Excel-as-a-website.** Endless tables and form fields. The "inputs
   ARE the product" trap the rebuild is escaping.

## Design Principles

Five strategic principles (NOT visual rules — those live in DESIGN.md):

1. **Outputs over inputs.** Land users on a result, not a form.
   Templates do the input; authoring is opt-in. The 90% case never
   authors. The 10% who do still get the full Advanced toolkit.

2. **Distance from ideal.** Every metric shows current value + target
   tick + gap callout. One visual idiom, used everywhere. Users learn
   the language once.

3. **Restraint over richness.** One answer per screen. Hierarchy beats
   density. If a Simple-track addition can't be understood in 30
   seconds by someone who hasn't used the tool, it belongs on Advanced.

4. **Honest about gaps.** When seed data is missing (per the Decoupling
   Doctrine, public catalogs ship without proprietary rates), surface a
   "why" callout pointing at the upload path. Never fabricate. Never
   silent-zero.

5. **Engine is the contract.** Simple and Advanced share `runMulti`,
   `runSimulation`, `sellableCapacity`, `revenueRollup`,
   `computeClusterFinancials`. Presentation never forks the math. State
   migrations affect both tracks.

## Accessibility & Inclusion

- **WCAG AA contrast** across both dark and light modes. Body text ≥
  4.5:1, large text ≥ 3:1. No "elegant" gray-on-tint that drops below.
- **Reduced motion** required. Every animation has a
  `@media (prefers-reduced-motion: reduce)` alternative — typically
  crossfade or instant. The Distance-from-Ideal primitive's motion is
  enhancement, never gate to comprehension.
- **Keyboard-first navigation.** Every interactive surface reachable
  without mouse. Matches existing Cmd/Ctrl+Z undo + Cmd-click selection
  patterns. Power-user audience expects this.

## Resolution path for the inherited-identity tension

**Locked in S24 intake: Option A — Re-skin.**

The locked personality ("executive, premium, restrained") is a
meaningful break from the inherited `advanced-v1` visual identity
(Blade Runner × Liquid Glass — dark canvas, neon green CTA, glass
surface system, eyebrow section pills). The resolution is staged:

- **S25 → S28 (Simple track).** Ships with a restrained visual identity:
  light-primary canvas, reduced-saturation accent, flat surfaces with
  one clear card pattern, defined type scale with hero / metric / body /
  caption tiers, motion that respects reduced-motion.
- **S29 → S30 (Advanced track).** Retrofits over the existing codebase
  to converge with Simple's identity. Engine never forks; visual
  identity converges. The Simple/Advanced header toggle ships AFTER
  identity convergence is complete, so the toggle never feels like
  switching between two products.
- **`advanced-v1` is the input baseline**, not the target. Diffs
  against the tag track the convergence: `git diff advanced-v1..HEAD`.

See DESIGN.md "Open tensions" for the specific patterns being
retired or retained.
