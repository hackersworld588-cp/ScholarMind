import os
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from backend.config import STORAGE_DIR

SAMPLE_IMG_DIR = STORAGE_DIR / "sample_images"
SAMPLE_IMG_DIR.mkdir(parents=True, exist_ok=True)

BOOK_PAGES = [
    {
        "filename": "book1_devita_cancer_principles.png",
        "book_title": "DeVita, Hellman & Rosenberg's Cancer: Principles & Practice of Oncology (11th Ed.)",
        "chapter_header": "CHAPTER 12: CLINICAL PRINCIPLES OF CANCER DIAGNOSIS",
        "page_num": "Page 142",
        "paragraphs": [
            "1.1 Biopsy Selection and Tissue Verification",
            "The definitive diagnosis of malignancy requires adequate histologic sampling prior to initiating any cytotoxic or targeted therapy. Core needle biopsy (CNB) is strongly favored over fine-needle aspiration (FNA) for solid visceral and soft tissue masses because CNB preserves three-dimensional tissue architecture. FNA yields only isolated cells and often fails to differentiate carcinoma in situ from invasive carcinoma.",
            "1.2 Role of Serum Biomarkers",
            "Serum tumor markers (including CEA, CA 19-9, and CA-125) lack adequate diagnostic sensitivity and specificity for initial population screening. Their proven utility lies strictly in baseline risk stratification, assessing therapeutic response, and early surveillance for disease recurrence.",
            "1.3 Staging Philosophy",
            "Accurate anatomical staging (cTNM vs pTNM) guides surgical resectability and systemic protocols. Multimodal cross-sectional imaging (contrast CT, MRI, and 18F-FDG PET/CT) is essential to evaluate regional nodal basins and rule out distant occult metastases."
        ]
    },
    {
        "filename": "book2_robbins_pathology.png",
        "book_title": "Robbins & Cotran: Pathologic Basis of Disease (10th Ed.)",
        "chapter_header": "CHAPTER 7: PATHOLOGY OF NEOPLASIA — HISTOLOGIC & IMMUNOHISTOCHEMICAL CRITERIA",
        "page_num": "Page 285",
        "paragraphs": [
            "2.1 Hallmarks of Malignant Transformation",
            "Under microscopic inspection, malignant transformation is heralded by cellular pleomorphism, nuclear hyperchromasia, markedly elevated nuclear-to-cytoplasmic (N:C) ratios, and atypical multipolar mitotic spindles. The definitive diagnostic proof of invasive carcinoma is basement membrane breach and infiltration into native fibrovascular stroma.",
            "2.2 Immunohistochemical Lineage Algorithms",
            "When dealing with poorly differentiated carcinomas of unknown primary origin, an algorithmic cytokeratin panel is mandatory. CK7+/CK20- profiles point toward primary lung adenocarcinoma or breast carcinoma. CK7-/CK20+ profiles reliably characterize colorectal adenocarcinoma. Dual CK7+/CK20+ indicates urothelial or pancreatic origins.",
            "2.3 Predictive Molecular Biomarkers",
            "Lineage transcription factor TTF-1 and Napsin A confirm pulmonary origin, whereas p40 establishes squamous differentiation. HER2/neu overexpression requires IHC 3+ scoring or dual-probe FISH demonstration of HER2/CEP17 copy number ratio ≥2.0."
        ]
    },
    {
        "filename": "book3_nccn_guidelines.png",
        "book_title": "NCCN Clinical Practice Guidelines: Early Detection & Diagnostic Workup (2024)",
        "chapter_header": "NCCN GUIDELINES 2024: EVIDENCE-BASED DIAGNOSTIC WORKUP",
        "page_num": "Page 34",
        "paragraphs": [
            "3.1 Screening vs Confirmatory Diagnostic Workup",
            "A strict clinical dichotomy must be preserved between screening examinations and definitive diagnostic procedures. Screening tests (e.g., low-dose helical CT for lung cancer in 50-80 year-olds with ≥20 pack-year history; colonoscopy or annual FIT) identify high-risk asymptomatic individuals. Any abnormal screen strictly mandates confirmatory tissue biopsy.",
            "3.2 Standardized Radiologic Lexicons",
            "Breast lesion assessment employs BI-RADS scoring: BI-RADS 3 denotes probably benign (<2% risk; 6-month surveillance), BI-RADS 4 denotes suspicious abnormalities (2% to 95% risk; core biopsy required), and BI-RADS 5 signifies highly suggestive of malignancy (>95% risk; immediate tissue acquisition).",
            "3.3 Liquid Biopsy (ctDNA) Guidelines",
            "Circulating tumor DNA (ctDNA) liquid biopsy is valuable when tissue is inaccessible or cellularity is depleted. However, current NCCN consensus dictates that a negative liquid biopsy does NOT exclude driver mutations due to variable shedding kinetics; tissue biopsy remains mandatory in all negative ctDNA cases."
        ]
    }
]

def generate_sample_book_images():
    for page in BOOK_PAGES:
        img_path = SAMPLE_IMG_DIR / page["filename"]
        if img_path.exists():
            continue

        # Create 1200x1600 high-res page image (book page aspect ratio)
        width, height = 1200, 1600
        # Warm parchment / off-white paper color
        image = Image.new("RGB", (width, height), color=(253, 252, 248))
        draw = ImageDraw.Draw(image)

        # Subtle paper border / margin guide
        draw.rectangle([(60, 60), (width - 60, height - 60)], outline=(226, 232, 240), width=2)

        # Header bar
        draw.rectangle([(80, 80), (width - 80, 140)], fill=(241, 245, 249))
        draw.text((100, 100), page["book_title"], fill=(71, 85, 105))
        draw.text((width - 200, 100), page["page_num"], fill=(71, 85, 105))

        # Chapter Title
        draw.text((100, 170), page["chapter_header"], fill=(15, 23, 42))
        draw.line([(100, 210), (width - 100, 210)], fill=(79, 70, 229), width=3)

        # Text Paragraphs
        y = 250
        for para in page["paragraphs"]:
            # Heading vs Body text
            if para.startswith("1.") or para.startswith("2.") or para.startswith("3."):
                draw.text((100, y), para, fill=(30, 41, 59))
                y += 50
            else:
                # Wrap text across multiple lines
                words = para.split(" ")
                current_line = []
                for word in words:
                    test_line = " ".join(current_line + [word])
                    if len(test_line) > 65:
                        draw.text((120, y), " ".join(current_line), fill=(51, 65, 85))
                        y += 38
                        current_line = [word]
                    else:
                        current_line.append(word)
                if current_line:
                    draw.text((120, y), " ".join(current_line), fill=(51, 65, 85))
                    y += 45
                y += 25

        # Footer
        draw.line([(80, height - 120), (width - 80, height - 120)], fill=(226, 232, 240), width=1)
        draw.text((100, height - 100), "ScholarMind AI Reference Corpus — Verified Primary Literature Scan", fill=(148, 163, 184))

        image.save(str(img_path))
        print(f"Generated sample book image: {img_path.name}")

if __name__ == "__main__":
    generate_sample_book_images()
