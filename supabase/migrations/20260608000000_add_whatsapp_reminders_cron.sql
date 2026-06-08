-- Add flag to track whether WhatsApp reminder has been sent for a cita
ALTER TABLE citas ADD COLUMN IF NOT EXISTS whatsapp_enviado BOOLEAN DEFAULT FALSE;

-- Enable required extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove existing job if it exists, then recreate
SELECT cron.unschedule('whatsapp-recordatorio-15min')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'whatsapp-recordatorio-15min'
);

-- Schedule cron: every 15 minutes, send WhatsApp reminders to citas
-- with appointment tomorrow (fecha = CURRENT_DATE + 1) that haven't been sent yet
SELECT cron.schedule(
  'whatsapp-recordatorio-15min',
  '*/15 * * * *',
  $$
  SELECT
    net.http_post(
      url    := current_setting('app.supabase_url') || '/functions/v1/send-whatsapp',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body   := jsonb_build_object(
        'template',   'recordatorio',
        'to',         cl.telefono,
        'variables',  jsonb_build_object(
          '1', cl.nombre,
          '2', to_char(c.fecha, 'Day, DD "de" Month'),
          '3', left(c.hora::text, 5),
          '4', sv.nombre
        )
      )
    )
  FROM citas c
  JOIN clientes  cl ON cl.id = c.cliente_id
  JOIN servicios sv ON sv.id = c.servicio_id
  WHERE c.fecha           = CURRENT_DATE + INTERVAL '1 day'
    AND c.estado         <> 'cancelado'
    AND c.whatsapp_enviado IS NOT TRUE;

  UPDATE citas
  SET whatsapp_enviado = TRUE
  WHERE fecha           = CURRENT_DATE + INTERVAL '1 day'
    AND estado         <> 'cancelado'
    AND whatsapp_enviado IS NOT TRUE;
  $$
);
