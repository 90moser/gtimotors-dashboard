import { useEffect, useState, useMemo } from "react";
import { format, startOfMonth, startOfYear, subMonths, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { TrendingUp, Receipt, CheckSquare, Calculator } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import PageLayout from "@/components/PageLayout";
import StatCard from "@/components/StatCard";
import { supabase, type Cita } from "@/lib/supabaseClient";

type Periodo = "mes" | "trimestre" | "anio";

const PIE_COLORS = ["#CC0000", "#444444", "#666666", "#888888", "#aaaaaa"];

const PERIODOS: { key: Periodo; label: string }[] = [
  { key: "mes",       label: "Este Mes" },
  { key: "trimestre", label: "Últimos 3 Meses" },
  { key: "anio",      label: "Este Año" },
];

function getStartDate(periodo: Periodo): string {
  const now = new Date();
  if (periodo === "mes")       return format(startOfMonth(now), "yyyy-MM-dd");
  if (periodo === "trimestre") return format(subMonths(now, 3), "yyyy-MM-dd");
  return format(startOfYear(now), "yyyy-MM-dd");
}

const FinanzasPage = () => {
  const [periodo, setPeriodo] = useState<Periodo>("mes");
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from("citas")
          .select("*, servicios(*)")
          .eq("estado", "listo")
          .gte("fecha", getStartDate(periodo))
          .order("fecha");
        setCitas((data as Cita[]) ?? []);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [periodo]);

  const stats = useMemo(() => {
    const ingresos = citas.reduce((s, c) => s + Number(c.precio_final ?? 0), 0);
    const iva = citas.reduce((s, c) => {
      const t = Number(c.precio_final ?? 0);
      return s + (t - t / 1.21);
    }, 0);
    const media = citas.length > 0 ? ingresos / citas.length : 0;
    return { ingresos, iva, cantidad: citas.length, media };
  }, [citas]);

  const barData = useMemo(() => {
    const byMonth: Record<string, number> = {};
    citas.forEach((c) => {
      const key = format(parseISO(c.fecha), "MMM yy", { locale: es });
      byMonth[key] = (byMonth[key] ?? 0) + Number(c.precio_final ?? 0);
    });
    return Object.entries(byMonth).map(([mes, total]) => ({
      mes,
      total: parseFloat(total.toFixed(2)),
    }));
  }, [citas]);

  const pieData = useMemo(() => {
    const bySvc: Record<string, number> = {};
    citas.forEach((c) => {
      const nombre = c.servicios?.nombre ?? "Otro";
      bySvc[nombre] = (bySvc[nombre] ?? 0) + Number(c.precio_final ?? 0);
    });
    return Object.entries(bySvc)
      .map(([nombre, value]) => ({ nombre, value: parseFloat(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value);
  }, [citas]);

  const topServicios = useMemo(() => {
    const bySvc: Record<string, { cantidad: number; total: number }> = {};
    citas.forEach((c) => {
      const nombre = c.servicios?.nombre ?? "Otro";
      if (!bySvc[nombre]) bySvc[nombre] = { cantidad: 0, total: 0 };
      bySvc[nombre].cantidad += 1;
      bySvc[nombre].total += Number(c.precio_final ?? 0);
    });
    return Object.entries(bySvc)
      .map(([nombre, d]) => ({ nombre, cantidad: d.cantidad, total: parseFloat(d.total.toFixed(2)) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [citas]);

  const tooltipStyle = {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8,
    fontSize: 12,
  };

  const emptyChart = (
    <div className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
      Sin datos para el período seleccionado
    </div>
  );

  return (
    <PageLayout title="Finanzas">
      {/* Period filter */}
      <div className="flex gap-1 bg-card border border-border rounded-lg p-1 mb-6 w-fit">
        {PERIODOS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPeriodo(key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
              periodo === key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          title="Ingresos del Período"
          value={`${stats.ingresos.toFixed(2)} €`}
          icon={TrendingUp}
          accentColor
        />
        <StatCard
          title="IVA del Período"
          value={`${stats.iva.toFixed(2)} €`}
          icon={Receipt}
        />
        <StatCard
          title="Citas Completadas"
          value={String(stats.cantidad)}
          icon={CheckSquare}
        />
        <StatCard
          title="Media por Cita"
          value={`${stats.media.toFixed(2)} €`}
          icon={Calculator}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Bar chart */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold text-foreground mb-5">Ingresos por Mes</h2>
          {loading || barData.length === 0 ? emptyChart : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="mes"
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={(v) => `${v} €`}
                  width={60}
                />
                <Tooltip
                  formatter={(v: number) => [`${v.toFixed(2)} €`, "Ingresos"]}
                  contentStyle={tooltipStyle}
                />
                <Bar dataKey="total" fill="#CC0000" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-semibold text-foreground mb-5">Distribución por Servicio</h2>
          {loading || pieData.length === 0 ? emptyChart : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="nombre"
                  cx="50%"
                  cy="45%"
                  outerRadius={75}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => [`${v.toFixed(2)} €`]}
                  contentStyle={tooltipStyle}
                />
                <Legend
                  formatter={(value) => (
                    <span style={{ fontSize: 12, color: "hsl(var(--foreground))" }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top services table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Top Servicios del Período</h2>
        </div>
        {loading || topServicios.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            Sin datos para el período seleccionado
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">#</th>
                <th className="text-left px-6 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Servicio</th>
                <th className="text-right px-6 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Cantidad</th>
                <th className="text-right px-6 py-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody>
              {topServicios.map((s, i) => (
                <tr key={s.nombre} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-3 text-sm text-muted-foreground">{i + 1}</td>
                  <td className="px-6 py-3 text-sm font-medium text-foreground">{s.nombre}</td>
                  <td className="px-6 py-3 text-sm text-right text-muted-foreground">{s.cantidad}</td>
                  <td className="px-6 py-3 text-sm text-right font-semibold">{s.total.toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PageLayout>
  );
};

export default FinanzasPage;
