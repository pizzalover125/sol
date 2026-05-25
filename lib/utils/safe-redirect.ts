/**
 * Validates that a redirect path is internal (starts with / and is not a protocol-relative URL).
 * Returns the path if safe, or the fallback otherwise.
 */
export function safeRedirect(
  path: string | null | undefined,
  fallback = '/dashboard'
): string {
  if (!path) return fallback
  // Must start with / but not // (protocol-relative URL)
  if (!path.startsWith('/') || path.startsWith('//')) return fallback
  return path
}
