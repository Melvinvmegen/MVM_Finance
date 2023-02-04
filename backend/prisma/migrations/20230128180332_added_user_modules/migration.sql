-- AlterTable
ALTER TABLE "Users" 
ADD COLUMN     "cryptosModuleActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "customersModuleActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "revenusModuleActive" BOOLEAN NOT NULL DEFAULT true;
