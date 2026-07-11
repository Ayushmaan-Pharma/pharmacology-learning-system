#!/usr/bin/env python3
"""
build_search_index.py
---------------------------------------------------------------------------
Auto-generates ../search-index.js — the data behind the Study Hub search box.

It harvests, for every learning guide, the readable topic labels + section
anchors from that guide's own nav-drawer links (text -> #id). It also pulls
the entries from the Recent Advances page. The result is a flat list of
{ t: title, s: subtitle/guide, u: url } objects the index page searches.

Re-run this whenever guides change:  python3 data/build_search_index.py
---------------------------------------------------------------------------
"""
import re, os, json, html

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

# Guide file -> friendly display name (matches learning.html labels)
GUIDES = {
    "General_Pharmacology_Learning-System.html": "General Pharmacology",
    "Neuropharmacology-ANS_Learning-System.html": "Neuropharmacology & ANS",
    "Cardiovascular-Renal_Pharmacology_Learning-System.html": "Cardiovascular & Renal",
    "Inflammation-Immunity-Hematopoiesis_Learning-System.html": "Inflammation, Immunity & Haematopoiesis",
    "Endocrine-Pharmacology_Learning-System.html": "Endocrine Pharmacology",
    "Gastrointestinal_Pharmacology_Learning-System.html": "Gastrointestinal Pharmacology",
    "Infectious-Disease-Chemotherapy_Learning-System.html": "Infectious Disease & Chemotherapy",
    "Neoplastic-Disease-Pharmacology_Learning-System.html": "Neoplastic Disease Pharmacology",
    "Special-Systems_Pharmacology_Learning-System.html": "Special Systems Pharmacology",
    "Experimental-Pharmacology_Learning-System.html": "Experimental & Clinical Pharmacology",
}

# Anchors that are structural rather than topics — keep a couple, drop noise.
SKIP_ANCHORS = {"mindmap", "method", "top"}
# Generic sections we still list, but must NOT get content keywords (otherwise
# every drug search surfaces "Flashcards"/"Quiz Bank" instead of the real module).
GENERIC_RE = re.compile(r"(quiz|flash|mindmap|method|mcq|question)", re.I)
def is_generic(anchor, label):
    return bool(GENERIC_RE.search(anchor) or GENERIC_RE.search(label))

# Lenient: match <a ...> tags with a #anchor href regardless of other
# attributes (some drawer links carry class="" or data-* attributes).
LINK_RE = re.compile(r'<a\b[^>]*?href="#([^"]+)"[^>]*>(.*?)</a>', re.S)

def clean(text: str) -> str:
    text = re.sub(r"<[^>]+>", "", text)          # strip any inner tags
    text = html.unescape(text).strip()
    # drop leading emoji / stars / leading "NN ·" numbering for a cleaner label
    text = re.sub(r"^[\W\d_]*·?\s*", "", text) if "·" in text else text
    text = re.sub(r"^[^\w(]+", "", text)          # trim leftover leading symbols
    return text.strip()

# Very common words we don't want cluttering the keyword blob.
STOP = set("""the and for with that this from are was were will can may has have had
into out not but you your they them their then than which who whom whose where when
what how why all any some each more most other such only own same both few once
onto per via also within without between during after before above below over under
drug drugs dose doses used use uses effect effects action mechanism clinical patient
patients cause causes caused increase decrease increased decreased high low level levels""".split())

def section_keywords(src, start, end, limit=150):
    """Collect readable, drug/topic-like words from the slice of the guide that
    belongs to one module (start..end offsets). This is what lets a search for
    'warfarin' or 'asthma' land on the right section even when the visible
    heading is only 'Pulmonary' or 'Anticoagulants'."""
    text = re.sub(r"<[^>]+>", " ", src[start:end])   # strip tags
    text = html.unescape(text)
    words = re.findall(r"[A-Za-z][A-Za-z0-9\-]{3,}", text)   # len >= 4
    seen, kept = set(), []
    for w in words:
        wl = w.lower()
        if wl in seen or wl in STOP:
            continue
        seen.add(wl); kept.append(wl)
        if len(kept) >= limit:
            break
    return " ".join(kept)

def harvest_guide(fname, display):
    path = os.path.join(ROOT, fname)
    if not os.path.exists(path):
        return []
    src = open(path, encoding="utf-8", errors="ignore").read()
    seen = {}
    for anchor, raw in LINK_RE.findall(src):
        if anchor in SKIP_ANCHORS:
            continue
        label = clean(raw)
        if not label or len(label) < 2:
            continue
        url = f"{fname}#{anchor}"
        if url not in seen or len(label) > len(seen[url][0]):
            seen[url] = (label, anchor)

    # Locate each module anchor, then bound its keyword span by the next anchor.
    anchored = []
    for url, (label, anchor) in seen.items():
        m = re.search(r'id="' + re.escape(anchor) + r'"', src)
        anchored.append({"url": url, "t": label, "anchor": anchor, "pos": m.start() if m else -1})
    positions = sorted(a["pos"] for a in anchored if a["pos"] >= 0)

    out = []
    for a in anchored:
        entry = {"t": a["t"], "s": display, "u": a["url"]}
        if a["pos"] >= 0 and not is_generic(a["anchor"], a["t"]):
            nxt = next((p for p in positions if p > a["pos"]), a["pos"] + 9000)
            end = min(nxt, a["pos"] + 9000)      # cap so huge modules don't bleed
            kw = section_keywords(src, a["pos"], end)
            if kw:
                entry["k"] = kw
        out.append(entry)
    # Also add the guide itself as a top-level destination
    out.append({"t": display, "s": "Learning guide", "u": fname})
    return out

def harvest_recent_advances():
    fname = "Recent-Advances_Pharmacology.html"
    path = os.path.join(ROOT, fname)
    if not os.path.exists(path):
        return []
    src = open(path, encoding="utf-8", errors="ignore").read()
    out = []
    # Each advance card: <article class="advance" id="..."> ... <h3>Name</h3>
    for m in re.finditer(r'<article class="advance" id="([^"]+)"[^>]*>(.*?)</article>', src, re.S):
        anchor, body = m.group(1), m.group(2)
        h3 = re.search(r"<h3>(.*?)</h3>", body, re.S)
        if not h3:
            continue
        out.append({"t": clean(h3.group(1)), "s": "Recent Advances", "u": f"{fname}#{anchor}"})
    out.append({"t": "Recent Advances in Pharmacology", "s": "New developments", "u": fname})
    return out

def main():
    index = []
    for fname, disp in GUIDES.items():
        index += harvest_guide(fname, disp)
    index += harvest_recent_advances()

    # Stable, readable ordering: by guide then title
    index.sort(key=lambda e: (e["s"], e["t"].lower()))

    js = ("/* AUTO-GENERATED by data/build_search_index.py — do not edit by hand.\n"
          "   Re-run that script after changing guide contents. */\n"
          "window.PHARM_SEARCH_INDEX = " + json.dumps(index, ensure_ascii=False, indent=0) + ";\n")
    out_path = os.path.join(ROOT, "search-index.js")
    open(out_path, "w", encoding="utf-8").write(js)
    print(f"Wrote {out_path} with {len(index)} entries")

if __name__ == "__main__":
    main()
