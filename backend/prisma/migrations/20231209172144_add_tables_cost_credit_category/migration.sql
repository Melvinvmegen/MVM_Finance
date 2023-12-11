-- CreateTable
CREATE TABLE "cost_category" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" VARCHAR(50) NOT NULL,
    "icon" VARCHAR(100) NULL,
    "color" VARCHAR(10) NULL,
    CONSTRAINT "cost_category_pkey" PRIMARY KEY ("id")
);

-- InsertData
INSERT INTO
    cost_category (name, color)
VALUES
    ('TODEFINE', '#010100');

INSERT INTO
    cost_category (name, color)
VALUES
    ('GENERAL', '#2B0103');

INSERT INTO
    cost_category (name, color)
VALUES
    ('TAXES', '#540b0e');

INSERT INTO
    cost_category (name, color)
VALUES
    ('HOBBIES', '#7C1E24');

INSERT INTO
    cost_category (name, color)
VALUES
    ('TRAVEL', '#9e2a2b');

INSERT INTO
    cost_category (name, color)
VALUES
    ('SUBSCRIPTIONS', '#D92A21');

INSERT INTO
    cost_category (name, color)
VALUES
    ('HOUSING', '#FC2E20');

INSERT INTO
    cost_category (name, color)
VALUES
    ('SAVINGS', '#FD5C20');

INSERT INTO
    cost_category (name, color)
VALUES
    ('WITHDRAWALS', '#FD7F20');

INSERT INTO
    cost_category (name, color)
VALUES
    ('CAR', '#FD9A3D');

INSERT INTO
    cost_category (name, color)
VALUES
    ('GIFTS', '#FDB750');

INSERT INTO
    cost_category (name, color)
VALUES
    ('EDUCATION', '#EBF8FA');

INSERT INTO
    cost_category (name, color)
VALUES
    ('LOANS', '#D4F1F4');

INSERT INTO
    cost_category (name, color)
VALUES
    ('BUSINESSFEES', '#A3EAF0');

INSERT INTO
    cost_category (name, color)
VALUES
    ('INTERNALMOVES', '#75E6DA');

INSERT INTO
    cost_category (name, color)
VALUES
    ('HEALTH', '#3BB4CC');

INSERT INTO
    cost_category (name, color)
VALUES
    ('FINANCIALSERVICES', '#189AB4');

INSERT INTO
    cost_category (name, color)
VALUES
    ('TRANSFER', '#126D8F');

INSERT INTO
    cost_category (name, color)
VALUES
    ('INVESTMENT', '#05445E');

INSERT INTO
    cost_category (name, color)
VALUES
    ('ELSE', '#03202F');

-- CreateTable
CREATE TABLE "credit_category" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" VARCHAR(50) NOT NULL,
    "icon" VARCHAR(100) NULL,
    "color" VARCHAR(10) NULL,
    CONSTRAINT "credit_category_pkey" PRIMARY KEY ("id")
);

INSERT INTO
    credit_category (name, color)
VALUES
    ('TODEFINE', '#010100');

INSERT INTO
    credit_category (name, color)
VALUES
    ('ALLOWANCES', '#03202F');

INSERT INTO
    credit_category (name, color)
VALUES
    ('GIFTS', '#05445E');

INSERT INTO
    credit_category (name, color)
VALUES
    ('DEPOSITS', '#0B6380');

INSERT INTO
    credit_category (name, color)
VALUES
    ('LOANS', '#126D8F');

INSERT INTO
    credit_category (name, color)
VALUES
    ('INTERNALMOVES', '#189AB4');

INSERT INTO
    credit_category (name, color)
VALUES
    ('PENSIONS', '#3BB4CC');

INSERT INTO
    credit_category (name, color)
VALUES
    ('REFUND', '#62D1DC');

INSERT INTO
    credit_category (name, color)
VALUES
    ('INCOMESAVINGS', '#75E6DA');

INSERT INTO
    credit_category (name, color)
VALUES
    ('SALARY', '#A3EAF0');

INSERT INTO
    credit_category (name, color)
VALUES
    ('CRYPTO', '#D4F1F4');

INSERT INTO
    credit_category (name, color)
VALUES
    ('STOCK', '#EBF8FA');

INSERT INTO
    credit_category (name, color)
VALUES
    ('RENTAL', '#FDB750');

INSERT INTO
    credit_category (name, color)
VALUES
    ('CASH', '#FD9A3D');

INSERT INTO
    credit_category (name, color)
VALUES
    ('ELSE', '#FD7F20');

-- AlterTable
ALTER TABLE
    "Costs"
ADD
    COLUMN "CostCategoryId" INTEGER NOT NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE
    "Costs"
ADD
    CONSTRAINT "Costs_CostCategoryId_fkey" FOREIGN KEY ("CostCategoryId") REFERENCES "cost_category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- MigrateData
UPDATE
    "Costs"
SET
    "CostCategoryId" = cost_category.id
FROM
    cost_category
WHERE
    "Costs".category = 'TAX'
    AND cost_category.name = 'TAXES';

UPDATE
    "Costs"
SET
    "CostCategoryId" = cost_category.id
FROM
    cost_category
WHERE
    "Costs".category = 'INTERESTS'
    AND cost_category.name = 'HOBBIES';

UPDATE
    "Costs"
SET
    "CostCategoryId" = cost_category.id
FROM
    cost_category
WHERE
    "Costs".category = 'TRIP'
    AND cost_category.name = 'TRAVEL';

UPDATE
    "Costs"
SET
    "CostCategoryId" = cost_category.id
FROM
    cost_category
WHERE
    "Costs".category = 'SERVICES'
    AND cost_category.name = 'SUBSCRIPTIONS';

UPDATE
    "Costs"
SET
    "CostCategoryId" = cost_category.id
FROM
    cost_category
WHERE
    "Costs".category = 'WITHDRAWAL'
    AND cost_category.name = 'WITHDRAWALS';

UPDATE
    "Costs"
SET
    "CostCategoryId" = cost_category.id
FROM
    cost_category
WHERE
    "Costs".category :: text = cost_category.name;

-- AlterTable
ALTER TABLE
    "Credits"
ADD
    COLUMN "CreditCategoryId" INTEGER NOT NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE
    "Credits"
ADD
    CONSTRAINT "Credits_CreditCategoryId_fkey" FOREIGN KEY ("CreditCategoryId") REFERENCES "credit_category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

UPDATE
    "Credits"
SET
    "CreditCategoryId" = credit_category.id
FROM
    credit_category
WHERE
    "Credits".category = 'TRANSFER'
    AND credit_category.name = 'INTERNALMOVES';

UPDATE
    "Credits"
SET
    "CreditCategoryId" = credit_category.id
FROM
    credit_category
WHERE
    "Credits".category :: text = credit_category.name;