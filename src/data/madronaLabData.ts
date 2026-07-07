export interface MadronaLabFeatureGroup {
  title: string;
  items: string[];
}

export interface MadronaLabItem {
  id: string;
  name: string;
  fullName?: string;
  provider?: string;
  description: string;
  featureGroups: MadronaLabFeatureGroup[];
  accessInfo: string;
  areas?: string;
}

export const madronaLabData: MadronaLabItem[] = [
  {
    id: "academia-madrona",
    name: "Academia Madrona",
    description: "Iniciativa focada em...",
    featureGroups: [],
    accessInfo: ""
  },
  {
    id: "madrona-lab-coins",
    name: "Madrona Lab Coins",
    description: "",
    featureGroups: [],
    accessInfo: ""
  },
  {
    id: "madrona-lex-juris",
    name: "Madrona Lex e Juris",
    description: "",
    featureGroups: [],
    accessInfo: ""
  },
  {
    id: "madrona-research",
    name: "Madrona Research",
    description: "",
    featureGroups: [],
    accessInfo: ""
  },
  {
    id: "grupo-de-debates",
    name: "Grupo de Debates",
    description: "",
    featureGroups: [],
    accessInfo: ""
  },
  {
    id: "pesquisas-estrategicas",
    name: "Pesquisas Estratégicas",
    description: "",
    featureGroups: [],
    accessInfo: ""
  }
];
