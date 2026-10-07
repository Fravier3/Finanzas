// Session tokens live only in this page's memory, never in browser storage.
// The saved passkey belongs to the iPhone/iCloud, not to this session.
export class PrivateSessionStorage {
  private values = new Map<string, string>();
  locked = false;
  generation = 0;
  ceremonies = 0;
  getItem(key: string) { return this.locked ? null : this.values.get(key) ?? null; }
  setItem(key: string, value: string) { if (!this.locked) this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
  beginAuthentication() { this.locked = false; return this.generation; }
  lock(force = false) {
    if (this.ceremonies && !force) return false;
    this.locked = true;
    this.generation++;
    this.values.clear();
    return true;
  }
  isCurrent(generation: number) { return !this.locked && this.generation === generation; }
}
export const privateSession = new PrivateSessionStorage();
// Switching apps/tabs is temporary. Only discard the session when the page is
// actually discarded; preserve the live page when placed in back/forward cache.
// A killed process naturally loses this in-memory storage even without events.
export function installSessionLifecycle(target: EventTarget, onDiscard:()=>void) {
  const pagehide=(event:Event)=>{if(!(event as PageTransitionEvent).persisted)onDiscard();};
  target.addEventListener('pagehide',pagehide);
  return ()=>target.removeEventListener('pagehide',pagehide);
}
const EMAIL_KEY = 'finanzas-remembered-email';
export function rememberedEmail() {
  try { return localStorage.getItem(EMAIL_KEY) ?? ''; } catch { return ''; }
}
export function rememberEmail(email?: string) {
  if (!email) return;
  try { localStorage.setItem(EMAIL_KEY, email); } catch { /* Optional convenience only. */ }
}
