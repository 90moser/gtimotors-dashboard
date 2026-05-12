import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase. Revisa el archivo .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// ── Tipos de base de datos ─────────────────────────────────────────────────────

export type EstadoCita = 'espera' | 'lavando' | 'listo' | 'cancelado';

export type TipoVehiculo = 'turismo' | 'suv' | 'monovolumen' | 'furgoneta';

export interface Cliente {
  id: string;
  nombre: string;
  apellidos: string;
  telefono: string;
  email?: string;
  nif?: string;
  notas?: string;
  created_at: string;
}

export interface Vehiculo {
  id: string;
  cliente_id: string;
  matricula: string;
  marca: string;
  modelo: string;
  color?: string;
  tipo: TipoVehiculo;
  created_at: string;
  clientes?: Cliente;
}

export interface Servicio {
  id: string;
  nombre: string;
  descripcion?: string;
  duracion_minutos: number;
  precio_turismo: number;
  precio_suv: number;
  precio_monovolumen: number;
  precio_furgoneta: number;
  activo: boolean;
}

export interface Cita {
  id: string;
  cliente_id: string;
  vehiculo_id: string;
  servicio_id: string;
  fecha: string;
  hora: string;
  estado: EstadoCita;
  precio_final?: number;
  notas?: string;
  created_at: string;
  updated_at: string;
  clientes?: Cliente;
  vehiculos?: Vehiculo;
  servicios?: Servicio;
}

export interface Factura {
  id: string;
  numero: string;
  cita_id: string;
  cliente_id: string;
  base_imponible: number;
  iva: number;
  total: number;
  estado: 'borrador' | 'emitida' | 'pagada';
  pdf_url?: string;
  fecha_emision: string;
  created_at: string;
  clientes?: Cliente;
  citas?: Cita;
}
