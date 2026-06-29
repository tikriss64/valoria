import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase, type Analisis } from "@/lib/supabase";
import { fmtDate } from "@/lib/format";
import { Thumb } from "@/components/Thumb";
import { LangFlag, PlanBadge, QualityBadge } from "@/components/Badges";
import { DetailPanel } from "@/components/DetailPanel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { startOfDay } from "date-fns";

export const Route = createFileRoute("/_app/")({
  component: Dashboard,
});

const PAGE = 20;

function Dashboard() {
  const [rows, setRows] = useState<Analisis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Analisis | null>(null);

  // Filters
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [calidad, setCalidad] = useState<string>("all");
  const [idioma, setIdioma] = useState<string>("all");
  const [tipo, setTipo] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  // Stats
  const [total, setTotal] = useState(0);
  const [today, setToday] = useState(0);
  const [pending, setPending] = useState(0);
  const [toReview, setToReview] = useState(0);

  async function loadStats() {
    const todayIso = startOfDay(new Date()).toISOString();
    const [a, b, c, d] = await Promise.all([
      supabase.from("analisis").select("id", { count: "exact", head: true }),
      supabase.from("analisis").select("id", { count: "exact", head: true }).gte("created_at", todayIso),
      supabase.from("analisis").select("id", { count: "exact", head: true }).eq("calidad", "pendiente"),
      supabase.from("analisis").select("id", { count: "exact", head: true }).eq("calidad", "revisar"),
    ]);
    setTotal(a.count ?? 0);
    setToday(b.count ?? 0);
    setPending(c.count ?? 0);
    setToReview(d.count ?? 0);
  }

  async function load() {
    setLoading(true);
    let q = supabase
      .from("analisis")
      .select("*")
      .order("created_at", { ascending: false })
      .range(page * PAGE, page * PAGE + PAGE - 1);
    if (from) q = q.gte("created_at", new Date(from).toISOString());
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      q = q.lte("created_at", end.toISOString());
    }
    if (calidad !== "all") q = q.eq("calidad", calidad);
    if (idioma !== "all") q = q.eq("idioma", idioma);
    if (tipo !== "all") q = q.eq("tipo", tipo);
    if (search.trim()) {
      const s = search.trim().replace(/,/g, "");
      q = q.or(`email.ilike.%${s}%,nombre.ilike.%${s}%`);
    }
    const { data, error } = await q;
    if (!error) setRows((data || []) as Analisis[]);
    setLoading(false);
  }

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to, calidad, idioma, tipo, search, page]);

  const todayStart = useMemo(() => startOfDay(new Date()).getTime(), []);

  function onUpdated(a: Analisis) {
    setRows((r) => r.map((x) => (x.id === a.id ? a : x)));
    setSelected(a);
    loadStats();
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      <header>
        <h1 className="text-2xl font-bold text-[var(--petroleo)]">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Vista general de los análisis recibidos.</p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Total análisis" value={total} />
        <StatCard label="Hoy" value={today} />
        <StatCard
          label="Pendientes de revisión"
          value={pending}
          highlight={pending > 0 ? "gold" : undefined}
        />
        <StatCard
          label="A revisar"
          value={toReview}
          highlight={toReview > 0 ? "red" : undefined}
        />
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-lg p-4 grid gap-3 md:grid-cols-2 lg:grid-cols-6">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Desde</label>
          <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(0); }} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Hasta</label>
          <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(0); }} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Calidad</label>
          <Select value={calidad} onValueChange={(v) => { setCalidad(v); setPage(0); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="correcto">Correcto</SelectItem>
              <SelectItem value="revisar">A revisar</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Idioma</label>
          <Select value={idioma} onValueChange={(v) => { setIdioma(v); setPage(0); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="es">🇪🇸 Español</SelectItem>
              <SelectItem value="fr">🇫🇷 Français</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Plan</label>
          <Select value={tipo} onValueChange={(v) => { setTipo(v); setPage(0); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="gratuito">Gratuito</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Buscar</label>
          <Input
            placeholder="email o nombre…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-muted-foreground">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium">Fecha</th>
                <th className="px-3 py-2 font-medium">Foto</th>
                <th className="px-3 py-2 font-medium">Cliente</th>
                <th className="px-3 py-2 font-medium">Idioma</th>
                <th className="px-3 py-2 font-medium">Plan</th>
                <th className="px-3 py-2 font-medium">Fotos</th>
                <th className="px-3 py-2 font-medium">Calidad</th>
                <th className="px-3 py-2 font-medium">Email</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="text-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin inline" />
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-muted-foreground">
                    Sin resultados.
                  </td>
                </tr>
              )}
              {!loading && rows.map((r) => {
                const isToday = new Date(r.created_at).getTime() >= todayStart;
                const isRevisar = r.calidad === "revisar";
                return (
                  <tr
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className={`cursor-pointer border-t border-border hover:bg-muted/40 transition-colors ${
                      isRevisar ? "bg-[var(--naranja)]/5" : ""
                    } ${isToday ? "border-l-4 border-l-[var(--dorado)]" : ""}`}
                  >
                    <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                      {fmtDate(r.created_at)}
                    </td>
                    <td className="px-3 py-2">
                      <Thumb url={r.thumbnail_url} size={40} />
                    </td>
                    <td className="px-3 py-2 max-w-[260px]">
                      <div className="font-medium truncate">{r.nombre || "—"}</div>
                      <div className="text-xs text-muted-foreground truncate">{r.email}</div>
                    </td>
                    <td className="px-3 py-2"><LangFlag value={r.idioma} /></td>
                    <td className="px-3 py-2"><PlanBadge value={r.tipo} /></td>
                    <td className="px-3 py-2 text-center">{r.num_fotos ?? 0}</td>
                    <td className="px-3 py-2"><QualityBadge value={r.calidad} /></td>
                    <td className="px-3 py-2 text-center">
                      {r.email_enviado && (
                        <Check className="h-4 w-4 text-[var(--verde)] inline" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-3 py-2 border-t border-border text-sm">
          <span className="text-muted-foreground">Página {page + 1}</span>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={rows.length < PAGE}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <DetailPanel
        item={selected}
        onClose={() => setSelected(null)}
        onUpdated={onUpdated}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: "gold" | "red";
}) {
  const ring =
    highlight === "gold"
      ? "ring-2 ring-[var(--dorado)] bg-[var(--dorado)]/10"
      : highlight === "red"
      ? "ring-2 ring-[var(--rojo)] bg-[var(--rojo)]/5"
      : "";
  return (
    <div className={`bg-card border border-border rounded-lg p-4 ${ring}`}>
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className="text-3xl font-bold text-[var(--petroleo)] mt-1">{value}</div>
    </div>
  );
}
