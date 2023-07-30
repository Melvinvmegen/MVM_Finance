/*
  Warnings:

  - You are about to drop the `RefreshTokens` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "RefreshTokens" DROP CONSTRAINT "RefreshTokens_UserId_fkey";

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "authTicket" TEXT,
ADD COLUMN     "lastLogin" TIMESTAMP(3);

-- DropTable
DROP TABLE "RefreshTokens";
