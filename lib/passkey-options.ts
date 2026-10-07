export type CreationJSON = Omit<PublicKeyCredentialCreationOptions,'challenge'|'user'|'excludeCredentials'> & {
  challenge:string;
  user:Omit<PublicKeyCredentialUserEntity,'id'> & {id:string};
  excludeCredentials?:Array<Omit<PublicKeyCredentialDescriptor,'id'> & {id:string}>;
};
export function decodeBase64url(value:string):ArrayBuffer {
  const base64=value.replaceAll('-','+').replaceAll('_','/');
  const decoded=atob(base64+'='.repeat((4-base64.length%4)%4));
  return Uint8Array.from(decoded,c=>c.charCodeAt(0)).buffer;
}
export function encodeBase64url(value:ArrayBuffer):string {
  return btoa(String.fromCharCode(...new Uint8Array(value))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
}
export function thisDeviceOptions(options:CreationJSON):PublicKeyCredentialCreationOptions {
  return {...options,challenge:decodeBase64url(options.challenge),user:{...options.user,id:decodeBase64url(options.user.id)},
    excludeCredentials:options.excludeCredentials?.map(c=>({...c,id:decodeBase64url(c.id)})),
    authenticatorSelection:{...options.authenticatorSelection,authenticatorAttachment:'platform',residentKey:'required',requireResidentKey:true,userVerification:'required'}};
}
