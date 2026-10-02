import React, { useMemo, useState } from 'react';
import {
  IMRegistro,
  ferrIMData
} from '../../data/ferr-im.data';
import { normalizarUN, normalizarPosicao, normalizarMes } from '../../utils/padronizacao';
import {
  FolderGit2,
  FileText,
  Mail,
  Download,
  Share2,
  Search,
  Users,
  Award,
  BarChart3,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Shield,
  Activity,
  Filter,
  TrendingUp,
  FileSpreadsheet
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

const MESES_IM = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto'];

interface FerrImViewProps {
  selectedMonth: string;
}

export default function FerrImView({ selectedMonth }: FerrImViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUn, setSelectedUn] = useState<string>('todas');
  const [selectedPosicao, setSelectedPosicao] = useState<string>('todas');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [activeTabSubView, setActiveTabSubView] = useState<'geral' | 'uns' | 'ranking'>('geral');

  // Base normalizada com padronização de UN, Posição e Mês
  const normalizedData = useMemo(() => {
    return ferrIMData.map((d) => ({
      ...d,
      un: normalizarUN(d.un),
      posicao: normalizarPosicao(d.posicao),
      mes: normalizarMes(d.mes)
    }));
  }, []);

  // Ordenação cronológica por mês
  const sortedChronologically = useMemo(() => {
    return [...normalizedData].sort((a, b) => {
      const orderA = MONTH_ORDER[a.mes] || 99;
      const orderB = MONTH_ORDER[b.mes] || 99;
      if (orderA !== orderB) return orderA - orderB;
      return b.total - a.total;
    });
  }, [normalizedData]);

  // Filtro de mês (do seletor superior da página)
  const monthFilteredData = useMemo(() => {
    if (selectedMonth === 'Todos os meses') {
      return sortedChronologically;
    }
    return sortedChronologically.filter((d) => d.mes === selectedMonth);
  }, [sortedChronologically, selectedMonth]);

  // Opções de UNs e Posições para dropdown
  const unOptions = useMemo(() => {
    const set = new Set<string>();
    normalizedData.forEach((d) => {
      if (d.un && d.un.trim()) set.add(d.un.trim());
    });
    return Array.from(set).sort();
  }, [normalizedData]);

  const posicaoOptions = useMemo(() => {
    const set = new Set<string>();
    normalizedData.forEach((d) => {
      if (d.posicao && d.posicao.trim()) set.add(d.posicao.trim());
    });
    return Array.from(set).sort();
  }, [normalizedData]);

  // Filtros combinados da tabela (busca + UN + posição)
  const displayRecords = useMemo(() => {
    return monthFilteredData.filter((d) => {
      if (selectedUn !== 'todas' && d.un !== selectedUn) return false;
      if (selectedPosicao !== 'todas' && d.posicao !== selectedPosicao) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const match =
          d.nome.toLowerCase().includes(term) ||
          d.un.toLowerCase().includes(term) ||
          d.posicao.toLowerCase().includes(term) ||
          d.mes.toLowerCase().includes(term);
        if (!match) return false;
      }
      return true;
    });
  }, [monthFilteredData, selectedUn, selectedPosicao, searchTerm]);

  // Paginação dos registros
  const totalPages = Math.ceil(displayRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * pageSize;
    return displayRecords.slice(start, start + pageSize);
  }, [displayRecords, page, pageSize]);

  // Totais do Resumo (no período filtrado)
  const somaTotal = useMemo(
    () => monthFilteredData.reduce((acc, d) => acc + d.total, 0),
    [monthFilteredData]
  );
  const somaDocCriado = useMemo(
    () => monthFilteredData.reduce((acc, d) => acc + d.doc_criado, 0),
    [monthFilteredData]
  );
  const somaVCriada = useMemo(
    () => monthFilteredData.reduce((acc, d) => acc + d.v_criada, 0),
    [monthFilteredData]
  );
  const somaEmailArq = useMemo(
    () => monthFilteredData.reduce((acc, d) => acc + d.email_arq, 0),
    [monthFilteredData]
  );
  const somaExp = useMemo(
    () => monthFilteredData.reduce((acc, d) => acc + d.exp, 0),
    [monthFilteredData]
  );

  // Evolução Mensal (Janeiro a Agosto) - Base Consolidada
  const evolucaoMensal = useMemo(() => {
    return MESES_IM.map((m) => {
      const itensDoMes = normalizedData.filter((d) => d.mes === m);
      const totalUso = itensDoMes.reduce((acc, d) => acc + d.total, 0);
      const totalDocs = itensDoMes.reduce((acc, d) => acc + d.doc_criado, 0);
      const totalEmails = itensDoMes.reduce((acc, d) => acc + d.email_arq, 0);
      const totalVersoes = itensDoMes.reduce((acc, d) => acc + d.v_criada, 0);
      const totalExp = itensDoMes.reduce((acc, d) => acc + d.exp, 0);
      const ativosCount = itensDoMes.filter((d) => d.total > 0).length;

      return {
        mes: m,
        totalUso,
        totalDocs,
        totalEmails,
        totalVersoes,
        totalExp,
        ativosCount
      };
    });
  }, [normalizedData]);

  // Agrupamento por UN (no período filtrado)
  const statsPorUn = useMemo(() => {
    const map: Record<string, { total: number; docs: number; versoes: number; emails: number; exp: number; users: Set<string> }> = {};

    monthFilteredData.forEach((d) => {
      const unName = d.un || 'Não informada';
      if (!map[unName]) {
        map[unName] = { total: 0, docs: 0, versoes: 0, emails: 0, exp: 0, users: new Set() };
      }
      map[unName].total += d.total;
      map[unName].docs += d.doc_criado;
      map[unName].versoes += d.v_criada;
      map[unName].emails += d.email_arq;
      map[unName].exp += d.exp;
      if (d.total > 0) {
        map[unName].users.add(d.nome);
      }
    });

    return Object.entries(map)
      .map(([un, data]) => ({
        un,
        total: data.total,
        docs: data.docs,
        versoes: data.versoes,
        emails: data.emails,
        exp: data.exp,
        usuariosAtivos: data.users.size,
        percentual: somaTotal > 0 ? (data.total / somaTotal) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);
  }, [monthFilteredData, somaTotal]);

  // Ranking Top 10 Usuários no Período Selecionado
  const topUsuarios = useMemo(() => {
    const map: Record<string, { total: number; docs: number; versoes: number; emails: number; exp: number; un: string; posicao: string }> = {};

    monthFilteredData.forEach((d) => {
      if (!map[d.nome]) {
        map[d.nome] = { total: 0, docs: 0, versoes: 0, emails: 0, exp: 0, un: d.un, posicao: d.posicao };
      }
      map[d.nome].total += d.total;
      map[d.nome].docs += d.doc_criado;
      map[d.nome].versoes += d.v_criada;
      map[d.nome].emails += d.email_arq;
      map[d.nome].exp += d.exp;
    });

    return Object.entries(map)
      .map(([nome, stats]) => ({
        nome,
        total: stats.total,
        docs: stats.docs,
        versoes: stats.versoes,
        emails: stats.emails,
        exp: stats.exp,
        un: stats.un,
        posicao: stats.posicao
      }))
      .filter((u) => u.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [monthFilteredData]);

  // Exportar Excel
  const handleExportExcel = () => {
    const exportData = displayRecords.map((d, index) => ({
      '#': index + 1,
      'Colaborador': d.nome,
      'UN': d.un,
      'Posição': d.posicao,
      'Mês': d.mes,
      'Total Uso iM': d.total,
      'Docs Criados': d.doc_criado,
      'Versões Criadas': d.v_criada,
      'E-mails Arquivados': d.email_arq,
      'Exportações': d.exp
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Uso iManage');
    XLSX.writeFile(wb, `Uso_iManage_${selectedMonth.replace(/\s+/g, '_')}.xlsx`);
  };

  const maxEvolucaoUso = Math.max(...evolucaoMensal.map((e) => e.totalUso), 1);
  const maxTopUso = topUsuarios[0]?.total || 1;
  const maxUnUso = statsPorUn[0]?.total || 1;

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. CARDS DE RESUMO (TOTAIS DO PERÍODO)                               */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total de Uso Geral */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 border border-blue-100">
            <FolderGit2 size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Total de Atividades
            </div>
            <div className="text-2xl font-serif font-bold text-gray-900 mt-0.5">
              {somaTotal.toLocaleString('pt-BR')}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              Uso geral do iManage
            </div>
          </div>
        </div>

        {/* Documentos Criados */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
            <FileText size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Documentos Criados
            </div>
            <div className="text-2xl font-serif font-bold text-emerald-700 mt-0.5">
              {somaDocCriado.toLocaleString('pt-BR')}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
              {somaTotal > 0 ? ((somaDocCriado / somaTotal) * 100).toFixed(1) : 0}% do total
            </div>
          </div>
        </div>

        {/* Versões Criadas */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 border border-indigo-100">
            <Layers size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Versões Criadas
            </div>
            <div className="text-2xl font-serif font-bold text-indigo-900 mt-0.5">
              {somaVCriada.toLocaleString('pt-BR')}
            </div>
            <div className="text-[11px] text-indigo-700 font-medium mt-0.5">
              Edições versionadas
            </div>
          </div>
        </div>

        {/* E-mails Arquivados */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-100">
            <Mail size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              E-mails Arquivados
            </div>
            <div className="text-2xl font-serif font-bold text-purple-900 mt-0.5">
              {somaEmailArq.toLocaleString('pt-BR')}
            </div>
            <div className="text-[11px] text-purple-700 font-medium mt-0.5">
              Gestão de correspondência
            </div>
          </div>
        </div>

        {/* Exportações */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100">
            <Download size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Exportações
            </div>
            <div className="text-2xl font-serif font-bold text-gray-900 mt-0.5">
              {somaExp.toLocaleString('pt-BR')}
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-0.5">
              Documentos exportados
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. GRÁFICO DE EVOLUÇÃO MENSAL (JANEIRO A AGOSTO)                     */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 size={18} className="text-brand-blue" />
              <span>Evolução do Uso</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Total de interações somadas entre todos os usuários do escritório
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-blue-50 text-brand-blue border border-blue-100 px-3 py-1 rounded-xl font-semibold">
              Média mensal: {Math.round(evolucaoMensal.reduce((a, b) => a + b.totalUso, 0) / 8).toLocaleString('pt-BR')} atividades
            </span>
          </div>
        </div>

        {/* Grid de Barras Mensais (8 Meses) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {evolucaoMensal.map((item) => {
            const heightPct = Math.round((item.totalUso / maxEvolucaoUso) * 100);
            const isCurrentMonth = selectedMonth === item.mes;

            return (
              <div
                key={item.mes}
                className={`rounded-2xl border p-3 flex flex-col justify-between text-center transition-all ${
                  isCurrentMonth
                    ? 'border-brand-blue ring-2 ring-brand-blue/20 bg-blue-50/50 shadow-xs'
                    : 'border-gray-200/80 bg-gray-50/60 hover:border-gray-300'
                }`}
              >
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-navy">
                    {item.mes}
                  </span>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    {item.ativosCount} usuários
                  </div>
                </div>

                {/* Coluna / Barra do Gráfico */}
                <div className="my-3 flex flex-col items-center justify-end h-28">
                  <span className="text-xs font-serif font-bold text-gray-900 mb-1.5 truncate max-w-full">
                    {item.totalUso >= 1000 ? `${(item.totalUso / 1000).toFixed(0)}k` : item.totalUso}
                  </span>
                  <div className="w-9 bg-gray-200 rounded-t-lg h-20 flex items-end overflow-hidden">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-700 ${
                        isCurrentMonth
                          ? 'bg-brand-navy'
                          : 'bg-gradient-to-t from-brand-navy to-brand-blue'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    ></div>
                  </div>
                </div>

                {/* Subtítulo do Card */}
                <div className="pt-2 border-t border-gray-200/60 text-[10px] text-gray-500 space-y-0.5">
                  <div>Docs: <strong>{(item.totalDocs / 1000).toFixed(1)}k</strong></div>
                  <div>E-mails: <strong>{(item.totalEmails / 1000).toFixed(1)}k</strong></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. RANKING DE UNs E TOP 10 USUÁRIOS                                  */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel 1: Adoção por UN */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2">
                  <Users size={17} className="text-brand-blue" />
                  <span>Uso por UN</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Padronizado com normalizarUN() ({statsPorUn.length} UNs ativas no período)
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
              {statsPorUn.map((item) => {
                const barWidth = (item.total / maxUnUso) * 100;

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
                        <span className="font-bold text-gray-900">
                          {item.total.toLocaleString('pt-BR')}
                        </span>
                        <span className="text-[11px] text-gray-500 bg-white border border-gray-200 px-1.5 py-0.5 rounded font-medium">
                          {item.percentual.toFixed(1)}%
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
                      <span>Docs: <strong>{item.docs.toLocaleString('pt-BR')}</strong></span>
                      <span>E-mails: <strong>{item.emails.toLocaleString('pt-BR')}</strong></span>
                      <span>Colaboradores: <strong>{item.usuariosAtivos}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Painel 2: Ranking Top 10 Usuários */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2">
                  <Award size={17} className="text-brand-blue" />
                  <span>Top 10 Usuários por Volume de Uso</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Colaboradores com maior volume de atividades no iManage em {selectedMonth}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
              {topUsuarios.map((u, idx) => {
                const barWidth = (u.total / maxTopUso) * 100;
                const isTop3 = idx < 3;

                return (
                  <div
                    key={u.nome}
                    className="bg-gray-50/70 p-3 rounded-xl border border-gray-200/60 hover:bg-gray-100/70 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
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
                        <div className="truncate">
                          <span className="font-semibold text-gray-900 text-xs sm:text-sm block truncate">
                            {u.nome}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {u.un} • {u.posicao}
                          </span>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <div className="font-bold text-gray-900 text-xs sm:text-sm">
                          {u.total.toLocaleString('pt-BR')}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {u.docs.toLocaleString('pt-BR')} docs
                        </div>
                      </div>
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
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 4. TABELA COMPLETA COM CADA REGISTRO DE USO                          */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        {/* Header da Tabela com Filtros */}
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-[#fafbfc]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                <FolderGit2 size={18} className="text-brand-blue" />
                <span>Atividades no iManage</span>
                <span className="text-xs font-sans font-normal text-gray-500">
                  ({displayRecords.length.toLocaleString('pt-BR')} registros)
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                <Shield size={12} className="text-amber-600" />
                <span>Dados individuais protegidos pelo controle de acesso corporativo</span>
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Filtro por UN */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-500 font-medium">UN:</span>
                <select
                  value={selectedUn}
                  onChange={(e) => {
                    setSelectedUn(e.target.value);
                    setPage(1);
                  }}
                  className="bg-white border border-gray-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue text-gray-800 font-medium max-w-[170px]"
                >
                  <option value="todas">Todas as UNs</option>
                  {unOptions.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por Posição */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-500 font-medium">Cargo:</span>
                <select
                  value={selectedPosicao}
                  onChange={(e) => {
                    setSelectedPosicao(e.target.value);
                    setPage(1);
                  }}
                  className="bg-white border border-gray-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue text-gray-800 font-medium max-w-[140px]"
                >
                  <option value="todas">Todos cargos</option>
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
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="bg-white border border-gray-200 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent text-gray-800 placeholder-gray-400 w-44 sm:w-52"
                />
              </div>

              {/* Botão Exportar Excel */}
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-xl transition-all shadow-2xs hover:border-gray-300 cursor-pointer"
                title="Exportar base completa filtrada para Excel"
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
                <th className="py-3 px-3.5 w-12 text-center">#</th>
                <th className="py-3 px-3.5 min-w-[200px]">Colaborador</th>
                <th className="py-3 px-3.5 w-44">UN (Padronizada)</th>
                <th className="py-3 px-3.5 w-28">Posição</th>
                <th className="py-3 px-3.5 w-24">Mês</th>
                <th className="py-3 px-3.5 text-center w-28 font-bold">Total Geral</th>
                <th className="py-3 px-3.5 text-center w-28">Docs Criados</th>
                <th className="py-3 px-3.5 text-center w-28">Versões</th>
                <th className="py-3 px-3.5 text-center w-28">E-mails</th>
                <th className="py-3 px-3.5 text-center w-28">Exportações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-400">
                    Nenhum registro encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((item, idx) => {
                  const globalIdx = (page - 1) * pageSize + idx + 1;
                  const isZerado = item.total === 0;

                  return (
                    <tr
                      key={`${item.nome}-${item.mes}-${idx}`}
                      className={`hover:bg-blue-50/20 transition-colors ${
                        isZerado ? 'opacity-40 bg-gray-50/20' : ''
                      }`}
                    >
                      {/* Numeração */}
                      <td className="py-3 px-3.5 text-center text-gray-400 text-xs">
                        {globalIdx}
                      </td>

                      {/* Nome */}
                      <td className="py-3 px-3.5 font-semibold text-gray-900 whitespace-nowrap">
                        {item.nome}
                      </td>

                      {/* UN */}
                      <td className="py-3 px-3.5 text-gray-700 text-xs whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-medium">
                          {item.un}
                        </span>
                      </td>

                      {/* Posição */}
                      <td className="py-3 px-3.5 text-gray-600 text-xs whitespace-nowrap">
                        {item.posicao}
                      </td>

                      {/* Mês */}
                      <td className="py-3 px-3.5 font-semibold text-gray-700 whitespace-nowrap text-xs">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 text-xs font-medium">
                          {item.mes}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap font-serif font-bold text-gray-900">
                        {item.total > 0 ? (
                          <span className="text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                            {item.total.toLocaleString('pt-BR')}
                          </span>
                        ) : (
                          <span className="text-gray-400 font-normal">0</span>
                        )}
                      </td>

                      {/* Docs Criados */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap font-mono text-xs font-semibold text-emerald-800">
                        {item.doc_criado > 0 ? item.doc_criado.toLocaleString('pt-BR') : '0'}
                      </td>

                      {/* Versões Criadas */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap font-mono text-xs text-indigo-700">
                        {item.v_criada > 0 ? item.v_criada.toLocaleString('pt-BR') : '0'}
                      </td>

                      {/* E-mails Arquivados */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap font-mono text-xs text-purple-700">
                        {item.email_arq > 0 ? item.email_arq.toLocaleString('pt-BR') : '0'}
                      </td>

                      {/* Exportações */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap font-mono text-xs text-amber-800">
                        {item.exp > 0 ? item.exp.toLocaleString('pt-BR') : '0'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé com Paginação */}
        <div className="p-4 border-t border-gray-100 bg-[#fafbfc] flex flex-col sm:flex-row sm:items-center justify-between text-xs text-gray-500 gap-3">
          <div className="flex items-center gap-2">
            <span>
              Exibindo <strong>{(page - 1) * pageSize + 1}</strong> a{' '}
              <strong>{Math.min(page * pageSize, displayRecords.length)}</strong> de{' '}
              <strong>{displayRecords.length.toLocaleString('pt-BR')}</strong> registros
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">
              Itens por página:
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-white border border-gray-200 rounded px-1.5 py-0.5 text-xs font-medium cursor-pointer"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 self-center sm:self-auto">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-2 font-medium">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
