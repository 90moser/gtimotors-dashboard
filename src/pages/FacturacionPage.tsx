import { useEffect, useState } from "react";
import { FileText, Plus, Download, CheckCircle2, Loader2, CalendarDays, Search } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFaturas } from "@/hooks/useFaturas";
import { supabase, type Cita, type Cliente, type Factura } from "@/lib/supabaseClient";
import { toast } from "sonner";

type FiltroEstado = "todas" | Factura["estado"];

const estadoBadgeClass: Record<Factura["estado"], string> = {
  borrador: "bg-amber-500/15 text-amber-500 border border-amber-500/30",
  emitida:  "bg-blue-500/15 text-blue-500 border border-blue-500/30",
  pagada:   "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30",
};
const estadoLabel: Record<Factura["estado"], string> = {
  borrador: "Borrador",
  emitida:  "Emitida",
  pagada:   "Pagada",
};

const filtros: { key: FiltroEstado; label: string }[] = [
  { key: "todas",    label: "Todas" },
  { key: "borrador", label: "Borrador" },
  { key: "emitida",  label: "Emitida" },
  { key: "pagada",   label: "Pagada" },
];

const FacturacionPage = () => {
  const {
    facturas,
    loading,
    citasDisponibles,
    fetchFacturas,
    fetchCitasDisponibles,
    createFactura,
    createFacturaMensal,
    updateEstado,
    generatePDF,
    generatePDFMensal,
  } = useFaturas();

  // ── Nueva factura (single) ─────────────────────────────────────────────────
  const [filtro, setFiltro] = useState<FiltroEstado>("todas");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [citaSelectValue, setCitaSelectValue] = useState("");
  const [citaSeleccionada, setCitaSeleccionada] = useState<Cita | null>(null);
  const [creando, setCreando] = useState(false);

  // ── Factura mensual ────────────────────────────────────────────────────────
  const [dialogMensualOpen, setDialogMensualOpen] = useState(false);
  const [searchMensual, setSearchMensual] = useState("");
  const [buscandoMensual, setBuscandoMensual] = useState(false);
  const [clienteMensual, setClienteMensual] = useState<Cliente | null | undefined>(undefined);
  const [citasMensual, setCitasMensual] = useState<Cita[]>([]);
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(new Set());
  const [creandoMensual, setCreandoMensual] = useState(false);

  useEffect(() => {
    fetchFacturas();
  }, [fetchFacturas]);

  // ── Single invoice ─────────────────────────────────────────────────────────
  const handleOpenDialog = async () => {
    await fetchCitasDisponibles();
    setDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setCitaSeleccionada(null);
      setCitaSelectValue("");
    }
  };

  const handleSelectCita = (citaId: string) => {
    setCitaSelectValue(citaId);
    setCitaSeleccionada(citasDisponibles.find((c) => c.id === citaId) ?? null);
  };

  const handleCrearFactura = async () => {
    if (!citaSeleccionada) return;
    setCreando(true);
    try {
      const nuevaFactura = await createFactura(citaSeleccionada.id);
      generatePDF(nuevaFactura);
      toast.success(`Factura ${nuevaFactura.numero} creada y descargada`);
      handleDialogOpenChange(false);
      await fetchFacturas();
    } catch (err) {
      console.error(err);
      toast.error("Error al crear la factura");
    } finally {
      setCreando(false);
    }
  };

  const handleMarcarPagada = async (factura: Factura) => {
    try {
      await updateEstado(factura.id, "pagada");
      toast.success(`Factura ${factura.numero} marcada como pagada`);
      await fetchFacturas();
    } catch {
      toast.error("Error al actualizar el estado");
    }
  };

  // ── Factura mensual ────────────────────────────────────────────────────────
  const handleDialogMensualOpenChange = (open: boolean) => {
    setDialogMensualOpen(open);
    if (!open) {
      setSearchMensual("");
      setClienteMensual(undefined);
      setCitasMensual([]);
      setSeleccionadas(new Set());
    }
  };

  const handleBuscarClienteMensual = async () => {
    const q = searchMensual.trim();
    if (!q) return;
    setBuscandoMensual(true);
    try {
      const { data: clientes } = await supabase
        .from("clientes")
        .select("*")
        .or(`nombre.ilike.%${q}%,apellidos.ilike.%${q}%,telefono.ilike.%${q}%`)
        .limit(1);

      const cliente = (clientes as Cliente[])?.[0] ?? null;
      setClienteMensual(cliente);

      if (!cliente) {
        setCitasMensual([]);
        setSeleccionadas(new Set());
        return;
      }

      const { data: citasListo } = await supabase
        .from("citas")
        .select("*, servicios(*), vehiculos(*)")
        .eq("cliente_id", cliente.id)
        .eq("estado", "listo")
        .order("fecha", { ascending: false });

      const { data: facturasExistentes } = await supabase
        .from("facturas")
        .select("cita_id");

      const citaIdsFacturadas = new Set(
        ((facturasExistentes ?? []) as { cita_id: string }[]).map((f) => f.cita_id)
      );

      const disponibles = ((citasListo as Cita[]) ?? []).filter(
        (c) => !citaIdsFacturadas.has(c.id)
      );
      setCitasMensual(disponibles);
      setSeleccionadas(new Set(disponibles.map((c) => c.id)));
    } finally {
      setBuscandoMensual(false);
    }
  };

  const handleToggleCita = (citaId: string) => {
    setSeleccionadas((prev) => {
      const next = new Set(prev);
      if (next.has(citaId)) next.delete(citaId);
      else next.add(citaId);
      return next;
    });
  };

  const handleCrearMensual = async () => {
    if (!clienteMensual || seleccionadas.size === 0) return;
    setCreandoMensual(true);
    try {
      const citaIds = Array.from(seleccionadas);
      const nuevaFactura = await createFacturaMensal(clienteMensual.id, citaIds);
      const citasSelec = citasMensual.filter((c) => seleccionadas.has(c.id));
      generatePDFMensal(nuevaFactura, citasSelec);
      toast.success(`Factura mensual ${nuevaFactura.numero} creada y descargada`);
      handleDialogMensualOpenChange(false);
      await fetchFacturas();
    } catch (err) {
      console.error(err);
      toast.error("Error al crear la factura mensual");
    } finally {
      setCreandoMensual(false);
    }
  };

  // ── Computed ───────────────────────────────────────────────────────────────
  const facturasFiltradas = facturas.filter((f) =>
    filtro === "todas" ? true : f.estado === filtro
  );

  const precioFinal = Number(citaSeleccionada?.precio_final ?? 0);
  const base  = parseFloat((precioFinal / 1.21).toFixed(2));
  const iva   = parseFloat((precioFinal - base).toFixed(2));

  const totalMensual = citasMensual
    .filter((c) => seleccionadas.has(c.id))
    .reduce((s, c) => s + Number(c.precio_final ?? 0), 0);

  return (
    <PageLayout title="Facturación">
      {/* Filter + actions bar */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex gap-1 bg-card border border-border rounded-lg p-1">
          {filtros.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFiltro(key)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                filtro === key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDialogMensualOpen(true)} className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Factura Mensual
          </Button>
          <Button onClick={handleOpenDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva Factura
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      ) : facturasFiltradas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <FileText className="h-12 w-12 mb-4 opacity-20" />
          <p className="text-base font-medium">No hay facturas</p>
          <p className="text-sm mt-1 opacity-60">
            {filtro === "todas"
              ? "Crea la primera factura desde una cita completada"
              : `No hay facturas con estado "${estadoLabel[filtro as Factura["estado"]]}"`}
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Factura</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Base</TableHead>
                <TableHead className="text-right">IVA 21%</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facturasFiltradas.map((factura) => (
                <TableRow key={factura.id}>
                  <TableCell className="font-mono font-medium text-sm">
                    {factura.numero}
                  </TableCell>
                  <TableCell className="text-sm">
                    {factura.clientes
                      ? `${factura.clientes.nombre} ${factura.clientes.apellidos}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {factura.citas?.servicios?.nombre ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(factura.fecha_emision), "dd MMM yyyy", { locale: es })}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {Number(factura.base_imponible).toFixed(2)} €
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {Number(factura.iva).toFixed(2)} €
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {Number(factura.total).toFixed(2)} €
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoBadgeClass[factura.estado]}`}
                    >
                      {estadoLabel[factura.estado]}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => generatePDF(factura)}
                        title="Descargar PDF"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {factura.estado === "emitida" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarcarPagada(factura)}
                          className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                          title="Marcar como pagada"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* ── Nueva Factura Dialog ─────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Factura</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">
                Cita completada sin facturar
              </label>
              {citasDisponibles.length === 0 ? (
                <p className="text-sm text-muted-foreground bg-muted rounded-lg px-4 py-3">
                  No hay citas completadas pendientes de facturar
                </p>
              ) : (
                <Select value={citaSelectValue} onValueChange={handleSelectCita}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una cita..." />
                  </SelectTrigger>
                  <SelectContent>
                    {citasDisponibles.map((cita) => (
                      <SelectItem key={cita.id} value={cita.id}>
                        {cita.clientes?.nombre} {cita.clientes?.apellidos} ·{" "}
                        {cita.vehiculos?.matricula} ·{" "}
                        {format(new Date(cita.fecha), "dd/MM/yy")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {citaSeleccionada && (
              <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cliente</span>
                  <span className="font-medium">
                    {citaSeleccionada.clientes?.nombre} {citaSeleccionada.clientes?.apellidos}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vehículo</span>
                  <span>
                    {citaSeleccionada.vehiculos?.matricula} —{" "}
                    {citaSeleccionada.vehiculos?.marca} {citaSeleccionada.vehiculos?.modelo}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Servicio</span>
                  <span>{citaSeleccionada.servicios?.nombre}</span>
                </div>
                <div className="border-t border-border pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Base imponible</span>
                    <span>{base.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IVA (21%)</span>
                    <span>{iva.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold border-t border-border pt-2">
                    <span>Total</span>
                    <span className="text-primary">{precioFinal.toFixed(2)} €</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleDialogOpenChange(false)} disabled={creando}>
              Cancelar
            </Button>
            <Button onClick={handleCrearFactura} disabled={!citaSeleccionada || creando} className="gap-2">
              {creando ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Creando...</>
              ) : (
                <><Download className="h-4 w-4" />Crear y Descargar PDF</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Factura Mensual Dialog ───────────────────────────────────────────── */}
      <Dialog open={dialogMensualOpen} onOpenChange={handleDialogMensualOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Factura Mensual
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-5">
            {/* Client search */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Buscar cliente</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Nombre, apellidos o teléfono..."
                  value={searchMensual}
                  onChange={(e) => setSearchMensual(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleBuscarClienteMensual()}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={handleBuscarClienteMensual}
                  disabled={buscandoMensual || !searchMensual.trim()}
                  className="gap-1.5"
                >
                  {buscandoMensual ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  Buscar
                </Button>
              </div>
            </div>

            {clienteMensual === null && (
              <p className="text-sm text-muted-foreground bg-muted rounded-lg px-4 py-3">
                No se encontró ningún cliente con esa búsqueda.
              </p>
            )}

            {clienteMensual && (
              <>
                <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {clienteMensual.nombre} {clienteMensual.apellidos}
                    </p>
                    <p className="text-xs text-muted-foreground">{clienteMensual.telefono}</p>
                  </div>
                  {clienteMensual.nif && (
                    <p className="text-xs text-muted-foreground">NIF: {clienteMensual.nif}</p>
                  )}
                </div>

                {citasMensual.length === 0 ? (
                  <p className="text-sm text-muted-foreground bg-muted rounded-lg px-4 py-3">
                    Este cliente no tiene citas completadas pendientes de facturar.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-muted-foreground">
                        Citas a incluir ({seleccionadas.size} de {citasMensual.length})
                      </label>
                      <button
                        className="text-xs text-primary hover:underline"
                        onClick={() => {
                          if (seleccionadas.size === citasMensual.length) {
                            setSeleccionadas(new Set());
                          } else {
                            setSeleccionadas(new Set(citasMensual.map((c) => c.id)));
                          }
                        }}
                      >
                        {seleccionadas.size === citasMensual.length ? "Deseleccionar todas" : "Seleccionar todas"}
                      </button>
                    </div>
                    <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
                      {citasMensual.map((cita) => (
                        <label
                          key={cita.id}
                          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition"
                        >
                          <Checkbox
                            checked={seleccionadas.has(cita.id)}
                            onCheckedChange={() => handleToggleCita(cita.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {cita.vehiculos?.matricula} — {cita.servicios?.nombre}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(cita.fecha), "dd MMM yyyy", { locale: es })}
                            </p>
                          </div>
                          <span className="text-sm font-semibold text-primary flex-shrink-0">
                            {Number(cita.precio_final ?? 0).toFixed(2)} €
                          </span>
                        </label>
                      ))}
                    </div>

                    {seleccionadas.size > 0 && (
                      <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Base imponible</span>
                          <span>{(totalMensual / 1.21).toFixed(2)} €</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">IVA (21%)</span>
                          <span>{(totalMensual - totalMensual / 1.21).toFixed(2)} €</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold border-t border-border pt-2">
                          <span>Total</span>
                          <span className="text-primary">{totalMensual.toFixed(2)} €</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex-shrink-0 border-t border-border px-6 py-4 flex justify-end gap-3 bg-background">
            <Button variant="outline" onClick={() => handleDialogMensualOpenChange(false)} disabled={creandoMensual}>
              Cancelar
            </Button>
            <Button
              onClick={handleCrearMensual}
              disabled={!clienteMensual || seleccionadas.size === 0 || creandoMensual}
              className="gap-2"
            >
              {creandoMensual ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Creando...</>
              ) : (
                <><Download className="h-4 w-4" />Crear Factura Mensual y PDF</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default FacturacionPage;
