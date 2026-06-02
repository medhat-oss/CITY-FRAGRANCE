import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readJsonFile } from '@/lib/dataFile';

interface OrderItem {
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

    // ── Fetch products & gift sets from JSON ──
    const products = await readJsonFile<ProductData[]>('products.json', []);
    const giftSets = await readJsonFile<GiftSetData[]>('gift-sets.json', []);

    // ── Financial Aggregation ──
    const orders = activeOrders;
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalPrice, 0);
    const totalOrders = orders.length;

    // POS vs Online split
    const posOrders = orders.filter(
      (o) => o.address === 'In-Store' || o.customerName === 'POS Walk-in'
    );
    const onlineOrders = orders.filter(
      (o) => o.address !== 'In-Store' && o.customerName !== 'POS Walk-in'
    );
    const posRevenue = posOrders.reduce((sum, o) => sum + o.totalPrice, 0);
    const onlineRevenue = onlineOrders.reduce((sum, o) => sum + o.totalPrice, 0);

    // Average order value
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

    // ── Top Selling Products ──
    const salesMap: Record<string, { name: string; totalQty: number; totalRevenue: number }> = {};

    for (const order of orders) {
      const items = (order.items as unknown as OrderItem[]) || [];
      for (const item of items) {
        if (!salesMap[item.name]) {
          salesMap[item.name] = { name: item.name, totalQty: 0, totalRevenue: 0 };
        }
        salesMap[item.name].totalQty += item.quantity;
        salesMap[item.name].totalRevenue += item.price * item.quantity;
      }
    }

    const topSelling = Object.values(salesMap)
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 10);

    // ── Collection Performance ──
    const collectionMap: Record<string, { name: string; productCount: number; estimatedSales: number }> = {};

    for (const p of products) {
      const col = p.collection || p.category || 'Uncategorized';
      if (!collectionMap[col]) {
        collectionMap[col] = { name: col, productCount: 0, estimatedSales: 0 };
      }
      collectionMap[col].productCount += 1;
      // Find sales for this product
      const sold = salesMap[p.name];
      if (sold) {
        collectionMap[col].estimatedSales += sold.totalRevenue;
      }
    }

    const collectionPerformance = Object.values(collectionMap)
      .sort((a, b) => b.estimatedSales - a.estimatedSales)
      .slice(0, 8);

    // ── Inventory: Low Stock ──
    // Products that have a stock field and stock < 10
    const lowStockProducts = products
      .filter((p) => typeof p.stock === 'number' && p.stock < 10)
      .map((p) => ({
        id: p.id,
        name: p.name,
        image: p.images?.[0] || '/images/product-placeholder.png',
        stock: p.stock ?? 0,
        kind: 'perfume' as const,
      }));

    const lowStockGiftSets = giftSets
      .filter((g) => typeof g.stock === 'number' && g.stock < 10)
      .map((g) => ({
        id: g.id,
        name: g.name,
        image: g.image || '/images/product-placeholder.png',
        stock: g.stock ?? 0,
        kind: 'gift-set' as const,
      }));

    const lowStockItems = [...lowStockProducts, ...lowStockGiftSets].sort(
      (a, b) => a.stock - b.stock
    );

    // ── Payment Method Breakdown ──
    const paymentBreakdown: Record<string, { count: number; revenue: number }> = {};
    for (const order of orders) {
      const method = order.paymentMethod || 'Unknown';
      if (!paymentBreakdown[method]) {
        paymentBreakdown[method] = { count: 0, revenue: 0 };
      }
      paymentBreakdown[method].count += 1;
      paymentBreakdown[method].revenue += order.totalPrice;
    }

    // ── Monthly Revenue (last 6 months) ──
    const monthlyRevenue: Record<string, number> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      monthlyRevenue[key] = 0;
    }
    for (const order of orders) {
      const d = new Date(order.createdAt);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (key in monthlyRevenue) {
        monthlyRevenue[key] += order.totalPrice;
      }
    }

    return NextResponse.json({
      success: true,
      metrics: {
        totalRevenue,
        totalOrders,
        posRevenue,
        onlineRevenue,
        posOrderCount: posOrders.length,
        onlineOrderCount: onlineOrders.length,
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
