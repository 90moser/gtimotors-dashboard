import { useState } from 'react';
import { Bell, Menu, X, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificaciones } from '@/hooks/useNotificaciones';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TopbarProps {
  title: string;
  onMenuClick?: () => void;
}

const Topbar = ({ title, onMenuClick }: TopbarProps) => {
  const { user } = useAuth();
  const initials = user?.email ? user.email.substring(0, 2).toUpperCase() : 'GT';
  const { notificaciones, noLidas, marcarTodasLidas } = useNotificaciones();
  const [showPanel, setShowPanel] = useState(false);

  const handleBellClick = () => {
    setShowPanel(!showPanel);
    if (!showPanel) marcarTodasLidas();
  };

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-4 md:px-6 flex-shrink-0 relative z-30">
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
        {/* Bell + notification panel */}
        <div className="relative">
          <button
            onClick={handleBellClick}
            className="relative text-muted-foreground hover:text-foreground transition p-1"
          >
            <Bell className="h-5 w-5" />
            {noLidas > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-surface flex items-center justify-center text-[9px] text-white font-bold">
                {noLidas > 9 ? '9+' : noLidas}
              </span>
            )}
          </button>

          {showPanel && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setShowPanel(false)}
              />
              <div className="absolute right-0 top-10 w-80 bg-card border border-border rounded-xl shadow-2xl z-30 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <h3 className="text-sm font-semibold text-foreground">Notificaciones</h3>
                  <button onClick={() => setShowPanel(false)}>
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notificaciones.length === 0 ? (
                    <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      No hay notificaciones
                    </div>
                  ) : (
                    notificaciones.map((n) => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 border-b border-border/50 last:border-0 ${
                          !n.lida ? 'bg-primary/5' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <Calendar className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">
                              {n.titulo}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {n.mensaje}
                            </p>
                            <p className="text-[10px] text-muted-foreground/60 mt-1">
                              {format(new Date(n.fecha), 'HH:mm · d MMM', { locale: es })}
                            </p>
                          </div>
                          {!n.lida && (
                            <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
          {initials}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
