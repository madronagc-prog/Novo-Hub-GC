export interface NewsLinkedinRegistro {
  mes: string;
  areas_participantes: string;
  curtidas: number;
  views: number;
  novos_assinantes: number;
}

export const redeNewsLinkedinData: NewsLinkedinRegistro[] = [
  {
    mes: "Janeiro",
    areas_participantes: "White Collar, Ambiental, Wealth",
    curtidas: 23,
    views: 923,
    novos_assinantes: 102
  },
  {
    mes: "Fevereiro",
    areas_participantes: "Ambiental, Infraestrutura, White Collar",
    curtidas: 20,
    views: 1333,
    novos_assinantes: 81
  },
  {
    mes: "Março",
    areas_participantes: "Proteção de Dados, Propriedade Intelectual e Seguros",
    curtidas: 17,
    views: 1431,
    novos_assinantes: 172
  },
  {
    mes: "Abril",
    areas_participantes: "Fundos de Investimento, Trabalhista, Proteção de Dados, Ambiental, Mercado de Capitais",
    curtidas: 23,
    views: 1114,
    novos_assinantes: 107
  },
  {
    mes: "Maio",
    areas_participantes: "Ambiental, Trabalhista, Proteção de Dados, White Collar, Mercado de Capitais, Propriedade Intelectual",
    curtidas: 22,
    views: 1461,
    novos_assinantes: 152
  },
  {
    mes: "Junho",
    areas_participantes: "Ambiental, Infraestrutura, Mercado de Capitais, Sportainment",
    curtidas: 26,
    views: 700,
    novos_assinantes: 106
  },
  {
    mes: "Julho",
    areas_participantes: "Bancário, Ambiental, Trabalhista, Infraestrutura",
    curtidas: 18,
    views: 1401,
    novos_assinantes: 131
  },
  {
    mes: "Agosto",
    areas_participantes: "Proteção de Dados e Ambiental",
    curtidas: 24,
    views: 2540,
    novos_assinantes: 82
  }
];
