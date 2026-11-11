# Rebranding RSMotors — Relatório

**Data:** 2026-11-11  
**Branch:** main  
**Build:** ✅ `npm run build` sem erros

---

## 1. O que mudou

### Tokens de marca (`src/lib/brand.ts` + `src/index.css`)
Criado ponto de verdade único em `src/lib/brand.ts`.

Variáveis CSS actualizadas em `src/index.css`:

| Token CSS | Antes (GTIMotors) | Depois (RSMotors) |
|---|---|---|
| `--primary` | `hsl(4,64%,46%)` vermelho | `hsl(50,100%,50%)` amarelo #FFD400 |
| `--primary-foreground` | branco | `hsl(0,0%,2%)` preto — contraste AA sobre amarelo |
| `--accent` | vermelho (igual à primary) | `hsl(210,100%,56%)` azul #1E90FF |
| `--ring` | vermelho | azul #1E90FF |
| `--destructive` | vermelho (mesmo que primary) | `hsl(0,68%,47%)` #CC2929 — agora exclusivo para erros |
| `--success` | verde esmeralda | `hsl(199,89%,60%)` aqua #4FC3F7 |
| `--background` | `hsl(0,0%,7%)` cinzento | `hsl(220,20%,5%)` azul-preto |
| `--surface` | `hsl(0,0%,10%)` | `hsl(0,0%,2%)` brand-black (sidebar) |
| `--surface-elevated` | `hsl(0,0%,16.5%)` | `hsl(220,18%,11%)` brand-surface-2 |
| `--card` | `hsl(0,0%,16.5%)` | `hsl(220,18%,11%)` brand-surface-2 |
| `--sidebar-background` | `hsl(0,0%,10%)` | `hsl(0,0%,2%)` brand-black |
| `--sidebar-primary` | vermelho | amarelo |
| `--sidebar-primary-foreground` | branco | preto |
| `--sidebar-ring` | vermelho | azul |

Novos tokens adicionados: `--brand-yellow`, `--brand-blue`, `--brand-aqua`, `--brand-silver`, `--state-danger`.

Tailwind config extendido com `brand.yellow`, `brand.blue`, `brand.aqua`, `brand.silver`, `brand.danger`.

### Componentes actualizados

| Ficheiro | Alteração |
|---|---|
| `src/components/GTILogo.tsx` | "GTI" → "RS" (texto da marca) |
| `src/components/AppSidebar.tsx` | Label "GTIMotors" → "RSMotors"; border usa `--sidebar-border`; cor logout usa `text-muted-foreground/60` |
| `src/pages/LoginPage.tsx` | Tagline → "Lavado y Engrase · Vigo"; hover do botão → `hsl(50,100%,42%)`; footer usa `text-muted-foreground/50` |
| `src/pages/AgendaPage.tsx` | Estados: Espera → silver/neutro; Listo → amarelo/yellow-400; Lavando → azul (mantido) |
| `src/pages/FinanzasPage.tsx` | `PIE_COLORS[0]` #CC0000 → #FFD400; `<Bar fill>` #CC0000 → #FFD400 |
| `index.html` | `<title>` "GTIMotors - Vigo" → "RSMotors · Gestión"; todas as `<meta>` actualizadas; `theme-color` #050505 |

### Verificação de cores
```
grep -rn '#CC0000|#cc0000' src/   → 0 resultados ✅
grep -rn 'text-red-|bg-red-' src/ (excluindo ui/ e toast) → 0 resultados ✅
```

---

## 2. NÃO MODIFICADO — requer dados fiscais do novo dono (RSMotors)

Estes ficheiros contêm dados fiscais e de contacto da **GTIMotors 2020 SLU** (empresa anterior).  
O novo proprietário deve actualizá-los com a sua própria razão social, NIF, morada e telefone.

| Ficheiro | Linha | Conteúdo |
|---|---|---|
| `src/hooks/useFaturas.ts` | 13 | `'GTIMotors 2020 SLU'` — cabeçalho do PDF |
| `src/hooks/useFaturas.ts` | 18 | `'CIF: B23860984'` — NIF/CIF no PDF |
| `src/hooks/useFaturas.ts` | 19 | `'Travesia de Vigo 105 Bajo'` — morada no PDF |
| `src/hooks/useFaturas.ts` | 20 | `'36205, Vigo (Pontevedra), España'` — CP/cidade no PDF |
| `src/hooks/useFaturas.ts` | 21 | `'Tel: 986 13 75 76 · 698 191 512'` — telefones no PDF |
| `src/hooks/useFaturas.ts` | 64 | Linha fiscal completa no footer do PDF |
| `src/pages/ConfiguracionPage.tsx` | 127 | `"GTIMotors 2020 SLU"` — Razón Social visível no painel |
| `src/pages/ConfiguracionPage.tsx` | 128 | `"B23860984"` — NIF visível no painel |
| `supabase/functions/whatsapp-confirmacion/index.ts` | 97 | `'665058633'` — telemóvel da equipa (Andrés) para notificações |
| `supabase/functions/whatsapp-recordatorio/index.ts` | 59 | `GTIMotors` — nome no corpo da mensagem WhatsApp |
| `supabase/functions/whatsapp-recordatorio/index.ts` | 65 | `'Travesia de Vigo 105 Bajo, Vigo'` — morada na mensagem |
| `supabase/functions/whatsapp-recordatorio/index.ts` | 66 | `'986 13 75 76 · 698 191 512'` — telefones na mensagem |

---

## 3. Screenshots

Screenshots não gerados automaticamente (Playwright bloqueado neste ambiente).  
Para gerar:
```bash
npx playwright screenshot --viewport-size="1440,900" http://localhost:5173 docs/rebranding/after/login-1440.png
npx playwright screenshot --viewport-size="390,844"  http://localhost:5173 docs/rebranding/after/login-390.png
# ... repetir para /dashboard, /dashboard/agenda, /dashboard/finanzas, /dashboard/facturacion
```
