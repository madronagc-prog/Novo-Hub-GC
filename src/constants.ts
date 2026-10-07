export const ADMIN_EMAILS = [
  "carnivalofdisgustblog@gmail.com",
  "gc.madronafialho@gmail.com",
  "andrezzasoares08@gmail.com",
  "amandacarvaleite@gmail.com",
  "madrona.gc@gmail.com"
];

// Editores autorizados especificamente para o Banco de Cláusulas (sem acesso administrativo às outras seções)
export const BANCO_CLAUSULAS_EDITORS = [
  "lucas.grilli@madronaadvogados.com.br"
];

export function canEditBancoDeClausulas(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return ADMIN_EMAILS.some(a => a.toLowerCase() === normalized) ||
         BANCO_CLAUSULAS_EDITORS.some(e => e.toLowerCase() === normalized);
}

// E-mails com permissão de EDIÇÃO no Dashboard de Indicadores (Gestão do Conhecimento & Comunicação)
export const DASHBOARD_INDICADORES_ADMINS = [
  "andrezza.soares@madronaadvogados.com.br",
  "deborah.lindau@madronaadvogados.com.br",
  "filipi.oliveira@madronaadvogados.com.br",
  "amanda.correa@madronaadvogados.com.br",
  "carnivalofdisgustblog@gmail.com",
  "gc.madronafialho@gmail.com",
  "andrezzasoares08@gmail.com",
  "amandacarvaleite@gmail.com",
  "madrona.gc@gmail.com",
  "clarissa.machado@madronaadvogados.com.br",
  "ione.moraes@madronaadvogados.com.br",
  "raquel.marques@madronaadvogados.com.br",
];

// E-mails com permissão de VISUALIZAÇÃO (somente leitura) no Dashboard de Indicadores
export const DASHBOARD_INDICADORES_VIEWERS = [
  "alice.dourado@madronaadvogados.com.br",
  "anderson.novais@madronaadvogados.com.br",
  "andre.devita@madronaadvogados.com.br",
  "andre.martins@madronaadvogados.com.br",
  "barbara.guimaraes@madronaadvogados.com.br",
  "barbara.monduzzi@madronaadvogados.com.br",
  "bernardo.santos@madronaadvogados.com.br",
  "clarissa.machado@madronaadvogados.com.br",
  "eduardo.coelho@madronaadvogados.com.br",
  "eduardo.evangelista@madronaadvogados.com.br",
  "eduardocoelho@coelhodalle.com.br",
  "fabio.alem@madronaadvogados.com.br",
  "fabio.rosas@madronaadvogados.com.br",
  "filipe.batich@madronaadvogados.com.br",
  "giovanna.felizati@madronaadvogados.com.br",
  "gustavo.magalhaes@madronaadvogados.com.br",
  "gustavo.maia@madronaadvogados.com.br",
  "gustavo.uchiyama@madronaadvogados.com.br",
  "ione.moraes@madronaadvogados.com.br",
  "joao.guizardi@madronaadvogados.com.br",
  "joao.toledo@madronaadvogados.com.br",
  "jose.barreto@madronaadvogados.com.br",
  "jose.senedesi@madronaadvogados.com.br",
  "kelma.collier@madronaadvogados.com.br",
  "kelmacollier@coelhodalle.com.br",
  "leandro.vieira@madronaadvogados.com.br",
  "leonardo.birchal@madronaadvogados.com.br",
  "leonardo.canabrava@madronaadvogados.com.br",
  "leonardo.dicola@madronaadvogados.com.br",
  "lucas.camargo@madronaadvogados.com.br",
  "lucas.spadano@madronaadvogados.com.br",
  "luciana.felisbino@madronaadvogados.com.br",
  "luciano.rocha@madronaadvogados.com.br",
  "luis.bellini@madronaadvogados.com.br",
  "luis.nagalli@madronaadvogados.com.br",
  "luiza.tangari@madronaadvogados.com.br",
  "madrona@madronaadvogados.com.br",
  "marcelo.cosac@madronaadvogados.com.br",
  "marcia.dias@madronaadvogados.com.br",
  "marciadias@coelhodalle.com.br",
  "marcos.ortiz@madronaadvogados.com.br",
  "marina.freire@madronaadvogados.com.br",
  "milena.mazzini@madronaadvogados.com.br",
  "mininel@madronaadvogados.com.br",
  "nair.saldanha@madronaadvogados.com.br",
  "patricia.alvarenga@madronaadvogados.com.br",
  "patricia.lima@madronaadvogados.com.br",
  "paulo.andrade@madronaadvogados.com.br",
  "pedro.magalhaes@madronaadvogados.com.br",
  "rafael.malheiro@madronaadvogados.com.br",
  "raquel.marques@madronaadvogados.com.br",
  "ricardo.dalle@madronaadvogados.com.br",
  "ricardodalle@coelhodalle.com.br",
  "roberto.pary@madronaadvogados.com.br",
  "roberto.salles@madronaadvogados.com.br",
  "rodrigo.barata@madronaadvogados.com.br",
  "rodrigo.machado@madronaadvogados.com.br",
  "ronaldo.gallo@madronaadvogados.com.br",
  "tatiana.olaya@madronaadvogados.com.br",
];

export function canAccessDashboardIndicadores(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return ADMIN_EMAILS.some(a => a.toLowerCase() === normalized) ||
         DASHBOARD_INDICADORES_ADMINS.some(a => a.toLowerCase() === normalized) ||
         DASHBOARD_INDICADORES_VIEWERS.some(v => v.toLowerCase() === normalized);
}

// Indica se o usuário tem permissão de EDIÇÃO (admin) no Dashboard de Indicadores
export function canEditDashboardIndicadores(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return ADMIN_EMAILS.some(a => a.toLowerCase() === normalized) ||
         DASHBOARD_INDICADORES_ADMINS.some(a => a.toLowerCase() === normalized);
}

// Papel do usuário no Dashboard de Indicadores: 'admin' (edição), 'viewer' (somente leitura) ou null (sem acesso)
export type DashboardIndicadoresRole = 'admin' | 'viewer' | null;

export function getDashboardIndicadoresRole(email: string | null | undefined): DashboardIndicadoresRole {
  if (!email) return null;
  const normalized = email.toLowerCase().trim();
  if (ADMIN_EMAILS.some(a => a.toLowerCase() === normalized)) return 'admin';
  if (DASHBOARD_INDICADORES_ADMINS.some(a => a.toLowerCase() === normalized)) return 'admin';
  if (DASHBOARD_INDICADORES_VIEWERS.some(v => v.toLowerCase() === normalized)) return 'viewer';
  return null;
}

// ============================================================================
// Permissões do Painel de Inovação
// ============================================================================
// Lista própria, independente do Dashboard de Indicadores.

// E-mails com permissão de EDIÇÃO no Painel de Inovação
export const PAINEL_INOVACAO_ADMINS = [
  "andrezza.soares@madronaadvogados.com.br",
  "deborah.lindau@madronaadvogados.com.br",
  "filipi.oliveira@madronaadvogados.com.br",
  "amanda.correa@madronaadvogados.com.br",
  "carnivalofdisgustblog@gmail.com",
  "gc.madronafialho@gmail.com",
  "andrezzasoares08@gmail.com",
  "amandacarvaleite@gmail.com",
  "madrona.gc@gmail.com",
  "clarissa.machado@madronaadvogados.com.br",
  "ione.moraes@madronaadvogados.com.br",
  "raquel.marques@madronaadvogados.com.br",
];

// E-mails com permissão de VISUALIZAÇÃO (somente leitura) no Painel de Inovação
export const PAINEL_INOVACAO_VIEWERS = [
  "mininel@madronaadvogados.com.br",
];

export function canAccessPainelInovacao(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return ADMIN_EMAILS.some(a => a.toLowerCase() === normalized) ||
         PAINEL_INOVACAO_ADMINS.some(a => a.toLowerCase() === normalized) ||
         PAINEL_INOVACAO_VIEWERS.some(v => v.toLowerCase() === normalized);
}

// Indica se o usuário tem permissão de EDIÇÃO (admin) no Painel de Inovação
export function canEditPainelInovacao(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return ADMIN_EMAILS.some(a => a.toLowerCase() === normalized) ||
         PAINEL_INOVACAO_ADMINS.some(a => a.toLowerCase() === normalized);
}

// Papel do usuário no Painel de Inovação: 'admin' (edição), 'viewer' (somente leitura) ou null (sem acesso)
export type PainelInovacaoRole = 'admin' | 'viewer' | null;

export function getPainelInovacaoRole(email: string | null | undefined): PainelInovacaoRole {
  if (!email) return null;
  const normalized = email.toLowerCase().trim();
  if (ADMIN_EMAILS.some(a => a.toLowerCase() === normalized)) return 'admin';
  if (PAINEL_INOVACAO_ADMINS.some(a => a.toLowerCase() === normalized)) return 'admin';
  if (PAINEL_INOVACAO_VIEWERS.some(v => v.toLowerCase() === normalized)) return 'viewer';
  return null;
}
