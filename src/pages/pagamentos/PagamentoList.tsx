
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import type { Locacao } from "../../models/Locacao";
import type {
  Pagamento,
  FormaPagamento,
  StatusPagamento,
} from "../../models/Pagamento";
import type { Cliente } from "../../models/Cliente";
import type { TableColumn } from "../../components/Table";

import { locacaoService } from "../../service/locacaoService";
import { clienteService } from "../../service/clienteService";
import { pagamentoService } from "../../service/pagamentoService";

import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Select } from "../../components/Select";
import { Table } from "../../components/Table";
import { Alert } from "../../components/Alert";
import { Modal } from "../../components/Modal";
import { Card } from "../../components/Card";

const formas = [
  { value: "PIX", label: "PIX" },
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "CARTAO_CREDITO", label: "Cartão de crédito" },
  { value: "CARTAO_DEBITO", label: "Cartão de débito" },
  { value: "TRANSFERENCIA", label: "Transferência" },
];

const statusDisponiveis = [
  { value: "PENDENTE", label: "Pendente" },
  { value: "PAGO", label: "Pago" },
  { value: "CANCELADO", label: "Cancelado" },
];

function moeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function PagamentoList() {
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);

  const [locacaoId, setLocacaoId] = useState("");
  const [data, setData] = useState("");
  const [valor, setValor] = useState("");
  const [forma, setForma] = useState<FormaPagamento>("PIX");
  const [status, setStatus] =
    useState<StatusPagamento>("PENDENTE");

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [paraExcluir, setParaExcluir] =
    useState<Pagamento | null>(null);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function carregarDados() {
    const [dadosLocacoes, dadosClientes, dadosPagamentos] =
      await Promise.all([
        locacaoService.listar(),
        clienteService.listar(),
        pagamentoService.listar(),
      ]);

    setLocacoes(dadosLocacoes);
    setClientes(dadosClientes);
    setPagamentos(dadosPagamentos);
  }

  useEffect(() => {
    carregarDados().catch(() =>
      setErro("Erro ao carregar dados.")
    );
  }, []);

  const locacaoSelecionada = locacoes.find(
    (locacao) => locacao.id === locacaoId
  );

  const pagamentosDaLocacao = pagamentos.filter(
    (pagamento) => pagamento.locacaoId === locacaoId
  );

  const totalPago = pagamentosDaLocacao
    .filter((pagamento) => pagamento.status === "PAGO")
    .reduce((total, pagamento) => total + pagamento.valor, 0);

  const valorTotal = locacaoSelecionada?.valorTotal ?? 0;
  const saldo = valorTotal - totalPago;

  function limparFormulario() {
    setData("");
    setValor("");
    setForma("PIX");
    setStatus("PENDENTE");
    setEditandoId(null);
  }

  function selecionarLocacao(id: string) {
    setLocacaoId(id);
    limparFormulario();
    setErro("");
    setSucesso("");
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setSucesso("");

    if (salvando) return;

    const valorNumero = Number(valor);

    if (
      !locacaoId ||
      !data ||
      !valor.trim() ||
      !Number.isFinite(valorNumero) ||
      valorNumero <= 0
    ) {
      setErro("Preencha os dados com um valor maior que zero.");
      return;
    }

    setSalvando(true);

    try {
      const locacaoAtual = await locacaoService.buscarPorId(
        locacaoId
      );

      if (locacaoAtual.status === "CANCELADA") {
        setErro("Não é permitido pagar uma locação cancelada.");
        return;
      }

      const pagamento: Pagamento = {
        locacaoId,
        data,
        valor: valorNumero,
        forma,
        status,
      };

      if (editandoId) {
        const anterior = await pagamentoService.buscarPorId(
          editandoId
        );

        if (anterior.locacaoId !== locacaoId) {
          setErro("O pagamento não pertence a esta locação.");
          return;
        }

        await pagamentoService.atualizar(
          editandoId, pagamento
        );
      } else {
        await pagamentoService.criar(pagamento);
      }

      await carregarDados();
      limparFormulario();
      setSucesso("Pagamento salvo com sucesso!");
    } catch {
      setErro("Erro ao salvar pagamento.");
    } finally {
      setSalvando(false);
    }
  }

  function editar(pagamento: Pagamento) {
    if (!pagamento.id) return;

    setLocacaoId(pagamento.locacaoId);
    setData(pagamento.data);
    setValor(String(pagamento.valor));
    setForma(pagamento.forma);
    setStatus(pagamento.status);
    setEditandoId(pagamento.id);
    setErro("");
    setSucesso("");
  }

  async function excluir(pagamento: Pagamento) {
    if (!pagamento.id) return;

    try {
      await pagamentoService.excluir(pagamento.id);
      await carregarDados();
      setErro("");
      setSucesso("Pagamento excluído com sucesso!");
    } catch {
      setErro("Erro ao excluir pagamento.");
    } finally {
      setParaExcluir(null);
    }
  }

  const opcoesLocacoes = locacoes
    .filter((locacao) =>
      locacao.id && locacao.status !== "CANCELADA"
    )
    .map((locacao) => {
      const cliente = clientes.find(
        (item) => item.id === locacao.clienteId
      );

      return {
        value: locacao.id!,
        label:
          `${cliente?.nome ?? "Cliente"} - ` +
          `Locação ${locacao.id} (${locacao.status})`,
      };
    });

  const columns: TableColumn<Pagamento>[] = [
    {
      header: "Data",
      render: (pagamento) =>
        pagamento.data.split("-").reverse().join("/"),
    },
    {
      header: "Valor",
      render: (pagamento) => moeda(pagamento.valor),
    },
    {
      header: "Forma",
      render: (pagamento) => pagamento.forma,
    },
    {
      header: "Status",
      render: (pagamento) => pagamento.status,
    },
  ];

  return (
    <div className="container mt-4">
      <h2>Pagamentos de Locações</h2>

      <Alert type="danger" message={erro} />
      <Alert type="success" message={sucesso} />

      <Select
        label="Selecione uma locação"
        name="locacaoId"
        value={locacaoId}
        options={opcoesLocacoes}
        onChange={(e) => selecionarLocacao(e.target.value)}
      />

      {locacaoSelecionada && (
        <>
          <Card title="Resumo financeiro">
            <p>
              <strong>Valor total:</strong>{" "}
              {moeda(valorTotal)}
            </p>
            <p>
              <strong>Total pago:</strong>{" "}
              {moeda(totalPago)}
            </p>
            <p>
              <strong>Saldo pendente:</strong>{" "}
              {moeda(Math.max(0, saldo))}
            </p>

            {saldo < 0 && (
              <Alert
                type="warning"
                message={
                  "Os pagamentos superam o valor da locação em " +
                  moeda(-saldo)
                }
              />
            )}
          </Card>

          <Card title={
            editandoId ? "Editar pagamento" : "Novo pagamento"
          }>
            <form onSubmit={salvar}>
              <Input
                label="Data do pagamento"
                name="dataPagamento"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
              />

              <Input
                label="Valor (R$)"
                name="valorPagamento"
                type="number"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="Ex.: 200"
              />

              <Select
                label="Forma de pagamento"
                name="formaPagamento"
                value={forma}
                options={formas}
                onChange={(e) =>
                  setForma(e.target.value as FormaPagamento)
                }
              />

              <Select
                label="Status do pagamento"
                name="statusPagamento"
                value={status}
                options={statusDisponiveis}
                onChange={(e) =>
                  setStatus(e.target.value as StatusPagamento)
                }
              />

              <div className="d-flex gap-2">
                <Button
                  label={
                    editandoId
                      ? "Atualizar pagamento"
                      : "Registrar pagamento"
                  }
                  type="submit"
                  disabled={salvando}
                />

                {editandoId && (
                  <Button
                    label="Cancelar"
                    variant="secondary"
                    onClick={limparFormulario}
                  />
                )}
              </div>
            </form>
          </Card>

          <h4>Histórico de pagamentos</h4>

          <Table<Pagamento>
            columns={columns}
            data={pagamentosDaLocacao}
            onEdit={editar}
            onDelete={setParaExcluir}
          />
        </>
      )}

      <Modal
        show={paraExcluir !== null}
        title="Excluir pagamento"
        onClose={() => setParaExcluir(null)}
        onConfirm={() => {
          if (paraExcluir) {
            void excluir(paraExcluir);
          }
        }}
      />
    </div>
  );
}
