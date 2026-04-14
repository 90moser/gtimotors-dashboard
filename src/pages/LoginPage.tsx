import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import GTILogo from "@/components/GTILogo";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to dashboard
    window.location.href = "/dashboard";
  };

  const handleGoogleLogin = () => {
    window.location.href = "/dashboard";
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

          {/* Google button */}
          <button
            onClick={handleGoogleLogin}
            className="w-full h-[52px] bg-foreground text-background font-bold rounded-lg flex items-center justify-center gap-3 hover:shadow-lg transition-shadow"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continuar con Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-muted-foreground text-sm">o</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Login form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-muted-foreground text-sm mb-1.5 block">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full h-12 bg-card border border-border rounded-lg px-4 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
              />
            </div>
            <div>
              <label className="text-muted-foreground text-sm mb-1.5 block">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 bg-card border border-border rounded-lg px-4 pr-12 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
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
              className="w-full h-[52px] bg-primary text-primary-foreground font-bold rounded-lg hover:bg-[hsl(4,78%,55%)] transition-colors"
            >
              Iniciar sesión
            </button>
          </form>

          <div className="text-right mt-3">
            <a href="#" className="text-primary text-sm hover:underline">¿Olvidaste tu contraseña?</a>
          </div>

          <p className="text-center text-[#555555] text-xs mt-12">
            © 2025 GTIMotors · Todos los derechos reservados
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
