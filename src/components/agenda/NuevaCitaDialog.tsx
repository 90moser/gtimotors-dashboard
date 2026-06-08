import { useState, useEffect } from 'react';
import { Loader2, Search, User, UserPlus } from 'lucide-react';
import { supabase, type Cliente, type Cita, type Vehiculo, type Servicio, type TipoVehiculo } from '@/lib/supabaseClient';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
  fechaDefault: string;
  telefonoInicial?: string;
}

const TIPO_OPTIONS: { value: TipoVehiculo; label: string }[] = [
  { value: 'turismo',     label: 'Turismo' },
  { value: 'suv',         label: 'SUV' },
  { value: 'monovolumen', label: 'Monovolumen' },
  { value: 'furgoneta',   label: 'Furgoneta' },
];

const getDefaultHora = () => {
  const now = new Date();
  const m = now.getMinutes();
  if (m < 30) {
    now.setMinutes(30, 0, 0);
  } else {
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);
  }
  return now.toTimeString().slice(0, 5);
};

const NuevaCitaDialog = ({ open, onClose, fechaDefault, telefonoInicial }: Props) => {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { sendConfirmacion } = useWhatsApp();

  // undefined = aún no buscado, null = no encontrado, Cliente = encontrado
  const [clienteEncontrado, setClienteEncontrado] = useState<Cliente | null | undefined>(undefined);
  const [vehiculosExistentes, setVehiculosExistentes] = useState<Vehiculo[]>([]);

  // Campos de cliente
  const [telefono, setTelefono] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [email, setEmail] = useState('');

  // Campos de vehículo
  const [vehiculoId, setVehiculoId] = useState('nuevo');
  const [matricula, setMatricula] = useState('');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [tipo, setTipo] = useState<TipoVehiculo>('turismo');
  const [color, setColor] = useState('');

  // Campos de cita
  const [servicioId, setServicioId] = useState('');
  const [fecha, setFecha] = useState(fechaDefault);
  const [hora, setHora] = useState(getDefaultHora());
  const [notas, setNotas] = useState('');
  const [otrosDescripcion, setOtrosDescripcion] = useState('');
  const [otrosPrecio, setOtrosPrecio] = useState('');
  const [horasOcupadas, setHorasOcupadas] = useState<string[]>([]);
  const [isSabado, setIsSabado] = useState(false);

  const buscarClientePorTelefono = async (tel: string) => {
    setBuscando(true);
    try {
      const { data } = await supabase
        .from('clientes')
        .select('*')
        .eq('telefono', tel.trim())
        .maybeSingle();

      if (data) {
        const c = data as Cliente;
        setClienteEncontrado(c);
        setNombre(c.nombre);
        setApellidos(c.apellidos);
        setEmail(c.email ?? '');

        const { data: vs } = await supabase
          .from('vehiculos')
          .select('*')
          .eq('cliente_id', c.id)
          .order('created_at', { ascending: false });

        const vehiculos = (vs as Vehiculo[]) ?? [];
        setVehiculosExistentes(vehiculos);

        if (vehiculos.length > 0) {
          const v = vehiculos[0];
          setVehiculoId(v.id);
          setMatricula(v.matricula); setMarca(v.marca);
          setModelo(v.modelo); setTipo(v.tipo); setColor(v.color ?? '');
        } else {
          setVehiculoId('nuevo');
        }
      } else {
        setClienteEncontrado(null);
        setNombre(''); setApellidos(''); setEmail('');
        setVehiculosExistentes([]); setVehiculoId('nuevo');
      }
    } finally {
      setBuscando(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    // Reset al abrir
    setClienteEncontrado(undefined);
    setVehiculosExistentes([]);
    setTelefono(''); setNombre(''); setApellidos(''); setEmail('');
    setVehiculoId('nuevo'); setMatricula(''); setMarca('');
    setModelo(''); setTipo('turismo'); setColor('');
    setServicioId(''); setFecha(fechaDefault); setHora(getDefaultHora()); setNotas('');
    setOtrosDescripcion(''); setOtrosPrecio('');
    setHorasOcupadas([]); setIsSabado(false);

    supabase
      .from('servicios')
      .select('*')
      .eq('activo', true)
      .order('nombre')
      .then(({ data }) => setServicios((data as Servicio[]) ?? []));

    if (telefonoInicial) {
      setTelefono(telefonoInicial);
      buscarClientePorTelefono(telefonoInicial);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fechaDefault, telefonoInicial]);

  const fetchHorasOcupadas = async (f: string) => {
    const { data } = await supabase
      .from('citas')
      .select('hora')
      .eq('fecha', f)
      .neq('estado', 'cancelado');
    setHorasOcupadas((data ?? []).map((c: { hora: string }) => String(c.hora).substring(0, 5)));
  };

  const handleFechaChange = (val: string) => {
    if (!val) { setFecha(''); setIsSabado(false); return; }
    const date = new Date(val + 'T12:00:00');
    const day = date.getDay();
    if (day === 0) {
      toast.error('Los domingos estamos cerrados.');
      setFecha('');
      return;
    }
    setIsSabado(day === 6);
    setFecha(val);
    fetchHorasOcupadas(val);
  };

  const buscarCliente = async () => {
    if (!telefono.trim()) { toast.error('Introduce un teléfono para buscar'); return; }
    await buscarClientePorTelefono(telefono);
  };

  const handleVehicleSelect = (id: string) => {
    setVehiculoId(id);
    if (id === 'nuevo') {
      setMatricula(''); setMarca(''); setModelo(''); setTipo('turismo'); setColor('');
    } else {
      const v = vehiculosExistentes.find((x) => x.id === id);
      if (v) {
        setMatricula(v.matricula); setMarca(v.marca);
        setModelo(v.modelo); setTipo(v.tipo); setColor(v.color ?? '');
      }
    }
  };

  const ALL_SLOTS = [
    '09:00','09:30','10:00','10:30','11:00','11:30',
    '12:00','12:30','13:00','13:30','14:00','14:30',
    '15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30',
  ];
  const SAB_SLOTS = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00'];
  const slots = isSabado ? SAB_SLOTS : ALL_SLOTS;

  const isOtros = servicios.find((s) => s.id === servicioId)?.nombre
    .toLowerCase().startsWith('otros') ?? false;

  const getPrecioFinal = (): number | null => {
    if (isOtros) {
      const p = parseFloat(otrosPrecio);
      return isNaN(p) ? null : p;
    }
    const s = servicios.find((x) => x.id === servicioId);
    if (!s) return null;
    return { turismo: s.precio_turismo, suv: s.precio_suv, monovolumen: s.precio_monovolumen, furgoneta: s.precio_furgoneta }[tipo];
  };

  const handleSubmit = async () => {
    if (!telefono || !nombre || !apellidos || !matricula || !marca || !modelo || !servicioId || !fecha || !hora) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }
    if (isOtros && !otrosDescripcion.trim()) {
      toast.error('Describe el servicio realizado');
      return;
    }
    if (isOtros && (!otrosPrecio || isNaN(parseFloat(otrosPrecio)))) {
      toast.error('Introduce el precio del servicio');
      return;
    }
    const telefonoValido = /^[679]\d{8}$/.test(telefono.replace(/\s/g, ''));
    if (!telefonoValido) {
      toast.error('Introduce un teléfono español válido (9 dígitos)');
      return;
    }
    setSubmitting(true);
    try {
      let clienteId = clienteEncontrado?.id ?? null;

      if (!clienteId) {
        const { data, error } = await supabase
          .from('clientes')
          .insert({ nombre, apellidos, telefono: telefono.trim(), email: email || null })
          .select()
          .single();
        if (error) throw error;
        clienteId = data.id;
      }

      let vehiculoFinalId = vehiculoId !== 'nuevo' ? vehiculoId : null;

      if (!vehiculoFinalId) {
        const { data, error } = await supabase
          .from('vehiculos')
          .insert({ cliente_id: clienteId, matricula: matricula.toUpperCase(), marca, modelo, tipo, color: color || null })
          .select()
          .single();
        if (error) throw error;
        vehiculoFinalId = data.id;
      }

      const { data: citaData, error } = await supabase.from('citas').insert({
        cliente_id: clienteId,
        vehiculo_id: vehiculoFinalId,
        servicio_id: servicioId,
        fecha, hora,
        estado: 'espera',
        precio_final: getPrecioFinal(),
        notas: isOtros
          ? `[Otros] ${otrosDescripcion}${notas ? ' — ' + notas : ''}`
          : notas || null,
      }).select('*, clientes(*), vehiculos(*), servicios(*)').single();
      if (error) throw error;

      sendConfirmacion(citaData as Cita);

      toast.success('Cita creada correctamente');
      onClose();
    } catch (err: unknown) {
      const pg = err as { code?: string };
      if (pg?.code === '23505') {
        toast.error('Ya existe un cliente o vehículo con esos datos');
      } else {
        toast.error('Error al crear la cita');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const showVehicleForm = vehiculoId === 'nuevo';
  const isNuevoCliente = clienteEncontrado === null;
  const searched = clienteEncontrado !== undefined;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg h-[90vh] flex flex-col p-0 gap-0">

        {/* Fixed header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
          <DialogTitle>Nueva Cita</DialogTitle>
        </DialogHeader>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-5">

          {/* Búsqueda de cliente */}
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-3 block">
              Cliente
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ej: 612345678 — pulsa Enter o 🔍 para buscar"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && buscarCliente()}
              />
              <Button variant="outline" onClick={buscarCliente} disabled={buscando} className="gap-2 px-4">
                {buscando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="hidden sm:inline">Buscar</span>
              </Button>
            </div>
            {!searched && (
              <p className="text-xs text-muted-foreground mt-1.5">
                Introduce el teléfono y pulsa Enter o el botón de búsqueda
              </p>
            )}

            {searched && (
              <div className={`mt-2 px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                clienteEncontrado ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
              }`}>
                {clienteEncontrado ? (
                  <><User className="h-3.5 w-3.5 shrink-0" /> Cliente encontrado: {clienteEncontrado.nombre} {clienteEncontrado.apellidos}</>
                ) : (
                  <><UserPlus className="h-3.5 w-3.5 shrink-0" /> No encontrado — completa los datos del nuevo cliente</>
                )}
              </div>
            )}

            {searched && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <Label className="text-xs mb-1 block">Nombre *</Label>
                  <Input value={nombre} onChange={(e) => setNombre(e.target.value)} disabled={!!clienteEncontrado} />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Apellidos *</Label>
                  <Input value={apellidos} onChange={(e) => setApellidos(e.target.value)} disabled={!!clienteEncontrado} />
                </div>
                {isNuevoCliente && (
                  <div className="col-span-2">
                    <Label className="text-xs mb-1 block">Email</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="opcional" />
                  </div>
                )}
              </div>
            )}
          </div>

          {searched && (
            <>
              <Separator />

              {/* Vehículo */}
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-3 block">
                  Vehículo
                </Label>

                {vehiculosExistentes.length > 0 && (
                  <div className="mb-3">
                    <Label className="text-xs mb-1 block">Seleccionar vehículo</Label>
                    <Select value={vehiculoId} onValueChange={handleVehicleSelect}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {vehiculosExistentes.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.matricula} — {v.marca} {v.modelo}
                          </SelectItem>
                        ))}
                        <SelectItem value="nuevo">+ Añadir nuevo vehículo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {showVehicleForm && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs mb-1 block">Matrícula *</Label>
                      <Input
                        value={matricula}
                        onChange={(e) => setMatricula(e.target.value.toUpperCase())}
                        placeholder="1234ABC"
                      />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Tipo *</Label>
                      <Select value={tipo} onValueChange={(v) => setTipo(v as TipoVehiculo)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TIPO_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Marca *</Label>
                      <Input value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Toyota" />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Modelo *</Label>
                      <Input value={modelo} onChange={(e) => setModelo(e.target.value)} placeholder="Corolla" />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs mb-1 block">Color</Label>
                      <Input value={color} onChange={(e) => setColor(e.target.value)} placeholder="Blanco (opcional)" />
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Detalles de la cita */}
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-3 block">
                  Detalles de la cita
                </Label>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs mb-1 block">Servicio *</Label>
                    <Select value={servicioId} onValueChange={setServicioId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un servicio" />
                      </SelectTrigger>
                      <SelectContent>
                        {servicios.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {isOtros && (
                    <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border">
                      <div>
                        <Label className="text-xs mb-1 block">Descripción del servicio *</Label>
                        <Input
                          value={otrosDescripcion}
                          onChange={(e) => setOtrosDescripcion(e.target.value)}
                          placeholder="Ej: Cambio de aceite sintético 5W30..."
                        />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Precio *</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={otrosPrecio}
                            onChange={(e) => setOtrosPrecio(e.target.value)}
                            placeholder="0.00"
                            className="pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs mb-1 block">Fecha *</Label>
                      <Input type="date" value={fecha} onChange={(e) => handleFechaChange(e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs mb-1 block">Hora *</Label>
                      <Select value={hora} onValueChange={setHora}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona hora" />
                        </SelectTrigger>
                        <SelectContent>
                          {slots.map((s) => (
                            <SelectItem key={s} value={s} disabled={horasOcupadas.includes(s)}>
                              {s}{horasOcupadas.includes(s) ? ' — Ocupado' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {getPrecioFinal() !== null && (
                    <div className="bg-primary/10 rounded-lg px-4 py-2.5 text-sm">
                      <span className="text-muted-foreground">Precio estimado:</span>{' '}
                      <span className="text-foreground font-bold">{getPrecioFinal()?.toFixed(2)} €</span>
                    </div>
                  )}

                  <div>
                    <Label className="text-xs mb-1 block">Notas</Label>
                    <Textarea
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      placeholder="Observaciones opcionales..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
          </div>
        </div>

        {/* Fixed footer */}
        <div className="flex-shrink-0 border-t border-border px-6 py-4 flex justify-end gap-3 bg-background">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          {searched && (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Guardando...</>
                : 'Crear cita'}
            </Button>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
};

export default NuevaCitaDialog;
