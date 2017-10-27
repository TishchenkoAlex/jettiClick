DROP TRIGGER computed_description ON public."Documents"
DROP FUNCTION computed_description();

CREATE FUNCTION computed_description()
  RETURNS trigger
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    generatorName VARCHAR(100);
    operation VARCHAR(150);
BEGIN
  IF (NEW.code ISNULL OR NEW.code = '' OR NEW.code = 'null') THEN
    SELECT "generator" INTO generatorName from config_schema WHERE type = NEW.type;
    SELECT nextval(generatorName) INTO NEW.code;
  END IF;

  IF (NEW.date ISNULL) THEN
    NEW.date = now();
  END IF;

  IF (NEW.type = 'Document.Operation') THEN
    SELECT coalesce(' (' || description || ')', '') INTO operation FROM "Documents" WHERE id = NEW.doc->>'Operation';
  END IF;

  IF position('Document.' IN NEW.type) > 0 THEN
    NEW.description = (SELECT description from config_schema WHERE type = NEW.type) || ' #' ||  NEW.code || operation || to_char(NEW.date, ', YYYY-MM-DD HH24:MI:SS');
  END IF;

  RETURN NEW;
END
$$;

CREATE TRIGGER computed_description
  BEFORE INSERT OR UPDATE
  ON "Documents"
  FOR EACH ROW
EXECUTE PROCEDURE computed_description();