ALTER TABLE asset
ADD COLUMN creation_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE asset
SET creation_date = created_at;