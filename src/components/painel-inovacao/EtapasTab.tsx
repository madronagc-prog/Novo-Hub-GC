import React, { useState, useEffect } from 'react';
import {
  InovacaoProjeto,
  InovacaoEtapas,
  EtapaCustomizada,
  ETAPAS_CHAVES,
  ETAPA_ATUAL_OPTIONS
} from '../../types/painelInovacao';
import {
  calcularPercentualEtapas,
  determinarEtapaEmCurso,
  formatarDataBr,
  cleanFirestoreData
} from '../../utils/painelInovacaoCalculos';
import {
  Edit2,
  Check,
  Save,
  AlertCircle,
  X,
  RotateCcw,
  Plus,
  Trash2
} from 'lucide-react';

interface Props {
  projetos: InovacaoProjeto[];
  etapasMap: Record<string, InovacaoEtapas>;
  isAdmin: boolean;
  onSalvarEtapas: (etapas: InovacaoEtapas, projetoAtualizado?: InovacaoProjeto) => Promise<void>;
  onSalvarProjeto?: (projeto: InovacaoProjeto, isNovo: boolean) => Promise<void>;
}

export const EtapasTab: React.FC<Props> = ({
  projetos,
  etapasMap,
  isAdmin,
  onSalvarEtapas
}) => {
  const [projetoSelecionadoId, setProjetoSelecionadoId] = useState<string>(
    projetos[0]?.id || ''
  );
  const [editando, setEditando] = useState(false);
  const [formDataEtapas, setFormDataEtapas] = useState<Record<string, any>>({});
  const [etapasPersonalizadas, setEtapasPersonalizadas] = useState<EtapaCustomizada[]>([]);
  const [formDataProjeto, setFormDataProjeto] = useState<{
    projeto: string;
    etapa_atual: string;
  }>({ projeto: '', etapa_atual: '' });

  const [salvando, setSalvando] = useState(false);
  const [msgSucesso, setMsgSucesso] = useState('');
  const [msgErro, setMsgErro] = useState('');

  // Sincroniza projeto selecionado se a lista mudar ou inicializar
  useEffect(() => {
    if ((!projetoSelecionadoId || !projetos.some(p => p.id === projetoSelecionadoId)) && projetos.length > 0) {
      setProjetoSelecionadoId(projetos[0].id);
    }
  }, [projetos, projetoSelecionadoId]);

  const projetoAtual = projetos.find((p) => p.id === projetoSelecionadoId) || projetos[0];
  const etapasAtuais = projetoAtual ? (etapasMap[projetoAtual.id] || { id: projetoAtual.id }) : undefined;

  // Atualiza etapas personalizadas quando mudar de projeto ou receber dados
  useEffect(() => {
    if (!editando && etapasAtuais) {
      setEtapasPersonalizadas(
        Array.isArray(etapasAtuais.etapas_personalizadas)
          ? [...etapasAtuais.etapas_personalizadas]
          : []
      );
    }
  }, [etapasAtuais, editando]);

  const handleIniciarEdicao = () => {
    if (!isAdmin || !projetoAtual) return;
    setFormDataEtapas(etapasAtuais ? { ...etapasAtuais } : { id: projetoAtual.id });
    setEtapasPersonalizadas(
      Array.isArray(etapasAtuais?.etapas_personalizadas)
        ? [...etapasAtuais.etapas_personalizadas]
        : []
    );
    setFormDataProjeto({
      projeto: projetoAtual.projeto || '',
      etapa_atual: projetoAtual.etapa_atual || '1. Mapeamento de Ferramentas'
    });
    setEditando(true);
    setMsgSucesso('');
    setMsgErro('');
  };

  const handleAdicionarNovaEtapa = () => {
    if (!isAdmin || !projetoAtual) return;
    const proximoNum = ETAPAS_CHAVES.length + etapasPersonalizadas.length + 1;
    const novaEtapa: EtapaCustomizada = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      titulo: `${proximoNum}. Nova Etapa`,
      inicio: '',
      fim: '',
      status: '',
      obs: ''
    };

    if (!editando) {
      setFormDataEtapas(etapasAtuais ? { ...etapasAtuais } : { id: projetoAtual.id });
      setFormDataProjeto({
        projeto: projetoAtual.projeto || '',
        etapa_atual: projetoAtual.etapa_atual || '1. Mapeamento de Ferramentas'
      });
      setEditando(true);
      setMsgSucesso('');
      setMsgErro('');
    }

    setEtapasPersonalizadas((prev) => [...prev, novaEtapa]);
  };

  const handleRemoverEtapaCustomizada = (id: string) => {
    setEtapasPersonalizadas((prev) => prev.filter((e) => e.id !== id));
  };

  const handleAtualizarEtapaCustomizada = (
    id: string,
    field: keyof EtapaCustomizada,
    value: string
  ) => {
    setEtapasPersonalizadas((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const handleCancelar = () => {
    setEditando(false);
    setEtapasPersonalizadas(
      Array.isArray(etapasAtuais?.etapas_personalizadas)
        ? [...etapasAtuais.etapas_personalizadas]
        : []
    );
    setMsgErro('');
  };

  const handleSalvar = async () => {
    if (!isAdmin || !projetoAtual) return;
    try {
      setSalvando(true);
      setMsgErro('');
      setMsgSucesso('');

      // Monta payload limpo de etapas
      const payloadEtapas: InovacaoEtapas = cleanFirestoreData({
        id: projetoAtual.id,
        ...formDataEtapas,
        etapas_personalizadas: etapasPersonalizadas.filter(
          (e) => (e.titulo || '').trim() !== ''
        ),
        updatedAt: new Date().toISOString()
      });

      // Verifica se houve alteração no nome do projeto ou etapa atual
      let projetoAtualizado: InovacaoProjeto | undefined = undefined;
      const alterouNome =
        formDataProjeto.projeto.trim() !== '' &&
        formDataProjeto.projeto !== projetoAtual.projeto;
      const alterouEtapa =
        formDataProjeto.etapa_atual !== '' &&
        formDataProjeto.etapa_atual !== projetoAtual.etapa_atual;

      if (alterouNome || alterouEtapa) {
        projetoAtualizado = cleanFirestoreData({
          ...projetoAtual,
          projeto: formDataProjeto.projeto || projetoAtual.projeto,
          etapa_atual: (formDataProjeto.etapa_atual as any) || projetoAtual.etapa_atual,
          ultima_atualizacao: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString()
        });
      }

      await onSalvarEtapas(payloadEtapas, projetoAtualizado);

      setEditando(false);
      setMsgSucesso('Cronogramas e etapas salvos com sucesso!');
      setTimeout(() => setMsgSucesso(''), 4000);
    } catch (err: any) {
      console.error('Erro ao salvar etapas:', err);
      setMsgErro(
        'Erro ao salvar etapas: ' +
          (err?.message || 'Falha de comunicação. Os dados foram retidos.')
      );
    } finally {
      setSalvando(false);
    }
  };

  const hojeIso = new Date().toISOString().split('T')[0];

  // Etapas combinadas para exibição no progresso
  const etapasSnapshot: InovacaoEtapas | undefined = editando
    ? {
        id: projetoAtual?.id || '',
        ...formDataEtapas,
        etapas_personalizadas: etapasPersonalizadas
      }
    : etapasAtuais;

  return (
    <div className="space-y-6">
      {/* ── Seletor de Projeto e Resumo de Progresso ─────────────────── */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
            Selecione a Iniciativa:
          </label>
          <select
            value={projetoSelecionadoId}
            onChange={(e) => {
              setProjetoSelecionadoId(e.target.value);
              setEditando(false);
              setMsgSucesso('');
              setMsgErro('');
            }}
            className="bg-gray-50 border border-gray-200 text-xs rounded-xl px-3 py-2 font-medium text-gray-800 focus:ring-2 focus:ring-[#00B2FF] focus:outline-none max-w-md"
          >
            {projetos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id} - {p.projeto} ({p.un_area})
              </option>
            ))}
          </select>
        </div>

        {projetoAtual && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right mr-2">
              <div className="text-[11px] text-gray-500 font-medium">
                Progresso ({ETAPAS_CHAVES.length + etapasPersonalizadas.length} etapas)
              </div>
              <div className="text-base font-bold text-[#00B2FF]">
                {calcularPercentualEtapas(etapasSnapshot)}% concluído
              </div>
            </div>

            {isAdmin && (
              <button
                onClick={handleAdicionarNovaEtapa}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-50 hover:bg-sky-100 text-[#00B2FF] border border-sky-200 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs active:scale-98"
              >
                <Plus size={14} />
                Inserir Nova Etapa
              </button>
            )}

            {isAdmin && !editando && (
              <button
                onClick={handleIniciarEdicao}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#00B2FF] hover:bg-[#009de0] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs active:scale-98"
              >
                <Edit2 size={13} />
                Editar Cronograma
              </button>
            )}

            {editando && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancelar}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSalvar}
                  disabled={salvando}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Save size={13} />
                  {salvando ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Mensagens de Sucesso ou Erro ─────────────────────────────── */}
      {msgSucesso && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between gap-2 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check size={16} className="text-emerald-600 shrink-0" />
            <span>{msgSucesso}</span>
          </div>
          <button onClick={() => setMsgSucesso('')} className="text-emerald-600 hover:text-emerald-800">
            <X size={14} />
          </button>
        </div>
      )}

      {msgErro && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center justify-between gap-2 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            <span>{msgErro}</span>
          </div>
          <button onClick={() => setMsgErro('')} className="text-red-600 hover:text-red-800">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Visão Detalhada das Etapas ──────────────────────────────── */}
      {projetoAtual && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          {/* Header do Card com identificação e campos de topo */}
          <div className="p-5 border-b border-gray-100 bg-gray-50/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {projetoAtual.id}
                  </span>
                  {!editando ? (
                    <h3 className="text-base font-bold text-gray-900 font-serif">
                      {projetoAtual.projeto}
                    </h3>
                  ) : (
                    <div className="flex-1 max-w-lg">
                      <input
                        type="text"
                        value={formDataProjeto.projeto}
                        onChange={(e) =>
                          setFormDataProjeto({ ...formDataProjeto, projeto: e.target.value })
                        }
                        placeholder="Título / Nome da Iniciativa"
                        className="w-full bg-white border border-[#00B2FF] rounded-lg px-2.5 py-1 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-[#00B2FF]"
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span>UN: <strong className="text-gray-700">{projetoAtual.un_area}</strong></span>
                  <span>Responsável: <strong className="text-gray-700">{projetoAtual.responsavel_gc || '-'}</strong></span>
                  
                  {!editando ? (
                    <span>
                      Etapa em Curso:{' '}
                      <strong className="text-gray-800">
                        {determinarEtapaEmCurso(etapasSnapshot)}
                      </strong>
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5 mt-1 sm:mt-0">
                      <span className="text-xs font-medium text-gray-700">Etapa Atual declarada:</span>
                      <select
                        value={formDataProjeto.etapa_atual}
                        onChange={(e) =>
                          setFormDataProjeto({ ...formDataProjeto, etapa_atual: e.target.value })
                        }
                        className="bg-white border border-gray-200 text-xs rounded-lg px-2 py-0.5 font-medium text-gray-800 focus:ring-2 focus:ring-[#00B2FF]"
                      >
                        {ETAPA_ATUAL_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-xs text-gray-500 bg-white px-3 py-1.5 rounded-xl border border-gray-200 self-start md:self-auto">
                {editando ? (
                  <span className="text-[#00B2FF] font-medium">
                    Modo de edição ativo: você pode alterar dados e inserir novas etapas
                  </span>
                ) : (
                  <span>Datas aceitas: formato AAAA-MM-DD ou N.A. (Não aplicável)</span>
                )}
              </div>
            </div>
          </div>

          {/* Tabela de Etapas (9 Padrão + Etapas Customizadas) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200/80 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4 min-w-[280px]">Etapa do Fluxo / Título</th>
                  <th className="py-3 px-4 min-w-[170px]">Data de Início</th>
                  <th className="py-3 px-4 min-w-[170px]">Data de Término / Conclusão</th>
                  <th className="py-3 px-4 text-center min-w-[140px]">Status</th>
                  <th className="py-3 px-4 min-w-[220px]">Observações / Detalhes</th>
                  {editando && <th className="py-3 px-3 w-12 text-center">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {/* 1. As 9 Etapas Padrão */}
                {ETAPAS_CHAVES.map(({ key, label }, index) => {
                  const tituloVal = editando
                    ? formDataEtapas[`${key}_titulo`] ?? (etapasAtuais as any)?.[`${key}_titulo`] ?? label
                    : (etapasAtuais as any)?.[`${key}_titulo`] ?? label;

                  const inicioVal = editando
                    ? formDataEtapas[`${key}_inicio`] ?? (etapasAtuais as any)?.[`${key}_inicio`] ?? ''
                    : (etapasAtuais as any)?.[`${key}_inicio`] ?? '';

                  const fimVal = editando
                    ? formDataEtapas[`${key}_fim`] ?? (etapasAtuais as any)?.[`${key}_fim`] ?? ''
                    : (etapasAtuais as any)?.[`${key}_fim`] ?? '';

                  const statusManual = editando
                    ? formDataEtapas[`${key}_status`] ?? (etapasAtuais as any)?.[`${key}_status`] ?? ''
                    : (etapasAtuais as any)?.[`${key}_status`] ?? '';

                  const obsVal = editando
                    ? formDataEtapas[`${key}_obs`] ?? (etapasAtuais as any)?.[`${key}_obs`] ?? ''
                    : (etapasAtuais as any)?.[`${key}_obs`] ?? '';

                  // Cálculo do status se não houver override manual
                  const isConcluida = statusManual === 'Concluída' || (!statusManual && fimVal && fimVal.trim() !== '');
                  const isEmAndamento = statusManual === 'Em Andamento' || (!statusManual && inicioVal && inicioVal.trim() !== '' && !isConcluida);
                  const isPausada = statusManual === 'Pausada';
                  const isNA = statusManual === 'N.A.' || inicioVal === 'N.A.' || fimVal === 'N.A.';

                  return (
                    <tr
                      key={key}
                      className={`hover:bg-gray-50/70 transition-colors ${
                        isConcluida ? 'bg-emerald-50/20' : isEmAndamento ? 'bg-sky-50/30' : ''
                      }`}
                    >
                      {/* # */}
                      <td className="py-3 px-4 text-center font-mono font-semibold text-gray-400">
                        {index + 1}
                      </td>

                      {/* Etapa / Título Editável */}
                      <td className="py-3 px-4">
                        {editando ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={tituloVal}
                              onChange={(e) =>
                                setFormDataEtapas({
                                  ...formDataEtapas,
                                  [`${key}_titulo`]: e.target.value
                                })
                              }
                              placeholder={label}
                              className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs focus:ring-2 focus:ring-[#00B2FF] font-semibold text-gray-900"
                            />
                            {tituloVal !== label && (
                              <button
                                type="button"
                                onClick={() =>
                                  setFormDataEtapas({
                                    ...formDataEtapas,
                                    [`${key}_titulo`]: label
                                  })
                                }
                                className="inline-flex items-center gap-1 text-[10px] text-gray-400 hover:text-[#00B2FF] cursor-pointer"
                              >
                                <RotateCcw size={10} />
                                Restaurar nome padrão
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="font-semibold text-gray-900">{tituloVal}</div>
                        )}
                      </td>

                      {/* Data de Início */}
                      <td className="py-3 px-4">
                        {editando ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              placeholder="AAAA-MM-DD ou N.A."
                              value={inicioVal}
                              onChange={(e) =>
                                setFormDataEtapas({
                                  ...formDataEtapas,
                                  [`${key}_inicio`]: e.target.value
                                })
                              }
                              className="bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs focus:ring-2 focus:ring-[#00B2FF] w-full"
                            />
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setFormDataEtapas({
                                    ...formDataEtapas,
                                    [`${key}_inicio`]: hojeIso
                                  })
                                }
                                className="px-1.5 py-0.5 text-[10px] bg-sky-50 hover:bg-sky-100 text-[#00B2FF] rounded font-medium cursor-pointer"
                                title="Inserir data de hoje"
                              >
                                Hoje
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setFormDataEtapas({
                                    ...formDataEtapas,
                                    [`${key}_inicio`]: 'N.A.'
                                  })
                                }
                                className="px-1.5 py-0.5 text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-600 rounded font-medium cursor-pointer"
                                title="Marcar como Não Aplicável"
                              >
                                N.A.
                              </button>
                              {inicioVal && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setFormDataEtapas({
                                      ...formDataEtapas,
                                      [`${key}_inicio`]: ''
                                    })
                                  }
                                  className="px-1.5 py-0.5 text-[10px] text-gray-400 hover:text-red-500 cursor-pointer"
                                  title="Limpar campo"
                                >
                                  Limpar
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="font-medium text-gray-700">
                            {formatarDataBr(inicioVal)}
                          </span>
                        )}
                      </td>

                      {/* Data de Término / Conclusão */}
                      <td className="py-3 px-4">
                        {editando ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              placeholder="AAAA-MM-DD ou N.A."
                              value={fimVal}
                              onChange={(e) =>
                                setFormDataEtapas({
                                  ...formDataEtapas,
                                  [`${key}_fim`]: e.target.value
                                })
                              }
                              className="bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs focus:ring-2 focus:ring-[#00B2FF] w-full"
                            />
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  setFormDataEtapas({
                                    ...formDataEtapas,
                                    [`${key}_fim`]: hojeIso
                                  })
                                }
                                className="px-1.5 py-0.5 text-[10px] bg-sky-50 hover:bg-sky-100 text-[#00B2FF] rounded font-medium cursor-pointer"
                                title="Inserir data de hoje"
                              >
                                Hoje
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setFormDataEtapas({
                                    ...formDataEtapas,
                                    [`${key}_fim`]: 'N.A.'
                                  })
                                }
                                className="px-1.5 py-0.5 text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-600 rounded font-medium cursor-pointer"
                                title="Marcar como Não Aplicável"
                              >
                                N.A.
                              </button>
                              {fimVal && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setFormDataEtapas({
                                      ...formDataEtapas,
                                      [`${key}_fim`]: ''
                                    })
                                  }
                                  className="px-1.5 py-0.5 text-[10px] text-gray-400 hover:text-red-500 cursor-pointer"
                                  title="Limpar campo"
                                >
                                  Limpar
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="font-medium text-gray-700">
                            {formatarDataBr(fimVal)}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {editando ? (
                          <select
                            value={statusManual}
                            onChange={(e) =>
                              setFormDataEtapas({
                                ...formDataEtapas,
                                [`${key}_status`]: e.target.value
                              })
                            }
                            className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-[#00B2FF] text-gray-700 font-medium w-full text-center"
                          >
                            <option value="">Automático</option>
                            <option value="Concluída">Concluída</option>
                            <option value="Em Andamento">Em Andamento</option>
                            <option value="Não iniciada">Não iniciada</option>
                            <option value="Pausada">Pausada</option>
                            <option value="N.A.">N.A.</option>
                          </select>
                        ) : (
                          isNA ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600 text-center">
                              N.A.
                            </span>
                          ) : isConcluida ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 text-center">
                              Concluída
                            </span>
                          ) : isPausada ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 text-center">
                              Pausada
                            </span>
                          ) : isEmAndamento ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-[#00B2FF] border border-sky-200 text-center">
                              Em Andamento
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500 text-center">
                              Não iniciada
                            </span>
                          )
                        )}
                      </td>

                      {/* Observações / Detalhes */}
                      <td className="py-3 px-4">
                        {editando ? (
                          <input
                            type="text"
                            value={obsVal}
                            onChange={(e) =>
                              setFormDataEtapas({
                                ...formDataEtapas,
                                [`${key}_obs`]: e.target.value
                              })
                            }
                            placeholder="Anotações ou detalhes..."
                            className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs focus:ring-2 focus:ring-[#00B2FF] text-gray-700"
                          />
                        ) : (
                          <span className="text-gray-500 text-[11px] truncate block max-w-[260px]" title={obsVal}>
                            {obsVal || '-'}
                          </span>
                        )}
                      </td>

                      {editando && <td className="py-3 px-3 text-center text-gray-300 text-[10px]">-</td>}
                    </tr>
                  );
                })}

                {/* 2. Etapas Personalizadas Adicionadas pelo Usuário */}
                {etapasPersonalizadas.map((etapa, idx) => {
                  const numEtapa = ETAPAS_CHAVES.length + idx + 1;
                  const isConcluida =
                    etapa.status === 'Concluída' ||
                    (!etapa.status && etapa.fim && etapa.fim.trim() !== '');
                  const isEmAndamento =
                    etapa.status === 'Em Andamento' ||
                    (!etapa.status &&
                      etapa.inicio &&
                      etapa.inicio.trim() !== '' &&
                      !isConcluida);
                  const isPausada = etapa.status === 'Pausada';
                  const isNA =
                    etapa.status === 'N.A.' ||
                    etapa.inicio === 'N.A.' ||
                    etapa.fim === 'N.A.';

                  return (
                    <tr
                      key={etapa.id}
                      className={`hover:bg-gray-50/70 transition-colors border-l-2 border-l-[#00B2FF] ${
                        isConcluida
                          ? 'bg-emerald-50/20'
                          : isEmAndamento
                          ? 'bg-sky-50/30'
                          : 'bg-sky-50/10'
                      }`}
                    >
                      {/* # */}
                      <td className="py-3 px-4 text-center font-mono font-semibold text-[#00B2FF]">
                        {numEtapa}
                      </td>

                      {/* Etapa / Título */}
                      <td className="py-3 px-4">
                        {editando ? (
                          <input
                            type="text"
                            value={etapa.titulo}
                            onChange={(e) =>
                              handleAtualizarEtapaCustomizada(etapa.id, 'titulo', e.target.value)
                            }
                            placeholder={`Etapa ${numEtapa}...`}
                            className="w-full bg-white border border-[#00B2FF]/40 rounded-lg px-2.5 py-1 text-xs focus:ring-2 focus:ring-[#00B2FF] font-semibold text-gray-900"
                          />
                        ) : (
                          <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                            <span>{etapa.titulo}</span>
                            <span className="text-[10px] bg-sky-100 text-[#00B2FF] px-1.5 py-0.2 rounded font-normal">
                              Adicional
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Data de Início */}
                      <td className="py-3 px-4">
                        {editando ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              placeholder="AAAA-MM-DD ou N.A."
                              value={etapa.inicio || ''}
                              onChange={(e) =>
                                handleAtualizarEtapaCustomizada(etapa.id, 'inicio', e.target.value)
                              }
                              className="bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs focus:ring-2 focus:ring-[#00B2FF] w-full"
                            />
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  handleAtualizarEtapaCustomizada(etapa.id, 'inicio', hojeIso)
                                }
                                className="px-1.5 py-0.5 text-[10px] bg-sky-50 hover:bg-sky-100 text-[#00B2FF] rounded font-medium cursor-pointer"
                              >
                                Hoje
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleAtualizarEtapaCustomizada(etapa.id, 'inicio', 'N.A.')
                                }
                                className="px-1.5 py-0.5 text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-600 rounded font-medium cursor-pointer"
                              >
                                N.A.
                              </button>
                              {etapa.inicio && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAtualizarEtapaCustomizada(etapa.id, 'inicio', '')
                                  }
                                  className="px-1.5 py-0.5 text-[10px] text-gray-400 hover:text-red-500 cursor-pointer"
                                >
                                  Limpar
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="font-medium text-gray-700">
                            {formatarDataBr(etapa.inicio)}
                          </span>
                        )}
                      </td>

                      {/* Data de Término */}
                      <td className="py-3 px-4">
                        {editando ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              placeholder="AAAA-MM-DD ou N.A."
                              value={etapa.fim || ''}
                              onChange={(e) =>
                                handleAtualizarEtapaCustomizada(etapa.id, 'fim', e.target.value)
                              }
                              className="bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs focus:ring-2 focus:ring-[#00B2FF] w-full"
                            />
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  handleAtualizarEtapaCustomizada(etapa.id, 'fim', hojeIso)
                                }
                                className="px-1.5 py-0.5 text-[10px] bg-sky-50 hover:bg-sky-100 text-[#00B2FF] rounded font-medium cursor-pointer"
                              >
                                Hoje
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleAtualizarEtapaCustomizada(etapa.id, 'fim', 'N.A.')
                                }
                                className="px-1.5 py-0.5 text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-600 rounded font-medium cursor-pointer"
                              >
                                N.A.
                              </button>
                              {etapa.fim && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleAtualizarEtapaCustomizada(etapa.id, 'fim', '')
                                  }
                                  className="px-1.5 py-0.5 text-[10px] text-gray-400 hover:text-red-500 cursor-pointer"
                                >
                                  Limpar
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="font-medium text-gray-700">
                            {formatarDataBr(etapa.fim)}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {editando ? (
                          <select
                            value={etapa.status || ''}
                            onChange={(e) =>
                              handleAtualizarEtapaCustomizada(etapa.id, 'status', e.target.value)
                            }
                            className="bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-[#00B2FF] text-gray-700 font-medium w-full text-center"
                          >
                            <option value="">Automático</option>
                            <option value="Concluída">Concluída</option>
                            <option value="Em Andamento">Em Andamento</option>
                            <option value="Não iniciada">Não iniciada</option>
                            <option value="Pausada">Pausada</option>
                            <option value="N.A.">N.A.</option>
                          </select>
                        ) : (
                          isNA ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600 text-center">
                              N.A.
                            </span>
                          ) : isConcluida ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 text-center">
                              Concluída
                            </span>
                          ) : isPausada ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 text-center">
                              Pausada
                            </span>
                          ) : isEmAndamento ? (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-[#00B2FF] border border-sky-200 text-center">
                              Em Andamento
                            </span>
                          ) : (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500 text-center">
                              Não iniciada
                            </span>
                          )
                        )}
                      </td>

                      {/* Observações */}
                      <td className="py-3 px-4">
                        {editando ? (
                          <input
                            type="text"
                            value={etapa.obs || ''}
                            onChange={(e) =>
                              handleAtualizarEtapaCustomizada(etapa.id, 'obs', e.target.value)
                            }
                            placeholder="Anotações ou detalhes..."
                            className="w-full bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-xs focus:ring-2 focus:ring-[#00B2FF] text-gray-700"
                          />
                        ) : (
                          <span
                            className="text-gray-500 text-[11px] truncate block max-w-[260px]"
                            title={etapa.obs}
                          >
                            {etapa.obs || '-'}
                          </span>
                        )}
                      </td>

                      {/* Excluir Etapa Customizada */}
                      {editando && (
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoverEtapaCustomizada(etapa.id)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="Excluir esta etapa adicional"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Botão de Adicionar Nova Etapa ao final da tabela */}
          {isAdmin && (
            <div className="p-3 bg-gray-50/40 border-t border-gray-100 flex items-center justify-center">
              <button
                type="button"
                onClick={handleAdicionarNovaEtapa}
                className="w-full sm:w-auto px-5 py-2.5 border border-dashed border-[#00B2FF]/60 hover:border-[#00B2FF] hover:bg-[#00B2FF]/5 rounded-xl text-xs font-semibold text-[#00B2FF] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <Plus size={15} />
                + Inserir Nova Etapa no Cronograma
              </button>
            </div>
          )}

          {/* Campo adicional: Observações Gerais do Cronograma */}
          <div className="p-4 bg-gray-50/60 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              Observações Gerais do Cronograma:
            </label>
            {editando ? (
              <input
                type="text"
                value={
                  formDataEtapas.observacoes_gerais ??
                  (etapasAtuais as any)?.observacoes_gerais ??
                  ''
                }
                onChange={(e) =>
                  setFormDataEtapas({
                    ...formDataEtapas,
                    observacoes_gerais: e.target.value
                  })
                }
                placeholder="Ex: Prazo sujeito à homologação da equipe de TI / Segurança..."
                className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-[#00B2FF] text-gray-800"
              />
            ) : (
              <span className="text-xs text-gray-600 flex-1">
                {(etapasAtuais as any)?.observacoes_gerais ||
                  'Nenhuma observação geral registrada.'}
              </span>
            )}
          </div>

          {/* Barra inferior de ações quando estiver editando */}
          {editando && (
            <div className="p-4 bg-white border-t border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-gray-500">
                Você pode salvar todas as etapas padrão e novas etapas criadas de uma só vez.
              </span>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={handleCancelar}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSalvar}
                  disabled={salvando}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Save size={14} />
                  {salvando ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
