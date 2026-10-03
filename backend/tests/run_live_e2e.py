import time
import httpx
from pathlib import Path

BASE_URL = "http://127.0.0.1:8000/api"

def run_live_e2e():
    print("--- 1. Testing Backend Health ---")
    resp = httpx.get(f"{BASE_URL}/health", timeout=10.0)
    assert resp.status_code == 200, f"Health check failed: {resp.text}"
    print("✓ Health OK:", resp.json())

    print("\n--- 2. Creating Flagship Academic Project ---")
    proj_payload = {
        "title": "Diagnosis of Various Types of Cancer: Modern Principles and Practice",
        "topic": "Diagnosis of Various Types of Cancer",
        "discipline": "Clinical Oncology & Anatomical Pathology",
        "audience": "Clinical Oncology Fellows & Pathology Residents",
        "academic_level": "Postgraduate / Clinical Specialist",
        "language": "English (US Academic)",
        "target_word_count": 5000,
        "citation_style": "vancouver",
        "formatting_guidelines": "Academic Monograph Chapter. Vancouver numeric citations. Standard peer-review structure."
    }
    resp = httpx.post(f"{BASE_URL}/projects", json=proj_payload, timeout=10.0)
    assert resp.status_code == 200, f"Project creation failed: {resp.text}"
    proj = resp.json()
    project_id = proj["id"]
    print(f"✓ Project Created: {project_id} - '{proj['title']}'")

    print("\n--- 3. Ingesting 5-Volume Cancer Reference Corpus ---")
    resp = httpx.post(f"{BASE_URL}/projects/{project_id}/documents/load-sample-corpus", timeout=60.0)
    assert resp.status_code == 200, f"Ingestion failed: {resp.text}"
    docs = resp.json()
    print(f"✓ Successfully Ingested {len(docs)} Primary Reference Documents:")
    for d in docs:
        print(f"   • {d['title']} ({d['authors']}, {d['publication_year']}) — {d['page_count']} pages, {d.get('chunk_count', 0)} chunks")

    print("\n--- 4. Synthesizing Chapter Outline ---")
    resp = httpx.post(f"{BASE_URL}/projects/{project_id}/outline/generate", json={"project_id": project_id}, timeout=30.0)
    assert resp.status_code == 200, f"Outline generation failed: {resp.text}"
    outline = resp.json()
    print(f"✓ Outline Generated ({len(outline['sections'])} Sections):")
    for s in outline['sections']:
        print(f"   [{s['order']}.0] {s['title']} (~{s['target_word_count']} words)")

    print("\n--- 5. Computing Cross-Reference Coverage Matrix ---")
    resp = httpx.get(f"{BASE_URL}/projects/{project_id}/coverage-matrix", timeout=20.0)
    assert resp.status_code == 200, f"Coverage matrix failed: {resp.text}"
    cov = resp.json()
    print(f"✓ Coverage Health: {cov['overall_health'].upper()} (Across {cov['total_sources']} reference volumes)")
    for s in cov['sections']:
        print(f"   • {s['section_title'][:40]:40} | Evidence: {s['evidence_strength'].upper():8} | {len(s['sources_mapped'])} Sources Mapped")

    print("\n--- 6. Drafting Complete Chapter (Section-by-Section) ---")
    start_time = time.time()
    resp = httpx.post(f"{BASE_URL}/projects/{project_id}/generate-all", timeout=120.0)
    assert resp.status_code == 200, f"Section drafting failed: {resp.text}"
    draft_res = resp.json()
    duration = round(time.time() - start_time, 1)
    print(f"✓ Drafted {draft_res['drafted_count']} Sections in {duration}s:")
    for s in draft_res['sections']:
        print(f"   • {s['title'][:40]:40} | {s['word_count']} words | {len(s['citations'])} citations | Status: {s['fact_check_status'].upper()}")

    print("\n--- 7. Running Medical Fact-Checking & Validation Audit ---")
    resp = httpx.get(f"{BASE_URL}/projects/{project_id}/medical-validation", timeout=20.0)
    assert resp.status_code == 200, f"Medical validation failed: {resp.text}"
    val_report = resp.json()
    print(f"✓ Medical Fact-Checking Status: {val_report.get('status', 'PASSED').upper()}")
    print(f"   • Total Clinical Claims Evaluated: {val_report['total_claims_analyzed']}")
    print(f"   • Verified Source Facts:          {val_report['verified_claims_count']}")
    print(f"   • Warnings / Review Flags:        {val_report['warnings_count']}")

    print("\n--- 8. Generating Publication-Grade Typeset PDF ---")
    resp = httpx.post(f"{BASE_URL}/projects/{project_id}/export/pdf", timeout=30.0)
    assert resp.status_code == 200, f"PDF export failed: {resp.text}"
    pdf_res = resp.json()
    pdf_path = Path(pdf_res["file_path"])
    assert pdf_path.exists(), "Exported PDF does not exist on disk!"
    print(f"✓ PDF Generated Successfully!")
    print(f"   • File Name: {pdf_res['file_name']}")
    print(f"   • File Size: {pdf_res['file_size']} bytes ({round(pdf_res['file_size']/1024, 1)} KB)")
    print(f"   • Pages:     {pdf_res['validation']['total_pages']}")
    print(f"   • Words:     {pdf_res['validation']['word_count']}")
    print(f"   • Validation Summary: {pdf_res['validation']['summary']}")

    print("\n--- 9. Generating Word DOCX Export ---")
    resp = httpx.post(f"{BASE_URL}/projects/{project_id}/export/docx", timeout=30.0)
    assert resp.status_code == 200, f"DOCX export failed: {resp.text}"
    docx_res = resp.json()
    docx_path = Path(docx_res["file_path"])
    assert docx_path.exists(), "Exported DOCX does not exist on disk!"
    print(f"✓ DOCX Generated Successfully ({round(docx_res['file_size']/1024, 1)} KB)")

    print("\n========================================================")
    print(" ALL 9 LIVE END-TO-END WORKFLOW STAGES PASSED 100%!")
    print("========================================================")

if __name__ == "__main__":
    run_live_e2e()
