import { useLocation, Link, useNavigate } from "react-router-dom";
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
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const navItems = [
  { title: "Inicio",        path: "/dashboard",               icon: LayoutDashboard },
  { title: "Agenda",        path: "/dashboard/agenda",        icon: CalendarDays },
  { title: "Vehículos",     path: "/dashboard/vehiculos",     icon: Car },
  { title: "Facturación",   path: "/dashboard/facturacion",   icon: FileText },
  { title: "Finanzas",      path: "/dashboard/finanzas",      icon: BarChart3 },
  { title: "Configuración", path: "/dashboard/configuracion", icon: Settings },
];

interface AppSidebarProps {
  mobile?: boolean;
  onClose?: () => void;
}

const AppSidebar = ({ mobile = false, onClose }: AppSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const userEmail = user?.email ?? "";
  const initials = userEmail ? userEmail.substring(0, 2).toUpperCase() : "GT";

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
      toast.success("Sesión cerrada correctamente");
    } catch {
      toast.error("Error al cerrar sesión");
    }
  };

  return (
    <aside
      className={
        mobile
          ? "flex flex-col w-full min-h-screen bg-surface"
          : "hidden md:flex flex-col w-[260px] min-h-screen bg-surface border-r border-border flex-shrink-0"
      }
    >
      {/* Logo — only shown in desktop mode; mobile header is rendered by PageLayout */}
      {!mobile && (
        <div className="h-16 flex items-center px-5">
          <GTILogo size="sm" />
        </div>
      )}

      {/* Usuario autenticado */}
      <div className="px-5 py-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-foreground text-sm font-semibold leading-tight truncate">
            GTIMotors
          </p>
          <p className="text-muted-foreground text-xs truncate">
            {userEmail || "Administrador"}
          </p>
        </div>
      </div>

      <div className="mx-5 h-px bg-border" />

      {/* Navegación */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={mobile ? onClose : undefined}
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
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 h-11 px-3 rounded-lg text-sm text-[#555555] hover:text-muted-foreground hover:bg-muted/20 transition-colors"
        >
          <LogOut className="h-[18px] w-[18px]" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
