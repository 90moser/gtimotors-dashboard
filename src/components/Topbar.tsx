import { Bell, Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface TopbarProps {
  title: string;
  onMenuClick?: () => void;
}

const Topbar = ({ title, onMenuClick }: TopbarProps) => {
  const { user } = useAuth();
  const initials = user?.email ? user.email.substring(0, 2).toUpperCase() : "GT";

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-4 md:px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden text-muted-foreground hover:text-foreground transition p-1"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-foreground text-xl font-bold">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative text-muted-foreground hover:text-foreground transition">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-surface" />
        </button>
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
          {initials}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
