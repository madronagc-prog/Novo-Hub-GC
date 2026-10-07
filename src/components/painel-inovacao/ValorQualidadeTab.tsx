import React, { useState, useMemo } from 'react';
import {
  InovacaoProjeto,
  InovacaoValorQualidade,
  BIMESTRE_OPTIONS,
  METODO_APURACAO_OPTIONS
} from '../../types/painelInovacao';
import {
  calcularReducaoTempo,
  calcularGanhoQualidade
} from '../../utils/painelInovacaoCalculos';
import { Plus, Edit2, Trash2, X, Save, AlertTriangle } from 'lucide-react';

interface Props {
  projetos: InovacaoProjeto[];
  valores: InovacaoValorQualidade[];
  isAdmin: boolean;
  onSalvarValorQualidade: (item: InovacaoValorQualidade) => Promise<void>;
  onExcluirValorQualidade: (id: string) => Promise<void>;
}

export const ValorQualidadeTab: React.FC<Props> = ({
  projetos,
  valores,
  isAdmin,
  onSalvarValorQualidade,
  onExcluirValorQualidade
}) => {
  const [filtroProjeto, setFiltroProjeto] = useState('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<InovacaoValorQualidade>>({});
  const [salvando, setSalvando] = useState(false);

  // Confirmação de exclusão em modal (compatível com iframe)
  const [itemParaExcluir, setItemParaExcluir] = useState<InovacaoValorQualidade | null>(null);
  const [excluindoItem, setExcluindoItem] = useState(false);

  const valoresFiltrados = useMemo(() => {
    return valores.filter((v) => {
      if (filtroProjeto !== 'todos' && v.projeto_id !== filtroProjeto) return false;
      return true;
    });
  }, [valores, filtroProjeto]);

  const handleNovoRegistro = () => {
    if (!isAdmin) return;
    setFormData({
      id: `VQ-${Date.now()}`,
      projeto_id: projetos[0]?.id || '',
      bimestre: '5º Bimestre',
      pessoas_impactadas: 30,
      horas_economizadas_bimestre: 80,
      metodo_apuracao: 'Amostragem com Usuários',
      tempo_medio_antes: 4.0,
      tempo_medio_depois: 2.0,
      nota_qualidade_antes: 3.5,
      nota_qualidade_depois: 4.8,
      satisfacao_usuarios: 4.5,
      respostas_feedback: 25,
      comentarios: ''
    });
    setIsModalOpen(true);
  };

  const handleEditar = (item: InovacaoValorQualidade) => {
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSalvando(true);
      const projId = formData.projeto_id || projetos[0]?.id || 'INV-001';
      const payload: InovacaoValorQualidade = {
        ...(formData as InovacaoValorQualidade),
        projeto_id: projId,
        bimestre: formData.bimestre || BIMESTRE_OPTIONS[0]
      };
      await onSalvarValorQualidade(payload);
      setIsModalOpen(false);
    } catch (err: any) {
      alert('Erro ao salvar valor & qualidade: ' + err.message);
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
            Novo Registro de Valor e Qualidade
          </button>
        )}
      </div>

      {/* ── Tabela de Valor e Qualidade ────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200/80 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3.5">Projeto</th>
                <th className="py-3 px-3.5 text-center">Bimestre</th>
                <th className="py-3 px-3.5 text-center">Impactados</th>
                <th className="py-3 px-3.5 text-center font-bold text-emerald-600">Horas Poupadas</th>
                <th className="py-3 px-3.5">Método Apuração</th>
                <th className="py-3 px-3.5 text-center">Tempo Antes / Depois</th>
                <th className="py-3 px-3.5 text-center font-bold text-[#00B2FF]">Redução Tempo</th>
                <th className="py-3 px-3.5 text-center">Nota Antes / Depois</th>
                <th className="py-3 px-3.5 text-center font-bold text-purple-600">Ganho Qualidade</th>
                <th className="py-3 px-3.5 text-center">Satisfação</th>
                <th className="py-3 px-3.5 text-center w-20">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {valoresFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-gray-400">
                    Nenhum registro de valor e qualidade encontrado.
                  </td>
                </tr>
              ) : (
                valoresFiltrados.map((item) => {
                  const reducaoTempo = calcularReducaoTempo(item);
                  const ganhoQualidade = calcularGanhoQualidade(item);
                  const proj = projetos.find((p) => p.id === item.projeto_id);

                  return (
                    <tr key={item.id} className="hover:bg-sky-50/40 transition-colors">
                      <td className="py-3 px-3.5 font-medium text-gray-900">
                        <span className="font-mono font-bold text-gray-700">{item.projeto_id}</span>
                        {proj && <div className="text-[11px] text-gray-500 truncate max-w-[170px]">{proj.projeto}</div>}
                      </td>

                      <td className="py-3 px-3.5 text-center font-medium text-gray-800">
                        {item.bimestre}
                      </td>

                      <td className="py-3 px-3.5 text-center text-gray-800 font-medium">
                        {item.pessoas_impactadas}
                      </td>

                      <td className="py-3 px-3.5 text-center font-bold text-emerald-600 text-sm">
                        {item.horas_economizadas_bimestre}h
                      </td>

                      <td className="py-3 px-3.5 text-gray-600 text-[11px]">
                        {item.metodo_apuracao}
                      </td>

                      <td className="py-3 px-3.5 text-center text-gray-700">
                        {item.tempo_medio_antes}h → {item.tempo_medio_depois}h
                      </td>

                      {/* Redução de Tempo Calculada */}
                      <td className="py-3 px-3.5 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-[#00B2FF] border border-sky-200">
                          {reducaoTempo !== null ? `-${reducaoTempo}%` : '-'}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 text-center text-gray-700">
                        {item.nota_qualidade_antes} → {item.nota_qualidade_depois}
                      </td>

                      {/* Ganho de Qualidade Calculado */}
                      <td className="py-3 px-3.5 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          {ganhoQualidade !== null ? `+${ganhoQualidade}%` : '-'}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 text-center">
                        <span className="font-bold text-amber-700 text-xs">
                          {item.satisfacao_usuarios}
                        </span>
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
                Métricas de Valor e Qualidade (Bimestral)
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
                    Bimestre
                  </label>
                  <select
                    disabled={!isAdmin}
                    value={formData.bimestre || BIMESTRE_OPTIONS[0]}
                    onChange={(e) => setFormData({ ...formData, bimestre: e.target.value as any })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                  >
                    {BIMESTRE_OPTIONS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Pessoas Impactadas
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={!isAdmin}
                    value={formData.pessoas_impactadas ?? 0}
                    onChange={(e) => setFormData({ ...formData, pessoas_impactadas: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Horas Economizadas (Bimestre)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    disabled={!isAdmin}
                    value={formData.horas_economizadas_bimestre ?? 0}
                    onChange={(e) => setFormData({ ...formData, horas_economizadas_bimestre: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Método de Apuração
                </label>
                <select
                  disabled={!isAdmin}
                  value={formData.metodo_apuracao || METODO_APURACAO_OPTIONS[0]}
                  onChange={(e) => setFormData({ ...formData, metodo_apuracao: e.target.value as any })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                >
                  {METODO_APURACAO_OPTIONS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Tempo Médio ANTES (horas)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    disabled={!isAdmin}
                    value={formData.tempo_medio_antes ?? 0}
                    onChange={(e) => setFormData({ ...formData, tempo_medio_antes: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Tempo Médio DEPOIS (horas)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    disabled={!isAdmin}
                    value={formData.tempo_medio_depois ?? 0}
                    onChange={(e) => setFormData({ ...formData, tempo_medio_depois: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nota Qualidade ANTES (1 a 5)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    disabled={!isAdmin}
                    value={formData.nota_qualidade_antes ?? 3}
                    onChange={(e) => setFormData({ ...formData, nota_qualidade_antes: parseFloat(e.target.value) || 1 })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nota Qualidade DEPOIS (1 a 5)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    disabled={!isAdmin}
                    value={formData.nota_qualidade_depois ?? 4.5}
                    onChange={(e) => setFormData({ ...formData, nota_qualidade_depois: parseFloat(e.target.value) || 1 })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Satisfação dos Usuários (1 a 5)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    disabled={!isAdmin}
                    value={formData.satisfacao_usuarios ?? 4.5}
                    onChange={(e) => setFormData({ ...formData, satisfacao_usuarios: parseFloat(e.target.value) || 1 })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Respostas de Feedback
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={!isAdmin}
                    value={formData.respostas_feedback ?? 0}
                    onChange={(e) => setFormData({ ...formData, respostas_feedback: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Comentários
                </label>
                <textarea
                  rows={2}
                  disabled={!isAdmin}
                  value={formData.comentarios || ''}
                  onChange={(e) => setFormData({ ...formData, comentarios: e.target.value })}
                  placeholder="Observações qualitativas das equipes..."
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-[#00B2FF]"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2">
                <div>
                  {isAdmin && formData.id && (
                    <button
                      type="button"
                      onClick={() => setItemParaExcluir(formData as InovacaoValorQualidade)}
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
              Excluir Registro de Valor e Qualidade?
            </h4>
            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              Deseja remover o registro do <span className="font-bold text-gray-800">{itemParaExcluir.bimestre}</span> para o projeto <span className="font-bold text-gray-800">{itemParaExcluir.projeto_id}</span>?
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
                    await onExcluirValorQualidade(itemParaExcluir.id);
                    setItemParaExcluir(null);
                    setIsModalOpen(false);
                  } catch (err) {
                    console.error('Erro ao excluir valor e qualidade:', err);
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
