import { cn } from "@/lib/utils";

export function QualityBadge({ value }: { value: string | null }) {
  const v = value ?? "pendiente";
  const map: Record<string, { label: string; cls: string }> = {
    pendiente: { label: "Pendiente", cls: "bg-muted text-muted-foreground" },
    correcto: { label: "Correcto ✓", cls: "bg-[var(--verde)]/15 text-[var(--verde)]" },
    revisar: { label: "⚠ Revisar", cls: "bg-[var(--naranja)]/15 text-[var(--naranja)]" },
  };
  const cfg = map[v] ?? map.pendiente;
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap",
        cfg.cls,
      )}
    >
      {cfg.label}
    </span>
  );
}

export function PlanBadge({ value }: { value: string | null }) {
  const isPro = value === "pro";
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide",
        isPro
          ? "bg-[var(--petroleo)] text-[var(--dorado)]"
          : "bg-secondary text-secondary-foreground",
      )}
    >
      {isPro ? "Pro" : "Gratuito"}
    </span>
  );
}

export function LangFlag({ value }: { value: string | null }) {
  return <span className="text-base">{value === "fr" ? "🇫🇷" : "🇪🇸"}</span>;
}
