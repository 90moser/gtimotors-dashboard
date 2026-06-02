import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')!;
const TWILIO_AUTH_TOKEN  = Deno.env.get('TWILIO_AUTH_TOKEN')!;
const TWILIO_FROM        = Deno.env.get('TWILIO_WHATSAPP_FROM')!;

serve(async (req) => {
  try {
    const { telefono, nombre, servicio, matricula } = await req.json();

    if (!telefono || !nombre) {
      return new Response(JSON.stringify({ error: 'Faltan parámetros' }), { status: 400 });
    }

    const toClean = String(telefono).replace(/\D/g, '');
    const toNumber = toClean.startsWith('34') ? toClean : `34${toClean}`;
    const to = `whatsapp:+${toNumber}`;
    const body =
      `🚗 *Tu vehículo está listo — GTIMotors*\n\n` +
      `Hola ${nombre} 👋\n\n` +
      `${matricula ? `Tu vehículo *${matricula}* ` : 'Tu vehículo '}` +
      `ya está listo${servicio ? ` tras el servicio de *${servicio}*` : ''}.\n\n` +
      `Puedes pasar a recogerlo cuando quieras.\n\n` +
      `📍 Travesia de Vigo 105 Bajo, Vigo\n` +
      `📞 986 13 75 76 · 698 191 512`;

    const params = new URLSearchParams({ From: TWILIO_FROM, To: to, Body: body });
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const result = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: result }), { status: 500 });
    }

    return new Response(JSON.stringify({ sid: result.sid }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
