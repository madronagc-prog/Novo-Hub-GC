export interface CapitalAbertoRegistro {
  mes: string;
  areas: string;
  status: string;
  tema: string;
  views_site_ca: number | null;
}

export const pubCapitalAbertoData: CapitalAbertoRegistro[] = [
  {
    mes: "Julho",
    areas: "M&A e Concorrencial",
    status: "Publicado",
    tema: "Separar M&A e concorrencial pode custar caro",
    views_site_ca: null
  },
  {
    mes: "Agosto",
    areas: "Direito Público e Infraestrutura",
    status: "Texto em aprovação com sócios",
    tema: "A segurança jurídica no mercado de BESS",
    views_site_ca: null
  },
  {
    mes: "Setembro",
    areas: "Propriedade Intelectual",
    status: "Entrevista marcado",
    tema: "Marcas e patentes - intangíveis no mercado de capitais",
    views_site_ca: null
  },
  {
    mes: "Outubro",
    areas: "Tributário e Wealth",
    status: "Tema enviado para avaliação",
    tema: "",
    views_site_ca: null
  },
  {
    mes: "Novembro",
    areas: "Contencioso, Mediação e Arbitragem",
    status: "",
    tema: "",
    views_site_ca: null
  },
  {
    mes: "Dezembro",
    areas: "Mercado de Capitais, Fundos de Investimento e Banking",
    status: "",
    tema: "",
    views_site_ca: null
  }
];

export const pubCapitalData = pubCapitalAbertoData;
