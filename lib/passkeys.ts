import {supabase} from './supabase';
import {thisDeviceOptions,encodeBase64url,type CreationJSON} from './passkey-options';
// Use Supabase's public two-step API so we can request this device's built-in
// authenticator rather than offering an external USB key or another device.
export async function registerThisDevice(){
  const {data,error}=await supabase.auth.passkey.startRegistration();
  if(error)throw error;
  if(!data)throw Error('No se pudo preparar la clave de acceso.');
  const credential=await navigator.credentials.create({publicKey:thisDeviceOptions(data.options as CreationJSON)}) as PublicKeyCredential|null;
  if(!credential)throw Error('No se creó la clave de acceso.');
  const response=credential.response as AuthenticatorAttestationResponse;
  const {error:verificationError}=await supabase.auth.passkey.verifyRegistration({challengeId:data.challenge_id,credential:{
    id:credential.id,rawId:encodeBase64url(credential.rawId),type:'public-key',
    response:{clientDataJSON:encodeBase64url(response.clientDataJSON),attestationObject:encodeBase64url(response.attestationObject)},
    clientExtensionResults:credential.getClientExtensionResults(),
    authenticatorAttachment:credential.authenticatorAttachment==='platform'?'platform':undefined,
  }});
  if(verificationError)throw verificationError;
}
