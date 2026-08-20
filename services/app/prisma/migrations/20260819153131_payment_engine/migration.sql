-- CreateEnum
CREATE TYPE "PaymentGatewayType" AS ENUM ('CLIP', 'STRIPE', 'MERCADOPAGO', 'PSE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "securityPin" TEXT,
ADD COLUMN     "showWalkthrough" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "walkthroughDoneAt" TIMESTAMP(3),
ADD COLUMN     "walkthroughStep" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "webauthnCredential" TEXT;

-- CreateTable
CREATE TABLE "brand_payment_configs" (
    "id" TEXT NOT NULL,
    "brand_id" TEXT NOT NULL,
    "gateway_type" "PaymentGatewayType" NOT NULL DEFAULT 'CLIP',
    "public_key" TEXT NOT NULL,
    "encrypted_secret_key" TEXT NOT NULL,
    "webhook_secret" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brand_payment_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL,
    "owner_type" TEXT NOT NULL DEFAULT 'BRAND',
    "owner_id" TEXT NOT NULL,
    "brand_id" TEXT,
    "gateway_type" "PaymentGatewayType" NOT NULL,
    "external_id" TEXT NOT NULL,
    "checkout_url" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MXN',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "metadata" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "brand_payment_configs_brand_id_key" ON "brand_payment_configs"("brand_id");

-- CreateIndex
CREATE INDEX "payment_transactions_owner_type_owner_id_idx" ON "payment_transactions"("owner_type", "owner_id");

-- CreateIndex
CREATE INDEX "payment_transactions_external_id_idx" ON "payment_transactions"("external_id");

-- CreateIndex
CREATE INDEX "payment_transactions_brand_id_idx" ON "payment_transactions"("brand_id");

-- AddForeignKey
ALTER TABLE "brand_payment_configs" ADD CONSTRAINT "brand_payment_configs_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;
