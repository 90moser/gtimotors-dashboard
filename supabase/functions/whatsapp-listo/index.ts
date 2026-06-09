import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const payload = await req.json();
    const record = payload.record;
    const old_record = payload.old_record;

    if (record?.estado !== 'listo' || old_record?.estado === 'listo') {
      return new Response(JSON.stringify({ skipped: true }), { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: cita } = await supabase
      .from('citas')
      .select('*, clientes(*), servicios(*), vehiculos(*)')
      .eq('id', record.id)
      .single();

    if (!cita) return new Response(JSON.stringify({ error: 'Cita não encontrada' }), { status: 404 });

    const cliente = cita.clientes;
    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!;
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')!;
    const TWILIO_FROM = Deno.env.get('TWILIO_WHATSAPP_FROM')!;
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    const toClean = String(cliente.telefono).replace(/\D/g, '');
    const toNumber = toClean.startsWith('34') ? toClean : `34${toClean}`;
    const resp = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: TWILIO_FROM,
        To: `whatsapp:+${toNumber}`,
        ContentSid: 'HXe0c5d86bf5d076c0c9964b47a2de760b',
        ContentVariables: JSON.stringify({
          "1": cliente.nombre,
          "2": cita.vehiculos?.matricula ?? '',
        }),
      }).toString(),
    });

    const result = await resp.json();
    console.log('Twilio response:', JSON.stringify(result));

    return new Response(JSON.stringify({ ok: true }), { status: 200 });

  } catch (err) {
    console.error('Erro:', String(err));
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
