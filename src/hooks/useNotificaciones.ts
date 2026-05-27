import { useEffect, useState } from 'react';
import { supabase, type Cita } from '@/lib/supabaseClient';
import { toast } from 'sonner';

export interface Notificacion {
  id: string;
  titulo: string;
  mensaje: string;
  fecha: string;
  lida: boolean;
}

export function useNotificaciones() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [noLidas, setNoLidas] = useState(0);

  useEffect(() => {
    const channel = supabase
      .channel('nuevas-citas')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'citas' },
        async (payload) => {
          const cita = payload.new as Cita;

          const { data } = await supabase
            .from('citas')
            .select('*, clientes(*), servicios(*)')
            .eq('id', cita.id)
            .single();

          if (!data) return;

          const nombre = `${data.clientes?.nombre} ${data.clientes?.apellidos}`;
          const servicio = data.servicios?.nombre;
          const hora = String(data.hora).substring(0, 5);

          toast.success(`🆕 Nueva cita — ${nombre}`, {
            description: `${servicio} · ${data.fecha} a las ${hora}`,
            duration: 8000,
          });

          const nueva: Notificacion = {
            id: cita.id,
            titulo: `Nueva cita — ${nombre}`,
            mensaje: `${servicio} · ${data.fecha} a las ${hora}`,
            fecha: new Date().toISOString(),
            lida: false,
          };

          setNotificaciones((prev) => [nueva, ...prev].slice(0, 20));
          setNoLidas((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const marcarTodasLidas = () => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, lida: true })));
    setNoLidas(0);
  };

  return { notificaciones, noLidas, marcarTodasLidas };
}
