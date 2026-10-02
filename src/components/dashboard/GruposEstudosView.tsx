import React, { useMemo, useState } from 'react';
import {
  GrupoEstudoRegistro,
  gruposEstudosData
} from '../../data/grupos-estudos.data';
import { normalizarMes } from '../../utils/padronizacao';
import {
  Users,
  TrendingUp,
  Award,
  CheckCircle2,
  Calendar,
  Search,
  Download,
  BarChart3,
  Layers,
  Sparkles,
  BookOpen,
  Filter,
  Check,
  Target
} from 'lucide-react';
import * as XLSX from 'xlsx';

const MONTH_ORDER: Record<string, number> = {
  'Janeiro': 1,
  'Fevereiro': 2,
  'Março': 3,
  'Abril': 4,
  'Maio': 5,
  'Junho': 6,
  'Julho': 7,
  'Agosto': 8,
  'Setembro': 9,
  'Outubro': 10,
  'Novembro': 11,
  'Dezembro': 12
};

const MESES_TIMELINE = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto'
];

interface GruposEstudosViewProps {
  selectedMonth: string;
}

export default function GruposEstudosView({ selectedMonth }: GruposEstudosViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrupo, setSelectedGrupo] = useState<string>('todos');

  // Base normalizada
  const normalizedData = useMemo(() => {
    return gruposEstudosData.map((d) => ({
      ...d,
      mes: normalizarMes(d.mes)
    }));
  }, []);

  // Ordenação cronológica por mês (Janeiro a Agosto)
  const sortedChronologically = useMemo(() => {
    return [...normalizedData].sort((a, b) => {
      const orderA = MONTH_ORDER[a.mes] || 99;
      const orderB = MONTH_ORDER[b.mes] || 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.titulo.localeCompare(b.titulo);
    });
  }, [normalizedData]);

  // Filtro de mês (do seletor superior da página)
  const monthFilteredData = useMemo(() => {
    if (selectedMonth === 'Todos os meses') {
      return sortedChronologically;
    }
    return sortedChronologically.filter((d) => d.mes === selectedMonth);
  }, [sortedChronologically, selectedMonth]);

  // Filtros combinados da tabela (busca + grupo)
  const displayRecords = useMemo(() => {
    return monthFilteredData.filter((d) => {
      if (selectedGrupo !== 'todos' && d.titulo !== selectedGrupo) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const match =
          d.titulo.toLowerCase().includes(term) ||
          d.apresentado_por.toLowerCase().includes(term) ||
          d.resultado.toLowerCase().includes(term) ||
          d.mes.toLowerCase().includes(term);
        if (!match) return false;
      }
      return true;
    });
  }, [monthFilteredData, selectedGrupo, searchTerm]);

  // Totais do Resumo (considerando o período filtrado)
  const totalEncontros = monthFilteredData.length;

  const rtTaxItens = useMemo(
    () => monthFilteredData.filter((d) => d.titulo === 'RT Tax'),
    [monthFilteredData]
  );
  const rtCorpItens = useMemo(
    () => monthFilteredData.filter((d) => d.titulo === 'RT Corp'),
    [monthFilteredData]
  );

  const totalParticipantes = useMemo(
    () => monthFilteredData.reduce((acc, curr) => acc + curr.participantes, 0),
    [monthFilteredData]
  );

  const mediaPresencaGeral = useMemo(() => {
    if (monthFilteredData.length === 0) return 0;
    const soma = monthFilteredData.reduce((acc, curr) => acc + curr.percentual_presenca, 0);
    return Math.round(soma / monthFilteredData.length);
  }, [monthFilteredData]);

  const mediaPresencaTax = useMemo(() => {
    if (rtTaxItens.length === 0) return 0;
    const soma = rtTaxItens.reduce((acc, curr) => acc + curr.percentual_presenca, 0);
    return Math.round(soma / rtTaxItens.length);
  }, [rtTaxItens]);

  const mediaPresencaCorp = useMemo(() => {
    if (rtCorpItens.length === 0) return 0;
    const soma = rtCorpItens.reduce((acc, curr) => acc + curr.percentual_presenca, 0);
    return Math.round(soma / rtCorpItens.length);
  }, [rtCorpItens]);

  // Metas superadas
  const metasBatidas = useMemo(
    () => monthFilteredData.filter((d) => d.participantes >= d.meta).length,
    [monthFilteredData]
  );

  // Dados para o Gráfico de Evolução (Janeiro a Agosto)
  const chartPoints = useMemo(() => {
    return MESES_TIMELINE.map((m) => {
      const taxItem = normalizedData.find((d) => d.mes === m && d.titulo === 'RT Tax');
      const corpItem = normalizedData.find((d) => d.mes === m && d.titulo === 'RT Corp');

      return {
        mes: m,
        tax: taxItem ? taxItem.percentual_presenca : null,
        taxMeta: taxItem ? taxItem.meta : null,
        taxPart: taxItem ? taxItem.participantes : null,
        corp: corpItem ? corpItem.percentual_presenca : null,
        corpMeta: corpItem ? corpItem.meta : null,
        corpPart: corpItem ? corpItem.participantes : null
      };
    });
  }, [normalizedData]);

  // Exportar Excel
  const handleExportExcel = () => {
    const exportData = displayRecords.map((d, index) => ({
      '#': index + 1,
      'Mês': d.mes,
      'Grupo / RT': d.titulo,
      'Apresentado por': d.apresentado_por,
      'Resultado': d.resultado,
      'Convidados': d.convidados,
      'Participantes': d.participantes,
      'Meta': d.meta,
      '% de Presença': `${d.percentual_presenca}%`,
      'Meta Atingida': d.participantes >= d.meta ? 'Sim' : 'Não'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Grupos de Estudos e RT');
    XLSX.writeFile(wb, `Grupos_Estudos_RT_${selectedMonth.replace(/\s+/g, '_')}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. CARDS DE RESUMO (TOTAIS, RT TAX X RT CORP E MÉDIAS DE PRESENÇA)  */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Encontros Realizados */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 border border-blue-100">
            <BookOpen size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Encontros Realizados
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {totalEncontros} {totalEncontros === 1 ? 'encontro' : 'encontros'}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              {totalParticipantes} presenças registradas
            </div>
          </div>
        </div>

        {/* RT Tax */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center flex-shrink-0 border border-purple-100">
            <Users size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Grupo: RT Tax
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-purple-900 mt-0.5">
              {rtTaxItens.length} {rtTaxItens.length === 1 ? 'encontro' : 'encontros'}
            </div>
            <div className="text-[11px] text-purple-700 font-semibold mt-0.5">
              Média de Presença: {mediaPresencaTax}%
            </div>
          </div>
        </div>

        {/* RT Corp */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-brand-blue flex items-center justify-center flex-shrink-0 border border-sky-100">
            <Users size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Grupo: RT Corp
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-blue-900 mt-0.5">
              {rtCorpItens.length} {rtCorpItens.length === 1 ? 'encontro' : 'encontros'}
            </div>
            <div className="text-[11px] text-brand-blue font-semibold mt-0.5">
              Média de Presença: {mediaPresencaCorp}%
            </div>
          </div>
        </div>

        {/* Atingimento de Meta */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
            <Target size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Cumprimento da Meta
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-700 mt-0.5">
              {metasBatidas} de {totalEncontros}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
              {totalEncontros > 0 ? ((metasBatidas / totalEncontros) * 100).toFixed(0) : 0}% dos encontros na meta
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. GRÁFICO DE EVOLUÇÃO DO % DE PRESENÇA (RT TAX X RT CORP)           */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp size={18} className="text-brand-blue" />
              <span>Evolução do % de Presença ao Longo dos Meses</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Acompanhamento comparativo da taxa de adesão dos colaboradores nos encontros do RT Tax e RT Corp
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-600"></span>
              <span className="font-semibold text-gray-700">RT Tax</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-brand-blue"></span>
              <span className="font-semibold text-gray-700">RT Corp</span>
            </div>
          </div>
        </div>

        {/* Visualização em SVG e Cards Mensais Comparativos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {chartPoints.map((p) => {
            const hasTax = p.tax !== null;
            const hasCorp = p.corp !== null;
            const isSelected = selectedMonth === p.mes;

            return (
              <div
                key={p.mes}
                className={`rounded-2xl border p-3.5 flex flex-col justify-between transition-all text-center ${
                  isSelected
                    ? 'border-brand-blue ring-2 ring-brand-blue/20 bg-blue-50/40 shadow-xs'
                    : 'border-gray-200/80 bg-gray-50/50 hover:border-gray-300'
                }`}
              >
                <div className="text-xs font-bold uppercase tracking-wider text-brand-navy mb-2 border-b border-gray-200/60 pb-1">
                  {p.mes}
                </div>

                <div className="space-y-2.5 my-1">
                  {/* RT Tax */}
                  <div className="bg-white rounded-xl p-2 border border-purple-100 shadow-2xs">
                    <div className="text-[10px] font-semibold text-purple-700 uppercase tracking-wider">
                      RT Tax
                    </div>
                    {hasTax ? (
                      <div className="mt-0.5">
                        <span className="text-base font-serif font-bold text-purple-900">
                          {p.tax}%
                        </span>
                        <div className="text-[10px] text-gray-500">
                          {p.taxPart} part. (meta {p.taxMeta})
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 py-1">—</div>
                    )}
                  </div>

                  {/* RT Corp */}
                  <div className="bg-white rounded-xl p-2 border border-blue-100 shadow-2xs">
                    <div className="text-[10px] font-semibold text-brand-blue uppercase tracking-wider">
                      RT Corp
                    </div>
                    {hasCorp ? (
                      <div className="mt-0.5">
                        <span className="text-base font-serif font-bold text-blue-900">
                          {p.corp}%
                        </span>
                        <div className="text-[10px] text-gray-500">
                          {p.corpPart} part. (meta {p.corpMeta})
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 py-1">—</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Gráfico Visual Comparativo de Barras Agrupadas */}
        <div className="mt-6 pt-5 border-t border-gray-100">
          <div className="text-xs font-semibold text-gray-600 mb-3 flex items-center justify-between">
            <span>Comparativo Visual de Adesão por Encontro:</span>
            <span className="text-gray-400 font-normal">Meta média de presença: ~70%</span>
          </div>

          <div className="space-y-3">
            {chartPoints
              .filter((p) => p.tax !== null || p.corp !== null)
              .map((p) => (
                <div key={`bar-${p.mes}`} className="bg-gray-50/70 p-3 rounded-xl border border-gray-200/60">
                  <div className="text-xs font-bold text-gray-800 mb-2">{p.mes}</div>

                  <div className="space-y-2">
                    {/* Linha RT Tax */}
                    {p.tax !== null && (
                      <div className="flex items-center gap-3 text-xs">
                        <span className="w-16 font-semibold text-purple-800 flex-shrink-0">RT Tax</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-purple-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${p.tax}%` }}
                          ></div>
                        </div>
                        <span className="w-12 text-right font-serif font-bold text-purple-900">
                          {p.tax}%
                        </span>
                      </div>
                    )}

                    {/* Linha RT Corp */}
                    {p.corp !== null && (
                      <div className="flex items-center gap-3 text-xs">
                        <span className="w-16 font-semibold text-brand-blue flex-shrink-0">RT Corp</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-brand-blue h-full rounded-full transition-all duration-500"
                            style={{ width: `${p.corp}%` }}
                          ></div>
                        </div>
                        <span className="w-12 text-right font-serif font-bold text-blue-900">
                          {p.corp}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. TABELA COMPLETA COM CADA ENCONTRO REALIZADO                       */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Header da Tabela com Filtros */}
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-[#fafbfc]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                <Users size={18} className="text-brand-blue" />
                <span>Base de Encontros de Grupos de Estudos & RT</span>
                <span className="text-xs font-sans font-normal text-gray-500">
                  ({displayRecords.length} de {totalEncontros} encontros)
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Pautas técnicas, apresentadores, quórum de participantes e alcance das metas
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Filtro por Grupo */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-500 font-medium">Grupo:</span>
                <select
                  value={selectedGrupo}
                  onChange={(e) => setSelectedGrupo(e.target.value)}
                  className="bg-white border border-gray-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue text-gray-800 font-medium"
                >
                  <option value="todos">Todos os grupos</option>
                  <option value="RT Tax">RT Tax</option>
                  <option value="RT Corp">RT Corp</option>
                </select>
              </div>

              {/* Busca por Texto */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar apresentador, tema..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border border-gray-200 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent text-gray-800 placeholder-gray-400 w-44 sm:w-56"
                />
              </div>

              {/* Exportar Excel */}
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-xl transition-all shadow-2xs hover:border-gray-300 cursor-pointer"
                title="Exportar base filtrada para Excel"
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
                <th className="py-3 px-3.5 w-24">Mês</th>
                <th className="py-3 px-3.5 w-28">Grupo / RT</th>
                <th className="py-3 px-3.5 min-w-[260px]">Apresentado por / Pauta</th>
                <th className="py-3 px-3.5 w-40">Resultado</th>
                <th className="py-3 px-3.5 text-center w-24">Convidados</th>
                <th className="py-3 px-3.5 text-center w-24">Participantes</th>
                <th className="py-3 px-3.5 text-center w-20">Meta</th>
                <th className="py-3 px-3.5 text-center w-28">% Presença</th>
                <th className="py-3 px-3.5 text-center w-32">Status Meta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    Nenhum encontro registrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                displayRecords.map((item, idx) => {
                  const isTax = item.titulo === 'RT Tax';
                  const atingiuMeta = item.participantes >= item.meta;

                  return (
                    <tr
                      key={`${item.mes}-${item.titulo}-${idx}`}
                      className="hover:bg-blue-50/20 transition-colors"
                    >
                      {/* Mês */}
                      <td className="py-3.5 px-3.5 font-semibold text-gray-700 whitespace-nowrap text-xs">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 text-xs font-medium">
                          {item.mes}
                        </span>
                      </td>

                      {/* Grupo / RT */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold border ${
                            isTax
                              ? 'bg-purple-50 text-purple-800 border-purple-200'
                              : 'bg-blue-50 text-brand-blue border-blue-200'
                          }`}
                        >
                          {item.titulo}
                        </span>
                      </td>

                      {/* Apresentado por */}
                      <td className="py-3.5 px-3.5 font-medium text-gray-900 leading-snug">
                        {item.apresentado_por}
                      </td>

                      {/* Resultado */}
                      <td className="py-3.5 px-3.5 text-gray-600 text-xs whitespace-nowrap">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                          {item.resultado}
                        </span>
                      </td>

                      {/* Convidados */}
                      <td className="py-3.5 px-3.5 text-center whitespace-nowrap font-mono text-xs text-gray-600">
                        {item.convidados}
                      </td>

                      {/* Participantes */}
                      <td className="py-3.5 px-3.5 text-center whitespace-nowrap font-mono text-xs font-bold text-gray-900">
                        {item.participantes}
                      </td>

                      {/* Meta */}
                      <td className="py-3.5 px-3.5 text-center whitespace-nowrap font-mono text-xs text-gray-500">
                        {item.meta}
                      </td>

                      {/* % Presença */}
                      <td className="py-3.5 px-3.5 text-center whitespace-nowrap font-serif font-bold">
                        <span
                          className={`px-2 py-0.5 rounded-md text-xs border ${
                            item.percentual_presenca >= 80
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : item.percentual_presenca >= 60
                              ? 'bg-blue-50 text-brand-blue border-blue-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {item.percentual_presenca}%
                        </span>
                      </td>

                      {/* Status da Meta */}
                      <td className="py-3.5 px-3.5 text-center whitespace-nowrap">
                        {atingiuMeta ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 size={13} />
                            <span>Meta superada</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                            <span>Abaixo da meta</span>
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
              Exibindo <strong>{displayRecords.length} encontros</strong> no período de <strong>{selectedMonth}</strong>.
            </span>
            <div className="flex items-center gap-3">
              <span>
                Média geral de presença: <strong className="text-brand-navy">{mediaPresencaGeral}%</strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
