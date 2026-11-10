import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { CalendarCheck, Eye, EyeOff, HeartHandshake, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import ambiente from "@/assets/clinica-ambiente.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Entrar · Dúctil Psicologia" },
      {
        name: "description",
        content: "Acesso da recepção e dos psicólogos à área restrita da clínica Dúctil Psicologia.",
      },
      { property: "og:title", content: "Entrar · Dúctil Psicologia" },
      {
        property: "og:description",
        content: "Acesso da recepção e dos psicólogos à área restrita da clínica Dúctil Psicologia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

type Perfil = "recepcao" | "psicologo";

const perfis: Record<
  Perfil,
  { titulo: string; descricao: string; saudacao: string; icon: typeof CalendarCheck }
> = {
  recepcao: {
    titulo: "Recepção",
    descricao: "Agenda, pacientes e pagamentos",
    saudacao: "Bem-vinda de volta à recepção",
    icon: CalendarCheck,
  },
  psicologo: {
    titulo: "Psicólogo(a)",
    descricao: "Sessões, prontuários e evolução",
    saudacao: "Bem-vindo(a) ao seu consultório",
    icon: HeartHandshake,
  },
};

const loginSchema = z.object({
  email: z.string().trim().min(1, "Informe seu e-mail").email("E-mail inválido").max(255),
  senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres").max(128),
});

function Marca({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="grid size-11 place-items-center rounded-full border border-gold/70 font-display text-2xl italic text-gold">
        D
      </span>
      <span className="leading-none">
        <span className="block font-display text-2xl tracking-wide">Dúctil</span>
        <span className="mt-1 block text-[0.65rem] uppercase tracking-[0.35em] opacity-70">
          Psicologia
        </span>
      </span>
    </div>
  );
}

function LoginPage() {
  const [perfil, setPerfil] = useState<Perfil>("recepcao");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erros, setErros] = useState<{ email?: string | undefined; senha?: string | undefined }>({});
  const [enviando, setEnviando] = useState(false);

  const atual = perfis[perfil];

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const resultado = loginSchema.safeParse({ email, senha });
    if (!resultado.success) {
      const f = resultado.error.flatten().fieldErrors;
      setErros({ email: f.email?.[0], senha: f.senha?.[0] });
      return;
    }
    setErros({});
    setEnviando(true);
    setTimeout(() => {
      setEnviando(false);
      toast(`Acesso ${perfil === "recepcao" ? "da recepção" : "do psicólogo"}`, {
        description: "Tela pronta. O acesso real será ativado quando as contas forem conectadas.",
      });
    }, 700);
  }

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_1fr]">
      {/* Painel visual */}
      <aside className="relative hidden overflow-hidden bg-ink text-ink-foreground lg:block">
        <img
          src={ambiente}
          alt="Sala de atendimento acolhedora da clínica Dúctil"
          width={1024}
          height={1408}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-ink-veil" />
        <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
          <Marca />
          <div className="max-w-md animate-rise">
            <div className="mb-6 h-px w-16 bg-gold" />
            <p className="font-display text-4xl leading-tight xl:text-5xl">
              Um espaço para <em className="text-gold-soft">acolher</em>, escutar e transformar.
            </p>
            <p className="mt-5 text-sm leading-relaxed opacity-75">
              Área restrita da equipe Dúctil Psicologia.
            </p>
          </div>
        </div>
      </aside>

      {/* Formulário */}
      <section className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-md animate-rise">
          <Marca className="mb-10 text-foreground lg:hidden" />

          <p className="text-xs uppercase tracking-[0.3em] text-gold-deep">Área da equipe</p>
          <h1 className="mt-3 font-display text-4xl font-medium text-foreground sm:text-5xl">
            Entrar
          </h1>
          <p className="mt-2 text-muted-foreground">{atual.saudacao}.</p>

          <div
            role="radiogroup"
            aria-label="Tipo de acesso"
            className="mt-8 grid grid-cols-2 gap-3"
          >
            {(Object.keys(perfis) as Perfil[]).map((chave) => {
              const p = perfis[chave];
              const Icon = p.icon;
              const ativo = perfil === chave;
              return (
                <button
                  key={chave}
                  type="button"
                  role="radio"
                  aria-checked={ativo}
                  onClick={() => setPerfil(chave)}
                  className={cn(
                    "group flex flex-col items-start gap-3 rounded-lg border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    ativo
                      ? "border-ink bg-ink text-ink-foreground shadow-soft"
                      : "border-border bg-card text-foreground hover:border-gold",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-9 place-items-center rounded-full transition-colors",
                      ativo ? "bg-gradient-gold text-primary-foreground" : "bg-muted text-gold-deep",
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <span>
                    <span className="block font-medium">{p.titulo}</span>
                    <span
                      className={cn(
                        "mt-0.5 block text-xs leading-snug",
                        ativo ? "opacity-70" : "text-muted-foreground",
                      )}
                    >
                      {p.descricao}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder={perfil === "recepcao" ? "recepcao@ductil.com.br" : "seu.nome@ductil.com.br"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!erros.email}
                  className="h-12 bg-card pl-10"
                />
              </div>
              {erros.email && <p className="text-sm text-destructive">{erros.email}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="senha">Senha</Label>
                <button
                  type="button"
                  onClick={() =>
                    toast("Recuperação de senha", {
                      description: "Esta opção será ativada junto com as contas da equipe.",
                    })
                  }
                  className="text-xs text-gold-deep underline-offset-4 hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="senha"
                  type={mostrarSenha ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  aria-invalid={!!erros.senha}
                  className="h-12 bg-card pl-10 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {mostrarSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {erros.senha && <p className="text-sm text-destructive">{erros.senha}</p>}
            </div>

            <Button type="submit" variant="gold" size="xl" className="w-full" disabled={enviando}>
              {enviando ? "Entrando…" : `Entrar como ${atual.titulo.toLowerCase()}`}
            </Button>
          </form>

          <p className="mt-10 text-center text-xs text-muted-foreground">
            Acesso exclusivo para a equipe da clínica. Precisa de ajuda? Fale com a coordenação.
          </p>
        </div>
      </section>
    </main>
  );
}
