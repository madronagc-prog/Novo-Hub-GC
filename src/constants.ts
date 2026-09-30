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
