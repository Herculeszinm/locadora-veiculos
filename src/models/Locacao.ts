
export type StatusLocacao =
  | "ABERTA"
  | "FINALIZADA"
  | "CANCELADA";

export interface Locacao {
  id?: string;
  dataRetirada: string;
  dataDevolucaoPrevista: string;
  dataDevolucaoReal?: string;
  kmRetirada: number;
  kmDevolucao?: number;
  valorTotal: number;
  status: StatusLocacao;
  clienteId: string;
  veiculoId: string;
}

export const locacaoInicial: Locacao = {
  dataRetirada: "",
  dataDevolucaoPrevista: "",
  kmRetirada: 0,
  valorTotal: 0,
  status: "ABERTA",
  clienteId: "",
  veiculoId: "",
};

export function calcularDiarias(
  retirada: string,
  devolucao: string
): number {
  if (!retirada || !devolucao) return 0;

  const inicio = Date.parse(`${retirada}T00:00:00Z`);
  const fim = Date.parse(`${devolucao}T00:00:00Z`);

  if (!Number.isFinite(inicio) || !Number.isFinite(fim)) {
    return 0;
  }

  return Math.max(0, Math.round(
    (fim - inicio) / 86400000
  ));
}

export function calcularValorLocacao(
  retirada: string,
  devolucao: string,
  valorDiaria: number
): number {
  return calcularDiarias(retirada, devolucao) * valorDiaria;
}
