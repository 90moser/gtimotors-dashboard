import PageLayout from "@/components/PageLayout";
import { CalendarDays } from "lucide-react";

const AgendaPage = () => (
  <PageLayout title="Agenda">
    <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
      <CalendarDays className="h-12 w-12 mb-4 opacity-30" />
      <p className="text-lg font-medium">Agenda — En construcción</p>
      <p className="text-sm mt-1 opacity-60">Próximamente: citas en tiempo real</p>
    </div>
  </PageLayout>
);

export default AgendaPage;
