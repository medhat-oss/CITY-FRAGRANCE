import { SignJWT } from 'jose';
import type { BrowserContext } from '@playwright/test';

export const ADMIN_COOKIE = 'admin_session';
export const CASHIER_COOKIE = 'cashier_session';

export async function createTestAdminToken(): Promise<string> {
  const secretStr = process.env.JWT_SECRET || 'city_fragrance_jwt_secret_dev_key_fallback';
  const secret = new TextEncoder().encode(secretStr);
  return await new SignJWT({
    id: 'test-admin-id',
    email: 'admin@cityfragrance.com',
    username: 'admin',
    role: 'ADMIN',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secret);
}

export async function createTestCashierToken(): Promise<string> {
  const secretStr = process.env.JWT_SECRET || 'city_fragrance_jwt_secret_dev_key_fallback';
  const secret = new TextEncoder().encode(secretStr);
  return await new SignJWT({
    id: 'test-cashier-id',
    email: 'cashier@cityfragrance.com',
    username: 'cashier',
    role: 'CASHIER',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secret);
}

export async function setupAdminSession(context: BrowserContext, baseURL?: string): Promise<string> {
  const token = await createTestAdminToken();
  await context.addCookies([
    {
      name: ADMIN_COOKIE,
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
  return token;
}

export async function setupCashierSession(context: BrowserContext, baseURL?: string): Promise<string> {
  const token = await createTestCashierToken();
  await context.addCookies([
    {
      name: CASHIER_COOKIE,
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
  return token;
}
