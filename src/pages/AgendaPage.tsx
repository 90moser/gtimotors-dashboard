import { useState } from 'react';
import { format, addDays, subDays, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ChevronLeft, ChevronRight, Plus, Clock, Car, Wrench, MoreVertical, Zap,
} from 'lucide-react';
import PageLayout from '@/components/PageLayout';
import { useCitas } from '@/hooks/useCitas';
import NuevaCitaDialog from '@/components/agenda/NuevaCitaDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { type Cita, type EstadoCita } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';

// ── Configuración de estados ────────────────────────────────────────────────

const ESTADO_CONFIG: Record<EstadoCita, { label: string; color: string; border: string }> = {
  espera:    { label: 'En espera', color: 'bg-amber-500/20 text-amber-500',     border: 'border-l-amber-500' },
  lavando:   { label: 'Lavando',   color: 'bg-blue-500/20 text-blue-500',       border: 'border-l-blue-500' },
  listo:     { label: 'Listo',     color: 'bg-emerald-500/20 text-emerald-500', border: 'border-l-emerald-500' },
  cancelado: { label: 'Cancelado', color: 'bg-muted text-muted-foreground',     border: 'border-l-border' },
};

const NEXT_ESTADO: Partial<Record<EstadoCita, { estado: EstadoCita; label: string }>> = {
  espera:  { estado: 'lavando', label: 'Iniciar' },
  lavando: { estado: 'listo',   label: 'Finalizar' },
};

// ── CitaCard ────────────────────────────────────────────────────────────────

interface CitaCardProps {
  cita: Cita;
  onEstadoChange: (id: string, estado: EstadoCita) => Promise<void>;
  onCancel: (id: string) => void;
}

const CitaCard = ({ cita, onEstadoChange, onCancel }: CitaCardProps) => {
  const [updating, setUpdating] = useState(false);
  const cfg = ESTADO_CONFIG[cita.estado];
  const next = NEXT_ESTADO[cita.estado];

  const handleAdvance = async () => {
    if (!next) return;
    setUpdating(true);
    try {
      await onEstadoChange(cita.id, next.estado);
    } catch {
      toast.error('Error al actualizar el estado');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className={cn(
      'bg-card border border-border border-l-4 rounded-xl p-4 flex items-start gap-4',
      cfg.border,
    )}>
      {/* Hora */}
      <div className="text-center min-w-[52px] pt-0.5">
        <p className="text-foreground font-bold tabular-nums">{cita.hora.slice(0, 5)}</p>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-foreground font-semibold text-sm">
              {cita.clientes?.nombre} {cita.clientes?.apellidos}
            </p>
            <p className="text-muted-foreground text-xs mt-0.5">{cita.clientes?.telefono}</p>
          </div>
          <Badge className={cn('text-xs shrink-0 border-0', cfg.color)}>
            {cfg.label}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Car className="h-3 w-3 shrink-0" />
            {cita.vehiculos?.matricula} · {cita.vehiculos?.marca} {cita.vehiculos?.modelo}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Wrench className="h-3 w-3 shrink-0" />
            {cita.servicios?.nombre}
          </span>
          {cita.precio_final != null && (
            <span className="text-xs text-muted-foreground font-medium">
              {Number(cita.precio_final).toFixed(2)} €
            </span>
          )}
        </div>

        {cita.notas && (
          <p className="text-xs text-muted-foreground/60 mt-1.5 italic">{cita.notas}</p>
        )}
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-1 shrink-0 pt-0.5">
        {next && (
          <Button size="sm" variant="outline" onClick={handleAdvance} disabled={updating} className="h-8 text-xs">
            {updating ? <Zap className="h-3 w-3 animate-pulse" /> : next.label}
          </Button>
        )}
        {cita.estado !== 'listo' && cita.estado !== 'cancelado' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onCancel(cita.id)}
              >
                Cancelar cita
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};

// ── AgendaPage ──────────────────────────────────────────────────────────────

const AgendaPage = () => {
  const [fecha, setFecha] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const fechaStr = format(fecha, 'yyyy-MM-dd');
  const { citas, loading, updateEstado } = useCitas(fechaStr);

  const counts = {
    espera:    citas.filter((c) => c.estado === 'espera').length,
    lavando:   citas.filter((c) => c.estado === 'lavando').length,
    listo:     citas.filter((c) => c.estado === 'listo').length,
    cancelado: citas.filter((c) => c.estado === 'cancelado').length,
  };

  const handleCancel = async (id: string) => {
    try {
      await updateEstado(id, 'cancelado');
      toast.success('Cita cancelada');
    } catch {
      toast.error('Error al cancelar la cita');
    }
  };

  const dayLabel = isToday(fecha)
    ? 'Hoy'
    : format(fecha, "EEEE d 'de' MMMM", { locale: es });

  return (
    <PageLayout title="Agenda">
      {/* Navegación de fecha */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => setFecha(subDays(fecha, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <p className="text-foreground font-semibold capitalize">{dayLabel}</p>
            <p className="text-muted-foreground text-xs">{format(fecha, 'dd/MM/yyyy')}</p>
          </div>
          <Button variant="outline" size="icon" onClick={() => setFecha(addDays(fecha, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          {!isToday(fecha) && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => setFecha(new Date())}
            >
              Ir a hoy
            </Button>
          )}
        </div>

        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva cita
        </Button>
      </div>

      {/* Stats por estado */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { key: 'espera',    label: 'En espera', count: counts.espera,    color: 'text-amber-500' },
          { key: 'lavando',   label: 'Lavando',   count: counts.lavando,   color: 'text-blue-500' },
          { key: 'listo',     label: 'Listo',     count: counts.listo,     color: 'text-emerald-500' },
          { key: 'cancelado', label: 'Cancelado', count: counts.cancelado, color: 'text-muted-foreground' },
        ].map(({ key, label, count, color }) => (
          <div key={key} className="bg-card border border-border rounded-xl px-4 py-3 text-center">
            <p className={cn('text-2xl font-bold tabular-nums', color)}>{count}</p>
            <p className="text-muted-foreground text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Lista de citas */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : citas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
            <Clock className="h-7 w-7 opacity-40" />
          </div>
          <p className="text-base font-medium">No hay citas para este día</p>
          <p className="text-sm mt-1 opacity-60">Pulsa "Nueva cita" para añadir una</p>
        </div>
      ) : (
        <div className="space-y-3">
          {citas.map((cita) => (
            <CitaCard
              key={cita.id}
              cita={cita}
              onEstadoChange={updateEstado}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}

      <NuevaCitaDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fechaDefault={fechaStr}
      />
    </PageLayout>
  );
};

export default AgendaPage;
