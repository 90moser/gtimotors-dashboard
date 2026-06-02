import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const TWILIO_AUTH_TOKEN  = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const TWILIO_FROM        = Deno.env.get('TWILIO_WHATSAPP_FROM')!;
const SUPABASE_URL       = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY       = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  try {
    const body = await req.json();
    console.log('Body recebido:', JSON.stringify(body));

    const record = body.record;
    if (!record || !record.id) {
      console.error('Record inválido:', JSON.stringify(body));
      return new Response(
        JSON.stringify({ error: 'Record inválido', body }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Buscar cita completa com cliente e serviço
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: cita, error } = await supabase
      .from('citas')
      .select('*, clientes(*), servicios(*), vehiculos(*)')
      .eq('id', record.id)
      .single();

    if (error || !cita) {
      console.error('Erro ao buscar cita:', error);
      return new Response(
        JSON.stringify({ error: 'Cita não encontrada', details: error }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const telefono = cita.clientes?.telefono;
    if (!telefono) {
      console.error('Cliente sem telefone:', JSON.stringify(cita.clientes));
      return new Response(
        JSON.stringify({ error: 'Cliente sem telefone' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const nombre   = `${cita.clientes.nombre} ${cita.clientes.apellidos}`;
    const servicio = cita.servicios?.nombre ?? 'Servicio';
    const fecha    = cita.fecha;
    const hora     = String(cita.hora).substring(0, 5);

    const toClean  = String(telefono).replace(/\D/g, '');
    const toNumber = toClean.startsWith('34') ? toClean : `34${toClean}`;
    const to       = `whatsapp:+${toNumber}`;

    const msgBody =
      `✅ *Cita confirmada — GTIMotors*\n\n` +
      `Hola ${nombre} 👋\n` +
      `Tu cita ha sido registrada:\n\n` +
      `🔧 *Servicio:* ${servicio}\n` +
      `📅 *Fecha:* ${fecha}\n` +
      `🕐 *Hora:* ${hora}\n\n` +
      `📍 Travesia de Vigo 105 Bajo, Vigo\n` +
      `📞 986 13 75 76 · 698 191 512\n\n` +
      `¡Te esperamos! 🚗`;

    const params = new URLSearchParams({ From: TWILIO_FROM, To: to, Body: msgBody });
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const result = await response.json();
    console.log('Twilio response:', JSON.stringify(result));

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: result }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ sid: result.sid, to }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Erro inesperado:', err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
