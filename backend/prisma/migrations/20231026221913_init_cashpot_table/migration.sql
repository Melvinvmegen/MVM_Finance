-- This is an empty migration.
INSERT INTO
  "CashPots" (name, amount, "UserId", "updatedAt")
SELECT
  'Cash',
  0,
  id,
  NOW()
FROM
  "Users";