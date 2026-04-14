import { CalendarCheck, Car, TrendingUp, Star, Clock, CalendarDays } from "lucide-react";
import PageLayout from "@/components/PageLayout";
import StatCard from "@/components/StatCard";

const DashboardPage = () => {
  return (
    <PageLayout title="Inicio">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard title="Citas Hoy" value="0" icon={CalendarCheck} accentColor />
        <StatCard title="Vehículos en Taller" value="0" icon={Car} />
        <StatCard title="Facturación del Mes" value="0 €" icon={TrendingUp} />
        <StatCard title="Clientes VIP" value="0" icon={Star} />
      </div>

      {/* Activity panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-foreground font-semibold text-lg mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Actividad Reciente
          </h2>
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
              <Clock className="h-7 w-7" />
            </div>
            <p className="text-sm">No hay actividad reciente</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-foreground font-semibold text-lg mb-4 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
            Citas Próximas
          </h2>
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
              <CalendarDays className="h-7 w-7" />
            </div>
            <p className="text-sm">No hay citas programadas</p>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default DashboardPage;
