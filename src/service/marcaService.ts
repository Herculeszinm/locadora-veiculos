
import { api } from "./api";
import type { Marca } from "../models/Marca";

export const marcaService = {
  listar: async (): Promise<Marca[]> => {
    const resposta = await api.get<Marca[]>("/marcas");
    return resposta.data;
  },

  buscarPorId: async (id: string): Promise<Marca> => {
    const resposta = await api.get<Marca>(`/marcas/${id}`);
    return resposta.data;
  },

  criar: async (marca: Marca): Promise<Marca> => {
    const resposta = await api.post<Marca>("/marcas", marca);
    return resposta.data;
  },

  atualizar: async (id: string, marca: Marca): Promise<Marca> => {
    const resposta = await api.put<Marca>(`/marcas/${id}`, marca);
    return resposta.data;
  },

  excluir: async (id: string): Promise<void> => {
    await api.delete(`/marcas/${id}`);
  },
};
