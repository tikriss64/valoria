import { useEffect, useState } from "react";
import { X, Mail, ZoomIn } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { Analisis } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
import { fmtDate } from "@/lib/format";
import { Thumb } from "./Thumb";
import { LangFlag, PlanBadge, QualityBadge } from "./Badges";
import { AnalysisRenderer } from "./AnalysisRenderer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type Props = {
  item: Analisis | null;
  onClose: () => void;
  onUpdated: (a: Analisis) => void;
};

function buildEmail(a: Analisis) {
  const isFr = a.idioma === "fr";
  const nombre = a.nombre || (isFr ? "client" : "cliente");
  if (isFr) {
    return {
      subject: "Mise à jour de votre analyse ValorIA",
      body: `Bonjour ${nombre},

J'ai personnellement vérifié l'analyse que vous avez reçue de ValorIA et je souhaitais vous envoyer une information plus précise concernant [objet détecté].

[ESPACE POUR VOTRE CORRECTION MANUELLE]

N'hésitez pas à répondre à cet e-mail si vous avez des questions.

Cordialement,
L'équipe ValorIA
contact@valoriahome.fr`,
    };
  }
  return {
    subject: "Actualización de tu análisis ValorIA",
    body: `Hola ${nombre},

He revisado personalmente el análisis que recibiste de ValorIA y quería enviarte una información más precisa sobre [objeto detectado].

[ESPACIO PARA TU CORRECCIÓN MANUAL]

Si tienes alguna pregunta, no dudes en responder a este email.

Un saludo,
El equipo ValorIA
contact@valoriahome.es`,
  };
}

export function DetailPanel({ item, onClose, onUpdated }: Props) {
  const [calidad, setCalidad] = useState<string>("pendiente");
  const [nota, setNota] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);

  useEffect(() => {
    if (!item) return;
    setCalidad(item.calidad || "pendiente");
    setNota(item.nota_interna || "");
    const tpl = buildEmail(item);
    setSubject(tpl.subject);
    setBody(tpl.body);
  }, [item?.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!item) return null;

  async function save() {
    if (!item) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("analisis")
      .update({ calidad, nota_interna: nota })
      .eq("id", item.id)
      .select()
      .single();
    setSaving(false);
    if (error) return toast.error("Error al guardar: " + error.message);
    toast.success("Valoración guardada");
    onUpdated(data as Analisis);
  }

  async function markContacted() {
    if (!item) return;
    const { data, error } = await supabase
      .from("analisis")
      .update({ email_enviado: true })
      .eq("id", item.id)
      .select()
      .single();
    if (error) return toast.error("Error: " + error.message);
    toast.success("Marcado como contactado");
    onUpdated(data as Analisis);
  }

  const mailto = `mailto:${item.email ?? ""}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 z-40 animate-in fade-in"
        onClick={onClose}
      />
      <div className="fixed top-0 right-0 h-full w-full max-w-2xl bg-background border-l border-border z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <QualityBadge value={item.calidad} />
            <span className="text-xs text-muted-foreground">{fmtDate(item.created_at)}</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-md">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {item.thumbnail_url && (
            <button
              type="button"
              onClick={() => setZoomOpen(true)}
              className="group relative w-full overflow-hidden rounded-lg bg-muted block"
              title="Ampliar foto"
            >
              <img
                src={item.thumbnail_url}
                alt=""
                loading="lazy"
                className="w-full object-cover transition-transform group-hover:scale-[1.02]"
                style={{ maxHeight: 320 }}
              />
              <div className="absolute top-2 right-2 bg-black/60 text-white rounded-md px-2 py-1 text-xs flex items-center gap-1 opacity-80 group-hover:opacity-100">
                <ZoomIn className="h-3.5 w-3.5" /> Ampliar
              </div>
            </button>
          )}

          <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
            <DialogContent className="max-w-[95vw] sm:max-w-[95vw] p-2 bg-background">
              {item.thumbnail_url && (
                <img
                  src={item.thumbnail_url}
                  alt=""
                  className="w-full h-auto max-h-[90vh] object-contain rounded"
                />
              )}
            </DialogContent>
          </Dialog>


          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Cliente</div>
              <div className="font-medium">{item.nombre || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Email</div>
              <a
                href={`mailto:${item.email}`}
                className="text-[var(--petroleo)] underline truncate block"
              >
                {item.email || "—"}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <LangFlag value={item.idioma} />
              <PlanBadge value={item.tipo} />
            </div>
            <div className="text-xs text-muted-foreground">
              {item.num_fotos ?? 0} foto(s)
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-5">
            <AnalysisRenderer text={item.texto_analisis} />
          </div>

          <div className="bg-card border border-border rounded-lg p-5 space-y-3">
            <h3 className="font-semibold text-[var(--petroleo)]">Control de calidad</h3>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={calidad} onValueChange={setCalidad}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="correcto">Correcto ✓</SelectItem>
                  <SelectItem value="revisar">⚠ Revisar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nota interna</Label>
              <Textarea
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Escribe tus observaciones sobre este análisis..."
                rows={4}
              />
            </div>
            <Button onClick={save} disabled={saving} className="bg-[var(--petroleo)] hover:bg-[var(--petroleo)]/90">
              {saving ? "Guardando..." : "Guardar valoración"}
            </Button>
          </div>

          {calidad === "revisar" && (
            <div className="bg-card border border-border rounded-lg p-5 space-y-3">
              <h3 className="font-semibold text-[var(--petroleo)]">
                Contactar al cliente {item.idioma === "fr" ? "🇫🇷" : "🇪🇸"}
              </h3>
              <div className="space-y-2">
                <Label>Asunto</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Cuerpo</Label>
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={12} />
              </div>
              <div className="flex flex-wrap gap-2">
                <a href={mailto} target="_blank" rel="noreferrer">
                  <Button className="bg-[var(--dorado)] text-[var(--petroleo)] hover:bg-[var(--dorado)]/90">
                    <Mail className="h-4 w-4 mr-2" />
                    Abrir en mi correo
                  </Button>
                </a>
                <Button
                  variant="outline"
                  onClick={markContacted}
                  disabled={!!item.email_enviado}
                >
                  {item.email_enviado ? "✓ Ya contactado" : "Marcar como contactado"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
