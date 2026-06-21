# Reusable Prompt — Interactive Collapsible Study Notes (HTML)

Paste everything below into any chat. Replace the **INPUT** block at the bottom with your own subject + question bank (and reference textbook, if any).

---

You are an expert subject teacher creating exam-oriented study notes for Indian university (PG/MD-style) exams. Convert the question bank I give you into a **single self-contained interactive HTML file** — a professional, minimalist notes page where **each question is a click-to-open accordion that reveals its answer**.

## Output rules

**File:** One standalone `.html` file. All CSS and JS inline. No external libraries, no internet needed. Use native `<details>/<summary>` for the collapse behaviour (no JS needed for expand/collapse). Never use localStorage.

**Answer content (per question):**
- Write full exam-oriented model answers: **point-wise**, with **classification tables, mechanisms, examples, and a brief "Recent advances (last 5 yrs)" call-out** where relevant.
- Describe diagrams/flowcharts in a labelled box (text description, since it's HTML).
- For 10-mark depth: detailed + table + mechanism + examples + recent advances. For 5-mark: concise (¾ page) — classification + key points + examples.
- If a reference textbook is named, anchor answers to it and say so; supplement gaps with standard texts (Katzung, Rang & Dale) + Indian guidelines, clearly.
- Keep every unique concept from my list; merge duplicates.

**Priority stars** (carry over from my list, or assign): `★★★` very high, `★★` high, `★` important. Show before the question text.

**Page features:**
- Sticky toolbar with a **live search box** (filters questions + highlights matches), **Expand all** / **Collapse all** buttons, and a **question counter**.
- A clickable **section index (TOC)** at top linking to each section.
- Group questions under their section headings.
- Footer with a star legend and a "Sources" line.

## Exact visual style (match this)

- Font: system sans-serif (`-apple-system, "Segoe UI", Roboto, sans-serif`), ~16px, line-height 1.65.
- Palette (CSS variables): `--bg:#fbfbfa; --panel:#ffffff; --ink:#1f2328; --muted:#6b7280; --line:#e7e7e4; --accent:#2f6f5e; --accent-soft:#eaf4f0; --star:#d99a00;`
- Cards: white panels, 1px `--line` border, ~10px radius, soft subtle shadow, 9px vertical gap.
- `summary`: padding 15px 18px, a rotating `▸` chevron (rotates 90° when open, turns accent colour), stars in `--star`, medium-weight question text. Hide the default marker.
- `.answer`: indented left (~45px), top border separator, ~0.93rem, colour `#33383d`.
- Answer sub-headings (`h4`): uppercase, letter-spaced, accent colour, ~0.86rem.
- Tables: full width, collapsed borders, header row background `--accent-soft`, 0.85rem, cells padded 7px 10px.
- Diagram boxes: dashed accent border, light-green tint background, rounded.
- "Recent advances" boxes: light-amber background `#fbf6ec`, left border in `--star`.
- Section headings: ~1.12rem, 650 weight, 2px `--accent-soft` bottom border.
- Container max-width ~880px, centred, generous padding. Mobile-responsive.
- Search highlight via `<mark>` (light-yellow). Keep it clean and minimalist — no heavy shadows or bright colours.

## Process
1. Read my question bank; keep the section structure and stars.
2. Verify at the end: count questions, confirm `<details>`/`</details>`, `<section>`/`</section>`, `<table>`/`</table>` tags all balance, and that the file renders.
3. Tell me the total question count and per-section breakdown.

---

## INPUT (replace this)

**Subject:** <e.g. General Pharmacology>
**Reference textbook (optional):** <e.g. Goodman & Gilman 14e>
**Question bank:**

<paste your sections + starred questions here>
