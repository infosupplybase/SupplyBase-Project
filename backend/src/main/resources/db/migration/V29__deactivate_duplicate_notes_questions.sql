git commit
-- Duplicate notes rows left behind by earlier service-category migrations
-- (Waterproofing had two identical "Tell us anything else about your work."
-- rows). A category should show a single notes question, so the older copy is
-- switched off and the newest is kept. Rows are deactivated, not removed: the
-- catalogue only reads active options, nothing is lost, and re-running this
-- changes nothing.
UPDATE service_options s1
INNER JOIN service_options s2
  ON s1.category_id = s2.category_id
 AND s1.question_key = s2.question_key
 AND s1.question_text = s2.question_text
 AND s1.id < s2.id
SET s1.active = FALSE
WHERE s1.active = TRUE
  AND s2.active = TRUE
  AND s1.question_key = 'notes';
