
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import type { Locacao } from "../../models/Locacao";
import type { Vistoria, NivelCombustivel } from "../../models/Vistoria";
import type { Veiculo } from "../../models/Veiculo";
import type { Modelo } from "../../models/Modelo";
import type { Categoria } from "../../models/Categoria";
import type { Cliente } from "../../models/Cliente";
import type { TableColumn } from "../../components/Table";

import {
  calcularDiarias,
} from "../../models/Locacao";

import { locacaoService } from "../../service/locacaoService";
import { vistoriaService } from "../../service/vistoriaService";
import { veiculoService } from "../../service/veiculoService";
import { modeloService } from "../../service/modeloService";
import { categoriaService } from "../../service/categoriaService";
import { clienteService } from "../../service/clienteService";

import { Input } from "../../components/Input";
import { Select } from "../../components/Select";
import { TextArea } from "../../components/TextArea";
import { Button } from "../../components/Button";
import { Alert } from "../../components/Alert";
import { Card } from "../../components/Card";
import { Table } from "../../components/Table";

const combustiveis = [
  { value: "VAZIO", label: "Vazio" },
  { value: "RESERVA", label: "Reserva" },
  { value: "1/4", label: "1/4 do tanque" },
  { value: "1/2", label: "Meio tanque" },
  { value: "3/4", label: "3/4 do tanque" },
  { value: "CHEIO", label: "Tanque cheio" },
];

function moeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function LocacaoOperacoes() {
  const [locacoes, setLocacoes] = useState<Locacao[]>([]);
  const [vistorias, setVistorias] = useState<Vistoria[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const [locacaoId, setLocacaoId] = useState("");

  const [kmRetirada, setKmRetirada] = useState("");
  const [combustivelRetirada, setCombustivelRetirada] =
    useState<NivelCombustivel>("CHEIO");
  const [obsRetirada, setObsRetirada] = useState("");

  const [dataDevolucao, setDataDevolucao] = useState("");
  const [kmDevolucao, setKmDevolucao] = useState("");
  const [combustivelDevolucao, setCombustivelDevolucao] =
    useState<NivelCombustivel>("CHEIO");
  const [obsDevolucao, setObsDevolucao] = useState("");

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function carregarDados() {
    const [
      ls, vs, ve, mo, ca, cl,
    ] = await Promise.all([
      locacaoService.listar(),
      vistoriaService.listar(),
      veiculoService.listar(),
      modeloService.listar(),
      categoriaService.listar(),
      clienteService.listar(),
    ]);

    setLocacoes(ls);
    setVistorias(vs);
    setVeiculos(ve);
    setModelos(mo);
    setCategorias(ca);
    setClientes(cl);
  }

  useEffect(() => {
    carregarDados().catch(() => {
      setErro("Erro ao carregar os dados.");
    });
  }, []);

  const locacao = locacoes.find((l) => l.id === locacaoId);

  const veiculo = veiculos.find(
    (v) => v.id === locacao?.veiculoId
  );

  const modelo = modelos.find(
    (m) => m.id === veiculo?.modeloId
  );

  const categoria = categorias.find(
    (c) => c.id === modelo?.categoriaId
  );

  const vistoriasDaLocacao = vistorias.filter(
    (v) => v.locacaoId === locacaoId
  );

  const retirada = vistoriasDaLocacao.find(
    (v) => v.tipo === "RETIRADA"
  );

  const devolucao = vistoriasDaLocacao.find(
    (v) => v.tipo === "DEVOLUCAO"
  );

  const kmFinal = Number(kmDevolucao);

  const diariasReais = locacao && dataDevolucao
    ? Math.max(
        1,
        calcularDiarias(locacao.dataRetirada, dataDevolucao)
      )
    : 0;

  const valorFinal = diariasReais *
    (categoria?.valorLocacao ?? 0);

  function selecionarLocacao(id: string) {
    setLocacaoId(id);
    setErro("");
    setSucesso("");

    const selecionada = locacoes.find((l) => l.id === id);

    setKmRetirada(
      selecionada ? String(selecionada.kmRetirada) : ""
    );

    setCombustivelRetirada("CHEIO");
    setObsRetirada("");
    setDataDevolucao("");
    setKmDevolucao("");
    setCombustivelDevolucao("CHEIO");
    setObsDevolucao("");
  }

  async function registrarRetirada(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setErro("");
    setSucesso("");

    if (!locacao || !locacao.id || salvando) return;

    const km = Number(kmRetirada);

    if (
      !kmRetirada.trim() ||
      !Number.isInteger(km) ||
      km < 0
    ) {
      setErro("Informe uma quilometragem válida.");
      return;
    }

    setSalvando(true);

    try {
      const atual = await locacaoService.buscarPorId(locacao.id);
      const existentes = await vistoriaService.listarPorLocacao(
        locacao.id
      );

      if (
        atual.status !== "ABERTA" ||
        existentes.some((v) => v.tipo === "RETIRADA")
      ) {
        setErro("Esta retirada já foi registrada ou a locação não está aberta.");
        return;
      }

      const novaVistoria: Vistoria = {
        tipo: "RETIRADA",
        data: locacao.dataRetirada,
        km,
        nivelCombustivel: combustivelRetirada,
        observacoes: obsRetirada.trim(),
        locacaoId: locacao.id,
      };

      const criada = await vistoriaService.criar(novaVistoria);

      try {
        await locacaoService.atualizar(locacao.id, {
          ...atual,
          kmRetirada: km,
        });
      } catch {
        if (criada.id) {
          try {
            await vistoriaService.excluir(criada.id);
          } catch {
            // A conferência manual será necessária.
          }
        }
        throw new Error("Falha ao atualizar a locação.");
      }

      await carregarDados();
      setSucesso("Vistoria de retirada registrada!");
    } catch {
      setErro(
        "Não foi possível concluir a retirada. " +
        "Confira os registros antes de tentar novamente."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function finalizarLocacao(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setErro("");
    setSucesso("");

    if (
      !locacao ||
      !locacao.id ||
      !veiculo ||
      !veiculo.id ||
      !retirada ||
      salvando
    ) {
      return;
    }

    if (
      !dataDevolucao ||
      dataDevolucao < locacao.dataRetirada
    ) {
      setErro("Data de devolução inválida.");
      return;
    }

    if (
      !kmDevolucao.trim() ||
      !Number.isInteger(kmFinal) ||
      kmFinal < retirada.km
    ) {
      setErro(
        "O KM de devolução não pode ser menor que o KM de retirada."
      );
      return;
    }

    if (!categoria || !Number.isFinite(valorFinal)) {
      setErro("Não foi possível calcular o valor da locação.");
      return;
    }

    setSalvando(true);

    try {
      const atual = await locacaoService.buscarPorId(locacao.id);
      const existentes = await vistoriaService.listarPorLocacao(
        locacao.id
      );

      if (
        atual.status !== "ABERTA" ||
        existentes.some((v) => v.tipo === "DEVOLUCAO")
      ) {
        setErro("Esta devolução já foi registrada ou a locação foi encerrada.");
        return;
      }

      if (!existentes.some((v) => v.tipo === "RETIRADA")) {
        setErro("Registre a vistoria de retirada primeiro.");
        return;
      }

      const novaVistoria: Vistoria = {
        tipo: "DEVOLUCAO",
        data: dataDevolucao,
        km: kmFinal,
        nivelCombustivel: combustivelDevolucao,
        observacoes: obsDevolucao.trim(),
        locacaoId: locacao.id,
      };

      await vistoriaService.criar(novaVistoria);

      await veiculoService.atualizar(veiculo.id, {
        ...veiculo,
        kmRodado: kmFinal,
      });

      await locacaoService.atualizar(locacao.id, {
        ...atual,
        dataDevolucaoReal: dataDevolucao,
        kmDevolucao: kmFinal,
        valorTotal: valorFinal,
        status: "FINALIZADA",
      });

      await carregarDados();

      setLocacaoId("");
      setSucesso(
        "Locação finalizada com sucesso! Valor: " +
        moeda(valorFinal)
      );
    } catch {
      setErro(
        "Falha durante a finalização. Algumas alterações podem " +
        "ter sido salvas. Confira a locação, a vistoria e o " +
        "veículo antes de tentar novamente."
      );

      try {
        await carregarDados();
      } catch {
        // Mantém a mensagem de erro original.
      }
    } finally {
      setSalvando(false);
    }
  }

  const columns: TableColumn<Vistoria>[] = [
    {
      header: "Tipo",
      render: (v) => v.tipo,
    },
    {
      header: "Data",
      render: (v) => v.data.split("-").reverse().join("/"),
    },
    {
      header: "KM",
      render: (v) => v.km,
    },
    {
      header: "Combustível",
      render: (v) => v.nivelCombustivel,
    },
    {
      header: "Observações",
      render: (v) => v.observacoes || "-",
    },
  ];

  const opcoesLocacoes = locacoes
    .filter((l) => l.status === "ABERTA" && l.id)
    .map((l) => {
      const cliente = clientes.find(
        (c) => c.id === l.clienteId
      );
      const carro = veiculos.find(
        (v) => v.id === l.veiculoId
      );

      return {
        value: l.id!,
        label:
          `${cliente?.nome ?? "Cliente"} - ` +
          `${carro?.placa ?? "Veículo"} - Locação ${l.id}`,
      };
    });

  return (
    <div className="container mt-4">
      <h2>Vistorias e Devoluções</h2>

      <Alert type="danger" message={erro} />
      <Alert type="success" message={sucesso} />

      <Select
        label="Selecione uma locação em aberto"
        name="locacaoId"
        value={locacaoId}
        options={opcoesLocacoes}
        onChange={(e) => selecionarLocacao(e.target.value)}
      />

      {locacao && (
        <>
          <Card title="Informações da locação">
            <p>
              <strong>Veículo:</strong>{" "}
              {modelo?.nome ?? "Modelo desconhecido"} -{" "}
              {veiculo?.placa}
            </p>
            <p>
              <strong>Retirada:</strong>{" "}
              {locacao.dataRetirada}
            </p>
            <p>
              <strong>Devolução prevista:</strong>{" "}
              {locacao.dataDevolucaoPrevista}
            </p>
            <p>
              <strong>Valor previsto:</strong>{" "}
              {moeda(locacao.valorTotal)}
            </p>
          </Card>

          {!retirada && (
            <Card title="RF10 — Vistoria de retirada">
              <form onSubmit={registrarRetirada}>
                <Input
                  label="Quilometragem na retirada"
                  name="kmRetirada"
                  type="number"
                  value={kmRetirada}
                  onChange={(e) => setKmRetirada(e.target.value)}
                />

                <Select
                  label="Nível de combustível"
                  name="combustivelRetirada"
                  value={combustivelRetirada}
                  options={combustiveis}
                  onChange={(e) =>
                    setCombustivelRetirada(
                      e.target.value as NivelCombustivel
                    )
                  }
                />

                <TextArea
                  label="Observações da retirada"
                  name="obsRetirada"
                  value={obsRetirada}
                  onChange={(e) => setObsRetirada(e.target.value)}
                />

                <Button
                  label="Registrar vistoria de retirada"
                  type="submit"
                  disabled={salvando}
                />
              </form>
            </Card>
          )}

          {retirada && !devolucao && (
            <Card title="RF11 — Devolução do veículo">
              <form onSubmit={finalizarLocacao}>
                <Input
                  label="Data real da devolução"
                  name="dataDevolucao"
                  type="date"
                  value={dataDevolucao}
                  onChange={(e) =>
                    setDataDevolucao(e.target.value)
                  }
                />

                <Input
                  label="Quilometragem na devolução"
                  name="kmDevolucao"
                  type="number"
                  value={kmDevolucao}
                  onChange={(e) =>
                    setKmDevolucao(e.target.value)
                  }
                />

                <Select
                  label="Combustível na devolução"
                  name="combustivelDevolucao"
                  value={combustivelDevolucao}
                  options={combustiveis}
                  onChange={(e) =>
                    setCombustivelDevolucao(
                      e.target.value as NivelCombustivel
                    )
                  }
                />

                <TextArea
                  label="Observações da devolução"
                  name="obsDevolucao"
                  value={obsDevolucao}
                  onChange={(e) =>
                    setObsDevolucao(e.target.value)
                  }
                />

                {dataDevolucao &&
                  dataDevolucao >= locacao.dataRetirada && (
                  <div className="alert alert-info">
                    <p>
                      Diárias: {diariasReais}
                    </p>
                    <strong>
                      Valor recalculado: {moeda(valorFinal)}
                    </strong>
                  </div>
                )}

                <Button
                  label={
                    salvando
                      ? "Finalizando..."
                      : "Finalizar locação"
                  }
                  type="submit"
                  variant="success"
                  disabled={salvando}
                />
              </form>
            </Card>
          )}

          <h4 className="mt-4">Histórico de Vistorias</h4>

          <Table<Vistoria>
            columns={columns}
            data={vistoriasDaLocacao}
          />
        </>
      )}
    </div>
  );
}
