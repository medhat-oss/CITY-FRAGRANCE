import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { readJsonFile } from '@/lib/dataFile';

interface OrderItem {
  id?: string;
  name: string;
  quantity: number;
  price: number;
}

interface ProductData {
  id: string;
  name: string;
  price: number;
  salePrice?: number | null;
  images?: string[];
  category?: string;
  collection?: string;
  notes?: string;
  stock?: number;
}

interface GiftSetData {
  id: string;
  name: string;
  price: number;
  image?: string;
  stock?: number;
}

export async function GET() {
  try {
    // ── Fetch active (non-cancelled/refunded) orders for aggregation ──
    const [activeOrders, recentOrdersRaw] = await Promise.all([
      prisma.order.findMany({
        where: { status: { notIn: ['cancelled', 'refunded', 'Cancelled', 'Refunded'] } },
        orderBy: { createdAt: 'desc' },
        select: {
          totalPrice: true, status: true, paymentMethod: true,
          customerName: true, address: true, createdAt: true,
          items: true, orderId: true, date: true,
        },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          orderId: true, date: true, customerName: true,
          paymentMethod: true, totalPrice: true, status: true,
          address: true,
        },
      }),
    ]);

    // ── Fetch products & gift sets from JSON (parallel) ──
    const [products, giftSets] = await Promise.all([
      readJsonFile<ProductData[]>('products.json', []),
      readJsonFile<GiftSetData[]>('gift-sets.json', []),
    ]);

    // ── Fetch Prisma products & gift sets for costPrice data ──
    const [prismaProducts, prismaGiftSets] = await Promise.all([
      prisma.product.findMany({
        where: { isDraft: false },
        select: { id: true, name: true, costPrice: true },
      }),
      prisma.giftSet.findMany({
        where: { isDraft: false },
        select: { id: true, name: true, costPrice: true },
      }),
    ]);
    // Key by lowercase name — order items store real product names but not real product IDs
    const costPriceMap = new Map<string, number>();
    for (const p of prismaProducts) if (p.name) costPriceMap.set(p.name.toLowerCase(), p.costPrice);
    for (const g of prismaGiftSets) if (g.name) costPriceMap.set(g.name.toLowerCase(), g.costPrice);

    // ── Single-pass aggregation over orders ──
    const orders = activeOrders;
    const totalOrders = orders.length;
    let totalRevenue = 0;
    let posRevenue = 0;
    let onlineRevenue = 0;
    let posOrderCount = 0;
    let onlineOrderCount = 0;
    let netProfit = 0;
    const salesMap: Record<string, { name: string; totalQty: number; totalRevenue: number }> = {};
    const paymentBreakdown: Record<string, { count: number; revenue: number }> = {};
    const monthlyRevenue: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthlyRevenue[d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })] = 0;
    }

    for (const order of orders) {
      const isPos = order.address === 'In-Store' || order.customerName === 'POS Walk-in';
      totalRevenue += order.totalPrice;
      if (isPos) { posRevenue += order.totalPrice; posOrderCount++; }
      else { onlineRevenue += order.totalPrice; onlineOrderCount++; }

      // Payment breakdown
      const method = order.paymentMethod || 'Unknown';
      if (!paymentBreakdown[method]) paymentBreakdown[method] = { count: 0, revenue: 0 };
      paymentBreakdown[method].count += 1;
      paymentBreakdown[method].revenue += order.totalPrice;

      // Monthly revenue
      const monthKey = new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (monthKey in monthlyRevenue) monthlyRevenue[monthKey] += order.totalPrice;

      // Items: net profit + top-selling
      const items = (order.items as unknown as OrderItem[]) || [];
      for (const item of items) {
        const costKey = item.name?.toLowerCase() || '';
        const costPrice = costPriceMap.get(costKey) ?? 0;
        netProfit += (item.price - costPrice) * item.quantity;

        if (!salesMap[item.name]) salesMap[item.name] = { name: item.name, totalQty: 0, totalRevenue: 0 };
        salesMap[item.name].totalQty += item.quantity;
        salesMap[item.name].totalRevenue += item.price * item.quantity;
      }
    }

    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // ── Recent Transactions (latest 20) ──
    const recentOrders = recentOrdersRaw.map((o) => ({
      orderId: o.orderId,
      date: o.date,
      customerName: o.customerName,
      paymentMethod: o.paymentMethod || 'N/A',
      totalPrice: o.totalPrice,
      status: o.status,
      isPos: o.address === 'In-Store' || o.customerName === 'POS Walk-in',
    }));

    const topSelling = Object.values(salesMap)
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 10);

    // ── Collection Performance (single pass over products) ──
    const collectionMap: Record<string, { name: string; productCount: number; estimatedSales: number }> = {};
    for (const p of products) {
      const col = p.collection || p.category || 'Uncategorized';
      if (!collectionMap[col]) collectionMap[col] = { name: col, productCount: 0, estimatedSales: 0 };
      collectionMap[col].productCount += 1;
      const sold = salesMap[p.name];
      if (sold) collectionMap[col].estimatedSales += sold.totalRevenue;
    }
    const collectionPerformance = Object.values(collectionMap)
      .sort((a, b) => b.estimatedSales - a.estimatedSales)
      .slice(0, 8);

    // ── Inventory: Low Stock ──
    const lowStockProducts = products
      .filter((p) => typeof p.stock === 'number' && p.stock < 10)
      .map((p) => ({ id: p.id, name: p.name, image: p.images?.[0] || '/images/product-placeholder.png', stock: p.stock ?? 0, kind: 'perfume' as const }));
    const lowStockGiftSets = giftSets
      .filter((g) => typeof g.stock === 'number' && g.stock < 10)
      .map((g) => ({ id: g.id, name: g.name, image: g.image || '/images/product-placeholder.png', stock: g.stock ?? 0, kind: 'gift-set' as const }));
    const lowStockItems = [...lowStockProducts, ...lowStockGiftSets].sort((a, b) => a.stock - b.stock);

    return NextResponse.json({
      success: true,
      metrics: {
        totalRevenue,
        netProfit,
        totalOrders,
        posRevenue,
        onlineRevenue,
        posOrderCount,
        onlineOrderCount,
        avgOrderValue,
        totalProducts: products.length,
        totalGiftSets: giftSets.length,
      },
      recentOrders,
      topSelling,
      collectionPerformance,
      lowStockItems,
      paymentBreakdown,
      monthlyRevenue,
    });
  } catch (err) {
    console.error('ANALYTICS API ERROR:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
