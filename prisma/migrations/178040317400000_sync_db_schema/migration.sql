-- Sync database schema to match Prisma schema after prisma db push
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shiftId" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "stock" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS "Order_shiftId_idx" ON "Order"("shiftId");
CREATE INDEX IF NOT EXISTS "Product_stock_idx" ON "Product"("stock");