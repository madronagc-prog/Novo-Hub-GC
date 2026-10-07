import React, { useState, useMemo } from 'react';
import {
  InovacaoProjeto,
  TIPO_INICIATIVA_OPTIONS,
  CATEGORIA_INICIATIVA_OPTIONS,
  PILAR_PE_OPTIONS,
  PRIORIDADE_OPTIONS,
  ALCADA_OPTIONS,
  DECISAO_COMITE_OPTIONS,
  ETAPA_ATUAL_OPTIONS,
  SITUACAO_OPTIONS,
  SAUDE_PROJETO_OPTIONS,
  SIM_NAO_OPTIONS,
  NIVEL_RISCO_OPTIONS,
  MODELO_CUSTO_OPTIONS,
  UN_AREAS_SUGERIDAS
} from '../../types/painelInovacao';
import {
  calcularIdadeItemEmAberto,
  calcularCicloAteGoLive,
  calcularDesvioPrazo,
  calcularPercentualOrcamento,
  calcularAlertaAutomatico,
  formatarMoeda,
  formatarDataBr,
  gerarProximoIdInovacao
} from '../../utils/painelInovacaoCalculos';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Lock,
  X,
  Save,
  AlertTriangle
} from 'lucide-react';

interface Props {
  projetos: InovacaoProjeto[];
  isAdmin: boolean;
  onSalvarProjeto: (projeto: InovacaoProjeto, isNovo: boolean) => Promise<void>;
  onExcluirProjeto: (id: string) => Promise<void>;
}

export const ProjetosTab: React.FC<Props> = ({
  projetos,
  isAdmin,
  onSalvarProjeto,
  onExcluirProjeto
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroSituacao, setFiltroSituacao] = useState('todos');
  const [filtroSaude, setFiltroSaude] = useState('todos');
  const [filtroUN, setFiltroUN] = useState('todos');

  // Estado do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalIsNovo, setModalIsNovo] = useState(false);
  const [formData, setFormData] = useState<Partial<InovacaoProjeto>>({});
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState('');

  // Confirmação de exclusão em modal (compatível com iframe)
  const [projetoParaExcluir, setProjetoParaExcluir] = useState<InovacaoProjeto | null>(null);
  const [excluindoProjeto, setExcluindoProjeto] = useState(false);

  // Filtragem
  const projetosFiltrados = useMemo(() => {
    return projetos.filter((p) => {
      if (filtroSituacao !== 'todos' && p.situacao !== filtroSituacao) return false;
      if (filtroSaude !== 'todos' && p.saude_projeto !== filtroSaude) return false;
      if (filtroUN !== 'todos' && p.un_area !== filtroUN) return false;

      if (searchTerm.trim() !== '') {
        const termo = searchTerm.toLowerCase();
        const matchId = p.id.toLowerCase().includes(termo);
        const matchNome = p.projeto.toLowerCase().includes(termo);
        const matchFornec = (p.ferramenta_fornecedor || '').toLowerCase().includes(termo);
        const matchDor = (p.dor_resolvida || '').toLowerCase().includes(termo);
        const matchResp = (p.responsavel_gc || '').toLowerCase().includes(termo);
        if (!matchId && !matchNome && !matchFornec && !matchDor && !matchResp) return false;
      }
      return true;
    });
  }, [projetos, filtroSituacao, filtroSaude, filtroUN, searchTerm]);

  // Abrir Modal para Novo Projeto
  const handleNovoProjeto = () => {
    if (!isAdmin) return;
    const novoId = gerarProximoIdInovacao(projetos);
    const hojeStr = new Date().toISOString().split('T')[0];

    setFormData({
      id: novoId,
      projeto: '',
      tipo_iniciativa: 'Automação de Processos',
      categoria: 'Software / SaaS',
      ferramenta_fornecedor: '',
      dor_resolvida: '',
      un_area: 'Geral / Todas as UNs',
      socio_sponsor: '',
      responsavel_gc: '',
      pilar_pe: 'Eficiência e Produtividade',
      prioridade: 'Média',
      alcada: 'Comitê GC',
      decisao_comite: 'Em Análise',
      etapa_atual: '1. Mapeamento de Ferramentas',
      situacao: 'Planejado',
      saude_projeto: 'No prazo',
      bloqueado: 'Não',
      risco_principal: '',
      nivel_risco: 'Baixo',
      data_pedido: hojeStr,
      golive_previsto_linha_base: '',
      golive_previsto_atual: '',
      golive_realizado: '',
      orcamento_previsto: 0,
      custo_realizado: 0,
      modelo_custo: 'Assinatura Mensal',
      licencas_contratadas: 0,
      proximo_passo: '',
      ultima_atualizacao: hojeStr
    });
    setModalIsNovo(true);
    setErroForm('');
    setIsModalOpen(true);
  };

  // Abrir Modal para Edição
  const handleEditarProjeto = (p: InovacaoProjeto) => {
    setFormData({ ...p });
    setModalIsNovo(false);
    setErroForm('');
    setIsModalOpen(true);
  };

  // Salvar formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSalvando(true);
      const hojeStr = new Date().toISOString().split('T')[0];
      const projetoNome = formData.projeto?.trim() || `Iniciativa ${formData.id || ''}`.trim() || 'Nova Iniciativa';
      const payload: InovacaoProjeto = {
        ...(formData as InovacaoProjeto),
        projeto: projetoNome,
        ultima_atualizacao: hojeStr
      };
      await onSalvarProjeto(payload, modalIsNovo);
      setIsModalOpen(false);
    } catch (err: any) {
      setErroForm(err.message || 'Erro ao salvar projeto no Firestore.');
    } finally {
      setSalvando(false);
    }
  };

  // Badge Semáforo Saúde (sem emojis nem marcadores)
  const renderSaudeBadge = (saude: string) => {
    if (saude === 'No prazo') {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 text-center">
          No prazo
        </span>
      );
    }
    if (saude === 'Atenção') {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 text-center">
          Atenção
        </span>
      );
    }
    return (
      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-[#b83822] border border-rose-200 text-center">
        Atrasado
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* ── Controles e Filtros ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Busca por Texto */}
          <div className="relative min-w-[220px] flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar ID, projeto, fornecedor, dor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00B2FF] text-gray-800 placeholder-gray-400"
            />
          </div>

          {/* Filtro Situação */}
          <select
            value={filtroSituacao}
            onChange={(e) => setFiltroSituacao(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#00B2FF] text-gray-700"
          >
            <option value="todos">Todas as situações</option>
            {SITUACAO_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Filtro Saúde */}
          <select
            value={filtroSaude}
            onChange={(e) => setFiltroSaude(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#00B2FF] text-gray-700"
          >
            <option value="todos">Toda saúde</option>
            {SAUDE_PROJETO_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Filtro UN */}
          <select
            value={filtroUN}
            onChange={(e) => setFiltroUN(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#00B2FF] text-gray-700"
          >
            <option value="todos">Todas as UNs / Áreas</option>
            {UN_AREAS_SUGERIDAS.map((un) => (
              <option key={un} value={un}>{un}</option>
            ))}
          </select>
        </div>

        {/* Botão Novo Projeto (apenas Admins) */}
        {isAdmin && (
          <button
            onClick={handleNovoProjeto}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#00B2FF] hover:bg-[#009de0] text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer whitespace-nowrap self-start md:self-auto"
          >
            <Plus size={15} />
            Novo Projeto
          </button>
        )}
      </div>

      {/* ── Tabela Interativa de Projetos ──────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200/80 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3.5 w-24">ID</th>
                <th className="py-3 px-3.5 min-w-[200px]">Projeto & Fornecedor</th>
                <th className="py-3 px-3.5 text-center">UN / Área</th>
                <th className="py-3 px-3.5 text-center">Etapa Atual</th>
                <th className="py-3 px-3.5 text-center">Situação</th>
                <th className="py-3 px-3.5 text-center">Saúde</th>
                <th className="py-3 px-3.5 text-center">Alerta</th>
                <th className="py-3 px-3.5 text-center">Idade</th>
                <th className="py-3 px-3.5 text-center">Desvio</th>
                <th className="py-3 px-3.5 text-center">Orçamento / Custo</th>
                <th className="py-3 px-3.5 text-center">Go Live</th>
                <th className="py-3 px-3.5 text-center w-20">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {projetosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-gray-400">
                    Nenhuma iniciativa encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                projetosFiltrados.map((p) => {
                  const idade = calcularIdadeItemEmAberto(p);
                  const desvio = calcularDesvioPrazo(p);
                  const percOrc = calcularPercentualOrcamento(p);
                  const alerta = calcularAlertaAutomatico(p);

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-sky-50/40 transition-colors group"
                    >
                      {/* ID */}
                      <td className="py-3 px-3.5 font-mono font-bold text-gray-800">
                        {p.id}
                      </td>

                      {/* Projeto & Fornecedor */}
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-gray-900 leading-snug">
                          {p.projeto}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5">
                          <span className="font-medium text-gray-700">{p.ferramenta_fornecedor || 'Interno'}</span>
                          <span>•</span>
                          <span>{p.tipo_iniciativa}</span>
                        </div>
                      </td>

                      {/* UN / Área */}
                      <td className="py-3 px-3.5 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 font-medium text-[11px]">
                          {p.un_area}
                        </span>
                      </td>

                      {/* Etapa Atual */}
                      <td className="py-3 px-3.5 text-center text-gray-800 font-medium">
                        <span className="text-[11px] line-clamp-1" title={p.etapa_atual}>
                          {p.etapa_atual}
                        </span>
                      </td>

                      {/* Situação */}
                      <td className="py-3 px-3.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold text-center ${
                          p.situacao === 'Em Andamento'
                            ? 'bg-sky-50 text-[#00B2FF] border border-sky-200'
                            : p.situacao === 'Concluído'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : p.situacao === 'Planejado'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {p.situacao}
                        </span>
                      </td>

                      {/* Saúde */}
                      <td className="py-3 px-3.5 text-center">
                        {renderSaudeBadge(p.saude_projeto)}
                      </td>

                      {/* Alerta Automático Calculado (sem ícones/emojis) */}
                      <td className="py-3 px-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-medium text-center ${
                            alerta.tipo === 'critico'
                              ? 'bg-rose-50 text-[#b83822] border border-rose-200'
                              : alerta.tipo === 'atencao'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                          title={alerta.motivo}
                        >
                          {alerta.label}
                        </span>
                      </td>

                      {/* Idade (dias) */}
                      <td className="py-3 px-3.5 text-center text-gray-700 font-medium">
                        {idade}d
                      </td>

                      {/* Desvio (dias) */}
                      <td className="py-3 px-3.5 text-center">
                        {desvio === null ? (
                          <span className="text-gray-400">-</span>
                        ) : desvio > 0 ? (
                          <span className="text-[#b83822] font-semibold">+{desvio}d</span>
                        ) : desvio < 0 ? (
                          <span className="text-emerald-600 font-semibold">{desvio}d</span>
                        ) : (
                          <span className="text-gray-600 font-medium">0d</span>
                        )}
                      </td>

                      {/* Orçamento / Custo */}
                      <td className="py-3 px-3.5 text-center">
                        <div className="font-medium text-gray-900">
                          {formatarMoeda(p.custo_realizado)}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          Teto: {formatarMoeda(p.orcamento_previsto)} {percOrc !== null && `(${percOrc}%)`}
                        </div>
                      </td>

                      {/* Go Live */}
                      <td className="py-3 px-3.5 text-center">
                        <div className="text-gray-900 font-medium text-[11px]">
                          {p.golive_realizado ? formatarDataBr(p.golive_realizado) : formatarDataBr(p.golive_previsto_atual)}
                        </div>
                        <div className="text-[10px] text-gray-400" title="Linha base inicial">
                          LB: {formatarDataBr(p.golive_previsto_linha_base)}
                        </div>
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEditarProjeto(p)}
                            className="p-1 rounded-lg text-gray-400 hover:text-[#00B2FF] hover:bg-sky-50 transition-colors cursor-pointer"
                            title={isAdmin ? 'Editar iniciativa' : 'Visualizar detalhes'}
                          >
                            <Edit2 size={14} />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => setProjetoParaExcluir(p)}
                              className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Excluir iniciativa"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal de Criação / Edição de Projeto ────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-4xl max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60 rounded-t-2xl">
              <div>
                <h3 className="text-base font-bold text-gray-900 font-serif">
                  {modalIsNovo ? 'Cadastrar Nova Iniciativa de Inovação' : `Editar Iniciativa ${formData.id}`}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Preencha os campos da iniciativa com gravação direta no Firestore
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
              {erroForm && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-[#b83822] text-xs font-medium">
                  {erroForm}
                </div>
              )}

              {/* Linha 1: ID, Nome do Projeto */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    ID do Projeto
                  </label>
                  <input
                    type="text"
                    disabled
                    value={formData.id || ''}
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-gray-600"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nome da Iniciativa / Projeto
                  </label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={formData.projeto || ''}
                    onChange={(e) => setFormData({ ...formData, projeto: e.target.value })}
                    placeholder="Ex: Implantação de IA para Elaboração de Minutas"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF] focus:outline-none"
                  />
                </div>
              </div>

              {/* Linha 2: Tipo, Categoria, UN/Área, Fornecedor */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Tipo de Iniciativa
                  </label>
                  <select
                    disabled={!isAdmin}
                    value={formData.tipo_iniciativa || TIPO_INICIATIVA_OPTIONS[0]}
                    onChange={(e) => setFormData({ ...formData, tipo_iniciativa: e.target.value as any })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                  >
                    {TIPO_INICIATIVA_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Categoria
                  </label>
                  <select
                    disabled={!isAdmin}
                    value={formData.categoria || CATEGORIA_INICIATIVA_OPTIONS[0]}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value as any })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                  >
                    {CATEGORIA_INICIATIVA_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    UN / Área Beneficiada
                  </label>
                  <select
                    disabled={!isAdmin}
                    value={formData.un_area || UN_AREAS_SUGERIDAS[0]}
                    onChange={(e) => setFormData({ ...formData, un_area: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                  >
                    {UN_AREAS_SUGERIDAS.map((un) => (
                      <option key={un} value={un}>{un}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Ferramenta / Fornecedor
                  </label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={formData.ferramenta_fornecedor || ''}
                    onChange={(e) => setFormData({ ...formData, ferramenta_fornecedor: e.target.value })}
                    placeholder="Ex: Microsoft, Lexter, Interno"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                  />
                </div>
              </div>

              {/* Linha 3: Dor Resolvida */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Dor Resolvida / Objetivo do Negócio
                </label>
                <textarea
                  rows={2}
                  disabled={!isAdmin}
                  value={formData.dor_resolvida || ''}
                  onChange={(e) => setFormData({ ...formData, dor_resolvida: e.target.value })}
                  placeholder="Descreva o problema que a iniciativa busca mitigar..."
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                />
              </div>

              {/* Linha 4: Responsáveis, Pilar PE, Prioridade */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Sócio Sponsor
                  </label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={formData.socio_sponsor || ''}
                    onChange={(e) => setFormData({ ...formData, socio_sponsor: e.target.value })}
                    placeholder="Nome do Sócio"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Responsável GC
                  </label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={formData.responsavel_gc || ''}
                    onChange={(e) => setFormData({ ...formData, responsavel_gc: e.target.value })}
                    placeholder="Responsável pela gestão"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Pilar do Planejamento Estratégico
                  </label>
                  <select
                    disabled={!isAdmin}
                    value={formData.pilar_pe || PILAR_PE_OPTIONS[0]}
                    onChange={(e) => setFormData({ ...formData, pilar_pe: e.target.value as any })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                  >
                    {PILAR_PE_OPTIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Prioridade
                  </label>
                  <select
                    disabled={!isAdmin}
                    value={formData.prioridade || PRIORIDADE_OPTIONS[1]}
                    onChange={(e) => setFormData({ ...formData, prioridade: e.target.value as any })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                  >
                    {PRIORIDADE_OPTIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Linha 5: Governança (Alçada, Decisão, Etapa, Situação) */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Alçada
                  </label>
                  <select
                    disabled={!isAdmin}
                    value={formData.alcada || ALCADA_OPTIONS[1]}
                    onChange={(e) => setFormData({ ...formData, alcada: e.target.value as any })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                  >
                    {ALCADA_OPTIONS.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Decisão do Comitê
                  </label>
                  <select
                    disabled={!isAdmin}
                    value={formData.decisao_comite || DECISAO_COMITE_OPTIONS[1]}
                    onChange={(e) => setFormData({ ...formData, decisao_comite: e.target.value as any })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                  >
                    {DECISAO_COMITE_OPTIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Etapa Atual
                  </label>
                  <select
                    disabled={!isAdmin}
                    value={formData.etapa_atual || ETAPA_ATUAL_OPTIONS[0]}
                    onChange={(e) => setFormData({ ...formData, etapa_atual: e.target.value as any })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                  >
                    {ETAPA_ATUAL_OPTIONS.map((et) => (
                      <option key={et} value={et}>{et}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Situação
                  </label>
                  <select
                    disabled={!isAdmin}
                    value={formData.situacao || SITUACAO_OPTIONS[0]}
                    onChange={(e) => setFormData({ ...formData, situacao: e.target.value as any })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                  >
                    {SITUACAO_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Linha 6: Saúde, Bloqueio, Risco e Nível de Risco */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Saúde do Projeto
                  </label>
                  <select
                    disabled={!isAdmin}
                    value={formData.saude_projeto || SAUDE_PROJETO_OPTIONS[0]}
                    onChange={(e) => setFormData({ ...formData, saude_projeto: e.target.value as any })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                  >
                    {SAUDE_PROJETO_OPTIONS.map((sp) => (
                      <option key={sp} value={sp}>{sp}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Bloqueado?
                  </label>
                  <select
                    disabled={!isAdmin}
                    value={formData.bloqueado || 'Não'}
                    onChange={(e) => setFormData({ ...formData, bloqueado: e.target.value as any })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                  >
                    {SIM_NAO_OPTIONS.map((sn) => (
                      <option key={sn} value={sn}>{sn}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nível de Risco
                  </label>
                  <select
                    disabled={!isAdmin}
                    value={formData.nivel_risco || NIVEL_RISCO_OPTIONS[0]}
                    onChange={(e) => setFormData({ ...formData, nivel_risco: e.target.value as any })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                  >
                    {NIVEL_RISCO_OPTIONS.map((nr) => (
                      <option key={nr} value={nr}>{nr}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Risco Principal
                  </label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    value={formData.risco_principal || ''}
                    onChange={(e) => setFormData({ ...formData, risco_principal: e.target.value })}
                    placeholder="Descrição concisa do risco"
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                  />
                </div>
              </div>

              {/* Linha 7: Datas e Regra de Linha Base */}
              <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                    Datas e Marcos de Prazo
                  </span>
                  {!modalIsNovo && (
                    <span className="text-[11px] text-gray-500 flex items-center gap-1">
                      <Lock size={12} className="text-gray-400" />
                      Linha Base travada para não-administradores
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Data do Pedido
                    </label>
                    <input
                      type="date"
                      disabled={!isAdmin}
                      value={formData.data_pedido || ''}
                      onChange={(e) => setFormData({ ...formData, data_pedido: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                    />
                  </div>

                  {/* Campo golive_previsto_linha_base: editável apenas no cadastro OU se for admin */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                      Go Live Linha Base
                      {!modalIsNovo && !isAdmin && <Lock size={12} className="text-amber-500" />}
                    </label>
                    <input
                      type="date"
                      disabled={!modalIsNovo && !isAdmin}
                      value={formData.golive_previsto_linha_base || ''}
                      onChange={(e) => setFormData({ ...formData, golive_previsto_linha_base: e.target.value })}
                      className={`w-full rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF] ${
                        !modalIsNovo && !isAdmin
                          ? 'bg-gray-100 border border-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-white border border-gray-200'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Go Live Previsto Atual
                    </label>
                    <input
                      type="date"
                      disabled={!isAdmin}
                      value={formData.golive_previsto_atual || ''}
                      onChange={(e) => setFormData({ ...formData, golive_previsto_atual: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Go Live Realizado
                    </label>
                    <input
                      type="date"
                      disabled={!isAdmin}
                      value={formData.golive_realizado || ''}
                      onChange={(e) => setFormData({ ...formData, golive_realizado: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                    />
                  </div>
                </div>
              </div>

              {/* Linha 8: Orçamento, Custo, Modelo de Custo e Licenças */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Orçamento Previsto (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={!isAdmin}
                    value={formData.orcamento_previsto ?? 0}
                    onChange={(e) => setFormData({ ...formData, orcamento_previsto: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Custo Realizado (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={!isAdmin}
                    value={formData.custo_realizado ?? 0}
                    onChange={(e) => setFormData({ ...formData, custo_realizado: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Modelo de Custo
                  </label>
                  <select
                    disabled={!isAdmin}
                    value={formData.modelo_custo || MODELO_CUSTO_OPTIONS[0]}
                    onChange={(e) => setFormData({ ...formData, modelo_custo: e.target.value as any })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                  >
                    {MODELO_CUSTO_OPTIONS.map((mc) => (
                      <option key={mc} value={mc}>{mc}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Licenças Contratadas
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={!isAdmin}
                    value={formData.licencas_contratadas ?? 0}
                    onChange={(e) => setFormData({ ...formData, licencas_contratadas: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                  />
                </div>
              </div>

              {/* Linha 9: Próximo Passo */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Próximo Passo / Ação Imediata
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={formData.proximo_passo || ''}
                  onChange={(e) => setFormData({ ...formData, proximo_passo: e.target.value })}
                  placeholder="Qual o próximo marco ou entrega necessária?"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                />
              </div>

              {/* Footer Modal */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                <div>
                  {!modalIsNovo && isAdmin && formData.id && (
                    <button
                      type="button"
                      onClick={() => setProjetoParaExcluir(formData as InovacaoProjeto)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                    >
                      <Trash2 size={14} />
                      Excluir Iniciativa
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  {isAdmin && (
                    <button
                      type="submit"
                      disabled={salvando}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#00B2FF] hover:bg-[#009de0] text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Save size={14} />
                      {salvando ? 'Salvando...' : modalIsNovo ? 'Cadastrar Iniciativa' : 'Salvar Alterações'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão (sem window.confirm) */}
      {projetoParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-gray-100 p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-[#b83822] flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={24} />
            </div>
            <h4 className="font-bold text-gray-900 text-sm font-serif">
              Excluir Iniciativa?
            </h4>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              Tem certeza que deseja remover a iniciativa <span className="font-bold text-gray-800">{projetoParaExcluir.id} - {projetoParaExcluir.projeto}</span>? Esta ação removerá o projeto e seu cronograma.
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setProjetoParaExcluir(null)}
                disabled={excluindoProjeto}
                className="px-3.5 py-1.5 border border-gray-200 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    setExcluindoProjeto(true);
                    await onExcluirProjeto(projetoParaExcluir.id);
                    setProjetoParaExcluir(null);
                    setIsModalOpen(false);
                  } catch (err) {
                    console.error('Erro ao excluir iniciativa:', err);
                  } finally {
                    setExcluindoProjeto(false);
                  }
                }}
                disabled={excluindoProjeto}
                className="px-3.5 py-1.5 bg-[#b83822] hover:bg-[#962e1b] text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {excluindoProjeto ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
