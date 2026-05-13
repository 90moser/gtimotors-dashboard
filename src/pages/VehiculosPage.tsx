import { useState } from "react";
import { Search, Car, Clock, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import PageLayout from "@/components/PageLayout";
import { supabase, type Cliente, type Vehiculo, type Cita } from "@/lib/supabaseClient";
import { toast } from "sonner";

interface VehiculoConHistorial extends Vehiculo {
  citas: Cita[];
}

const VehiculosPage = () => {
  const [matricula, setMatricula] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [vehiculos, setVehiculos] = useState<VehiculoConHistorial[]>([]);
  const [buscado, setBuscado] = useState(false);

  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matricula.trim()) return;
    setBuscando(true);
    setBuscado(false);
    setCliente(null);
    setVehiculos([]);

    try {
      const { data: vehs } = await supabase
        .from("vehiculos")
        .select("*, clientes(*)")
        .ilike("matricula", `%${matricula.trim()}%`)
        .limit(1);

      const veh = vehs?.[0] ?? null;

      if (!veh) {
        setBuscado(true);
        return;
      }

      setCliente(veh.clientes as Cliente);

      const { data: todosVehiculos } = await supabase
        .from("vehiculos")
        .select("*")
        .eq("cliente_id", veh.cliente_id);

      const vehiculosConHistorial: VehiculoConHistorial[] = [];

      for (const v of todosVehiculos ?? []) {
        const { data: citas } = await supabase
          .from("citas")
          .select("*, servicios(*)")
          .eq("vehiculo_id", v.id)
          .order("fecha", { ascending: false })
          .order("hora", { ascending: false });
        vehiculosConHistorial.push({ ...v, citas: (citas as Cita[]) ?? [] });
      }

      setVehiculos(vehiculosConHistorial);
      setBuscado(true);
    } catch {
      toast.error("Error al buscar. Inténtalo de nuevo.");
    } finally {
      setBuscando(false);
    }
  };

  const estadoColor: Record<string, string> = {
    espera: "text-amber-500", lavando: "text-blue-500",
    listo: "text-emerald-500", cancelado: "text-muted-foreground",
  };
  const estadoLabel: Record<string, string> = {
    espera: "En espera", lavando: "Lavando", listo: "Listo", cancelado: "Cancelado",
  };
  const tipoLabel: Record<string, string> = {
    turismo: "Turismo", suv: "SUV", monovolumen: "Monovolumen", furgoneta: "Furgoneta",
  };

  return (
    <PageLayout title="Vehículos">
      <div className="max-w-lg mb-8">
        <form onSubmit={handleBuscar} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={matricula}
              onChange={(e) => setMatricula(e.target.value.toUpperCase())}
              placeholder="Buscar por matrícula (ej: 1234ABC)"
              className="w-full h-11 bg-card border border-border rounded-lg pl-10 pr-4 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
            />
          </div>
          <button
            type="submit"
            disabled={buscando}
            className="h-11 px-5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition disabled:opacity-50"
          >
            {buscando ? "Buscando..." : "Buscar"}
          </button>
        </form>
      </div>

      {!buscado && (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Car className="h-12 w-12 mb-4 opacity-20" />
          <p className="text-base font-medium">Busca por matrícula</p>
          <p className="text-sm mt-1 opacity-60">Introduce una matrícula para ver el historial completo</p>
        </div>
      )}

      {buscado && cliente && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
              {cliente.nombre[0]}{cliente.apellidos[0]}
            </div>
            <div>
              <p className="font-semibold text-foreground">{cliente.nombre} {cliente.apellidos}</p>
              <p className="text-sm text-muted-foreground">{cliente.telefono}{cliente.email ? ` · ${cliente.email}` : ""}</p>
              {cliente.nif && <p className="text-xs text-muted-foreground mt-0.5">NIF: {cliente.nif}</p>}
            </div>
          </div>

          {vehiculos.map((v) => (
            <div key={v.id} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                <Car className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">{v.matricula} — {v.marca} {v.modelo}</p>
                  <p className="text-xs text-muted-foreground">{tipoLabel[v.tipo]}{v.color ? ` · ${v.color}` : ""}</p>
                </div>
                <span className="ml-auto text-xs text-muted-foreground">{v.citas.length} visitas</span>
              </div>

              {v.citas.length === 0 ? (
                <div className="flex items-center gap-2 px-5 py-6 text-muted-foreground text-sm">
                  <Clock className="h-4 w-4 opacity-40" />
                  Sin historial de visitas
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {v.citas.map((cita) => (
                    <div key={cita.id} className="flex items-center gap-4 px-5 py-3">
                      <div className="text-right min-w-[64px]">
                        <p className="text-xs font-medium text-foreground">
                          {format(new Date(cita.fecha), "dd MMM yy", { locale: es })}
                        </p>
                        <p className="text-xs text-muted-foreground">{cita.hora?.slice(0, 5)}</p>
                      </div>
                      <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{cita.servicios?.nombre}</p>
                        {cita.notas && <p className="text-xs text-muted-foreground italic">{cita.notas}</p>}
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-medium ${estadoColor[cita.estado]}`}>
                          {estadoLabel[cita.estado]}
                        </span>
                        {cita.precio_final != null && (
                          <p className="text-xs text-muted-foreground">{Number(cita.precio_final).toFixed(2)} €</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {buscado && !cliente && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Car className="h-10 w-10 mb-3 opacity-20" />
          <p className="text-base font-medium">Sin resultados</p>
          <p className="text-sm mt-1 opacity-60">No se encontró ningún vehículo con la matrícula "{matricula}"</p>
        </div>
      )}
    </PageLayout>
  );
};

export default VehiculosPage;
