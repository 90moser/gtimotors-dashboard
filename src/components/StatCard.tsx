import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  accentColor?: boolean;
}

const StatCard = ({ title, value, icon: Icon, accentColor = false }: StatCardProps) => {
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-2">{value}</p>
        </div>
        <div className={cn(
          "p-3 rounded-lg",
          accentColor ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
