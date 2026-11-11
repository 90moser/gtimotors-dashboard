import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TWILIO_ACCOUNT_SID    = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const TWILIO_AUTH_TOKEN     = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const TWILIO_FROM           = Deno.env.get('TWILIO_WHATSAPP_FROM')!;
const twilioUrl             = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
const auth                  = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
const TEMPLATE_CONFIRMACION = 'HXc1bb5aab4dceb12979320cb4da746939';

function normalizePhone(tel: string): string {
  const clean = String(tel).replace(/\D/g, '');
  return clean.startsWith('34') ? clean : `34${clean}`;
}

async function sendTemplate(to: string, contentSid: string, contentVariables: Record<string, string>) {
  const resp = await fetch(twilioUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From:             TWILIO_FROM,
      To:               `whatsapp:+${normalizePhone(to)}`,
      ContentSid:       contentSid,
      ContentVariables: JSON.stringify(contentVariables),
    }).toString(),
  });
  const result = await resp.json();
  console.log('Twilio template response:', JSON.stringify(result));
  return result;
}

async function sendText(to: string, body: string) {
  const resp = await fetch(twilioUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: TWILIO_FROM,
      To:   `whatsapp:+${normalizePhone(to)}`,
      Body: body,
    }).toString(),
  });
  const result = await resp.json();
  console.log('Twilio text response:', JSON.stringify(result));
  return result;
}

serve(async (req) => {
  try {
    const payload = await req.json();
    console.log('Payload recebido:', JSON.stringify(payload));

    const record = payload.record;
    if (!record?.id) {
      console.error('Record inválido:', JSON.stringify(payload));
      return new Response(JSON.stringify({ error: 'Record inválido' }), { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: cita, error } = await supabase
      .from('citas')
      .select('*, clientes(*), servicios(*), vehiculos(*)')
      .eq('id', record.id)
      .single();

    if (error || !cita) {
      console.error('Erro ao buscar cita:', error);
      return new Response(JSON.stringify({ error: 'Cita não encontrada' }), { status: 404 });
    }

    const cliente  = cita.clientes;
    const servicio = cita.servicios;
    const fecha    = new Date(cita.fecha + 'T12:00:00')
      .toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    const hora     = String(cita.hora).substring(0, 5);

    // Mensagem ao cliente via Content Template
    await sendTemplate(cliente.telefono, TEMPLATE_CONFIRMACION, {
      '1': cliente.nombre,
      '2': hora,
      '3': servicio.nombre,
      '4': fecha,
      '5': hora,
    });

    // Notificação interna à equipa com texto livre (conversa iniciada pelo negócio)
    await sendText(
      '665058633',
      `🆕 *Nueva cita recibida*\n\n` +
      `👤 ${cliente.nombre} ${cliente.apellidos}\n` +
      `📞 ${cliente.telefono}\n` +
      `📅 ${fecha} · ⏰ ${hora}\n` +
      `🔧 ${servicio.nombre}\n` +
      `💰 ${cita.precio_final}€\n` +
      `${cita.notas ? `📝 ${cita.notas}` : ''}`,
    );

    return new Response(JSON.stringify({ ok: true }), { status: 200 });

  } catch (err) {
    console.error('Erro:', String(err));
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
