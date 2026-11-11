import { useEffect, useMemo, useState, type FormEvent } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PSICOLOGOS, deISO, horariosLivres, paraISO } from "@/lib/agenda";
import { formatarData, marcarConsulta, type Cliente } from "@/lib/clientes";
import { cn } from "@/lib/utils";

export interface PreSelecao {
  data?: string;
  hora?: string;
  psicologo?: string;
}

export function MarcarConsultaDialog({
  aberto,
  onAbertoChange,
  clientes,
  inicial,
  onMarcada,
}: {
  aberto: boolean;
  onAbertoChange: (v: boolean) => void;
  clientes: Cliente[];
  inicial?: PreSelecao | undefined;
  onMarcada?: (data: string) => void;
}) {
  const [clienteId, setClienteId] = useState("");
  const [psicologo, setPsicologo] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [calendarioAberto, setCalendarioAberto] = useState(false);

  useEffect(() => {
    if (aberto) {
      setClienteId("");
      setPsicologo(inicial?.psicologo ?? "");
      setData(inicial?.data ?? "");
      setHora(inicial?.hora ?? "");
      setErro(null);
    }
  }, [aberto, inicial]);

  const ordenados = useMemo(
    () => [...clientes].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
    [clientes],
  );
  const livres = psicologo && data ? horariosLivres(clientes, data, psicologo) : [];
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (!clienteId) return setErro("Selecione o cliente");
    if (!psicologo) return setErro("Selecione o(a) psicólogo(a)");
    if (!data) return setErro("Escolha a data");
    if (!hora) return setErro("Escolha o horário");
    const r = marcarConsulta({ clienteId, data, hora, psicologo });
    if (!r.ok) return setErro(r.erro);
    const nome = clientes.find((c) => c.id === clienteId)?.nome;
    toast.success("Consulta marcada", {
      description: `${nome} · ${formatarData(data)} às ${hora} com ${psicologo}`,
    });
    onAbertoChange(false);
    onMarcada?.(data);
  }

  return (
    <Dialog open={aberto} onOpenChange={onAbertoChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl font-medium">Marcar consulta</DialogTitle>
          <DialogDescription>Escolha o cliente, o(a) psicólogo(a), a data e um horário livre.</DialogDescription>
        </DialogHeader>

        <form onSubmit={enviar} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mc-cliente">Cliente</Label>
            <Select
              value={clienteId}
              onValueChange={(v) => {
                setClienteId(v);
                setErro(null);
              }}
            >
              <SelectTrigger id="mc-cliente">
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {ordenados.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mc-psicologo">Psicólogo(a)</Label>
            <Select
              value={psicologo}
              onValueChange={(v) => {
                setPsicologo(v);
                setHora("");
                setErro(null);
              }}
            >
              <SelectTrigger id="mc-psicologo">
                <SelectValue placeholder="Selecione o(a) psicólogo(a)" />
              </SelectTrigger>
              <SelectContent>
                {PSICOLOGOS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mc-data">Data</Label>
              <Popover open={calendarioAberto} onOpenChange={setCalendarioAberto}>
                <PopoverTrigger asChild>
                  <Button
                    id="mc-data"
                    type="button"
                    variant="outline"
                    className={cn("w-full justify-start font-normal", !data && "text-muted-foreground")}
                  >
                    <CalendarIcon className="size-4" />
                    {data ? format(deISO(data), "dd/MM/yyyy") : "Escolha a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    locale={ptBR}
                    selected={data ? deISO(data) : undefined}
                    defaultMonth={data ? deISO(data) : hoje}
                    disabled={[{ dayOfWeek: [0, 6] }, { before: hoje }]}
                    onSelect={(d) => {
                      if (!d) return;
                      setData(paraISO(d));
                      setHora("");
                      setErro(null);
                      setCalendarioAberto(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mc-hora">Horário</Label>
              <Select
                value={hora}
                onValueChange={(v) => {
                  setHora(v);
                  setErro(null);
                }}
                disabled={!psicologo || !data}
              >
                <SelectTrigger id="mc-hora">
                  <SelectValue
                    placeholder={
                      !psicologo || !data
                        ? "Escolha data e psicólogo(a)"
                        : livres.length
                          ? "Escolha o horário"
                          : "Sem horários livres"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {livres.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {erro && (
            <p role="alert" className="text-sm text-destructive">
              {erro}
            </p>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onAbertoChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="gold">
              Marcar consulta
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
