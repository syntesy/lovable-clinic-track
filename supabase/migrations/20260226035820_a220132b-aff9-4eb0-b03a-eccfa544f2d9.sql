
WITH abstract_extract AS (
  SELECT 
    paper_id,
    TRIM(SUBSTRING(extracted_text FROM '(?i)\babstract\b[\s.:]*(.+?)(?=\b(?:introduction|methods|materials|background|keywords)\b)')) as abs_text
  FROM academy_paper_fulltext
  WHERE paper_id = '8cc670ec-3bf3-4cde-8b65-e3d2bf09f8e3'
)
UPDATE academy_paper_fulltext f
SET abstract = CASE 
  WHEN LENGTH(ae.abs_text) > 100 THEN LEFT(ae.abs_text, 2000) 
  ELSE LEFT(f.extracted_text, 1800)
END,
abstract_source = CASE 
  WHEN LENGTH(ae.abs_text) > 100 THEN 'extracted' 
  ELSE 'fallback'
END,
abstract_char_count = CASE 
  WHEN LENGTH(ae.abs_text) > 100 THEN LEAST(LENGTH(ae.abs_text), 2000)
  ELSE LEAST(LENGTH(f.extracted_text), 1800)
END
FROM abstract_extract ae
WHERE f.paper_id = ae.paper_id;

-- Sync to academy_papers as cache
UPDATE academy_papers SET abstract_text = (
  SELECT abstract FROM academy_paper_fulltext WHERE paper_id = '8cc670ec-3bf3-4cde-8b65-e3d2bf09f8e3'
) WHERE id = '8cc670ec-3bf3-4cde-8b65-e3d2bf09f8e3';
