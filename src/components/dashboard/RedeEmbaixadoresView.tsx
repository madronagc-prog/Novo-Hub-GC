import React, { useMemo, useState } from 'react';
import {
  EmbaixadorRegistro,
  redeEmbaixadoresData
} from '../../data/rede-embaixadores.data';
import { normalizarMes } from '../../utils/padronizacao';
import {
  Share2,
  Users,
  CheckCircle2,
  Clock,
  Briefcase,
  Search,
  Download,
  Calendar,
  Layers,
  Award,
  Sparkles,
  Filter,
  BarChart3
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

const GRUPO_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  'Sócio': { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
  'Advogado': { bg: 'bg-blue-50', text: 'text-brand-blue', border: 'border-blue-200' },
  'Adm': { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' }
};

interface RedeEmbaixadoresViewProps {
  selectedMonth: string;
}

export default function RedeEmbaixadoresView({ selectedMonth }: RedeEmbaixadoresViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrupo, setSelectedGrupo] = useState<string>('todos');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [groupBy, setGroupBy] = useState<'nenhum' | 'grupo' | 'nome'>('nenhum');

  // Base normalizada com padronização de mês
  const normalizedData = useMemo(() => {
    return redeEmbaixadoresData.map((d) => ({
      ...d,
      mes: normalizarMes(d.mes)
    }));
  }, []);

  // Ordenação cronológica por mês (Abril a Novembro)
  const sortedChronologically = useMemo(() => {
    return [...normalizedData].sort((a, b) => {
      const orderA = MONTH_ORDER[a.mes] || 99;
      const orderB = MONTH_ORDER[b.mes] || 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.nome.localeCompare(b.nome);
    });
  }, [normalizedData]);

  // Filtro de mês (do seletor superior da página)
  const monthFilteredData = useMemo(() => {
    if (selectedMonth === 'Todos os meses') {
      return sortedChronologically;
    }
    return sortedChronologically.filter((d) => d.mes === selectedMonth);
  }, [sortedChronologically, selectedMonth]);

  // Filtros combinados da tabela (busca + grupo + status)
  const displayRecords = useMemo(() => {
    return monthFilteredData.filter((d) => {
      if (selectedGrupo !== 'todos' && d.grupo !== selectedGrupo) return false;
      const isPublicado = d.status.trim().toLowerCase() === 'publicado';
      if (selectedStatus === 'publicado' && !isPublicado) return false;
      if (selectedStatus === 'pendente' && isPublicado) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const match =
          d.nome.toLowerCase().includes(term) ||
          d.tema.toLowerCase().includes(term) ||
          d.grupo.toLowerCase().includes(term) ||
          d.mes.toLowerCase().includes(term);
        if (!match) return false;
      }
      return true;
    });
  }, [monthFilteredData, selectedGrupo, selectedStatus, searchTerm]);

  // Totais do Resumo (no período filtrado)
  const totalParticipacoes = monthFilteredData.length;

  const totalPublicados = useMemo(
    () => monthFilteredData.filter((d) => d.status.trim().toLowerCase() === 'publicado').length,
    [monthFilteredData]
  );

  const totalPendentes = totalParticipacoes - totalPublicados;

  const taxaPublicacao = totalParticipacoes > 0 ? (totalPublicados / totalParticipacoes) * 100 : 0;

  // Participações por Grupo (Sócio, Advogado, Adm)
  const sociosTotal = useMemo(
    () => monthFilteredData.filter((d) => d.grupo === 'Sócio').length,
    [monthFilteredData]
  );
  const sociosPublicados = useMemo(
    () => monthFilteredData.filter((d) => d.grupo === 'Sócio' && d.status.trim().toLowerCase() === 'publicado').length,
    [monthFilteredData]
  );

  const advogadosTotal = useMemo(
    () => monthFilteredData.filter((d) => d.grupo === 'Advogado').length,
    [monthFilteredData]
  );
  const advogadosPublicados = useMemo(
    () => monthFilteredData.filter((d) => d.grupo === 'Advogado' && d.status.trim().toLowerCase() === 'publicado').length,
    [monthFilteredData]
  );

  const admTotal = useMemo(
    () => monthFilteredData.filter((d) => d.grupo === 'Adm').length,
    [monthFilteredData]
  );
  const admPublicados = useMemo(
    () => monthFilteredData.filter((d) => d.grupo === 'Adm' && d.status.trim().toLowerCase() === 'publicado').length,
    [monthFilteredData]
  );

  // Lista única de nomes para filtro
  const nomesUnicos = useMemo(() => {
    const set = new Set<string>();
    normalizedData.forEach((d) => set.add(d.nome));
    return Array.from(set).sort();
  }, [normalizedData]);

  // Exportar Excel
  const handleExportExcel = () => {
    const exportData = displayRecords.map((d, index) => ({
      '#': index + 1,
      'Mês': d.mes,
      'Grupo': d.grupo,
      'Embaixador(a)': d.nome,
      'Tema da Publicação': d.tema,
      'Status': d.status.trim().toLowerCase() === 'publicado' ? 'Publicado' : 'Pendente'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Embaixadores');
    XLSX.writeFile(wb, `Embaixadores_${selectedMonth.replace(/\s+/g, '_')}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. CARDS DE RESUMO (TOTAIS GERAIS E QUEBRA POR GRUPO)                */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Geral de Publicações / Pautas */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 border border-blue-100">
            <Share2 size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Total de Pautas
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {totalParticipacoes} {totalParticipacoes === 1 ? 'pauta' : 'pautas'}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              {totalPublicados} publicadas ({taxaPublicacao.toFixed(0)}%) | {totalPendentes} pendentes
            </div>
          </div>
        </div>

        {/* Sócios */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center flex-shrink-0 border border-indigo-100">
            <Award size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Grupo: Sócios
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-indigo-900 mt-0.5">
              {sociosTotal} {sociosTotal === 1 ? 'pauta' : 'pautas'}
            </div>
            <div className="text-[11px] text-indigo-700 font-medium mt-0.5">
              {sociosPublicados} publicadas ({sociosTotal > 0 ? ((sociosPublicados / sociosTotal) * 100).toFixed(0) : 0}%)
            </div>
          </div>
        </div>

        {/* Advogados */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-brand-blue flex items-center justify-center flex-shrink-0 border border-sky-100">
            <Briefcase size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Grupo: Advogados
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-blue-900 mt-0.5">
              {advogadosTotal} {advogadosTotal === 1 ? 'pauta' : 'pautas'}
            </div>
            <div className="text-[11px] text-brand-blue font-medium mt-0.5">
              {advogadosPublicados} publicadas ({advogadosTotal > 0 ? ((advogadosPublicados / advogadosTotal) * 100).toFixed(0) : 0}%)
            </div>
          </div>
        </div>

        {/* Gestão / Adm */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
            <Users size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Grupo: Gestão & Adm
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-900 mt-0.5">
              {admTotal} {admTotal === 1 ? 'pauta' : 'pautas'}
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
              {admPublicados} publicadas ({admTotal > 0 ? ((admPublicados / admTotal) * 100).toFixed(0) : 0}%)
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. TABELA COMPLETA COM CADA REGISTRO DE EMBAIXADOR                  */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Header da Tabela com Filtros */}
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-[#fafbfc]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                <Users size={18} className="text-brand-blue" />
                <span>Programa de Embaixadores Madrona</span>
                <span className="text-xs font-sans font-normal text-gray-500">
                  ({displayRecords.length} de {totalParticipacoes} registros)
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Cronograma de temas, lideranças participantes e status de veiculação no LinkedIn
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
                  <option value="Sócio">Sócios ({sociosTotal})</option>
                  <option value="Advogado">Advogados ({advogadosTotal})</option>
                  <option value="Adm">Adm ({admTotal})</option>
                </select>
              </div>

              {/* Filtro por Status */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-500 font-medium">Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="bg-white border border-gray-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue text-gray-800 font-medium"
                >
                  <option value="todos">Todos status</option>
                  <option value="publicado">Publicado ({totalPublicados})</option>
                  <option value="pendente">Pendente ({totalPendentes})</option>
                </select>
              </div>

              {/* Busca por Nome ou Tema */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar nome, tema..."
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
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4 w-28">Mês</th>
                <th className="py-3 px-4 w-32">Grupo</th>
                <th className="py-3 px-4 min-w-[200px]">Embaixador(a)</th>
                <th className="py-3 px-4 min-w-[320px]">Tema da Publicação</th>
                <th className="py-3 px-4 text-center w-36">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    Nenhum registro de embaixador encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                displayRecords.map((item, idx) => {
                  const isPublicado = item.status.trim().toLowerCase() === 'publicado';
                  const grupoBadge = GRUPO_BADGES[item.grupo] || {
                    bg: 'bg-gray-100',
                    text: 'text-gray-700',
                    border: 'border-gray-200'
                  };

                  return (
                    <tr
                      key={`${item.nome}-${item.mes}-${idx}`}
                      className="hover:bg-blue-50/20 transition-colors"
                    >
                      {/* Numeração */}
                      <td className="py-3.5 px-4 text-center text-gray-400 text-xs">
                        {idx + 1}
                      </td>

                      {/* Mês */}
                      <td className="py-3.5 px-4 font-semibold text-gray-700 whitespace-nowrap text-xs">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 text-xs font-medium">
                          {item.mes}
                        </span>
                      </td>

                      {/* Grupo */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${grupoBadge.bg} ${grupoBadge.text} ${grupoBadge.border}`}
                        >
                          {item.grupo}
                        </span>
                      </td>

                      {/* Nome */}
                      <td className="py-3.5 px-4 font-semibold text-gray-900 whitespace-nowrap">
                        {item.nome}
                      </td>

                      {/* Tema */}
                      <td className="py-3.5 px-4 text-gray-800 font-medium leading-relaxed">
                        {item.tema}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isPublicado ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Publicado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                            Pendente
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
              Exibindo <strong>{displayRecords.length} pautas</strong> no período de <strong>{selectedMonth}</strong>.
            </span>
            <div className="flex items-center gap-3">
              <span>
                Total publicado: <strong className="text-emerald-700">{totalPublicados}</strong> ({taxaPublicacao.toFixed(0)}%)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
