import { promises as fs } from 'fs';
import path from 'path';

const isVercel = process.env.VERCEL === '1';

async function ensureTmpFile(filename: string): Promise<string> {
  const sourceDir = path.join(process.cwd(), 'data');
  const tmpPath = path.join('/tmp', filename);

  try {
    await fs.access(tmpPath);
  } catch {
    try {
      const data = await fs.readFile(path.join(sourceDir, filename), 'utf-8');
      await fs.writeFile(tmpPath, data, 'utf-8');
    } catch {
      // source doesn't exist or is unreadable — will return fallback
    }
  }

  return tmpPath;
}

export async function getDataPath(filename: string): Promise<string> {
  if (!isVercel) {
    return path.join(process.cwd(), 'data', filename);
  }
  return ensureTmpFile(filename);
}

export async function readJsonFile<T>(filename: string, fallback: T): Promise<T> {
  const filePath = await getDataPath(filename);
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export async function writeJsonFile(filename: string, data: unknown): Promise<void> {
  const filePath = await getDataPath(filename);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}
