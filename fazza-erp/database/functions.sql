-- Example SQL functions for Fazza ERP

CREATE OR REPLACE FUNCTION get_investor_balance(inv_id integer)
RETURNS numeric LANGUAGE sql STABLE AS $$
  SELECT COALESCE(SUM(amount),0) FROM (
    SELECT amount FROM receipts WHERE investor_id = inv_id
    UNION ALL
    SELECT -amount FROM payments WHERE investor_id = inv_id
  ) t;
$$;
