/**
 * Safely sanitizes user/admin HTML strings by removing unsafe tags, attributes, and script injection vectors.
 * Preserves safe text formatting tags like <b>, <strong>, <i>, <em>, <u>, <span>, <br>, <p>.
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';

  return input
    // Remove script, iframe, object, embed, style tags and their inner content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    // Remove inline event handlers like onclick, onerror, onload
    .replace(/\son\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
    // Remove javascript: and data: URLs
    .replace(/(?:href|src)\s*=\s*(?:'javascript:[^']*'|"javascript:[^"]*"|javascript:[^\s>]+)/gi, '')
    .replace(/(?:href|src)\s*=\s*(?:'data:[^']*'|"data:[^"]*"|data:[^\s>]+)/gi, '')
    // Filter tags: only allow safe formatting tags (b, strong, i, em, u, span, br, p)
    .replace(/<(\/?[a-z0-9]+)([^>]*)>/gi, (match, tag, attrs) => {
      const lowerTag = tag.toLowerCase();
      const isClosing = lowerTag.startsWith('/');
      const tagName = isClosing ? lowerTag.slice(1) : lowerTag;
      const allowedTags = ['b', 'strong', 'i', 'em', 'u', 'span', 'br', 'p', 'sub', 'sup', 'mark'];

      if (!allowedTags.includes(tagName)) {
        return '';
      }

      if (isClosing) {
        return `</${tagName}>`;
      }

      // Filter attributes on allowed tags - allow class, dir, title, and safe style
      const cleanAttrs = (attrs || '').replace(/([a-z-]+)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, (attrMatch: string, attrName: string, attrValue: string) => {
        const lowerAttrName = attrName.toLowerCase();
        if (['class', 'classname', 'dir', 'title'].includes(lowerAttrName)) {
          return attrMatch;
        }
        if (lowerAttrName === 'style') {
          if (/url\s*\(|expression\s*\(/i.test(attrValue)) {
            return '';
          }
          return attrMatch;
        }
        return '';
      }).trim();

      return cleanAttrs ? `<${tagName} ${cleanAttrs}>` : `<${tagName}>`;
    });
}
