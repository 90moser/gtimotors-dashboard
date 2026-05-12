import PageLayout from "@/components/PageLayout";
import { Car } from "lucide-react";

const VehiculosPage = () => (
  <PageLayout title="Vehículos">
    <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
      <Car className="h-12 w-12 mb-4 opacity-30" />
      <p className="text-lg font-medium">Vehículos — En construcción</p>
      <p className="text-sm mt-1 opacity-60">Próximamente: historial por matrícula</p>
    </div>
  </PageLayout>
);

export default VehiculosPage;
