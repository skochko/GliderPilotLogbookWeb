export function encodeFlightId(id: string): string {
  return encodeURIComponent(id)
}

export function decodeFlightId(encoded: string): string {
  return decodeURIComponent(encoded)
}
