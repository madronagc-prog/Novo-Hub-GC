import React, { useMemo, useState } from 'react';
import { tsGcAtividadesData, TSGCAtividadeRegistro } from '../../data/ts-gc-atividades.data';
import { normalizarMes } from '../../utils/padronizacao';
import {
  Clock,
  Users,
  FileText,
  Search,
  Download,
  Layers,
  Calendar,
  Shield,
  Info,
  Sparkles,
  CheckCircle2,
  FolderKanban
} from 'lucide-react';
import * as XLSX from 'xlsx';

function formatarMinutos(minutos: number): string {
  if (!minutos || minutos <= 0) return '0h 00min';
  const h = Math.floor(minutos / 60);
  const m = Math.round(minutos % 60);
  return `${h}h ${m < 10 ? '0' : ''}${m}min`;
}

interface TsGcViewProps {
  selectedMonth?: string;
}

export default function TsGcView({ selectedMonth = 'Todos os meses' }: TsGcViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPessoa, setSelectedPessoa] = useState('todas');
  const [selectedCategoria, setSelectedCategoria] = useState('todas');

  // Base normalizada de atividades da equipe de GC
  const normalizedData = useMemo(() => {
    return tsGcAtividadesData.map((d) => ({
      ...d,
      mes: normalizarMes(d.mes),
      categoriaNormalizada: d.categoria.trim()
    }));
  }, []);

  // Listas únicas para dropdowns de filtro
  const pessoasDisponiveis = useMemo(() => {
    const set = new Set<string>();
    normalizedData.forEach((d) => set.add(d.nome.trim()));
    return Array.from(set).sort();
  }, [normalizedData]);

  const categoriasDisponiveis = useMemo(() => {
    const set = new Set<string>();
    normalizedData.forEach((d) => set.add(d.categoriaNormalizada));
    return Array.from(set).sort();
  }, [normalizedData]);

  // Filtro de mês (do seletor superior da página)
  const monthFilteredData = useMemo(() => {
    if (selectedMonth && selectedMonth !== 'Todos os meses') {
      return normalizedData.filter((d) => d.mes === selectedMonth);
    }
    return normalizedData;
  }, [normalizedData, selectedMonth]);

  // Filtros combinados da tabela
  const displayRecords = useMemo(() => {
    return monthFilteredData.filter((d) => {
      if (selectedPessoa !== 'todas' && d.nome !== selectedPessoa) return false;
      if (selectedCategoria !== 'todas' && d.categoriaNormalizada !== selectedCategoria) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        return (
          d.atividade.toLowerCase().includes(term) ||
          d.nome.toLowerCase().includes(term) ||
          d.categoriaNormalizada.toLowerCase().includes(term) ||
          d.mes.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [monthFilteredData, selectedPessoa, selectedCategoria, searchTerm]);

  // Totais do Resumo
  const totalMinutos = useMemo(
    () => monthFilteredData.reduce((acc, d) => acc + d.tempo_investido_minutos, 0),
    [monthFilteredData]
  );

  const totalApontamentos = monthFilteredData.length;

  const totalPessoas = useMemo(() => {
    const set = new Set<string>();
    monthFilteredData.forEach((d) => set.add(d.nome.trim()));
    return set.size;
  }, [monthFilteredData]);

  // Agrupamento por Categoria de Atividade
  const statsPorCategoria = useMemo(() => {
    const map: Record<string, { minutos: number; count: number; pessoas: Set<string> }> = {};

    monthFilteredData.forEach((d) => {
      const c = d.categoriaNormalizada || 'Geral';
      if (!map[c]) map[c] = { minutos: 0, count: 0, pessoas: new Set() };
      map[c].minutos += d.tempo_investido_minutos;
      map[c].count += 1;
      map[c].pessoas.add(d.nome.trim());
    });

    return Object.entries(map)
      .map(([categoria, s]) => ({
        categoria,
        minutos: s.minutos,
        count: s.count,
        pessoasCount: s.pessoas.size,
        pct: totalMinutos > 0 ? (s.minutos / totalMinutos) * 100 : 0
      }))
      .sort((a, b) => b.minutos - a.minutos);
  }, [monthFilteredData, totalMinutos]);

  const maxCatMinutos = statsPorCategoria[0]?.minutos || 1;

  // Agrupamento por Pessoa da Equipe de GC
  const statsPorPessoa = useMemo(() => {
    const map: Record<string, { minutos: number; count: number; categorias: Set<string> }> = {};

    monthFilteredData.forEach((d) => {
      const p = d.nome.trim();
      if (!map[p]) map[p] = { minutos: 0, count: 0, categorias: new Set() };
      map[p].minutos += d.tempo_investido_minutos;
      map[p].count += 1;
      map[p].categorias.add(d.categoriaNormalizada);
    });

    return Object.entries(map)
      .map(([nome, s]) => ({
        nome,
        minutos: s.minutos,
        count: s.count,
        categoriasCount: s.categorias.size,
        pct: totalMinutos > 0 ? (s.minutos / totalMinutos) * 100 : 0
      }))
      .sort((a, b) => b.minutos - a.minutos);
  }, [monthFilteredData, totalMinutos]);

  const maxPessoaMinutos = statsPorPessoa[0]?.minutos || 1;

  // Exportar Excel
  const handleExportExcel = () => {
    const exportData = displayRecords.map((d, index) => ({
      '#': index + 1,
      'Membro da Equipe': d.nome,
      'Mês': d.mes,
      'Atividade / Demanda': d.atividade || 'Atividades Gerais',
      'Categoria Operacional': d.categoriaNormalizada,
      'Tempo Investido': d.tempo_investido,
      'Tempo (Minutos)': d.tempo_investido_minutos,
      'Tempo Formatado': formatarMinutos(d.tempo_investido_minutos)
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Atividades_Equipe_GC');
    XLSX.writeFile(wb, `TS_GC_Equipe_Interna_${selectedMonth.replace(/\s+/g, '_')}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* CABEÇALHO DA SUB-ABA TS GC (EQUIPE DE GESTÃO DO CONHECIMENTO)        */}
      {/* ==================================================================== */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center font-bold flex-shrink-0 border border-blue-100">
            <Clock size={22} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-serif font-bold text-gray-900">
              Timesheet de GC
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Rotina operacional, curadoria de conteúdo, projetos de eficiência e gestão contínua executada pela equipe própria de GC
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-xl font-medium border border-gray-200/60">
            Atividades Internas da Área
          </span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 1. CARDS DE RESUMO (TOTAIS DO PERÍODO)                               */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Tempo Total Investido */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 border border-blue-100">
            <Clock size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Tempo Total Investido
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-brand-navy mt-0.5">
              {formatarMinutos(totalMinutos)}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              {totalMinutos.toLocaleString('pt-BR')} minutos dedicados pela equipe
            </div>
          </div>
        </div>

        {/* Total de Apontamentos */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-100">
            <FileText size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Apontamentos Registrados
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-purple-900 mt-0.5">
              {totalApontamentos} lançamentos
            </div>
            <div className="text-[11px] text-purple-700 font-medium mt-0.5">
              Tarefas e projetos operacionais
            </div>
          </div>
        </div>

        {/* Membros da Equipe */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
            <Users size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Membros Ativos da Equipe
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-800 mt-0.5">
              {totalPessoas} pessoas
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
              Amanda, Andrezza, Deborah, Filipi, Clarissa, Raquel
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. PAINÉIS DE CATEGORIA E TEMPO POR MEMBRO DA EQUIPE                 */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel 1: Agrupamento por Categoria */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2">
                  <Layers size={17} className="text-brand-blue" />
                  <span>Distribuição por Categoria de Atuação</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Carga horária acumulada nos 12 pilares operacionais de GC
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
              {statsPorCategoria.map((item) => {
                const barWidth = (item.minutos / maxCatMinutos) * 100;

                return (
                  <div
                    key={item.categoria}
                    className="bg-gray-50/70 p-3 rounded-xl border border-gray-200/60 hover:bg-gray-100/70 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                      <span className="font-semibold text-gray-900 truncate">
                        {item.categoria}
                      </span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-bold text-brand-navy">
                          {formatarMinutos(item.minutos)}
                        </span>
                        <span className="text-[11px] text-gray-500 bg-white border border-gray-200 px-1.5 py-0.5 rounded font-medium">
                          {item.pct.toFixed(1)}%
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
                      <span>{item.count} atividades executadas</span>
                      <span>{item.pessoasCount} pessoa(s) envolvida(s)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Painel 2: Tempo Total por Pessoa */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2">
                  <Users size={17} className="text-brand-blue" />
                  <span>Dedicação Horária por Membro da Equipe</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Tempo investido por cada integrante no período filtrado
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              {statsPorPessoa.map((item, idx) => {
                const barWidth = (item.minutos / maxPessoaMinutos) * 100;

                return (
                  <div
                    key={item.nome}
                    className="bg-gray-50/70 p-3.5 rounded-xl border border-gray-200/60 hover:bg-gray-100/70 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-brand-blue flex items-center justify-center font-bold text-[11px]">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-gray-900 text-sm">
                          {item.nome}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-serif font-bold text-brand-navy text-sm">
                          {formatarMinutos(item.minutos)}
                        </span>
                        <span className="text-[11px] text-gray-500 bg-white border border-gray-200 px-1.5 py-0.5 rounded font-medium">
                          {item.pct.toFixed(1)}%
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
                      <span>{item.count} apontamentos registrados</span>
                      <span>{item.categoriasCount} categorias de atuação</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. TABELA COMPLETA COM CADA REGISTRO DE ATIVIDADE                   */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Header da Tabela com Filtros */}
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-[#fafbfc]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                <FileText size={18} className="text-brand-blue" />
                <span>Atividades da Equipe</span>
                <span className="text-xs font-sans font-normal text-gray-500">
                  ({displayRecords.length} de {monthFilteredData.length} registros)
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Rastreamento individual de cada tarefa, dedicação horária e categoria operacional
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Filtro por Pessoa */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-500 font-medium">Pessoa:</span>
                <select
                  value={selectedPessoa}
                  onChange={(e) => setSelectedPessoa(e.target.value)}
                  className="bg-white border border-gray-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue text-gray-800 font-medium"
                >
                  <option value="todas">Todas as Pessoas</option>
                  {pessoasDisponiveis.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Filtro por Categoria */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-500 font-medium">Categoria:</span>
                <select
                  value={selectedCategoria}
                  onChange={(e) => setSelectedCategoria(e.target.value)}
                  className="bg-white border border-gray-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue text-gray-800 font-medium max-w-[180px]"
                >
                  <option value="todas">Todas as Categorias</option>
                  {categoriasDisponiveis.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Busca por Atividade */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar atividade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border border-gray-200 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent text-gray-800 placeholder-gray-400 w-44 sm:w-56"
                />
              </div>

              {/* Botão Exportar Excel */}
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-xl transition-all shadow-2xs hover:border-gray-300 cursor-pointer"
                title="Exportar base da equipe de GC para Excel"
              >
                <Download size={14} className="text-emerald-600" />
                <span>Exportar Excel</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabela de Dados */}
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-gray-200/80 bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4 w-32">Membro</th>
                <th className="py-3 px-4 w-28">Mês</th>
                <th className="py-3 px-4 min-w-[220px]">Atividade / Demanda</th>
                <th className="py-3 px-4 min-w-[200px]">Categoria Operacional</th>
                <th className="py-3 px-4 text-center w-36 font-bold text-brand-navy">Tempo Investido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    Nenhuma atividade encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                displayRecords.map((item, idx) => (
                  <tr
                    key={`${item.nome}-${item.mes}-${item.atividade}-${idx}`}
                    className="hover:bg-blue-50/20 transition-colors"
                  >
                    <td className="py-3 px-4 text-center text-gray-400 text-xs">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-gray-900 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-brand-blue"></span>
                        <span>{item.nome}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-700 whitespace-nowrap text-xs">{item.mes}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {item.atividade || <span className="text-gray-400 italic">Atividades Gerais</span>}
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-700">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-800 font-medium">
                        {item.categoriaNormalizada}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap font-mono text-xs font-bold text-brand-navy">
                      {formatarMinutos(item.tempo_investido_minutos)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé da Tabela */}
        {displayRecords.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-[#fafbfc] flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 gap-2">
            <span>
              Exibindo <strong>{displayRecords.length} atividades</strong> registradas no período de <strong>{selectedMonth}</strong>.
            </span>
            <div className="flex items-center gap-4">
              <span>
                Tempo total dedicado: <strong className="text-brand-navy">{formatarMinutos(totalMinutos)}</strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
