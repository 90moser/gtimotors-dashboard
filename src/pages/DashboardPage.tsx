import { useEffect, useState } from "react";
import { CalendarCheck, Car, TrendingUp, Users, Clock, CalendarDays, Receipt } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import PageLayout from "@/components/PageLayout";
import StatCard from "@/components/StatCard";
import { supabase, type Cita } from "@/lib/supabaseClient";

const DashboardPage = () => {
  const [citasHoy, setCitasHoy] = useState(0);
  const [enTaller, setEnTaller] = useState(0);
  const [facturacionMes, setFacturacionMes] = useState(0);
  const [ivaEstimado, setIvaEstimado] = useState(0);
  const [totalClientes, setTotalClientes] = useState(0);
  const [citasRecientes, setCitasRecientes] = useState<Cita[]>([]);
  const [citasProximas, setCitasProximas] = useState<Cita[]>([]);

  const hoy = format(new Date(), "yyyy-MM-dd");
  const inicioMes = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { count: countHoy } = await supabase
          .from("citas")
          .select("*", { count: "exact", head: true })
          .eq("fecha", hoy)
          .neq("estado", "cancelado");
        setCitasHoy(countHoy ?? 0);

        const { count: countTaller } = await supabase
          .from("citas")
          .select("*", { count: "exact", head: true })
          .in("estado", ["espera", "lavando"]);
        setEnTaller(countTaller ?? 0);

        const { data: citasListas } = await supabase
          .from("citas")
          .select("precio_final")
          .eq("estado", "listo")
          .gte("fecha", inicioMes);
        const total = (citasListas ?? []).reduce((sum, c) => sum + Number(c.precio_final ?? 0), 0);
        setFacturacionMes(total);
        const iva = (citasListas ?? []).reduce((sum, c) => {
          const t = Number(c.precio_final ?? 0);
          return sum + (t - t / 1.21);
        }, 0);
        setIvaEstimado(iva);

        const { count: countClientes } = await supabase
          .from("clientes")
          .select("*", { count: "exact", head: true });
        setTotalClientes(countClientes ?? 0);

        const { data: recientes } = await supabase
          .from("citas")
          .select("*, clientes(*), vehiculos(*), servicios(*)")
          .order("updated_at", { ascending: false })
          .limit(5);
        setCitasRecientes((recientes as Cita[]) ?? []);

        const { data: proximas } = await supabase
          .from("citas")
          .select("*, clientes(*), vehiculos(*), servicios(*)")
          .gte("fecha", hoy)
          .eq("estado", "espera")
          .order("fecha")
          .order("hora")
          .limit(5);
        setCitasProximas((proximas as Cita[]) ?? []);
      } catch (error) {
        console.error("Error cargando dashboard:", error);
      }
    };

    fetchData();
  }, [hoy, inicioMes]);

  const estadoColor: Record<string, string> = {
    espera:    "text-amber-500",
    lavando:   "text-blue-500",
    listo:     "text-emerald-500",
    cancelado: "text-muted-foreground",
  };
  const estadoLabel: Record<string, string> = {
    espera: "En espera", lavando: "Lavando", listo: "Listo", cancelado: "Cancelado",
  };

  return (
    <PageLayout title="Inicio">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
        <StatCard title="Citas Hoy"           value={String(citasHoy)}                 icon={CalendarCheck} accentColor />
        <StatCard title="Vehículos en Taller" value={String(enTaller)}                 icon={Car} />
        <StatCard title="Facturación del Mes" value={`${facturacionMes.toFixed(2)} €`} icon={TrendingUp} />
        <StatCard title="IVA Estimado"        value={`${ivaEstimado.toFixed(2)} €`}    icon={Receipt} />
        <StatCard title="Total Clientes"      value={String(totalClientes)}            icon={Users} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-foreground font-semibold text-lg mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Actividad Reciente
          </h2>
          {citasRecientes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Clock className="h-7 w-7 mb-3 opacity-30" />
              <p className="text-sm">No hay actividad reciente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {citasRecientes.map((cita) => (
                <div key={cita.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {cita.clientes?.nombre} {cita.clientes?.apellidos}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {cita.vehiculos?.matricula} · {cita.servicios?.nombre}
                    </p>
                  </div>
                  <span className={`text-xs font-medium ${estadoColor[cita.estado]}`}>
                    {estadoLabel[cita.estado]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-foreground font-semibold text-lg mb-4 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
            Citas Próximas
          </h2>
          {citasProximas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <CalendarDays className="h-7 w-7 mb-3 opacity-30" />
              <p className="text-sm">No hay citas programadas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {citasProximas.map((cita) => (
                <div key={cita.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {cita.clientes?.nombre} {cita.clientes?.apellidos}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {cita.vehiculos?.matricula} · {cita.servicios?.nombre}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-foreground">{cita.hora?.slice(0, 5)}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(cita.fecha), "dd MMM", { locale: es })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default DashboardPage;
