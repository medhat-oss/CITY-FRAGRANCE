/**
 * Cloudinary Video Auto-Optimization Utility
 *
 * Enforces f_auto,q_auto transformation parameters on all Cloudinary video URLs.
 * - f_auto : serves WebM to browsers that support it, MP4 to others
 * - q_auto : aggressively optimized quality for fast page loads
 *
 * Safe to call with any URL — non-Cloudinary URLs pass through unchanged.
 */
export function getOptimizedVideoUrl(url: string): string {
  if (!url) return '';
  if (!url.includes('cloudinary.com')) return url;

  let optimized = url;

  // ── Step 1: Inject f_auto,q_auto if no transformation is present yet ──
  if (!optimized.includes('f_auto') && !optimized.includes('q_auto')) {
    if (optimized.includes('/video/upload/')) {
      optimized = optimized.replace('/video/upload/', '/video/upload/f_auto,q_auto/');
    } else {
      optimized = optimized.replace('/upload/', '/upload/f_auto,q_auto/');
    }
  }

  // ── Step 2: Downgrade any legacy q_auto:best → q_auto (speed priority) ──
  if (optimized.includes('q_auto:best')) {
    optimized = optimized.replace(/q_auto:best/g, 'q_auto');
  }

  // ── Step 3: Cache-bust so browser discards any stale compressed stream ──
  const sep = optimized.includes('?') ? '&' : '?';
  return `${optimized}${sep}v=4`;
}

/**
 * Same optimization for images (no cache-bust needed).
 */
export function getOptimizedImageUrl(url: string): string {
  if (!url) return '';
  if (!url.includes('cloudinary.com')) return url;

  let optimized = url;

  if (!optimized.includes('f_auto') && !optimized.includes('q_auto')) {
    if (optimized.includes('/image/upload/')) {
      optimized = optimized.replace('/image/upload/', '/image/upload/f_auto,q_auto/');
    } else {
      optimized = optimized.replace('/upload/', '/upload/f_auto,q_auto/');
    }
  }

  if (optimized.includes('q_auto:best')) {
    optimized = optimized.replace(/q_auto:best/g, 'q_auto');
  }

  return optimized;
}
