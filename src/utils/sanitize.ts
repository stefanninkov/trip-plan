/**
 * Firestore rejects fields whose value is exactly `undefined`. Our TypeScript
 * types use optional fields which become undefined for older docs / fresh
 * objects. This recursively replaces every `undefined` leaf with `null`
 * (preserving arrays and plain objects).
 */
export function sanitizeForFirestore<T>(value: T): T {
  if (Array.isArray(value)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return value.map(sanitizeForFirestore) as any
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = v === undefined ? null : sanitizeForFirestore(v)
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return out as any
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (value === undefined ? null : value) as any
}
