import React, { useMemo } from 'react';
import { acadMadronaData } from '../../data/acad-madrona.data';
import { acadTreinamentoIMData } from '../../data/acad-treinamento-im.data';
import { normalizarMes } from '../../utils/padronizacao';
import {
  GraduationCap,
  Users,
  Monitor,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  Sparkles,
  UserCheck
} from 'lucide-react';

interface AcademiaResumoViewProps {
  selectedMonth?: string;
  selectedUn?: string;
}

// Observação: nem Academia Madrona nem Treinamento iM têm campo de UN na base
// (são sessões/contagens gerais, não divididas por área). selectedUn é recebido
// para manter o padrão das demais sub-abas, mas não é aplicado como filtro aqui.

const MESES_ANALISE = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];

export default function AcademiaResumoView({ selectedMonth = 'Todos os meses' }: AcademiaResumoViewProps) {
  const isAllMonths = selectedMonth === 'Todos os meses';

  // 1. Filtragem por mês para os cards
  const filteredAM = useMemo(() => {
    if (isAllMonths) return acadMadronaData;
    return acadMadronaData.filter((d) => normalizarMes(d.mes) === selectedMonth);
  }, [isAllMonths, selectedMonth]);

  const filteredIM = useMemo(() => {
    if (isAllMonths) return acadTreinamentoIMData;
    return acadTreinamentoIMData.filter((d) => normalizarMes(d.mes) === selectedMonth);
  }, [isAllMonths, selectedMonth]);

  // Card 1: Sessões Academia Madrona
  const sessoesAM = filteredAM.length;

  // Card 2: Total de participantes na Academia Madrona
  const participantesAM = useMemo(() => {
    return filteredAM.reduce((acc, d) => acc + (d.participantes || 0), 0);
  }, [filteredAM]);

  // Card 3: Sessões Treinamento iM
  const sessoesIM = filteredIM.length;

  // Card 4: Total de participantes no Treinamento iM (ignorando nulls)
  const participantesIM = useMemo(() => {
    return filteredIM.reduce((acc, d) => {
      const p = typeof d.participantes === 'number' && !isNaN(d.participantes) ? d.participantes : 0;
      return acc + p;
    }, 0);
  }, [filteredIM]);

  // 2. Gráfico de Evolução Mensal: Número de Sessões (Academia Madrona + Treinamento iM somados)
  const evolucaoSessoes = useMemo(() => {
    return MESES_ANALISE.map((m) => {
      const amSessoes = acadMadronaData.filter((d) => normalizarMes(d.mes) === m);
      const imSessoes = acadTreinamentoIMData.filter((d) => normalizarMes(d.mes) === m);
      const totalSessoes = amSessoes.length + imSessoes.length;

      return {
        mes: m,
        amCount: amSessoes.length,
        imCount: imSessoes.length,
        totalSessoes
      };
    });
  }, []);

  const maxSessoesMes = useMemo(() => {
    const maxVal = Math.max(...evolucaoSessoes.map((e) => e.totalSessoes));
    return maxVal > 0 ? maxVal : 1;
  }, [evolucaoSessoes]);

  // 3. Gráfico Comparando Participantes vs. Convidados ao longo dos meses
  const comparativoPublico = useMemo(() => {
    return MESES_ANALISE.map((m) => {
      const amMes = acadMadronaData.filter((d) => normalizarMes(d.mes) === m);
      const imMes = acadTreinamentoIMData.filter((d) => normalizarMes(d.mes) === m);

      const amPart = amMes.reduce((acc, d) => acc + (d.participantes || 0), 0);
      const amConv = amMes.reduce((acc, d) => acc + (d.convidados || 0), 0);

      const imPart = imMes.reduce((acc, d) => {
        return acc + (typeof d.participantes === 'number' ? d.participantes : 0);
      }, 0);
      const imConv = imMes.reduce((acc, d) => acc + (d.convidados || 0), 0);

      const totalPart = amPart + imPart;
      const totalConv = amConv + imConv;
      const taxaAdesao = totalConv > 0 ? (totalPart / totalConv) * 100 : 0;

      return {
        mes: m,
        participantes: totalPart,
        convidados: totalConv,
        taxaAdesao
      };
    });
  }, []);

  const maxConvidados = useMemo(() => {
    const maxVal = Math.max(...comparativoPublico.map((c) => c.convidados));
    return maxVal > 0 ? maxVal : 1;
  }, [comparativoPublico]);

  const totalGeralSessoes = acadMadronaData.length + acadTreinamentoIMData.length;
  const totalGeralParticipantes = participantesAM + participantesIM;

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. CARDS DE RESUMO (TOPO)                                            */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Sessões Academia Madrona */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 border border-blue-100">
            <GraduationCap size={24} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
              Sessões Academia Madrona
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {sessoesAM}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5 truncate">
              {isAllMonths ? 'treinamentos e aulas técnicas' : `sessões em ${selectedMonth}`}
            </div>
          </div>
        </div>

        {/* Card 2: Total de Participantes na Academia Madrona */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-100">
            <Users size={24} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
              Participantes Academia
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-purple-900 mt-0.5">
              {participantesAM.toLocaleString('pt-BR')}
            </div>
            <div className="text-[11px] text-purple-700 font-medium mt-0.5 truncate">
              presença confirmada nas sessões
            </div>
          </div>
        </div>

        {/* Card 3: Sessões Treinamento iM */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0 border border-teal-100">
            <Monitor size={24} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
              Sessões Treinamento iM
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-teal-900 mt-0.5">
              {sessoesIM}
            </div>
            <div className="text-[11px] text-teal-700 font-medium mt-0.5 truncate">
              {isAllMonths ? 'capacitações da plataforma' : `sessões em ${selectedMonth}`}
            </div>
          </div>
        </div>

        {/* Card 4: Total de Participantes no Treinamento iM */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
            <UserCheck size={24} />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider truncate">
              Participantes Treinamento iM
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-700 mt-0.5">
              {participantesIM.toLocaleString('pt-BR')}
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-0.5 truncate">
              colaboradores capacitados em iM
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. GRÁFICOS ANALÍTICOS (EVOLUÇÃO DE SESSÕES + PARTICIPANTES VS CONVIDADOS) */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico 1: Evolução Mensal de Sessões (Janeiro a Dezembro) */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-serif font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
                  <TrendingUp size={18} className="text-brand-blue" />
                  <span>Evolução de Sessões</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Sessões somadas de Academia Madrona e Treinamento iManage
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5 font-medium text-gray-700">
                  <span className="w-3 h-3 rounded-full bg-brand-blue"></span>
                  <span>Academia</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-gray-700">
                  <span className="w-3 h-3 rounded-full bg-teal-500"></span>
                  <span>iManage</span>
                </div>
              </div>
            </div>

            {/* Grid dos 12 meses */}
            <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-6 gap-2 my-4">
              {evolucaoSessoes.map((item) => {
                const isSelected = selectedMonth === item.mes;
                const heightPct = Math.max(18, Math.round((item.totalSessoes / maxSessoesMes) * 100));

                return (
                  <div
                    key={item.mes}
                    className={`rounded-xl border p-2 flex flex-col justify-between text-center transition-all ${
                      isSelected
                        ? 'border-brand-blue ring-2 ring-brand-blue/20 bg-blue-50/60 shadow-xs'
                        : 'border-gray-200/70 bg-gray-50/60 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-navy truncate">
                      {item.mes.slice(0, 3)}
                    </span>

                    <div className="my-2 flex flex-col items-center justify-end h-28">
                      <span className="text-xs font-serif font-bold text-gray-900 mb-1">
                        {item.totalSessoes}
                      </span>
                      <div className="w-6 bg-gray-200 rounded-t-md h-20 flex items-end overflow-hidden">
                        <div
                          className={`w-full rounded-t-md transition-all duration-700 ${
                            isSelected
                              ? 'bg-brand-navy'
                              : 'bg-gradient-to-t from-brand-blue to-teal-400'
                          }`}
                          style={{ height: `${heightPct}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="text-[9px] text-gray-500 border-t border-gray-200/60 pt-1 leading-tight">
                      <span>{item.amCount} AM</span>
                      <br />
                      <span className="text-teal-600 font-semibold">+{item.imCount} iM</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/60 text-xs text-gray-600 flex items-center justify-between">
            <span>Total de sessões acumuladas:</span>
            <strong className="text-brand-navy font-semibold">
              {totalGeralSessoes} sessões ({acadMadronaData.length} Academia + {acadTreinamentoIMData.length} iM)
            </strong>
          </div>
        </div>

        {/* Gráfico 2: Participantes vs. Convidados ao longo dos meses */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-serif font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
                  <BarChart3 size={18} className="text-brand-blue" />
                  <span>Participantes vs. Convidados</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Aderência e taxa de presença conjunta mês a mês (Jan a Set)
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5 font-medium text-gray-700">
                  <span className="w-3 h-3 rounded-full bg-slate-300"></span>
                  <span>Convidados</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-gray-700">
                  <span className="w-3 h-3 rounded-full bg-purple-600"></span>
                  <span>Participantes</span>
                </div>
              </div>
            </div>

            {/* Grid dos 12 meses com colunas comparativas */}
            <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-6 gap-2 my-4">
              {comparativoPublico.map((item) => {
                const isSelected = selectedMonth === item.mes;
                const convHeight = Math.max(12, Math.round((item.convidados / maxConvidados) * 100));
                const partHeight = Math.max(12, Math.round((item.participantes / maxConvidados) * 100));

                return (
                  <div
                    key={item.mes}
                    className={`rounded-xl border p-1.5 flex flex-col justify-between text-center transition-all ${
                      isSelected
                        ? 'border-brand-blue ring-2 ring-brand-blue/20 bg-blue-50/60 shadow-xs'
                        : 'border-gray-200/70 bg-gray-50/60 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-navy truncate">
                      {item.mes.slice(0, 3)}
                    </span>

                    {/* Barras agrupadas lado a lado */}
                    <div className="my-2 flex items-end justify-center gap-1 h-28">
                      {/* Barra Convidados */}
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] text-gray-400 mb-0.5">
                          {item.convidados}
                        </span>
                        <div className="w-3 bg-gray-200 rounded-t-sm h-20 flex items-end overflow-hidden">
                          <div
                            className="w-full bg-slate-400 rounded-t-sm transition-all duration-700"
                            style={{ height: `${convHeight}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Barra Participantes */}
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] font-bold text-purple-700 mb-0.5">
                          {item.participantes}
                        </span>
                        <div className="w-3 bg-gray-200 rounded-t-sm h-20 flex items-end overflow-hidden">
                          <div
                            className={`w-full rounded-t-sm transition-all duration-700 ${
                              isSelected ? 'bg-brand-navy' : 'bg-purple-600'
                            }`}
                            style={{ height: `${partHeight}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="text-[9px] font-bold text-emerald-700 border-t border-gray-200/60 pt-1">
                      {item.convidados > 0 ? `${item.taxaAdesao.toFixed(0)}%` : '--'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/60 text-xs text-gray-600 flex items-center justify-between">
            <span>Adesão média geral do período:</span>
            <strong className="text-purple-900 font-semibold">
              {((comparativoPublico.reduce((acc, c) => acc + c.participantes, 0) /
                (comparativoPublico.reduce((acc, c) => acc + c.convidados, 0) || 1)) *
                100).toFixed(1)}% de presença confirmada
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
