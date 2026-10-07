import React, { useState, useMemo } from 'react';
import {
  InovacaoProjeto,
  InovacaoAdocao,
  UN_AREAS_SUGERIDAS
} from '../../types/painelInovacao';
import {
  calcularTaxaAdocao,
  calcularParticipacaoTreinamento
} from '../../utils/painelInovacaoCalculos';
import { Plus, Edit2, Trash2, X, Save, Search, Users, Award, AlertTriangle } from 'lucide-react';

interface Props {
  projetos: InovacaoProjeto[];
  adocoes: InovacaoAdocao[];
  isAdmin: boolean;
  onSalvarAdocao: (item: InovacaoAdocao) => Promise<void>;
  onExcluirAdocao: (id: string) => Promise<void>;
}

export const AdocaoTab: React.FC<Props> = ({
  projetos,
  adocoes,
  isAdmin,
  onSalvarAdocao,
  onExcluirAdocao
}) => {
  const [filtroProjeto, setFiltroProjeto] = useState('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<InovacaoAdocao>>({});
  const [salvando, setSalvando] = useState(false);

  // Confirmação de exclusão em modal (compatível com iframe)
  const [itemParaExcluir, setItemParaExcluir] = useState<InovacaoAdocao | null>(null);
  const [excluindoItem, setExcluindoItem] = useState(false);

  const adocoesFiltradas = useMemo(() => {
    return adocoes.filter((a) => {
      if (filtroProjeto !== 'todos' && a.projeto_id !== filtroProjeto) return false;
      return true;
    });
  }, [adocoes, filtroProjeto]);

  const handleNovoRegistro = () => {
    if (!isAdmin) return;
    setFormData({
      id: `AD-${Date.now()}`,
      projeto_id: projetos[0]?.id || '',
      mes_referencia: 'Outubro/2026',
      un_area: 'Geral / Todas as UNs',
      licencas_disponiveis: 30,
      usuarios_ativos_mes: 20,
      sessoes_treinamento_mes: 1,
      pessoas_treinadas: 15,
      publico_alvo_treinamento: 20,
      observacoes: ''
    });
    setIsModalOpen(true);
  };

  const handleEditar = (item: InovacaoAdocao) => {
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSalvando(true);
      const projId = formData.projeto_id || projetos[0]?.id || 'INV-001';
      const payload: InovacaoAdocao = {
        ...(formData as InovacaoAdocao),
        projeto_id: projId,
        mes_referencia: formData.mes_referencia || 'Geral'
      };
      await onSalvarAdocao(payload);
      setIsModalOpen(false);
    } catch (err: any) {
      alert('Erro ao salvar adoção: ' + err.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Controles ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
            Filtrar por Projeto:
          </label>
          <select
            value={filtroProjeto}
            onChange={(e) => setFiltroProjeto(e.target.value)}
            className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-[#00B2FF] text-gray-800 font-medium"
          >
            <option value="todos">Todos os projetos</option>
            {projetos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id} - {p.projeto}
              </option>
            ))}
          </select>
        </div>

        {isAdmin && (
          <button
            onClick={handleNovoRegistro}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#00B2FF] hover:bg-[#009de0] text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"
          >
            <Plus size={15} />
            Novo Registro de Adoção
          </button>
        )}
      </div>

      {/* ── Tabela de Adoção e Treinamento ─────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200/80 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3.5">Projeto</th>
                <th className="py-3 px-3.5">Mês Ref.</th>
                <th className="py-3 px-3.5 text-center">UN / Área</th>
                <th className="py-3 px-3.5 text-center">Licenças</th>
                <th className="py-3 px-3.5 text-center">Usuários Ativos</th>
                <th className="py-3 px-3.5 text-center font-bold text-[#00B2FF]">Taxa de Adoção</th>
                <th className="py-3 px-3.5 text-center">Sessões Trein.</th>
                <th className="py-3 px-3.5 text-center">Treinados / Alvo</th>
                <th className="py-3 px-3.5 text-center font-bold text-emerald-600">Adesão Trein.</th>
                <th className="py-3 px-3.5">Observações</th>
                <th className="py-3 px-3.5 text-center w-20">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {adocoesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-gray-400">
                    Nenhum registro de adoção encontrado.
                  </td>
                </tr>
              ) : (
                adocoesFiltradas.map((item) => {
                  const taxaAdocao = calcularTaxaAdocao(item);
                  const taxaTrein = calcularParticipacaoTreinamento(item);
                  const proj = projetos.find((p) => p.id === item.projeto_id);

                  return (
                    <tr key={item.id} className="hover:bg-sky-50/40 transition-colors">
                      <td className="py-3 px-3.5 font-medium text-gray-900">
                        <span className="font-mono font-bold text-gray-700">{item.projeto_id}</span>
                        {proj && <div className="text-[11px] text-gray-500 truncate max-w-[180px]">{proj.projeto}</div>}
                      </td>

                      <td className="py-3 px-3.5 font-medium text-gray-700">
                        {item.mes_referencia}
                      </td>

                      <td className="py-3 px-3.5 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-gray-100 text-gray-800 text-[11px] font-medium">
                          {item.un_area}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 text-center text-gray-700 font-medium">
                        {item.licencas_disponiveis}
                      </td>

                      <td className="py-3 px-3.5 text-center text-gray-900 font-semibold">
                        {item.usuarios_ativos_mes}
                      </td>

                      {/* Taxa de Adoção Calculada */}
                      <td className="py-3 px-3.5 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-[#00B2FF] border border-sky-200">
                          {taxaAdocao !== null ? `${taxaAdocao}%` : '-'}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 text-center text-gray-700">
                        {item.sessoes_treinamento_mes}
                      </td>

                      <td className="py-3 px-3.5 text-center text-gray-700">
                        {item.pessoas_treinadas} / {item.publico_alvo_treinamento}
                      </td>

                      {/* Adesão a Treinamento Calculada */}
                      <td className="py-3 px-3.5 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {taxaTrein !== null ? `${taxaTrein}%` : '-'}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 text-gray-600 max-w-[220px] truncate" title={item.observacoes}>
                        {item.observacoes || '-'}
                      </td>

                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEditar(item)}
                            className="p-1 rounded-lg text-gray-400 hover:text-[#00B2FF] hover:bg-sky-50 cursor-pointer"
                            title={isAdmin ? 'Editar' : 'Visualizar'}
                          >
                            <Edit2 size={13} />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => setItemParaExcluir(item)}
                              className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 size={13} />
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

      {/* ── Modal Edição/Inclusão ─────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-xl max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60 rounded-t-2xl">
              <h3 className="text-base font-bold text-gray-900 font-serif">
                Registro de Adoção e Treinamento
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Projeto
                  </label>
                  <select
                    disabled={!isAdmin}
                    value={formData.projeto_id || ''}
                    onChange={(e) => setFormData({ ...formData, projeto_id: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                  >
                    {projetos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.id} - {p.projeto}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Mês de Referência
                  </label>
                  <input
                    type="text"
                    disabled={!isAdmin}
                    placeholder="Ex: Outubro/2026"
                    value={formData.mes_referencia || ''}
                    onChange={(e) => setFormData({ ...formData, mes_referencia: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  UN / Área
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Licenças Disponíveis
                  </label>
                  <input
                    type="number"
                    min="1"
                    disabled={!isAdmin}
                    value={formData.licencas_disponiveis ?? 0}
                    onChange={(e) => setFormData({ ...formData, licencas_disponiveis: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Usuários Ativos no Mês
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={!isAdmin}
                    value={formData.usuarios_ativos_mes ?? 0}
                    onChange={(e) => setFormData({ ...formData, usuarios_ativos_mes: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Sessões Trein.
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={!isAdmin}
                    value={formData.sessoes_treinamento_mes ?? 0}
                    onChange={(e) => setFormData({ ...formData, sessoes_treinamento_mes: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Pessoas Treinadas
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={!isAdmin}
                    value={formData.pessoas_treinadas ?? 0}
                    onChange={(e) => setFormData({ ...formData, pessoas_treinadas: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Público-Alvo
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={!isAdmin}
                    value={formData.publico_alvo_treinamento ?? 0}
                    onChange={(e) => setFormData({ ...formData, publico_alvo_treinamento: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  rows={2}
                  disabled={!isAdmin}
                  value={formData.observacoes || ''}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Comentários sobre a adesão ou engajamento..."
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                <div>
                  {isAdmin && formData.id && (
                    <button
                      type="button"
                      onClick={() => setItemParaExcluir(formData as InovacaoAdocao)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                    >
                      <Trash2 size={14} />
                      Excluir Registro
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  {isAdmin && (
                    <button
                      type="submit"
                      disabled={salvando}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#00B2FF] hover:bg-[#009de0] text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
                    >
                      <Save size={14} />
                      {salvando ? 'Salvando...' : 'Salvar Registro'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão (sem window.confirm) */}
      {itemParaExcluir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-gray-100 p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-[#b83822] flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={24} />
            </div>
            <h4 className="font-bold text-gray-900 text-sm font-serif">
              Excluir Registro de Adoção?
            </h4>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              Deseja remover o registro de adoção de <span className="font-bold text-gray-800">{itemParaExcluir.mes_referencia}</span> para o projeto <span className="font-bold text-gray-800">{itemParaExcluir.projeto_id}</span>?
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setItemParaExcluir(null)}
                disabled={excluindoItem}
                className="px-3.5 py-1.5 border border-gray-200 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    setExcluindoItem(true);
                    await onExcluirAdocao(itemParaExcluir.id);
                    setItemParaExcluir(null);
                    setIsModalOpen(false);
                  } catch (err) {
                    console.error('Erro ao excluir adoção:', err);
                  } finally {
                    setExcluindoItem(false);
                  }
                }}
                disabled={excluindoItem}
                className="px-3.5 py-1.5 bg-[#b83822] hover:bg-[#962e1b] text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {excluindoItem ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
