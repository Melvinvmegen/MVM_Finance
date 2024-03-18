ALTER TABLE investment_profile
ADD COLUMN fixed_fees DOUBLE PRECISION NOT NULL DEFAULT 800;

ALTER TABLE investment_profile
ADD COLUMN monthly_investment_capacity DOUBLE PRECISION NOT NULL DEFAULT 0;
