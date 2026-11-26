
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { Categoria } from "../../models/Categoria";
import type { TableColumn } from "../../components/Table";

import { categoriaService } from "../../service/categoriaService";
import { modeloService } from "../../service/modeloService";

import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Table } from "../../components/Table";
import { Alert } from "../../components/Alert";
import { Modal } from "../../components/Modal";

export function CategoriaList() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [nome, setNome] = useState("");
  const [valorLocacao, setValorLocacao] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [categoriaParaExcluir, setCategoriaParaExcluir] =
    useState<Categoria | null>(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function carregarCategorias() {
    try {
      const dados = await categoriaService.listar();
      setCategorias(dados);
    } catch {
      setErro("Erro ao carregar categorias.");
    }
  }

  useEffect(() => {
    categoriaService.listar()
      .then(setCategorias)
      .catch(() => setErro("Erro ao carregar categorias."));
  }, []);

  async function salvarCategoria(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setSucesso("");

    const valor = Number(valorLocacao);

    if (!nome.trim() || !valorLocacao.trim() ||
        !Number.isFinite(valor) || valor <= 0) {
      setErro("Informe um nome e uma diária maior que zero.");
      return;
    }

    try {
      const categoria = {
        nome: nome.trim(),
        valorLocacao: valor,
      };

      if (editandoId) {
        await categoriaService.atualizar(editandoId, categoria);
      } else {
        await categoriaService.criar(categoria);
      }

      setNome("");
      setValorLocacao("");
      setEditandoId(null);
      await carregarCategorias();
      setSucesso("Categoria salva com sucesso!");
    } catch {
      setErro("Erro ao salvar categoria.");
    }
  }

  function editarCategoria(categoria: Categoria) {
    if (!categoria.id) return;

    setNome(categoria.nome);
    setValorLocacao(String(categoria.valorLocacao));
    setEditandoId(categoria.id);
    setErro("");
    setSucesso("");
  }

  async function excluirCategoria(categoria: Categoria) {
    if (!categoria.id) return;

    try {
      const modelos = await modeloService.listar();

      if (modelos.some(
        (modelo) => modelo.categoriaId === categoria.id
      )) {
        setErro("Esta categoria possui modelos vinculados e não pode ser excluída.");
        setCategoriaParaExcluir(null);
        return;
      }

      await categoriaService.excluir(categoria.id);
      setCategoriaParaExcluir(null);
      setErro("");
      await carregarCategorias();
      setSucesso("Categoria excluída com sucesso!");
    } catch {
      setErro("Erro ao excluir categoria.");
      setCategoriaParaExcluir(null);
    }
  }

  const columns: TableColumn<Categoria>[] = [
    { header: "ID", render: (categoria) => categoria.id },
    { header: "Nome", render: (categoria) => categoria.nome },
    {
      header: "Valor da diária",
      render: (categoria) =>
        categoria.valorLocacao.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        }),
    },
  ];

  return (
    <div className="container mt-4">
      <h2>Cadastro de Categorias</h2>

      <Alert type="danger" message={erro} />
      <Alert type="success" message={sucesso} />

      <form onSubmit={salvarCategoria} className="mb-4">
        <Input
          label="Nome da categoria"
          name="nome"
          value={nome}
          onChange={(event) => setNome(event.target.value)}
          placeholder="Ex.: Econômico"
        />

        <Input
          label="Valor da diária (R$)"
          name="valorLocacao"
          type="number"
          value={valorLocacao}
          onChange={(event) => setValorLocacao(event.target.value)}
          placeholder="Ex.: 150"
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
              onClick={() => {
                setEditandoId(null);
                setNome("");
                setValorLocacao("");
              }}
            />
          )}
        </div>
      </form>

      <Table<Categoria>
        columns={columns}
        data={categorias}
        onEdit={editarCategoria}
        onDelete={setCategoriaParaExcluir}
      />

      <Modal
        show={categoriaParaExcluir !== null}
        title="Confirmar exclusão"
        onClose={() => setCategoriaParaExcluir(null)}
        onConfirm={() => {
          if (categoriaParaExcluir) {
            void excluirCategoria(categoriaParaExcluir);
          }
        }}
      />
    </div>
  );
}
