-- CreateTable
CREATE TABLE "customer_rewards" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "activeRewards" JSONB NOT NULL,
    "discountCode" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reward_templates" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "rewardType" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reward_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shopify_discount_codes" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "shopifyId" TEXT NOT NULL,
    "percentage" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shopify_discount_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_rewards_merchantId_tier_idx" ON "customer_rewards"("merchantId", "tier");

-- CreateIndex
CREATE UNIQUE INDEX "customer_rewards_merchantId_customerId_key" ON "customer_rewards"("merchantId", "customerId");

-- CreateIndex
CREATE INDEX "reward_templates_merchantId_tier_idx" ON "reward_templates"("merchantId", "tier");

-- CreateIndex
CREATE UNIQUE INDEX "reward_templates_merchantId_tier_rewardType_key" ON "reward_templates"("merchantId", "tier", "rewardType");

-- CreateIndex
CREATE INDEX "shopify_discount_codes_merchantId_code_idx" ON "shopify_discount_codes"("merchantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "shopify_discount_codes_merchantId_customerId_tier_key" ON "shopify_discount_codes"("merchantId", "customerId", "tier");
