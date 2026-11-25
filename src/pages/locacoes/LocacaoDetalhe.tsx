
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import type { Locacao } from "../../models/Locacao";
import type { Cliente } from "../../models/Cliente";
import type { Veiculo } from "../../models/Veiculo";
import type { Modelo } from "../../models/Modelo";
import type { Contrato } from "../../models/Contrato";
import type { Vistoria } from "../../models/Vistoria";
import type { Pagamento } from "../../models/Pagamento";
import type { NotaFiscal } from "../../models/NotaFiscal";
import type { TableColumn } from "../../components/Table";

import { locacaoService } from "../../service/locacaoService";
import { clienteService } from "../../service/clienteService";
import { veiculoService } from "../../service/veiculoService";
import { modeloService } from "../../service/modeloService";
import { contratoService } from "../../service/contratoService";
import { vistoriaService } from "../../service/vistoriaService";
import { pagamentoService } from "../../service/pagamentoService";
import { notaFiscalService } from "../../service/notaFiscalService";

import { Card } from "../../components/Card";
import { Alert } from "../../components/Alert";
import { Table } from "../../components/Table";

function moeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function dataBR(data?: string): string {
  if (!data) return "-";

  const [ano, mes, dia] = data.slice(0, 10).split("-");

  if (!ano || !mes || !dia) return data;

  return `${dia}/${mes}/${ano}`;
}

export function LocacaoDetalhe() {
  const { id } = useParams<{ id: string }>();

  const [locacao, setLocacao] = useState<Locacao | null>(null);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [veiculo, setVeiculo] = useState<Veiculo | null>(null);
  const [modelo, setModelo] = useState<Modelo | null>(null);

  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [vistorias, setVistorias] = useState<Vistoria[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [notaFiscal, setNotaFiscal] = useState<NotaFiscal | null>(null);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      if (!id) {
        setErro("ID da locação não informado.");
        setCarregando(false);
        return;
      }

      setCarregando(true);
      setErro("");

      try {
        const dadosLocacao = await locacaoService.buscarPorId(id);

        const [
          dadosCliente,
          dadosVeiculo,
          contratos,
          dadosVistorias,
          dadosPagamentos,
          dadosNota,
        ] = await Promise.all([
          clienteService.buscarPorId(dadosLocacao.clienteId),
          veiculoService.buscarPorId(dadosLocacao.veiculoId),
          contratoService.listar(),
          vistoriaService.listarPorLocacao(id),
          pagamentoService.listarPorLocacao(id),
          notaFiscalService.buscarPorLocacao(id),
        ]);

        const dadosModelo = await modeloService.buscarPorId(
          dadosVeiculo.modeloId
        );

        if (!ativo) return;

        setLocacao(dadosLocacao);
        setCliente(dadosCliente);
        setVeiculo(dadosVeiculo);
        setModelo(dadosModelo);

        setContrato(
          contratos.find((c) => c.locacaoId === id) ?? null
        );

        setVistorias(dadosVistorias);
        setPagamentos(dadosPagamentos);
        setNotaFiscal(dadosNota ?? null);
      } catch {
        if (ativo) {
          setErro("Não foi possível carregar os detalhes da locação.");
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    void carregar();

    return () => {
      ativo = false;
    };
  }, [id]);

  const columnsVistorias: TableColumn<Vistoria>[] = [
    { header: "Tipo", render: (v) => v.tipo },
    { header: "Data", render: (v) => dataBR(v.data) },
    { header: "KM", render: (v) => v.km },
    {
      header: "Combustível",
      render: (v) => v.nivelCombustivel,
    },
    {
      header: "Observações",
      render: (v) => v.observacoes || "-",
    },
  ];

  const columnsPagamentos: TableColumn<Pagamento>[] = [
    { header: "Data", render: (p) => dataBR(p.data) },
    { header: "Valor", render: (p) => moeda(p.valor) },
    { header: "Forma", render: (p) => p.forma },
    { header: "Status", render: (p) => p.status },
  ];

  const totalPago = pagamentos
    .filter((p) => p.status === "PAGO")
    .reduce((total, p) => total + p.valor, 0);

  if (carregando) {
    return (
      <div className="container mt-4">
        <p>Carregando detalhes da locação...</p>
      </div>
    );
  }

  if (erro || !locacao) {
    return (
      <div className="container mt-4">
        <Alert
          type="danger"
          message={erro || "Locação não encontrada."}
        />
        <Link to="/locacoes" className="btn btn-secondary">
          Voltar para locações
        </Link>
      </div>
    );
  }

  return (
    <div className="container mt-4 mb-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Detalhes da Locação</h2>

        <Link to="/locacoes" className="btn btn-secondary">
          Voltar
        </Link>
      </div>

      <Card title="Informações da locação">
        <p><strong>ID:</strong> {locacao.id}</p>
        <p><strong>Status:</strong> {locacao.status}</p>
        <p>
          <strong>Retirada:</strong>{" "}
          {dataBR(locacao.dataRetirada)}
        </p>
        <p>
          <strong>Devolução prevista:</strong>{" "}
          {dataBR(locacao.dataDevolucaoPrevista)}
        </p>
        <p>
          <strong>Devolução real:</strong>{" "}
          {dataBR(locacao.dataDevolucaoReal)}
        </p>
        <p>
          <strong>KM de retirada:</strong>{" "}
          {locacao.kmRetirada}
        </p>
        <p>
          <strong>KM de devolução:</strong>{" "}
          {locacao.kmDevolucao ?? "-"}
        </p>
        <h5>Valor total: {moeda(locacao.valorTotal)}</h5>
      </Card>

      <Card title="Cliente">
        <p><strong>Nome:</strong> {cliente?.nome}</p>
        <p><strong>CPF:</strong> {cliente?.cpf}</p>
        <p><strong>CNH:</strong> {cliente?.cnh}</p>
        <p>
          <strong>Validade da CNH:</strong>{" "}
          {dataBR(cliente?.validadeCnh)}
        </p>
        <p><strong>Telefone:</strong> {cliente?.telefone}</p>
        <p><strong>E-mail:</strong> {cliente?.email}</p>
        <p><strong>Endereço:</strong> {cliente?.endereco}</p>
      </Card>

      <Card title="Veículo">
        <p><strong>Modelo:</strong> {modelo?.nome}</p>
        <p><strong>Placa:</strong> {veiculo?.placa}</p>
        <p><strong>Chassi:</strong> {veiculo?.chassi}</p>
        <p><strong>Cor:</strong> {veiculo?.cor}</p>
        <p>
          <strong>Ano de fabricação:</strong>{" "}
          {veiculo?.anoFabricacao}
        </p>
        <p>
          <strong>KM atual:</strong> {veiculo?.kmRodado}
        </p>
      </Card>

      <Card title="Contrato">
        {contrato ? (
          <>
            <p>
              <strong>Número:</strong> {contrato.numero}
            </p>
            <p>
              <strong>Data de emissão:</strong>{" "}
              {dataBR(contrato.dataEmissao)}
            </p>
            <p><strong>Termos:</strong> {contrato.termos}</p>
          </>
        ) : (
          <p className="text-muted">
            Contrato não encontrado.
          </p>
        )}
      </Card>

      <Card title="Vistorias">
        <Table<Vistoria>
          columns={columnsVistorias}
          data={vistorias}
        />
      </Card>

      <Card title="Pagamentos">
        <Table<Pagamento>
          columns={columnsPagamentos}
          data={pagamentos}
        />

        <hr />

        <p>
          <strong>Total pago:</strong> {moeda(totalPago)}
        </p>
        <p>
          <strong>Saldo:</strong>{" "}
          {moeda(locacao.valorTotal - totalPago)}
        </p>
      </Card>

      <Card title="Nota Fiscal">
        {notaFiscal ? (
          <>
            <p>
              <strong>Número:</strong> {notaFiscal.numero}
            </p>
            <p>
              <strong>Série:</strong> {notaFiscal.serie}
            </p>
            <p>
              <strong>Data de emissão:</strong>{" "}
              {dataBR(notaFiscal.dataEmissao)}
            </p>
            <p>
              <strong>Valor:</strong>{" "}
              {moeda(notaFiscal.valor)}
            </p>
          </>
        ) : (
          <p className="text-muted">
            Nenhuma nota fiscal emitida.
          </p>
        )}
      </Card>
    </div>
  );
}
