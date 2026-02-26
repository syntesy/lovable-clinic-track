
UPDATE academy_paper_fulltext
SET abstract = 'OBJECTIVES: To compare and evaluate the efficacy of intraarticular platelet-rich growth factor (PRGF) versus intraarticular steroid injections. MATERIAL AND METHODS: A prospective, blinded, randomized controlled trial was conducted by enrolling 650 patients with knee osteoarthritis (OA) who did not respond to the combination of oral medication and physiotherapy. After computer-based randomization and exclusion, the number of patients in our study was 557. Patients were divided into 2 groups. Group 1 (310 patients) received intraarticular PRGF injection and group 2 (247 patients) received intraarticular injection of 40-mg triamcinolone solution. The post-trial follow-up period ranged from 12 to 18.5 months. The primary endpoints were the International Knee Documentation Committee (IKDC) and Western Ontario and McMaster Universities Osteoarthritis Index (WOMAC) scores and the secondary endpoints were the Visual Analog Scale (VAS) pain scores. RESULT: The data showed significant statistical difference (p < 0.01) in almost all of the scoring, in favor of the PRGF injection, except no significance at the first 2 months (WOMAC, p = 0.053). CONCLUSION: PRGF and intraarticular steroid injection result in good outcomes, however in terms of functional scoring (WOMAC and IKDC), PRGF treatment demonstrated significantly better clinical outcomes at 6- to 12-month follow-up. PRGF treatment can become an effective alternative treatment in knee OA.',
    abstract_source = 'extracted',
    abstract_char_count = 1197
WHERE paper_id = '8cc670ec-3bf3-4cde-8b65-e3d2bf09f8e3';

UPDATE academy_papers
SET abstract_text = (SELECT abstract FROM academy_paper_fulltext WHERE paper_id = '8cc670ec-3bf3-4cde-8b65-e3d2bf09f8e3')
WHERE id = '8cc670ec-3bf3-4cde-8b65-e3d2bf09f8e3';
