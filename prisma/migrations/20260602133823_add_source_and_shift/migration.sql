-- Add source and cashierId to Order
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'WEB';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "cashierId" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Shift" (
    "id" TEXT NOT NULL,
    "cashierId" TEXT NOT NULL,
    "cashierName" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "totalCash" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalInstaPay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalVodafoneCash" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalVisa" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualCash" DOUBLE PRECISION,
    "expectedTotal" DOUBLE PRECISION,
    "discrepancy" DOUBLE PRECISION,
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Order_source_idx" ON "Order"("source");
CREATE INDEX IF NOT EXISTS "Order_cashierId_idx" ON "Order"("cashierId");
CREATE INDEX IF NOT EXISTS "Shift_cashierId_status_idx" ON "Shift"("cashierId", "status");
