export interface TreinamentoIMRegistro {
  mes: string;
  participantes: number | null;
  convidados: number;
}

export const acadTreinamentoIMData: TreinamentoIMRegistro[] = [
  { mes: "Janeiro", participantes: 2, convidados: 2 },
  { mes: "Fevereiro", participantes: 2, convidados: 2 },
  { mes: "Março", participantes: 4, convidados: 3 },
  { mes: "Abril", participantes: 2, convidados: 2 },
  { mes: "Maio", participantes: 2, convidados: 2 },
  { mes: "Junho", participantes: 1, convidados: 0 },
  { mes: "Junho", participantes: 1, convidados: 1 },
  { mes: "Julho", participantes: 1, convidados: 1 },
  { mes: "Julho", participantes: 1, convidados: 1 },
  { mes: "Julho", participantes: 1, convidados: 1 },
  { mes: "Agosto", participantes: 41, convidados: 230 },
  { mes: "Agosto", participantes: 20, convidados: 230 },
  { mes: "Setembro", participantes: 39, convidados: 39 }
];
