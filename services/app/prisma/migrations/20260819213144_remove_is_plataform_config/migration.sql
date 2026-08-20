/*
  Warnings:

  - You are about to drop the column `is_platform_config` on the `brand_payment_configs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "brand_payment_configs" DROP COLUMN "is_platform_config";
