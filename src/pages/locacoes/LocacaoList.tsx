
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import type { Cliente } from "../../models/Cliente";
import type { Veiculo } from "../../models/Veiculo";
import type { Modelo } from "../../models/Modelo";
import type { Categoria } from "../../models/Categoria";
import type { Locacao } from "../../models/Locacao";
import type { Contrato } from "../../models/Contrato";
import type { TableColumn } from "../../components/Table";

import {
  calcularDiarias,
  calcularValorLocacao,
} from "../../models/Locacao";

import { clienteService } from "../../service/clienteService";
import { veiculoService } from "../../service/veiculoService";
import { modeloService } from "../../service/modeloService";
import { categoriaService } from "../../service/categoriaService";
import { locacaoService } from "../../service/locacaoService";
import { contratoService } from "../../service/contratoService";

import { Button } from "../../components/Button";
import { Select } from "../../components/Select";
import { Input } from "../../components/Input";
import { Alert } from "../../components/Alert";
import { Table } from "../../components/Table";
import { Card } from "../../components/Card";

export function LocacaoList() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);

  const [clienteId, setClienteId] = useState("");
  const [veiculoId, setVeiculoId] = useState("");
  const [dataRetirada, setDataRetirada] = useState("");
  const [dataDevolucao, setDataDevolucao] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("");


  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [salvando, setSalvando] = useState(false);

  const locacoesFiltradas = locacoes.filter((locacao) => {
    const correspondeStatus =
      filtroStatus === "" ||
      locacao.status === filtroStatus;

    const correspondeCliente =
      filtroCliente === "" ||
      locacao.clienteId === filtroCliente;

  return correspondeStatus && correspondeCliente;
  });


  async function carregarDados() {
    const [
      dadosClientes,
      dadosVeiculos,
      dadosModelos,
      dadosCategorias,
      dadosLocacoes,
      dadosContratos,
    ] = await Promise.all([
      clienteService.listar(),
      veiculoService.listar(),
      modeloService.listar(),
      categoriaService.listar(),
      locacaoService.listar(),
      contratoService.listar(),
    ]);

    setClientes(dadosClientes);
    setVeiculos(dadosVeiculos);
    setModelos(dadosModelos);
    setCategorias(dadosCategorias);
    setLocacoes(dadosLocacoes);
    setContratos(dadosContratos);
  }

  useEffect(() => {
    carregarDados().catch(() =>
      setErro("Erro ao carregar dados da locadora.")
    );
  }, []);

  const veiculosDisponiveis = veiculos.filter(
    (veiculo) =>
      !locacoes.some(
        (locacao) =>
          locacao.veiculoId === veiculo.id &&
          locacao.status === "ABERTA"
      )
  );

  function nomeModelo(veiculo: Veiculo): string {
    return (
      modelos.find((modelo) => modelo.id === veiculo.modeloId)
        ?.nome ?? "Modelo desconhecido"
    );
  }

  const veiculoSelecionado = veiculos.find(
    (veiculo) => veiculo.id === veiculoId
  );

  const modeloSelecionado = modelos.find(
    (modelo) => modelo.id === veiculoSelecionado?.modeloId
  );

  const categoriaSelecionada = categorias.find(
    (categoria) =>
      categoria.id === modeloSelecionado?.categoriaId
  );

  const valorDiaria = categoriaSelecionada?.valorLocacao ?? 0;

  const numeroDiarias = calcularDiarias(
    dataRetirada,
    dataDevolucao
  );

  const valorPrevisto = calcularValorLocacao(
    dataRetirada,
    dataDevolucao,
    valorDiaria
  );

  function formatarMoeda(valor: number): string {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  async function salvarLocacao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setSucesso("");

    if (salvando) return;

    if (!clienteId || !veiculoId || !dataRetirada || !dataDevolucao) {
      setErro("Preencha todos os campos.");
      return;
    }

    if (numeroDiarias <= 0) {
      setErro("A devolução deve ser posterior à retirada.");
      return;
    }

    const cliente = clientes.find((item) => item.id === clienteId);
    const veiculo = veiculos.find((item) => item.id === veiculoId);

    if (!cliente || !veiculo || !categoriaSelecionada) {
      setErro("Cliente, veículo ou categoria não encontrado.");
      return;
    }

    if (cliente.validadeCnh < dataRetirada) {
      setErro("A CNH do cliente estará vencida na retirada.");
      return;
    }

    setSalvando(true);

    let locacaoCriadaId: string | undefined;

    try {
      // Verifica novamente a disponibilidade antes de salvar.
      const indisponivel =
        await locacaoService.veiculoEstaLocado(veiculoId);

      if (indisponivel) {
        setErro("Este veículo já possui uma locação em aberto.");
        await carregarDados();
        return;
      }

      const novaLocacao: Locacao = {
        clienteId,
        veiculoId,
        dataRetirada,
        dataDevolucaoPrevista: dataDevolucao,
        kmRetirada: veiculo.kmRodado,
        valorTotal: valorPrevisto,
        status: "ABERTA",
      };

      const locacaoCriada =
        await locacaoService.criar(novaLocacao);

      if (!locacaoCriada.id) {
        throw new Error("A API não retornou o ID da locação.");
      }

      locacaoCriadaId = locacaoCriada.id;

      const novoContrato: Contrato = {
        numero: `CONT-${crypto.randomUUID()}`,
        dataEmissao: new Date().toISOString().slice(0, 10),
        locacaoId: locacaoCriada.id,
        termos:
          "Contrato de locação de veículo. " +
          "O cliente se compromete a devolver o veículo " +
          "nas condições e data estabelecidas. " +
          "Valor previsto: " + formatarMoeda(valorPrevisto),
      };

      await contratoService.criar(novoContrato);

      setClienteId("");
      setVeiculoId("");
      setDataRetirada("");
      setDataDevolucao("");

      await carregarDados();

      setSucesso(
        "Locação cadastrada e contrato gerado com sucesso!"
      );
    } catch {
      // Evita deixar uma locação sem contrato se a
      // criação do contrato falhar.
      if (locacaoCriadaId) {
        try {
          const contratosAtuais = await contratoService.listar();
          const possuiContrato = contratosAtuais.some(
            (contrato) => contrato.locacaoId === locacaoCriadaId
          );

          if (!possuiContrato) {
            await locacaoService.excluir(locacaoCriadaId);
          }
        } catch {
          setErro(
            "Falha ao concluir a operação. Confira os registros " +
            "antes de tentar novamente."
          );
          return;
        }
      }

      setErro(
        "Erro ao registrar locação. Confira os dados e tente novamente."
      );
    } finally {
      setSalvando(false);
    }
  }

  const columns: TableColumn<Locacao>[] = [
    {
      header: "ID",
      render: (locacao) => locacao.id,
    },
    {
      header: "Cliente",
      render: (locacao) =>
        clientes.find((c) => c.id === locacao.clienteId)
          ?.nome ?? "Não encontrado",
    },
    {
      header: "Veículo",
      render: (locacao) => {
        const veiculo = veiculos.find(
          (v) => v.id === locacao.veiculoId
        );

        return veiculo
          ? `${nomeModelo(veiculo)} - ${veiculo.placa}`
          : "Não encontrado";
      },
    },
    {
      header: "Retirada",
      render: (locacao) => locacao.dataRetirada,
    },
    {
      header: "Devolução prevista",
      render: (locacao) => locacao.dataDevolucaoPrevista,
    },
    {
      header: "Valor",
      render: (locacao) => formatarMoeda(locacao.valorTotal),
    },
    {
      header: "Status",
      render: (locacao) => locacao.status,
    },
    {
      header: "Contrato",
      render: (locacao) =>
        contratos.find((c) => c.locacaoId === locacao.id)
          ?.numero ?? "Não encontrado",
    },
  ];

  return (
    <div className="container mt-4">
      <h2>Locação de Veículos</h2>

      <Alert type="danger" message={erro} />
      <Alert type="success" message={sucesso} />

      <Card title="Nova locação">
        <form onSubmit={salvarLocacao}>
          <Select
            label="Cliente"
            name="clienteId"
            value={clienteId}
            options={clientes
              .filter((c) => c.id !== undefined)
              .map((c) => ({
                value: c.id!,
                label: `${c.nome} - CPF: ${c.cpf}`,
              }))}
            onChange={(e) => setClienteId(e.target.value)}
          />

          <Select
            label="Veículo disponível"
            name="veiculoId"
            value={veiculoId}
            options={veiculosDisponiveis
              .filter((v) => v.id !== undefined)
              .map((v) => ({
                value: v.id!,
                label: `${nomeModelo(v)} - ${v.placa} - ${v.cor}`,
              }))}
            onChange={(e) => setVeiculoId(e.target.value)}
          />

          <Input
            label="Data de retirada"
            name="dataRetirada"
            type="date"
            value={dataRetirada}
            onChange={(e) => setDataRetirada(e.target.value)}
          />

          <Input
            label="Devolução prevista"
            name="dataDevolucao"
            type="date"
            value={dataDevolucao}
            onChange={(e) => setDataDevolucao(e.target.value)}
          />

          {veiculoId && (
            <div className="alert alert-info">
              <strong>Valor da diária:</strong>{" "}
              {formatarMoeda(valorDiaria)}
              <div>
                <strong>Número de diárias:</strong>{" "}
                {numeroDiarias}
              </div>
              <div>
                <strong>Valor previsto:</strong>{" "}
                {formatarMoeda(valorPrevisto)}
              </div>
            </div>
          )}

          <Button
            label={salvando ? "Salvando..." : "Registrar locação"}
            type="submit"
            disabled={salvando}
          />
        </form>
      </Card>

      <h4 className="mt-4">Locações registradas</h4>

    <div className="row mb-3">
      <div className="col-md-6">
        <Select
          label="Filtrar por status"
          name="filtroStatus"
          value={filtroStatus}
          options={[
            { value: "ABERTA", label: "Aberta" },
            { value: "FINALIZADA", label: "Finalizada" },
            { value: "CANCELADA", label: "Cancelada" },
          ]}
          onChange={(e) => setFiltroStatus(e.target.value)}
        />
      </div>

    <div className="col-md-6">
      <Select
        label="Filtrar por cliente"
        name="filtroCliente"
        value={filtroCliente}
        options={clientes
          .filter((cliente) => cliente.id !== undefined)
          .map((cliente) => ({
            value: cliente.id!,
            label: cliente.nome,
          }))}
      onChange={(e) => setFiltroCliente(e.target.value)}
    />
  </div>
</div>

<p className="text-muted">
  {locacoesFiltradas.length} locação(ões) encontrada(s).
</p>


      <Table<Locacao>
        columns={columns}
        data={locacoesFiltradas}
      />
    </div>
  );
}
