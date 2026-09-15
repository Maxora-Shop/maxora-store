/**
 * Safe HTML Sanitizer for Rich Text Product Descriptions
 * Allows safe formatting tags and inline CSS styles (colors, highlights, font weights, headings)
 * while strictly stripping malicious scripts, event handlers, and dangerous iframe/objects.
 */

const DANGEROUS_TAGS = /<\/?(script|iframe|frame|object|embed|applet|form|input|button|select|textarea|link|meta|style)\b[^>]*>/gi;
const DANGEROUS_ATTRS = /\s+(on\w+|javascript:|vbscript:|data:\s*text\/html)\s*=\s*(['"][^'"]*['"]|[^\s>]+)/gi;
const DANGEROUS_PROTOCOLS = /(href|src)\s*=\s*['"]\s*(javascript|vbscript|data):[^'"]*['"]/gi;
const DANGEROUS_CSS = /(expression|behavior|javascript|moz-binding)/gi;

/**
 * Strips all HTML tags and returns purely plain text
 */
export function stripAllHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Checks if a string contains HTML tags
 */
export function hasHtmlTags(text?: string): boolean {
  if (!text) return false;
  return /<[a-z][\s\S]*>/i.test(text);
}

/**
 * Sanitizes rich text HTML for safe rendering with dangerouslySetInnerHTML.
 * Retains text colors, background highlight colors, bold/italics, headings, lists, etc.
 */
export function sanitizeSafeHtml(html?: string): string {
  if (!html) return '';
  
  let clean = html;

  // 1. Remove dangerous script/iframe tags
  clean = clean.replace(DANGEROUS_TAGS, '');

  // 2. Remove dangerous event handlers (onclick, onload, onerror, etc.)
  clean = clean.replace(DANGEROUS_ATTRS, '');

  // 3. Remove dangerous protocols from links or images
  clean = clean.replace(DANGEROUS_PROTOCOLS, '');

  // 4. Sanitize style attributes to prevent CSS injection
  clean = clean.replace(/style\s*=\s*(['"])(.*?)\1/gi, (match, quote, styleContent) => {
    if (DANGEROUS_CSS.test(styleContent)) {
      return '';
    }
    // Allow safe CSS properties: color, background-color, font-weight, font-size, font-style, text-decoration, text-align, padding, margin, border-radius
    const safeDeclarations = styleContent
      .split(';')
      .map((decl: string) => decl.trim())
      .filter((decl: string) => {
        if (!decl) return false;
        const [prop] = decl.split(':').map((s: string) => s.trim().toLowerCase());
        return [
          'color',
          'background-color',
          'background',
          'font-weight',
          'font-size',
          'font-style',
          'text-decoration',
          'text-align',
          'line-height',
          'padding',
          'margin',
          'border-radius',
          'display',
        ].includes(prop);
      });

    return safeDeclarations.length > 0 ? `style=${quote}${safeDeclarations.join('; ')}${quote}` : '';
  });

  return clean;
}
