#!/usr/bin/env python3
"""Extract questions from scanned question paper images using EasyOCR."""

import os
import re
import json
from pathlib import Path

import easyocr

BASE = Path("/Users/a1234/Desktop/Import/Question Paper/question papers")
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff"}

# Patterns for question detection
Q_PATTERNS = [
    re.compile(r"^Q\.?\s*(\d+)[\.:\)]\s*(.+)", re.I),
    re.compile(r"^Question\s*(\d+)[\.:\)]\s*(.+)", re.I),
    re.compile(r"^(\d{1,2})[\.\)]\s+([A-Z].+)", re.I),
    re.compile(r"^(\d{1,2})\s+([A-Z][a-z].+)", re.I),
]

HEADER_PATTERNS = [
    re.compile(r"(MD|Pharmacology|Examination|Paper|Semester|AIIMS|Marks|Time|Instructions|Write Short|Attempt)", re.I),
]


def is_likely_header(line):
    return any(p.search(line) for p in HEADER_PATTERNS) and len(line) < 80


def extract_questions_from_text(text_lines):
    questions = []
    current_q = None

    for line in text_lines:
        line = line.strip()
        if not line or len(line) < 5:
            continue
        if is_likely_header(line) and not re.match(r"^\d", line):
            continue

        matched = False
        for pat in Q_PATTERNS:
            m = pat.match(line)
            if m:
                num, content = m.group(1), m.group(2).strip()
                if current_q:
                    questions.append(current_q)
                current_q = {"number": num, "text": content}
                matched = True
                break

        if not matched and current_q and not re.match(r"^\d", line):
            # continuation of previous question
            if len(line) > 10 and not is_likely_header(line):
                current_q["text"] += " " + line

    if current_q:
        questions.append(current_q)

    return questions


def ocr_image(reader, path):
    try:
        results = reader.readtext(str(path), detail=0, paragraph=True)
        return results if results else []
    except Exception as e:
        return [f"[OCR ERROR: {e}]"]


def main():
    print("Loading EasyOCR model (first run may take a moment)...")
    reader = easyocr.Reader(["en"], gpu=False, verbose=False)

    all_data = {}
    image_files = sorted(
        f for f in BASE.rglob("*")
        if f.is_file() and f.suffix.lower() in IMAGE_EXTS
    )

    print(f"Found {len(image_files)} images to process...")

    for i, img_path in enumerate(image_files, 1):
        rel = img_path.relative_to(BASE)
        category = str(rel.parent)
        print(f"  [{i}/{len(image_files)}] {rel}")

        lines = ocr_image(reader, img_path)
        questions = extract_questions_from_text(lines)

        # Also capture "Write Short Notes" style numbered items
        full_text = "\n".join(lines)
        short_note_items = re.findall(
            r"(?:^|\n)\s*(\d{1,2})[\.\)]\s+([^\n]{10,})", full_text
        )

        if not questions and short_note_items:
            questions = [{"number": n, "text": t.strip()} for n, t in short_note_items]

        entry = {
            "file": str(rel),
            "raw_text": lines,
            "questions": questions,
        }

        if category not in all_data:
            all_data[category] = []
        all_data[category].append(entry)

    # Write JSON for reference
    out_json = Path("/Users/a1234/question_papers_extracted.json")
    with open(out_json, "w") as f:
        json.dump(all_data, f, indent=2)

    # Write readable markdown list
    out_md = Path("/Users/a1234/all_questions_list.md")
    with open(out_md, "w") as f:
        f.write("# All Questions from Question Papers Folder\n\n")
        f.write(f"**Source:** `{BASE}`\n\n")
        f.write(f"**Total images processed:** {len(image_files)}\n\n")
        f.write("---\n\n")

        total_q = 0
        for category in sorted(all_data.keys()):
            f.write(f"## {category.replace('/', ' → ')}\n\n")
            for entry in all_data[category]:
                f.write(f"### {entry['file']}\n\n")
                if entry["questions"]:
                    for q in entry["questions"]:
                        f.write(f"- **Q{q['number']}:** {q['text']}\n")
                        total_q += 1
                    f.write("\n")
                else:
                    f.write("*No numbered questions detected. Raw OCR text:*\n\n")
                    for line in entry["raw_text"]:
                        if line.strip():
                            f.write(f"> {line.strip()}\n")
                    f.write("\n")

        f.write(f"\n---\n\n**Total questions extracted:** {total_q}\n")

    print(f"\nDone! Output written to:")
    print(f"  - {out_md}")
    print(f"  - {out_json}")


if __name__ == "__main__":
    main()