// Public key only: this RPC can update one operational date, never financial data.
const url = 'https://hxrpidqqqnnpwlfmugvn.supabase.co/rest/v1/rpc/finance_daily_activity';
const key = 'sb_publishable_s1Cg3GiwNfJ05FgBgEtpMw_MTgZITmX';
const expected = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Puerto_Rico', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());

for (let check = 1; check <= 3; check++) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { apikey: key, 'Content-Type': 'application/json' },
    body: '{}',
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error('Heartbeat HTTP ' + response.status);
  const date = await response.json();
  if (date !== expected) throw new Error('Unexpected operational date: ' + date);
  console.log('Finanzas: consulta ' + check + '/3 correcta; fecha interna ' + date);
}
