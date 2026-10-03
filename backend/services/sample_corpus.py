import os
from pathlib import Path
from typing import List, Dict, Any

SAMPLE_BOOKS: List[Dict[str, Any]] = [
    {
        "filename": "DeVita_Cancer_Principles_and_Practice_11th_Ed.pdf",
        "title": "Cancer: Principles & Practice of Oncology",
        "authors": "Vincent T. DeVita Jr., Theodore S. Lawrence, Steven A. Rosenberg",
        "edition": "11th Edition",
        "publication_year": "2019",
        "publisher": "Wolters Kluwer / Lippincott Williams & Wilkins",
        "isbn": "978-1496394637",
        "doi": "10.1097/PPO.0000000000000345",
        "pages": [
            {
                "page_number": 142,
                "heading": "Principles of Cancer Diagnosis and Biopsy Selection",
                "text": """The cornerstone of modern oncology is establishing an accurate and definitive tissue diagnosis prior to the initiation of any therapeutic intervention. Biopsy techniques must balance obtaining sufficient viable tissue for morphology, immunohistochemistry, and molecular profiling against patient procedural risk. Core needle biopsy (CNB) is generally preferred over fine-needle aspiration (FNA) for solid parenchymal masses because CNB preserves tissue architecture, enabling the pathologist to differentiate in situ from invasive malignancy. In tumors such as lymphomas and soft tissue sarcomas, architectural evaluation is paramount; cytologic aspiration alone frequently yields indeterminate results. Serum tumor markers (including CEA, CA 19-9, CA-125, and alpha-fetoprotein) lack sufficient diagnostic sensitivity and specificity for primary population screening, but remain invaluable for monitoring therapeutic response, detecting minimal residual disease, and signaling early recurrence."""
            },
            {
                "page_number": 143,
                "heading": "Clinical Presentation and Paraneoplastic Syndromes",
                "text": """Early malignancies are frequently asymptomatic, underscoring the critical necessity of structured risk-stratified screening programs. When present, clinical manifestations typically arise from local mass effect, ulceration, systemic inflammatory cytokine release, or paraneoplastic phenomena. Paraneoplastic syndromes occur in approximately 10% to 15% of malignancies, most prominently small cell lung cancer (SCLC), renal cell carcinoma, and neuroendocrine tumors. Common paraneoplastic manifestations include syndrome of inappropriate antidiuretic hormone secretion (SIADH), hypercalcemia of malignancy mediated by parathyroid hormone-related protein (PTHrP), Cushing syndrome from ectopic ACTH secretion, and Lambert-Eaton myasthenic syndrome. Recognizing a paraneoplastic syndrome can lead to cancer diagnosis months before the primary tumor becomes radiographically apparent."""
            },
            {
                "page_number": 144,
                "heading": "Integrated Multimodal Diagnostic Staging",
                "text": """Staging defines the anatomical extent of disease and provides the baseline framework for multidisciplinary treatment planning and prognosis. Clinical staging (cTNM) integrates physical examination, non-invasive imaging, endoscopies, and diagnostic laboratory data. Pathological staging (pTNM) incorporates intraoperative findings and definitive microscopic analysis of resected primary specimens and regional lymph nodes. Whole-body 18F-FDG PET/CT imaging has revolutionized staging across multiple solid malignancies, demonstrating superior accuracy in detecting occult distant metastases and evaluating metabolically active lymphadenopathy compared to contrast-enhanced computed tomography alone."""
            }
        ]
    },
    {
        "filename": "Robbins_and_Cotran_Pathologic_Basis_of_Disease_10th_Ed.pdf",
        "title": "Robbins & Cotran Pathologic Basis of Disease",
        "authors": "Vinay Kumar, Abul K. Abbas, Jon C. Aster",
        "edition": "10th Edition",
        "publication_year": "2020",
        "publisher": "Elsevier",
        "isbn": "978-0323531139",
        "doi": "10.1016/B978-0-323-53113-9.00007-4",
        "pages": [
            {
                "page_number": 285,
                "heading": "Morphologic and Cytologic Hallmarks of Malignancy",
                "text": """Histopathologic examination of formal formalin-fixed paraffin-embedded (FFPE) tissue remains the gold standard for cancer diagnosis. The definitive morphologic criteria of malignant transformation comprise: cellular and nuclear pleomorphism, nuclear hyperchromatism, increased nuclear-to-cytoplasmic (N:C) ratio, prominent or multiple nucleoli, atypical and bizarre mitotic figures, and loss of normal cellular polarity and tissue architecture. The most definitive feature distinguishing benign neoplasia from invasive carcinoma is the demonstration of basement membrane penetration and stromal invasion. Vascular, lymphatic, and perineural invasion provide microscopic indicators of aggressive biological potential and an elevated propensity for systemic dissemination."""
            },
            {
                "page_number": 286,
                "heading": "Immunohistochemistry in Tumor Lineage Classification",
                "text": """When neoplasms present as undifferentiated or poorly differentiated carcinomas of unknown primary origin, an algorithmic immunohistochemical (IHC) panel is mandatory. Cytokeratin subtyping using CK7 and CK20 provides a foundational branching point: CK7+/CK20- profiles strongly suggest primary pulmonary adenocarcinoma, breast carcinoma, or ovarian serous carcinoma; CK7-/CK20+ profiles are classic for colorectal adenocarcinoma; and CK7+/CK20+ patterns correspond to urothelial or pancreatic ductal carcinomas. Thyroid transcription factor-1 (TTF-1) and Napsin A exhibit high specificity for pulmonary adenocarcinoma, whereas p40 and p63 immunoreactivity conclusively establishes squamous cell differentiation. Human epidermal growth factor receptor 2 (HER2/neu) overexpression must be confirmed by IHC score 3+ (circumferential membranous staining in >10% of cells) or dual-probe fluorescence in situ hybridization (FISH) amplification (HER2/CEP17 ratio ≥2.0)."""
            },
            {
                "page_number": 287,
                "heading": "Molecular Pathology and Genetic Testing",
                "text": """Modern pathology has evolved from strictly morphological assessment to comprehensive genomic and proteomic characterization. Next-generation sequencing (NGS) allows simultaneous evaluation of hundreds of oncogenic driver mutations, gene rearrangements, copy number alterations, and microsatellite instability (MSI). In colorectal carcinoma, universal screening for mismatch repair deficiency (dMMR/MSI-H) via immunohistochemistry for MLH1, MSH2, MSH6, and PMS2 is required to identify Lynch syndrome and predict response to immune checkpoint blockade. KRAS and NRAS exon 2, 3, and 4 mutations predict resistance to anti-EGFR monoclonal antibodies (cetuximab, panitumumab), while the BRAF V600E mutation denotes a distinctive aggressive subgroup with tailored therapeutic regimens."""
            }
        ]
    },
    {
        "filename": "AJCC_Cancer_Staging_Manual_8th_Ed.pdf",
        "title": "AJCC Cancer Staging Manual",
        "authors": "Mahul B. Amin, Stephen B. Edge, Frederick L. Greene, et al.",
        "edition": "8th Edition",
        "publication_year": "2017",
        "publisher": "Springer International Publishing",
        "isbn": "978-3319406176",
        "doi": "10.1007/978-3-319-40618-3",
        "pages": [
            {
                "page_number": 510,
                "heading": "Evolution of the TNM Staging Classification Paradigm",
                "text": """The 8th Edition of the AJCC Cancer Staging Manual represents a historical paradigm shift from purely anatomic staging to personalized biological prognostic staging. While the classic anatomical parameters—Tumor size and local extent (T), regional Lymph Node involvement (N), and Distant Metastases (M)—remain essential, non-anatomic prognostic factors have been integrated into official stage groupings. In breast carcinoma, anatomic T and N are synthesized with histologic grade, estrogen receptor (ER) status, progesterone receptor (PR) status, HER2 expression, and validated multigene genomic assays (such as the Oncotype DX 21-gene recurrence score) to establish the Pathological Prognostic Stage."""
            },
            {
                "page_number": 511,
                "heading": "Oropharyngeal and Lung Cancer Staging Nuances",
                "text": """A prominent example of biological stratification in AJCC 8th edition is oropharyngeal squamous cell carcinoma, which is now explicitly partitioned into HPV/p16-positive and HPV/p16-negative cohorts. Patients with p16-positive oropharyngeal cancer exhibit significantly improved overall survival, justifying downstaging in the clinical and pathological staging schemes compared to tobacco-associated p16-negative counterparts. In non-small cell lung cancer (NSCLC), tumor size is categorized in strict 1-centimeter increments from T1a (≤1 cm) up to T4 (>7 cm), reflecting precise millimeter-level survival stratifications documented across international cohorts."""
            },
            {
                "page_number": 512,
                "heading": "Clinical versus Pathological Staging Discrepancies",
                "text": """Careful distinction must be preserved between clinical staging (cTNM), pathological staging (pTNM), and post-neoadjuvant therapy staging (ypTNM). Upstaging commonly occurs upon microscopic inspection of resection specimens due to detection of occult micrometastases in regional lymph nodes that escaped radiological detection. Conversely, downstaging may occur following neoadjuvant chemo-immunotherapy. Pathological complete response (pCR, ypT0 ypN0) serves as a potent surrogate endpoint for long-term event-free survival in aggressive subtypes such as triple-negative breast cancer and locally advanced rectal carcinoma."""
            }
        ]
    },
    {
        "filename": "WHO_Classification_of_Tumours_Thoracic_and_Digestive_5th_Ed.pdf",
        "title": "WHO Classification of Tumours: Thoracic and Digestive System Tumours",
        "authors": "WHO Classification of Tumours Editorial Board, International Agency for Research on Cancer",
        "edition": "5th Edition",
        "publication_year": "2021",
        "publisher": "World Health Organization / IARC Press",
        "isbn": "978-9283245001",
        "doi": "10.3322/caac.21660",
        "pages": [
            {
                "page_number": 88,
                "heading": "Molecular Subtyping of Non-Small Cell Lung Carcinoma",
                "text": """The 5th Edition WHO classification mandates molecular and biomarker analysis for all advanced non-squamous non-small cell lung carcinomas. The standard diagnostic testing panel must encompass actionable driver alterations: EGFR sensitizing mutations (exon 19 in-frame deletions, exon 21 L858R substitution, and resistance mutations such as T790M and C797S); ALK and ROS1 rearrangements; BRAF V600E mutations; RET fusions; MET exon 14 skipping alterations; and KRAS G12C mutations. Immunohistochemical evaluation of programmed death-ligand 1 (PD-L1) expression using tumor proportion score (TPS) is compulsory to guide upfront monotherapy versus chemo-immunotherapy; a TPS ≥50% establishes high eligibility for single-agent immune checkpoint inhibition."""
            },
            {
                "page_number": 89,
                "heading": "Colorectal Adenocarcinoma Subtypes and Biomarker Profiling",
                "text": """Colorectal carcinomas are classified by the WHO into conventional adenocarcinoma, mucinous adenocarcinoma (defined as >50% extracellular mucin pools), signet-ring cell carcinoma, and medullary carcinoma. Molecular pathways to colorectal carcinogenesis diverge significantly: the classic chromosomal instability (CIN) pathway (adenoma-carcinoma sequence involving APC, KRAS, and TP53) accounts for approximately 85% of cases; the microsatellite instability (MSI) pathway associated with defective DNA mismatch repair accounts for approximately 15%. All patients diagnosed with metastatic colorectal cancer must undergo extended RAS (KRAS and NRAS exons 2, 3, 4) and BRAF mutational testing prior to considering EGFR-targeted therapy."""
            },
            {
                "page_number": 90,
                "heading": "Breast Carcinoma Classification and Hormone Receptor Scoring",
                "text": """Invasive carcinoma of no special type (NST, previously invasive ductal carcinoma) comprises 75% to 80% of all invasive breast malignancies, followed by invasive lobular carcinoma (10% to 15%), characterized by loss of E-cadherin (CDH1) cell-cell adhesion molecule expression. Pathological reporting requires quantitative hormone receptor status: Estrogen Receptor (ER) and Progesterone Receptor (PR) are reported with percentage of positive nuclear staining and Allred or H-score; cases with 1% to 100% positive nuclear staining are classified as hormone receptor positive, with cases between 1% and 9% designated as ER-low positive. Proliferation index determined by Ki-67 immunohistochemistry assists in distinguishing Luminal A from Luminal B intrinsic molecular subtypes."""
            }
        ]
    },
    {
        "filename": "NCCN_Guidelines_Cancer_Screening_and_Diagnostic_Workup_2024.pdf",
        "title": "NCCN Clinical Practice Guidelines: Early Detection and Diagnostic Workup",
        "authors": "National Comprehensive Cancer Network Guidelines Panel",
        "edition": "2024 Guidelines Version 1.2024",
        "publication_year": "2024",
        "publisher": "National Comprehensive Cancer Network",
        "isbn": "NCCN-ONC-2024-V1",
        "doi": "10.6004/jnccn.2024.0012",
        "pages": [
            {
                "page_number": 34,
                "heading": "Evidence-Based Cancer Screening versus Diagnostic Confirmation",
                "text": """A fundamental clinical distinction must be rigorously maintained between cancer screening tests and definitive diagnostic procedures. Screening tests are applied to asymptomatic average-risk or defined high-risk populations to detect pre-malignant lesions or early asymptomatic malignancies (e.g., low-dose helical computed tomography for lung cancer screening in individuals aged 50-80 with a ≥20 pack-year smoking history; screening colonoscopy every 10 years or annual fecal immunochemical testing [FIT] starting at age 45). Any positive or suspicious screening finding represents a preliminary abnormal screen and strictly requires confirmatory diagnostic workup—typically contrast-enhanced multislice imaging followed by tissue biopsy. Clinicians must never initiate definitive oncologic therapy based solely on screening imaging or elevated non-specific serum markers."""
            },
            {
                "page_number": 35,
                "heading": "Diagnostic Imaging Modalities and Mammographic BI-RADS",
                "text": """Diagnostic breast evaluation employs the Breast Imaging Reporting and Data System (BI-RADS) lexicon. BI-RADS 1 and 2 represent negative and benign findings respectively; BI-RADS 3 represents probably benign findings (<2% malignancy risk, recommending short-interval 6-month surveillance); BI-RADS 4 represents suspicious abnormalities (subdivided into 4A low, 4B intermediate, 4C high suspicion, with 2% to 95% malignancy risk) requiring ultrasound- or stereotactic-guided core needle biopsy; and BI-RADS 5 signifies highly suggestive of malignancy (>95% risk), requiring urgent tissue sampling. Diagnostic breast MRI is indicated for assessing extent of disease in newly diagnosed lobular carcinoma, occult primary breast cancer, and high-risk surveillance (e.g., BRCA1/2 mutation carriers)."""
            },
            {
                "page_number": 36,
                "heading": "Liquid Biopsies and Emerging Diagnostic Technologies: Indications & Limits",
                "text": """Circulating tumor DNA (ctDNA) and cell-free DNA (cfDNA) analysis—collectively termed liquid biopsy—represents a transformative non-invasive diagnostic adjunct. In patients with metastatic NSCLC or other solid tumors where tissue biopsy is clinically inaccessible or yields insufficient cellular material, plasma ctDNA NGS is recommended to identify actionable genomic alterations (such as EGFR mutations or EML4-ALK fusions). However, current NCCN guidelines caution that a negative liquid biopsy result does not rule out the presence of oncogenic driver alterations due to variable tumor shedding kinetics. In the absence of positive ctDNA findings, a formal tissue biopsy remains mandatory. Multi-cancer early detection (MCED) blood tests based on DNA methylation signatures are undergoing prospective clinical evaluation and are not yet endorsed for standalone diagnostic confirmation."""
            }
        ]
    }
]

def generate_sample_pdfs_if_needed(uploads_dir: Path):
    """
    Generates actual physical PDF files for the 5 sample reference books
    if they do not already exist in uploads_dir using ReportLab.
    """
    uploads_dir.mkdir(parents=True, exist_ok=True)
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Heading1'],
            fontSize=16,
            leading=20,
            textColor=colors.HexColor('#1e293b'),
            spaceAfter=12
        )
        meta_style = ParagraphStyle(
            'DocMeta',
            parent=styles['Normal'],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#64748b'),
            spaceAfter=16
        )
        heading_style = ParagraphStyle(
            'SectionHead',
            parent=styles['Heading2'],
            fontSize=13,
            leading=16,
            textColor=colors.HexColor('#0f172a'),
            spaceBefore=14,
            spaceAfter=8
        )
        body_style = ParagraphStyle(
            'Body',
            parent=styles['Normal'],
            fontSize=10,
            leading=15,
            textColor=colors.HexColor('#334155'),
            spaceAfter=12
        )

        for book in SAMPLE_BOOKS:
            pdf_path = uploads_dir / book["filename"]
            if pdf_path.exists():
                continue

            doc = SimpleDocTemplate(
                str(pdf_path),
                pagesize=letter,
                leftMargin=54,
                rightMargin=54,
                topMargin=54,
                bottomMargin=54
            )
            story = []

            # Cover / Header
            story.append(Paragraph(f"<b>{book['title']}</b>", title_style))
            story.append(Paragraph(
                f"<b>Authors:</b> {book['authors']}<br/>"
                f"<b>Edition:</b> {book['edition']} | <b>Year:</b> {book['publication_year']}<br/>"
                f"<b>Publisher:</b> {book['publisher']} | <b>ISBN/DOI:</b> {book.get('isbn', '')} {book.get('doi', '')}",
                meta_style
            ))
            story.append(Spacer(1, 10))

            # Pages
            for page in book["pages"]:
                story.append(Paragraph(f"<b>[Source Page {page['page_number']}] — {page['heading']}</b>", heading_style))
                story.append(Paragraph(page["text"], body_style))
                story.append(PageBreak())

            doc.build(story)
            print(f"Generated sample PDF: {pdf_path.name}")
    except Exception as e:
        print(f"Could not build sample PDFs: {e}")
