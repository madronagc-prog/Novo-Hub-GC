import React, { useMemo, useState } from 'react';
import {
  SagaRegistro,
  ferrSagaData,
  SAGA_VALOR_UNITARIO
} from '../../data/ferr-saga.data';
import { normalizarUN, normalizarPosicao } from '../../utils/padronizacao';
import {
  Wrench,
  DollarSign,
  Users,
  Send,
  FolderGit2,
  Calendar,
  Award,
  Building,
  Briefcase,
  Search,
  Download,
  Info,
  Shield,
  Layers,
  BarChart3,
  TrendingUp,
  FileCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface FerrSagaViewProps {
  selectedUn: string;
}

export default function FerrSagaView({ selectedUn }: FerrSagaViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosicao, setSelectedPosicao] = useState('todas');
  const [rankingTab, setRankingTab] = useState<'enviado' | 'dias'>('enviado');

  // Base normalizada
  const normalizedData = useMemo(() => {
    return ferrSagaData.map((d) => {
      // Cálculo do período proporcional em meses (baseline de 8 meses: Jan a Ago 2026)
      const mesesEfetivos = Math.max(1, 8 + d.meses_proporcionais);
      const custoAcumulado = mesesEfetivos * SAGA_VALOR_UNITARIO;

      return {
        ...d,
        un: normalizarUN(d.un),
        posicao: normalizarPosicao(d.posicao),
        mesesEfetivos,
        custoAcumulado
      };
    });
  }, []);

  // Filtro de UN (do seletor superior da página)
  const filteredByUn = useMemo(() => {
    if (selectedUn === 'Todas as UNs') return normalizedData;
    return normalizedData.filter((d) => d.un === selectedUn);
  }, [normalizedData, selectedUn]);

  // Opções de Posição para dropdown
  const posicaoOptions = useMemo(() => {
    const set = new Set<string>();
    normalizedData.forEach((d) => {
      if (d.posicao && d.posicao.trim()) set.add(d.posicao.trim());
    });
    return Array.from(set).sort();
  }, [normalizedData]);

  // Filtros combinados da tabela (posição + busca; UN já vem de filteredByUn)
  const displayRecords = useMemo(() => {
    return filteredByUn.filter((d) => {
      if (selectedPosicao !== 'todas' && d.posicao !== selectedPosicao) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        return (
          d.nome.toLowerCase().includes(term) ||
          d.un.toLowerCase().includes(term) ||
          d.posicao.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [filteredByUn, selectedPosicao, searchTerm]);

  // Totais do Resumo (já respeitando o filtro de UN)
  const totalLicencas = filteredByUn.length;
  const totalEnviado = useMemo(() => filteredByUn.reduce((acc, d) => acc + d.enviado, 0), [filteredByUn]);
  const totalProjetos = useMemo(() => filteredByUn.reduce((acc, d) => acc + d.projetos, 0), [filteredByUn]);
  const totalProjetosComp = useMemo(
    () => filteredByUn.reduce((acc, d) => acc + (d.projetos_comp || 0), 0),
    [filteredByUn]
  );

  // Custo Mensal Atual (Headcount pleno de licenças ativas no filtro)
  const custoMensalAtual = totalLicencas * SAGA_VALOR_UNITARIO;

  // Custo Acumulado Proporcional no período (Jan a Ago)
  const custoTotalProporcional = useMemo(
    () => filteredByUn.reduce((acc, d) => acc + d.custoAcumulado, 0),
    [filteredByUn]
  );

  // Agrupamento por UN
  const statsPorUn = useMemo(() => {
    const map: Record<string, { licencas: number; enviado: number; projetos: number }> = {};
    filteredByUn.forEach((d) => {
      if (!map[d.un]) {
        map[d.un] = { licencas: 0, enviado: 0, projetos: 0 };
      }
      map[d.un].licencas += 1;
      map[d.un].enviado += d.enviado;
      map[d.un].projetos += d.projetos;
    });

    return Object.entries(map)
      .map(([un, s]) => ({
        un,
        licencas: s.licencas,
        enviado: s.enviado,
        projetos: s.projetos,
        pctEnviado: totalEnviado > 0 ? (s.enviado / totalEnviado) * 100 : 0
      }))
      .sort((a, b) => b.enviado - a.enviado);
  }, [filteredByUn, totalEnviado]);

  const maxUnEnviado = statsPorUn[0]?.enviado || 1;

  // Agrupamento por Posição
  const statsPorPosicao = useMemo(() => {
    const map: Record<string, { licencas: number; enviado: number; dias_de_uso: number }> = {};
    filteredByUn.forEach((d) => {
      if (!map[d.posicao]) {
        map[d.posicao] = { licencas: 0, enviado: 0, dias_de_uso: 0 };
      }
      map[d.posicao].licencas += 1;
      map[d.posicao].enviado += d.enviado;
      map[d.posicao].dias_de_uso += d.dias_de_uso;
    });

    return Object.entries(map)
      .map(([posicao, s]) => ({
        posicao,
        licencas: s.licencas,
        enviado: s.enviado,
        mediaDias: s.licencas > 0 ? Math.round(s.dias_de_uso / s.licencas) : 0,
        pctEnviado: totalEnviado > 0 ? (s.enviado / totalEnviado) * 100 : 0
      }))
      .sort((a, b) => b.enviado - a.enviado);
  }, [filteredByUn, totalEnviado]);

  const maxPosicaoEnviado = statsPorPosicao[0]?.enviado || 1;

  // Rankings Top 15
  const top15PorEnviado = useMemo(() => {
    return [...filteredByUn].sort((a, b) => b.enviado - a.enviado).slice(0, 15);
  }, [filteredByUn]);

  const top15PorDias = useMemo(() => {
    return [...filteredByUn].sort((a, b) => b.dias_de_uso - a.dias_de_uso).slice(0, 15);
  }, [filteredByUn]);

  const maxTopEnviado = top15PorEnviado[0]?.enviado || 1;
  const maxTopDias = top15PorDias[0]?.dias_de_uso || 1;

  // Exportar Excel
  const handleExportExcel = () => {
    const exportData = displayRecords.map((d, index) => ({
      '#': index + 1,
      'Colaborador': d.nome,
      'Posição': d.posicao,
      'UN': d.un,
      'Criado': d.criado,
      'Dias de Uso': d.dias_de_uso,
      'Enviado (Peças/Docs)': d.enviado,
      'Projetos': d.projetos,
      'Projetos Compartilhados': d.projetos_comp !== null ? d.projetos_comp : 'Sem dados',
      'Média Dias Entre Sessões': d.media_dia_entre_sessoes !== null ? d.media_dia_entre_sessoes : 'Sem dados',
      'Meses Proporcionais': d.meses_proporcionais
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Saga');
    XLSX.writeFile(wb, 'Saga_Indicadores.xlsx');
  };

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. CARDS DE RESUMO (TOTAIS DO SAGA E CUSTO ESTIMADO)                 */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Licenças Ativas & Custo Mensal */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 border border-blue-100">
            <Users size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Licenças Ativas Saga
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {totalLicencas} licenças
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              R$ 450/mês cada • <strong>{custoMensalAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/mês</strong>
            </div>
          </div>
        </div>

        {/* Custo Total Acumulado Proporcional */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
            <DollarSign size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <span>Custo Acumulado Estimado</span>
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-700 mt-0.5">
              {custoTotalProporcional.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5" title="Cálculo proporcional: (8 meses base + meses proporcionais) × R$ 450,00 por colaborador">
              Ajustado pelos meses proporcionais
            </div>
          </div>
        </div>

        {/* Documentos / Peças Enviadas */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-100">
            <Send size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Peças / Documentos Gerados
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-purple-900 mt-0.5">
              {totalEnviado.toLocaleString('pt-BR')}
            </div>
            <div className="text-[11px] text-purple-700 font-medium mt-0.5">
              Soma total de "enviado"
            </div>
          </div>
        </div>

        {/* Projetos & Projetos Compartilhados */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100">
            <FolderGit2 size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Projetos na Plataforma
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {totalProjetos} projetos
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-0.5">
              + {totalProjetosComp} projetos compartilhados
            </div>
          </div>
        </div>
      </div>

      {/* Box explicativo da conta do custo proporcional */}
      <div className="bg-blue-50/60 border border-blue-200/70 rounded-2xl p-4 text-xs text-blue-900 flex items-start gap-3">
        <Info size={18} className="text-brand-blue flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-brand-navy">Como o Custo Estimado é calculado:</strong> O valor unitário mensal por licença ativa é de <strong>R$ 450,00</strong>.
          Para os 49 usuários ativos hoje, o investimento fixo é de <strong>R$ 22.050,00/mês</strong>.
          No acumulado do contrato de 2026, a coluna <em>meses_proporcionais</em> reflete o momento de ativação de cada colaborador em relação à baseline do ano:
          usuários veteranos (desde dez/2025) possuem <code>+4 meses</code> (total de 12 meses pagos), enquanto colaboradores adicionados mais tarde (julho/agosto) possuem valores negativos (ex.: <code>-3</code> ou <code>-4 meses</code>), pagando proporcionalmente apenas pelos meses de vigência ativa.
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. AGRUPAMENTO POR UN E POR POSIÇÃO                                  */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel por UN */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2">
                  <Building size={17} className="text-brand-blue" />
                  <span>Utilização por UN</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Volume de peças geradas e licenças alocadas por prática
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
              {statsPorUn.map((item) => {
                const barWidth = (item.enviado / maxUnEnviado) * 100;

                return (
                  <div
                    key={item.un}
                    className="bg-gray-50/70 p-3 rounded-xl border border-gray-200/60 hover:bg-gray-100/70 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                      <span className="font-semibold text-gray-900 truncate">
                        {item.un}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-bold text-purple-900">
                          {item.enviado.toLocaleString('pt-BR')} peças
                        </span>
                        <span className="text-[11px] text-gray-500 bg-white border border-gray-200 px-1.5 py-0.5 rounded font-medium">
                          {item.pctEnviado.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200/80 rounded-full h-2 overflow-hidden mb-1.5">
                      <div
                        className="bg-purple-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      <span>Licenças: <strong>{item.licencas}</strong></span>
                      <span>Projetos: <strong>{item.projetos}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Painel por Posição */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2">
                  <Briefcase size={17} className="text-brand-blue" />
                  <span>Utilização por Posição / Cargo</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Adoção do Saga entre Sócios, Sêniores, Plenos, Juniores, etc.
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
              {statsPorPosicao.map((item) => {
                const barWidth = (item.enviado / maxPosicaoEnviado) * 100;

                return (
                  <div
                    key={item.posicao}
                    className="bg-gray-50/70 p-3 rounded-xl border border-gray-200/60 hover:bg-gray-100/70 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                      <span className="font-semibold text-gray-900 truncate">
                        {item.posicao}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-bold text-brand-navy">
                          {item.enviado.toLocaleString('pt-BR')} peças
                        </span>
                        <span className="text-[11px] text-gray-500 bg-white border border-gray-200 px-1.5 py-0.5 rounded font-medium">
                          {item.pctEnviado.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200/80 rounded-full h-2 overflow-hidden mb-1.5">
                      <div
                        className="bg-brand-blue h-full rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      <span>Licenças: <strong>{item.licencas}</strong></span>
                      <span>Média de dias de uso: <strong>{item.mediaDias} dias</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. RANKINGS TOP 15: POR ENVIADO (VOLUME) E POR DIAS DE USO          */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
              <Award size={18} className="text-brand-blue" />
              <span>Rankings Top 15 Usuários Saga</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Identificação dos colaboradores champions em volume de produção e frequência de login
            </p>
          </div>

          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => setRankingTab('enviado')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                rankingTab === 'enviado'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Por Volume (Enviado)
            </button>
            <button
              onClick={() => setRankingTab('dias')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                rankingTab === 'dias'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Por Frequência (Dias de Uso)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {(rankingTab === 'enviado' ? top15PorEnviado : top15PorDias).map((user, idx) => {
            const metricValue = rankingTab === 'enviado' ? user.enviado : user.dias_de_uso;
            const maxVal = rankingTab === 'enviado' ? maxTopEnviado : maxTopDias;
            const barWidth = (metricValue / maxVal) * 100;
            const isTop3 = idx < 3;

            return (
              <div
                key={user.nome}
                className="bg-gray-50/70 p-3.5 rounded-xl border border-gray-200/60 hover:bg-gray-100/70 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] flex-shrink-0 ${
                          idx === 0
                            ? 'bg-amber-400 text-white'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-800'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-gray-900 text-xs sm:text-sm truncate">
                        {user.nome}
                      </span>
                    </div>

                    <span className="text-[10px] bg-blue-50 text-brand-blue border border-blue-100 px-2 py-0.5 rounded font-medium flex-shrink-0">
                      {user.posicao}
                    </span>
                  </div>

                  <div className="text-[11px] text-gray-500 mb-2 truncate">
                    {user.un} • {user.projetos} projetos
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600 font-medium">
                      {rankingTab === 'enviado' ? `${user.dias_de_uso} dias de uso` : `${user.enviado} peças geradas`}
                    </span>
                    <span className="font-bold text-brand-navy font-serif">
                      {rankingTab === 'enviado' ? `${user.enviado} peças` : `${user.dias_de_uso} dias`}
                    </span>
                  </div>

                  <div className="w-full bg-gray-200/80 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isTop3 ? 'bg-brand-blue' : 'bg-slate-600'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. TABELA COMPLETA COM CADA REGISTRO                                 */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Header da Tabela com Filtros */}
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-[#fafbfc]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                <Wrench size={18} className="text-brand-blue" />
                <span>Licenças Saga</span>
                <span className="text-xs font-sans font-normal text-gray-500">
                  ({displayRecords.length} de {filteredByUn.length} colaboradores)
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                <Shield size={12} className="text-amber-600" />
                <span>Dados de uso individual e governança de tecnologia</span>
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Filtro por Posição */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-500 font-medium">Posição:</span>
                <select
                  value={selectedPosicao}
                  onChange={(e) => setSelectedPosicao(e.target.value)}
                  className="bg-white border border-gray-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue text-gray-800 font-medium max-w-[170px]"
                >
                  <option value="todas">Todas as Posições</option>
                  {posicaoOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Busca por Nome */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar colaborador..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border border-gray-200 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent text-gray-800 placeholder-gray-400 w-44 sm:w-56"
                />
              </div>

              {/* Botão Exportar Excel */}
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-xl transition-all shadow-2xs hover:border-gray-300 cursor-pointer"
                title="Exportar base completa do Saga para Excel"
              >
                <Download size={14} className="text-emerald-600" />
                <span>Exportar Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabela de Dados */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-gray-200/80 bg-gray-50/70 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4 min-w-[200px]">Colaborador</th>
                <th className="py-3 px-4 w-32">Posição</th>
                <th className="py-3 px-4 w-44">UN (Padronizada)</th>
                <th className="py-3 px-4 w-28">Criado em</th>
                <th className="py-3 px-4 text-center w-28">Dias de Uso</th>
                <th className="py-3 px-4 text-center w-32 font-bold text-purple-900">Enviado (Peças)</th>
                <th className="py-3 px-4 text-center w-24">Projetos</th>
                <th className="py-3 px-4 text-center w-28">Proj. Comp.</th>
                <th className="py-3 px-4 text-center w-32">Média Dias / Sessão</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-400">
                    Nenhum colaborador encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                displayRecords.map((item, idx) => {
                  return (
                    <tr
                      key={`${item.nome}-${idx}`}
                      className="hover:bg-blue-50/20 transition-colors"
                    >
                      {/* Numeração */}
                      <td className="py-3.5 px-4 text-center text-gray-400 text-xs">
                        {idx + 1}
                      </td>

                      {/* Nome */}
                      <td className="py-3.5 px-4 font-semibold text-gray-900 whitespace-nowrap">
                        {item.nome}
                      </td>

                      {/* Posição */}
                      <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-brand-blue border border-blue-100 font-medium">
                          {item.posicao}
                        </span>
                      </td>

                      {/* UN */}
                      <td className="py-3.5 px-4 text-gray-700 text-xs whitespace-nowrap">
                        {item.un}
                      </td>

                      {/* Criado em */}
                      <td className="py-3.5 px-4 font-mono text-gray-500 text-xs whitespace-nowrap">
                        {item.criado}
                      </td>

                      {/* Dias de Uso */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap font-medium text-gray-900">
                        {item.dias_de_uso} dias
                      </td>

                      {/* Enviado */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap font-serif font-bold text-purple-900 text-sm">
                        {item.enviado.toLocaleString('pt-BR')}
                      </td>

                      {/* Projetos */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap font-medium text-gray-800">
                        {item.projetos}
                      </td>

                      {/* Projetos Compartilhados */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {item.projetos_comp !== null ? (
                          <span className="font-medium text-gray-800">{item.projetos_comp}</span>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic bg-gray-100 px-1.5 py-0.5 rounded">
                            Sem dados
                          </span>
                        )}
                      </td>

                      {/* Média Dias Entre Sessões */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {item.media_dia_entre_sessoes !== null ? (
                          <span className="font-medium text-gray-800">{item.media_dia_entre_sessoes} dias</span>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic bg-gray-100 px-1.5 py-0.5 rounded">
                            Sem dados
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé da Tabela */}
        {displayRecords.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-[#fafbfc] flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 gap-2">
            <span>
              Exibindo <strong>{displayRecords.length} de {filteredByUn.length} licenças</strong> alocadas no Saga.
            </span>
            <div className="flex items-center gap-4">
              <span>
                Total de peças: <strong className="text-purple-900">{totalEnviado.toLocaleString('pt-BR')}</strong>
              </span>
              <span>
                Total de projetos: <strong className="text-gray-900">{totalProjetos}</strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
