import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import type { Manutencao } from "../../models/Manutencao";
import type { Veiculo } from "../../models/Veiculo";
import type { TableColumn } from "../../components/Table";
import type { Modelo } from "../../models/Modelo";
import type { StatusManutencao } from "../../models/Manutencao";

import { manutencaoService } from "../../service/manutencaoService";
import { veiculoService } from "../../service/veiculoService";
import { modeloService } from "../../service/modeloService";
import { locacaoService } from "../../service/locacaoService";

import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { TextArea } from "../../components/TextArea";
import { Select } from "../../components/Select";
import { Table } from "../../components/Table";
import { Alert } from "../../components/Alert";
import { Modal } from "../../components/Modal";

export function ManutencaoList() {
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);

  const [data, setData] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [veiculoId, setVeiculoId] = useState("");

  const [filtroVeiculoId, setFiltroVeiculoId] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [paraExcluir, setParaExcluir] = useState<Manutencao | null>(null);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [statusManutencao, setStatusManutencao] = useState<StatusManutencao>("CONCLUIDA");

  
  useEffect(() => {
    Promise.all([
      manutencaoService.listar(),
      veiculoService.listar(),
      modeloService.listar(),
    ])
      .then(([dadosManutencoes, dadosVeiculos, dadosModelos]) => {
        setManutencoes(dadosManutencoes);
        setVeiculos(dadosVeiculos);
        setModelos(dadosModelos);
      } )
      .catch(() => {
        setErro("Erro ao carregar os dados.");
      });
  }, []);


  async function carregarManutencoes() {
    const dados = await manutencaoService.listar();
    setManutencoes(dados);
  }

  function limparFormulario() {
    setData("");
    setDescricao("");
    setValor("");
    setVeiculoId("");
    setEditandoId(null);
    setStatusManutencao("CONCLUIDA");
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setSucesso("");

    const valorNumero = Number(valor);

    if (
      !data ||
      !descricao.trim() ||
      !veiculoId ||
      !valor.trim() ||
      !Number.isFinite(valorNumero) ||
      valorNumero < 0
    ) {
      setErro("Preencha corretamente todos os campos.");
      return;
    }

    const manutencao: Manutencao = {
      data,
      descricao: descricao.trim(),
      valor: valorNumero,
      veiculoId,
      status: statusManutencao,
    };

    try {
      if (statusManutencao === "EM_ANDAMENTO") {
        const locacoes = await locacaoService.listar();

        const veiculoLocado = locacoes.some(
        (locacao) => locacao.veiculoId === veiculoId &&locacao.status === "ABERTA");

      if (veiculoLocado) {
        setErro("Não é possível iniciar manutenção em um veículo locado.");
      return;
    }
  }
      if (editandoId) {
        await manutencaoService.atualizar(editandoId, manutencao);
      } else {
        await manutencaoService.criar(manutencao);
      }

      limparFormulario();
      await carregarManutencoes();
      setSucesso("Manutenção salva com sucesso!");
    } catch {
      setErro("Erro ao salvar manutenção.");
    }
  }

  function editar(item: Manutencao) {
    if (!item.id) return;
    setStatusManutencao(item.status ?? "CONCLUIDA");
    setData(item.data);
    setDescricao(item.descricao);
    setValor(String(item.valor));
    setVeiculoId(item.veiculoId);
    setEditandoId(item.id);
    setErro("");
    setSucesso("");
  }

  async function excluir(item: Manutencao) {
    if (!item.id) return;

    try {
      await manutencaoService.excluir(item.id);
      await carregarManutencoes();
      setErro("");
      setSucesso("Manutenção excluída com sucesso!");
    } catch {
      setErro("Erro ao excluir manutenção.");
    } finally {
      setParaExcluir(null);
    }
  }

  const opcoesVeiculos = veiculos
  .filter((v) => v.id !== undefined)
  .map((v) => {
    const modelo = modelos.find(
      (m) => m.id === v.modeloId
    );

    return {
      value: v.id!,
      label: `${modelo?.nome ?? "Modelo desconhecido"} - ${v.placa} - ${v.cor}`,
    };
  });

  const manutencoesFiltradas = filtroVeiculoId
    ? manutencoes.filter((m) => m.veiculoId === filtroVeiculoId)
    : manutencoes;

  const columns: TableColumn<Manutencao>[] = [
    {
      header: "Data",
      render: (m) => m.data.split("-").reverse().join("/"),
    },
    {
      header: "Veículo",
      render: (m) =>
        veiculos.find((v) => v.id === m.veiculoId)?.placa
        ?? "Não encontrado",
    },
    {
      header: "Descrição",
      render: (m) => m.descricao,
    },
    {
      header: "Valor",
      render: (m) =>
        m.valor.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        }),
    },
    {
      header: "Situação",
      render: (m) => (
        <span
        className={
        m.status === "EM_ANDAMENTO"
          ? "badge bg-danger"
          : "badge bg-success"
        }
      >
      {m.status === "EM_ANDAMENTO"
        ? "Em andamento"
        : "Concluída"}
        </span>
      ),
    },
  ];

  return (
    <div className="container mt-4">
      <h2>Cadastro de Manutenções</h2>

      <Alert type="danger" message={erro} />
      <Alert type="success" message={sucesso} />

      <form onSubmit={salvar} className="mb-4">
        <Input
          label="Data da manutenção"
          name="data"
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
        />

        <Select
          label="Veículo"
          name="veiculoId"
          value={veiculoId}
          options={opcoesVeiculos}
          onChange={(e) => setVeiculoId(e.target.value)}
        />

        <Select
          label="Situação da manutenção"
          name="statusManutencao"
          value={statusManutencao}
          options={[
            { value: "CONCLUIDA", label: "Concluída" },
            { value: "EM_ANDAMENTO", label: "Em andamento" },
          ]}
          onChange={(e) =>
            setStatusManutencao(
              e.target.value as StatusManutencao
            )
          }
        />

        <TextArea
          label="Descrição"
          name="descricao"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />

        <Input
          label="Valor (R$)"
          name="valor"
          type="number"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />

        <div className="d-flex gap-2">
          <Button
            label={editandoId ? "Atualizar" : "Cadastrar"}
            type="submit"
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

      <hr />

      <h4>Histórico de Manutenções</h4>

      <Select
        label="Filtrar por veículo"
        name="filtroVeiculoId"
        value={filtroVeiculoId}
        options={opcoesVeiculos}
        onChange={(e) => setFiltroVeiculoId(e.target.value)}
      />

      <Table<Manutencao>
        columns={columns}
        data={manutencoesFiltradas}
        onEdit={editar}
        onDelete={setParaExcluir}
      />

      <Modal
        show={paraExcluir !== null}
        title="Confirmar exclusão"
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
