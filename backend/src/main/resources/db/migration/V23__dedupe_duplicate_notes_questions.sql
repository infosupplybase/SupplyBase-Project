-- Remove duplicate notes rows left behind by earlier service-category migrations.
-- A single category should expose a single "Tell us anything else..." question.
DELETE s1
FROM service_options s1
INNER JOIN service_options s2
  ON s1.category_id = s2.category_id
 AND s1.question_key = s2.question_key
 AND s1.question_text = s2.question_text
 AND s1.id < s2.id
WHERE s1.active = TRUE
  AND s2.active = TRUE
  AND s1.question_key = 'notes';
