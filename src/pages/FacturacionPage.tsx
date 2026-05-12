import PageLayout from "@/components/PageLayout";
import { FileText } from "lucide-react";

const FacturacionPage = () => (
  <PageLayout title="Facturación">
    <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
      <FileText className="h-12 w-12 mb-4 opacity-30" />
      <p className="text-lg font-medium">Facturación — En construcción</p>
      <p className="text-sm mt-1 opacity-60">Próximamente: facturas PDF con IVA</p>
    </div>
  </PageLayout>
);

export default FacturacionPage;
