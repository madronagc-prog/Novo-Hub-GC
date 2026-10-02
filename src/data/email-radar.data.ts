export interface RadarTributarioRegistro {
  mes: string;
  tema: string;
  taxa_abertura: number;
  taxa_cliques: number;
  views_site: number;
}

export const emailRadarData: RadarTributarioRegistro[] = [
  {
    mes: "Janeiro",
    tema: "Radar Tributário | Reforma Tributária e a contratação de planos de saúde para os funcionários",
    taxa_abertura: 42.31,
    taxa_cliques: 1.37,
    views_site: 550
  },
  {
    mes: "Fevereiro",
    tema: "Radar Tributário | Solução de Consulta RFB nº 10/26",
    taxa_abertura: 44.08,
    taxa_cliques: 1.78,
    views_site: 492
  },
  {
    mes: "Março",
    tema: "Radar Tributário | Decisão do STJ sobre descontos e bonificações no PIS/COFINS",
    taxa_abertura: 41.44,
    taxa_cliques: 1.2,
    views_site: 474
  },
  {
    mes: "Março",
    tema: "Radar Tributário | Honorários em execução fiscal: o que está em jogo no Tema 1413 do STJ",
    taxa_abertura: 42.87,
    taxa_cliques: 0.92,
    views_site: 93
  },
  {
    mes: "Abril",
    tema: "Radar Tributário | IN RFB nº 2.314/2026: mais segurança jurídica quanto ao prazo para compensação de créditos judiciais",
    taxa_abertura: 41.56,
    taxa_cliques: 1.27,
    views_site: 434
  },
  {
    mes: "Maio",
    tema: "Radar Tributário | PIS/Cofins em operações com materiais recicláveis (sucata): o que está resolvido e o que falta resolver",
    taxa_abertura: 41.53,
    taxa_cliques: 0.83,
    views_site: 737
  },
  {
    mes: "Maio",
    tema: "Radar Tributário | Compensação como Matéria de Defesa em Embargos à Execução Fiscal: o que diz o STJ?",
    taxa_abertura: 34.85,
    taxa_cliques: 1.3,
    views_site: 343
  },
  {
    mes: "Junho",
    tema: "Radar Tributário | Creditamento de ICMS sobre produtos intermediários: Vem aí um capítulo constitucional da controvérsia?",
    taxa_abertura: 35.47,
    taxa_cliques: 1.72,
    views_site: 549
  },
  {
    mes: "Julho",
    tema: "Radar Tributário | Distribuição de bonificações e lucros na ADI nº 5.161: como ficará a proclamação do resultado desse julgamento?",
    taxa_abertura: 34.12,
    taxa_cliques: 1.78,
    views_site: 387
  },
  {
    mes: "Agosto",
    tema: "Radar Tributário | PLP 124/2022 a caminho da sanção: um freio nacional às multas tributárias",
    taxa_abertura: 31.06,
    taxa_cliques: 1.59,
    views_site: 428
  }
];
