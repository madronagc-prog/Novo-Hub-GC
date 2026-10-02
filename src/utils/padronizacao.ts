// Mapeamentos de padronização (Base UNs e Posição - SE/ENTÃO)
// Use estas funções para normalizar valores vindos de qualquer aba da planilha
// antes de agregar ou exibir no dashboard.

export const MAPA_UN: Record<string, string> = {
  "Administrativo": "ADM",
  "Business Development": "BD",
  "Comunicação Corporativa": "COM",
  "Gente e Gestão - DHO": "GG - DHO",
  "Gente e Gestão - Facilites": "GG - Facilities",
  "Gente e Gestão - Facilities": "GG - Facilities",
  "Gente e Gestão - Secretárias": "GG - Secretárias",
  "Gestão de Conhecimento": "GC",
  "Gestão do Conhecimento": "GC",
  "Planejamento Estratégico e Finanças": "PEF",
  "AN Sportainment e Entretenimento": "AN Sportainment e Entretenimento",
  "UN Ambiental": "UN Ambiental",
  "UN Bancário": "UN Bancário",
  "UN Compliance/White Collar": "UN WC&C",
  "UN White Collar & Compliance": "UN WC&C",
  "UN Concorrencial": "UN Concorrencial",
  "UN Contencioso": "UN Contencioso",
  "UN Corporativo": "UN Corporativo",
  "UN Corporativa": "UN Corporativo",
  "UN Digital, LGPD e Propriedade Intelectual": "UN Digital, Comex e PI",
  "UN Financeiro & Mercado | Bancário": "UN Mercap",
  "UN Financeiro, Bancário & Mercado": "UN Mercap",
  "UN Imobiliário": "UN Imobiliário",
  "UN Imobiliária": "UN Imobiliário",
  "UN Infraestrutura": "UN Infraestrutura",
  "UN Infraestrutura e Direito Público": "UN Infraestrutura",
  "UN Seguros Resseguros e Previdência Privada": "UN Seguros",
  "UN Trabalhista e Sindical": "UN Trabalhista",
  "UN Tributário": "UN Tributário",
  "UN Tributária": "UN Tributário",
  "UN Wealth": "UN Wealth",
};

export const MAPA_POSICAO: Record<string, string> = {
  "Administrativo": "ADM",
  "Advogado Junior 1": "Júnior",
  "Advogado Junior 2": "Júnior",
  "Advogado Junior 3": "Júnior",
  "Advogado Junior 4": "Júnior",
  "Advogado Pleno 1": "Pleno",
  "Advogado Pleno 2": "Pleno",
  "Advogado Pleno 3": "Pleno",
  "Advogado Pleno 4": "Pleno",
  "Advogado Senior 1": "Sênior",
  "Advogado Senior 2": "Sênior",
  "Advogado Senior 3": "Sênior",
  "Advogado Senior 4": "Sênior",
  "Advogado Senior 5": "Sênior",
  "Advogado SR 4 (Programa Rota)": "Sênior",
  "Analista de Business Development": "Analista",
  "Analista de Comunicação Jr": "Analista",
  "Analista de Controladoria": "Analista",
  "Analista de DH I": "Analista",
  "Analista de Diretoria": "Analista",
  "Analista de Facilities JR": "Analista",
  "Analista de GC": "Analista",
  "Analista de Gente e Gestão JR": "Analista",
  "Analista de Marketing": "Analista",
  "Analista de Qualidade": "Analista",
  "Analista de TI": "Analista",
  "Analista Financeiro": "Analista",
  "Analista Financeiro Junior": "Analista",
  "Analista Financeiro Pleno": "Analista",
  "Analista Jurídico": "Analista",
  "Assistente Administrativo": "Assistente",
  "Assistente de Business Development": "Assistente",
  "Assistente de Gente e Gestão": "Assistente",
  "Assistente de Gestão do Conhecimento": "Assistente",
  "Assistente Financeiro": "Assistente",
  "Assistente Jurídico": "Assistente",
  "Assistente Planejamento Estratégico e Financeiro": "Assistente",
  "Auxiliar Admisnistrativo": "Auxiliar",
  "Auxiliar de Limpeza": "Auxiliar",
  "Auxiliar de Serviços Gerais": "Auxiliar",
  "Bibliotecário": "Bibliotecário",
  "Consultor Senior": "Consultor",
  "Coordenado(a) Business Development": "Coordenador(a)",
  "Coordenador(a) de Comunicação Corporativa": "Coordenador(a)",
  "Coordenador(a) de Facilities": "Coordenador(a)",
  "Coordenador(a) de Gente e Gestão": "Coordenador(a)",
  "Coordenador(a) Gestão do Conhecimento": "Coordenador(a)",
  "Copeiro(a)": "Copeiro(a)",
  "Diretor Financeiro": "Diretor PEF",
  "Diretor(a) de Gente e Gestão": "Diretor(a) de GG",
  "Estagiário 3° ano": "Estagiário(a)",
  "Estagiário 4° ano": "Estagiário(a)",
  "Estagiário 5° ano": "Estagiário(a)",
  "Gerente Adm Financeiro": "Gerente",
  "Gerente de Gente e Gestão": "Gerente",
  "Gerente de Gestão do Conhecimento": "Gerente",
  "Gerente de Planejamento Estratégico": "Gerente",
  "Jovem Aprendiz": "Jovem Aprendiz",
  "Of Counsel": "Of Counsel",
  "Paralegal": "Paralegal",
  "Recepcionista": "Recepcionista",
  "Recepcionista Bilingue": "Recepcionista",
  "Secretária": "Secretária",
  "Secretária Bilingue": "Secretária",
  "Sócio Capital": "Sócio(a)",
  "Sócio Receita": "Sócio(a)",
};

export const MAPA_MES: Record<string, string> = {
  "JAN": "Janeiro",
  "FEV": "Fevereiro",
  "MAR": "Março",
  "ABR": "Abril",
  "MAI": "Maio",
  "JUN": "Junho",
  "JUL": "Julho",
  "AGO": "Agosto",
  "SET": "Setembro",
  "OUT": "Outubro",
  "NOV": "Novembro",
  "DEZ": "Dezembro",
  "Jan": "Janeiro",
  "Fev": "Fevereiro",
  "Mar": "Março",
  "Abr": "Abril",
  "Mai": "Maio",
  "Jun": "Junho",
  "Jul": "Julho",
  "Ago": "Agosto",
  "Set": "Setembro",
  "Out": "Outubro",
  "Nov": "Novembro",
  "Dez": "Dezembro",
};

export function normalizarUN(valor: string | undefined | null): string {
  if (!valor) return '';
  const trimmed = valor.trim();
  return MAPA_UN[trimmed] ?? trimmed;
}

export function normalizarPosicao(valor: string | undefined | null): string {
  if (!valor) return '';
  const trimmed = valor.trim();
  return MAPA_POSICAO[trimmed] ?? trimmed;
}

export function normalizarMes(valor: string | undefined | null): string {
  if (!valor) return '';
  const trimmed = valor.trim();
  return MAPA_MES[trimmed] ?? trimmed;
}
