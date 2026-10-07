import { createClient } from '@supabase/supabase-js';
import {privateSession} from './private-session';
// Remove the previous persisted session during the migration. No financial data
// or passkeys are removed. New access/refresh tokens stay in memory only.
try { localStorage.removeItem('sb-hxrpidqqqnnpwlfmugvn-auth-token'); } catch { /* Storage may be unavailable. */ }
export const supabase = createClient('https://hxrpidqqqnnpwlfmugvn.supabase.co','sb_publishable_s1Cg3GiwNfJ05FgBgEtpMw_MTgZITmX',{
  auth:{experimental:{passkey:true},storage:privateSession,persistSession:true,
    // Isolate each page; another tab must not unlock this one via BroadcastChannel.
    storageKey:'finanzas-private-'+crypto.randomUUID()},
});
let authActionPending=false;
export async function authenticate<T>(action:()=>Promise<T>,passkey=false):Promise<T>{
  if(authActionPending)throw Error('Espera a que termine la verificación actual.');
  authActionPending=true;
  const generation=privateSession.beginAuthentication();
  if(passkey)privateSession.ceremonies++;
  try {
    const result=await action();
    if(!privateSession.isCurrent(generation))throw Error('La app se cerró. Vuelve a entrar.');
    return result;
  } finally {
    authActionPending=false;
    if(passkey)privateSession.ceremonies--;
  }
}
