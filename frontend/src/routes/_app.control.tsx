import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import {
  Activity, AlertTriangle, CheckCircle, Clock, Mail,
  RefreshCw, Server, Users, Zap, Inbox, TrendingUp, Wifi, WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/control")({
  component: SalaControlPage,
});

const BACKEND     = "https://valoria-backend-production.up.railway.app";
const ADMIN_TOKEN = "0d4a4c48b6bfb570dfdbba44743d8ac39d67cff1bd0a14cdb485096012a01b29";
const OPENAI_LIMIT = 100; // límite mensual configurado en OpenAI ($)

type StatusData = {
  timestamp: string;
  railway: { status: string; responseMs: number; uptimeHoras: number };
  supabase: {
    status: string; totalAnalisis: number; analisisHoy: number;
    usuariosUnicos: number; ultimoAnalisis: string | null; thumbnails: number;
  };
  openai: { gastoMes: number; estimado: boolean; analisesMes: number };
  resend: { emailsMes: number; emailsHoy: number; limiteDiario: number; limiteMensual: number };
  waitlist: { total: number; nuevosHoy: number };
};

function pct(v: number, max: number) { return Math.min(100, Math.round((v / max) * 100)); }

function alertLevel(v: number, max: number): "ok" | "warn" | "danger" {
  const p = pct(v, max);
  if (p >= 90) return "danger";
  if (p >= 70) return "warn";
  return "ok";
}

function fmtUptime(h: number) {
  if (h < 1) return "< 1 h";
  if (h < 48) return `${h} h`;
  return `${Math.floor(h / 24)} días`;
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}

export default function SalaControlPage() {
  const [data, setData]           = useState<StatusData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`${BACKEND}/admin/status`, {
        headers: { "x-admin-token": ADMIN_TOKEN },
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setData(await r.json());
      setLastUpdate(new Date());
    } catch (e: any) {
      setError(e.message || "Error de conexión");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const iv = setInterval(fetchStatus, 60_000);
    return () => clearInterval(iv);
  }, [fetchStatus]);

  // Calcular nivel de alerta global
  const globalAlert = !data
    ? (error ? "danger" : "loading")
    : (() => {
        if (data.railway.status !== "ok" || data.supabase.status !== "ok") return "danger";
        if (data.openai.gastoMes !== null && alertLevel(data.openai.gastoMes, OPENAI_LIMIT) === "danger") return "danger";
        if (alertLevel(data.resend.emailsHoy, data.resend.limiteDiario) === "danger") return "danger";
        if (data.openai.gastoMes !== null && alertLevel(data.openai.gastoMes, OPENAI_LIMIT) === "warn") return "warn";
        if (alertLevel(data.resend.emailsHoy, data.resend.limiteDiario) === "warn") return "warn";
        if (alertLevel(data.resend.emailsMes, data.resend.limiteMensual) === "warn") return "warn";
        return "ok";
      })();

  const bannerColor =
    globalAlert === "ok"      ? "bg-[var(--verde)]/10 border-[var(--verde)] text-[var(--verde)]"
    : globalAlert === "warn"  ? "bg-[var(--naranja)]/10 border-[var(--naranja)] text-[var(--naranja)]"
    : globalAlert === "danger" ? "bg-[var(--rojo)]/10 border-[var(--rojo)] text-[var(--rojo)]"
    : "bg-muted border-border text-muted-foreground";

  const bannerText =
    globalAlert === "ok"      ? "✅  Todos los servicios operativos"
    : globalAlert === "warn"  ? "⚠️  Atención — algún servicio se acerca a su límite"
    : globalAlert === "danger" ? "🔴  Alerta crítica — revisa los servicios marcados en rojo"
    : "Cargando estado del sistema…";

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">

      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--petroleo)]">Sala de control</h1>
          <p className="text-sm text-muted-foreground">
            Estado en tiempo real de toda la infraestructura ValorIA.
            {lastUpdate && (
              <span className="ml-2 text-xs">
                Actualizado: {lastUpdate.toLocaleTimeString("es-ES")}
              </span>
            )}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchStatus}
          disabled={loading}
          className="shrink-0"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </header>

      {/* Banner global */}
      <div className={`border rounded-xl px-5 py-3 text-sm font-semibold ${bannerColor}`}>
        {bannerText}
      </div>

      {error && (
        <div className="bg-[var(--rojo)]/10 border border-[var(--rojo)] rounded-xl px-5 py-3 text-sm text-[var(--rojo)]">
          <strong>No se pudo conectar al backend:</strong> {error}
          <br />
          <span className="opacity-75">Comprueba que Railway está online y que el ADMIN_TOKEN es correcto.</span>
        </div>
      )}

      {/* ── Servicios ── */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Servicios
        </h2>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">

          {/* Railway */}
          <ServiceCard
            icon={<Server className="h-5 w-5" />}
            title="Railway — Backend"
            status={data ? (data.railway.status === "ok" ? "ok" : "danger") : (error ? "danger" : "loading")}
            lines={data ? [
              `Respuesta: ${data.railway.responseMs} ms`,
              `Uptime: ${fmtUptime(data.railway.uptimeHoras)}`,
            ] : []}
          />

          {/* Supabase */}
          <ServiceCard
            icon={<Activity className="h-5 w-5" />}
            title="Supabase — Base de datos"
            status={data ? (data.supabase.status === "ok" ? "ok" : "danger") : (error ? "danger" : "loading")}
            lines={data ? [
              `${data.supabase.totalAnalisis} análisis guardados`,
              `${data.supabase.thumbnails} miniaturas`,
              `Último: ${fmtDate(data.supabase.ultimoAnalisis)}`,
            ] : []}
          />

          {/* OpenAI */}
          <ServiceCard
            icon={<Zap className="h-5 w-5" />}
            title="OpenAI — IA"
            status={
              !data ? (error ? "danger" : "loading")
              : alertLevel(data.openai.gastoMes, OPENAI_LIMIT) === "ok" ? "ok"
              : alertLevel(data.openai.gastoMes, OPENAI_LIMIT) === "warn" ? "warn"
              : "danger"
            }
            lines={data ? [
              `Estimado mes: ~$${data.openai.gastoMes} / $${OPENAI_LIMIT}`,
              `${data.openai.analisesMes} análisis este mes × $0.05 media`,
              `${pct(data.openai.gastoMes, OPENAI_LIMIT)}% del límite`,
            ] : []}
            progress={
              data
                ? { value: pct(data.openai.gastoMes, OPENAI_LIMIT), level: alertLevel(data.openai.gastoMes, OPENAI_LIMIT) }
                : undefined
            }
          />

          {/* Resend */}
          <ServiceCard
            icon={<Mail className="h-5 w-5" />}
            title="Resend — Emails"
            status={
              !data ? (error ? "danger" : "loading")
              : alertLevel(data.resend.emailsHoy, data.resend.limiteDiario) === "danger" ? "danger"
              : alertLevel(data.resend.emailsMes, data.resend.limiteMensual) === "danger" ? "danger"
              : alertLevel(data.resend.emailsHoy, data.resend.limiteDiario) === "warn" ? "warn"
              : alertLevel(data.resend.emailsMes, data.resend.limiteMensual) === "warn" ? "warn"
              : "ok"
            }
            lines={data ? [
              `Hoy: ${data.resend.emailsHoy} / ${data.resend.limiteDiario} (límite diario)`,
              `Este mes: ${data.resend.emailsMes} / ${data.resend.limiteMensual}`,
            ] : []}
            progress={
              data
                ? { value: pct(data.resend.emailsHoy, data.resend.limiteDiario), level: alertLevel(data.resend.emailsHoy, data.resend.limiteDiario) }
                : undefined
            }
          />
        </div>
      </section>

      {/* ── Stats ── */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Actividad
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MiniStat
            icon={<TrendingUp className="h-4 w-4" />}
            label="Análisis hoy"
            value={data?.supabase.analisisHoy ?? "—"}
          />
          <MiniStat
            icon={<Users className="h-4 w-4" />}
            label="Usuarios únicos"
            value={data?.supabase.usuariosUnicos ?? "—"}
          />
          <MiniStat
            icon={<Mail className="h-4 w-4" />}
            label="Emails enviados hoy"
            value={data?.resend.emailsHoy ?? "—"}
          />
          <MiniStat
            icon={<Inbox className="h-4 w-4" />}
            label="Waitlist Informe Plus"
            value={data?.waitlist.total ?? "—"}
            badge={data?.waitlist.nuevosHoy ? `+${data.waitlist.nuevosHoy} hoy` : undefined}
          />
        </div>
      </section>

      {/* ── Waitlist ── */}
      {data && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Lista de espera — Informe Plus
          </h2>
          <div className="bg-card border border-border rounded-xl p-5">
            {data.waitlist.total === 0 ? (
              <p className="text-sm text-muted-foreground">Todavía no hay emails en la lista de espera.</p>
            ) : (
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-[var(--petroleo)]">{data.waitlist.total}</div>
                <div>
                  <div className="text-sm font-medium">personas esperando el Informe Plus</div>
                  {data.waitlist.nuevosHoy > 0 && (
                    <div className="text-xs text-[var(--dorado)] font-semibold mt-0.5">
                      +{data.waitlist.nuevosHoy} nuevas hoy
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    Visibles en Supabase → tabla <code className="bg-muted px-1 rounded">waitlist</code>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Info Supabase keepalive ── */}
      <section>
        <div className="bg-muted/40 border border-border rounded-xl p-4 flex items-start gap-3">
          <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Keepalive activo.</strong> El backend hace ping a Supabase cada 23 h para evitar que el proyecto gratuito se pause por inactividad. Uptime actual del backend: <strong>{data ? fmtUptime(data.railway.uptimeHoras) : "…"}</strong>.
          </p>
        </div>
      </section>

    </div>
  );
}

// ── Componentes internos ──────────────────────────────────────────────────────

type ServiceStatus = "ok" | "warn" | "danger" | "unknown" | "loading";

function StatusIcon({ status }: { status: ServiceStatus }) {
  if (status === "ok")      return <CheckCircle  className="h-5 w-5 text-[var(--verde)]" />;
  if (status === "warn")    return <AlertTriangle className="h-5 w-5 text-[var(--naranja)]" />;
  if (status === "danger")  return <WifiOff       className="h-5 w-5 text-[var(--rojo)]" />;
  if (status === "loading") return <Wifi          className="h-5 w-5 text-muted-foreground animate-pulse" />;
  return <Clock className="h-5 w-5 text-muted-foreground" />;
}

function statusRing(status: ServiceStatus) {
  if (status === "ok")      return "border-[var(--verde)]/30";
  if (status === "warn")    return "border-[var(--naranja)]/50";
  if (status === "danger")  return "border-[var(--rojo)]/50 bg-[var(--rojo)]/5";
  return "border-border";
}

function progressColor(level: "ok" | "warn" | "danger") {
  if (level === "ok")     return "bg-[var(--verde)]";
  if (level === "warn")   return "bg-[var(--naranja)]";
  return "bg-[var(--rojo)]";
}

function ServiceCard({
  icon, title, status, lines, progress,
}: {
  icon: React.ReactNode;
  title: string;
  status: ServiceStatus;
  lines: string[];
  progress?: { value: number; level: "ok" | "warn" | "danger" };
}) {
  return (
    <div className={`bg-card border rounded-xl p-4 flex flex-col gap-3 ${statusRing(status)}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[var(--petroleo)]">
          {icon}
          <span className="text-sm font-semibold">{title}</span>
        </div>
        <StatusIcon status={status} />
      </div>
      {lines.length > 0 && (
        <ul className="space-y-0.5">
          {lines.map((l, i) => (
            <li key={i} className="text-xs text-muted-foreground">{l}</li>
          ))}
        </ul>
      )}
      {progress && (
        <div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${progressColor(progress.level)}`}
              style={{ width: `${progress.value}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 text-right">{progress.value}%</div>
        </div>
      )}
    </div>
  );
}

function MiniStat({
  icon, label, value, badge,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  badge?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-[var(--petroleo)]">{value}</span>
        {badge && (
          <span className="text-xs font-semibold text-[var(--dorado)] mb-1">{badge}</span>
        )}
      </div>
    </div>
  );
}
