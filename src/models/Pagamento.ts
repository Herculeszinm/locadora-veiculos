
export type FormaPagamento =
  | "PIX"
  | "DINHEIRO"
  | "CARTAO_CREDITO"
  | "CARTAO_DEBITO"
  | "TRANSFERENCIA";

export type StatusPagamento =
  | "PENDENTE"
  | "PAGO"
  | "CANCELADO";

export interface Pagamento {
  id?: string;
  data: string;
  valor: number;
  forma: FormaPagamento;
  status: StatusPagamento;
  locacaoId: string;
}

export const pagamentoInicial: Pagamento = {
  data: "",
  valor: 0,
  forma: "PIX",
  status: "PENDENTE",
  locacaoId: "",
};
