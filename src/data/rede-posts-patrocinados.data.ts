export interface PostPatrocinadoRegistro {
  mes: string;
  areas: string;
  status: string;
  objetivo: string;
  tema: string;
  impressoes: number | null;
  cliques: number | null;
  ctr: string;
  leads: string;
}

export const redePostsPatrocinadosData: PostPatrocinadoRegistro[] = [
  {
    mes: "Junho",
    areas: "Propriedade Intelectual",
    status: "Realizado",
    objetivo: "Awarness",
    tema: "E-book marketing esportivo",
    impressoes: 117884,
    cliques: 1817,
    ctr: "1,54%",
    leads: ""
  },
  {
    mes: "Julho",
    areas: "Proteção de Dados",
    status: "Não foi executado- será executado em outubro",
    objetivo: "",
    tema: "",
    impressoes: null,
    cliques: null,
    ctr: "",
    leads: ""
  },
  {
    mes: "Agosto",
    areas: "Expansão Internacional",
    status: "Vídeo em produção",
    objetivo: "",
    tema: "",
    impressoes: null,
    cliques: null,
    ctr: "",
    leads: ""
  },
  {
    mes: "Setembro",
    areas: "Ambiental",
    status: "",
    objetivo: "",
    tema: "",
    impressoes: null,
    cliques: null,
    ctr: "",
    leads: ""
  },
  {
    mes: "Outubro",
    areas: "Seguros | Proteção de Dados",
    status: "",
    objetivo: "",
    tema: "",
    impressoes: null,
    cliques: null,
    ctr: "",
    leads: ""
  },
  {
    mes: "Novembro",
    areas: "Comércio Internacional",
    status: "",
    objetivo: "",
    tema: "",
    impressoes: null,
    cliques: null,
    ctr: "",
    leads: ""
  },
  {
    mes: "Dezembro",
    areas: "Trabalhista",
    status: "",
    objetivo: "",
    tema: "",
    impressoes: null,
    cliques: null,
    ctr: "",
    leads: ""
  },
];
