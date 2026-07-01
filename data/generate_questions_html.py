#!/usr/bin/env python3
"""Generate a clean HTML interface from ALL_QUESTIONS_LIST.md"""

import re
import json
from pathlib import Path

MD_PATH = Path("/Users/a1234/Desktop/Import/Question Paper/question papers/ALL_QUESTIONS_LIST.md")
OUT_PATH = Path("/Users/a1234/Desktop/Import/Question Paper/question papers/questions.html")


def parse_markdown(text):
    categories = []
    current_cat = None
    current_paper = None

    lines = text.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].strip()

        if line.startswith("## ") and not line.startswith("### "):
            title = line[3:].strip()
            if title in ("Summary Statistics",):
                break
            current_cat = {"name": title, "papers": []}
            categories.append(current_cat)
            current_paper = None

        elif line.startswith("### ") and current_cat:
            title = line[4:].strip()
            current_paper = {"title": title, "meta": "", "questions": []}
            current_cat["papers"].append(current_paper)

        elif line.startswith("**Paper") or line.startswith("**Systemic") or line.startswith("**Seminar"):
            if current_cat and not current_paper:
                current_paper = {"title": line.strip("*"), "meta": "", "questions": []}
                current_cat["papers"].append(current_paper)
            elif current_paper:
                current_paper["title"] += " — " + line.strip("*")

        elif line.startswith("**") and current_paper and not line.startswith("**Sample"):
            current_paper["meta"] = line.strip("*")

        elif re.match(r"^(\d+)\.\s+", line) and current_paper:
            q = re.sub(r"^\d+\.\s+", "", line).strip()
            if q:
                current_paper["questions"].append(q)

        elif line.startswith("- ") and current_paper:
            q = line[2:].strip()
            if q and not q.startswith("*"):
                current_paper["questions"].append(q)

        elif line.startswith("*(Additional") or line.startswith("*Note:"):
            if current_paper:
                current_paper["meta"] += (" " if current_paper["meta"] else "") + line.strip("*")

        i += 1

    # Flatten papers without explicit paper headers (bullet-only sections)
    for cat in categories:
        if not cat["papers"] and cat["name"]:
            pass
        for paper in cat["papers"]:
            paper["id"] = re.sub(r"[^a-z0-9]+", "-", (cat["name"] + paper["title"]).lower()).strip("-")

    return categories


def build_html(categories):
    total_questions = sum(len(p["questions"]) for c in categories for p in c["papers"])
    total_papers = sum(len(c["papers"]) for c in categories)

    cat_options = "".join(
        f'<option value="{re.sub(r"[^a-z0-9]+", "-", c["name"].lower()).strip("-")}">{c["name"]}</option>'
        for c in categories
    )

    sidebar_items = "".join(
        f'<a href="#cat-{i}" class="nav-item" data-cat="{re.sub(r"[^a-z0-9]+", "-", c["name"].lower()).strip("-")}">'
        f'<span class="nav-label">{c["name"]}</span>'
        f'<span class="nav-count">{sum(len(p["questions"]) for p in c["papers"])}</span></a>'
        for i, c in enumerate(categories)
    )

    sections = []
    for i, cat in enumerate(categories):
        cat_id = re.sub(r"[^a-z0-9]+", "-", cat["name"].lower()).strip("-")
        papers_html = []
        for paper in cat["papers"]:
            q_items = "".join(
                f'<li class="question-item" data-text="{q.lower().replace(chr(34), "&quot;")}">'
                f'<span class="q-num">{j}</span><span class="q-text">{q}</span></li>'
                for j, q in enumerate(paper["questions"], 1)
            )
            meta = f'<p class="paper-meta">{paper["meta"]}</p>' if paper.get("meta") else ""
            papers_html.append(f"""
            <div class="paper-card" data-paper="{paper.get("id", "")}">
              <div class="paper-header">
                <h3>{paper["title"]}</h3>
                <span class="badge">{len(paper["questions"])} questions</span>
              </div>
              {meta}
              <ol class="question-list">{q_items}</ol>
            </div>""")

        sections.append(f"""
        <section class="category-section" id="cat-{i}" data-cat="{cat_id}">
          <div class="section-header">
            <h2>{cat["name"]}</h2>
            <span class="section-count">{sum(len(p["questions"]) for p in cat["papers"])} questions · {len(cat["papers"])} papers</span>
          </div>
          <div class="papers-grid">{"".join(papers_html)}</div>
        </section>""")

    data_json = json.dumps(categories, ensure_ascii=False)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MD Pharmacology — Question Bank</title>
<style>
  :root {{
    --bg: #f4f6f9;
    --surface: #ffffff;
    --border: #e2e8f0;
    --text: #1e293b;
    --muted: #64748b;
    --accent: #2563eb;
    --accent-light: #dbeafe;
    --accent-dark: #1d4ed8;
    --sidebar-w: 260px;
    --radius: 10px;
    --shadow: 0 1px 3px rgba(0,0,0,.08), 0 4px 16px rgba(0,0,0,.04);
  }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.5;
    display: flex;
    min-height: 100vh;
  }}

  /* Sidebar */
  .sidebar {{
    width: var(--sidebar-w);
    background: var(--surface);
    border-right: 1px solid var(--border);
    position: fixed;
    top: 0; left: 0; bottom: 0;
    overflow-y: auto;
    z-index: 100;
    display: flex;
    flex-direction: column;
  }}
  .sidebar-brand {{
    padding: 20px 16px 12px;
    border-bottom: 1px solid var(--border);
  }}
  .sidebar-brand h1 {{
    font-size: 15px;
    font-weight: 700;
    color: var(--accent-dark);
    line-height: 1.3;
  }}
  .sidebar-brand p {{
    font-size: 11px;
    color: var(--muted);
    margin-top: 4px;
  }}
  .nav-list {{ padding: 8px; flex: 1; }}
  .nav-item {{
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    border-radius: 7px;
    text-decoration: none;
    color: var(--text);
    font-size: 13px;
    margin-bottom: 2px;
    transition: background .15s;
  }}
  .nav-item:hover, .nav-item.active {{ background: var(--accent-light); color: var(--accent-dark); }}
  .nav-count {{
    background: var(--bg);
    color: var(--muted);
    font-size: 11px;
    padding: 1px 7px;
    border-radius: 20px;
    font-weight: 600;
  }}
  .nav-item.active .nav-count {{ background: var(--accent); color: #fff; }}

  /* Main */
  .main {{
    margin-left: var(--sidebar-w);
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }}

  /* Top bar */
  .topbar {{
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    padding: 14px 24px;
    position: sticky;
    top: 0;
    z-index: 50;
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }}
  .search-wrap {{
    flex: 1;
    min-width: 200px;
    position: relative;
  }}
  .search-wrap svg {{
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--muted);
    width: 16px; height: 16px;
  }}
  #search {{
    width: 100%;
    padding: 9px 12px 9px 36px;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 14px;
    outline: none;
    transition: border-color .15s, box-shadow .15s;
  }}
  #search:focus {{
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-light);
  }}
  #cat-filter {{
    padding: 9px 12px;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 13px;
    background: var(--surface);
    color: var(--text);
    cursor: pointer;
    outline: none;
  }}
  .stats-bar {{
    display: flex;
    gap: 8px;
    font-size: 12px;
    color: var(--muted);
    white-space: nowrap;
  }}
  .stat-pill {{
    background: var(--bg);
    padding: 4px 10px;
    border-radius: 20px;
    font-weight: 600;
  }}
  .stat-pill span {{ color: var(--accent-dark); }}

  /* Content */
  .content {{ padding: 24px; }}
  .no-results {{
    display: none;
    text-align: center;
    padding: 60px 20px;
    color: var(--muted);
  }}
  .no-results.visible {{ display: block; }}

  .category-section {{ margin-bottom: 40px; }}
  .section-header {{
    display: flex;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 16px;
    padding-bottom: 10px;
    border-bottom: 2px solid var(--accent-light);
  }}
  .section-header h2 {{ font-size: 20px; font-weight: 700; }}
  .section-count {{ font-size: 13px; color: var(--muted); }}

  .papers-grid {{
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 16px;
  }}
  .paper-card {{
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    overflow: hidden;
    transition: box-shadow .15s;
  }}
  .paper-card:hover {{ box-shadow: 0 4px 20px rgba(0,0,0,.1); }}
  .paper-card.hidden {{ display: none; }}

  .paper-header {{
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
    padding: 14px 16px 10px;
    background: linear-gradient(135deg, #f8fafc, #f1f5f9);
    border-bottom: 1px solid var(--border);
  }}
  .paper-header h3 {{
    font-size: 13px;
    font-weight: 600;
    line-height: 1.4;
    color: var(--accent-dark);
  }}
  .badge {{
    background: var(--accent);
    color: #fff;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 20px;
    white-space: nowrap;
    flex-shrink: 0;
  }}
  .paper-meta {{
    font-size: 12px;
    color: var(--muted);
    padding: 8px 16px 0;
    font-style: italic;
  }}
  .question-list {{
    list-style: none;
    padding: 10px 0;
    max-height: 420px;
    overflow-y: auto;
  }}
  .question-item {{
    display: flex;
    gap: 10px;
    padding: 7px 16px;
    font-size: 13px;
    border-bottom: 1px solid #f1f5f9;
    transition: background .1s;
  }}
  .question-item:last-child {{ border-bottom: none; }}
  .question-item:hover {{ background: #f8fafc; }}
  .question-item.hidden {{ display: none; }}
  .question-item.highlight {{ background: #fef9c3; }}
  .q-num {{
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    background: var(--accent-light);
    color: var(--accent-dark);
    border-radius: 50%;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 1px;
  }}
  .q-text {{ flex: 1; }}
  mark {{
    background: #fde68a;
    border-radius: 2px;
    padding: 0 1px;
  }}

  @media (max-width: 768px) {{
    .sidebar {{ display: none; }}
    .main {{ margin-left: 0; }}
    .papers-grid {{ grid-template-columns: 1fr; }}
  }}
</style>
</head>
<body>

<aside class="sidebar">
  <div class="sidebar-brand">
    <h1>MD Pharmacology<br>Question Bank</h1>
    <p>Extracted from 110 scanned papers</p>
  </div>
  <nav class="nav-list">
    <a href="#" class="nav-item active" data-cat="all">
      <span class="nav-label">All Categories</span>
      <span class="nav-count">{total_questions}</span>
    </a>
    {sidebar_items}
  </nav>
</aside>

<main class="main">
  <div class="topbar">
    <div class="search-wrap">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
      <input type="search" id="search" placeholder="Search questions… (e.g. tuberculosis, ANOVA, biosimilars)">
    </div>
    <select id="cat-filter">
      <option value="all">All categories</option>
      {cat_options}
    </select>
    <div class="stats-bar">
      <div class="stat-pill"><span id="visible-count">{total_questions}</span> shown</div>
      <div class="stat-pill"><span>{total_papers}</span> papers</div>
    </div>
  </div>

  <div class="content">
    <div class="no-results" id="no-results">
      <p style="font-size:32px;margin-bottom:8px">🔍</p>
      <p><strong>No questions found</strong></p>
      <p style="margin-top:4px;font-size:13px">Try a different search term or category.</p>
    </div>
    {"".join(sections)}
  </div>
</main>

<script>
const searchInput = document.getElementById('search');
const catFilter = document.getElementById('cat-filter');
const visibleCount = document.getElementById('visible-count');
const noResults = document.getElementById('no-results');
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.category-section');

let activeCat = 'all';

function highlight(text, query) {{
  if (!query) return text;
  const re = new RegExp('(' + query.replace(/[.*+?^${{}}()|[\\]\\\\]/g, '\\\\$&') + ')', 'gi');
  return text.replace(re, '<mark>$1</mark>');
}}

function applyFilters() {{
  const query = searchInput.value.trim().toLowerCase();
  let total = 0;

  sections.forEach(section => {{
    const catId = section.dataset.cat;
    const catMatch = activeCat === 'all' || catId === activeCat;
    let sectionVisible = false;

    section.querySelectorAll('.paper-card').forEach(card => {{
      let cardVisible = false;
      card.querySelectorAll('.question-item').forEach(item => {{
        const text = item.dataset.text;
        const match = !query || text.includes(query);
        item.classList.toggle('hidden', !match);
        item.classList.toggle('highlight', !!query && match);
        const qText = item.querySelector('.q-text');
        const orig = qText.textContent;
        qText.innerHTML = query && match ? highlight(orig, query) : orig;
        if (match) {{ cardVisible = true; total++; }}
      }});
      card.classList.toggle('hidden', !catMatch || !cardVisible);
      if (catMatch && cardVisible) sectionVisible = true;
    }});

    section.style.display = sectionVisible ? '' : 'none';
  }});

  visibleCount.textContent = total;
  noResults.classList.toggle('visible', total === 0);
}}

searchInput.addEventListener('input', applyFilters);
catFilter.addEventListener('change', () => {{
  activeCat = catFilter.value;
  navItems.forEach(n => n.classList.toggle('active', n.dataset.cat === activeCat));
  applyFilters();
}});

navItems.forEach(item => {{
  item.addEventListener('click', e => {{
    e.preventDefault();
    activeCat = item.dataset.cat;
    catFilter.value = activeCat;
    navItems.forEach(n => n.classList.toggle('active', n.dataset.cat === activeCat));
    if (activeCat !== 'all') {{
      const sec = document.querySelector('[data-cat="' + activeCat + '"]');
      if (sec) sec.scrollIntoView({{ behavior: 'smooth', block: 'start' }});
    }}
    applyFilters();
  }});
}});
</script>
</body>
</html>"""


def main():
    text = MD_PATH.read_text(encoding="utf-8")
    categories = parse_markdown(text)
    html = build_html(categories)
    OUT_PATH.write_text(html, encoding="utf-8")
    total = sum(len(p["questions"]) for c in categories for p in c["papers"])
    print(f"Written: {OUT_PATH}")
    print(f"Categories: {len(categories)}, Questions: {total}")


if __name__ == "__main__":
    main()