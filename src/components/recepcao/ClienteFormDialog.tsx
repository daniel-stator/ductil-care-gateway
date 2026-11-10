import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  clienteSchema,
  cpfDuplicado,
  formatarCpf,
  formatarTelefone,
  type Cliente,
  type DadosCliente,
} from "@/lib/clientes";

type Erros = { [K in keyof DadosCliente]?: string | undefined };

const vazio: DadosCliente = { nome: "", cpf: "", telefone: "", email: "" };

export function ClienteFormDialog({
  aberto,
  onAbertoChange,
  cliente,
  clientes,
  onSalvar,
}: {
  aberto: boolean;
  onAbertoChange: (v: boolean) => void;
  /** Quando presente, o formulário edita este cliente */
  cliente?: Cliente | null;
  clientes: Cliente[];
  onSalvar: (dados: DadosCliente) => void;
}) {
  const [dados, setDados] = useState<DadosCliente>(vazio);
  const [erros, setErros] = useState<Erros>({});
  const editando = !!cliente;

  useEffect(() => {
    if (aberto) {
      setDados(
        cliente
          ? { nome: cliente.nome, cpf: cliente.cpf, telefone: cliente.telefone, email: cliente.email }
          : vazio,
      );
      setErros({});
    }
  }, [aberto, cliente]);

  function campo<K extends keyof DadosCliente>(k: K, v: string) {
    setDados((d) => ({ ...d, [k]: v }));
    if (erros[k]) setErros((e) => ({ ...e, [k]: undefined }));
  }

  function enviar(e: FormEvent) {
    e.preventDefault();
    const r = clienteSchema.safeParse(dados);
    if (!r.success) {
      const f = r.error.flatten().fieldErrors;
      setErros({
        nome: f.nome?.[0],
        cpf: f.cpf?.[0],
        telefone: f.telefone?.[0],
        email: f.email?.[0],
      });
      return;
    }
    if (cpfDuplicado(clientes, r.data.cpf, cliente?.id)) {
      setErros({ cpf: "Já existe um cliente com este CPF" });
      return;
    }
    onSalvar(r.data);
  }

  return (
    <Dialog open={aberto} onOpenChange={onAbertoChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl font-medium">
            {editando ? "Editar cliente" : "Novo cliente"}
          </DialogTitle>
          <DialogDescription>
            {editando ? "Atualize os dados de contato do cliente." : "Preencha os dados para cadastrar."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={enviar} noValidate className="space-y-4">
          <Campo id="nome" label="Nome completo" erro={erros.nome}>
            <Input
              id="nome"
              value={dados.nome}
              onChange={(e) => campo("nome", e.target.value)}
              placeholder="Nome e sobrenome"
              aria-invalid={!!erros.nome}
              maxLength={120}
            />
          </Campo>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo id="cpf" label="CPF" erro={erros.cpf}>
              <Input
                id="cpf"
                inputMode="numeric"
                value={dados.cpf}
                onChange={(e) => campo("cpf", formatarCpf(e.target.value))}
                placeholder="000.000.000-00"
                aria-invalid={!!erros.cpf}
              />
            </Campo>
            <Campo id="telefone" label="Telefone" erro={erros.telefone}>
              <Input
                id="telefone"
                inputMode="tel"
                value={dados.telefone}
                onChange={(e) => campo("telefone", formatarTelefone(e.target.value))}
                placeholder="(00) 00000-0000"
                aria-invalid={!!erros.telefone}
              />
            </Campo>
          </div>
          <Campo id="email-cliente" label="E-mail" erro={erros.email}>
            <Input
              id="email-cliente"
              type="email"
              value={dados.email}
              onChange={(e) => campo("email", e.target.value)}
              placeholder="seuemail@email.com"
              aria-invalid={!!erros.email}
              maxLength={255}
            />
          </Campo>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onAbertoChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="gold">
              {editando ? "Salvar alterações" : "Cadastrar cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Campo({
  id,
  label,
  erro,
  children,
}: {
  id: string;
  label: string;
  erro?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {erro && <p className="text-sm text-destructive">{erro}</p>}
    </div>
  );
}
