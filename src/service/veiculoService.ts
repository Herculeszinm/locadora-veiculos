
import { api } from "./api";
import type { Veiculo } from "../models/Veiculo";

interface VinculoVeiculo {
  veiculoId: string;
}

export const veiculoService = {
  listar: async (): Promise<Veiculo[]> =>
    (await api.get<Veiculo[]>("/veiculos")).data,

  buscarPorId: async (id: string): Promise<Veiculo> =>
    (await api.get<Veiculo>(`/veiculos/${id}`)).data,

  criar: async (veiculo: Veiculo): Promise<Veiculo> =>
    (await api.post<Veiculo>("/veiculos", veiculo)).data,

  atualizar: async (id: string, veiculo: Veiculo): Promise<Veiculo> =>
    (await api.put<Veiculo>(`/veiculos/${id}`, veiculo)).data,

  excluir: async (id: string): Promise<void> => {
    await api.delete(`/veiculos/${id}`);
  },

  possuiDependentes: async (id: string): Promise<boolean> => {
    const [locacoes, manutencoes] = await Promise.all([
      api.get<VinculoVeiculo[]>("/locacoes"),
      api.get<VinculoVeiculo[]>("/manutencoes"),
    ]);

    return (
      locacoes.data.some((item) => item.veiculoId === id) ||
      manutencoes.data.some((item) => item.veiculoId === id)
    );
  },
};
