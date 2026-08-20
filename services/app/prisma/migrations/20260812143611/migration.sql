/*
  Warnings:

  - A unique constraint covering the columns `[apiKey]` on the table `brands` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "brands" ADD COLUMN     "apiKey" TEXT,
ADD COLUMN     "billingWebhookUrl" TEXT,
ADD COLUMN     "generalWebhookUrl" TEXT,
ADD COLUMN     "isWebhookEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "webhook_logs" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT,
    "event" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "payload" TEXT NOT NULL,
    "response" TEXT,
    "error_message" TEXT,
    "duration_ms" INTEGER,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "next_attempt_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "webhook_logs_brand_id_idx" ON "webhook_logs"("brand_id");

-- CreateIndex
CREATE INDEX "webhook_logs_created_at_idx" ON "webhook_logs"("created_at");

-- CreateIndex
CREATE INDEX "webhook_logs_next_attempt_at_idx" ON "webhook_logs"("next_attempt_at");

-- CreateIndex
CREATE UNIQUE INDEX "brands_apiKey_key" ON "brands"("apiKey");

-- AddForeignKey
ALTER TABLE "webhook_logs" ADD CONSTRAINT "webhook_logs_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;
