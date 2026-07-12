type AccountIncompleteHandler = (message: string) => Promise<void>

let handler: AccountIncompleteHandler | null = null
let sessionInvalidated = false

export function registerAccountIncompleteHandler(next: AccountIncompleteHandler): void {
  handler = next
}

export async function notifyAccountIncomplete(message: string): Promise<void> {
  if (sessionInvalidated || !handler) {
    return
  }
  sessionInvalidated = true
  await handler(message)
}

/** Test helper */
export function resetAccountIncompleteHandler(): void {
  handler = null
  sessionInvalidated = false
}
