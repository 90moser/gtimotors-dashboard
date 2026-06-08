import { supabase, type Cita } from '@/lib/supabaseClient';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-whatsapp`;

async function callSendWhatsApp(
  template: string,
  to: string,
  variables: Record<string, string>,
): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

    await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ template, to, variables }),
    });
  } catch (err) {
    console.error(`[useWhatsApp] Error sending ${template}:`, err);
  }
}

function formatFecha(fecha: string): string {
  return format(new Date(fecha + 'T12:00:00'), "EEEE, d 'de' MMMM", { locale: es });
}

export function useWhatsApp() {
  const sendConfirmacion = (cita: Cita) => {
    const telefono = cita.clientes?.telefono;
    if (!telefono) return;

    const fecha = formatFecha(cita.fecha);
    const hora  = String(cita.hora).substring(0, 5);

    callSendWhatsApp('confirmacion', telefono, {
      '1': cita.clientes?.nombre ?? '',
      '2': fecha,
      '3': hora,
      '4': cita.servicios?.nombre ?? '',
    });
  };

  const sendRecordatorio = (cita: Cita) => {
    const telefono = cita.clientes?.telefono;
    if (!telefono) return;

    const fecha = formatFecha(cita.fecha);
    const hora  = String(cita.hora).substring(0, 5);

    callSendWhatsApp('recordatorio', telefono, {
      '1': cita.clientes?.nombre ?? '',
      '2': fecha,
      '3': hora,
      '4': cita.servicios?.nombre ?? '',
    });
  };

  const sendVehiculoListo = (cita: Cita) => {
    const telefono = cita.clientes?.telefono;
    if (!telefono) return;

    callSendWhatsApp('vehiculo_listo', telefono, {
      '1': cita.clientes?.nombre ?? '',
      '2': cita.vehiculos?.matricula ?? 'tu vehículo',
      '3': cita.servicios?.nombre ?? '',
    });
  };

  return { sendConfirmacion, sendRecordatorio, sendVehiculoListo };
}
