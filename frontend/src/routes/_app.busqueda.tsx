import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
import { Download, Loader2, Search } from "lucide-react";

export const Route = createFileRoute("/_app/busqueda")({
  component: BusquedaPage,
});

function BusquedaPage() {
  const [q, setQ] = useState("");
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [calidad, setCalidad] = useState("all");
  const [idioma, setIdioma] = useState("all");
  const [tipo, setTipo] = useState("all");
  const [rows, setRows] = useState<Analisis[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Analisis | null>(null);

  async function run() {
    setLoading(true);
    let query = supabase
      .from("analisis")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (q.trim()) query = query.ilike("texto_analisis", `%${q.trim()}%`);
    if (email.trim()) query = query.ilike("email", `%${email.trim()}%`);
    if (nombre.trim()) query = query.ilike("nombre", `%${nombre.trim()}%`);
    if (from) query = query.gte("created_at", new Date(from).toISOString());
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      query = query.lte("created_at", end.toISOString());
    }
    if (calidad !== "all") query = query.eq("calidad", calidad);
    if (idioma !== "all") query = query.eq("idioma", idioma);
    if (tipo !== "all") query = query.eq("tipo", tipo);
    const { data } = await query;
    setRows((data || []) as Analisis[]);
    setLoading(false);
  }

  function exportCsv() {
    const headers = ["email", "nombre", "idioma", "tipo", "calidad", "created_at", "nota_interna"];
    const lines = [headers.join(",")];
    for (const r of rows) {
      const vals = headers.map((h) => {
        const v = (r as any)[h];
        const s = v == null ? "" : String(v).replace(/"/g, '""').replace(/\r?\n/g, " ");
        return `"${s}"`;
      });
      lines.push(vals.join(","));
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `valoria-busqueda-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function onUpdated(a: Analisis) {
    setRows((r) => r.map((x) => (x.id === a.id ? a : x)));
    setSelected(a);
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      <header>
        <h1 className="text-2xl font-bold text-[var(--petroleo)]">Búsqueda avanzada</h1>
        <p className="text-sm text-muted-foreground">
          Busca dentro del texto del análisis (objetos, precios, plataformas…).
        </p>
      </header>

      <div className="bg-card border border-border rounded-lg p-4 grid gap-3 md:grid-cols-3">
        <div className="md:col-span-3 space-y-1">
          <label className="text-xs text-muted-foreground">Texto en el análisis</label>
          <div className="flex gap-2">
            <Input
              placeholder="ej: Vinted, 120€, MacBook…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && run()}
            />
            <Button onClick={run} className="bg-[var(--petroleo)] hover:bg-[var(--petroleo)]/90">
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </div>
        </div>
        <Field label="Email"><Input value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Nombre"><Input value={nombre} onChange={(e) => setNombre(e.target.value)} /></Field>
        <Field label="Desde"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="Hasta"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
        <Field label="Calidad">
          <Select value={calidad} onValueChange={setCalidad}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="correcto">Correcto</SelectItem>
              <SelectItem value="revisar">A revisar</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Idioma">
          <Select value={idioma} onValueChange={setIdioma}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="es">🇪🇸 Español</SelectItem>
              <SelectItem value="fr">🇫🇷 Français</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Plan">
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="gratuito">Gratuito</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {loading ? "Buscando…" : `${rows.length} resultado(s)`}
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={!rows.length}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-6 w-6 animate-spin inline" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {rows.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelected(r)}
              className="text-left bg-card border border-border rounded-lg p-3 hover:shadow-md transition-shadow flex gap-3"
            >
              <Thumb url={r.thumbnail_url} size={72} className="shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <LangFlag value={r.idioma} />
                  <PlanBadge value={r.tipo} />
                  <QualityBadge value={r.calidad} />
                </div>
                <div className="font-medium mt-1 truncate">{r.nombre || "—"}</div>
                <div className="text-xs text-muted-foreground truncate">{r.email}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{fmtDate(r.created_at)}</div>
                <p className="text-xs text-[var(--petroleo)] mt-1 line-clamp-2">
                  {(r.texto_analisis || "").replace(/\n/g, " ").slice(0, 140)}…
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <DetailPanel
        item={selected}
        onClose={() => setSelected(null)}
        onUpdated={onUpdated}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
