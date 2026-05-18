import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import GTILogo from "@/components/GTILogo";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

const LoginPage = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Completa todos los campos");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("Email o contraseña incorrectos");
        } else {
          toast.error(error.message);
        }
        return;
      }

      navigate("/dashboard");
    } catch {
      toast.error("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Red accent line */}
      <div className="hidden lg:block w-1 bg-primary flex-shrink-0" />

      {/* Left side - Image */}
      <div className="hidden lg:block relative flex-[6]">
        <img
          src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200"
          alt="Luxury car showroom"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to right, rgba(0,0,0,0.3), rgba(26,26,26,1))",
          }}
        />
        <div className="absolute bottom-6 left-6 text-muted-foreground text-xs tracking-wider">
          Vigo, España
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-[4] bg-background flex items-center justify-center p-8 min-h-screen">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-2">
            <GTILogo size="lg" />
          </div>
          <p className="text-center text-muted-foreground text-[13px] tracking-[1px] mb-12">
            Gestión Inteligente. Presencia Premium.
          </p>

          {/* Heading */}
          <h1 className="text-foreground text-2xl font-bold mb-1">Bienvenido de nuevo</h1>
          <p className="text-muted-foreground text-sm mb-8">Accede a tu panel de control</p>

          {/* Login form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-muted-foreground text-sm mb-1.5 block">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                disabled={loading}
                className="w-full h-12 bg-card border border-border rounded-lg px-4 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition disabled:opacity-50"
              />
            </div>

            <div>
              <label className="text-muted-foreground text-sm mb-1.5 block">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full h-12 bg-card border border-border rounded-lg px-4 pr-12 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[52px] bg-primary text-primary-foreground font-bold rounded-lg hover:bg-[hsl(4,78%,55%)] transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Iniciar sesión"
              )}
            </button>
          </form>

          <p className="text-center text-[#555555] text-xs mt-12">
            Acceso restringido a personal autorizado
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
