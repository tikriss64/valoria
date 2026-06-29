import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, anon, {
  auth: { persistSession: false },
});

export type Analisis = {
  id: string;
  email: string | null;
  nombre: string | null;
  idioma: "es" | "fr" | null;
  tipo: "gratuito" | "pro" | null;
  num_fotos: number | null;
  texto_analisis: string | null;
  thumbnail_url: string | null;
  calidad: "pendiente" | "correcto" | "revisar" | null;
  nota_interna: string | null;
  email_enviado: boolean | null;
  created_at: string;
};

export type Uso = { email: string; count: number };

export type Waitlist = {
  id: string;
  email: string;
  idioma: "es" | "fr";
  created_at: string;
};
