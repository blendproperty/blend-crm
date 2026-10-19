-- Read-only PostgreSQL self-check for the nullable reporting filter.
DO $$
DECLARE kept text[];
BEGIN
  SELECT array_agg(id ORDER BY id) INTO kept
  FROM (VALUES ('genuine-null', NULL), ('genuine-killed', 'Not a property enquiry'), ('qa', 'TEST ONLY - regression')) AS fixtures(id, reason)
  WHERE reason IS NULL OR NOT reason LIKE 'TEST ONLY%';
  IF kept IS DISTINCT FROM ARRAY['genuine-killed', 'genuine-null'] THEN
    RAISE EXCEPTION 'QA filter removed genuine/null-reason leads or retained the test';
  END IF;
END $$;
