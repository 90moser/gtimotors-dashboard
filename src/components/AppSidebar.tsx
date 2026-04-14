import { useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Car,
  FileText,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";
import GTILogo from "@/components/GTILogo";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Inicio", path: "/dashboard", icon: LayoutDashboard },
  { title: "Agenda", path: "/dashboard/agenda", icon: CalendarDays },
  { title: "Vehículos", path: "/dashboard/vehiculos", icon: Car },
  { title: "Facturación", path: "/dashboard/facturacion", icon: FileText },
  { title: "Finanzas", path: "/dashboard/finanzas", icon: BarChart3 },
  { title: "Configuración", path: "/dashboard/configuracion", icon: Settings },
];

const AppSidebar = () => {
  const location = useLocation();

  return (
    <aside className="hidden md:flex flex-col w-[260px] min-h-screen bg-surface border-r border-border flex-shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-5">
        <GTILogo size="sm" />
      </div>

      {/* User */}
      <div className="px-5 py-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
          JD
        </div>
        <div>
          <p className="text-foreground text-sm font-semibold leading-tight">Juan Delgado</p>
          <p className="text-muted-foreground text-xs">Administrador</p>
        </div>
      </div>

      <div className="mx-5 h-px bg-border" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 h-11 px-3 rounded-lg text-sm font-medium transition-colors relative",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-primary" />
              )}
              <item.icon className="h-[18px] w-[18px]" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-6">
        <Link
          to="/"
          className="flex items-center gap-3 h-11 px-3 rounded-lg text-sm text-[#555555] hover:text-muted-foreground transition-colors"
        >
          <LogOut className="h-[18px] w-[18px]" />
          <span>Cerrar sesión</span>
        </Link>
      </div>
    </aside>
  );
};

export default AppSidebar;
