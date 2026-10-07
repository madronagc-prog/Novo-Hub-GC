import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import {
  canAccessPainelInovacao,
  getPainelInovacaoRole,
  PainelInovacaoRole
} from '../constants';

import {
  InovacaoProjeto,
  InovacaoEtapas,
  InovacaoAdocao,
  InovacaoValorQualidade,
  InovacaoMetaPE,
  InovacaoConfigPE,
  METAS_PE_PADRAO
} from '../types/painelInovacao';

import { cleanFirestoreData } from '../utils/painelInovacaoCalculos';

import { ResumoPortfolioTab } from '../components/painel-inovacao/ResumoPortfolioTab';
import { ProjetosTab } from '../components/painel-inovacao/ProjetosTab';
import { EtapasTab } from '../components/painel-inovacao/EtapasTab';
import { AdocaoTab } from '../components/painel-inovacao/AdocaoTab';
import { ValorQualidadeTab } from '../components/painel-inovacao/ValorQualidadeTab';
import { MetasPETab } from '../components/painel-inovacao/MetasPETab';

import {
  Lightbulb,
  Layers,
  Calendar,
  Users,
  TrendingUp,
  Target,
  Lock,
  ArrowLeft,
  Sparkles
} from 'lucide-react';

type TabId = 'resumo' | 'projetos' | 'etapas' | 'adocao' | 'valor-qualidade' | 'metas-pe';

const defaultConfigPE: InovacaoConfigPE = { id: 'config', ano_apuracao: 2026 };

export default function PainelInovacao() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Aba ativa
  const [activeTab, setActiveTab] = useState<TabId>('resumo');

  // Estado vem só do Firestore: o que está no banco é o que aparece na tela,
  // para todo mundo, sem cache local escondendo exclusões ou edições.
  const [projetos, setProjetos] = useState<InovacaoProjeto[]>([]);
  const [etapasMap, setEtapasMap] = useState<Record<string, InovacaoEtapas>>({});
  const [adocoes, setAdocoes] = useState<InovacaoAdocao[]>([]);
  const [valores, setValores] = useState<InovacaoValorQualidade[]>([]);
  const [metas, setMetas] = useState<InovacaoMetaPE[]>(METAS_PE_PADRAO as InovacaoMetaPE[]);
  const [configPE, setConfigPE] = useState<InovacaoConfigPE>(defaultConfigPE);

  const [loadingData, setLoadingData] = useState(true);

  // Monitora autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const role: PainelInovacaoRole = useMemo(() => {
    return getPainelInovacaoRole(currentUser?.email);
  }, [currentUser]);

  const isAdmin = role === 'admin';
  const hasAccess = canAccessPainelInovacao(currentUser?.email);

  // ── Sincronização em Tempo Real com Firestore ─────────────────────────────
  useEffect(() => {
    if (!hasAccess) return;

    // 1. painel_inovacao_projetos
    const unsubProjetos = onSnapshot(
      collection(db, 'painel_inovacao_projetos'),
      (snap) => {
        const list: InovacaoProjeto[] = [];
        snap.forEach((d) => list.push(d.data() as InovacaoProjeto));
        list.sort((a, b) => a.id.localeCompare(b.id));
        setProjetos(list);
      },
      (err) => {
        console.warn('Erro ao carregar projetos do Firestore:', err);
      }
    );

    // 2. painel_inovacao_etapas
    const unsubEtapas = onSnapshot(
      collection(db, 'painel_inovacao_etapas'),
      (snap) => {
        const map: Record<string, InovacaoEtapas> = {};
        snap.forEach((d) => {
          const data = d.data() as InovacaoEtapas;
          map[data.id] = data;
        });
        setEtapasMap(map);
      },
      (err) => {
        console.warn('Erro ao carregar etapas do Firestore:', err);
      }
    );

    // 3. painel_inovacao_adocao
    const unsubAdocao = onSnapshot(
      collection(db, 'painel_inovacao_adocao'),
      (snap) => {
        const list: InovacaoAdocao[] = [];
        snap.forEach((d) => list.push(d.data() as InovacaoAdocao));
        setAdocoes(list);
      },
      (err) => {
        console.warn('Erro ao carregar adocao do Firestore:', err);
      }
    );

    // 4. painel_inovacao_valor_qualidade
    const unsubValores = onSnapshot(
      collection(db, 'painel_inovacao_valor_qualidade'),
      (snap) => {
        const list: InovacaoValorQualidade[] = [];
        snap.forEach((d) => list.push(d.data() as InovacaoValorQualidade));
        setValores(list);
      },
      (err) => {
        console.warn('Erro ao carregar valor_qualidade do Firestore:', err);
      }
    );

    // 5. painel_inovacao_metas_pe
    const unsubMetas = onSnapshot(
      collection(db, 'painel_inovacao_metas_pe'),
      (snap) => {
        const metasArr: InovacaoMetaPE[] = [];
        snap.forEach((d) => {
          if (d.id === 'config') {
            setConfigPE(d.data() as InovacaoConfigPE);
          } else {
            metasArr.push(d.data() as InovacaoMetaPE);
          }
        });
        metasArr.sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }));
        if (metasArr.length > 0) {
          setMetas(metasArr);
        }
        setLoadingData(false);
      },
      (err) => {
        console.warn('Erro ao carregar metas_pe do Firestore:', err);
        setLoadingData(false);
      }
    );

    return () => {
      unsubProjetos();
      unsubEtapas();
      unsubAdocao();
      unsubValores();
      unsubMetas();
    };
  }, [hasAccess]);

  // ── Operações direto no Firestore (ele é a única fonte de verdade) ─────────
  // O onSnapshot acima já atualiza projetos/etapas/adocoes/valores sozinho
  // assim que o Firestore confirma a escrita, então os handlers abaixo só
  // conversam com o banco, sem mexer no estado local na mão.
  const handleSalvarProjeto = async (p: InovacaoProjeto, isNovo: boolean) => {
    if (!isAdmin) return;
    const cleanP = cleanFirestoreData(p);

    try {
      await setDoc(doc(db, 'painel_inovacao_projetos', cleanP.id), cleanP);

      if (isNovo && !etapasMap[cleanP.id]) {
        const novoEtapas: InovacaoEtapas = {
          id: cleanP.id,
          mapeamento_ferramentas_inicio: cleanP.data_pedido || '',
          updatedAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'painel_inovacao_etapas', cleanP.id), novoEtapas);
      }
    } catch (err) {
      console.warn('Erro ao salvar projeto no Firestore:', err);
    }
  };

  const handleExcluirProjeto = async (id: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'painel_inovacao_projetos', id));
      await deleteDoc(doc(db, 'painel_inovacao_etapas', id)).catch(() => {});

      // Apaga também, de verdade no Firestore, os lançamentos de Adoção e de
      // Valor/Qualidade ligados a esse projeto (antes só saíam da tela, mas
      // continuavam no banco e podiam reaparecer para outras pessoas).
      const adocoesDoProjeto = adocoes.filter((a) => a.projeto_id === id);
      const valoresDoProjeto = valores.filter((v) => v.projeto_id === id);
      await Promise.all([
        ...adocoesDoProjeto.map((a) => deleteDoc(doc(db, 'painel_inovacao_adocao', a.id)).catch(() => {})),
        ...valoresDoProjeto.map((v) => deleteDoc(doc(db, 'painel_inovacao_valor_qualidade', v.id)).catch(() => {})),
      ]);
    } catch (err) {
      console.warn('Erro ao excluir projeto no Firestore:', err);
    }
  };

  const handleSalvarEtapas = async (etapas: InovacaoEtapas, projetoAtualizado?: InovacaoProjeto) => {
    if (!isAdmin) return;
    const cleanEtapas = cleanFirestoreData(etapas);

    try {
      await setDoc(doc(db, 'painel_inovacao_etapas', cleanEtapas.id), cleanEtapas);

      if (projetoAtualizado) {
        const cleanProj = cleanFirestoreData(projetoAtualizado);
        await setDoc(doc(db, 'painel_inovacao_projetos', cleanProj.id), cleanProj, { merge: true });
      }
    } catch (err) {
      console.warn('Erro ao salvar etapas no Firestore:', err);
    }
  };

  const handleSalvarAdocao = async (item: InovacaoAdocao) => {
    if (!isAdmin) return;
    const cleanItem = cleanFirestoreData(item);
    try {
      await setDoc(doc(db, 'painel_inovacao_adocao', cleanItem.id), cleanItem);
    } catch (err) {
      console.warn('Erro ao salvar adocao no Firestore:', err);
    }
  };

  const handleExcluirAdocao = async (id: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'painel_inovacao_adocao', id));
    } catch (err) {
      console.warn('Erro ao excluir adocao no Firestore:', err);
    }
  };

  const handleSalvarValorQualidade = async (item: InovacaoValorQualidade) => {
    if (!isAdmin) return;
    const cleanItem = cleanFirestoreData(item);
    try {
      await setDoc(doc(db, 'painel_inovacao_valor_qualidade', cleanItem.id), cleanItem);
    } catch (err) {
      console.warn('Erro ao salvar valor_qualidade no Firestore:', err);
    }
  };

  const handleExcluirValorQualidade = async (id: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'painel_inovacao_valor_qualidade', id));
    } catch (err) {
      console.warn('Erro ao excluir valor_qualidade no Firestore:', err);
    }
  };

  const handleSalvarMeta = async (meta: InovacaoMetaPE) => {
    if (!isAdmin) return;
    const cleanMeta = cleanFirestoreData(meta);
    try {
      await setDoc(doc(db, 'painel_inovacao_metas_pe', cleanMeta.id), cleanMeta);
    } catch (err) {
      console.warn('Erro ao salvar meta no Firestore:', err);
    }
  };

  const handleExcluirMeta = async (id: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'painel_inovacao_metas_pe', id));
    } catch (err) {
      console.warn('Erro ao excluir meta no Firestore:', err);
    }
  };

  const handleSalvarAnoApuracao = async (ano: number) => {
    if (!isAdmin) return;
    try {
      await setDoc(doc(db, 'painel_inovacao_metas_pe', 'config'), {
        id: 'config',
        ano_apuracao: ano,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn('Erro ao salvar ano de apuração no Firestore:', err);
    }
  };


  // Carregamento de autenticação
  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-gray-500">
        <div className="w-8 h-8 border-3 border-[#00B2FF] border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium text-gray-600">Verificando permissões de acesso...</p>
      </div>
    );
  }

  // Acesso negado para quem não está na lista autorizada
  if (!role) {
    return (
      <div className="min-h-[80vh] bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-red-50 text-[#FC745C] rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
            <Lock size={28} />
          </div>
          <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">
            Acesso Restrito
          </h2>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            Esta página é restrita a membros autorizados da equipe de{' '}
            <strong className="text-gray-800">Inovação, Gestão do Conhecimento & Comunicação</strong>.
          </p>
          <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 mb-6 border border-gray-200">
            Usuário conectado:{' '}
            <span className="font-semibold text-gray-700">
              {currentUser?.email || 'Não autenticado'}
            </span>
          </div>
          <Link
            to="/servicos-gc"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-[#00B2FF] hover:bg-[#009de0] text-white font-medium rounded-xl transition-all shadow-sm active:scale-98"
          >
            <ArrowLeft size={16} />
            Voltar para a Página Inicial
          </Link>
        </div>
      </div>
    );
  }

  const etapasList = Object.values(etapasMap);

  return (
    <div className="min-h-screen bg-gray-50/70 text-gray-800 pb-24">
      {/* ── Top Header Institucional (só o título) ─────────────────────── */}
      <div className="bg-white border-b border-gray-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <Lightbulb size={28} className="text-[#00B2FF]" />
            Painel de Inovação
          </h1>
        </div>

        {/* ── Abas de Navegação ────────────────────────────────────────── */}
        <div className="border-t border-gray-200/70 bg-[#fafbfc]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
              <button
                onClick={() => setActiveTab('resumo')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'resumo'
                    ? 'bg-[#00B2FF] text-white font-semibold shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-white/70 border border-gray-200/50'
                }`}
              >
                <Sparkles size={14} />
                Resumo do Portfólio
              </button>

              <button
                onClick={() => setActiveTab('projetos')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'projetos'
                    ? 'bg-[#00B2FF] text-white font-semibold shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-white/70 border border-gray-200/50'
                }`}
              >
                <Layers size={14} />
                Projetos e Iniciativas ({projetos.length})
              </button>

              <button
                onClick={() => setActiveTab('etapas')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'etapas'
                    ? 'bg-[#00B2FF] text-white font-semibold shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-white/70 border border-gray-200/50'
                }`}
              >
                <Calendar size={14} />
                Cronogramas e Etapas
              </button>

              <button
                onClick={() => setActiveTab('adocao')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'adocao'
                    ? 'bg-[#00B2FF] text-white font-semibold shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-white/70 border border-gray-200/50'
                }`}
              >
                <Users size={14} />
                Adoção e Treinamento
              </button>

              <button
                onClick={() => setActiveTab('valor-qualidade')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'valor-qualidade'
                    ? 'bg-[#00B2FF] text-white font-semibold shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-white/70 border border-gray-200/50'
                }`}
              >
                <TrendingUp size={14} />
                Valor e Qualidade
              </button>

              <button
                onClick={() => setActiveTab('metas-pe')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'metas-pe'
                    ? 'bg-[#00B2FF] text-white font-semibold shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 bg-white/70 border border-gray-200/50'
                }`}
              >
                <Target size={14} />
                Metas PE ({configPE.ano_apuracao || 2026})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Conteúdo Principal ────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {activeTab === 'resumo' && (
          <ResumoPortfolioTab
            projetos={projetos}
            valores={valores}
            onSelectTab={(tab) => setActiveTab(tab as TabId)}
          />
        )}

        {activeTab === 'projetos' && (
          <ProjetosTab
            projetos={projetos}
            isAdmin={isAdmin}
            onSalvarProjeto={handleSalvarProjeto}
            onExcluirProjeto={handleExcluirProjeto}
          />
        )}

        {activeTab === 'etapas' && (
          <EtapasTab
            projetos={projetos}
            etapasMap={etapasMap}
            isAdmin={isAdmin}
            onSalvarEtapas={handleSalvarEtapas}
            onSalvarProjeto={handleSalvarProjeto}
          />
        )}

        {activeTab === 'adocao' && (
          <AdocaoTab
            projetos={projetos}
            adocoes={adocoes}
            isAdmin={isAdmin}
            onSalvarAdocao={handleSalvarAdocao}
            onExcluirAdocao={handleExcluirAdocao}
          />
        )}

        {activeTab === 'valor-qualidade' && (
          <ValorQualidadeTab
            projetos={projetos}
            valores={valores}
            isAdmin={isAdmin}
            onSalvarValorQualidade={handleSalvarValorQualidade}
            onExcluirValorQualidade={handleExcluirValorQualidade}
          />
        )}

        {activeTab === 'metas-pe' && (
          <MetasPETab
            metas={metas}
            configPE={configPE}
            projetos={projetos}
            etapas={etapasList}
            adocoes={adocoes}
            valores={valores}
            isAdmin={isAdmin}
            onSalvarMeta={handleSalvarMeta}
            onExcluirMeta={handleExcluirMeta}
            onSalvarAnoApuracao={handleSalvarAnoApuracao}
          />
        )}
      </div>
    </div>
  );
}
