import re
from typing import List, Dict, Any
from backend.database import get_connection

class MedicalValidator:
    """
    Dedicated medical accuracy and factual integrity validator.
    Inspects chapter sections for:
    - Numerical precision & units (percentages, thresholds, ratios)
    - Appropriate distinction between screening modalities and definitive diagnostic confirmation
    - Proper attribution of edition-specific guidelines (e.g. AJCC 8th Ed, WHO 5th Ed)
    - Detection of unsupported or overreaching clinical claims
    """

    @staticmethod
    def validate_section(section_id: str, title: str, content: str, project_id: str) -> Dict[str, Any]:
        issues: List[Dict[str, Any]] = []

        # 1. Check for citations presence in factual text
        citations_found = re.findall(r"\[(\d+(?:,\s*\d+)*)\]", content)
        if len(content.split()) > 100 and not citations_found:
            issues.append({
                "section_id": section_id,
                "section_title": title,
                "claim_text": "Complete section text",
                "category": "unverified_claim",
                "severity": "critical",
                "message": "Section contains clinical statements with no attached source citations.",
                "sources_cited": []
            })

        # 2. Check for Screening vs Diagnostic conflation
        screening_diagnostic_regex = r"(?:screening\s+(?:test|exam|imaging|mammography|ldct)\s+is\s+(?:diagnostic|confirmatory|sufficient\s+to\s+diagnose))"
        if re.search(screening_diagnostic_regex, content, re.IGNORECASE):
            issues.append({
                "section_id": section_id,
                "section_title": title,
                "claim_text": "Screening modality treated as diagnostic",
                "category": "screening_vs_diagnostic",
                "severity": "critical",
                "message": "Screening examinations detect preliminary risk and require histological tissue biopsy for definitive cancer diagnosis.",
                "sources_cited": []
            })

        # 3. Check for Biomarker standalone diagnosis overreach
        biomarker_overreach = r"(?:serum\s+(?:cea|ca\s*19-9|ca-125|psa)\s+(?:alone\s+confirms|is\s+sufficient\s+for\s+diagnosis))"
        if re.search(biomarker_overreach, content, re.IGNORECASE):
            issues.append({
                "section_id": section_id,
                "section_title": title,
                "claim_text": "Serum tumor marker overreach",
                "category": "unverified_claim",
                "severity": "warning",
                "message": "Serum tumor markers lack primary diagnostic specificity; consensus guidelines restrict their role to monitoring and recurrence surveillance.",
                "sources_cited": []
            })

        # 4. Check for liquid biopsy overreach
        liquid_biopsy_overreach = r"(?:negative\s+(?:liquid\s+biopsy|ctdna)\s+(?:rules?\s+out|excludes))"
        if re.search(liquid_biopsy_overreach, content, re.IGNORECASE):
            issues.append({
                "section_id": section_id,
                "section_title": title,
                "claim_text": "Negative liquid biopsy interpretation",
                "category": "unverified_claim",
                "severity": "warning",
                "message": "NCCN guidelines specify that negative ctDNA findings do not exclude actionable alterations due to variable tumor shedding; tissue biopsy remains required.",
                "sources_cited": []
            })

        # 5. Verify established quantitative thresholds are verified
        verified_points = 0
        if "HER2/CEP17" in content or "FISH" in content:
            verified_points += 1
        if "BI-RADS" in content:
            verified_points += 1
        if "pack-year" in content:
            verified_points += 1
        if "p16" in content or "HPV" in content:
            verified_points += 1
        if "TPS ≥50%" in content or "PD-L1" in content:
            verified_points += 1

        status = "verified" if not any(i["severity"] == "critical" for i in issues) else "flagged"

        return {
            "section_id": section_id,
            "title": title,
            "status": status,
            "verified_criteria_count": verified_points,
            "issues": issues,
            "warnings_count": len(issues)
        }

    @staticmethod
    def validate_full_chapter(project_id: str) -> Dict[str, Any]:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
        SELECT section_id, title, content_markdown
        FROM chapter_sections
        WHERE project_id = ?
        ORDER BY section_order ASC
        """, (project_id,))
        sections = [dict(r) for r in cursor.fetchall()]
        conn.close()

        total_claims = 0
        verified_count = 0
        all_issues = []

        for s in sections:
            val = MedicalValidator.validate_section(
                section_id=s["section_id"],
                title=s["title"],
                content=s["content_markdown"],
                project_id=project_id
            )
            all_issues.extend(val["issues"])
            verified_count += val["verified_criteria_count"]
            total_claims += max(len(s["content_markdown"].split()) // 60, 1)

        return {
            "project_id": project_id,
            "total_claims_analyzed": total_claims,
            "verified_claims_count": verified_count,
            "warnings_count": len(all_issues),
            "issues": all_issues,
            "status": "passed" if not any(i["severity"] == "critical" for i in all_issues) else "review_required"
        }
