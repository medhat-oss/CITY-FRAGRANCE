import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const workspaceDir = 'd:/city-fragrance-next';

function deleteFolderRecursive(directoryPath) {
  if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file) => {
      const curPath = path.join(directoryPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        try {
          fs.unlinkSync(curPath);
        } catch (err) {
          console.warn(`Could not delete file ${curPath}: ${err.message}`);
        }
      }
    });
    try {
      fs.rmdirSync(directoryPath);
    } catch (err) {
      console.warn(`Could not delete directory ${directoryPath}: ${err.message}`);
    }
  }
}

async function main() {
  console.log('--- STARTING PRISMA HARD RESET ---');

  // 1. Terminate other node processes on Windows
  if (process.platform === 'win32') {
    console.log('Checking for other running node processes...');
    try {
      // Find all running node processes except the current one
      const currentPid = process.pid;
      const output = execSync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV /NH').toString();
      const lines = output.trim().split('\n');
      let killedCount = 0;
      
      for (const line of lines) {
        const parts = line.split(',');
        if (parts.length > 1) {
          const name = parts[0].replace(/"/g, '');
          const pidStr = parts[1].replace(/"/g, '');
          const pid = parseInt(pidStr, 10);
          
          if (name === 'node.exe' && pid !== currentPid) {
            console.log(`Killing background Node process (PID: ${pid})...`);
            try {
              execSync(`taskkill /F /PID ${pid}`);
              killedCount++;
            } catch (e) {
              // Ignore if already terminated
            }
          }
        }
      }
      if (killedCount > 0) {
        console.log(`Successfully terminated ${killedCount} background Node process(es).`);
      } else {
        console.log('No background Node processes found.');
      }
    } catch (err) {
      console.warn('Could not list/kill node processes:', err.message);
    }
  }

  // 2. Delete the .next compilation cache folder
  const nextDir = path.join(workspaceDir, '.next');
  if (fs.existsSync(nextDir)) {
    console.log('Wiping .next directory...');
    deleteFolderRecursive(nextDir);
    console.log('.next directory cleared.');
  }

  // 3. Delete generated prisma clients in node_modules
  const dotPrisma = path.join(workspaceDir, 'node_modules/.prisma');
  const prismaClient = path.join(workspaceDir, 'node_modules/@prisma/client');

  if (fs.existsSync(dotPrisma)) {
    console.log('Wiping node_modules/.prisma...');
    deleteFolderRecursive(dotPrisma);
  }
  if (fs.existsSync(prismaClient)) {
    console.log('Wiping node_modules/@prisma/client...');
    deleteFolderRecursive(prismaClient);
  }

  // 4. Clean npm cache if needed (optional, skipped to save time unless requested)

  // 5. Run npm install to restore packages and trigger postinstall (which generates Prisma client)
  console.log('Running npm install...');
  try {
    execSync('npm install', { cwd: workspaceDir, stdio: 'inherit' });
    console.log('Packages restored and Prisma Client generated successfully.');
  } catch (err) {
    console.error('Failed to run npm install:', err.message);
    process.exit(1);
  }

  // 6. Re-run prisma db push (optional, ensures schema matches DB)
  console.log('Running prisma db push...');
  try {
    execSync('npx prisma db push', { cwd: workspaceDir, stdio: 'inherit' });
    console.log('Database schema synchronized successfully.');
  } catch (err) {
    console.error('Failed to run prisma db push:', err.message);
    process.exit(1);
  }

  console.log('--- PRISMA HARD RESET COMPLETE ---');
  console.log('Please restart your Next.js dev server now.');
}

main().catch((err) => {
  console.error('Hard reset failed:', err);
  process.exit(1);
});
