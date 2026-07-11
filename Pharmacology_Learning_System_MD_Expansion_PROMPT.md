# Pharmacology Learning System — MD Curriculum Expansion Prompt

> **Purpose:** Give this entire file to any LLM (Claude, GPT, Gemini, etc.) to implement all missing modules and updates needed to align the Pharmacology Learning System with the **AIIMS Jodhpur MD Pharmacology Curriculum Booklet**.
>
> **Curriculum reference:** `/Users/a1234/Downloads/MD- Pharmacolgy Curriculum booklet.pdf`
>
> **Project root:** `/Users/a1234/Documents/pharmacology learning system/`

---

## 0. YOUR ROLE

You are a medical-education content engineer and front-end developer. Your job is to **edit existing HTML learning guides in place** — not create a new site, not change the visual design system, and not remove existing content unless explicitly instructed below.

**Read before writing:**
1. The target guide HTML file you are editing (match its exact CSS classes, tier badges, SVG style, quiz/flashcard format).
2. The corresponding PYQ notes file in the same folder for source material (listed per module below).
3. `learning-interactive.css` and `learning-interactive.js` — link patterns only; do not break them.

**Quality bar:** Every new module must be exam-oriented, clinically accurate, and match the depth of existing Tier 1 modules (e.g. `Neuropharmacology-ANS_Learning-System.html` → `#m10`).

---

## 1. PROJECT STRUCTURE

```
pharmacology learning system/
├── index.html                    # Main Study Hub (4 portals)
├── learning.html                 # Learning Systems index (10 guide cards)
├── index_pyq.html                # PYQ Notes library (separate — do not merge)
├── learning-interactive.css      # Shared styles for all guides
├── learning-interactive.js       # Shared JS for all guides
├── sr-cards.js                   # Spaced-repetition card registry
├── review.html                   # Spaced repetition UI
│
├── General_Pharmacology_Learning-System.html          # Guide 1
├── Neuropharmacology-ANS_Learning-System.html           # Guide 2
├── Cardiovascular-Renal_Pharmacology_Learning-System.html
├── Inflammation-Immunity-Hematopoiesis_Learning-System.html
├── Endocrine-Pharmacology_Learning-System.html
├── Gastrointestinal_Pharmacology_Learning-System.html
├── Infectious-Disease-Chemotherapy_Learning-System.html
├── Neoplastic-Disease-Pharmacology_Learning-System.html
├── Special-Systems_Pharmacology_Learning-System.html
├── Experimental-Pharmacology_Learning-System.html
│
├── General_Pharmacology_Notes.html          # PYQ source
├── Autonomic_Receptor_Pharmacology_Notes.html
├── Pulmonary_Renal_Cardiovascular_Notes.html
├── Neoplastic_Disease_Pharmacotherapy_Notes.html
├── Special_Systems_Pharmacology_Notes.html
├── Miscellaneous_Pharmacology_Notes.html
└── data/                           # Scripts & extracted question data
```

**Navigation flow:** `index.html` → `learning.html` → individual `*_Learning-System.html` guides.

---

## 2. MODULE TEMPLATE (MANDATORY FOR EVERY NEW MODULE)

Copy the structure of existing full modules (e.g. `#m10` in Neuro guide). Each module is a `<section class="module" id="MODULE_ID">` with:

### 2.1 Header
```html
<section class="module" id="mXX">
  <div class="mod-head">
    <div class="mod-num">XX</div>
    <div class="mod-titleblock">
      <h2>Module Title</h2>
      <div class="mod-sub">One-line subtitle</div>
    </div>
    <span class="tier tier-1">Tier 1 · Foundation</span>  <!-- tier-1, tier-2, or tier-3 -->
  </div>
```

### 2.2 Four learning stages

| Stage | Class | Required content |
|-------|-------|------------------|
| 1 · Map | `div.cog.map` | `.pillar` statement + `<ul>` of 6–10 high-yield bullets + optional comparison `<table>` + **one custom inline SVG** (`<figure>` with `fig-title`, `figcaption`) |
| 2 · Blurt | `div.cog.blurt` | `.blurt-prompt` (clinical scenario) + 3 `.primers` `<li>` "why" questions |
| 3 · Notes | `details.gate` > `div.cog.feyn` | Step-by-step mechanism + `.analogy` block + `blockquote.warn` exam trap |
| 4 · Spaced | `div.cog.spaced` | Day 1/3/7/21 schedule + `.bridge` link to adjacent module |

### 2.3 Assessment per module
- **≥5 clinical vignette flashcards** in the guide's flashcard section (`.fc-card` pattern with `.fc-q`, `.fc-answer`, optional `.fc-trap` / `.fc-pearl`)
- **≥10 self-test MCQs** in the quiz bank (`details.qa` or `.q` / `.qq` / `.qa` pattern used in that guide)

### 2.4 Navigation integration
- Add a mind-map node in the guide's `#mindmapTree` (`.mm-module` + `.mm-sub` children)
- Add a link in the sticky/source nav bar that feeds `gpDrawerLinks` (the drawer clones anchors from the source nav)
- Use `&amp;` for ampersands in HTML text

### 2.5 Tier definitions
- **Tier 1:** Must-know for MD exams — full 4-stage depth
- **Tier 2:** Important — full stages but shorter map
- **Tier 3:** Awareness — map + brief notes, fewer quiz Qs

---

## 3. IMPLEMENTATION WAVES (DO IN ORDER)

### WAVE 1 — CRITICAL (do first)
Guide 2 (CNS modules) + Guide 5 (uterine motility)

### WAVE 2 — Paper I & IV
Guide 1 (allied sciences) + Guide 9 (miscellaneous)

### WAVE 3 — Paper III
Guide 10 (experimental expansions)

### WAVE 4 — Hub & registry polish
`learning.html`, hero stats, `sr-cards.js`, cross-links

---

## 4. WAVE 1 — GUIDE 2: NEUROPHARMACOLOGY & ANS

**File:** `Neuropharmacology-ANS_Learning-System.html`

### 4.1 Current state
- **Full modules:** `m10`–`m14` (ANS, Ch 10–14) ✅
- **Skeleton only:** `#cns` section "The CNS Block — High-Yield Map" covers Ch 15–28 as brief `<h4>` paragraphs — **NOT exam depth**

### 4.2 Required action
1. **Build 14 new full modules** `m15` through `m28` (one per chapter).
2. **Demote `#cns`:** Either delete the long scroll block OR convert it to a short index/table-of-contents that links to `m15`–`m28`. Keep the mind-map tree but ensure each CNS sub-node links to its new module anchor.
3. **Update hero text:** Change "14 CNS chapters · mapped" → "19 modules · full depth" (5 ANS + 14 CNS).
4. **Add flashcards + quiz questions** for all 14 new modules (70 flashcards, 140 quiz Qs minimum).

### 4.3 Module specifications

| ID | Ch | Title | Tier | Build priority | 80/20 exam anchors |
|----|-----|-------|------|----------------|-------------------|
| m15 | 15 | Serotonin & Dopamine | 1 | 9 | 5-HT₁/₂/₃ receptors; dopamine pathways; triptans; antipsychotic D2; ondansetron 5-HT₃; serotonin syndrome |
| m16 | 16 | CNS Neurotransmission | 1 | 10 | Glutamate/NMDA vs GABA/GABAₐ; excitation-inhibition balance; drug levers |
| m17 | 17 | Blood-Brain Barrier | 2 | 11 | Tight junctions; P-gp; lipophilicity; CNS penetration rules |
| m18 | 18 | Depression & Anxiety | 1 | **2** | SSRIs, SNRIs, TCAs, MAOIs; buspirone; washout periods; SSRI+MAOI risk |
| m19 | 19 | Psychosis & Mania | 1 | **3** | Typical vs atypical antipsychotics; EPS; NMS; lithium; valproate bipolar |
| m20 | 20 | Epilepsy | 1 | **1** | Na⁺ blockers; GABA enhancers; T-type Ca²⁺; status epilepticus; phenytoin CYP induction |
| m21 | 21 | Neurodegenerative Disorders | 1 | **4** | Parkinson's levodopa/carbidopa; COMT/MAO-B; dyskinesias; Alzheimer's AChEIs; memantine |
| m22 | 22 | Sedatives & Hypnotics | 1 | **5** | Benzodiazepines; Z-drugs; barbiturates; dependence; taper; flumazenil |
| m23 | 23 | Opioid Analgesics | 1 | **6** | μ-receptor; morphine; fentanyl; codeine/CYP2D6; naloxone; overdose triad |
| m24 | 24 | General Anaesthetics | 1 | **7** | IV vs inhaled; MAC; propofol; ketamine; sevoflurane; malignant hyperthermia |
| m25 | 25 | Local Anaesthetics | 1 | **8** | Na⁺ channel block; ester vs amide; infiltration vs nerve block; CNS/cardiac toxicity |
| m26 | 26 | Cannabinoids | 2 | 12 | CB1/CB2; THC/CBD; therapeutic uses |
| m27 | 27 | Ethanol | 2 | 13 | ADH/ALDH; zero-order kinetics; disulfiram; withdrawal |
| m28 | 28 | Drug Use Disorders & Addiction | 2 | 14 | Reward pathway; MAT for opioid/alcohol/nicotine |

**Source material:** Expand content already in the `#cns` skeleton `<h4>` blocks; cross-reference `Autonomic_Receptor_Pharmacology_Notes.html` and `Pulmonary_Renal_Cardiovascular_Notes.html` for CNS-adjacent drugs.

**Build order:** m20 → m18 → m19 → m23 → m22 → m21 → m24 → m25 → m15 → m16 → m17 → m26 → m27 → m28

---

## 5. WAVE 1 — GUIDE 5: ENDOCRINE PHARMACOLOGY

**File:** `Endocrine-Pharmacology_Learning-System.html`

### 5.1 New module

| ID | Title | Tier | Curriculum | Content |
|----|-------|------|------------|---------|
| m53 | Drugs Affecting Uterine Motility | 1 | Paper II "Drugs affecting uterine motility" | **Oxytocics:** oxytocin, ergometrine/methylergometrine, PGE₁/PGE₂. **Tocolytics:** ritodrine/salbutamol (β₂), nifedipine, atosiban, MgSO₄. Preterm labour 48h window for steroids. Contraindications. Frog spasmogenic/spasmolytic link. |

**Source:** `Special_Systems_Pharmacology_Notes.html` — search "Tocolytics"

**Deliverables:** 1 SVG (uterus contraction pathway) · 8 flashcards · 15 quiz Qs

**Place after** `m49` (Androgens) in the HTML and mind-map.

---

## 6. WAVE 2 — GUIDE 1: GENERAL PHARMACOLOGY

**File:** `General_Pharmacology_Learning-System.html`

### 6.1 Expand existing modules

#### m1 — Drug Discovery & Development (DEEPEN, do not replace)
Add sections on:
- IND and NDA application process (India CDSCO + USFDA overview)
- Lipinski Rule of Five
- High-throughput screening (in vitro + in vivo)
- Irwin profile test
- Preclinical PK/PD studies
- Bioequivalence study design (AUC, Cmax, Tmax)
- Helsinki Declaration and ICH-GCP summary
- Animal ethics (CPCSEA/IAEC mention)

#### m9 — Principles of Clinical Toxicology (DEEPEN)
Add:
- Common poisoning clinical features table (OPC, paracetamol, salicylate, TCA, iron, CO, methanol)
- Antidote mechanism table
- Applied analytical toxicology overview
- Toxicovigilance vs pharmacovigilance distinction

### 6.2 New modules

| ID | Title | Tier | Curriculum § | Content outline | PYQ source file |
|----|-------|------|--------------|-----------------|-----------------|
| m10 | Molecular Biology in Pharmacology | 1 | Paper I §1c | PCR, RT-PCR; Northern/Southern/Western blot; protein purification; mono/polyclonal antibodies; antisense oligonucleotides; proteomics; receptor identification; gene knockout/RNAi mention | `General_Pharmacology_Notes.html` |
| m11 | Phytochemistry & Herbal Drug Standardisation | 2 | Paper I §1d | Plant constituent classes; percolation vs maceration; HPTLC fingerprinting; marker compounds in biological fluids; reverse pharmacology link to m1 | `General_Pharmacology_Notes.html` |
| m12 | Indian Drug Regulations & Pharmacoeconomics | 1 | Paper IV §4a | Drugs & Cosmetics Act; DPCO; NLEM/essential medicines; drug utilisation studies; rational prescribing; pharmacoeconomics (cost-effectiveness, QALY) | `General_Pharmacology_Notes.html`, `Miscellaneous_Pharmacology_Notes.html` |
| m13 | Teaching, Research Communication & Microteaching | 3 | Paper I §1f | Lecture delivery; practical demonstration; IMRaD manuscript structure; conference presentation; record-keeping; microteaching for MD viva | `Miscellaneous_Pharmacology_Notes.html` |

**After Wave 2:** Guide has 13 modules. Add ~80 quiz Qs and ~15 flashcards total for new content.

**Update hero:** "Chapters 1 – 9 + Allied Sciences (MD Paper I/IV)"

---

## 7. WAVE 2 — GUIDE 9: SPECIAL SYSTEMS PHARMACOLOGY

**File:** `Special-Systems_Pharmacology_Learning-System.html`

### 7.1 Expand existing

#### ch76 — Environmental Toxicology (DEEPEN)
Add clinical poisoning management beyond environmental toxins:
- Organophosphate stepwise management (atropine + pralidoxime)
- Paracetamol (NAC)
- Salicylate alkalinisation
- Digoxin fab
- Aluminium phosphide
- Lead chelation

### 7.2 New modules

| ID | Title | Tier | Curriculum | Content | PYQ source |
|----|-------|------|------------|---------|------------|
| ch77 | Vitamins, Minerals & Obesity Pharmacotherapy | 2 | Paper II Miscellaneous; Sem IV | Fat/water-soluble vitamins; deficiency/toxicity; orlistat; GLP-1/GIP agonists; anti-obesity drug classes | `Neoplastic_Disease_Pharmacotherapy_Notes.html` |
| ch78 | Pharmacotherapy in Special Populations | 1 | Sem III; Paper IV | Paediatric dosing; geriatric (Beers); pregnancy/lactation; hepatic (Child-Pugh); renal (eGFR); pharmacogenomics tie-in | `General_Pharmacology_Notes.html` |
| ch79 | Clinical Poisoning & Antidotes | 1 | Paper II poisoning; practical poison centre | Systematic poisoning approach; antidote table; decontamination; PIC duties | `Special_Systems_Pharmacology_Notes.html` |
| ch80 | Nobel Laureates & Landmark Discoveries | 3 | Paper I §1e | Dale/Loewi; Black; Gilman/Rodbell; Yalow; Sutherland; Allison/Honjo; Indian pharmacology pioneers | `Miscellaneous_Pharmacology_Notes.html` |

**After Wave 2:** 7 modules (ch74–ch80). Add ~60 quiz Qs, ~20 flashcards.

**Update hero:** "Chapters 74 – 80 + MD Miscellaneous"

---

## 8. WAVE 3 — GUIDE 10: EXPERIMENTAL PHARMACOLOGY

**File:** `Experimental-Pharmacology_Learning-System.html`

### 8.1 Expand existing modules (insert content, do not delete)

#### m5 — Laboratory Instruments & Analytical Techniques
**Add to map table and notes:**
- NMR spectroscopy (principle, drug structure ID)
- Mass spectrometry (GC-MS, LC-MS)
- Radioimmunoassay (RIA) vs ELISA comparison
- Immunoaffinity chromatography
- Atomic absorption spectrometry (lead in water — practical syllabus item)
- GLP and analytical method validation

#### m6 — In-vivo Animal Disease & Screening Models
**Add rows to the system→model→endpoint table:**

| System | Model | Drug class screened | Endpoint |
|--------|-------|---------------------|----------|
| Endocrine | STZ/alloxan rat | Antidiabetic | Blood glucose |
| Eye | β-blocker on rabbit | Antiglaucoma | IOP reduction |
| Eye | Galactosemic rat | Anticataract | Lens opacity |
| Helminths | Pheretima posthuma | Antihelminthic | Paralysis/death |
| CVS | Isoproterenol cardiotoxicity | Cardioprotective/antihypertensive | MI markers |
| Lipid | Triton/hyperlipidemic rat | Antihyperlipidemic | Serum cholesterol |
| Respiratory | Histamine/ovalbumin sensitisation | Antiasthmatic | Bronchoconstriction |
| Respiratory | Ammonia/citric acid aerosol | Cough suppressant | Cough frequency |
| Endocrine | Thyroidectomy/hyperthyroid models | Antithyroid | T4/TSH |
| Endocrine | Adrenalectomy | Corticosteroid replacement | Survival/corticosterone |
| Endocrine | Gonadectomy | Sex hormone replacement | End organ weight |
| Endocrine | Posterior pituitary | Vasopressin/oxytocin | Urine output/uterus |

#### m9 — Biostatistics in Pharmacology
**Add new subsection:**
- Meta-analysis: fixed vs random effects model
- Forest plot reading
- I² heterogeneity
- Funnel plot and publication bias
- When meta-analysis vs single RCT

### 8.2 New modules

| ID | Title | Tier | Curriculum | Content |
|----|-------|------|------------|---------|
| m12 | Flow Cytometry, RT-PCR & Cell-Based Assays | 2 | Sem II–III practicals | Flow cytometry principles; apoptosis/CD markers; RT-qPCR workflow; link to pyrogen/cell culture (m8) |
| m13 | MD Practical Examination Bridge | 1 | Practical exam scheme | Langendorff heart; Dale vasomotor reversal; 4-point bioassay (Ach, histamine, 5-HT); PA₂ of atropine; rota rod; actophotometer; Eddy's hot plate; IND/NDA/protocol drafting checklist; critical appraisal of scientific papers; HPLC/PK calculation worked examples |

**After Wave 3:** 13 modules. Add ~100 quiz Qs, ~28 flashcards.

---

## 9. WAVE 3 — GUIDE 4: INFLAMMATION (MINOR EXPANSION)

**File:** `Inflammation-Immunity-Hematopoiesis_Learning-System.html`

### Expand m44 — Pulmonary Pharmacology
Add to existing module (do not create new module):
- GINA step therapy ladder (Steps 1–5)
- SABA, SAMA, LABA, LAMA, ICS classes and examples
- Leukotriene modifiers (montelukast)
- Biologics: omalizumab (anti-IgE), mepolizumab (anti-IL-5)
- Cough suppressants vs expectorants vs mucolytics
- Cross-link to Cardiovascular guide m35 (PAH) for advanced pulmonary hypertension drugs

---

## 10. GUIDES WITH NO NEW MODULES NEEDED

These guides already cover the MD curriculum. **Do not add modules** unless you find a factual error:

| Guide | Chapters | Status |
|-------|----------|--------|
| Cardiovascular-Renal | 29–37 | Complete |
| Gastrointestinal | 53–55 | Complete |
| Infectious Disease | 56–68 | Complete |
| Neoplastic | 69–73 | Complete |

---

## 11. WAVE 4 — HUB PAGE UPDATES

### 11.1 `learning.html` — update guide cards

| Guide card | Update `card-chap` | Update `card-desc` tags | Update footer stats |
|------------|-------------------|------------------------|---------------------|
| General Pharmacology | `Chapters 1 – 9 + Allied Sciences` | Add: Molecular Bio, Herbal, Regulations | 13 modules; ~280 quiz |
| Neuropharmacology & ANS | `Chapters 10 – 28` (keep) | Add: Anaesthetics, Addiction | 19 modules; ~200 quiz |
| Endocrine | `Chapters 46 – 52 + Uterine` | Add: Tocolytics | 8 modules |
| Special Systems | `Chapters 74 – 80` | Add: Special Pops, Poisoning | 7 modules |
| Experimental | `13 Modules` (was 11) | Add: Flow Cytometry, Exam Bridge | ~328 quiz |
| **Site hero stats** | — | — | Update total modules (~101), flashcards (~300+), quiz (~1500+) |

### 11.2 `index.html` Study Hub
Update portal stats for Learning Systems card to reflect new module/quiz counts.

### 11.3 `sr-cards.js`
Add deck identifiers for every new module so `review.html` can filter them:

```
general-m10, general-m11, general-m12, general-m13
neuro-m15 … neuro-m28
endo-m53
special-ch77, special-ch78, special-ch79, special-ch80
exp-m12, exp-m13
```

Follow the existing card object schema in `sr-cards.js` exactly.

---

## 12. CROSS-LINK BRIDGES (add `.bridge` paragraphs)

| From module | To module | Bridge text topic |
|-------------|-----------|-------------------|
| m10 (molecular bio) | Experimental m12 | RT-PCR in pharmacology research |
| m12 (regulations) | General m1 | IND/NDA after drug discovery |
| m20 (epilepsy) | General m5 | Phenytoin zero-order kinetics / CYP induction |
| m23 (opioids) | Special ch79 | Naloxone in poisoning |
| m53 (uterine) | Experimental m4 | Rat uterus bioassay for oxytocin |
| ch78 (special pops) | General m2 | Renal/hepatic dose adjustment |
| ch79 (poisoning) | General m9 | Antidote mechanisms |
| m13 (practical bridge) | Experimental m3 | Four-point bioassay |

---

## 13. CONSTRAINTS — DO NOT

1. **Do not** create an 11th top-level guide HTML file — all content goes into the existing 10 guides.
2. **Do not** rename existing module IDs (`m10` in Neuro ≠ `m10` in Experimental — they are in separate files).
3. **Do not** remove GLASS styling, drawer navigation, dark mode, or gamification hooks.
4. **Do not** break internal links — all `href` values must remain relative (same folder).
5. **Do not** merge PYQ Notes HTML into Learning System guides — use PYQ files as **source material only**.
6. **Do not** change `learning-interactive.css` unless adding a class genuinely missing from all guides.
7. **Do not** use external CDN dependencies beyond what existing files already use (Google Fonts).
8. **Do not** write placeholder content like "TBD" or "content here" — every module must be complete.

---

## 14. VERIFICATION CHECKLIST (run after each wave)

```bash
# 1. All internal links resolve
python3 -c "
import re, os, glob
broken = []
for src in glob.glob('*.html'):
    text = open(src).read()
    for href in re.findall(r'href=\"([^\"#?]+\.html)\"', text):
        if not os.path.isfile(href): broken.append((src, href))
print('OK' if not broken else broken)
"

# 2. New module anchors exist
# grep for each new id=\"m15\" etc. in the target file

# 3. No _GLASS duplicate files (only one canonical file per guide)

# 4. Open learning.html in browser — all cards load
```

**Content QA per module:**
- [ ] Has all 4 learning stages
- [ ] Has ≥1 SVG diagram
- [ ] Has ≥5 flashcards
- [ ] Has ≥10 quiz questions
- [ ] Appears in mind-map and drawer nav
- [ ] Tier badge correct
- [ ] Bridge link to adjacent module
- [ ] Medically accurate (mechanism + clinical pearl + exam trap)

---

## 15. CURRICULUM-TO-GUIDE MAPPING (REFERENCE)

| MD Curriculum Paper | Primary guide(s) |
|---------------------|------------------|
| Paper I — General pharmacology & allied sciences | General (m1–m13) |
| Paper II — ANS | Neuro (m10–m14) |
| Paper II — CNS | Neuro (m15–m28) ← **biggest gap** |
| Paper II — Autacoids, inflammation, pulmonary | Inflammation (m38–m45) |
| Paper II — CVS, renal | Cardiovascular-Renal (m29–m37) |
| Paper II — GI, respiratory | GI (mod1–3) + Inflammation m44 |
| Paper II — Uterine motility | Endocrine (m53) ← **new** |
| Paper II — Chemotherapy | Infectious (m56–m68) |
| Paper II — Antineoplastics | Neoplastic (m69–m73) |
| Paper II — Immunomodulators, blood | Inflammation (m39–m45) |
| Paper II — Hormones | Endocrine (m46–m52) |
| Paper II — Miscellaneous (vitamins, obesity, poisoning) | Special (ch77–ch79) ← **new** |
| Paper III — Experimental & screening | Experimental (m1–m13) |
| Paper III — Instrumentation | Experimental m5 (expand) |
| Paper III — Biostatistics + meta-analysis | Experimental m9 (expand) |
| Paper IV — Clinical pharmacology | General m1, m12 + Experimental m10 |
| Paper IV — TDM | Experimental m10 |
| Paper IV — Special populations | Special ch78 ← **new** |
| Practical exam | Experimental m13 ← **new** |

---

## 16. ESTIMATED DELIVERABLE COUNTS (after all waves)

| Metric | Before | After |
|--------|--------|-------|
| Full modules | ~76 | ~101 |
| Quiz questions | ~1200 | ~1500+ |
| Flashcards | ~209 | ~300+ |
| Guides touched | — | 6 of 10 |

---

## 17. SUGGESTED LLM WORKFLOW

When implementing, work **one guide at a time, one module at a time**:

```
FOR each wave in [1, 2, 3, 4]:
  FOR each module in wave:
    1. READ target guide HTML (full file or module section)
    2. READ PYQ source file sections listed above
    3. WRITE module HTML matching template (Section 2)
    4. INSERT before flashcard section (or append in correct chapter order)
    5. ADD mind-map node + nav link
    6. ADD flashcards to flashcard section
    7. ADD quiz items to quiz bank
    8. UPDATE module count in guide hero
  UPDATE learning.html card for that guide
  UPDATE sr-cards.js entries
  RUN verification checklist (Section 14)
```

**For Wave 1 Neuro CNS:** Start with `m20` (Epilepsy) as a template module, get user/reviewer approval on format, then batch the remaining 13.

---

## 18. FILE OUTPUT

All edits are **in-place modifications** to existing files in:
```
/Users/a1234/Documents/pharmacology learning system/
```

No new HTML files. No subfolders. Keep the flat file structure so all relative links continue to work.

---

*End of prompt. Version 1.0 — generated from AIIMS Jodhpur MD Pharmacology Curriculum gap analysis, June 2026.*