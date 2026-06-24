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
  execSync('npx opennextjs-cloudflare build -c wrangler.jsonc', { stdio: 'inherit' });

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

  // Step 5: Copy middleware-manifest.json into deployment (for runtime access)
  try {
    console.log('\n=== Copying middleware manifest ===');
    const srcManifest = '.next/server/middleware-manifest.json';
    const dstManifest = '.open-next/server-functions/default/.next/server/middleware-manifest.json';
    copyManifest(srcManifest, dstManifest, 'middleware-manifest.json');
    const srcBuildManifest = '.next/server/middleware-build-manifest.js';
    const dstBuildManifest = '.open-next/server-functions/default/.next/server/middleware-build-manifest.js';
    copyManifest(srcBuildManifest, dstBuildManifest, 'middleware-build-manifest.js');
  } catch (manifestErr) {
    console.log('  • middleware manifest copy skipped: ' + manifestErr.message);
  }

  // Step 6: Patch handler.mjs — remove broken Prisma WASM imports (mangled Windows paths)
  console.log('\n=== Patching handler.mjs — fixing WASM imports ===');
  const handlerFile = '.open-next/server-functions/default/handler.mjs';
  if (fs.existsSync(handlerFile)) {
    let handlerContent = fs.readFileSync(handlerFile, 'utf-8');
    // Replace import("D:...query_compiler_fast_bg.wasm") with Promise.resolve({default:null})
    // These are Turbopack WASM chunk references for Prisma's internal query compiler,
    // which is never invoked at runtime when using the Neon adapter.
    const wasmImportRegex = /await import\("D:[^"]*query_compiler_fast_bg\.wasm"\)/g;
    const matches = handlerContent.match(wasmImportRegex);
    if (matches) {
      handlerContent = handlerContent.replace(wasmImportRegex, '({default:null})');
      fs.writeFileSync(handlerFile, handlerContent, 'utf-8');
      console.log(`  ✓ Patched ${matches.length} WASM import(s)`);
    } else {
      console.log('  • No WASM imports to patch');
    }
  } else {
    console.log('  ✗ handler.mjs not found');
  }

  // Step 7: Patch middleware/handler.mjs — lazy-init instead of top-level await
  // (top-level await fails at module evaluation in Pages bundled Worker)
  console.log('\n=== Patching middleware/handler.mjs — lazy init ===');
  const mwHandler = '.open-next/middleware/handler.mjs';
  if (fs.existsSync(mwHandler)) {
    let mw = fs.readFileSync(mwHandler, 'utf-8');
    // Replace `var handler2 = await createGenericHandler({...});` with lazy init
    const oldInit = `var handler2 = await createGenericHandler({
  handler: defaultHandler,
  type: "middleware"
});`;
    const newInit = `var handlerPromise;
var handler2 = async (...args) => {
  if (!handlerPromise) handlerPromise = createGenericHandler({ handler: defaultHandler, type: "middleware" });
  return (await handlerPromise)(...args);
};`;
    if (mw.includes(oldInit)) {
      mw = mw.replace(oldInit, newInit);
      fs.writeFileSync(mwHandler, mw, 'utf-8');
      console.log('  ✓ Patched middleware/handler.mjs — lazy init');
    } else {
      console.log('  • Pattern not found in middleware handler');
    }
  } else {
    console.log('  ✗ middleware/handler.mjs not found');
  }

  // Step 8: Patch worker.js — remove DO re-exports, add await, wrap fetch in try-catch
  console.log('\n=== Patching worker.js — fixes ===');
  const workerFile = '.open-next/worker.js';
  if (fs.existsSync(workerFile)) {
    let wc = fs.readFileSync(workerFile, 'utf-8');
    // 8a: Remove static Durable Object re-exports (not configured, module eval causes 500)
    wc = wc.replace(/export \{.*\} from "\.\/\.build\/durable-objects\/.*";\n/g, '');
    // 8b: Remove any previously added try blocks
    wc = wc.replace(/\s*try \{\n/g, '\n');
    wc = wc.replace(/\n\s*\} catch \(e\) \{\n\s*return new Response\("ERROR:.*?\(no stack\)"\),.*?\n\s*\}\n/g, '\n');
    // 8c: Add await before runWithCloudflareRequestContext
    wc = wc.replace('return runWithCloudflareRequestContext(', 'return await runWithCloudflareRequestContext(');
    // 8d: Wrap fetch body in try-catch (with detailed error logging)
    const fetchStart = 'async fetch(request, env, ctx) {';
    const fetchWrapped = `async fetch(request, env, ctx) {
        try {`;
    const closePattern = `        });
    },`;
    const closeWrapped = `        });
        } catch (e) {
          return new Response("ERROR: " + (e?.constructor?.name || typeof e) + ": " + (e?.message || "").substring(0, 1000) + "\\n\\n" + (e?.stack?.substring(0, 2000) || "(no stack)"), { status: 500, headers: { "content-type": "text/plain" } });
        }
    },`;
    if (wc.includes(fetchStart) && wc.includes(closePattern)) {
      wc = wc.replace(fetchStart, fetchWrapped);
      wc = wc.replace(closePattern, closeWrapped);
      fs.writeFileSync(workerFile, wc, 'utf-8');
      console.log('  ✓ Patched worker.js (DO removed, await added, error logging)');
    } else {
      console.log('  • Pattern not found');
    }
  } else {
    console.log('  ✗ worker.js not found');
  }

  // Step 9: Deploy to Cloudflare Workers
  console.log('\n=== Deploying to Cloudflare Workers ===');
  try {
    execSync('npx opennextjs-cloudflare deploy --config wrangler.jsonc', { stdio: 'inherit' });
    console.log('  ✓ Deployed successfully');
  } catch (deployErr) {
    console.error('  ✗ Deploy failed: ' + deployErr.message);
    console.error('    You can deploy manually with: npx opennextjs-cloudflare deploy --config wrangler.jsonc');
  }

  console.log('\n✅ Build complete!');
}

main().catch(e => { console.error(e); process.exit(1); });
