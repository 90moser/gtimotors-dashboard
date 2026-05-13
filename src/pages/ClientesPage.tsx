import { useEffect, useState, useCallback } from "react";
import {
  Search, Users, ChevronDown, ChevronUp, Plus, Car, Clock, Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import PageLayout from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import NuevaCitaDialog from "@/components/agenda/NuevaCitaDialog";
import { supabase, type Cliente } from "@/lib/supabaseClient";

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

interface CitaResumen {
  id: string;
  precio_final: number | null;
  estado: string;
  fecha: string;
  servicios?: { nombre: string } | null;
  vehiculos?: { matricula: string; marca: string; modelo: string } | null;
}

interface ClienteConCitas extends Cliente {
  citas: CitaResumen[];
}

const estadoColor: Record<string, string> = {
  espera:    "text-amber-500",
  lavando:   "text-blue-500",
  listo:     "text-emerald-500",
  cancelado: "text-muted-foreground",
};
const estadoLabel: Record<string, string> = {
  espera: "En espera", lavando: "Lavando", listo: "Listo", cancelado: "Cancelado",
};

const ClientesPage = () => {
  const [clientes, setClientes] = useState<ClienteConCitas[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [nuevaCitaPhone, setNuevaCitaPhone] = useState<string | null>(null);

  const hoy = format(new Date(), "yyyy-MM-dd");

  const fetchClientes = useCallback(async (q: string) => {
    setLoading(true);
    try {
      let query = supabase
        .from("clientes")
        .select("*, citas(id, precio_final, estado, fecha, servicios(nombre), vehiculos(matricula, marca, modelo))")
        .order("apellidos");

      if (q.trim()) {
        query = query.or(
          `nombre.ilike.%${q.trim()}%,apellidos.ilike.%${q.trim()}%,telefono.ilike.%${q.trim()}%`
        );
      }

      const { data } = await query;
      setClientes((data as ClienteConCitas[]) ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchClientes(search), 300);
    return () => clearTimeout(timer);
  }, [search, fetchClientes]);

  const getStats = (c: ClienteConCitas) => ({
    visitas: c.citas.length,
    totalGastado: c.citas
      .filter((x) => x.estado === "listo")
      .reduce((sum, x) => sum + Number(x.precio_final ?? 0), 0),
  });

  const groupByVehiculo = (citas: CitaResumen[]) => {
    const map = new Map<string, {
      vehiculo: NonNullable<CitaResumen["vehiculos"]>;
      citas: CitaResumen[];
    }>();
    [...citas]
      .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
      .forEach((c) => {
        const key = c.vehiculos?.matricula ?? "__sin_vehiculo__";
        if (!map.has(key)) {
          map.set(key, {
            vehiculo: c.vehiculos ?? { matricula: "?", marca: "?", modelo: "?" },
            citas: [],
          });
        }
        map.get(key)!.citas.push(c);
      });
    return Array.from(map.values());
  };

  return (
    <PageLayout title="Clientes">
      {/* Search */}
      <div className="max-w-md mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, apellidos o teléfono..."
            className="w-full h-11 bg-card border border-border rounded-lg pl-10 pr-4 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      ) : clientes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Users className="h-12 w-12 mb-4 opacity-20" />
          <p className="text-base font-medium">
            {search ? "Sin resultados" : "Aún no hay clientes registrados"}
          </p>
          <p className="text-sm mt-1 opacity-60">
            {search
              ? `No se encontraron clientes con "${search}"`
              : "Los clientes aparecen al crear la primera cita"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {clientes.map((cliente) => {
            const { visitas, totalGastado } = getStats(cliente);
            const isExpanded = expandedId === cliente.id;
            const grupos = groupByVehiculo(cliente.citas);

            return (
              <div key={cliente.id} className="bg-card border border-border rounded-xl overflow-hidden">
                {/* Main row */}
                <div className="flex items-center gap-4 p-4">
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base flex-shrink-0">
                    {cliente.nombre[0]}{cliente.apellidos[0]}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">
                      {cliente.nombre} {cliente.apellidos}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-sm text-muted-foreground">{cliente.telefono}</span>
                      <a
                        href={`https://wa.me/34${cliente.telefono.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors border border-[#25D366]/20"
                      >
                        <WhatsAppIcon />
                        WhatsApp
                      </a>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-4 flex-shrink-0">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                      {visitas} visitas
                    </span>
                    <span className="text-sm font-semibold text-emerald-500 min-w-[70px] text-right">
                      {totalGastado.toFixed(2)} €
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setExpandedId(isExpanded ? null : cliente.id)}
                      className="gap-1.5 hidden sm:flex"
                    >
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      Historial
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setNuevaCitaPhone(cliente.telefono)}
                      className="gap-1.5"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Nueva cita</span>
                    </Button>
                  </div>
                </div>

                {/* Mobile stats + historial */}
                <div className="sm:hidden flex items-center justify-between px-4 pb-3 pt-0 gap-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                      {visitas} visitas
                    </span>
                    <span className="text-sm font-semibold text-emerald-500">
                      {totalGastado.toFixed(2)} €
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setExpandedId(isExpanded ? null : cliente.id)}
                    className="gap-1.5"
                  >
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    Historial
                  </Button>
                </div>

                {/* Expanded historial */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/20">
                    {grupos.length === 0 ? (
                      <div className="flex items-center gap-2 px-5 py-5 text-muted-foreground text-sm">
                        <Clock className="h-4 w-4 opacity-40" />
                        Sin historial de visitas
                      </div>
                    ) : (
                      grupos.map((grupo) => (
                        <div key={grupo.vehiculo.matricula} className="border-b border-border last:border-0">
                          <div className="flex items-center gap-2 px-5 py-3 bg-muted/30">
                            <Car className="h-4 w-4 text-primary" />
                            <span className="text-sm font-semibold text-foreground">
                              {grupo.vehiculo.matricula} — {grupo.vehiculo.marca} {grupo.vehiculo.modelo}
                            </span>
                            <span className="ml-auto text-xs text-muted-foreground">
                              {grupo.citas.length} visitas
                            </span>
                          </div>
                          <div className="divide-y divide-border">
                            {grupo.citas.map((cita) => (
                              <div key={cita.id} className="flex items-center gap-4 px-5 py-2.5">
                                <p className="text-xs font-medium text-muted-foreground min-w-[70px]">
                                  {format(new Date(cita.fecha), "dd MMM yy", { locale: es })}
                                </p>
                                <p className="text-sm text-foreground flex-1">
                                  {cita.servicios?.nombre ?? "—"}
                                </p>
                                <span className={`text-xs font-medium ${estadoColor[cita.estado] ?? "text-muted-foreground"}`}>
                                  {estadoLabel[cita.estado] ?? cita.estado}
                                </span>
                                {cita.precio_final != null && (
                                  <span className="text-xs text-muted-foreground min-w-[50px] text-right">
                                    {Number(cita.precio_final).toFixed(2)} €
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {nuevaCitaPhone !== null && (
        <NuevaCitaDialog
          open
          onClose={() => setNuevaCitaPhone(null)}
          fechaDefault={hoy}
          telefonoInicial={nuevaCitaPhone}
        />
      )}
    </PageLayout>
  );
};

export default ClientesPage;
