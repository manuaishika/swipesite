/** Runs a data loader; on failure logs it and returns null so the page can render a fallback. */
export async function safeLoad<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn()
  } catch (err) {
    console.error(`[${label}] data load failed:`, err)
    return null
  }
}
