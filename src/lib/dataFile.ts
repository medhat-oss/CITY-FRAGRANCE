import { promises as fs } from 'fs';
import path from 'path';

const isVercel = process.env.VERCEL === '1';
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

function getLocalDir(): string {
  return isVercel ? '/tmp' : path.join(process.cwd(), 'data');
}

function getSourceDir(): string {
  return path.join(process.cwd(), 'data');
}

async function readLocalFile(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
}

async function readCloudinary(filename: string): Promise<string | null> {
  if (!cloudName) return null;
  const url = `https://res.cloudinary.com/${cloudName}/raw/upload/city-fragrance-data/${filename}`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function readJsonFile<T>(filename: string, fallback: T): Promise<T> {
  // 1. Try local writable path (/tmp on Vercel, data/ on local)
  const localPath = path.join(getLocalDir(), filename);
  let raw = await readLocalFile(localPath);
  if (raw) {
    try { return JSON.parse(raw); } catch { /* fall through */ }
  }

  // 2. Try Cloudinary
  raw = await readCloudinary(filename);
  if (raw) {
    // Cache in local path for next read
    try { await fs.writeFile(localPath, raw, 'utf-8'); } catch { /* ignore */ }
    try { return JSON.parse(raw); } catch { /* fall through */ }
  }

  // 3. Try read-only source (build folder)
  raw = await readLocalFile(path.join(getSourceDir(), filename));
  if (raw) {
    try { return JSON.parse(raw); } catch { /* fall through */ }
  }

  return fallback;
}

export async function writeJsonFile(filename: string, data: unknown): Promise<void> {
  const content = JSON.stringify(data, null, 2);

  // Write locally — this is fast (disk I/O only)
  const localPath = path.join(getLocalDir(), filename);
  try {
    await fs.writeFile(localPath, content, 'utf-8');
  } catch (err) {
    console.error(`LOCAL WRITE ERROR (${filename}):`, err);
  }
}
