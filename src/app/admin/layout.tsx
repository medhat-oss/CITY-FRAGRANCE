import { verifySession, clearAdminSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const session = await verifySession();

  if (!session || session.role !== 'ADMIN') {
    // Session cookie may be stale/deleted — send to login
    redirect('/admin/login');
  }

  // Verify the user still exists in the database (survives prisma db push resets).
  // If the user was wiped, clear the stale cookie and redirect to login.
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true, role: true },
    });
    if (!user || user.role !== 'ADMIN') {
      await clearAdminSession();
      redirect('/admin/login');
    }
  } catch {
    // DB unreachable — still allow access (the User table may be fine;
    // individual page API calls will surface connection issues)
  }

  return <>{children}</>;
}
