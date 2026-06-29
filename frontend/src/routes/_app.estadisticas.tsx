import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase, type Analisis, type Uso } from "@/lib/supabase";
import { subDays, format, startOfDay } from "date-fns";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from "recharts";

export const Route = createFileRoute("/_app/estadisticas")({
  component: EstadisticasPage,
});

const COLORS = {
  petroleo: "#1B3A4B",
  dorado: "#C9A96E",
  verde: "#16A34A",
  naranja: "#D97706",
  rojo: "#DC2626",
  muted: "#9CA3AF",
};

function EstadisticasPage() {
  const [rows, setRows] = useState<Analisis[]>([]);
  const [usos, setUsos] = useState<Uso[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const since = subDays(startOfDay(new Date()), 30).toISOString();
      const [a, u] = await Promise.all([
        supabase
          .from("analisis")
          .select("id,created_at,calidad,idioma,tipo,num_fotos")
          .gte("created_at", since),
        supabase.from("usos").select("*").order("count", { ascending: false }),
      ]);
      setRows((a.data || []) as Analisis[]);
      setUsos((u.data || []) as Uso[]);
      setLoading(false);
    })();
  }, []);

  // Per-day series (last 30 days)
  const daily = (() => {
    const map = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      map.set(d, 0);
    }
    for (const r of rows) {
      const d = format(new Date(r.created_at), "yyyy-MM-dd");
      if (map.has(d)) map.set(d, (map.get(d) || 0) + 1);
    }
    return Array.from(map.entries()).map(([d, count]) => ({
      day: format(new Date(d), "dd/MM"),
      count,
    }));
  })();

  const qDist = ["pendiente", "correcto", "revisar"].map((k) => ({
    name: k,
    value: rows.filter((r) => (r.calidad || "pendiente") === k).length,
  }));
  const langDist = ["es", "fr"].map((k) => ({
    name: k === "es" ? "Español" : "Français",
    value: rows.filter((r) => r.idioma === k).length,
  }));
  const planDist = ["gratuito", "pro"].map((k) => ({
    name: k,
    value: rows.filter((r) => r.tipo === k).length,
  }));
  const avgPhotos =
    rows.length > 0
      ? (rows.reduce((s, r) => s + (r.num_fotos || 0), 0) / rows.length).toFixed(1)
      : "0";

  const topDays = [...daily].sort((a, b) => b.count - a.count).slice(0, 10);
  const repeatUsers = usos.filter((u) => u.count > 1);

  if (loading) return <div className="p-8">Cargando…</div>;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto">
      <header>
        <h1 className="text-2xl font-bold text-[var(--petroleo)]">Estadísticas</h1>
        <p className="text-sm text-muted-foreground">Datos de los últimos 30 días.</p>
      </header>

      <Card title="Análisis por día (últimos 30 días)">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke={COLORS.petroleo}
                strokeWidth={2}
                dot={{ r: 3, fill: COLORS.dorado }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card title="Distribución por calidad">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={qDist} dataKey="value" nameKey="name" outerRadius={80} label>
                  <Cell fill={COLORS.muted} />
                  <Cell fill={COLORS.verde} />
                  <Cell fill={COLORS.naranja} />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Idioma">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={langDist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill={COLORS.petroleo} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Plan">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={planDist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill={COLORS.dorado} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card title="Fotos por análisis (media)">
          <div className="text-5xl font-bold text-[var(--petroleo)] py-6 text-center">
            {avgPhotos}
          </div>
        </Card>
        <Card title="Top 10 días más activos">
          <ul className="text-sm divide-y divide-border">
            {topDays.map((d) => (
              <li key={d.day} className="flex justify-between py-1.5">
                <span>{d.day}</span>
                <span className="font-semibold text-[var(--petroleo)]">{d.count}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card title={`Clientes recurrentes (${repeatUsers.length})`}>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <tbody>
                {repeatUsers.map((u) => (
                  <tr key={u.email} className="border-b border-border">
                    <td className="py-1.5 truncate max-w-[200px]">{u.email}</td>
                    <td className="py-1.5 text-right font-semibold text-[var(--petroleo)]">
                      {u.count}
                    </td>
                  </tr>
                ))}
                {repeatUsers.length === 0 && (
                  <tr>
                    <td className="py-3 text-muted-foreground text-center">
                      Sin clientes recurrentes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-[var(--petroleo)] mb-3">{title}</h3>
      {children}
    </div>
  );
}
