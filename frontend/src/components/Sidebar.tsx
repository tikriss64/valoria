import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, BarChart3, Search, LogOut, RadioTower } from "lucide-react";
import { logout } from "@/lib/auth";

const items = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/estadisticas", label: "Estadísticas", icon: BarChart3 },
  { to: "/busqueda", label: "Búsqueda", icon: Search },
  { to: "/control", label: "Sala de control", icon: RadioTower },
] as const;

export function Sidebar() {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col bg-[var(--petroleo)] text-[var(--sidebar-foreground)]">
      <div className="px-5 py-6 border-b border-[var(--sidebar-border)]">
        <div className="text-[var(--dorado)] text-xl font-bold tracking-tight">
          ValorIA <span className="opacity-70 font-normal">QC</span>
        </div>
        <div className="text-xs opacity-60 mt-1">Control de calidad</div>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {items.map((it) => {
          const active = path === it.to;
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? "bg-[var(--sidebar-accent)] text-[var(--dorado)]"
                  : "hover:bg-[var(--sidebar-accent)]/60"
              }`}
            >
              <Icon className="h-4 w-4" />
              {it.label}
            </Link>
          );
        })}
        <button
          onClick={() => {
            logout();
            navigate({ to: "/login" });
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-[var(--sidebar-accent)]/60 mt-4"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </nav>
      <div className="px-5 py-4 text-xs opacity-50 border-t border-[var(--sidebar-border)]">
        ValorIA · Panel interno
      </div>
    </aside>
  );
}
