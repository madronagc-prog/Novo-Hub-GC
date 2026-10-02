export interface GrupoEstudoRegistro {
  mes: string;
  titulo: string;
  apresentado_por: string;
  resultado: string;
  convidados: number;
  participantes: number;
  meta: number;
  percentual_presenca: number;
}

export const gruposEstudosData: GrupoEstudoRegistro[] = [
  {
    mes: "Janeiro",
    titulo: "RT Tax",
    apresentado_por: "Henrique Tavares; Luana Araújo; Pedro Magalhães",
    resultado: "Discussão interna",
    convidados: 28,
    participantes: 18,
    meta: 21,
    percentual_presenca: 64
  },
  {
    mes: "Fevereiro",
    titulo: "RT Tax",
    apresentado_por: "Aline e Paulo",
    resultado: "Discussão interna",
    convidados: 28,
    participantes: 18,
    meta: 21,
    percentual_presenca: 64
  },
  {
    mes: "Março",
    titulo: "RT Tax",
    apresentado_por: "Vitória Daquino e Bruna Quixabeira",
    resultado: "Discussão interna",
    convidados: 28,
    participantes: 13,
    meta: 21,
    percentual_presenca: 46
  },
  {
    mes: "Abril",
    titulo: "RT Corp",
    apresentado_por: "Pedro Porcaro",
    resultado: "Discussão interna",
    convidados: 60,
    participantes: 49,
    meta: 43,
    percentual_presenca: 82
  },
  {
    mes: "Abril",
    titulo: "RT Tax",
    apresentado_por: "Carlos Bonfim, Marcos Ortiz e Luana Araújo",
    resultado: "Discussão interna",
    convidados: 28,
    participantes: 25,
    meta: 17,
    percentual_presenca: 89
  },
  {
    mes: "Maio",
    titulo: "RT Corp",
    apresentado_por: "Nagalli",
    resultado: "Discussão interna",
    convidados: 60,
    participantes: 49,
    meta: 43,
    percentual_presenca: 82
  },
  {
    mes: "Maio",
    titulo: "RT Tax",
    apresentado_por: "Mariana Aleixo, Rafael Gouveia, Vitor Betrão",
    resultado: "Discussão interna",
    convidados: 34,
    participantes: 25,
    meta: 17,
    percentual_presenca: 74
  },
  {
    mes: "Junho",
    titulo: "RT Corp",
    apresentado_por: "Diego Lecuona",
    resultado: "Discussão interna",
    convidados: 60,
    participantes: 43,
    meta: 43,
    percentual_presenca: 72
  },
  {
    mes: "Julho",
    titulo: "RT Corp",
    apresentado_por: "Gustavo Motta",
    resultado: "Discussão interna",
    convidados: 60,
    participantes: 56,
    meta: 43,
    percentual_presenca: 93
  },
  {
    mes: "Agosto",
    titulo: "RT Corp",
    apresentado_por: "Economics em M&A: valuation, ajuste de preço, earn-out e PPA com Grupo Investor",
    resultado: "Discussão interna",
    convidados: 60,
    participantes: 50,
    meta: 43,
    percentual_presenca: 83
  },
  {
    mes: "Agosto",
    titulo: "RT Tax",
    apresentado_por: "Marianna Morato, Rafael Bittencourt e Rafael Ladeira",
    resultado: "Discussão interna",
    convidados: 34,
    participantes: 28,
    meta: 20,
    percentual_presenca: 82
  }
];
