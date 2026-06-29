import { Fragment } from "react";

/**
 * Renders the AI texto_analisis preserving emoji markers as styled blocks.
 */
export function AnalysisRenderer({ text }: { text: string | null }) {
  if (!text) return <p className="text-sm text-muted-foreground">Sin contenido.</p>;
  const lines = text.split(/\r?\n/);
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {lines.map((raw, i) => (
        <Fragment key={i}>{renderLine(raw)}</Fragment>
      ))}
    </div>
  );
}

function renderLine(raw: string) {
  const line = raw.trimEnd();
  if (line.trim() === "") return <div className="h-2" />;

  // Dividers
  if (/^━+$/.test(line.trim())) return <hr className="border-0 border-t border-[var(--dorado)]/60 my-1" />;
  if (/^═+$/.test(line.trim())) return <hr className="border-0 border-t-2 border-[var(--petroleo)]/70 my-1" />;

  // Prefix-based detection (handle leading whitespace)
  const t = line.replace(/^\s+/, "");

  if (t.startsWith("🏷️") || t.startsWith("🏷"))
    return <div className="text-base font-bold text-[var(--petroleo)] mt-3">{t}</div>;

  if (t.startsWith("💶"))
    return (
      <div className="inline-block bg-[var(--dorado)]/20 text-[var(--petroleo)] font-semibold px-3 py-1.5 rounded-md border border-[var(--dorado)]/40">
        {t}
      </div>
    );

  if (t.startsWith("🎯")) {
    const rest = t.slice(2).trim();
    const low = rest.toLowerCase();
    let cls = "bg-muted text-muted-foreground";
    if (/(alta|haute|élevée|elevée)/i.test(low))
      cls = "bg-[var(--verde)]/15 text-[var(--verde)]";
    else if (/(media|moyenne)/i.test(low))
      cls = "bg-[var(--naranja)]/15 text-[var(--naranja)]";
    else if (/(baja|basse|faible)/i.test(low))
      cls = "bg-[var(--rojo)]/15 text-[var(--rojo)]";
    return (
      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
        🎯 {rest}
      </span>
    );
  }

  if (t.startsWith("📌"))
    return (
      <div className="border-l-4 border-[var(--petroleo)] bg-[var(--petroleo)]/5 pl-3 py-2 rounded-r">
        {t}
      </div>
    );

  if (t.startsWith("💡"))
    return (
      <div className="border-l-4 border-[var(--dorado)] bg-[var(--dorado)]/10 pl-3 py-2 rounded-r italic">
        {t}
      </div>
    );

  if (t.startsWith("🔍"))
    return (
      <div className="border-l-4 border-sky-400 bg-sky-50 pl-3 py-2 rounded-r italic text-[var(--petroleo)]">
        {t}
      </div>
    );

  if (t.startsWith("📊"))
    return (
      <span className="inline-block bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-xs">
        {t}
      </span>
    );

  if (t.startsWith("⭐"))
    return <div className="text-[var(--naranja)] font-medium">{t}</div>;

  if (t.startsWith("▸"))
    return <div className="text-xs text-muted-foreground pl-4">{t}</div>;

  if (t.startsWith("📋"))
    return (
      <h3 className="text-lg font-bold text-[var(--petroleo)] mt-4 mb-1 border-b border-border pb-1">
        {t}
      </h3>
    );

  if (t.startsWith("💰"))
    return (
      <div className="bg-[var(--petroleo)] text-[var(--dorado)] px-4 py-3 rounded-md font-semibold">
        {t}
      </div>
    );

  if (t.startsWith("🏆"))
    return <div className="text-[var(--dorado)] font-bold">{t}</div>;

  if (t.startsWith("💬"))
    return (
      <div className="bg-[var(--crema)] border border-[var(--dorado)]/30 px-3 py-2 rounded italic text-[var(--petroleo)]">
        {t}
      </div>
    );

  if (t.startsWith("📝"))
    return <div className="text-sm text-[var(--petroleo)]">{t}</div>;

  return <div className="text-[var(--petroleo)]">{t}</div>;
}
