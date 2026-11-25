
import { api } from "./api";
import type { NotaFiscal } from "../models/NotaFiscal";

export const notaFiscalService = {
  listar: async (): Promise<NotaFiscal[]> =>
    (await api.get<NotaFiscal[]>("/notasFiscais")).data,

  buscarPorId: async (id: string): Promise<NotaFiscal> =>
    (await api.get<NotaFiscal>(`/notasFiscais/${id}`)).data,

  criar: async (nota: NotaFiscal): Promise<NotaFiscal> =>
    (await api.post<NotaFiscal>("/notasFiscais", nota)).data,

  atualizar: async (
    id: string,
    nota: NotaFiscal
  ): Promise<NotaFiscal> =>
    (await api.put<NotaFiscal>(
      `/notasFiscais/${id}`, nota
    )).data,

  excluir: async (id: string): Promise<void> => {
    await api.delete(`/notasFiscais/${id}`);
  },

  buscarPorLocacao: async (
    locacaoId: string
  ): Promise<NotaFiscal | undefined> => {
    const notas = await notaFiscalService.listar();

    return notas.find(
      (nota) => nota.locacaoId === locacaoId
    );
  },
};
