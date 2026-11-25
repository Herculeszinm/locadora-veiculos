
import { useEffect, useState } from "react";

import type { NotaFiscal } from "../../models/NotaFiscal";
import type { Locacao } from "../../models/Locacao";
import type { Cliente } from "../../models/Cliente";
import type { TableColumn } from "../../components/Table";

import { notaFiscalService } from "../../service/notaFiscalService";
import { locacaoService } from "../../service/locacaoService";
import { clienteService } from "../../service/clienteService";

import { Select } from "../../components/Select";
import { Button } from "../../components/Button";
import { Table } from "../../components/Table";
import { Alert } from "../../components/Alert";
import { Card } from "../../components/Card";

function moeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function NotaFiscalList() {
  const [notas, setNotas] = useState<NotaFiscal[]>([]);
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [locacaoId, setLocacaoId] = useState("");

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [emitindo, setEmitindo] = useState(false);

  async function carregarDados() {
    const [dadosNotas, dadosLocacoes, dadosClientes] =
      await Promise.all([
        notaFiscalService.listar(),
        locacaoService.listar(),
        clienteService.listar(),
      ]);

    setNotas(dadosNotas);
    setLocacoes(dadosLocacoes);
    setClientes(dadosClientes);
  }

  useEffect(() => {
    carregarDados().catch(() =>
      setErro("Erro ao carregar notas fiscais.")
    );
  }, []);

  const locacoesElegiveis = locacoes.filter(
    (locacao) =>
      locacao.id !== undefined &&
      locacao.status === "FINALIZADA" &&
      !notas.some(
        (nota) => nota.locacaoId === locacao.id
      )
  );

  const locacaoSelecionada = locacoesElegiveis.find(
    (locacao) => locacao.id === locacaoId
  );

  const clienteSelecionado = clientes.find(
    (cliente) =>
      cliente.id === locacaoSelecionada?.clienteId
  );

  const opcoesLocacoes = locacoesElegiveis.map(
    (locacao) => {
      const cliente = clientes.find(
        (item) => item.id === locacao.clienteId
      );

      return {
        value: locacao.id!,
        label:
          `Locação ${locacao.id} - ` +
          `${cliente?.nome ?? "Cliente"} - ` +
          moeda(locacao.valorTotal),
      };
    }
  );

  async function emitirNota() {
    setErro("");
    setSucesso("");

    if (emitindo) return;

    if (!locacaoId) {
      setErro("Selecione uma locação finalizada.");
      return;
    }

    setEmitindo(true);

    try {
      // Reconsulta os dados antes de emitir a nota.
      const locacaoAtual =
        await locacaoService.buscarPorId(locacaoId);

      if (locacaoAtual.status !== "FINALIZADA") {
        setErro(
          "A nota fiscal só pode ser emitida para uma locação finalizada."
        );
        return;
      }

      const notaExistente =
        await notaFiscalService.buscarPorLocacao(locacaoId);

      if (notaExistente) {
        setErro("Esta locação já possui nota fiscal.");
        await carregarDados();
        setLocacaoId("");
        return;
      }

      const novaNota: NotaFiscal = {
        numero: `NF-${crypto.randomUUID()}`,
        serie: "1",
        dataEmissao: new Date().toISOString().slice(0, 10),
        valor: locacaoAtual.valorTotal,
        locacaoId,
      };

      await notaFiscalService.criar(novaNota);

      await carregarDados();
      setLocacaoId("");
      setSucesso("Nota fiscal simulada emitida com sucesso!");
    } catch {
      setErro("Erro ao emitir nota fiscal.");
    } finally {
      setEmitindo(false);
    }
  }

  const columns: TableColumn<NotaFiscal>[] = [
    {
      header: "Número",
      render: (nota) => nota.numero,
    },
    {
      header: "Série",
      render: (nota) => nota.serie,
    },
    {
      header: "Data de emissão",
      render: (nota) =>
        nota.dataEmissao.split("-").reverse().join("/"),
    },
    {
      header: "Cliente",
      render: (nota) => {
        const locacao = locacoes.find(
          (item) => item.id === nota.locacaoId
        );

        return clientes.find(
          (cliente) => cliente.id === locacao?.clienteId
        )?.nome ?? "Não encontrado";
      },
    },
    {
      header: "Locação",
      render: (nota) => nota.locacaoId,
    },
    {
      header: "Valor",
      render: (nota) => moeda(nota.valor),
    },
  ];

  return (
    <div className="container mt-4">
      <h2>Notas Fiscais</h2>

      <Alert type="danger" message={erro} />
      <Alert type="success" message={sucesso} />

      <Card title="Emitir nota fiscal">
        <p className="text-muted">
          Selecione uma locação finalizada que ainda não
          possui nota fiscal.
        </p>

        <Select
          label="Locação finalizada"
          name="locacaoNotaFiscal"
          value={locacaoId}
          options={opcoesLocacoes}
          onChange={(e) => setLocacaoId(e.target.value)}
        />

        {locacaoSelecionada && (
          <div className="alert alert-info">
            <p>
              <strong>Cliente:</strong>{" "}
              {clienteSelecionado?.nome ?? "Não encontrado"}
            </p>

            <p>
              <strong>Locação:</strong>{" "}
              {locacaoSelecionada.id}
            </p>

            <p>
              <strong>Status:</strong>{" "}
              {locacaoSelecionada.status}
            </p>

            <p className="mb-0">
              <strong>Valor da nota:</strong>{" "}
              {moeda(locacaoSelecionada.valorTotal)}
            </p>
          </div>
        )}

        <Button
          label={emitindo ? "Emitindo..." : "Emitir nota fiscal"}
          variant="success"
          disabled={!locacaoSelecionada || emitindo}
          onClick={() => void emitirNota()}
        />
      </Card>

      <h4 className="mt-4">Notas fiscais emitidas</h4>

      <Table<NotaFiscal>
        columns={columns}
        data={notas}
      />
    </div>
  );
}
