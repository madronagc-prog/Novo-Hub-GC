import React, { useMemo, useState } from 'react';
import {
  UpMinerRegistro,
  ferrUpMinerData,
  UPMINER_TOTAL_CONTRATO,
  UPMINER_TOTAL_USADO
} from '../../data/ferr-upminer.data';
import { normalizarMes, normalizarUN } from '../../utils/padronizacao';
import {
  Search,
  DollarSign,
  TrendingUp,
  Download,
  Building,
  Target,
  Briefcase,
  PieChart,
  BarChart3,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  Shield
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

const MESES_UPMINER = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto'];

function formatarMoeda(val: number): string {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarAreaUpMiner(area: string): string {
  const upper = area.trim().toUpperCase();
  if (upper === 'EXPANSÃO' || upper === 'EXPANSAO') return 'EXPANSÃO';
  if (upper === 'CLIENTE/CASO' || upper === 'CLIENTE / CASO') return 'CLIENTE/CASO';

  if (upper.startsWith('UN')) {
    if (upper.includes('TRIBUT')) return 'UN Tributário';
    if (upper.includes('CORPORAT')) return 'UN Corporativo';
    if (upper.includes('IMOBIL')) return 'UN Imobiliário';
    if (upper.includes('DIGITAL') || upper.includes('COMEX')) return 'UN Digital, Comex e PI';
    if (upper.includes('WHITE COLLAR') || upper.includes('COMPLIANCE')) return 'UN WC&C';
    if (upper.includes('FINANCEIRO') || upper.includes('BANC') || upper.includes('MERCAP')) return 'UN Mercap';
    if (upper.includes('TRABALH')) return 'UN Trabalhista';
    if (upper.includes('AMBIENT')) return 'UN Ambiental';
    if (upper.includes('CONTENCI')) return 'UN Contencioso';
    if (upper.includes('INFRAEST')) return 'UN Infraestrutura';
    return normalizarUN(area);
  }
  return area;
}

interface FerrUpMinerViewProps {
  selectedMonth?: string;
}

export default function FerrUpMinerView({ selectedMonth = 'Todos os meses' }: FerrUpMinerViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFrente, setSelectedFrente] = useState('todas');
  const [localMonth, setLocalMonth] = useState('todos');

  // Base normalizada
  const normalizedData = useMemo(() => {
    return ferrUpMinerData.map((d) => ({
      ...d,
      mes: normalizarMes(d.mes),
      areaNormalizada: formatarAreaUpMiner(d.area),
      frenteFormatada: d.frente.trim().toUpperCase() === 'CT' ? 'CT (Cliente / Caso)' : 'BD / Prospecção'
    }));
  }, []);

  // Filtro de mês (do dashboard geral ou local)
  const monthFilteredData = useMemo(() => {
    let data = normalizedData;
    if (selectedMonth && selectedMonth !== 'Todos os meses') {
      data = data.filter((d) => d.mes === selectedMonth);
    } else if (localMonth !== 'todos') {
      data = data.filter((d) => d.mes === localMonth);
    }
    return data;
  }, [normalizedData, selectedMonth, localMonth]);

  // Filtros combinados da tabela
  const displayRecords = useMemo(() => {
    return monthFilteredData.filter((d) => {
      if (selectedFrente !== 'todas') {
        const isCT = d.frenteFormatada.startsWith('CT');
        if (selectedFrente === 'CT' && !isCT) return false;
        if (selectedFrente === 'BD' && isCT) return false;
      }

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        return (
          d.areaNormalizada.toLowerCase().includes(term) ||
          d.area.toLowerCase().includes(term) ||
          d.frenteFormatada.toLowerCase().includes(term) ||
          d.mes.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [monthFilteredData, selectedFrente, searchTerm]);

  // Totais do Período Filtrado
  const totalUsadoFiltrado = useMemo(() => {
    return monthFilteredData.reduce((acc, d) => acc + d.valor, 0);
  }, [monthFilteredData]);

  // Totais Globais de Contrato
  const totalContratado = UPMINER_TOTAL_CONTRATO;
  const totalUsadoGlobal = UPMINER_TOTAL_USADO;
  const totalDisponivelGlobal = Math.max(0, totalContratado - totalUsadoGlobal);
  const pctUsoGlobal = (totalUsadoGlobal / totalContratado) * 100;

  // Evolução Mensal (Janeiro a Agosto)
  const evolucaoMensal = useMemo(() => {
    return MESES_UPMINER.map((m) => {
      const itensDoMes = normalizedData.filter((d) => d.mes === m);
      const valorTotal = itensDoMes.reduce((acc, d) => acc + d.valor, 0);
      const valorBD = itensDoMes
        .filter((d) => !d.frenteFormatada.startsWith('CT'))
        .reduce((acc, d) => acc + d.valor, 0);
      const valorCT = itensDoMes
        .filter((d) => d.frenteFormatada.startsWith('CT'))
        .reduce((acc, d) => acc + d.valor, 0);

      return {
        mes: m,
        valorTotal,
        valorBD,
        valorCT,
        count: itensDoMes.length
      };
    });
  }, [normalizedData]);

  const maxEvolucaoValor = Math.max(...evolucaoMensal.map((e) => e.valorTotal), 1);

  // Agrupamento por Área (no período filtrado)
  const statsPorArea = useMemo(() => {
    const map: Record<string, { valor: number; count: number }> = {};

    monthFilteredData.forEach((d) => {
      const a = d.areaNormalizada;
      if (!map[a]) {
        map[a] = { valor: 0, count: 0 };
      }
      map[a].valor += d.valor;
      map[a].count += 1;
    });

    return Object.entries(map)
      .map(([area, s]) => ({
        area,
        valor: s.valor,
        count: s.count,
        pct: totalUsadoFiltrado > 0 ? (s.valor / totalUsadoFiltrado) * 100 : 0
      }))
      .sort((a, b) => b.valor - a.valor);
  }, [monthFilteredData, totalUsadoFiltrado]);

  const maxAreaValor = statsPorArea[0]?.valor || 1;

  // Agrupamento por Frente (no período filtrado)
  const statsPorFrente = useMemo(() => {
    let valorBD = 0;
    let countBD = 0;
    let valorCT = 0;
    let countCT = 0;

    monthFilteredData.forEach((d) => {
      if (d.frenteFormatada.startsWith('CT')) {
        valorCT += d.valor;
        countCT += 1;
      } else {
        valorBD += d.valor;
        countBD += 1;
      }
    });

    return [
      {
        frente: 'BD / Prospecção',
        descricao: 'Pesquisas e dossiês de novos negócios e prospecção de clientes',
        valor: valorBD,
        count: countBD,
        pct: totalUsadoFiltrado > 0 ? (valorBD / totalUsadoFiltrado) * 100 : 0,
        corBarra: 'bg-brand-blue'
      },
      {
        frente: 'CT (Cliente / Caso)',
        descricao: 'Investigações patrimoniais e compliance alocados a casos ativos',
        valor: valorCT,
        count: countCT,
        pct: totalUsadoFiltrado > 0 ? (valorCT / totalUsadoFiltrado) * 100 : 0,
        corBarra: 'bg-emerald-600'
      }
    ];
  }, [monthFilteredData, totalUsadoFiltrado]);

  // Exportar Excel
  const handleExportExcel = () => {
    const exportData = displayRecords.map((d, index) => ({
      '#': index + 1,
      'Mês': d.mes,
      'Área': d.areaNormalizada,
      'Frente': d.frenteFormatada,
      'Valor Usado (R$)': d.valor
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'upMiner');
    XLSX.writeFile(wb, `upMiner_${selectedMonth.replace(/\s+/g, '_')}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. CARDS DE RESUMO (CONTRATADO, USADO, DISPONÍVEL E % USO)          */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Valor Total Contratado */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-blue flex items-center justify-center flex-shrink-0 border border-blue-100">
            <Shield size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Contratado Total
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {formatarMoeda(totalContratado)}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              Franquia de créditos upMiner
            </div>
          </div>
        </div>

        {/* Valor Total Usado */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-100">
            <DollarSign size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Valor Usado {selectedMonth !== 'Todos os meses' ? `(${selectedMonth})` : 'Acumulado'}
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-purple-900 mt-0.5">
              {formatarMoeda(selectedMonth !== 'Todos os meses' ? totalUsadoFiltrado : totalUsadoGlobal)}
            </div>
            <div className="text-[11px] text-purple-700 font-medium mt-0.5">
              {pctUsoGlobal.toFixed(1)}% do pacote anual consumido
            </div>
          </div>
        </div>

        {/* Saldo Disponível */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Saldo Disponível
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-emerald-700 mt-0.5">
              {formatarMoeda(totalDisponivelGlobal)}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
              Créditos remanescentes na conta
            </div>
          </div>
        </div>

        {/* Percentual de Utilização */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Taxa de Queima (Burn Rate)
            </div>
            <div className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 mt-0.5">
              {pctUsoGlobal.toFixed(1)}%
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-0.5">
              Ritmo de consumo compatível com o ano
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
              <span>Evolução Mensal do Consumo upMiner (Janeiro a Agosto de 2026)</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Total de créditos e pesquisas consumidas mês a mês em BD e CT
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-brand-blue"></span>
              <span className="font-semibold text-gray-700">BD / Prospecção</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
              <span className="font-semibold text-gray-700">CT (Casos Ativos)</span>
            </div>
          </div>
        </div>

        {/* Grid de Barras Mensais (8 Meses) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {evolucaoMensal.map((item) => {
            const heightPct = Math.max(15, Math.round((item.valorTotal / maxEvolucaoValor) * 100));
            const isSelected = selectedMonth === item.mes || localMonth === item.mes;

            return (
              <div
                key={item.mes}
                className={`rounded-2xl border p-3 flex flex-col justify-between text-center transition-all ${
                  isSelected
                    ? 'border-brand-blue ring-2 ring-brand-blue/20 bg-blue-50/50 shadow-xs'
                    : 'border-gray-200/80 bg-gray-50/60 hover:border-gray-300'
                }`}
              >
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-navy">
                    {item.mes}
                  </span>
                </div>

                {/* Coluna / Barra do Gráfico */}
                <div className="my-3 flex flex-col items-center justify-end h-28">
                  <span className="text-[11px] font-serif font-bold text-gray-900 mb-1">
                    {formatarMoeda(item.valorTotal)}
                  </span>
                  <div className="w-10 bg-gray-200 rounded-t-lg h-20 flex items-end overflow-hidden">
                    <div
                      className={`w-full rounded-t-lg transition-all duration-700 ${
                        isSelected
                          ? 'bg-brand-navy'
                          : 'bg-gradient-to-t from-brand-navy to-brand-blue'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    ></div>
                  </div>
                </div>

                {/* Subtítulo: Lançamentos no mês */}
                <div className="pt-2 border-t border-gray-200/60 text-[10px] text-gray-500">
                  {item.count} pesquisas
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. AGRUPAMENTO POR ÁREA E POR FRENTE                                */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel por Área (UNs normalizadas + EXPANSÃO + CLIENTE/CASO mantidos) */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2">
                  <Building size={17} className="text-brand-blue" />
                  <span>Consumo por Área e Destinação</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  UNs padronizadas com normalizarUN(); "EXPANSÃO" e "CLIENTE/CASO" preservados
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
              {statsPorArea.map((item) => {
                const barWidth = (item.valor / maxAreaValor) * 100;
                const isEspecial = item.area === 'CLIENTE/CASO' || item.area === 'EXPANSÃO';

                return (
                  <div
                    key={item.area}
                    className="bg-gray-50/70 p-3 rounded-xl border border-gray-200/60 hover:bg-gray-100/70 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-semibold text-gray-900 truncate">
                          {item.area}
                        </span>
                        {isEspecial && (
                          <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded font-medium">
                            Direto
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-bold text-brand-navy">
                          {formatarMoeda(item.valor)}
                        </span>
                        <span className="text-[11px] text-gray-500 bg-white border border-gray-200 px-1.5 py-0.5 rounded font-medium">
                          {item.pct.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200/80 rounded-full h-2 overflow-hidden mb-1">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          item.area === 'CLIENTE/CASO'
                            ? 'bg-emerald-600'
                            : item.area === 'EXPANSÃO'
                            ? 'bg-amber-600'
                            : 'bg-brand-blue'
                        }`}
                        style={{ width: `${barWidth}%` }}
                      ></div>
                    </div>
                    <div className="text-[10px] text-gray-400 text-right">
                      {item.count} pesquisas registradas
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Painel por Frente (BD / Prospecção vs CT) */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2">
                  <Target size={17} className="text-brand-blue" />
                  <span>Distribuição por Frente Operacional</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Comparativo de uso para Novos Negócios (BD) vs. Casos Ativos (CT)
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {statsPorFrente.map((frente) => {
                return (
                  <div
                    key={frente.frente}
                    className="p-4 rounded-2xl border border-gray-200/80 bg-gray-50/60 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-gray-900 text-sm">
                          {frente.frente}
                        </span>
                        <span className="font-serif font-bold text-brand-navy text-base">
                          {formatarMoeda(frente.valor)}
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 mb-3">
                        {frente.descricao}
                      </p>
                    </div>

                    <div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden mb-2">
                        <div
                          className={`${frente.corBarra} h-full rounded-full transition-all duration-500`}
                          style={{ width: `${frente.pct}%` }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-600 font-medium">
                        <span>{frente.count} lançamentos</span>
                        <span className="bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-800">
                          {frente.pct.toFixed(1)}% do consumo
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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
                <FileText size={18} className="text-brand-blue" />
                <span>Base Individual de Lançamentos upMiner</span>
                <span className="text-xs font-sans font-normal text-gray-500">
                  ({displayRecords.length} de {normalizedData.length} registros)
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Rastreabilidade de cada pesquisa, valor debitado e frente responsável
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Filtro por Frente */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-500 font-medium">Frente:</span>
                <select
                  value={selectedFrente}
                  onChange={(e) => setSelectedFrente(e.target.value)}
                  className="bg-white border border-gray-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue text-gray-800 font-medium"
                >
                  <option value="todas">Todas as Frentes</option>
                  <option value="BD">BD / Prospecção</option>
                  <option value="CT">CT (Casos Ativos)</option>
                </select>
              </div>

              {/* Filtro Local por Mês (caso selecionado na página seja "Todos os meses") */}
              {selectedMonth === 'Todos os meses' && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-gray-500 font-medium">Mês:</span>
                  <select
                    value={localMonth}
                    onChange={(e) => setLocalMonth(e.target.value)}
                    className="bg-white border border-gray-200 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue text-gray-800 font-medium"
                  >
                    <option value="todos">Todos os meses</option>
                    {MESES_UPMINER.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Busca por Área */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar área, cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border border-gray-200 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent text-gray-800 placeholder-gray-400 w-40 sm:w-52"
                />
              </div>

              {/* Botão Exportar Excel */}
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-xl transition-all shadow-2xs hover:border-gray-300 cursor-pointer"
                title="Exportar base completa do upMiner para Excel"
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
                <th className="py-3 px-4 w-32">Mês</th>
                <th className="py-3 px-4 min-w-[240px]">Área / Centro de Custo</th>
                <th className="py-3 px-4 w-48">Frente</th>
                <th className="py-3 px-4 text-center w-36 font-bold text-gray-900">Valor Usado (R$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    Nenhum lançamento encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                displayRecords.map((item, idx) => {
                  const isCT = item.frenteFormatada.startsWith('CT');

                  return (
                    <tr
                      key={`${item.mes}-${item.area}-${item.valor}-${idx}`}
                      className="hover:bg-blue-50/20 transition-colors"
                    >
                      {/* Numeração */}
                      <td className="py-3.5 px-4 text-center text-gray-400 text-xs">
                        {idx + 1}
                      </td>

                      {/* Mês */}
                      <td className="py-3.5 px-4 font-semibold text-gray-700 whitespace-nowrap text-xs">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 text-xs font-semibold">
                          {item.mes}
                        </span>
                      </td>

                      {/* Área */}
                      <td className="py-3.5 px-4 font-semibold text-gray-900 whitespace-nowrap">
                        {item.areaNormalizada}
                      </td>

                      {/* Frente */}
                      <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md font-medium border ${
                            isCT
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-blue-50 text-brand-blue border-blue-200'
                          }`}
                        >
                          {item.frenteFormatada}
                        </span>
                      </td>

                      {/* Valor */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap font-serif font-bold text-emerald-800 text-sm">
                        {formatarMoeda(item.valor)}
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
              Exibindo <strong>{displayRecords.length} lançamentos</strong> no período de <strong>{selectedMonth}</strong>.
            </span>
            <div className="flex items-center gap-4">
              <span>
                Total filtrado: <strong className="text-emerald-700">{formatarMoeda(displayRecords.reduce((acc, d) => acc + d.valor, 0))}</strong>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
