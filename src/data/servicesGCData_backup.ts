// src/data/servicesGCData.ts
// Dados base das plataformas gerenciadas pela equipe de GC.
// Campos como `accessInfo`, `description` e `areas` podem ser sobrescritos
// via Firestore (coleção `services`). As `featureGroups` são geridas aqui no código.

export interface ServiceFeatureGroup {
  title: string;
  items: string[];
}

export interface ServiceItem {
  id: string;
  /** Nome curto para exibição em cards e nav */
  name: string;
  /** Nome oficial completo, exibido como subtítulo se diferente de `name` */
  fullName?: string;
  /** Fornecedor/provedor da plataforma */
  provider?: string;
  /** Texto de "O que é" */
  description: string;
  featureGroups: ServiceFeatureGroup[];
  /** Instrução de acesso — preenchida pela GC via modal de edição */
  accessInfo: string;
  /** Áreas do Direito ou segmentos cobertos */
  areas?: string;
}

export const servicesGCData: ServiceItem[] = [
  // ─────────────────────────────────────────────
  // 1. TURIVIUS
  // ─────────────────────────────────────────────
  {
    id: 'turivius',
    name: 'Turivius',
    description:
      'Plataforma de pesquisa e gestão jurisprudencial que centraliza milhões de decisões judiciais e administrativas de mais de 100 tribunais brasileiros em um ambiente unificado. Permite buscar, organizar e monitorar precedentes com precisão, utilizando inteligência artificial para resumos automáticos, análise estatística (jurimetria) e identificação de tendências jurisprudenciais. A Turivius está no mercado desde 2019 e é utilizada por escritórios e departamentos jurídicos de referência no país.',
    featureGroups: [
      {
        title: 'Pesquisa jurisprudencial',
        items: [
          'Busca unificada em decisões judiciais e administrativas, com acervo atualizado diariamente',
          'Pesquisa por linguagem natural, além de operadores avançados de busca (E, OU, ADJ, ASPAS, NÃO)',
          'Resultados exibidos com ementa, inteiro teor, trechos relevantes e resumo gerado por IA',
          'Filtros avançados por tribunal, órgão julgador, relator, período, assunto e fundamento',
        ],
      },
      {
        title: 'Resumos automáticos',
        items: [
          'Geração automatizada de resumos cobrindo pedido, decisão e fundamentação',
          'Geração individual ou em lote (até 120 documentos por vez)',
        ],
      },
      {
        title: 'Organização e acervo',
        items: [
          'Criação de coleções temáticas personalizadas para organizar decisões relevantes',
          'Etiquetas e filtros intuitivos para manter o acervo estruturado e acessível',
        ],
      },
      {
        title: 'Monitoramento contínuo',
        items: [
          'Alertas automáticos sobre novos precedentes em temas de interesse',
          'Rastreamento da evolução de entendimentos jurisprudenciais ao longo do tempo',
        ],
      },
      {
        title: 'Jurimetria',
        items: [
          'Visualização de taxas de procedência e improcedência por tribunal ou tema',
          'Identificação dos fundamentos jurídicos mais citados em decisões favoráveis',
          'Comparação entre órgãos julgadores e instâncias, com detecção de divergências entre Câmaras, Turmas e relatores',
          'Mapas de risco da tese com pontos críticos identificados',
          'Volumetria de decisões por período ou magistrado',
          'Análises trabalhistas por CNPJ (histórico do empregador)',
          'Exportação de gráficos, tabelas e indicadores para pareceres, relatórios e reuniões',
        ],
      },
      {
        title: 'Insights estratégicos',
        items: [
          'Análise automatizada de recorrência de fundamentos, divergências entre tribunais e evolução de entendimentos',
          'Apoio à construção de argumentação com dados concretos para pareceres, petições e sustentações orais',
        ],
      },
    ],
    areas: 'Cível, Trabalhista, Tributário, Empresarial, Previdenciário e Consumidor',
    accessInfo: '',
  },

  // ─────────────────────────────────────────────
  // 2. JUSBRASIL
  // ─────────────────────────────────────────────
  {
    id: 'jusbrasil',
    name: 'Jusbrasil',
    description:
      'Plataforma que coleta, organiza e facilita o acesso à informação jurídica no Brasil. Reúne em um único ambiente jurisprudência de mais de 96 tribunais (acervo superior a 250 milhões de julgados), publicações de Diários Oficiais nos âmbitos federal, estadual e municipal, e legislação brasileira atualizada. A busca é unificada e utiliza inteligência semântica treinada a partir de milhões de consultas jurídicas, permitindo pesquisar por linguagem natural sem necessidade de termos exatos.',
    featureGroups: [
      {
        title: 'Pesquisa de jurisprudência',
        items: [
          'Busca unificada em mais de 96 tribunais (STF, STJ, TJs, TRFs, TRTs, TREs, TST, TSE, STM, TCU, TNU, TRU, CNJ, CARF, TJMs e TCEs)',
          'Mecanismo de busca semântica que interpreta a intenção da consulta e prioriza os resultados mais relevantes',
          'Filtros por tribunal, órgão julgador, tipo de decisão e data',
          'Ementas formatadas e prontas para uso em petições; acesso a súmulas do STF, STJ, TST e tribunais estaduais',
        ],
      },
      {
        title: 'Diários Oficiais',
        items: [
          'Pesquisa centralizada de publicações oficiais federais, estaduais e municipais',
          'Busca por nome, número de processo ou órgão emissor, com destaque do trecho exato da publicação',
          'Alertas automáticos sobre novas publicações relacionadas a casos em acompanhamento',
          'Navegação por blocos ou páginas dos diários, com download da edição completa',
          'Atualizações contínuas para acompanhamento de intimações, despachos e controle de prazos',
        ],
      },
      {
        title: 'Legislação',
        items: [
          'Acervo unificado de leis, códigos, decretos, emendas constitucionais, medidas provisórias e demais atos normativos',
          'Busca semântica por linguagem natural, sem necessidade de saber o número exato da norma',
          'Textos sempre na versão vigente, com verificação diária nas fontes oficiais',
          'Acesso a versões anteriores com indicação de data de atualização',
        ],
      },
    ],
    accessInfo: '',
  },

  // ─────────────────────────────────────────────
  // 3. RC AMBIENTAL
  // ─────────────────────────────────────────────
  {
    id: 'rc-ambiental',
    name: 'RC Ambiental',
    description:
      'Portal especializado em legislação ambiental brasileira, mantido há mais de 22 anos pelo advogado Dr. Renato Senges Carneiro. Disponibiliza um banco de dados com cerca de 99.700 atos jurídicos federais e estaduais relacionados ao tema ambiental, todos com referência legislativa, abrangendo normas do menor ao maior grau hierárquico editadas pelos poderes Legislativo e Executivo e por órgãos da administração pública com atribuições normativas ou deliberativas. O acervo é atualizado constantemente, cobrindo também Saúde e Segurança no Trabalho (SMS) e Responsabilidade Social.',
    featureGroups: [
      {
        title: 'Pesquisa legislativa ambiental',
        items: [
          'Busca em banco de dados próprio com mais de 99.700 atos, por termo, número do ato ou área temática',
          'Cobertura de legislação ambiental federal e de todos os estados brasileiros',
          'Identificação do ato, situação (vigente ou revogado), ementa e âmbito de aplicação',
          'Controle de vigência: normas revogadas, parcialmente alteradas ou substituídas',
        ],
      },
      {
        title: 'Monitoramento de atualizações',
        items: [
          'Acompanhamento contínuo de novos atos, revogações e alterações legislativas em todos os âmbitos cobertos',
          'Painel com volumetria de movimentações legislativas recentes por esfera federal e estadual',
          'Informe Jurídico periódico por e-mail (publicado desde 2004), com atualizações segmentadas por área e âmbito',
          'Escolha das áreas e âmbitos de interesse para recebimento personalizado dos informes',
        ],
      },
    ],
    areas: 'Legislação ambiental (federal e estadual), Saúde e Segurança no Trabalho (SMS) e Responsabilidade Social',
    accessInfo: '',
  },

  // ─────────────────────────────────────────────
  // 4. CHECKPOINT
  // ─────────────────────────────────────────────
  {
    id: 'checkpoint',
    name: 'Checkpoint',
    provider: 'Thomson Reuters',
    description:
      'Portal de conteúdo em nuvem da Thomson Reuters voltado para profissionais das áreas tributária, contábil, trabalhista, previdenciária, societária e de comércio exterior. Oferece acesso em tempo real a um acervo de alto padrão que inclui mais de 8.000 roteiros, comentários e tabelas práticas, mais de 60.000 decisões administrativas da Receita Federal, cerca de 3.500 artigos e aproximadamente 270.000 atos legais. Atualizado diariamente.',
    featureGroups: [
      {
        title: 'Pesquisa de conteúdo especializado',
        items: [
          'Busca com filtros inteligentes em legislação, jurisprudência, decisões administrativas da RFB, roteiros comentados, artigos doutrinários e tabelas práticas',
          'Roteiros com comentários de especialistas que orientam a aplicação prática das normas',
          'Acervo de decisões administrativas e atos legais cobrindo as principais áreas regulatórias e fiscais',
        ],
      },
      {
        title: 'Ferramentas de consulta',
        items: [
          'Agenda de obrigações atualizada para acompanhamento de prazos fiscais, contábeis e trabalhistas',
          'Tabelas práticas de referência rápida para consultas do dia a dia',
          'Atualização diária do conteúdo para garantir conformidade com as normas vigentes',
        ],
      },
    ],
    areas: 'Tributária, Contábil, Trabalhista, Previdenciária, Societária e Comércio Exterior',
    accessInfo: '',
  },

  // ─────────────────────────────────────────────
  // 5. DECISÕES
  // ─────────────────────────────────────────────
  {
    id: 'decisoes',
    name: 'Decisões',
    description:
      'Portal de acompanhamento e seleção de jurisprudência com foco nas áreas de interesse de organizações empresariais. Diferencia-se por um acervo curado a partir de dezenas de critérios rigorosos de seleção: as decisões não são apenas indexadas, mas previamente identificadas como relevantes. O acervo reúne mais de 5,6 milhões de decisões (incluindo cerca de 1,3 milhão de íntegras), provenientes de 39 tribunais judiciários e 94 órgãos julgadores administrativos de 25 estados. Destinado a advogados, procuradores, promotores, magistrados, economistas, controllers, contadores e demais profissionais. Assinatura anual com alimentação diária.',
    featureGroups: [
      {
        title: 'Pesquisa jurisprudencial',
        items: [
          'Busca por área do Direito, esfera (judicial ou administrativa), órgão, tipo de decisão, palavra-chave, número da decisão e relator',
          'Cobertura judicial: STF, STJ, TRFs da 1ª à 5ª Região e Tribunais de Justiça de diversos estados',
          'Cobertura administrativa: CARF, Câmara Superior de Recursos Fiscais, Delegacias da Receita Federal, Secretarias de Fazenda estaduais, Tribunais de Impostos e Taxas, entre outros',
        ],
      },
      {
        title: 'Conteúdo editorial',
        items: [
          'Artigos e comentários sobre decisões elaborados por especialistas, com análise de relevância sobre julgamentos recentes, consolidados ou inéditos',
          'Boletim Decisões mensal por e-mail, com resumo das decisões mais relevantes e estudo aprofundado de colunistas especializados',
        ],
      },
    ],
    areas: 'Tributária (Federal, Estadual e Municipal), Previdenciária, Penal-Tributária, Empresarial, Financeira, Consumo e Ambiental',
    accessInfo: '',
  },

  // ─────────────────────────────────────────────
  // 6. ONESOURCE COMEXCONTENT
  // ─────────────────────────────────────────────
  {
    id: 'onesource',
    name: 'ComexContent',
    fullName: 'ONESOURCE Global Trade',
    provider: 'Thomson Reuters',
    description:
      'Solução da Thomson Reuters para comércio exterior que entrega diariamente, de forma automatizada, informações essenciais para operações de importação e regimes especiais: dados de NCM, alíquotas de impostos, taxas de câmbio, ex-tarifários e regras de licenciamento de importação. Garante cálculos corretos de tributação e conformidade regulatória sem intervenção manual.',
    featureGroups: [
      {
        title: 'Conteúdo tributário e regulatório automatizado',
        items: [
          'Atualização automática de alterações da NCM e alíquotas dos impostos federais incidentes sobre importação',
          'Informes de taxas fiscais de câmbio atualizados diretamente no sistema',
          'Informações de ex-tarifário para aplicação nos produtos importados',
        ],
      },
      {
        title: 'Licenciamento de importação',
        items: [
          'Determinação automática da necessidade de Licença de Importação com base em todas as regras vigentes',
          'Monitoramento automático de alterações legais com atualização dos processos em andamento',
        ],
      },
      {
        title: 'Cálculos de tributação',
        items: [
          'Cálculos corretos de tributação nas operações de importação e regimes especiais, alimentados pelos conteúdos atualizados automaticamente',
        ],
      },
      {
        title: 'Biblioteca de conteúdo',
        items: [
          'Materiais sobre gestão de comércio exterior: white papers, e-books e informativos sobre mudanças regulatórias (DUIMP, DUE, Acordo de Facilitação de Comércio da OMC)',
        ],
      },
    ],
    areas: 'Comércio Exterior (importação e regimes especiais)',
    accessInfo: '',
  },

  // ─────────────────────────────────────────────
  // 7. ECONET EDITORA
  // ─────────────────────────────────────────────
  {
    id: 'econet',
    name: 'Econet Editora',
    description:
      'Plataforma de consultoria e informações legais voltada para profissionais das áreas fiscal, tributária, contábil, trabalhista e previdenciária. Fornece conteúdo normativo completo e atualizado, com o compromisso de não fracionar ou omitir informações legislativas. Oferece boletins, regulamentos consolidados, cadernos temáticos e suporte consultivo, com atualizações acompanhando o ritmo das alterações normativas.',
    featureGroups: [
      {
        title: 'Área Fiscal (Federal, Estadual, Municipal e Comércio Exterior)',
        items: [
          'Tributos federais (IPI, IOF, II, IE, ITR), estaduais (ICMS, IPVA, ITCMD) e municipais (ISS, IPTU, ITBI) e comércio exterior',
          'Regulamento do ICMS, Regulamento do IPI, Tabela do IPI e Legislação do ISS das Capitais',
          'Caderno de ICMS, IPI e ISS do Boletim Econet',
          'Indicadores econômicos e índices de aluguéis',
        ],
      },
      {
        title: 'Área Trabalhista e Previdenciária',
        items: [
          'Rotinas trabalhistas: férias, 13º salário, FGTS, jornada de trabalho, aviso prévio, CAGED, RAIS, PIS/PASEP, contribuição sindical, insalubridade, estágio, entre outros',
          'Conteúdo previdenciário: aposentadoria, benefícios, contribuições, salário de contribuição, auxílio-doença, entre outros',
          'CLT consolidada e Caderno Trabalhista e Previdenciário do Boletim Econet',
        ],
      },
      {
        title: 'Imposto de Renda e Contabilidade',
        items: [
          'IRPJ (lucro real, presumido e arbitrado), IRPF (carnê-leão, declaração anual, ganhos de capital), IRRF, CSLL, PIS/COFINS, Simples Nacional',
          'Conteúdo contábil (balanços, demonstrações, lançamentos) e societário (CNPJ, sociedades limitadas, S.A., cooperativas)',
          'Regulamento do Imposto de Renda e Caderno de IR e Contabilidade do Boletim Econet',
        ],
      },
      {
        title: 'Produtos editoriais e acompanhamento',
        items: [
          'Boletim Econet com cadernos temáticos por área',
          'Síntese semanal por e-mail com as principais atualizações normativas',
          'Suporte consultivo sobre os produtos fornecidos',
        ],
      },
    ],
    accessInfo: '',
  },

  // ─────────────────────────────────────────────
  // 8. MLEX
  // ─────────────────────────────────────────────
  {
    id: 'mlex',
    name: 'MLex',
    provider: 'LexisNexis',
    description:
      'Serviço de notícias e análises preditivas sobre regulação e risco regulatório, com foco global. Conta com mais de 70 jornalistas especializados distribuídos em 15 escritórios ao redor do mundo, produzindo mais de 100 artigos por dia. Oferece cobertura imparcial e aprofundada sobre propostas regulatórias, investigações, ações de enforcement e decisões judiciais e administrativas que impactam negócios, permitindo antecipar mudanças legais antes que se concretizem.',
    featureGroups: [
      {
        title: 'Cobertura temática especializada',
        items: [
          'Antitruste e concorrência (cartéis, práticas restritivas, abuso de posição dominante, litigância concorrencial)',
          'Fusões e aquisições (DealRisk®, análise de risco em operações de M&A)',
          'Inteligência artificial e tecnologia',
          'Privacidade e proteção de dados',
          'Propriedade intelectual',
          'Comércio internacional (trade)',
          'Energia',
          'Serviços financeiros e crimes financeiros',
          'Auxílios estatais (state aid)',
        ],
      },
      {
        title: 'Ferramentas de acompanhamento',
        items: [
          'Newsletters segmentadas por área de prática, entregues diretamente por e-mail',
          'Alertas personalizáveis para rastreamento em tempo real de leis, casos, temas, setores, empresas e jurisdições',
          'Case Files: dossiês com notícias, análises e documentos-fonte organizados em linha do tempo com filtros individualizáveis',
        ],
      },
      {
        title: 'Recursos adicionais',
        items: [
          'Biblioteca de recursos (Resource Library) com orientações de uso da plataforma',
          'Cobertura global com escritórios em Washington, Londres, Bruxelas, Pequim, entre outros',
        ],
      },
    ],
    accessInfo: '',
  },

  // ─────────────────────────────────────────────
  // 9. HEAD ENERGIA
  // ─────────────────────────────────────────────
  {
    id: 'head-energia',
    name: 'Head Energia',
    description:
      'Plataforma online de capacitação e desenvolvimento profissional voltada para o setor elétrico, com foco em mercado e regulação de energia. Reúne cursos, séries, masterclasses e certificações ministrados por mais de 220 especialistas executivos do setor. Já transformou mais de 4.000 carreiras, é utilizada por mais de 150 empresas e inclui uma comunidade de networking. Referência na preparação para a Prova de Certificação da CCEE, tendo formado 37% dos aprovados desde 2022.',
    featureGroups: [
      {
        title: 'Assinatura de Formação Contínua',
        items: [
          'Acesso a conteúdos atualizados sobre mercado e regulação de energia, ministrados por especialistas executivos',
          'Inclui o Preparatório para a Prova de Certificação de Operadores da CCEE',
          'Cinco cursos inclusos na assinatura com certificado: Migração para o Mercado Livre, Negócios em Transmissão, Oficina de Reajuste e Revisão Tarifária de Distribuidoras, Excludentes de Responsabilidade e Técnicas de Estudo',
        ],
      },
      {
        title: 'Cursos de Aprofundamento',
        items: [
          'Cursos estruturados em módulos fechados, ministrados por professores especialistas em temas específicos do setor',
          'Exemplo: "Impactos da Reforma Tributária no Setor Elétrico e Estudos de Caso em Usinas Renováveis"',
        ],
      },
      {
        title: 'Cursos In Company',
        items: [
          'Cursos elaborados de acordo com as necessidades específicas de cada empresa',
        ],
      },
      {
        title: 'Comunidade e networking',
        items: [
          'Rede de profissionais do setor elétrico para troca de experiências e fortalecimento de conexões, de estagiários a CEOs',
        ],
      },
    ],
    areas: 'Geração, comercialização, distribuição e transmissão de energia',
    accessInfo: '',
  },

  // ─────────────────────────────────────────────
  // 10. RT ONLINE
  // ─────────────────────────────────────────────
  {
    id: 'rt-online',
    name: 'RT Online',
    fullName: 'Revista dos Tribunais',
    provider: 'Thomson Reuters',
    description:
      'Base de dados jurídica completa e atualizada diariamente pela Thomson Reuters. Reúne em um único ambiente conteúdos interligados de doutrina, jurisprudência, legislação, súmulas e artigos da tradicional Revista dos Tribunais, com recursos de busca que integram todas essas fontes entre si. Disponibiliza também notícias em tempo real da agência Reuters.',
    featureGroups: [
      {
        title: 'Pesquisa jurisprudencial',
        items: [
          'Busca de jurisprudência e acórdãos comentados, com ementas elaboradas por profissionais do Direito',
          'Resultados interligados com doutrina, legislação, súmulas e notícias relacionadas',
        ],
      },
      {
        title: 'Pesquisa de legislação',
        items: [
          'Textos legislativos com notas e remissões, contendo links diretos para assuntos correlatos',
        ],
      },
      {
        title: 'Doutrina',
        items: [
          'Acervo doutrinário da Revista dos Tribunais, com artigos e obras de referência para consulta e aprofundamento',
        ],
      },
      {
        title: 'Notícias',
        items: [
          'Feed de notícias jurídicas em tempo real, com conteúdo da agência Reuters',
        ],
      },
    ],
    accessInfo: '',
  },
];
