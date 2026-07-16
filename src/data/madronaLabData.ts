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
    id: "madrona-lex-juris",
    name: "Madrona Lex e Juris",
    description: "",
    featureGroups: [],
    accessInfo: ""
  },
  {
    id: "madrona-lab-coins",
    name: "Madrona Lab Coins",
    description: "**O que é o Madrona Lab Coins?**\n\nO Lab Coins é o programa de reconhecimento do Madrona Advogados para advogados e estagiários que contribuem com gestão do conhecimento e inovação. Sempre que você entrega algo relevante - como uma minuta, pesquisa, artigo, apresentação ou ideia inovadora - você acumula Lab Coins, que podem ser trocadas por recompensas.\n\n**O que você precisa fazer para participar?**\n\n1. Produzir e submeter conteúdos nas categorias do programa.\n2. Ter aprovação conforme os critérios de cada categoria.\n3. Acompanhar seus créditos e resgatar suas coins dentro do prazo.\n4. Cada contribuição conta. Cada coin vira reconhecimento.\n\n**Por que participar?**\n\nCada Lab Coin = R$ 1,00 em gift cards, resgatados pela plataforma Giftty. Suas entregas entram no acervo e passam a ser usadas por todo mundo.\n\n**Qual é a vigência do programa?**\n\nDe junho a novembro de 2026\n\n**Como ganhar Lab Coins?**\n\n1. **Inovação** é a categoria de maior valor, com **até 1.000 coins e limite de uma premiação por pessoa ao mês**. Para concorrer, é preciso submeter uma ferramenta, melhoria de processo, modelo ou projeto de IA que resolva uma dor real do escritório. A pontuação não é fixa: ela considera critérios como viabilidade, replicabilidade e clareza na entrega.\n2. **Minutas e Pesquisas** contempla a produção de documentos inéditos e replicáveis — contratos, pareceres, opiniões legais ou petições com conteúdo jurídico. Rendem até 500 coins por contribuição, **com limite de duas premiações mensais**. Para ser elegível, o documento precisa estar aprovado por um sócio e em conformidade com os padrões do Madrona Advogados.\n3. **Artigos** publicados no site do escritório ou no Madrona Lab News rendem **150 coins fixos por publicação, com limite de duas premiações mensais**. O material precisa passar pela aprovação de um sócio e ser validado pelo time de Comunicação antes da publicação.\n4. **Apresentações** valem **100 coins fixos**, com limite de **uma premiação por pessoa ao mês**. Para pontuar, a apresentação deve ocorrer em grupos de estudo, reuniões técnicas ou na Academia Madrona, o material precisa ser enviado ao time de GC e deve gerar um produto concreto: um artigo ou uma minuta replicável.",
    featureGroups: [],
    accessInfo: ""
  },
  {
    id: "academia-madrona",
    name: "Academia Madrona",
    description: "A proposta do Academia Madrona é **oferecer treinamentos que ajudem nossos times - técnico e administrativo - a aprofundar conhecimentos e incentivar a troca de ideias**. Ao longo do ano, de acordo com o perfil do público, você poderá receber convites para participar de aulas, treinamentos ou rodas de conversa. Tudo isso faz parte do nosso compromisso em investir continuamente no desenvolvimento dos nossos profissionais.\n\nTodos esses encontros acontecem online, **sempre às terças-feiras, das 17h às 18h** e são gravados!\n\n[Aqui você encontrará](https://madronalaw.sharepoint.com/SitePages/Treinamentos.aspx): vídeos de onboarding, pensados tanto para quem acabou de chegar ao escritório quanto para quem quer refrescar a memória, sobre nossos processos e cultura.; a série “De olho no full service!”, que apresenta o trabalho das nossas áreas de prática e amplia a visão sobre o escritório como um todo; os Transversais, com conteúdos sobre temas que são úteis para todas as áreas e muito mais.\n\nO time de Gestão do Conhecimento associa a dedicação ao desenvolvimento contínuo e integrado de todos os profissionais.",
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
    description: "Focando na pesquisa e desenvolvimento institucional, estamos incentivando a prática de grupos de estudos e debates, para cada vez mais nos aprimorarmos e estarmos à frente das novas tendências de assuntos estratégicos. Os grupos são abertos a todos os interessados. \n\nPara participar ou criar novos grupos, entre em contato com nossa equipe.\n\n**Quais grupos de debates nós temos em andamento?**\n\n1. [Reunião Técnica Corporate](https://madronalaw.sharepoint.com/sites/MadronaGC/SitePages/Madrona-Lab---Grupo-de-Estudos.aspx#reuni%C3%A3o-t%C3%A9cnica-corporate)\n2. [Reunião Técnica de Tributário](https://madronalaw.sharepoint.com/sites/MadronaGC/_layouts/15/SeeAll.aspx?Page=%2Fsites%2FMadronaGC%2FSitePages%2FMadrona-Lab---Grupo-de-Estudos.aspx&InstanceId=381d2f04-1de4-4f0b-a993-ce261881ef8e)\n\n**Grupos concluídos:**\n\n1. [Reforma Tributária](https://madronalaw.sharepoint.com/sites/MadronaGC/_layouts/15/SeeAll.aspx?Page=%2Fsites%2FMadronaGC%2FSitePages%2FMadrona-Lab---Grupo-de-Estudos.aspx&InstanceId=d9168128-d40c-4419-a253-db0316754130)\n2. [Negócios Digitais](https://madronalaw.sharepoint.com/sites/MadronaGC/_layouts/15/SeeAll.aspx?Page=%2Fsites%2FMadronaGC%2FSitePages%2FMadrona-Lab---Grupo-de-Estudos.aspx&InstanceId=de87beea-1ed0-4256-8e87-f93f5cb0727c)\n3. [Marco Legal das Garantias](https://madronalaw.sharepoint.com/sites/MadronaGC/_layouts/15/SeeAll.aspx?Page=%2Fsites%2FMadronaGC%2FSitePages%2FMadrona-Lab---Grupo-de-Estudos.aspx&InstanceId=114c7fdc-0e53-4a94-982d-604edd90919d)\n4. [Criptomoedas](https://madronalaw.sharepoint.com/sites/MadronaGC/_layouts/15/SeeAll.aspx?Page=%2Fsites%2FMadronaGC%2FSitePages%2FMadrona-Lab---Grupo-de-Estudos.aspx&InstanceId=6b12db19-4b0a-4bdd-b358-990cac29c6c9)",
    featureGroups: [],
    accessInfo: ""
  }
];
