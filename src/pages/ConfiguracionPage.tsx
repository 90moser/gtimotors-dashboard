import PageLayout from "@/components/PageLayout";
import { Settings } from "lucide-react";

const ConfiguracionPage = () => (
  <PageLayout title="Configuración">
    <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
      <Settings className="h-12 w-12 mb-4 opacity-30" />
      <p className="text-lg font-medium">Configuración — En construcción</p>
      <p className="text-sm mt-1 opacity-60">Próximamente: servicios, horarios y perfil</p>
    </div>
  </PageLayout>
);

export default ConfiguracionPage;
