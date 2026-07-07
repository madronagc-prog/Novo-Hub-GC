// src/data/servicesGCData.ts
export interface ServiceFeatureGroup {
  title: string;
  items: string[];
}

export interface ServiceItem {
  id: string;
  name: string;
  fullName?: string;
  provider?: string;
  description: string;
  featureGroups: ServiceFeatureGroup[];
  accessInfo: string;
  areas?: string;
  category: string | string[];
}

export const CATEGORIES = [
  'Doutrina',
  'Due Diligence',
  'Assinatura Digital',
  'Inteligência Artificial',
  'Jurisprudência',
  'Legislação',
  'Notícias',
];

export const servicesGCData: ServiceItem[] = [
  {
    "id": "biblioteca-do-escrit-rio",
    "name": "Biblioteca do Escritório",
    "description": "",
    "featureGroups": [],
    "accessInfo": "",
    "category": "Doutrina"
  },
  {
    "id": "minha-biblioteca",
    "name": "Minha Biblioteca",
    "description": "",
    "featureGroups": [],
    "accessInfo": "",
    "category": "Doutrina"
  },
  {
    "id": "proview",
    "name": "Proview",
    "description": "",
    "featureGroups": [],
    "accessInfo": "",
    "category": "Doutrina"
  },
  {
    "id": "rt-online",
    "name": "RT Online",
    "fullName": "Revista dos Tribunais",
    "provider": "Thomson Reuters",
    "description": "Base de dados jurídica completa e atualizada diariamente pela Thomson Reuters. Reúne em um único ambiente conteúdos interligados de doutrina, jurisprudência, legislação, súmulas e artigos da tradicional Revista dos Tribunais, com recursos de busca que integram todas essas fontes entre si. Disponibiliza também notícias em tempo real da agência Reuters.",
    "featureGroups": [
      {
        "title": "Pesquisa jurisprudencial",
        "items": [
          "Busca de jurisprudência e acórdãos comentados, com ementas elaboradas por profissionais do Direito",
          "Resultados interligados com doutrina, legislação, súmulas e notícias relacionadas"
        ]
      },
      {
        "title": "Pesquisa de legislação",
        "items": [
          "Textos legislativos com notas e remissões, contendo links diretos para assuntos correlatos"
        ]
      },
      {
        "title": "Doutrina",
        "items": [
          "Acervo doutrinário da Revista dos Tribunais, com artigos e obras de referência para consulta e aprofundamento"
        ]
      },
      {
        "title": "Notícias",
        "items": [
          "Feed de notícias jurídicas em tempo real, com conteúdo da agência Reuters"
        ]
      }
    ],
    "accessInfo": "",
    "areas": "",
    "category": "Doutrina"
  },
  {
    "id": "saga",
    "name": "Saga",
    "description": "",
    "featureGroups": [],
    "accessInfo": "",
    "category": "Inteligência Artificial"
  },
  {
    "id": "decisoes",
    "name": "Decisões",
    "fullName": "",
    "provider": "",
    "description": "Portal de acompanhamento e seleção de jurisprudência com foco nas áreas de interesse de organizações empresariais. Diferencia-se por um acervo curado a partir de dezenas de critérios rigorosos de seleção: as decisões não são apenas indexadas, mas previamente identificadas como relevantes. O acervo reúne mais de 5,6 milhões de decisões (incluindo cerca de 1,3 milhão de íntegras), provenientes de 39 tribunais judiciários e 94 órgãos julgadores administrativos de 25 estados. Destinado a advogados, procuradores, promotores, magistrados, economistas, controllers, contadores e demais profissionais. Assinatura anual com alimentação diária.",
    "featureGroups": [
      {
        "title": "Pesquisa jurisprudencial",
        "items": [
          "Busca por área do Direito, esfera (judicial ou administrativa), órgão, tipo de decisão, palavra-chave, número da decisão e relator",
          "Cobertura judicial: STF, STJ, TRFs da 1ª à 5ª Região e Tribunais de Justiça de diversos estados",
          "Cobertura administrativa: CARF, Câmara Superior de Recursos Fiscais, Delegacias da Receita Federal, Secretarias de Fazenda estaduais, Tribunais de Impostos e Taxas, entre outros"
        ]
      },
      {
        "title": "Conteúdo editorial",
        "items": [
          "Artigos e comentários sobre decisões elaborados por especialistas, com análise de relevância sobre julgamentos recentes, consolidados ou inéditos",
          "Boletim Decisões mensal por e-mail, com resumo das decisões mais relevantes e estudo aprofundado de colunistas especializados"
        ]
      }
    ],
    "accessInfo": "",
    "areas": "Tributária (Federal, Estadual e Municipal), Previdenciária, Penal-Tributária, Empresarial, Financeira, Consumo e Ambiental",
    "category": "Jurisprudência"
  },
  {
    "id": "jusbrasil",
    "name": "Jusbrasil",
    "fullName": "",
    "provider": "",
    "description": "Plataforma que coleta, organiza e facilita o acesso à informação jurídica no Brasil. Reúne em um único ambiente jurisprudência de mais de 96 tribunais (acervo superior a 250 milhões de julgados), publicações de Diários Oficiais nos âmbitos federal, estadual e municipal, e legislação brasileira atualizada. A busca é unificada e utiliza inteligência semântica treinada a partir de milhões de consultas jurídicas, permitindo pesquisar por linguagem natural sem necessidade de termos exatos.",
    "featureGroups": [
      {
        "title": "Pesquisa de jurisprudência",
        "items": [
          "Busca unificada em mais de 96 tribunais (STF, STJ, TJs, TRFs, TRTs, TREs, TST, TSE, STM, TCU, TNU, TRU, CNJ, CARF, TJMs e TCEs)",
          "Mecanismo de busca semântica que interpreta a intenção da consulta e prioriza os resultados mais relevantes",
          "Filtros por tribunal, órgão julgador, tipo de decisão e data",
          "Ementas formatadas e prontas para uso em petições; acesso a súmulas do STF, STJ, TST e tribunais estaduais"
        ]
      },
      {
        "title": "Diários Oficiais",
        "items": [
          "Pesquisa centralizada de publicações oficiais federais, estaduais e municipais",
          "Busca por nome, número de processo ou órgão emissor, com destaque do trecho exato da publicação",
          "Alertas automáticos sobre novas publicações relacionadas a casos em acompanhamento",
          "Navegação por blocos ou páginas dos diários, com download da edição completa",
          "Atualizações contínuas para acompanhamento de intimações, despachos e controle de prazos"
        ]
      },
      {
        "title": "Legislação",
        "items": [
          "Acervo unificado de leis, códigos, decretos, emendas constitucionais, medidas provisórias e demais atos normativos",
          "Busca semântica por linguagem natural, sem necessidade de saber o número exato da norma",
          "Textos sempre na versão vigente, com verificação diária nas fontes oficiais",
          "Acesso a versões anteriores com indicação de data de atualização"
        ]
      }
    ],
    "accessInfo": "",
    "areas": "",
    "category": "Jurisprudência"
  },
  {
    "id": "turivius",
    "name": "Turivius",
    "fullName": "",
    "provider": "",
    "description": "Plataforma de pesquisa e gestão jurisprudencial que centraliza milhões de decisões judiciais e administrativas de mais de 100 tribunais brasileiros em um ambiente unificado. Permite buscar, organizar e monitorar precedentes com precisão, utilizando inteligência artificial para resumos automáticos, análise estatística (jurimetria) e identificação de tendências jurisprudenciais. A Turivius está no mercado desde 2019 e é utilizada por escritórios e departamentos jurídicos de referência no país.",
    "featureGroups": [
      {
        "title": "Pesquisa jurisprudencial",
        "items": [
          "Busca unificada em decisões judiciais e administrativas, com acervo atualizado diariamente",
          "Pesquisa por linguagem natural, além de operadores avançados de busca (E, OU, ADJ, ASPAS, NÃO)",
          "Resultados exibidos com ementa, inteiro teor, trechos relevantes e resumo gerado por IA",
          "Filtros avançados por tribunal, órgão julgador, relator, período, assunto e fundamento"
        ]
      },
      {
        "title": "Resumos automáticos",
        "items": [
          "Geração automatizada de resumos cobrindo pedido, decisão e fundamentação",
          "Geração individual ou em lote (até 120 documentos por vez)"
        ]
      },
      {
        "title": "Organização e acervo",
        "items": [
          "Criação de coleções temáticas personalizadas para organizar decisões relevantes",
          "Etiquetas e filtros intuitivos para manter o acervo estruturado e acessível"
        ]
      },
      {
        "title": "Monitoramento contínuo",
        "items": [
          "Alertas automáticos sobre novos precedentes em temas de interesse",
          "Rastreamento da evolução de entendimentos jurisprudenciais ao longo do tempo"
        ]
      },
      {
        "title": "Jurimetria",
        "items": [
          "Visualização de taxas de procedência e improcedência por tribunal ou tema",
          "Identificação dos fundamentos jurídicos mais citados em decisões favoráveis",
          "Comparação entre órgãos julgadores e instâncias, com detecção de divergências entre Câmaras, Turmas e relatores",
          "Mapas de risco da tese com pontos críticos identificados",
          "Volumetria de decisões por período ou magistrado",
          "Análises trabalhistas por CNPJ (histórico do empregador)",
          "Exportação de gráficos, tabelas e indicadores para pareceres, relatórios e reuniões"
        ]
      },
      {
        "title": "Insights estratégicos",
        "items": [
          "Análise automatizada de recorrência de fundamentos, divergências entre tribunais e evolução de entendimentos",
          "Apoio à construção de argumentação com dados concretos para pareceres, petições e sustentações orais"
        ]
      }
    ],
    "accessInfo": "",
    "areas": "Cível, Trabalhista, Tributário, Empresarial, Previdenciário e Consumidor",
    "category": "Jurisprudência"
  },
  {
    "id": "checkpoint",
    "name": "Checkpoint",
    "fullName": "",
    "provider": "Thomson Reuters",
    "description": "Portal de conteúdo em nuvem da Thomson Reuters voltado para profissionais das áreas tributária, contábil, trabalhista, previdenciária, societária e de comércio exterior. Oferece acesso em tempo real a um acervo de alto padrão que inclui mais de 8.000 roteiros, comentários e tabelas práticas, mais de 60.000 decisões administrativas da Receita Federal, cerca de 3.500 artigos e aproximadamente 270.000 atos legais. Atualizado diariamente.",
    "featureGroups": [
      {
        "title": "Pesquisa de conteúdo especializado",
        "items": [
          "Busca com filtros inteligentes em legislação, jurisprudência, decisões administrativas da RFB, roteiros comentados, artigos doutrinários e tabelas práticas",
          "Roteiros com comentários de especialistas que orientam a aplicação prática das normas",
          "Acervo de decisões administrativas e atos legais cobrindo as principais áreas regulatórias e fiscais"
        ]
      },
      {
        "title": "Ferramentas de consulta",
        "items": [
          "Agenda de obrigações atualizada para acompanhamento de prazos fiscais, contábeis e trabalhistas",
          "Tabelas práticas de referência rápida para consultas do dia a dia",
          "Atualização diária do conteúdo para garantir conformidade com as normas vigentes"
        ]
      }
    ],
    "accessInfo": "",
    "areas": "Tributária, Contábil, Trabalhista, Previdenciária, Societária e Comércio Exterior",
    "category": "Legislação"
  },
  {
    "id": "onesource",
    "name": "ComexContent",
    "fullName": "ONESOURCE Global Trade",
    "provider": "Thomson Reuters",
    "description": "Solução da Thomson Reuters para comércio exterior que entrega diariamente, de forma automatizada, informações essenciais para operações de importação e regimes especiais: dados de NCM, alíquotas de impostos, taxas de câmbio, ex-tarifários e regras de licenciamento de importação. Garante cálculos corretos de tributação e conformidade regulatória sem intervenção manual.",
    "featureGroups": [
      {
        "title": "Conteúdo tributário e regulatório automatizado",
        "items": [
          "Atualização automática de alterações da NCM e alíquotas dos impostos federais incidentes sobre importação",
          "Informes de taxas fiscais de câmbio atualizados diretamente no sistema",
          "Informações de ex-tarifário para aplicação nos produtos importados"
        ]
      },
      {
        "title": "Licenciamento de importação",
        "items": [
          "Determinação automática da necessidade de Licença de Importação com base em todas as regras vigentes",
          "Monitoramento automático de alterações legais com atualização dos processos em andamento"
        ]
      },
      {
        "title": "Cálculos de tributação",
        "items": [
          "Cálculos corretos de tributação nas operações de importação e regimes especiais, alimentados pelos conteúdos atualizados automaticamente"
        ]
      },
      {
        "title": "Biblioteca de conteúdo",
        "items": [
          "Materiais sobre gestão de comércio exterior: white papers, e-books e informativos sobre mudanças regulatórias (DUIMP, DUE, Acordo de Facilitação de Comércio da OMC)"
        ]
      }
    ],
    "accessInfo": "",
    "areas": "Comércio Exterior (importação e regimes especiais)",
    "category": "Legislação"
  },
  {
    "id": "econet",
    "name": "Econet",
    "description": "",
    "featureGroups": [],
    "accessInfo": "",
    "category": "Legislação"
  },
  {
    "id": "rc-ambiental",
    "name": "RC Ambiental",
    "fullName": "",
    "provider": "",
    "description": "Portal especializado em legislação ambiental brasileira, mantido há mais de 22 anos pelo advogado Dr. Renato Senges Carneiro. Disponibiliza um banco de dados com cerca de 99.700 atos jurídicos federais e estaduais relacionados ao tema ambiental, todos com referência legislativa, abrangendo normas do menor ao maior grau hierárquico editadas pelos poderes Legislativo e Executivo e por órgãos da administração pública com atribuições normativas ou deliberativas. O acervo é atualizado constantemente, cobrindo também Saúde e Segurança no Trabalho (SMS) e Responsabilidade Social.",
    "featureGroups": [
      {
        "title": "Pesquisa legislativa ambiental",
        "items": [
          "Busca em banco de dados próprio com mais de 99.700 atos, por termo, número do ato ou área temática",
          "Cobertura de legislação ambiental federal e de todos os estados brasileiros",
          "Identificação do ato, situação (vigente ou revogado), ementa e âmbito de aplicação",
          "Controle de vigência: normas revogadas, parcialmente alteradas ou substituídas"
        ]
      },
      {
        "title": "Monitoramento de atualizações",
        "items": [
          "Acompanhamento contínuo de novos atos, revogações e alterações legislativas em todos os âmbitos cobertos",
          "Painel com volumetria de movimentações legislativas recentes por esfera federal e estadual",
          "Informe Jurídico periódico por e-mail (publicado desde 2004), com atualizações segmentadas por área e âmbito",
          "Escolha das áreas e âmbitos de interesse para recebimento personalizado dos informes"
        ]
      }
    ],
    "accessInfo": "",
    "areas": "Legislação ambiental (federal e estadual), Saúde e Segurança no Trabalho (SMS) e Responsabilidade Social",
    "category": "Legislação"
  },
  {
    "id": "ag-ncia-infra",
    "name": "Agência Infra",
    "description": "",
    "featureGroups": [],
    "accessInfo": "",
    "category": "Notícias"
  },
  {
    "id": "capital-aberto",
    "name": "Capital Aberto",
    "description": "",
    "featureGroups": [],
    "accessInfo": "",
    "category": "Notícias"
  },
  {
    "id": "estad-o",
    "name": "Estadão",
    "description": "",
    "featureGroups": [],
    "accessInfo": "",
    "category": "Notícias"
  },
  {
    "id": "folha",
    "name": "Folha",
    "description": "",
    "featureGroups": [],
    "accessInfo": "",
    "category": "Notícias"
  },
  {
    "id": "jota",
    "name": "Jota",
    "description": "",
    "featureGroups": [],
    "accessInfo": "",
    "category": "Notícias"
  },
  {
    "id": "megawhat",
    "name": "MegaWhat",
    "description": "",
    "featureGroups": [],
    "accessInfo": "",
    "category": "Notícias"
  },
  {
    "id": "o-globo",
    "name": "O Globo",
    "description": "",
    "featureGroups": [],
    "accessInfo": "",
    "category": "Notícias"
  },
  {
    "id": "portal-da-reforma-tribut-ria",
    "name": "Portal da Reforma Tributária",
    "description": "",
    "featureGroups": [],
    "accessInfo": "",
    "category": "Notícias"
  },
  {
    "id": "resenha-de-not-cias-fiscais",
    "name": "Resenha de Notícias Fiscais",
    "description": "",
    "featureGroups": [],
    "accessInfo": "",
    "category": "Notícias"
  },
  {
    "id": "revista-exame",
    "name": "Revista Exame",
    "description": "",
    "featureGroups": [],
    "accessInfo": "",
    "category": "Notícias"
  },
  {
    "id": "valor-econ-mico",
    "name": "Valor Econômico",
    "description": "",
    "featureGroups": [],
    "accessInfo": "",
    "category": "Notícias"
  },
  {
    "id": "d4sign",
    "name": "D4Sign",
    "description": "",
    "featureGroups": [],
    "accessInfo": "",
    "category": "Assinatura Digital"
  },
  {
    "id": "docusign",
    "name": "DocuSign",
    "description": "",
    "featureGroups": [],
    "accessInfo": "",
    "category": "Assinatura Digital"
  },
  {
    "id": "certisign",
    "name": "CertiSign",
    "description": "",
    "featureGroups": [],
    "accessInfo": "",
    "category": "Assinatura Digital"
  },
  {
    "id": "portdata",
    "name": "PortData",
    "description": "",
    "featureGroups": [],
    "accessInfo": "",
    "category": "Due Diligence"
  },
  {
    "id": "lexter",
    "name": "Lexter",
    "description": "",
    "featureGroups": [],
    "accessInfo": "",
    "category": "Due Diligence"
  },
  {
    "id": "registradores",
    "name": "Registradores",
    "description": "",
    "featureGroups": [],
    "accessInfo": "",
    "category": "Due Diligence"
  },
  {
    "id": "upminer",
    "name": "UpMiner",
    "description": "",
    "featureGroups": [],
    "accessInfo": "",
    "category": "Due Diligence"
  }
];
