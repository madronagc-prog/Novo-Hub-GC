export interface AssinaturaEletronicaContrato {
  fornecedor: string;
  modelo_contrato: string;
  inicio_contrato?: string;
  fim_contrato?: string;
  envelopes_contratados?: number;
  envelopes_usados?: number;
  envelopes_disponiveis?: number;
  percentual_uso?: number;
}

export const ferrAssinaturaData: AssinaturaEletronicaContrato[] = [
  {
    fornecedor: "Certisign",
    modelo_contrato: "Sem contrato fixo - créditos por pagamento pontual conforme necessidade"
  },
  {
    fornecedor: "Docusign",
    modelo_contrato: "Contrato anual",
    inicio_contrato: "Janeiro/2026",
    fim_contrato: "Janeiro/2027",
    envelopes_contratados: 7500,
    envelopes_usados: 3258,
    envelopes_disponiveis: 4242,
    percentual_uso: 43.4
  }
];
