// Updated only by the private-storage verifier, never by an environment flag.
let verified = new Set<string>();
export function setVerifiedNativeWorkIds(ids: readonly string[]): void {
  verified = new Set(ids);
}
export function hasVerifiedNativeWork(id: string): boolean {
  return verified.has(id);
}
