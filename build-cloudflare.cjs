/* eslint-disable */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function main() {
  // Step 1: Clean previous builds
  for (const d of ['.next', '.open-next']) {
    if (fs.existsSync(d)) fs.rmSync(d, { recursive: true, force: true });
  }

  // Step 2: Build Next.js app
  console.log('\n=== Building Next.js ===');
  execSync('npx next build', { stdio: 'inherit' });

  // Step 2b: Ensure standalone output exists (Windows EBUSY workaround)
  console.log('\n=== Ensuring standalone output ===');
  const standaloneDir = '.next/standalone/.next';
  if (!fs.existsSync(standaloneDir)) {
    fs.mkdirSync(path.join(standaloneDir, 'server'), { recursive: true });
    // Copy required files for OpenNext
    const entries = [
      ['BUILD_ID',                  '.next/BUILD_ID'],
      ['required-server-files.json','.next/required-server-files.json'],
      ['server/app-paths-manifest.json', '.next/server/app-paths-manifest.json'],
    ];
    for (const [dest, src] of entries) {
      const dstPath = path.join(standaloneDir, dest);
      if (!fs.existsSync(dstPath) && fs.existsSync(src)) {
        fs.mkdirSync(path.dirname(dstPath), { recursive: true });
        fs.copyFileSync(src, dstPath);
      }
    }
    // Create empty manifests that OpenNext expects
    for (const m of ['server/pages-manifest.json', 'server/middleware-manifest.json', 'server/middleware-build-manifest.js']) {
      const mp = path.join(standaloneDir, m);
      if (!fs.existsSync(mp)) {
        fs.mkdirSync(path.dirname(mp), { recursive: true });
        fs.writeFileSync(mp, m.endsWith('.js') ? 'module.exports={}' : '{}');
      }
    }
    console.log('  ✓ Standalone output created');
  } else {
    console.log('  ✓ Standalone output exists');
  }

  // Step 3: Build OpenNext Cloudflare bundle
  console.log('\n=== Building OpenNext Cloudflare bundle ===');
  execSync('npx opennextjs-cloudflare build --skipNextBuild -c wrangler.toml', { stdio: 'inherit' });

  // Step 4: Copy packages not traced by OpenNext
  console.log('\n=== Copying missing packages ===');
  const deployNM = '.open-next/server-functions/default/node_modules';
  const missingDirs = [
    ['node_modules/@prisma/client',            path.join(deployNM, '@prisma', 'client')],
    ['node_modules/@prisma/adapter-neon',       path.join(deployNM, '@prisma', 'adapter-neon')],
    ['node_modules/.prisma/client',             path.join(deployNM, '.prisma', 'client')],
    ['node_modules/@neondatabase/serverless',   path.join(deployNM, '@neondatabase', 'serverless')],
    ['node_modules/bcryptjs',                   path.join(deployNM, 'bcryptjs')],
    ['node_modules/jose',                       path.join(deployNM, 'jose')],
  ];
  for (const [src, dst] of missingDirs) {
    if (fs.existsSync(src)) {
      if (fs.existsSync(dst)) fs.rmSync(dst, { recursive: true, force: true });
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.cpSync(src, dst, { recursive: true, force: true });
      const count = fs.readdirSync(dst, { recursive: true }).length;
      console.log(`  ✓ ${path.basename(src)} (${count} files)`);
    } else {
      console.log(`  ✗ ${src} not found`);
    }
  }

  // Step 5: Create deployment dist
  console.log('\n=== Creating dist/ ===');
  fs.mkdirSync('.open-next/dist', { recursive: true });
  for (const p of ['assets', 'server-functions', 'cloudflare', 'middleware', '.build']) {
    const src = path.join('.open-next', p);
    if (fs.existsSync(src)) {
      const dst = path.join('.open-next/dist', p);
      fs.cpSync(src, dst, { recursive: true, dereference: true });
    }
  }
  if (fs.existsSync('.open-next/worker.js')) {
    fs.copyFileSync('.open-next/worker.js', '.open-next/dist/_worker.js');
  }
  console.log('\n✅ Build complete!');
}

main().catch(e => { console.error(e); process.exit(1); });
