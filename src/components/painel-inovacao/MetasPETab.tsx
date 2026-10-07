import React, { useState, useMemo } from 'react';
import {
  InovacaoMetaPE,
  InovacaoConfigPE,
  InovacaoProjeto,
  InovacaoEtapas,
  InovacaoAdocao,
  InovacaoValorQualidade,
  PILAR_PE_OPTIONS
} from '../../types/painelInovacao';
import { apurarMetasPE } from '../../utils/painelInovacaoCalculos';
import {
  Target,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Save,
  X,
  Search,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Props {
  metas: InovacaoMetaPE[];
  configPE: InovacaoConfigPE;
  projetos: InovacaoProjeto[];
  etapas: InovacaoEtapas[];
  adocoes: InovacaoAdocao[];
  valores: InovacaoValorQualidade[];
  isAdmin: boolean;
  onSalvarMeta: (meta: InovacaoMetaPE) => Promise<void>;
  onExcluirMeta?: (id: string) => Promise<void>;
  onSalvarAnoApuracao: (ano: number) => Promise<void>;
}

const TIPO_META_SUGESTOES = [
  'Percentual (%)',
  'Horas (h)',
  'Quantidade (un)',
  'Pessoas',
  'Nota (1 a 5)',
  'R$ (Milhares)'
];

export const MetasPETab: React.FC<Props> = ({
  metas,
  configPE,
  projetos,
  etapas,
  adocoes,
  valores,
  isAdmin,
  onSalvarMeta,
  onExcluirMeta,
  onSalvarAnoApuracao
}) => {
  // Modal de criação / edição de todos os campos da meta
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<InovacaoMetaPE>>({});
  const [isNovaMeta, setIsNovaMeta] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Confirmação de exclusão
  const [metaParaExcluir, setMetaParaExcluir] = useState<InovacaoMetaPE | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  // Ano de apuração
  const [editAno, setEditAno] = useState(false);
  const [anoTemp, setAnoTemp] = useState<number>(configPE.ano_apuracao || 2026);
  const [salvandoAno, setSalvandoAno] = useState(false);

  // Filtros
  const [filtroPilar, setFiltroPilar] = useState('todos');
  const [termoBusca, setTermoBusca] = useState('');

  // Apuração ao vivo a partir das coleções
  const apuracao = useMemo(() => {
    return apurarMetasPE(metas, projetos, etapas, adocoes, valores);
  }, [metas, projetos, etapas, adocoes, valores]);

  // Lista de metas filtradas
  const metasFiltradas = useMemo(() => {
    return metas.filter((m) => {
      if (filtroPilar !== 'todos' && m.pilar !== filtroPilar) return false;
      if (termoBusca.trim()) {
        const termo = termoBusca.toLowerCase();
        const codigoMatch = m.codigo.toLowerCase().includes(termo);
        const indicadorMatch = m.indicador.toLowerCase().includes(termo);
        const descMatch = (m.o_que_mede || '').toLowerCase().includes(termo);
        if (!codigoMatch && !indicadorMatch && !descMatch) return false;
      }
      return true;
    });
  }, [metas, filtroPilar, termoBusca]);

  // Estatísticas resumo
  const estatisticas = useMemo(() => {
    let atingidas = 0;
    let emCurso = 0;
    let abaixo = 0;

    metas.forEach((m) => {
      const ap = apuracao[m.codigo];
      const percentual = ap ? ap.atingimento : 0;
      if (percentual >= 100) atingidas++;
      else if (percentual >= 50) emCurso++;
      else abaixo++;
    });

    return { total: metas.length, atingidas, emCurso, abaixo };
  }, [metas, apuracao]);

  // Sugerir próximo código M
  const gerarProximoCodigo = () => {
    let maxNum = 0;
    metas.forEach((m) => {
      if (m.codigo && m.codigo.toUpperCase().startsWith('M')) {
        const num = parseInt(m.codigo.substring(1), 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
    return `M${maxNum + 1}`;
  };

  // Abrir modal para Nova Meta
  const handleNovaMeta = () => {
    if (!isAdmin) return;
    const proximoCod = gerarProximoCodigo();
    setFormData({
      id: proximoCod,
      codigo: proximoCod,
      pilar: PILAR_PE_OPTIONS[0],
      indicador: '',
      o_que_mede: '',
      tipo_meta: 'Percentual (%)',
      meta: 100,
      realizado_manual: 0
    });
    setIsNovaMeta(true);
    setIsModalOpen(true);
  };

  // Abrir modal para Editar todos os campos
  const handleEditarMeta = (m: InovacaoMetaPE) => {
    if (!isAdmin) return;
    const ap = apuracao[m.codigo];
    setFormData({
      id: m.id,
      codigo: m.codigo,
      pilar: m.pilar,
      indicador: m.indicador,
      o_que_mede: m.o_que_mede,
      tipo_meta: m.tipo_meta,
      meta: m.meta,
      realizado_manual: typeof m.realizado_manual === 'number' ? m.realizado_manual : (ap ? ap.realizado : 0)
    });
    setIsNovaMeta(false);
    setIsModalOpen(true);
  };

  // Salvar Meta
  const handleSubmitMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      setSalvando(true);
      const codigoLimpo = (formData.codigo || '').trim().toUpperCase() || gerarProximoCodigo();
      const indicadorLimpo = (formData.indicador || '').trim() || 'Indicador Estratégico';
      const payload: InovacaoMetaPE = {
        id: formData.id || codigoLimpo,
        codigo: codigoLimpo,
        pilar: formData.pilar || PILAR_PE_OPTIONS[0],
        indicador: indicadorLimpo,
        o_que_mede: (formData.o_que_mede || '').trim(),
        tipo_meta: (formData.tipo_meta || 'Percentual (%)').trim(),
        meta: Number(formData.meta) || 0,
        realizado_manual: formData.realizado_manual !== undefined && formData.realizado_manual !== null
          ? Number(formData.realizado_manual)
          : undefined,
        updatedAt: new Date().toISOString()
      };

      await onSalvarMeta(payload);
      setIsModalOpen(false);
    } catch (err: any) {
      alert('Erro ao salvar meta: ' + err.message);
    } finally {
      setSalvando(false);
    }
  };

  // Excluir Meta
  const handleConfirmarExclusao = async () => {
    if (!metaParaExcluir || !isAdmin || !onExcluirMeta) return;
    try {
      setExcluindo(true);
      await onExcluirMeta(metaParaExcluir.id);
      setMetaParaExcluir(null);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Erro ao excluir meta:', err);
    } finally {
      setExcluindo(false);
    }
  };

  // Salvar Ano
  const handleSalvarAno = async () => {
    if (!isAdmin) return;
    try {
      setSalvandoAno(true);
      await onSalvarAnoApuracao(anoTemp);
      setEditAno(false);
    } catch (err: any) {
      alert('Erro ao salvar ano de apuração: ' + err.message);
    } finally {
      setSalvandoAno(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Top Header do PE ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#00B2FF]">
              <Target size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 font-serif">
                Metas do Planejamento Estratégico (PE)
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Indicadores estratégicos corporativos com acompanhamento de metas e apuração em tempo real
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Ano de Apuração */}
          <div className="flex items-center gap-2 bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-200">
            <Calendar size={14} className="text-[#00B2FF]" />
            <span className="text-xs text-gray-600 font-medium">Ano de Apuração:</span>
            {editAno ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="2020"
                  max="2035"
                  value={anoTemp}
                  onChange={(e) => setAnoTemp(parseInt(e.target.value, 10) || 2026)}
                  className="w-20 px-2 py-0.5 text-xs font-bold text-gray-900 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-[#00B2FF]"
                />
                <button
                  onClick={handleSalvarAno}
                  disabled={salvandoAno}
                  className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded cursor-pointer"
                >
                  {salvandoAno ? '...' : 'OK'}
                </button>
                <button
                  onClick={() => setEditAno(false)}
                  className="px-1.5 py-0.5 bg-gray-200 text-gray-700 text-[11px] rounded cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-gray-900">
                  {configPE.ano_apuracao || 2026}
                </span>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setAnoTemp(configPE.ano_apuracao || 2026);
                      setEditAno(true);
                    }}
                    className="p-1 text-gray-400 hover:text-[#00B2FF] cursor-pointer"
                    title="Alterar ano de apuração"
                  >
                    <Edit2 size={12} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Botão de Inserir Nova Meta */}
          {isAdmin && (
            <button
              onClick={handleNovaMeta}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#00B2FF] hover:bg-[#009de0] text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus size={15} />
              Nova Meta Estratégica
            </button>
          )}
        </div>
      </div>

      {/* ── Cards de Indicadores de Atingimento ──────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
          <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
            Total de Metas
          </div>
          <div className="text-xl font-bold text-gray-900 mt-1 font-serif">
            {estatisticas.total}
          </div>
          <div className="text-[11px] text-gray-400 mt-0.5">Indicadores cadastrados</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
          <div className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider">
            Metas Atingidas
          </div>
          <div className="text-xl font-bold text-emerald-600 mt-1 font-serif">
            {estatisticas.atingidas}
          </div>
          <div className="text-[11px] text-emerald-700 mt-0.5 font-medium">
            ≥ 100% de atingimento
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
          <div className="text-[11px] font-medium text-amber-700 uppercase tracking-wider">
            Metas Em Curso
          </div>
          <div className="text-xl font-bold text-amber-600 mt-1 font-serif">
            {estatisticas.emCurso}
          </div>
          <div className="text-[11px] text-amber-700 mt-0.5 font-medium">
            50% a 99% de atingimento
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
          <div className="text-[11px] font-medium text-[#b83822] uppercase tracking-wider">
            Metas Abaixo
          </div>
          <div className="text-xl font-bold text-[#b83822] mt-1 font-serif">
            {estatisticas.abaixo}
          </div>
          <div className="text-[11px] text-[#b83822] mt-0.5 font-medium">
            &lt; 50% de atingimento
          </div>
        </div>
      </div>

      {/* ── Barra de Filtros e Busca ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Filtrar por Pilar:
            </label>
            <select
              value={filtroPilar}
              onChange={(e) => setFiltroPilar(e.target.value)}
              className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-[#00B2FF] text-gray-800 font-medium"
            >
              <option value="todos">Todos os pilares</option>
              {PILAR_PE_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={13} />
            <input
              type="text"
              placeholder="Buscar meta ou indicador..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="text-xs pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00B2FF] text-gray-800 w-56"
            />
          </div>
        </div>

        <div className="text-xs text-gray-500 font-medium self-end sm:self-auto">
          Exibindo <span className="font-bold text-gray-800">{metasFiltradas.length}</span> de{' '}
          <span className="font-bold text-gray-800">{metas.length}</span> metas
        </div>
      </div>

      {/* ── Tabela das Metas Estratégicas ─────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1050px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200/80 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3.5 w-20 text-center">Código</th>
                <th className="py-3 px-3.5 min-w-[180px]">Pilar Estratégico</th>
                <th className="py-3 px-3.5 min-w-[260px]">Indicador & Descrição</th>
                <th className="py-3 px-3.5 text-center w-28">Tipo / Unidade</th>
                <th className="py-3 px-3.5 text-center font-bold text-gray-900 w-28">
                  Meta Definida
                </th>
                <th className="py-3 px-3.5 text-center font-bold text-[#00B2FF] w-28">
                  Realizado
                </th>
                <th className="py-3 px-3.5 text-center font-bold text-gray-900 w-36">
                  Atingimento (%)
                </th>
                <th className="py-3 px-3.5 text-center w-28">Status</th>
                {isAdmin && <th className="py-3 px-3.5 text-center w-24">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {metasFiltradas.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 9 : 8}
                    className="py-12 text-center text-gray-400 text-xs font-medium"
                  >
                    Nenhuma meta encontrada para os filtros aplicados.
                  </td>
                </tr>
              ) : (
                metasFiltradas.map((m) => {
                  const apurado = apuracao[m.codigo] || {
                    realizado: typeof m.realizado_manual === 'number' ? m.realizado_manual : 0,
                    atingimento: m.meta > 0 ? Number((((m.realizado_manual || 0) / m.meta) * 100).toFixed(1)) : 0,
                    meta: m.meta,
                    unidade: m.tipo_meta
                  };

                  const percentual = apurado.atingimento;
                  const atingiu = percentual >= 100;
                  const emProgresso = percentual >= 50 && percentual < 100;

                  return (
                    <tr key={m.id} className="hover:bg-sky-50/40 transition-colors">
                      {/* Código M1.. */}
                      <td className="py-3.5 px-3.5 text-center font-mono font-bold text-gray-900 text-sm">
                        {m.codigo}
                      </td>

                      {/* Pilar */}
                      <td className="py-3.5 px-3.5">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-800">
                          {m.pilar}
                        </span>
                      </td>

                      {/* Indicador e O Que Mede */}
                      <td className="py-3.5 px-3.5">
                        <div className="font-semibold text-gray-900 text-xs">
                          {m.indicador}
                        </div>
                        {m.o_que_mede && (
                          <div className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                            {m.o_que_mede}
                          </div>
                        )}
                      </td>

                      {/* Tipo / Unidade */}
                      <td className="py-3.5 px-3.5 text-center text-gray-600 font-medium text-[11px]">
                        {m.tipo_meta}
                      </td>

                      {/* Meta Definida */}
                      <td className="py-3.5 px-3.5 text-center font-bold text-gray-900 text-xs">
                        {m.meta}
                      </td>

                      {/* Realizado */}
                      <td className="py-3.5 px-3.5 text-center font-bold text-[#00B2FF] text-xs">
                        {apurado.realizado}
                      </td>

                      {/* % Atingimento */}
                      <td className="py-3.5 px-3.5 text-center">
                        <div className="flex flex-col items-center">
                          <span
                            className={`font-bold text-xs ${
                              atingiu
                                ? 'text-emerald-600'
                                : emProgresso
                                ? 'text-amber-600'
                                : 'text-[#b83822]'
                            }`}
                          >
                            {percentual}%
                          </span>
                          <div className="w-20 bg-gray-200 rounded-full h-1.5 mt-1">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                atingiu
                                  ? 'bg-emerald-500'
                                  : emProgresso
                                  ? 'bg-amber-500'
                                  : 'bg-[#FC745C]'
                              }`}
                              style={{ width: `${Math.min(Math.max(percentual, 0), 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Status Semafórico (sem emojis) */}
                      <td className="py-3.5 px-3.5 text-center">
                        {atingiu ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 text-center">
                            Atingida
                          </span>
                        ) : emProgresso ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 text-center">
                            Em curso
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-[#b83822] border border-rose-200 text-center">
                            Abaixo
                          </span>
                        )}
                      </td>

                      {/* Ações (Editar e Excluir) */}
                      {isAdmin && (
                        <td className="py-3.5 px-3.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleEditarMeta(m)}
                              className="p-1.5 text-gray-500 hover:text-[#00B2FF] hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
                              title="Editar todos os campos da meta"
                            >
                              <Edit2 size={13} />
                            </button>
                            {onExcluirMeta && (
                              <button
                                onClick={() => setMetaParaExcluir(m)}
                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Excluir meta"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal de Criação / Edição de Todos os Campos da Meta ────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Cabeçalho do Modal */}
            <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#00B2FF]">
                  <Target size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm font-serif">
                    {isNovaMeta ? 'Inserir Nova Meta do PE' : `Editar Meta - ${formData.codigo || ''}`}
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {isNovaMeta
                      ? 'Cadastre um novo indicador estratégico corporativo'
                      : 'Edite todos os campos da meta estratégica selecionada'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Formulário com todos os campos */}
            <form onSubmit={handleSubmitMeta} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Código */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Código da Meta
                  </label>
                  <input
                    type="text"
                    value={formData.codigo || ''}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                    placeholder="Ex: M1, M10, MET-01"
                    className="w-full text-xs font-mono font-bold bg-white border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#00B2FF] text-gray-900"
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">Identificador único do indicador</p>
                </div>

                {/* Pilar Estratégico */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Pilar Estratégico
                  </label>
                  <select
                    value={formData.pilar || PILAR_PE_OPTIONS[0]}
                    onChange={(e) => setFormData({ ...formData, pilar: e.target.value })}
                    className="w-full text-xs bg-white border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#00B2FF] text-gray-800 font-medium"
                  >
                    {PILAR_PE_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                    {!PILAR_PE_OPTIONS.includes(formData.pilar as any) && formData.pilar && (
                      <option value={formData.pilar}>{formData.pilar}</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Indicador (Nome / Título) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Indicador Estratégico
                </label>
                <input
                  type="text"
                  value={formData.indicador || ''}
                  onChange={(e) => setFormData({ ...formData, indicador: e.target.value })}
                  placeholder="Ex: Horas Economizadas Acumuladas"
                  className="w-full text-xs font-medium bg-white border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#00B2FF] text-gray-900"
                />
              </div>

              {/* O que mede / Descrição detalhada */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Descrição & O Que Mede
                </label>
                <textarea
                  rows={2}
                  value={formData.o_que_mede || ''}
                  onChange={(e) => setFormData({ ...formData, o_que_mede: e.target.value })}
                  placeholder="Descreva a finalidade, fórmula ou critérios de aferição deste indicador..."
                  className="w-full text-xs bg-white border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#00B2FF] text-gray-800 resize-none leading-relaxed"
                />
              </div>

              {/* Tipo / Unidade e Valores */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Tipo / Unidade */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Tipo / Unidade
                  </label>
                  <input
                    type="text"
                    list="lista-tipos-meta"
                    value={formData.tipo_meta || ''}
                    onChange={(e) => setFormData({ ...formData, tipo_meta: e.target.value })}
                    placeholder="Ex: Percentual (%)"
                    className="w-full text-xs bg-white border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#00B2FF] text-gray-800"
                  />
                  <datalist id="lista-tipos-meta">
                    {TIPO_META_SUGESTOES.map((t) => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                </div>

                {/* Meta Definida */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Meta Definida
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.meta ?? ''}
                    onChange={(e) => setFormData({ ...formData, meta: parseFloat(e.target.value) || 0 })}
                    placeholder="Ex: 100"
                    className="w-full text-xs font-bold bg-white border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#00B2FF] text-gray-900"
                  />
                </div>

                {/* Realizado (Manual / Opcional) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Realizado (Manual)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.realizado_manual ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        realizado_manual: e.target.value === '' ? undefined : parseFloat(e.target.value) || 0
                      })
                    }
                    placeholder="Ex: 85"
                    className="w-full text-xs font-bold bg-white border border-gray-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#00B2FF] text-[#00B2FF]"
                  />
                </div>
              </div>

              {/* Informação explicativa */}
              <div className="bg-sky-50/60 border border-sky-100 rounded-xl p-3 text-[11px] text-sky-900 leading-relaxed flex items-start gap-2">
                <CheckCircle size={15} className="text-[#00B2FF] shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold text-sky-950">Apuração em tempo real:</strong> Para os indicadores padrões M1 a M9, o sistema calcula o valor realizado automaticamente a partir do portfólio caso o campo <em>Realizado (Manual)</em> não seja preenchido. Para novas metas criadas, o valor informado em <em>Realizado</em> será usado para calcular o atingimento.
                </div>
              </div>

              {/* Rodapé com botões de ação */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2.5">
                <div>
                  {!isNovaMeta && isAdmin && onExcluirMeta && formData.id && (
                    <button
                      type="button"
                      onClick={() => setMetaParaExcluir(formData as InovacaoMetaPE)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                    >
                      <Trash2 size={14} />
                      Excluir Meta
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={salvando}
                    className="inline-flex items-center gap-1.5 px-4.5 py-2 bg-[#00B2FF] hover:bg-[#009de0] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Save size={14} />
                    {salvando ? 'Salvando...' : 'Salvar Meta'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal de Confirmação de Exclusão ──────────────────────────── */}
      {metaParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-gray-100 p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-[#b83822] flex items-center justify-center mx-auto mb-3">
              <AlertCircle size={24} />
            </div>
            <h4 className="font-bold text-gray-900 text-sm font-serif">
              Excluir Meta Estratégica?
            </h4>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              Tem certeza que deseja remover a meta{' '}
              <span className="font-bold text-gray-800">
                {metaParaExcluir.codigo} - {metaParaExcluir.indicador}
              </span>
              ? Esta ação removerá a meta do painel e do cálculo de atingimento.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                onClick={() => setMetaParaExcluir(null)}
                disabled={excluindo}
                className="px-3.5 py-1.5 border border-gray-200 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarExclusao}
                disabled={excluindo}
                className="px-3.5 py-1.5 bg-[#b83822] hover:bg-[#962e1b] text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {excluindo ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
