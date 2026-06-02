-- Add shiftPassword to AdminUser
ALTER TABLE "AdminUser" ADD COLUMN IF NOT EXISTS "shiftPassword" TEXT NOT NULL DEFAULT '123456';

-- Create ShiftLog table
CREATE TABLE IF NOT EXISTS "ShiftLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "shiftId" TEXT,
    "shiftStartedAt" TIMESTAMP(3) NOT NULL,
    "shiftEndedAt" TIMESTAMP(3) NOT NULL,
    "ordersCount" INTEGER NOT NULL DEFAULT 0,
    "cashExpected" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "instapayExpected" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vodafoneCashExpected" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "visaExpected" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalExpected" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualCashInDrawer" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShiftLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ShiftLog_userId_idx" ON "ShiftLog"("userId");