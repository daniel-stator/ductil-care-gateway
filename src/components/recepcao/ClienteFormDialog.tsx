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
  dadosDoCliente,
  formatarCpf,
  formatarTelefone,
  type Cliente,
  type DadosCliente,
} from "@/lib/clientes";

type Erros = { [K in keyof DadosCliente]?: string | undefined };

const vazio: DadosCliente = {
  nome: "",
  cpf: "",
  telefone: "",
  email: "",
  nascimento: "",
  emergenciaNome: "",
  emergenciaParentesco: "",
  emergenciaTelefone: "",
};

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
      setDados(cliente ? dadosDoCliente(cliente) : vazio);
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
        nascimento: f.nascimento?.[0],
        emergenciaNome: f.emergenciaNome?.[0],
        emergenciaParentesco: f.emergenciaParentesco?.[0],
        emergenciaTelefone: f.emergenciaTelefone?.[0],
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
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
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
          <Campo id="nascimento" label="Data de nascimento (opcional)" erro={erros.nascimento}>
            <Input
              id="nascimento"
              type="date"
              value={dados.nascimento}
              onChange={(e) => campo("nascimento", e.target.value)}
              aria-invalid={!!erros.nascimento}
              className="sm:max-w-[12rem]"
            />
          </Campo>

          <fieldset className="space-y-4 rounded-md border border-border p-4">
            <legend className="px-1 text-sm font-medium">Contato de emergência (opcional)</legend>
            <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
              <Campo id="emergencia-nome" label="Nome" erro={erros.emergenciaNome}>
                <Input
                  id="emergencia-nome"
                  value={dados.emergenciaNome}
                  onChange={(e) => campo("emergenciaNome", e.target.value)}
                  placeholder="Nome do contato"
                  maxLength={120}
                />
              </Campo>
              <Campo id="emergencia-parentesco" label="Parentesco" erro={erros.emergenciaParentesco}>
                <Input
                  id="emergencia-parentesco"
                  value={dados.emergenciaParentesco}
                  onChange={(e) => campo("emergenciaParentesco", e.target.value)}
                  placeholder="Ex.: Mãe"
                  maxLength={40}
                />
              </Campo>
            </div>
            <Campo id="emergencia-telefone" label="Telefone" erro={erros.emergenciaTelefone}>
              <Input
                id="emergencia-telefone"
                inputMode="tel"
                value={dados.emergenciaTelefone}
                onChange={(e) => campo("emergenciaTelefone", formatarTelefone(e.target.value))}
                placeholder="(00) 00000-0000"
                aria-invalid={!!erros.emergenciaTelefone}
                className="sm:max-w-[12rem]"
              />
            </Campo>
          </fieldset>

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
