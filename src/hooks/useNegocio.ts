import { useState, useEffect } from 'react';
import { supabase, type Negocio } from '@/lib/supabaseClient';

export function useNegocio() {
  const [negocio, setNegocio] = useState<Negocio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('negocio')
      .select('*')
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else setNegocio(data);
        setLoading(false);
      });

    fetch('/rsmotors-logo.png')
      .then(r => r.blob())
      .then(
        blob =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          }),
      )
      .then(url => setLogoDataUrl(url))
      .catch(() => {}); // fail silently — PDF renders without logo
  }, []);

  return { negocio, loading, error, logoDataUrl };
}
