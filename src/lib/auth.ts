import { NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'city-fragrance-dev-secret-key-change-in-production');
export const ADMIN_COOKIE = 'admin_session';
export const CASHIER_COOKIE = 'cashier_session';

export interface SessionPayload {
  id: string;
  email: string;
  username: string;
  role: string;
}

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 8 * 60 * 60, // 8 hours — matches JWT expiry
};

export async function createSession(payload: SessionPayload): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(SECRET);
  return token;
}

export async function verifySession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();

  // ── Try admin_session first ──────────────────────────────────────────────
  // IMPORTANT: use a separate try/catch per cookie so that an expired or
  // tampered admin_session cookie does NOT silently block the cashier_session
  // from being verified (the original bug: one jwtVerify failure returned null
  // without ever attempting the second cookie).
  const adminToken = cookieStore.get(ADMIN_COOKIE)?.value;
  if (adminToken) {
    try {
      const { payload } = await jwtVerify(adminToken, SECRET);
      return payload as unknown as SessionPayload;
    } catch {
      // Admin token expired / invalid → fall through and try cashier token
    }
  }

  // ── Try cashier_session as fallback ─────────────────────────────────────
  const cashierToken = cookieStore.get(CASHIER_COOKIE)?.value;
  if (cashierToken) {
    try {
      const { payload } = await jwtVerify(cashierToken, SECRET);
      return payload as unknown as SessionPayload;
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Verify session for POS/cashier operations.
 * Tries the cashier_session cookie FIRST, so a cashier logged into the POS
 * is never overridden by an admin_session cookie from another tab.
 * Falls back to verifySession() (admin-preferred) when no cashier cookie exists.
 */
export async function verifySessionForPOS(): Promise<SessionPayload | null> {
  // 1. Check cashier_session FIRST (POS operations belong to the cashier, not the admin)
  const cashierSession = await verifyCashierSession();
  if (cashierSession) {
    return cashierSession;
  }

  // 2. Fall back to verifySession() (admin_session preferred, then cashier_session)
  return verifySession();
}

/** Verify only the cashier session cookie (for cashier-specific flows) */
export async function verifyCashierSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CASHIER_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/** Clears only the admin session cookie — does NOT touch the cashier session */
export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, '', { ...cookieOptions, maxAge: 0 });
}

/** Clears only the cashier session cookie — does NOT touch the admin session */
export async function clearCashierSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(CASHIER_COOKIE, '', { ...cookieOptions, maxAge: 0 });
}

/** Clears BOTH session cookies (full sign-out). Prefer the targeted variants above. */
export async function clearSession(): Promise<void> {
  await clearAdminSession();
  await clearCashierSession();
}

/** Set the admin session cookie on a response */
export function setAdminCookie(response: ReturnType<typeof NextResponse.json>, token: string) {
  response.cookies.set(ADMIN_COOKIE, token, cookieOptions);
}

/** Set the cashier session cookie on a response */
export function setCashierCookie(response: ReturnType<typeof NextResponse.json>, token: string) {
  response.cookies.set(CASHIER_COOKIE, token, cookieOptions);
}

