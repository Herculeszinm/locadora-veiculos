
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import type { Modelo } from "../../models/Modelo";
import type { Marca } from "../../models/Marca";
import type { Categoria } from "../../models/Categoria";
import type { TableColumn } from "../../components/Table";

import { modeloService } from "../../service/modeloService";
import { marcaService } from "../../service/marcaService";
import { categoriaService } from "../../service/categoriaService";
import { api } from "../../service/api";

import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Select } from "../../components/Select";
import { Table } from "../../components/Table";
import { Alert } from "../../components/Alert";
import { Modal } from "../../components/Modal";

interface VeiculoVinculado {
  modeloId: string;
}

export function ModeloList() {
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  const [nome, setNome] = useState("");
  const [ano, setAno] = useState("");
  const [marcaId, setMarcaId] = useState("");
  const [categoriaId, setCategoriaId] = useState("");

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [modeloParaExcluir, setModeloParaExcluir] =
    useState<Modelo | null>(null);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function carregarModelos() {
    try {
      const dados = await modeloService.listar();
      setModelos(dados);
    } catch {
      setErro("Erro ao carregar modelos.");
    }
  }

  useEffect(() => {
    Promise.all([
      modeloService.listar(),
      marcaService.listar(),
      categoriaService.listar(),
    ])
      .then(([dadosModelos, dadosMarcas, dadosCategorias]) => {
        setModelos(dadosModelos);
        setMarcas(dadosMarcas);
        setCategorias(dadosCategorias);
      })
      .catch(() => setErro("Erro ao carregar dados."));
  }, []);

  function limparFormulario() {
    setNome("");
    setAno("");
    setMarcaId("");
    setCategoriaId("");
    setEditandoId(null);
  }

  async function salvarModelo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setSucesso("");

    const anoNumero = Number(ano);

    if (
      !nome.trim() ||
      !ano.trim() ||
      !Number.isInteger(anoNumero) ||
      anoNumero < 1900 ||
      !marcaId ||
      !categoriaId
    ) {
      setErro("Preencha corretamente todos os campos.");
      return;
    }

    const modelo: Modelo = {
      nome: nome.trim(),
      ano: anoNumero,
      marcaId,
      categoriaId,
    };

    try {
      if (editandoId) {
        await modeloService.atualizar(editandoId, modelo);
      } else {
        await modeloService.criar(modelo);
      }

      limparFormulario();
      await carregarModelos();
      setSucesso("Modelo salvo com sucesso!");
    } catch {
      setErro("Erro ao salvar modelo.");
    }
  }

  function editarModelo(modelo: Modelo) {
    if (!modelo.id) return;

    setNome(modelo.nome);
    setAno(String(modelo.ano));
    setMarcaId(modelo.marcaId);
    setCategoriaId(modelo.categoriaId);
    setEditandoId(modelo.id);
    setErro("");
    setSucesso("");
  }

  async function excluirModelo(modelo: Modelo) {
    if (!modelo.id) return;

    try {
      const resposta = await api.get<VeiculoVinculado[]>("/veiculos");

      if (resposta.data.some(
        (veiculo) => veiculo.modeloId === modelo.id
      )) {
        setErro("Este modelo possui veículos vinculados e não pode ser excluído.");
        setModeloParaExcluir(null);
        return;
      }

      await modeloService.excluir(modelo.id);
      setModeloParaExcluir(null);
      await carregarModelos();
      setErro("");
      setSucesso("Modelo excluído com sucesso!");
    } catch {
      setErro("Erro ao excluir modelo.");
      setModeloParaExcluir(null);
    }
  }

  const columns: TableColumn<Modelo>[] = [
    {
      header: "ID",
      render: (modelo) => modelo.id,
    },
    {
      header: "Nome",
      render: (modelo) => modelo.nome,
    },
    {
      header: "Ano",
      render: (modelo) => modelo.ano,
    },
    {
      header: "Marca",
      render: (modelo) =>
        marcas.find((marca) => marca.id === modelo.marcaId)?.nome
        ?? "Não encontrada",
    },
    {
      header: "Categoria",
      render: (modelo) =>
        categorias.find(
          (categoria) => categoria.id === modelo.categoriaId
        )?.nome ?? "Não encontrada",
    },
  ];

  return (
    <div className="container mt-4">
      <h2>Cadastro de Modelos</h2>

      <Alert type="danger" message={erro} />
      <Alert type="success" message={sucesso} />

      <form onSubmit={salvarModelo} className="mb-4">
        <Input
          label="Nome do modelo"
          name="nome"
          value={nome}
          onChange={(event) => setNome(event.target.value)}
          placeholder="Ex.: Corolla"
        />

        <Input
          label="Ano do modelo"
          name="ano"
          type="number"
          value={ano}
          onChange={(event) => setAno(event.target.value)}
          placeholder="Ex.: 2025"
        />

        <Select
          label="Marca"
          name="marcaId"
          value={marcaId}
          options={marcas
            .filter((marca) => marca.id !== undefined)
            .map((marca) => ({
              value: marca.id!,
              label: marca.nome,
            }))}
          onChange={(event) => setMarcaId(event.target.value)}
        />

        <Select
          label="Categoria"
          name="categoriaId"
          value={categoriaId}
          options={categorias
            .filter((categoria) => categoria.id !== undefined)
            .map((categoria) => ({
              value: categoria.id!,
              label: categoria.nome,
            }))}
          onChange={(event) => setCategoriaId(event.target.value)}
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

      <Table<Modelo>
        columns={columns}
        data={modelos}
        onEdit={editarModelo}
        onDelete={setModeloParaExcluir}
      />

      <Modal
        show={modeloParaExcluir !== null}
        title="Confirmar exclusão"
        onClose={() => setModeloParaExcluir(null)}
        onConfirm={() => {
          if (modeloParaExcluir) {
            void excluirModelo(modeloParaExcluir);
          }
        }}
      />
    </div>
  );
}
