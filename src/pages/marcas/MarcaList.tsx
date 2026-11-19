
import { useEffect, useState } from "react";
import { marcaService } from "../../service/marcaService";
import type { Marca } from "../../models/Marca";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Table } from "../../components/Table";
import type { TableColumn } from "../../components/Table";
import { Alert } from "../../components/Alert";

export function MarcaList() {
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [nome, setNome] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const columns: TableColumn<Marca>[] = [
    { 
        header: "ID", 
        render: (marca) => marca.id 
    },
    { 
        header: "Nome", 
        render: (marca) => marca.nome 
    },
  ];

  async function carregarMarcas() {
    try {
      const dados = await marcaService.listar();
      setMarcas(dados);
      setErro("");
    } catch {
      setErro("Erro ao carregar marcas.");
    }
  }

  useEffect(() => {
    marcaService.listar()
      .then(setMarcas)
      .catch(() => setErro("Erro ao carregar marcas."));
  }, []);

  async function salvarMarca(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!nome.trim()) {
      setErro("Informe o nome da marca.");
      return;
    }

    try {
      if (editandoId) {
        await marcaService.atualizar(editandoId, { nome });
      } else {
        await marcaService.criar({ nome });
      }

      setNome("");
      setEditandoId(null);
      await carregarMarcas();
    } catch {
      setErro("Erro ao salvar marca.");
    }
  }

  function editarMarca(marca: Marca) {
    if (!marca.id) return;

    setNome(marca.nome);
    setEditandoId(marca.id);
  }

  async function excluirMarca(marca: Marca) {
    if (!marca.id) return;

    if (!window.confirm(`Excluir a marca ${marca.nome}?`)) return;

    try {
      const modelos = await fetch("http://localhost:3001/modelos")
        .then(resposta => resposta.json() as Promise<{ marcaId: string }[]>);

      if (modelos.some(modelo => modelo.marcaId === marca.id)) {
        setErro("Esta marca possui modelos vinculados e não pode ser excluída.");
        return;
      }

      await marcaService.excluir(marca.id);
      await carregarMarcas();
    } catch {
      setErro("Erro ao excluir marca.");
    }
  }

  return (
    <div className="container mt-4">
      <h2>Cadastro de Marcas</h2>

      <Alert type="danger" message={erro} />

      <form onSubmit={salvarMarca} className="mb-4">
        <Input
          label="Nome da marca"
          name="nome"
          value={nome}
          onChange={(event) => setNome(event.target.value)}
          placeholder="Digite o nome da marca"
        />

        <Button
          label={editandoId ? "Atualizar" : "Cadastrar"}
          type="submit"
        />
      </form>

      <Table<Marca>
        columns={columns}
        data={marcas}
        onEdit={editarMarca}
        onDelete={excluirMarca}
        />
    </div>
  );
}
