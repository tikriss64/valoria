import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { login, isAuthed } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthed()) navigate({ to: "/" });
  }, [navigate]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (login(pwd)) navigate({ to: "/" });
    else setError("Contraseña incorrecta");
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--petroleo)] p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-background rounded-xl shadow-2xl p-8 space-y-5"
      >
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--dorado)]/20 mb-2">
            <Lock className="h-5 w-5 text-[var(--petroleo)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--petroleo)]">
            ValorIA <span className="text-[var(--dorado)]">QC</span>
          </h1>
          <p className="text-sm text-muted-foreground">Panel interno · acceso restringido</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pwd">Contraseña</Label>
          <Input
            id="pwd"
            type="password"
            autoFocus
            value={pwd}
            onChange={(e) => {
              setPwd(e.target.value);
              setError("");
            }}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <Button
          type="submit"
          className="w-full bg-[var(--petroleo)] hover:bg-[var(--petroleo)]/90"
        >
          Entrar
        </Button>
      </form>
    </div>
  );
}
