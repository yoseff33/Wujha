-- Seed data for Fazza ERP

INSERT INTO investors (name, email) VALUES
('محمد علي','mohammad@example.com'),
('علي حسن','ali@example.com')
ON CONFLICT DO NOTHING;

INSERT INTO receipts (investor_id, amount) VALUES
(1, 1000), (2, 2000)
ON CONFLICT DO NOTHING;
