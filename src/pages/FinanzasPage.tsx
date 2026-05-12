import PageLayout from "@/components/PageLayout";
import { BarChart3 } from "lucide-react";

const FinanzasPage = () => (
  <PageLayout title="Finanzas">
    <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
      <BarChart3 className="h-12 w-12 mb-4 opacity-30" />
      <p className="text-lg font-medium">Finanzas — En construcción</p>
      <p className="text-sm mt-1 opacity-60">Próximamente: dashboard financiero con gráficos</p>
    </div>
  </PageLayout>
);

export default FinanzasPage;
