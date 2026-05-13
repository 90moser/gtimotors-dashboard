import { useEffect, useState } from "react";
import { Settings, Building2, Edit2, Loader2 } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase, type Servicio } from "@/lib/supabaseClient";
import { toast } from "sonner";

type PrecioKey = "precio_turismo" | "precio_suv" | "precio_monovolumen" | "precio_furgoneta";

const PRECIO_CAMPOS: { key: PrecioKey; label: string }[] = [
  { key: "precio_turismo",     label: "Turismo" },
  { key: "precio_suv",         label: "SUV" },
  { key: "precio_monovolumen", label: "Monovolumen" },
  { key: "precio_furgoneta",   label: "Furgoneta" },
];

type ServicioForm = {
  nombre: string;
  descripcion: string;
  duracion_minutos: string;
  precio_turismo: string;
  precio_suv: string;
  precio_monovolumen: string;
  precio_furgoneta: string;
};

const toForm = (s: Servicio): ServicioForm => ({
  nombre:            s.nombre,
  descripcion:       s.descripcion ?? "",
  duracion_minutos:  String(s.duracion_minutos),
  precio_turismo:    String(s.precio_turismo),
  precio_suv:        String(s.precio_suv),
  precio_monovolumen: String(s.precio_monovolumen),
  precio_furgoneta:  String(s.precio_furgoneta),
});

const BLANK_FORM: ServicioForm = {
  nombre: "", descripcion: "", duracion_minutos: "",
  precio_turismo: "", precio_suv: "", precio_monovolumen: "", precio_furgoneta: "",
};

const ConfiguracionPage = () => {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<Servicio | null>(null);
  const [form, setForm] = useState<ServicioForm>(BLANK_FORM);
  const [guardando, setGuardando] = useState(false);

  const fetchServicios = async () => {
    setLoading(true);
    const { data } = await supabase.from("servicios").select("*").order("nombre");
    setServicios((data as Servicio[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchServicios(); }, []);

  const handleEditar = (s: Servicio) => {
    setEditando(s);
    setForm(toForm(s));
  };

  const setField = (key: keyof ServicioForm, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleGuardar = async () => {
    if (!editando) return;
    setGuardando(true);
    try {
      const { error } = await supabase
        .from("servicios")
        .update({
          nombre:            form.nombre.trim(),
          descripcion:       form.descripcion.trim() || null,
          duracion_minutos:  parseInt(form.duracion_minutos, 10),
          precio_turismo:    parseFloat(form.precio_turismo),
          precio_suv:        parseFloat(form.precio_suv),
          precio_monovolumen: parseFloat(form.precio_monovolumen),
          precio_furgoneta:  parseFloat(form.precio_furgoneta),
        })
        .eq("id", editando.id);
      if (error) throw error;
      toast.success("Servicio actualizado correctamente");
      setEditando(null);
      await fetchServicios();
    } catch {
      toast.error("Error al guardar el servicio");
    } finally {
      setGuardando(false);
    }
  };

  const handleToggleActivo = async (s: Servicio) => {
    const { error } = await supabase
      .from("servicios")
      .update({ activo: !s.activo })
      .eq("id", s.id);
    if (error) {
      toast.error("Error al actualizar el estado");
    } else {
      await fetchServicios();
    }
  };

  return (
    <PageLayout title="Configuración">
      <div className="space-y-8 max-w-4xl">

        {/* Datos del Negocio */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Datos del Negocio</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { label: "Razón Social", value: "GTIMotors 2020 SLU" },
              { label: "NIF",          value: "B23860984" },
              { label: "Ubicación",    value: "Vigo, España" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                <p className="text-sm font-medium text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Catálogo de Servicios */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Catálogo de Servicios</h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {servicios.map((s) => (
                <div key={s.id} className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-semibold text-foreground">{s.nombre}</p>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                            s.activo
                              ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30"
                              : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          {s.activo ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                      {s.descripcion && (
                        <p className="text-sm text-muted-foreground mb-3">{s.descripcion}</p>
                      )}
                      <div className="flex flex-wrap gap-4 mt-2">
                        {PRECIO_CAMPOS.map(({ key, label }) => (
                          <div key={key} className="text-xs">
                            <span className="text-muted-foreground">{label}: </span>
                            <span className="font-medium text-foreground">
                              {Number(s[key]).toFixed(2)} €
                            </span>
                          </div>
                        ))}
                        <div className="text-xs">
                          <span className="text-muted-foreground">Duración: </span>
                          <span className="font-medium text-foreground">
                            {s.duracion_minutos} min
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Switch
                        checked={s.activo}
                        onCheckedChange={() => handleToggleActivo(s)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditar(s)}
                        className="gap-1.5"
                      >
                        <Edit2 className="h-4 w-4" />
                        Editar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editando} onOpenChange={(open) => { if (!open) setEditando(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Servicio</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input
                value={form.nombre}
                onChange={(e) => setField("nombre", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Descripción</Label>
              <Input
                value={form.descripcion}
                onChange={(e) => setField("descripcion", e.target.value)}
                placeholder="Opcional"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Duración (minutos)</Label>
              <Input
                type="number"
                min={1}
                value={form.duracion_minutos}
                onChange={(e) => setField("duracion_minutos", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {PRECIO_CAMPOS.map(({ key, label }) => (
                <div key={key} className="space-y-1.5">
                  <Label>Precio {label} (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    value={form[key]}
                    onChange={(e) => setField(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditando(null)}
              disabled={guardando}
            >
              Cancelar
            </Button>
            <Button onClick={handleGuardar} disabled={guardando} className="gap-2">
              {guardando ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default ConfiguracionPage;
