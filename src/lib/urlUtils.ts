/**
 * Normalizes a URL string to ensure it has a protocol.
 * If the URL already has http:// or https://, it returns as-is.
 * Otherwise, it prepends https:// to make it a valid absolute URL.
 * 
 * @param url - The URL string to normalize
 * @returns A normalized URL with a protocol
 */
export function normalizeUrl(url: string): string {
  if (!url) return url;
  // If URL already has a protocol, return as-is
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  // Otherwise, prepend https://
  return `https://${url}`;
}







