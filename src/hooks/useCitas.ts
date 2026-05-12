import { useState, useEffect, useCallback } from 'react';
import { supabase, type Cita, type EstadoCita } from '@/lib/supabaseClient';

export function useCitas(fecha: string) {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCitas = useCallback(async () => {
    const { data } = await supabase
      .from('citas')
      .select('*, clientes(*), vehiculos(*), servicios(*)')
      .eq('fecha', fecha)
      .order('hora');
    setCitas((data as Cita[]) ?? []);
    setLoading(false);
  }, [fecha]);

  useEffect(() => {
    setLoading(true);
    fetchCitas();

    const channel = supabase
      .channel(`agenda-${fecha}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'citas' }, fetchCitas)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fecha, fetchCitas]);

  const updateEstado = async (id: string, estado: EstadoCita) => {
    const { error } = await supabase.from('citas').update({ estado }).eq('id', id);
    if (error) throw error;
  };

  return { citas, loading, updateEstado };
}
