import { prisma } from "@/lib/prisma";
import Link from "next/link";

interface PageProps {
  params: Promise<{
    id: string;
    shiftId: string;
  }>;
}

export default async function ShiftOrdersPage(props: PageProps) {
  try {
    // 1. Safe Params Resolution
    const resolvedParams = await props.params;
    if (!resolvedParams || !resolvedParams.id || !resolvedParams.shiftId) {
      return <div className="text-amber-500 p-8 bg-[#040814]">خطأ في قراءة الرابط المعرف.</div>;
    }

    const staffId = resolvedParams.id;
    const shiftId = resolvedParams.shiftId;

    // 2. Safe Prisma Fetching with absolute fallback
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        orders: true,
      },
    });

    // 3. Guard against non-existent Shift
    if (!shift) {
      return (
        <div className="p-8 bg-[#040814] text-slate-300 min-h-screen">
          <Link href={`/admin/staff/${staffId}/shifts`} className="text-amber-500 mb-4 inline-block">← العودة</Link>
          <p className="bg-[#09142E] p-4 border border-red-500/30 rounded text-red-400">
            عذراً، لم يتم العثور على هذا الشيفت في قاعدة البيانات (ID: {shiftId})
          </p>
        </div>
      );
    }

    // 4. Safe variable declaration with fallbacks
    const employeeName = (shift as any).user?.name || shift.cashierName || "موظف غير معروف";
    const expectedTotal = shift.expectedTotal ?? 0;
    const ordersList = (shift as any).orders || [];

    return (
      <div className="p-6 bg-[#040814] min-h-screen text-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href={`/admin/staff/${staffId}/shifts`} className="text-amber-500 hover:underline text-sm flex items-center gap-1 mb-2">
              ← العودة لتاريخ الشفتات
            </Link>
            <h1 className="text-xl font-bold text-white">إدارة طلبات الشيفت — {employeeName}</h1>
            <p className="text-xs text-slate-400 mt-1 font-mono">Shift ID: {shift.id}</p>
          </div>
          
          <div className="bg-[#09142E] border border-amber-500/20 p-3 rounded-lg text-right">
            <span className="text-xs text-slate-400 block">إجمالي مبيعات الشيفت</span>
            <span className="text-lg font-bold text-amber-400">EGP {expectedTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Orders Table with Empty State Check */}
        <div className="bg-[#09142E]/50 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#09142E] text-slate-300 text-xs border-b border-slate-800">
                <th className="p-4">رقم الطلب</th>
                <th className="p-4">العميل</th>
                <th className="p-4">الهاتف</th>
                <th className="p-4">المنتجات</th>
                <th className="p-4">الوقت</th>
                <th className="p-4">الحالة</th>
                <th className="p-4 text-right">المبلغ</th>
                <th className="p-4">وسيلة الدفع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {ordersList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    لا توجد أي طلبات مسجلة لهذا الشيفت حتى الآن.
                  </td>
                </tr>
              ) : (
                ordersList.map((order: any) => {
                  const items: Array<{ name: string; quantity: number; price: number }> =
                    Array.isArray(order.items) ? order.items : [];
                  return (
                    <tr key={order.id} className="hover:bg-[#09142E]/30 transition-colors">
                      <td className="p-4 font-mono text-xs text-slate-400">#{String(order.orderId || order.id).slice(-8)}</td>
                      <td className="p-4 text-xs text-slate-200">{order.customerName || "—"}</td>
                      <td className="p-4 text-xs text-slate-400">{order.phoneNumber || "—"}</td>
                      <td className="p-4 text-xs text-slate-300 max-w-[200px]">
                        {items.length > 0 ? (
                          <ul className="m-0 p-0 list-none space-y-1">
                            {items.map((it, i) => (
                              <li key={i} className="truncate">
                                <span className="text-slate-100">{it.name}</span>
                                <span className="text-slate-500"> x{it.quantity}</span>
                                <span className="text-amber-400/70 ml-1">({(it.price * it.quantity).toFixed(0)} EGP)</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-slate-600 italic">—</span>
                        )}
                      </td>
                      <td className="p-4 text-xs text-slate-300 whitespace-nowrap">
                        {order.createdAt ? new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : "—"}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>
                          {order.status || "PENDING"}
                        </span>
                      </td>
                      <td className="p-4 text-right font-medium text-amber-400 whitespace-nowrap">
                        EGP {(order.totalPrice ?? 0).toFixed(2)}
                      </td>
                      <td className="p-4 text-xs text-slate-400">{order.paymentMethod || "—"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );

  } catch (error) {
    console.error("Shift Orders Page Critical Error:", error);
    return (
      <div className="p-8 bg-[#040814] text-slate-300 min-h-screen">
        <h1 className="text-red-400 text-lg font-bold mb-2">حدث خطأ داخلي في السيرفر (Catch Block)</h1>
        <p className="text-xs text-slate-400 font-mono bg-black/40 p-4 rounded border border-slate-800">
          {error instanceof Error ? error.message : "Unknown database or rendering error"}
        </p>
      </div>
    );
  }
}
