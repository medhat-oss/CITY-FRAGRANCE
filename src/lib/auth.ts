import { NextResponse } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

let _secret: Uint8Array | null = null;
function getSecret(): Uint8Array {
  if (!_secret) {
    if (!process.env.JWT_SECRET) {
      throw new Error('FATAL: JWT_SECRET environment variable is not set. Refusing to start with an insecure default.');
    }
    _secret = new TextEncoder().encode(process.env.JWT_SECRET);
  }
  return _secret;
}
const ADMIN_COOKIE = 'admin_session';
export const CASHIER_COOKIE = 'cashier_session';

interface SessionPayload {
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
    .sign(getSecret());
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
      const { payload } = await jwtVerify(adminToken, getSecret());
      return payload as unknown as SessionPayload;
    } catch {
      // Admin token expired / invalid → fall through and try cashier token
    }
  }

  // ── Try cashier_session as fallback ─────────────────────────────────────
  const cashierToken = cookieStore.get(CASHIER_COOKIE)?.value;
  if (cashierToken) {
    try {
      const { payload } = await jwtVerify(cashierToken, getSecret());
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
async function verifyCashierSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(CASHIER_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
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

/** Set the admin session cookie on a response */
export function setAdminCookie(response: ReturnType<typeof NextResponse.json>, token: string) {
  response.cookies.set(ADMIN_COOKIE, token, cookieOptions);
}

/** Set the cashier session cookie on a response */
export function setCashierCookie(response: ReturnType<typeof NextResponse.json>, token: string) {
  response.cookies.set(CASHIER_COOKIE, token, cookieOptions);
}

/**
 * Guard: require a valid session (any role).
 * Returns the session payload, or a 401 NextResponse.
 */
export async function requireAuth(): Promise<SessionPayload | NextResponse> {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  return session;
}

/**
 * Guard: require a valid admin session.
 * Returns the session payload, or a 401/403 NextResponse.
 */
export async function requireAdmin(): Promise<SessionPayload | NextResponse> {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  if (session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }
  return session;
}
