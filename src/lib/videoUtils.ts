/**
 * Cloudinary Video Auto-Optimization Utility
 *
 * Enforces f_auto,q_auto:best transformation parameters on all Cloudinary video URLs.
 * - f_auto       : serves WebM to browsers that support it, MP4 to others
 * - q_auto:best  : maximum quality while still applying smart format selection
 *                  (replaces plain q_auto which is far too aggressive for luxury video)
 *
 * Also upgrades any previously stored URLs that used the lower q_auto preset.
 * Safe to call with any URL — non-Cloudinary URLs pass through unchanged.
 */
export function getOptimizedVideoUrl(url: string): string {
  if (!url) return '';
  if (!url.includes('cloudinary.com')) return url;

  let optimized = url;

  // ── Step 1: Inject f_auto,q_auto:best if no transformation is present yet ──
  if (!optimized.includes('f_auto') && !optimized.includes('q_auto')) {
    if (optimized.includes('/video/upload/')) {
      optimized = optimized.replace('/video/upload/', '/video/upload/f_auto,q_auto:best/');
    } else {
      optimized = optimized.replace('/upload/', '/upload/f_auto,q_auto:best/');
    }
  }

  // ── Step 2: Upgrade legacy q_auto → q_auto:best (already-saved URLs) ──
  // This catches URLs stored before the q_auto:best fix was in place.
  if (optimized.includes('q_auto') && !optimized.includes('q_auto:best')) {
    optimized = optimized.replace(/q_auto(?!:)/g, 'q_auto:best');
  }

  // ── Step 3: Cache-bust so browser discards any stale compressed stream ──
  // Increment this version number any time you want to force a full re-fetch.
  const sep = optimized.includes('?') ? '&' : '?';
  return `${optimized}${sep}v=3`;
}

/**
 * Same optimization for images (no cache-bust needed — images don't stream).
 */
export function getOptimizedImageUrl(url: string): string {
  if (!url) return '';
  if (!url.includes('cloudinary.com')) return url;

  let optimized = url;

  if (!optimized.includes('f_auto') && !optimized.includes('q_auto')) {
    if (optimized.includes('/image/upload/')) {
      optimized = optimized.replace('/image/upload/', '/image/upload/f_auto,q_auto:best/');
    } else {
      optimized = optimized.replace('/upload/', '/upload/f_auto,q_auto:best/');
    }
  }

  if (optimized.includes('q_auto') && !optimized.includes('q_auto:best')) {
    optimized = optimized.replace(/q_auto(?!:)/g, 'q_auto:best');
  }

  return optimized;
}
