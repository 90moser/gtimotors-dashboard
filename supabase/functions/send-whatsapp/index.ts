import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const TWILIO_AUTH_TOKEN  = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const TWILIO_FROM        = 'whatsapp:+15075541821';

const TEMPLATE_SIDS: Record<string, string> = {
  confirmacion:   'HXc1bb5aab4dceb12979320cb4da746939',
  recordatorio:   'HX677d05e3552432a982e1931be809a23c',
  vehiculo_listo: 'HXe0c5d86bf5d076c0c9964b47a2de760b',
};

serve(async (req) => {
  try {
    const { template, to, variables } = await req.json() as {
      template: string;
      to: string;
      variables: Record<string, string>;
    };

    if (!template || !to || !variables) {
      return new Response(
        JSON.stringify({ error: 'Faltan parámetros: template, to, variables' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const contentSid = TEMPLATE_SIDS[template];
    if (!contentSid) {
      return new Response(
        JSON.stringify({ error: `Template desconocido: ${template}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const toClean  = String(to).replace(/\D/g, '');
    const toNumber = toClean.startsWith('34') ? toClean : `34${toClean}`;
    const toWA     = `whatsapp:+${toNumber}`;

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const auth      = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    const resp = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From:             TWILIO_FROM,
        To:               toWA,
        ContentSid:       contentSid,
        ContentVariables: JSON.stringify(variables),
      }).toString(),
    });

    const result = await resp.json();
    console.log('Twilio response:', JSON.stringify(result));

    if (!resp.ok) {
      return new Response(
        JSON.stringify({ error: result }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ sid: result.sid, to: toWA }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Error inesperado:', err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
