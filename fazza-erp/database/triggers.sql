-- Example triggers

CREATE OR REPLACE FUNCTION update_investor_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.created_at = COALESCE(NEW.created_at, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_investor_timestamp
BEFORE INSERT ON investors
FOR EACH ROW EXECUTE FUNCTION update_investor_timestamp();
