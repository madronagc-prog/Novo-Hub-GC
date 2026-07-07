export interface PrecedenteSTJ {
  id: string;
  tema: string;
  situacao: string;
  orgaoJulgador: string;
  ramoDireito: string;
  questaoSubmetida: string;
  teseFirmada: string;
  anotacoesNUGEPNAC: string;
  delimitacaoJulgado: string;
  repercussaoGeral: string;
  processo: {
    numero: string;
    numeroRegistro: string;
    tribunalOrigem: string;
    relator: string;
    afetacao: string;
    julgadoEm: string;
    acordaoPublicadoEm: string;
    transitoEmJulgado: string;
    link: string;
  };
  updatedAt: string;
}

export const initialPrecedentes: PrecedenteSTJ[] = [];

