import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { History, Pencil, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { ClienteFormDialog } from "@/components/recepcao/ClienteFormDialog";
import { HistoricoSheet } from "@/components/recepcao/HistoricoSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  adicionarCliente,
  atualizarCliente,
  formatarData,
  somenteDigitos,
  ultimoAtendimento,
  useClientes,
  type Cliente,
} from "@/lib/clientes";

export const Route = createFileRoute("/recepcao/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes · Recepção Dúctil Psicologia" },
      { name: "description", content: "Lista de clientes da clínica, com contato, último atendimento e histórico." },
      { property: "og:title", content: "Clientes · Recepção Dúctil Psicologia" },
      { property: "og:description", content: "Lista de clientes da clínica, com contato, último atendimento e histórico." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ClientesPage,
});

function ClientesPage() {
  const clientes = useClientes();
  const [busca, setBusca] = useState("");
  const [formAberto, setFormAberto] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [historicoId, setHistoricoId] = useState<string | null>(null);

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    if (!t) return clientes;
    const dig = somenteDigitos(t);
    return clientes.filter(
      (c) =>
        c.nome.toLowerCase().includes(t) ||
        (dig.length > 0 && somenteDigitos(c.cpf).includes(dig)),
    );
  }, [clientes, busca]);

  const historico = clientes.find((c) => c.id === historicoId) ?? null;

  function abrirNovo() {
    setEditando(null);
    setFormAberto(true);
  }

  function abrirEdicao(c: Cliente) {
    setEditando(c);
    setFormAberto(true);
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:py-12">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold-deep">Recepção</p>
          <h1 className="mt-2 font-display text-4xl font-medium text-foreground sm:text-5xl">Clientes</h1>
          <p className="mt-1 text-muted-foreground">{clientes.length} clientes cadastrados</p>
        </div>
        <Button variant="gold" size="lg" className="px-6" onClick={abrirNovo}>
          <Plus /> Cadastrar novo cliente
        </Button>
      </div>

      <div className="relative mt-8 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome ou CPF"
          aria-label="Buscar cliente"
          className="h-11 bg-card pl-10"
        />
      </div>

      <div className="mt-5 overflow-hidden rounded-lg border border-border bg-card shadow-soft">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/60 hover:bg-muted/60">
              <TableHead className="pl-5">Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Último atendimento</TableHead>
              <TableHead className="pr-5 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.map((c) => {
              const ultimo = ultimoAtendimento(c);
              return (
                <TableRow key={c.id}>
                  <TableCell className="pl-5 font-medium text-foreground">{c.nome}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">{c.cpf}</TableCell>
                  <TableCell>
                    <div className="tabular-nums">{c.telefone}</div>
                    {c.email && <div className="text-xs text-muted-foreground">{c.email}</div>}
                  </TableCell>
                  <TableCell>
                    {ultimo ? (
                      <>
                        <div className="tabular-nums">{formatarData(ultimo.data)}</div>
                        <div className="text-xs text-muted-foreground">{ultimo.psicologo}</div>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Sem atendimentos</span>
                    )}
                  </TableCell>
                  <TableCell className="pr-5">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setHistoricoId(c.id)}>
                        <History /> Histórico
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => abrirEdicao(c)}>
                        <Pencil /> Editar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  Nenhum cliente encontrado para “{busca}”.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ClienteFormDialog
        aberto={formAberto}
        onAbertoChange={setFormAberto}
        cliente={editando}
        clientes={clientes}
        onSalvar={(dados) => {
          if (editando) {
            atualizarCliente(editando.id, dados);
            toast.success("Dados do cliente atualizados");
          } else {
            adicionarCliente(dados);
            toast.success("Cliente cadastrado");
          }
          setFormAberto(false);
        }}
      />

      <HistoricoSheet cliente={historico} onFechar={() => setHistoricoId(null)} />
    </main>
  );
}
