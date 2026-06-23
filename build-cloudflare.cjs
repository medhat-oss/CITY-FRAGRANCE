/* eslint-disable */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function main() {
  // Step 1: Clean previous builds
  for (const d of ['.next', '.open-next']) {
    if (fs.existsSync(d)) fs.rmSync(d, { recursive: true, force: true });
  }

  // Step 2: Build Next.js app (use webpack for proper edge entry points)
  console.log('\n=== Building Next.js ===');
  // Prevent Next.js from attempting static generation of API routes that use Prisma
  // (Prisma WASM engine fails to load during build on Windows).
  process.env.NEXT_DISABLE_STATIC_GENERATION = '1';
  execSync('npx next build', { stdio: 'inherit' });

  // Step 2b: Regenerate Prisma client for Edge/WASM compatibility
  console.log('\n=== Regenerating Prisma client ===');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // Step 2c: Ensure standalone output exists (Windows EBUSY workaround)
  console.log('\n=== Ensuring standalone output ===');
  const standaloneRoot = '.next/standalone/.next';
  if (!fs.existsSync(standaloneRoot)) {
    fs.mkdirSync(path.join(standaloneRoot, 'server'), { recursive: true });
    // Root manifests
    for (const f of ['BUILD_ID', 'required-server-files.json', 'prerender-manifest.json', 'routes-manifest.json', 'images-manifest.json', 'build-manifest.json', 'app-path-routes-manifest.json', 'fallback-build-manifest.json']) {
      const src = path.join('.next', f);
      if (fs.existsSync(src)) fs.cpSync(src, path.join(standaloneRoot, f), { force: true });
    }
    // Copy entire server/ directory (all routes, chunks, manifests, etc.)
    if (fs.existsSync('.next/server')) {
      fs.cpSync('.next/server', path.join(standaloneRoot, 'server'), { recursive: true, force: true });
    }
    console.log('  ✓ Standalone output created');
  } else {
    console.log('  ✓ Standalone output exists');
  }

  // Step 3: Build OpenNext Cloudflare bundle
  console.log('\n=== Building OpenNext Cloudflare bundle ===');
  execSync('npx opennextjs-cloudflare build --skipNextBuild -c wrangler.toml', { stdio: 'inherit' });

  // Step 3b: Copy all manifest files (Windows workaround for OpenNext omissions)
  console.log('\n=== Copying manifest files ===');
  const targetRootDir = '.open-next/server-functions/default/.next';
  const targetServerDir = path.join(targetRootDir, 'server');
  // Helper: copy source to dest, log result
  function copyManifest(src, dst, label) {
    if (!fs.existsSync(src)) { console.log(`  ✗ ${label} (source not found)`); return false; }
    if (fs.existsSync(dst)) { console.log(`  • ${label} (already exists)`); return true; }
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
    console.log(`  ✓ ${label}`);
    return true;
  }
  // Helper: copy entire dir recursively
  function copyDir(src, dst, label) {
    if (!fs.existsSync(src)) { console.log(`  ✗ ${label} (source not found)`); return; }
    if (fs.existsSync(dst)) { console.log(`  • ${label} (already exists)`); return; }
    fs.cpSync(src, dst, { recursive: true, force: true });
    let count = 0;
    try { count = fs.readdirSync(dst, { recursive: true }).length; } catch { /* ignore */ }
    console.log(`  ✓ ${label} (${count} items)`);
  }
  // ── Root-level manifests (loaded as /.next/<file>) ──
  const rootManifests = [
    'BUILD_ID',
    'prerender-manifest.json',
    'routes-manifest.json',
    'images-manifest.json',
    'build-manifest.json',
    'required-server-files.json',
    'app-path-routes-manifest.json',
    'fallback-build-manifest.json',
    'dynamic-css-manifest.json',
    'export-marker.json',
  ];
  for (const file of rootManifests) {
    copyManifest(path.join('.next', file), path.join(targetRootDir, file), `.next/${file}`);
  }
  // required-server-files.js (loaded via eval by Next.js)
  copyManifest(path.join('.next', 'required-server-files.js'), path.join(targetRootDir, 'required-server-files.js'), '.next/required-server-files.js');
  // ── Server subdirectory manifests (loaded as /.next/server/<file>) ──
  const serverManifests = [
    'app-paths-manifest.json',
    'pages-manifest.json',
    'middleware-manifest.json',
    'middleware-build-manifest.js',
    'next-font-manifest.js',
    'next-font-manifest.json',
    'server-reference-manifest.js',
    'server-reference-manifest.json',
    'interception-route-rewrite-manifest.js',
    'functions-config-manifest.json',
    'prefetch-hints.json',
    'subresource-integrity-manifest.json',
  ];
  for (const file of serverManifests) {
    copyManifest(path.join('.next/server', file), path.join(targetServerDir, file), `server/${file}`);
  }
  // ── Edge function directory (if any) ──
  copyDir('.next/server/edge', path.join(targetServerDir, 'edge'), 'server/edge/');

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

  // Step 5: Post-build patch — inline manifest JSON files for direct require() calls
  console.log('\n=== Patching handler.mjs to inline manifest JSON files ===');
  const handlerPath = '.open-next/server-functions/default/handler.mjs';
  if (fs.existsSync(handlerPath)) {
    let handlerContent = fs.readFileSync(handlerPath, 'utf-8');

    // The Next.js server's getMiddlewareManifest() uses global require() directly
    // (NOT through __require or loadManifest, which are scoped differently).
    // We must inline the JSON content directly at the call site.
    const manifestJsonPath = '.open-next/server-functions/default/.next/server/middleware-manifest.json';
    if (fs.existsSync(manifestJsonPath)) {
      const manifestContent = JSON.stringify(JSON.parse(fs.readFileSync(manifestJsonPath, 'utf-8')));
      const oldCall = 'require(this.middlewareManifestPath)';
      const newCall = '(' + manifestContent + ')';
      const replaceCount = handlerContent.split(oldCall).length - 1;
      if (replaceCount > 0) {
        handlerContent = handlerContent.split(oldCall).join(newCall);
        console.log(`  ✓ Inlined ${replaceCount} instance(s) of require(this.middlewareManifestPath)`);
      } else {
        console.log('  ✗ Target pattern require(this.middlewareManifestPath) not found in handler.mjs');
      }
    } else {
      console.log('  ✗ middleware-manifest.json not found at ' + manifestJsonPath);
    }

    fs.writeFileSync(handlerPath, handlerContent, 'utf-8');
  } else {
    console.log('  ✗ handler.mjs not found');
  }

  console.log('\n✅ Build complete!');
}

main().catch(e => { console.error(e); process.exit(1); });
