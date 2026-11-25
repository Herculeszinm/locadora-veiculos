
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import type { Cliente } from "../../models/Cliente";
import type { TableColumn } from "../../components/Table";

import { clienteService } from "../../service/clienteService";

import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Table } from "../../components/Table";
import { Alert } from "../../components/Alert";
import { Modal } from "../../components/Modal";

export function ClienteList() {
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [cnh, setCnh] = useState("");
  const [validadeCnh, setValidadeCnh] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [clienteParaExcluir, setClienteParaExcluir] =
    useState<Cliente | null>(null);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function carregarClientes() {
    const dados = await clienteService.listar();
    setClientes(dados);
  }

  useEffect(() => {
    clienteService.listar()
      .then(setClientes)
      .catch(() => setErro("Erro ao carregar clientes."));
  }, []);

  function limparFormulario() {
    setNome("");
    setCpf("");
    setCnh("");
    setValidadeCnh("");
    setTelefone("");
    setEmail("");
    setEndereco("");
    setEditandoId(null);
  }

  function limparMensagens() {
    setErro("");
    setSucesso("");
  }

  async function salvarCliente(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    limparMensagens();

    const cpfNormalizado = cpf.replace(/\D/g, "");
    const cnhNormalizada = cnh.replace(/\D/g, "");
    const telefoneNormalizado = telefone.replace(/\D/g, "");

    if (
      !nome.trim() ||
      !validadeCnh ||
      !telefoneNormalizado ||
      !email.trim() ||
      !endereco.trim()
    ) {
      setErro("Preencha todos os campos.");
      return;
    }

    if (!/^\d{11}$/.test(cpfNormalizado)) {
      setErro("O CPF deve conter 11 números.");
      return;
    }

    if (!/^\d{11}$/.test(cnhNormalizada)) {
      setErro("A CNH deve conter 11 números.");
      return;
    }

    const cliente: Cliente = {
      nome: nome.trim(),
      cpf: cpfNormalizado,
      cnh: cnhNormalizada,
      validadeCnh,
      telefone: telefoneNormalizado,
      email: email.trim(),
      endereco: endereco.trim(),
    };

    try {
      const existentes = await clienteService.listar();

      const cpfDuplicado = existentes.some(
        (item) =>
          item.cpf.replace(/\D/g, "") === cpfNormalizado &&
          item.id !== editandoId
      );

      const cnhDuplicada = existentes.some(
        (item) =>
          item.cnh.replace(/\D/g, "") === cnhNormalizada &&
          item.id !== editandoId
      );

      if (cpfDuplicado) {
        setErro("Já existe um cliente cadastrado com este CPF.");
        return;
      }

      if (cnhDuplicada) {
        setErro("Já existe um cliente cadastrado com esta CNH.");
        return;
      }

      if (editandoId) {
        await clienteService.atualizar(editandoId, cliente);
      } else {
        await clienteService.criar(cliente);
      }

      limparFormulario();
      await carregarClientes();
      setSucesso("Cliente salvo com sucesso!");
    } catch {
      setErro("Erro ao salvar cliente.");
    }
  }

  function editarCliente(cliente: Cliente) {
    if (!cliente.id) return;

    setNome(cliente.nome);
    setCpf(cliente.cpf);
    setCnh(cliente.cnh);
    setValidadeCnh(cliente.validadeCnh);
    setTelefone(cliente.telefone);
    setEmail(cliente.email);
    setEndereco(cliente.endereco);
    setEditandoId(cliente.id);
    limparMensagens();
  }

  async function excluirCliente(cliente: Cliente) {
    if (!cliente.id) return;

    try {
      const possuiLocacoes = await clienteService.possuiLocacoes(
        cliente.id
      );

      if (possuiLocacoes) {
        setErro(
          "Este cliente possui locações vinculadas e não pode ser excluído."
        );
        setSucesso("");
        return;
      }

      await clienteService.excluir(cliente.id);
      await carregarClientes();
      setErro("");
      setSucesso("Cliente excluído com sucesso!");
    } catch {
      setErro("Erro ao excluir cliente.");
      setSucesso("");
    } finally {
      setClienteParaExcluir(null);
    }
  }

  const columns: TableColumn<Cliente>[] = [
    {
      header: "Nome",
      render: (cliente) => cliente.nome,
    },
    {
      header: "CPF",
      render: (cliente) => cliente.cpf,
    },
    {
      header: "CNH",
      render: (cliente) => cliente.cnh,
    },
    {
      header: "Validade da CNH",
      render: (cliente) =>
        cliente.validadeCnh.split("-").reverse().join("/"),
    },
    {
      header: "Telefone",
      render: (cliente) => cliente.telefone,
    },
    {
      header: "E-mail",
      render: (cliente) => cliente.email,
    },
    {
      header: "Endereço",
      render: (cliente) => cliente.endereco,
    },
  ];

  return (
    <div className="container mt-4">
      <h2>Cadastro de Clientes</h2>

      <Alert type="danger" message={erro} />
      <Alert type="success" message={sucesso} />

      <form onSubmit={salvarCliente} className="mb-4">
        <Input
          label="Nome completo"
          name="nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome do cliente"
        />

        <Input
          label="CPF"
          name="cpf"
          value={cpf}
          onChange={(e) => setCpf(e.target.value)}
          placeholder="Somente números"
        />

        <Input
          label="CNH"
          name="cnh"
          value={cnh}
          onChange={(e) => setCnh(e.target.value)}
          placeholder="Número da CNH"
        />

        <Input
          label="Validade da CNH"
          name="validadeCnh"
          type="date"
          value={validadeCnh}
          onChange={(e) => setValidadeCnh(e.target.value)}
        />

        <Input
          label="Telefone"
          name="telefone"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          placeholder="62999999999"
        />

        <Input
          label="E-mail"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="cliente@email.com"
        />

        <Input
          label="Endereço"
          name="endereco"
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
          placeholder="Rua, número, bairro e cidade"
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

      <h4>Clientes Cadastrados</h4>

      <Table<Cliente>
        columns={columns}
        data={clientes}
        onEdit={editarCliente}
        onDelete={setClienteParaExcluir}
      />

      <Modal
        show={clienteParaExcluir !== null}
        title="Confirmar exclusão de cliente"
        onClose={() => setClienteParaExcluir(null)}
        onConfirm={() => {
          if (clienteParaExcluir) {
            void excluirCliente(clienteParaExcluir);
          }
        }}
      />
    </div>
  );
}
