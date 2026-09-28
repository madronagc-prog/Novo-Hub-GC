export interface Source {
  id: string;
  nome: string;
  link: string;
  tema: string;
  statusInoreader: 'Leitor de RSS' | 'Acesso Direto';
  sigla?: string;
  descricao?: string;
}

export const initialSources: Source[] = [
  {
    "id": "1",
    "nome": "Agência Brasileira de Desenvolvimento Industrial",
    "link": "https://www.abdi.com.br/noticias/",
    "tema": "Geral",
    "statusInoreader": "Acesso Direto",
    "sigla": "ABDI"
  },
  {
    "id": "2",
    "nome": "Agência Câmara",
    "link": "https://www.camara.leg.br/noticias",
    "tema": "Legislativo",
    "statusInoreader": "Leitor de RSS"
  },
  {
    "id": "3",
    "nome": "Agência iNFRA",
    "link": "https://agenciainfra.com/blog/",
    "tema": "Infraestrutura",
    "statusInoreader": "Leitor de RSS"
  },
  {
    "id": "4",
    "nome": "Agência Nacional de Águas e Saneamento Básico",
    "link": "https://www.gov.br/ana/pt-br/assuntos/noticias-e-eventos/noticias",
    "tema": "Saneamento Básico",
    "statusInoreader": "Leitor de RSS",
    "sigla": "ANA"
  },
  {
    "id": "5",
    "nome": "Agência Nacional de Energia Elétrica",
    "link": "https://www.gov.br/aneel/pt-br/assuntos/noticias/2026",
    "tema": "Energia",
    "statusInoreader": "Leitor de RSS",
    "sigla": "ANEEL"
  },
  {
    "id": "6",
    "nome": "Agência Nacional de Mineração",
    "link": "https://www.gov.br/anm/pt-br/assuntos/noticias",
    "tema": "Mineração",
    "statusInoreader": "Leitor de RSS",
    "sigla": "ANM"
  },
  {
    "id": "7",
    "nome": "Agência Nacional de Proteção de Dados",
    "link": "https://www.gov.br/anpd/pt-br/assuntos/noticias",
    "tema": "Digital",
    "statusInoreader": "Leitor de RSS",
    "sigla": "ANPD"
  },
  {
    "id": "8",
    "nome": "Agência Nacional de Telecomunicações",
    "link": "https://www.gov.br/anatel/pt-br/assuntos/noticias",
    "tema": "Telecom",
    "statusInoreader": "Leitor de RSS",
    "sigla": "ANATEL"
  },
  {
    "id": "9",
    "nome": "Agência Nacional de Transportes Aquaviários",
    "link": "https://www.gov.br/antaq/pt-br/noticias/2026",
    "tema": "Portos",
    "statusInoreader": "Leitor de RSS",
    "sigla": "ANTAQ"
  },
  {
    "id": "10",
    "nome": "Agência Nacional do Petróleo, Gás Natural e Biocombustíveis",
    "link": "https://www.gov.br/anp/pt-br/canais_atendimento/imprensa/noticias-comunicados",
    "tema": "Combustíveis",
    "statusInoreader": "Leitor de RSS",
    "sigla": "ANP"
  },
  {
    "id": "11",
    "nome": "Apex Brasil",
    "link": "https://apexbrasil.com.br/content/apexbrasil/br/pt/noticias.html",
    "tema": "Comex",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "12",
    "nome": "Associação Brasileira da Indústria do Hidrogênio Verde",
    "link": "https://abihv.org.br/noticias/",
    "tema": "Energia",
    "statusInoreader": "Acesso Direto",
    "sigla": "ABIHV"
  },
  {
    "id": "13",
    "nome": "Associação Brasileira da Indústria Química",
    "link": "https://abiquim.org.br/comunicacao/noticias",
    "tema": "Geral",
    "statusInoreader": "Acesso Direto",
    "sigla": "ABIQUIM"
  },
  {
    "id": "14",
    "nome": "Associação Brasileira da Infraestrutura e Indústrias de Base  (Notícias institucionais)",
    "link": "https://www.abdib.org.br/categoria/sala-de-imprensa/",
    "tema": "Infraestrutura",
    "statusInoreader": "Acesso Direto",
    "sigla": "ABDIB"
  },
  {
    "id": "15",
    "nome": "Associação Brasileira da Infraestrutura e Indústrias de Base  (Notícias o setor)",
    "link": "https://www.abdib.org.br/categoria/noticias-do-dia/",
    "tema": "Infraestrutura",
    "statusInoreader": "Acesso Direto",
    "sigla": "ABDIB"
  },
  {
    "id": "16",
    "nome": "Associação Brasileira da Propriedade Intelectual",
    "link": "https://abpi.org.br/noticias/",
    "tema": "Propriedade Intelectual",
    "statusInoreader": "Acesso Direto",
    "sigla": "ABPI"
  },
  {
    "id": "17",
    "nome": "Associação Brasileira das Companhias Abertas",
    "link": "https://www.abrasca.org.br/noticias",
    "tema": "Corporativo",
    "statusInoreader": "Acesso Direto",
    "sigla": "Abrasca"
  },
  {
    "id": "18",
    "nome": "Associação Brasileira das Empresas de Tecnologia da Informação e Comunicação",
    "link": "https://brasscom.org.br/posicionamentos/",
    "tema": "Telecom",
    "statusInoreader": "Acesso Direto",
    "sigla": "BRASSCOM"
  },
  {
    "id": "19",
    "nome": "Associação Brasileira das Empresas de Transmissão de Energia Elétrica",
    "link": "https://abrate.org.br/noticias/",
    "tema": "Energia",
    "statusInoreader": "Acesso Direto",
    "sigla": "ABRATE"
  },
  {
    "id": "20",
    "nome": "Associação Brasileira das Empresas Distribuidoras de Gás Canalizado",
    "link": "https://www.abegas.org.br/noticias-do-setor",
    "tema": "Combustíveis",
    "statusInoreader": "Acesso Direto",
    "sigla": "ABEGAS"
  },
  {
    "id": "21",
    "nome": "Associação Brasileira das Empresas Geradoras de Energia Elétrica  (Notícias institucionais)",
    "link": "https://www.abrage.com.br/comunicacao/",
    "tema": "Energia",
    "statusInoreader": "Acesso Direto",
    "sigla": "ABRAGE"
  },
  {
    "id": "22",
    "nome": "Associação Brasileira das Empresas Geradoras de Energia Elétrica  (Notícias)",
    "link": "https://www.abrage.com.br/blog/",
    "tema": "Energia",
    "statusInoreader": "Acesso Direto",
    "sigla": "ABRAGE"
  },
  {
    "id": "23",
    "nome": "Associação Brasileira das Entidades dos Mercados Financeiro e de Capitais",
    "link": "https://www.anbima.com.br/pt_br/noticias/noticias.htm",
    "tema": "Corporativo",
    "statusInoreader": "Acesso Direto",
    "sigla": "ANBIMA"
  },
  {
    "id": "24",
    "nome": "Associação Brasileira de Data Centers",
    "link": "https://datacenter.org.br/noticias-en-2/",
    "tema": "Digital",
    "statusInoreader": "Acesso Direto",
    "sigla": "ABDC"
  },
  {
    "id": "25",
    "nome": "Associação Brasileira de Distribuidores de Energia Elétrica",
    "link": "https://abradee.org.br/noticias/",
    "tema": "Energia",
    "statusInoreader": "Acesso Direto",
    "sigla": "ABRADEE"
  },
  {
    "id": "26",
    "nome": "Associação Brasileira de Energia Eólica",
    "link": "https://abeeolica.org.br/categoria/noticias/agencia-abeeolica/",
    "tema": "Energia",
    "statusInoreader": "Acesso Direto",
    "sigla": "ABEEólica"
  },
  {
    "id": "27",
    "nome": "Associação Brasileira de Energia Solar Fotovoltaica",
    "link": "https://www.absolar.org.br/posts/?category_name=noticia",
    "tema": "Energia",
    "statusInoreader": "Acesso Direto",
    "sigla": "ABSOLAR"
  },
  {
    "id": "28",
    "nome": "Associação Brasileira de Engenharia Sanitária e Ambiental",
    "link": "https://abes.org.br/noticias/",
    "tema": "Saneamento Básico",
    "statusInoreader": "Acesso Direto",
    "sigla": "ABES"
  },
  {
    "id": "29",
    "nome": "Associação Brasileira de Geração Distribuida",
    "link": "https://www.abgd.com.br/portal/noticias/",
    "tema": "Energia",
    "statusInoreader": "Acesso Direto",
    "sigla": "ABGD"
  },
  {
    "id": "30",
    "nome": "Associação Brasileira de Grandes Consumidores Industriais de Energia e de Consumidores Livres",
    "link": "https://abrace.org.br/noticias/",
    "tema": "Energia",
    "statusInoreader": "Acesso Direto",
    "sigla": "ABRACE"
  },
  {
    "id": "31",
    "nome": "Associação Brasileira de Operadores Logísticos  (Notícias institucionais)",
    "link": "https://abolbrasil.org.br/noticias/sala-de-imprensa",
    "tema": "Infraestrutura",
    "statusInoreader": "Acesso Direto",
    "sigla": "ABOL"
  },
  {
    "id": "32",
    "nome": "Associação Brasileira de Operadores Logísticos  (Notícias o setor)",
    "link": "https://abolbrasil.org.br/noticias/noticias-do-setor",
    "tema": "Infraestrutura",
    "statusInoreader": "Acesso Direto",
    "sigla": "ABOL"
  },
  {
    "id": "33",
    "nome": "Associação Brasileira de PCH e CGH",
    "link": "https://abrapch.org.br/blog/",
    "tema": "Energia",
    "statusInoreader": "Acesso Direto",
    "sigla": "ABRAPCH"
  },
  {
    "id": "34",
    "nome": "Associação Brasileira de Soluções de Armazenamento de Energia",
    "link": "https://www.absae.org.br/not%C3%ADcias",
    "tema": "Energia",
    "statusInoreader": "Acesso Direto",
    "sigla": "ABSAE"
  },
  {
    "id": "35",
    "nome": "Associação Brasileira de Venture Capital e Private Equity",
    "link": "https://abvcap.com.br/noticias/",
    "tema": "Corporativo",
    "statusInoreader": "Acesso Direto",
    "sigla": "ABVCAP"
  },
  {
    "id": "36",
    "nome": "Associação Brasileira do Agronegócio",
    "link": "https://abag.com.br/noticias-abag/",
    "tema": "Agronegócio",
    "statusInoreader": "Acesso Direto",
    "sigla": "ABAG"
  },
  {
    "id": "37",
    "nome": "Associação Brasileira dos Comercializadores de Energia",
    "link": "https://abraceel.com.br/blog/",
    "tema": "Energia",
    "statusInoreader": "Acesso Direto",
    "sigla": "ABRACEEL"
  },
  {
    "id": "38",
    "nome": "Associação e Sindicato Nacional das Concessionárias Privadas de Serviços Públicos de Água e Esgoto",
    "link": "https://abconsindcon.com.br/imprensa/",
    "tema": "Saneamento Básico",
    "statusInoreader": "Acesso Direto",
    "sigla": "ABCON"
  },
  {
    "id": "39",
    "nome": "Banco ABC Brasil no TTR",
    "link": "https://www.ttrdata.com/pt/zona-exclusiva/entidades/Banco-ABC-Brasil/10644/",
    "tema": "TTR",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "40",
    "nome": "Banco Central",
    "link": "https://www.bcb.gov.br/noticias",
    "tema": "Bancário",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "41",
    "nome": "Banco Safra no TTR",
    "link": "https://www.ttrdata.com/pt/zona-exclusiva/entidades/Banco-Safra/10537/",
    "tema": "TTR",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "42",
    "nome": "Banco XP no TTR",
    "link": "https://www.ttrdata.com/pt/zona-exclusiva/entidades/XP/173440/",
    "tema": "TTR",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "43",
    "nome": "Bank of America no TTR",
    "link": "https://www.ttrdata.com/pt/zona-exclusiva/entidades/Bank-of-America/17014/",
    "tema": "TTR",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "44",
    "nome": "Bloomberg Linea",
    "link": "https://www.bloomberglinea.com.br/",
    "tema": "Geral",
    "statusInoreader": "Leitor de RSS"
  },
  {
    "id": "45",
    "nome": "BR Partners no TTR",
    "link": "https://www.ttrdata.com/pt/zona-exclusiva/entidades/BR-Partners/5339/",
    "tema": "TTR",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "46",
    "nome": "Bradesco BBI no TTR",
    "link": "https://www.ttrdata.com/pt/zona-exclusiva/entidades/Banco-Bradesco-BBI/2755/",
    "tema": "TTR",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "47",
    "nome": "Bradesco no TTR",
    "link": "https://www.ttrdata.com/pt/zona-exclusiva/entidades/Banco-Bradesco/5161/",
    "tema": "TTR",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "48",
    "nome": "Brasil Mineral",
    "link": "https://www.brasilmineral.com.br/",
    "tema": "Mineração",
    "statusInoreader": "Leitor de RSS"
  },
  {
    "id": "49",
    "nome": "Brazil Journal",
    "link": "https://braziljournal.com/",
    "tema": "Geral",
    "statusInoreader": "Leitor de RSS"
  },
  {
    "id": "50",
    "nome": "BTG Pactual no TTR",
    "link": "https://www.ttrdata.com/pt/btgpactual/",
    "tema": "TTR",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "51",
    "nome": "Câmara Americana de Comércio para o Brasil",
    "link": "https://www.amcham.com.br/blog",
    "tema": "Comex",
    "statusInoreader": "Acesso Direto",
    "sigla": "Amchan"
  },
  {
    "id": "52",
    "nome": "Câmara Brasileira da Indústria da Construção",
    "link": "https://cbic.org.br/agencia-de-noticias-2/",
    "tema": "Imobiliário",
    "statusInoreader": "Acesso Direto",
    "sigla": "CBIC"
  },
  {
    "id": "53",
    "nome": "Câmara de Comercialização de Energia Elétrica",
    "link": "https://www.ccee.org.br/pt/busca-ccee?q=&dtIni=&dtFim=&structure=ccee-noticias&ordenacao=Mais%20recentes",
    "tema": "Energia",
    "statusInoreader": "Acesso Direto",
    "sigla": "CCEE"
  },
  {
    "id": "54",
    "nome": "Capital Aberto",
    "link": "https://capitalaberto.com.br/",
    "tema": "Geral",
    "statusInoreader": "Leitor de RSS"
  },
  {
    "id": "55",
    "nome": "CCEE",
    "link": "https://www.ccee.org.br/en/noticias",
    "tema": "Energia",
    "statusInoreader": "Acesso Direto",
    "sigla": "CCEE"
  },
  {
    "id": "56",
    "nome": "Citigroup Global no TTR",
    "link": "https://www.ttrdata.com/pt/zona-exclusiva/entidades/Citigroup-Global-Markets-Brasil/2756/#tabs-1",
    "tema": "TTR",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "57",
    "nome": "Comissão de Valores Mobiliários",
    "link": "https://www.gov.br/cvm/pt-br/assuntos/noticias/2026",
    "tema": "Corporativo",
    "statusInoreader": "Leitor de RSS",
    "sigla": "CVM"
  },
  {
    "id": "58",
    "nome": "Comitê de Infraestrutura da Câmara de Mediação e Arbitragem Empresarial – Brasil",
    "link": "https://camarb.com.br/noticias/",
    "tema": "Arbitragem",
    "statusInoreader": "Acesso Direto",
    "sigla": "CAMARB"
  },
  {
    "id": "59",
    "nome": "Comitê Gestor do IBS",
    "link": "https://cgibs.gov.br/noticias",
    "tema": "Tributário",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "60",
    "nome": "Comsefaz",
    "link": "https://comsefaz.org.br",
    "tema": "Tributário",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "61",
    "nome": "Confederação da Agricultura e Pecuária do Brasil",
    "link": "https://www.cnabrasil.org.br/noticias",
    "tema": "Agronegócio",
    "statusInoreader": "Acesso Direto",
    "sigla": "CNA"
  },
  {
    "id": "171",
    "nome": "Confederação Nacional da Indústria",
    "link": "https://cni.portaldaindustria.com.br/noticias",
    "tema": "Geral",
    "statusInoreader": "Acesso Direto",
    "sigla": "CNI"
  },
  {
    "id": "62",
    "nome": "Confederação Nacional das Seguradoras",
    "link": "https://noticiasdoseguro.org.br/",
    "tema": "Seguros",
    "statusInoreader": "Acesso Direto",
    "sigla": "CNSEG"
  },
  {
    "id": "63",
    "nome": "Confederação Nacional do Transporte",
    "link": "https://www.cnt.org.br/agencia-cnt",
    "tema": "Infraestrutura",
    "statusInoreader": "Acesso Direto",
    "sigla": "CNT"
  },
  {
    "id": "64",
    "nome": "Congresso em Foco",
    "link": "https://www.congressoemfoco.com.br/",
    "tema": "Legislativo",
    "statusInoreader": "Leitor de RSS"
  },
  {
    "id": "65",
    "nome": "Conjur",
    "link": "https://www.conjur.com.br/",
    "tema": "Jurídico",
    "statusInoreader": "Leitor de RSS"
  },
  {
    "id": "66",
    "nome": "Conselho Administrativo de Defesa Econômica",
    "link": "https://www.gov.br/cade/pt-br/assuntos/noticias",
    "tema": "Concorrencial",
    "statusInoreader": "Leitor de RSS"
  },
  {
    "id": "67",
    "nome": "Data Center Dynamics",
    "link": "https://www.datacenterdynamics.com/br/markets/brazil/",
    "tema": "Digital",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "68",
    "nome": "Eixos",
    "link": "https://eixos.com.br/",
    "tema": "Energia; Combustíveis",
    "statusInoreader": "Leitor de RSS"
  },
  {
    "id": "69",
    "nome": "Empresa de Pesquisa Energética",
    "link": "https://www.epe.gov.br/pt/imprensa/noticias",
    "tema": "Energia",
    "statusInoreader": "Acesso Direto",
    "sigla": "EPE"
  },
  {
    "id": "70",
    "nome": "Estadão",
    "link": "https://www.estadao.com.br/",
    "tema": "Geral",
    "statusInoreader": "Leitor de RSS"
  },
  {
    "id": "71",
    "nome": "Exame",
    "link": "https://exame.com/",
    "tema": "Geral",
    "statusInoreader": "Leitor de RSS"
  },
  {
    "id": "72",
    "nome": "Federação Brasileira de Bancos",
    "link": "https://portal.febraban.org.br/FebrabanNews",
    "tema": "Bancário",
    "statusInoreader": "Acesso Direto",
    "sigla": "Febraban"
  },
  {
    "id": "73",
    "nome": "Folha",
    "link": "https://www.folha.uol.com.br/",
    "tema": "Geral",
    "statusInoreader": "Leitor de RSS"
  },
  {
    "id": "74",
    "nome": "Fundação Getúlio Vargas",
    "link": "https://portal.fgv.br/noticias#:~:text=2-,Todas%20as%20not%C3%ADcias,-Busca",
    "tema": "Geral",
    "statusInoreader": "Acesso Direto",
    "sigla": "FGV"
  },
  {
    "id": "75",
    "nome": "Goldman Sachs no TTR",
    "link": "https://www.ttrdata.com/pt/zona-exclusiva/entidades/Goldman-Sachs-do-Brasil-Banco-Multiplo/2768/",
    "tema": "TTR",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "76",
    "nome": "Imobi Report",
    "link": "https://imobireport.com.br/",
    "tema": "Imobiliário",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "77",
    "nome": "Infomoney",
    "link": "https://www.infomoney.com.br/",
    "tema": "Geral",
    "statusInoreader": "Leitor de RSS"
  },
  {
    "id": "78",
    "nome": "INPI",
    "link": "https://www.gov.br/inpi/pt-br/central-de-conteudo/noticias",
    "tema": "Propriedade Intelectual",
    "statusInoreader": "Acesso Direto",
    "sigla": "INPI"
  },
  {
    "id": "79",
    "nome": "Instituto Aço Brasil",
    "link": "https://www.acobrasil.org.br/site/noticias/",
    "tema": "Geral",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "80",
    "nome": "Instituto Brasileiro de Ciências Criminais",
    "link": "https://ibccrim.org.br/noticias/",
    "tema": "Ética e Compliance",
    "statusInoreader": "Acesso Direto",
    "sigla": "IBCCRIM"
  },
  {
    "id": "81",
    "nome": "Instituto Brasileiro de Direito Ambiental",
    "link": "https://ibda.org.br/blog-2/",
    "tema": "Ambiental",
    "statusInoreader": "Acesso Direto",
    "sigla": "IBDA"
  },
  {
    "id": "82",
    "nome": "Instituto Brasileiro de Governança Corporativa",
    "link": "https://www.ibgc.org.br/blog/",
    "tema": "Ética e Compliance",
    "statusInoreader": "Acesso Direto",
    "sigla": "IBGC"
  },
  {
    "id": "83",
    "nome": "Instituto Brasileiro de Mineração",
    "link": "https://ibram.org.br/noticias/",
    "tema": "Mineração",
    "statusInoreader": "Acesso Direto",
    "sigla": "IBRAM"
  },
  {
    "id": "84",
    "nome": "Instituto Brasileiro de Petróleo, Gás e Biocombustíveis",
    "link": "https://www.ibp.org.br/hub-de-conhecimento/noticias/",
    "tema": "Combustíveis",
    "statusInoreader": "Acesso Direto",
    "sigla": "IBP"
  },
  {
    "id": "85",
    "nome": "Instituto de Pesquisa Econômica Aplicada",
    "link": "https://www.ipea.gov.br/portal/coluna-2/acompanhe-o-ipea/busca-noticias",
    "tema": "Geral",
    "statusInoreader": "Acesso Direto",
    "sigla": "IPEA"
  },
  {
    "id": "86",
    "nome": "Instituto Nacional da Propriedade Industrial",
    "link": "https://www.gov.br/inpi/pt-br/central-de-conteudo/noticias",
    "tema": "Propriedade Intelectual",
    "statusInoreader": "Acesso Direto",
    "sigla": "INPI"
  },
  {
    "id": "87",
    "nome": "Instituto Trata Brasil",
    "link": "https://tratabrasil.org.br/",
    "tema": "Saneamento Básico",
    "statusInoreader": "Leitor de RSS"
  },
  {
    "id": "88",
    "nome": "International Chamber of Commerce",
    "link": "https://www.iccbrasil.org/noticias/",
    "tema": "Comex",
    "statusInoreader": "Acesso Direto",
    "sigla": "ICC Brasil"
  },
  {
    "id": "89",
    "nome": "Investnews",
    "link": "https://investnews.com.br/",
    "tema": "Geral",
    "statusInoreader": "Leitor de RSS"
  },
  {
    "id": "90",
    "nome": "Itaú BBA no TTR",
    "link": "https://www.ttrdata.com/pt/zona-exclusiva/entidades/Banco-Itau-BBA/2757/",
    "tema": "TTR",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "91",
    "nome": "JOTA Pro Tributos",
    "link": "https://www.jota.info/tributos",
    "tema": "Tributário",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "92",
    "nome": "JOTA",
    "link": "https://www.jota.info/",
    "tema": "Jurídico",
    "statusInoreader": "Leitor de RSS"
  },
  {
    "id": "93",
    "nome": "JP Morgan Brasil no TTR",
    "link": "https://www.ttrdata.com/pt/zona-exclusiva/entidades/Banco-JP-Morgan-Brasil/6584/#tabs-1",
    "tema": "TTR",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "94",
    "nome": "JP Morgan no TTR",
    "link": "https://www.ttrdata.com/pt/zona-exclusiva/entidades/JP-Morgan/594/",
    "tema": "TTR",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "95",
    "nome": "Legislação & Mercados",
    "link": "https://legislacaoemercados.capitalaberto.com.br/",
    "tema": "Jurídico",
    "statusInoreader": "Leitor de RSS"
  },
  {
    "id": "96",
    "nome": "Megawhat",
    "link": "https://megawhat.uol.com.br/",
    "tema": "Energia",
    "statusInoreader": "Leitor de RSS"
  },
  {
    "id": "97",
    "nome": "Metro Quadrado",
    "link": "https://metroquadrado.com/",
    "tema": "Imobiliário",
    "statusInoreader": "Leitor de RSS"
  },
  {
    "id": "98",
    "nome": "Migalhas",
    "link": "https://www.migalhas.com.br/",
    "tema": "Jurídico",
    "statusInoreader": "Leitor de RSS"
  },
  {
    "id": "99",
    "nome": "Ministério da Fazenda",
    "link": "https://www.gov.br/fazenda/pt-br/assuntos/noticias",
    "tema": "Tributário",
    "statusInoreader": "Leitor de RSS"
  },
  {
    "id": "100",
    "nome": "Ministério de Portos e Aeroportos",
    "link": "https://www.gov.br/portos-e-aeroportos/pt-br/assuntos/noticias",
    "tema": "Portos; Aeroportos",
    "statusInoreader": "Leitor de RSS"
  },
  {
    "id": "101",
    "nome": "Ministério do Desenvolvimento, Indústria, Comércio e Serviços",
    "link": "https://www.gov.br/mdic/pt-br/assuntos/noticias",
    "tema": "Comex",
    "statusInoreader": "Leitor de RSS"
  },
  {
    "id": "102",
    "nome": "Ministério dos Transportes",
    "link": "https://www.gov.br/transportes/pt-br/assuntos/noticias",
    "tema": "Rodovias; Ferrovias",
    "statusInoreader": "Leitor de RSS"
  },
  {
    "id": "103",
    "nome": "Morgan Stanley Brasil no TTR",
    "link": "https://www.ttrdata.com/pt/zona-exclusiva/entidades/Morgan-Stanley-Brasil/2758/",
    "tema": "TTR",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "104",
    "nome": "NeoFeed",
    "link": "https://neofeed.com.br/",
    "tema": "Geral",
    "statusInoreader": "Leitor de RSS"
  },
  {
    "id": "105",
    "nome": "Notícias do Seguro",
    "link": "https://noticiasdoseguro.org.br/noticias",
    "tema": "Seguros",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "106",
    "nome": "Notícias Fiscais",
    "link": "https://noticiasfiscais.com.br/",
    "tema": "Tributário",
    "statusInoreader": "Leitor de RSS"
  },
  {
    "id": "107",
    "nome": "O Globo",
    "link": "https://oglobo.globo.com/",
    "tema": "Geral",
    "statusInoreader": "Leitor de RSS"
  },
  {
    "id": "108",
    "nome": "Operador Nacional do Sistema Elétrico",
    "link": "https://www.ons.org.br/paginas/imprensa/noticias",
    "tema": "Energia",
    "statusInoreader": "Acesso Direto",
    "sigla": "ONS"
  },
  {
    "id": "109",
    "nome": "Ordem dos Advogados do Brasil",
    "link": "https://www.oab.org.br/noticias",
    "tema": "Advocacia",
    "statusInoreader": "Acesso Direto",
    "sigla": "OAB"
  },
  {
    "id": "110",
    "nome": "Papo Imobiliário",
    "link": "https://www.papoimobiliario.com/ultimas-noticias/",
    "tema": "Imobiliário",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "111",
    "nome": "Pipeline",
    "link": "https://pipelinevalor.globo.com/",
    "tema": "Geral",
    "statusInoreader": "Leitor de RSS"
  },
  {
    "id": "112",
    "nome": "Portal da Mineração",
    "link": "https://portaldamineracao.com.br/noticias/",
    "tema": "Mineração",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "113",
    "nome": "Portal da Reforma Tributária",
    "link": "https://www.reformatributaria.com/",
    "tema": "Tributário",
    "statusInoreader": "Leitor de RSS"
  },
  {
    "id": "114",
    "nome": "Portos e Navios",
    "link": "https://www.portosenavios.com.br/",
    "tema": "Portos",
    "statusInoreader": "Leitor de RSS"
  },
  {
    "id": "115",
    "nome": "Programa de Parcerias de Investimentos",
    "link": "https://ppi.gov.br/noticias/",
    "tema": "Infraestrutura",
    "statusInoreader": "Acesso Direto",
    "sigla": "PPI"
  },
  {
    "id": "116",
    "nome": "Receita Federal",
    "link": "https://www.gov.br/receitafederal/pt-br/assuntos/noticias",
    "tema": "Tributário",
    "statusInoreader": "Leitor de RSS"
  },
  {
    "id": "117",
    "nome": "Revista Apólice",
    "link": "https://revistaapolice.com.br/categoria/noticias/",
    "tema": "Seguros",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "118",
    "nome": "Revista Ferroviária",
    "link": "https://revistaferroviaria.com.br/",
    "tema": "Ferrovias",
    "statusInoreader": "Leitor de RSS"
  },
  {
    "id": "119",
    "nome": "Revista Segurador Brasil",
    "link": "https://revistaseguradorbrasil.com.br/categoria/seguros/",
    "tema": "Seguros",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "120",
    "nome": "Santander Brasil no TTR",
    "link": "https://www.ttrdata.com/pt/zona-exclusiva/entidades/Banco-Santander-Brasil/2761/",
    "tema": "TTR",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "121",
    "nome": "Sefaz AL",
    "link": "https://www.sefaz.al.gov.br/noticias",
    "tema": "Tributário",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "122",
    "nome": "Sefaz AM",
    "link": "https://www.sefaz.am.gov.br/noticias",
    "tema": "Tributário",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "123",
    "nome": "Sefaz BA",
    "link": "https://www.sefaz.ba.gov.br/noticias/",
    "tema": "Tributário",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "124",
    "nome": "Sefaz CE",
    "link": "https://www.sefaz.ce.gov.br/category/noticias/",
    "tema": "Tributário",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "125",
    "nome": "Sefaz DF",
    "link": "https://www.economia.df.gov.br/category/noticias-da-secretaria",
    "tema": "Tributário",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "126",
    "nome": "Sefaz ES",
    "link": "https://sefaz.es.gov.br/Noticias",
    "tema": "Tributário",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "127",
    "nome": "Sefaz GO",
    "link": "https://goias.gov.br/economia/categoria/noticias/",
    "tema": "Tributário",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "128",
    "nome": "Sefaz MA",
    "link": "https://sistemas1.sefaz.ma.gov.br/portalsefaz/jsp/consulta/consulta.jsf?tipo=1",
    "tema": "Tributário",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "129",
    "nome": "Sefaz MG",
    "link": "https://www.fazenda.mg.gov.br/noticias",
    "tema": "Tributário",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "130",
    "nome": "Sefaz MS",
    "link": "https://www.sefaz.ms.gov.br/noticias/",
    "tema": "Tributário",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "131",
    "nome": "Sefaz MT",
    "link": "https://www5.sefaz.mt.gov.br/noticias",
    "tema": "Tributário",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "132",
    "nome": "Sefaz PA",
    "link": "https://www.sefa.pa.gov.br/blog-de-noticias",
    "tema": "Tributário",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "133",
    "nome": "Sefaz PB",
    "link": "https://www.sefaz.pb.gov.br/announcements",
    "tema": "Tributário",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "134",
    "nome": "Sefaz PE",
    "link": "https://www.sefaz.pe.gov.br/Paginas/Todas-as-Noticias.aspx",
    "tema": "Tributário",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "135",
    "nome": "Sefaz PI",
    "link": "https://portal.sefaz.pi.gov.br/noticias",
    "tema": "Tributário",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "136",
    "nome": "Sefaz PR",
    "link": "https://www.fazenda.pr.gov.br/Noticias",
    "tema": "Tributário",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "137",
    "nome": "Sefaz RJ",
    "link": "https://portal.fazenda.rj.gov.br/noticias/",
    "tema": "Tributário",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "138",
    "nome": "Sefaz RN",
    "link": "https://www.sefaz.rn.gov.br/noticias",
    "tema": "Tributário",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "139",
    "nome": "Sefaz RS",
    "link": "https://fazenda.rs.gov.br/noticias",
    "tema": "Tributário",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "140",
    "nome": "Sefaz SC",
    "link": "https://www.sef.sc.gov.br/noticias",
    "tema": "Tributário",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "141",
    "nome": "Sefaz SE",
    "link": "https://www.sefaz.se.gov.br/SitePages/Noticias.aspx",
    "tema": "Tributário",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "142",
    "nome": "Sefaz SP",
    "link": "https://portal.fazenda.sp.gov.br/Noticias/Paginas/Noticias.aspx",
    "tema": "Tributário",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "143",
    "nome": "Sefaz TO",
    "link": "https://www.to.gov.br/sefaz/noticias",
    "tema": "Tributário",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "144",
    "nome": "Senado Notícias",
    "link": "https://www12.senado.leg.br/noticias",
    "tema": "Legislativo",
    "statusInoreader": "Leitor de RSS"
  },
  {
    "id": "145",
    "nome": "SiiLA REsource",
    "link": "https://siila.com.br/resource/lang/pt-br",
    "tema": "Imobiliário",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "146",
    "nome": "Superintendência de Seguros Privados",
    "link": "https://www.gov.br/susep/pt-br/central-de-conteudos/noticias",
    "tema": "Seguros",
    "statusInoreader": "Leitor de RSS",
    "sigla": "SUSEP"
  },
  {
    "id": "147",
    "nome": "Superior Tribunal de Justiça",
    "link": "https://www.stj.jus.br/sites/portalp/Comunicacao/Ultimas-noticias",
    "tema": "Jurídico",
    "statusInoreader": "Acesso Direto",
    "sigla": "STJ"
  },
  {
    "id": "148",
    "nome": "Supremo Tribunal Federal",
    "link": "https://noticias.stf.jus.br/",
    "tema": "Jurídico",
    "statusInoreader": "Leitor de RSS",
    "sigla": "STF"
  },
  {
    "id": "149",
    "nome": "Teletime",
    "link": "https://teletime.com.br/",
    "tema": "Telecom",
    "statusInoreader": "Leitor de RSS"
  },
  {
    "id": "150",
    "nome": "Tribunal de Contas da União",
    "link": "https://portal.tcu.gov.br/imprensa/noticias",
    "tema": "Jurídico",
    "statusInoreader": "Acesso Direto",
    "sigla": "TCU"
  },
  {
    "id": "151",
    "nome": "Tribunal de Justiça de Goiás",
    "link": "https://www.tjgo.jus.br/index.php/agencia-de-noticias/noticias-ccs",
    "tema": "Jurídico",
    "statusInoreader": "Acesso Direto",
    "sigla": "TJGO"
  },
  {
    "id": "152",
    "nome": "Tribunal de Justiça de Minas Gerais",
    "link": "https://www.tjmg.jus.br/portal-tjmg/noticias/",
    "tema": "Jurídico",
    "statusInoreader": "Acesso Direto",
    "sigla": "TJMG"
  },
  {
    "id": "153",
    "nome": "Tribunal de Justiça de Santa Catarina",
    "link": "https://www.tjsc.jus.br/web/imprensa/noticias",
    "tema": "Jurídico",
    "statusInoreader": "Acesso Direto",
    "sigla": "TJSC"
  },
  {
    "id": "154",
    "nome": "Tribunal de Justiça de São Paulo",
    "link": "https://www.tjsp.jus.br/Noticias",
    "tema": "Jurídico",
    "statusInoreader": "Acesso Direto",
    "sigla": "TJSP"
  },
  {
    "id": "155",
    "nome": "Tribunal de Justiça do Distrito Federal e Territórios",
    "link": "https://www.tjdft.jus.br/institucional/imprensa/noticias",
    "tema": "Jurídico",
    "statusInoreader": "Acesso Direto",
    "sigla": "TJDFT"
  },
  {
    "id": "156",
    "nome": "Tribunal de Justiça do Rio de Janeiro",
    "link": "https://www.tjrj.jus.br/noticias",
    "tema": "Jurídico",
    "statusInoreader": "Acesso Direto",
    "sigla": "TJRJ"
  },
  {
    "id": "157",
    "nome": "Tribunal de Justiça do Rio Grande do Sul",
    "link": "https://www.tjrs.jus.br/novo/comunicacao/noticias-do-tjrs/noticias/",
    "tema": "Jurídico",
    "statusInoreader": "Acesso Direto",
    "sigla": "TJRS"
  },
  {
    "id": "158",
    "nome": "Tribunal Regional do Trabalho da 2ª Região",
    "link": "https://ww2.trt2.jus.br/noticias/noticias",
    "tema": "Jurídico",
    "statusInoreader": "Acesso Direto",
    "sigla": "TRT2"
  },
  {
    "id": "159",
    "nome": "Tribunal Regional do Trabalho da 3ª Região",
    "link": "https://portal.trt3.jus.br/internet/conheca-o-trt/comunicacao/noticias-juridicas",
    "tema": "Jurídico",
    "statusInoreader": "Acesso Direto",
    "sigla": "TRT3"
  },
  {
    "id": "160",
    "nome": "Tribunal Regional Federal da 1ª Região",
    "link": "https://www.trf1.jus.br/trf1/noticias/?palavra=&categoria=DECIS%C3%83O&periodo=",
    "tema": "Jurídico",
    "statusInoreader": "Acesso Direto",
    "sigla": "TRF1"
  },
  {
    "id": "161",
    "nome": "Tribunal Regional Federal da 2ª Região",
    "link": "https://www.trf2.jus.br/trf2/comunicacao",
    "tema": "Jurídico",
    "statusInoreader": "Acesso Direto",
    "sigla": "TRF2"
  },
  {
    "id": "162",
    "nome": "Tribunal Regional Federal da 3ª Região",
    "link": "https://web.trf3.jus.br/noticias/Noticiar/ExibirUltimasNoticias",
    "tema": "Jurídico",
    "statusInoreader": "Acesso Direto",
    "sigla": "TRF3"
  },
  {
    "id": "163",
    "nome": "Tribunal Regional Federal da 4ª Região",
    "link": "https://www.trf4.jus.br/trf4/controlador.php?acao=noticia_portal",
    "tema": "Jurídico",
    "statusInoreader": "Acesso Direto",
    "sigla": "TRF4"
  },
  {
    "id": "164",
    "nome": "Tribunal Regional Federal da 5ª Região",
    "link": "https://www.trf5.jus.br/index.php/noticias",
    "tema": "Jurídico",
    "statusInoreader": "Acesso Direto",
    "sigla": "TRF5"
  },
  {
    "id": "165",
    "nome": "Tribunal Regional Federal da 6ª Região",
    "link": "https://portal.trf6.jus.br/decisoes/",
    "tema": "Jurídico",
    "statusInoreader": "Acesso Direto",
    "sigla": "TRF6"
  },
  {
    "id": "166",
    "nome": "Tribunal Superior do Trabalho",
    "link": "https://www.tst.jus.br/en/noticias",
    "tema": "Jurídico",
    "statusInoreader": "Acesso Direto",
    "sigla": "TST"
  },
  {
    "id": "167",
    "nome": "UBS no TTR",
    "link": "https://www.ttrdata.com/pt/zona-exclusiva/entidades/UBS-BB/152648/#tabs-1",
    "tema": "TTR",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "168",
    "nome": "União da Indústria de Cana-de-Açúcar e Bioenergia",
    "link": "https://unica.com.br/noticias/",
    "tema": "Combustíveis",
    "statusInoreader": "Acesso Direto",
    "sigla": "UNICA"
  },
  {
    "id": "169",
    "nome": "Valor Econômico",
    "link": "https://valor.globo.com/",
    "tema": "Geral",
    "statusInoreader": "Leitor de RSS"
  },
  {
    "id": "170",
    "nome": "XP Investimentos no TTR",
    "link": "https://www.ttrdata.com/pt/zona-exclusiva/entidades/XP-Investimentos/5465/",
    "tema": "TTR",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "172",
    "nome": "Boston Consulting Group (BCG)",
    "link": "https://www.bcg.com/publications",
    "tema": "Geral",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "173",
    "nome": "ION Analytics",
    "link": "https://ionanalytics.com/insights/tag/premium-report/?postcat=&posttag=premium-report&vertCat=&regions=&ind/",
    "tema": "Geral",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "174",
    "nome": "Deloitte",
    "link": "https://www.deloitte.com/us/en/insights.html?icid=bn_insights",
    "tema": "Geral",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "175",
    "nome": "Goldman Sachs",
    "link": "https://www.goldmansachs.com/insights",
    "tema": "Geral",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "176",
    "nome": "JP Morgan",
    "link": "https://www.jpmorgan.com/insights#:~:text=Newsletters-,All%20insights,-MARKETS%20AND%20ECONOMY",
    "tema": "Geral",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "177",
    "nome": "KPMG",
    "link": "https://kpmg.com/us/en/insights-and-resources.html",
    "tema": "Geral",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "178",
    "nome": "McKinsey",
    "link": "https://www.mckinsey.com/featured-insights#:~:text=Brainteasers-,THE%20WEEK%E2%80%99S%20HIGHLIGHTS,-Article",
    "tema": "Geral",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "179",
    "nome": "Moody's",
    "link": "https://www.moodys.com/web/en/us/insights.html",
    "tema": "Geral",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "180",
    "nome": "PwC",
    "link": "https://www.pwc.com/gx/en/industries.html#:~:text=Transportation%20and%20logistics-,Featured%20insights,-Featured",
    "tema": "Geral",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "181",
    "nome": "S&P Global",
    "link": "https://www.spglobal.com/market-intelligence/en/news-insights#q=&rows=20&pagenum=1&sort=es_unified_dt%20desc&facets={%22es_content_type_s%22:[%22Research%22]}",
    "tema": "Geral",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "182",
    "nome": "Strategy&",
    "link": "https://www.strategyand.pwc.com/gx/en/insights/report-search.html",
    "tema": "Geral",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "183",
    "nome": "The Agribiz",
    "link": "https://www.theagribiz.com/",
    "tema": "Agronegócio",
    "statusInoreader": "Leitor de RSS"
  },
  {
    "id": "184",
    "nome": "Aduaneiras",
    "link": "https://www.aduaneiras.com.br/",
    "tema": "Comex",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "185",
    "nome": "Legal, Ethics & Compliance (LEC)",
    "link": "https://lec.com.br/blog/",
    "tema": "Ética e Compliance",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "186",
    "nome": "Fundo Monetário Internacional (FMI)",
    "link": "https://www.imf.org/en/news/searchnews#q=brazil&sortCriteria=%40imfdate%20descending",
    "tema": "Geral",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "187",
    "nome": "Organização para a Cooperação e Desenvolvimento Econômico (OCDE)",
    "link": "https://www.oecd.org/en/about/newsroom.html",
    "tema": "Geral",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "188",
    "nome": "Banco Interamericano de Desenvolvimento (BID)",
    "link": "https://www.iadb.org/pt-br/noticias/busqueda-de-noticias",
    "tema": "Geral",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "189",
    "nome": "Banco Nacional de Desenvolvimento Econômico e Social (BNDES)",
    "link": "https://agenciadenoticias.bndes.gov.br/",
    "tema": "Geral",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "190",
    "nome": "Fecomercio",
    "link": "https://www.fecomercio.com.br/noticias",
    "tema": "Geral",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "191",
    "nome": "The Latin American Lawyer",
    "link": "https://thelatinamericanlawyer.com/news/",
    "tema": "Jurídico",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "192",
    "nome": "Associação Nacional das Corretoras e Distribuidoras de Títulos e Valores Mobiliários, Câmbio e Mercadorias (ANCORD)",
    "link": "https://www.ancord.org.br/institucional/noticias/",
    "tema": "Geral",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "193",
    "nome": "Lex Legal",
    "link": "https://lexlegal.com.br/",
    "tema": "Jurídico",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "194",
    "nome": "Sefaz AC",
    "link": "https://sefaz.ac.gov.br/noticias/",
    "tema": "Tributário",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "195",
    "nome": "Sefaz AP",
    "link": "https://sefaz.ap.gov.br/noticias/",
    "tema": "Tributário",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "196",
    "nome": "Sefaz RR",
    "link": "https://sefaz.rr.gov.br/noticias/",
    "tema": "Tributário",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "197",
    "nome": "Sefaz RO",
    "link": "https://portal.sefin.ro.gov.br/site/noticias/",
    "tema": "Tributário",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "198",
    "nome": "Ministério da Justiça e Segurança Pública",
    "link": "https://www.gov.br/mj/pt-br/assuntos/noticias",
    "tema": "Jurídico",
    "statusInoreader": "Acesso Direto",
    "sigla": "MJSP"
  },
  {
    "id": "199",
    "nome": "Ministério do Meio Ambiente e Mudança do Clima",
    "link": "https://www.gov.br/mma/pt-br/assuntos/noticias",
    "tema": "Ambiental",
    "statusInoreader": "Acesso Direto",
    "sigla": "MMA"
  },
  {
    "id": "200",
    "nome": "Ministério da Agricultura e Pecuária",
    "link": "https://www.gov.br/agricultura/pt-br/assuntos/noticias",
    "tema": "Agronegócio",
    "statusInoreader": "Acesso Direto",
    "sigla": "MAPA"
  },
  {
    "id": "201",
    "nome": "Ministério do Trabalho e Emprego",
    "link": "https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/noticias",
    "tema": "Trabalhista",
    "statusInoreader": "Acesso Direto",
    "sigla": "MTE"
  },
  {
    "id": "202",
    "nome": "Ministério de Minas e Energia",
    "link": "https://www.gov.br/mme/pt-br/assuntos/noticias",
    "tema": "Energia",
    "statusInoreader": "Acesso Direto",
    "sigla": "MME"
  },
  {
    "id": "203",
    "nome": "Ministério da Ciência, Tecnologia e Inovação",
    "link": "https://www.gov.br/mcti/pt-br/assuntos/noticias",
    "tema": "Digital",
    "statusInoreader": "Acesso Direto",
    "sigla": "MCTI"
  },
  {
    "id": "204",
    "nome": "Ministério das Cidades",
    "link": "https://www.gov.br/cidades/pt-br/assuntos/noticias",
    "tema": "Infraestrutura",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "205",
    "nome": "Ministério do Planejamento e Orçamento",
    "link": "https://www.gov.br/planejamento/pt-br/assuntos/noticias",
    "tema": "Geral",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "206",
    "nome": "Ministério da Gestão e da Inovação em Serviços Públicos",
    "link": "https://www.gov.br/gestao/pt-br/assuntos/noticias",
    "tema": "Geral",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "207",
    "nome": "Ministério do Desenvolvimento e Assistência Social, Família e Combate à Fome",
    "link": "https://www.gov.br/mds/pt-br/assuntos/noticias",
    "tema": "Geral",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "208",
    "nome": "Ministério da Educação",
    "link": "https://www.gov.br/mec/pt-br/assuntos/noticias",
    "tema": "Geral",
    "statusInoreader": "Acesso Direto",
    "sigla": "MEC"
  },
  {
    "id": "209",
    "nome": "Ministério da Saúde",
    "link": "https://www.gov.br/saude/pt-br/assuntos/noticias",
    "tema": "Geral",
    "statusInoreader": "Acesso Direto",
    "sigla": "MS"
  },
  {
    "id": "210",
    "nome": "Ministério da Cultura",
    "link": "https://www.gov.br/cultura/pt-br/assuntos/noticias",
    "tema": "Geral",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "211",
    "nome": "Ministério do Turismo",
    "link": "https://www.gov.br/turismo/pt-br/assuntos/noticias",
    "tema": "Geral",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "212",
    "nome": "Ministério do Esporte",
    "link": "https://www.gov.br/esporte/pt-br/assuntos/noticias",
    "tema": "Geral",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "213",
    "nome": "Ministério das Mulheres",
    "link": "https://www.gov.br/mulheres/pt-br/assuntos/noticias",
    "tema": "Geral",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "214",
    "nome": "Ministério da Igualdade Racial",
    "link": "https://www.gov.br/igualdaderacial/pt-br/assuntos/noticias",
    "tema": "Geral",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "215",
    "nome": "Ministério dos Povos Indígenas",
    "link": "https://www.gov.br/povosindigenas/pt-br/assuntos/noticias",
    "tema": "Geral",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "216",
    "nome": "Ministério da Previdência Social",
    "link": "https://www.gov.br/previdencia/pt-br/assuntos/noticias",
    "tema": "Geral",
    "statusInoreader": "Acesso Direto"
  },
  {
    "id": "217",
    "nome": "Ministério das Relações Exteriores",
    "link": "https://www.gov.br/mre/pt-br/canais_atendimento/imprensa/notas-a-imprensa",
    "tema": "Geral",
    "statusInoreader": "Acesso Direto",
    "sigla": "Itamaraty"
  },
  {
    "id": "218",
    "nome": "Controladoria-Geral da União",
    "link": "https://www.gov.br/cgu/pt-br/assuntos/noticias",
    "tema": "Geral",
    "statusInoreader": "Acesso Direto",
    "sigla": "CGU"
  },
  {
    "id": "219",
    "nome": "Advocacia-Geral da União",
    "link": "https://www.gov.br/agu/pt-br/comunicacao/noticias",
    "tema": "Jurídico",
    "statusInoreader": "Acesso Direto",
    "sigla": "AGU"
  },
  {
    "id": "220",
    "nome": "Conselho Nacional de Justiça",
    "link": "https://www.cnj.jus.br/noticias/",
    "tema": "Jurídico",
    "statusInoreader": "Acesso Direto",
    "sigla": "CNJ"
  }
];
