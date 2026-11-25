
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import type { Veiculo } from "../../models/Veiculo";
import type { Modelo } from "../../models/Modelo";
import type { TableColumn } from "../../components/Table";
import type { Locacao } from "../../models/Locacao";
import type { Manutencao } from "../../models/Manutencao";

import { veiculoService } from "../../service/veiculoService";
import { modeloService } from "../../service/modeloService";
import { locacaoService } from "../../service/locacaoService";
import { manutencaoService } from "../../service/manutencaoService";

import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Select } from "../../components/Select";
import { Table } from "../../components/Table";
import { Alert } from "../../components/Alert";
import { Modal } from "../../components/Modal";

export function VeiculoList() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [manutencoes, setManutencoes] = useState<Manutencao[]>([]);

  const [placa, setPlaca] = useState("");
  const [chassi, setChassi] = useState("");
  const [anoFabricacao, setAnoFabricacao] = useState("");
  const [cor, setCor] = useState("");
  const [kmRodado, setKmRodado] = useState("");
  const [modeloId, setModeloId] = useState("");

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [veiculoParaExcluir, setVeiculoParaExcluir] = useState<Veiculo | null>(null);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function carregarVeiculos() {
    const dados = await veiculoService.listar();
    setVeiculos(dados);
  }

  
  useEffect(() => {
    Promise.all([
      veiculoService.listar(),
      modeloService.listar(),
      locacaoService.listar(),
      manutencaoService.listar(),
    ])
      .then(([
        dadosVeiculos,
        dadosModelos,
        dadosLocacoes,
        dadosManutencoes,
      ]) => {
        setVeiculos(dadosVeiculos);
        setModelos(dadosModelos);
        setLocacoes(dadosLocacoes);
        setManutencoes(dadosManutencoes);
      })
      .catch(() => setErro("Erro ao carregar dados."));
  }, []);


  function limparFormulario() {
    setPlaca("");
    setChassi("");
    setAnoFabricacao("");
    setCor("");
    setKmRodado("");
    setModeloId("");
    setEditandoId(null);
  }

  async function salvarVeiculo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setSucesso("");

    const placaNormalizada = placa.trim().toUpperCase();
    const chassiNormalizado = chassi.trim().toUpperCase();
    const ano = Number(anoFabricacao);
    const km = Number(kmRodado);

    if (
      !placaNormalizada ||
      !chassiNormalizado ||
      !cor.trim() ||
      !modeloId ||
      !anoFabricacao.trim() ||
      !kmRodado.trim() ||
      !Number.isInteger(ano) ||
      ano < 1900 ||
      ano > new Date().getFullYear() + 1 ||
      !Number.isInteger(km) ||
      km < 0
    ) {
      setErro("Preencha corretamente todos os campos.");
      return;
    }

    const veiculo: Veiculo = {
      placa: placaNormalizada,
      chassi: chassiNormalizado,
      anoFabricacao: ano,
      cor: cor.trim(),
      kmRodado: km,
      modeloId,
    };

    try {
      const existentes = await veiculoService.listar();

      const placaDuplicada = existentes.some(
        (item) =>
          item.placa.toUpperCase() === placaNormalizada &&
          item.id !== editandoId
      );

      const chassiDuplicado = existentes.some(
        (item) =>
          item.chassi.toUpperCase() === chassiNormalizado &&
          item.id !== editandoId
      );

      if (placaDuplicada || chassiDuplicado) {
        setErro("Já existe um veículo com esta placa ou chassi.");
        return;
      }

      if (editandoId) {
        await veiculoService.atualizar(editandoId, veiculo);
      } else {
        await veiculoService.criar(veiculo);
      }

      limparFormulario();
      await carregarVeiculos();
      setSucesso("Veículo salvo com sucesso!");
    } catch {
      setErro("Erro ao salvar veículo.");
    }
  }

  function editarVeiculo(veiculo: Veiculo) {
    if (!veiculo.id) return;

    setPlaca(veiculo.placa);
    setChassi(veiculo.chassi);
    setAnoFabricacao(String(veiculo.anoFabricacao));
    setCor(veiculo.cor);
    setKmRodado(String(veiculo.kmRodado));
    setModeloId(veiculo.modeloId);
    setEditandoId(veiculo.id);
    setErro("");
    setSucesso("");
  }

  async function excluirVeiculo(veiculo: Veiculo) {
    if (!veiculo.id) return;

    try {
      const possuiDependentes =
        await veiculoService.possuiDependentes(veiculo.id);

      if (possuiDependentes) {
        setErro(
          "Este veículo possui locações ou manutenções vinculadas."
        );
        setVeiculoParaExcluir(null);
        return;
      }

      await veiculoService.excluir(veiculo.id);
      await carregarVeiculos();
      setSucesso("Veículo excluído com sucesso!");
      setErro("");
    } catch {
      setErro("Erro ao excluir veículo.");
    } finally {
      setVeiculoParaExcluir(null);
    }
  }

  function obterStatusVeiculo(
    veiculo: Veiculo): "DISPONIVEL" | "LOCADO" | "EM_MANUTENCAO" {
    const estaLocado = locacoes.some((locacao) =>locacao.veiculoId === veiculo.id &&locacao.status === "ABERTA");

    if (estaLocado) {
      return "LOCADO";
    }
    const estaEmManutencao = manutencoes.some((manutencao) =>manutencao.veiculoId === veiculo.id &&manutencao.status === "EM_ANDAMENTO");
    if (estaEmManutencao) {
    return "EM_MANUTENCAO";
    }

    return "DISPONIVEL";
  }


  const columns: TableColumn<Veiculo>[] = [
    {
      header: "Placa",
      render: (veiculo) => veiculo.placa,
    },
    {
      header: "Chassi",
      render: (veiculo) => veiculo.chassi,
    },
    {
      header: "Modelo",
      render: (veiculo) =>
        modelos.find((modelo) => modelo.id === veiculo.modeloId)
          ?.nome ?? "Não encontrado",
    },
    {
      header: "Ano",
      render: (veiculo) => veiculo.anoFabricacao,
    },
    {
      header: "Cor",
      render: (veiculo) => veiculo.cor,
    },
    {
      header: "KM",
      render: (veiculo) => veiculo.kmRodado,
    },

  {
      header: "Situação",
      render: (veiculo) => {
        const status = obterStatusVeiculo(veiculo);

        const configuracao = {
          DISPONIVEL: {
            texto: "Disponível",
            classe: "bg-success",
          },
          LOCADO: {
            texto: "Locado",
            classe: "bg-warning text-dark",
          },
          EM_MANUTENCAO: {
            texto: "Em manutenção",
            classe: "bg-danger",
          },
        };

        const atual = configuracao[status];

        return (
          <span className={`badge ${atual.classe}`}>
            {atual.texto}
          </span>
        );
      },
    },

  ];

  return (
    <div className="container mt-4">
      <h2>Cadastro de Veículos</h2>

      <Alert type="danger" message={erro} />
      <Alert type="success" message={sucesso} />

      <form onSubmit={salvarVeiculo} className="mb-4">
        <Input
          label="Placa"
          name="placa"
          value={placa}
          onChange={(e) => setPlaca(e.target.value)}
          placeholder="ABC1D23"
        />

        <Input
          label="Chassi"
          name="chassi"
          value={chassi}
          onChange={(e) => setChassi(e.target.value)}
          placeholder="Número do chassi"
        />

        <Input
          label="Ano de fabricação"
          name="anoFabricacao"
          type="number"
          value={anoFabricacao}
          onChange={(e) => setAnoFabricacao(e.target.value)}
        />

        <Input
          label="Cor"
          name="cor"
          value={cor}
          onChange={(e) => setCor(e.target.value)}
        />

        <Input
          label="Quilometragem"
          name="kmRodado"
          type="number"
          value={kmRodado}
          onChange={(e) => setKmRodado(e.target.value)}
        />

        <Select
          label="Modelo"
          name="modeloId"
          value={modeloId}
          options={modelos
            .filter((modelo) => modelo.id !== undefined)
            .map((modelo) => ({
              value: modelo.id!,
              label: `${modelo.nome} (${modelo.ano})`,
            }))}
          onChange={(e) => setModeloId(e.target.value)}
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

      <Table<Veiculo>
        columns={columns}
        data={veiculos}
        onEdit={editarVeiculo}
        onDelete={setVeiculoParaExcluir}
      />

      <Modal
        show={veiculoParaExcluir !== null}
        title="Confirmar exclusão"
        onClose={() => setVeiculoParaExcluir(null)}
        onConfirm={() => {
          if (veiculoParaExcluir) {
            void excluirVeiculo(veiculoParaExcluir);
          }
        }}
      />
    </div>
  );
}
