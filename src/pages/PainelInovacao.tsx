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

import {
  SEED_PROJETOS,
  SEED_ETAPAS,
  SEED_ADOCAO,
  SEED_VALOR_QUALIDADE
} from '../data/painelInovacaoSeed';
import { cleanFirestoreData } from '../utils/painelInovacaoCalculos';

import { ResumoPortfolioTab } from '../components/painel-inovacao/ResumoPortfolioTab';
import { ProjetosTab } from '../components/painel-inovacao/ProjetosTab';
import { EtapasTab } from '../components/painel-inovacao/EtapasTab';
import { AdocaoTab } from '../components/painel-inovacao/AdocaoTab';
import { ValorQualidadeTab } from '../components/painel-inovacao/ValorQualidadeTab';
import { MetasPETab } from '../components/painel-inovacao/MetasPETab';

import {
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

// ── Chaves e Helpers de Armazenamento Persistente ─────────────────────────────
const STORAGE_KEYS = {
  PROJETOS: 'painel_inovacao_projetos_v3',
  ETAPAS: 'painel_inovacao_etapas_v3',
  ADOCAO: 'painel_inovacao_adocao_v3',
  VALOR: 'painel_inovacao_valor_v3',
  METAS: 'painel_inovacao_metas_v3',
  CONFIG: 'painel_inovacao_config_v3'
};

const defaultEtapasMap: Record<string, InovacaoEtapas> = (() => {
  const map: Record<string, InovacaoEtapas> = {};
  SEED_ETAPAS.forEach((e) => {
    map[e.id] = e;
  });
  return map;
})();

const defaultConfigPE: InovacaoConfigPE = { id: 'config', ano_apuracao: 2026 };

function getLocalData<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(fallback)) {
        if (Array.isArray(parsed)) return parsed as unknown as T;
      } else if (typeof fallback === 'object' && fallback !== null) {
        if (typeof parsed === 'object' && parsed !== null && Object.keys(parsed).length > 0) return parsed as unknown as T;
      } else if (parsed !== null && parsed !== undefined) {
        return parsed as unknown as T;
      }
    }
  } catch {}
  return fallback;
}

function setLocalData(key: string, data: any) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn('Erro ao gravar no localStorage:', err);
  }
}

export default function PainelInovacao() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Aba ativa
  const [activeTab, setActiveTab] = useState<TabId>('resumo');

  // Estados com carregamento persistente imediato (não perde dados no F5)
  const [projetos, setProjetos] = useState<InovacaoProjeto[]>(() => {
    return getLocalData(STORAGE_KEYS.PROJETOS, SEED_PROJETOS);
  });

  const [etapasMap, setEtapasMap] = useState<Record<string, InovacaoEtapas>>(() => {
    const loaded = getLocalData<Record<string, InovacaoEtapas>>(STORAGE_KEYS.ETAPAS, defaultEtapasMap);
    // Recupera também chaves unitárias de contingência salvas anteriormente
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('painel_etapas_') || k.startsWith('painel_inovacao_etapas_'))) {
          const val = localStorage.getItem(k);
          if (val) {
            const parsed = JSON.parse(val);
            if (parsed && parsed.id) {
              loaded[parsed.id] = { ...loaded[parsed.id], ...parsed };
            }
          }
        }
      }
    } catch {}
    return loaded;
  });

  const [adocoes, setAdocoes] = useState<InovacaoAdocao[]>(() => {
    return getLocalData(STORAGE_KEYS.ADOCAO, SEED_ADOCAO);
  });

  const [valores, setValores] = useState<InovacaoValorQualidade[]>(() => {
    return getLocalData(STORAGE_KEYS.VALOR, SEED_VALOR_QUALIDADE);
  });

  const [metas, setMetas] = useState<InovacaoMetaPE[]>(() => {
    return getLocalData(STORAGE_KEYS.METAS, METAS_PE_PADRAO as InovacaoMetaPE[]);
  });

  const [configPE, setConfigPE] = useState<InovacaoConfigPE>(() => {
    return getLocalData(STORAGE_KEYS.CONFIG, defaultConfigPE);
  });

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
        if (snap.empty) {
          // Se o Firestore estiver vazio, preserva o que está no cache local do usuário e sobe para o banco
          const atuais = getLocalData(STORAGE_KEYS.PROJETOS, SEED_PROJETOS);
          setProjetos(atuais);
          atuais.forEach((p) => {
            setDoc(doc(db, 'painel_inovacao_projetos', p.id), p).catch(() => {});
          });
        } else {
          const list: InovacaoProjeto[] = [];
          snap.forEach((d) => list.push(d.data() as InovacaoProjeto));
          list.sort((a, b) => a.id.localeCompare(b.id));
          setProjetos(list);
          setLocalData(STORAGE_KEYS.PROJETOS, list);
        }
      },
      (err) => {
        console.warn('Aviso ao carregar projetos do Firestore (mantendo dados salvos):', err);
        const locais = getLocalData(STORAGE_KEYS.PROJETOS, SEED_PROJETOS);
        setProjetos(locais);
      }
    );

    // 2. painel_inovacao_etapas
    const unsubEtapas = onSnapshot(
      collection(db, 'painel_inovacao_etapas'),
      (snap) => {
        if (snap.empty) {
          // Se o Firestore estiver vazio, preserva as etapas e novas etapas salvas localmente
          const atuais = getLocalData(STORAGE_KEYS.ETAPAS, defaultEtapasMap);
          setEtapasMap(atuais);
          Object.values(atuais).forEach((e) => {
            setDoc(doc(db, 'painel_inovacao_etapas', e.id), e).catch(() => {});
          });
        } else {
          const map: Record<string, InovacaoEtapas> = {};
          snap.forEach((d) => {
            const data = d.data() as InovacaoEtapas;
            map[data.id] = data;
          });
          // Mescla com etapas personalizadas locais se houver
          const locais = getLocalData(STORAGE_KEYS.ETAPAS, defaultEtapasMap);
          const mesclado = { ...locais, ...map };
          setEtapasMap(mesclado);
          setLocalData(STORAGE_KEYS.ETAPAS, mesclado);
        }
      },
      (err) => {
        console.warn('Aviso ao carregar etapas do Firestore (mantendo dados salvos):', err);
        const locais = getLocalData(STORAGE_KEYS.ETAPAS, defaultEtapasMap);
        setEtapasMap(locais);
      }
    );

    // 3. painel_inovacao_adocao
    const unsubAdocao = onSnapshot(
      collection(db, 'painel_inovacao_adocao'),
      (snap) => {
        if (snap.empty) {
          const atuais = getLocalData(STORAGE_KEYS.ADOCAO, SEED_ADOCAO);
          setAdocoes(atuais);
          atuais.forEach((a) => {
            setDoc(doc(db, 'painel_inovacao_adocao', a.id), a).catch(() => {});
          });
        } else {
          const list: InovacaoAdocao[] = [];
          snap.forEach((d) => list.push(d.data() as InovacaoAdocao));
          setAdocoes(list);
          setLocalData(STORAGE_KEYS.ADOCAO, list);
        }
      },
      (err) => {
        console.warn('Aviso ao carregar adocao do Firestore:', err);
        const locais = getLocalData(STORAGE_KEYS.ADOCAO, SEED_ADOCAO);
        setAdocoes(locais);
      }
    );

    // 4. painel_inovacao_valor_qualidade
    const unsubValores = onSnapshot(
      collection(db, 'painel_inovacao_valor_qualidade'),
      (snap) => {
        if (snap.empty) {
          const atuais = getLocalData(STORAGE_KEYS.VALOR, SEED_VALOR_QUALIDADE);
          setValores(atuais);
          atuais.forEach((v) => {
            setDoc(doc(db, 'painel_inovacao_valor_qualidade', v.id), v).catch(() => {});
          });
        } else {
          const list: InovacaoValorQualidade[] = [];
          snap.forEach((d) => list.push(d.data() as InovacaoValorQualidade));
          setValores(list);
          setLocalData(STORAGE_KEYS.VALOR, list);
        }
      },
      (err) => {
        console.warn('Aviso ao carregar valor_qualidade do Firestore:', err);
        const locais = getLocalData(STORAGE_KEYS.VALOR, SEED_VALOR_QUALIDADE);
        setValores(locais);
      }
    );

    // 5. painel_inovacao_metas_pe
    const unsubMetas = onSnapshot(
      collection(db, 'painel_inovacao_metas_pe'),
      (snap) => {
        if (snap.empty) {
          const atuais = getLocalData(STORAGE_KEYS.METAS, METAS_PE_PADRAO as InovacaoMetaPE[]);
          const configAtual = getLocalData(STORAGE_KEYS.CONFIG, defaultConfigPE);
          setMetas(atuais);
          setConfigPE(configAtual);
          atuais.forEach((m) => {
            setDoc(doc(db, 'painel_inovacao_metas_pe', m.id), m).catch(() => {});
          });
          setDoc(doc(db, 'painel_inovacao_metas_pe', 'config'), configAtual).catch(() => {});
        } else {
          const metasArr: InovacaoMetaPE[] = [];
          snap.forEach((d) => {
            if (d.id === 'config') {
              const cfg = d.data() as InovacaoConfigPE;
              setConfigPE(cfg);
              setLocalData(STORAGE_KEYS.CONFIG, cfg);
            } else {
              metasArr.push(d.data() as InovacaoMetaPE);
            }
          });
          metasArr.sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }));
          if (metasArr.length > 0) {
            setMetas(metasArr);
            setLocalData(STORAGE_KEYS.METAS, metasArr);
          }
        }
        setLoadingData(false);
      },
      (err) => {
        console.warn('Aviso ao carregar metas_pe do Firestore:', err);
        const locais = getLocalData(STORAGE_KEYS.METAS, METAS_PE_PADRAO as InovacaoMetaPE[]);
        setMetas(locais);
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

  // ── Operações com Persistência Garantida (Local + Firestore) ───────────────
  const handleSalvarProjeto = async (p: InovacaoProjeto, isNovo: boolean) => {
    if (!isAdmin) return;
    const cleanP = cleanFirestoreData(p);
    setProjetos((prev) => {
      const exists = prev.some((item) => item.id === cleanP.id);
      const updated = exists
        ? prev.map((item) => (item.id === cleanP.id ? cleanP : item))
        : [...prev, cleanP].sort((a, b) => a.id.localeCompare(b.id));
      setLocalData(STORAGE_KEYS.PROJETOS, updated);
      return updated;
    });

    if (isNovo && !etapasMap[cleanP.id]) {
      const novoEtapas: InovacaoEtapas = {
        id: cleanP.id,
        mapeamento_ferramentas_inicio: cleanP.data_pedido || '',
        updatedAt: new Date().toISOString()
      };
      setEtapasMap((prev) => {
        const updated = { ...prev, [cleanP.id]: novoEtapas };
        setLocalData(STORAGE_KEYS.ETAPAS, updated);
        return updated;
      });
      setDoc(doc(db, 'painel_inovacao_etapas', cleanP.id), novoEtapas).catch(() => {});
    }

    try {
      await setDoc(doc(db, 'painel_inovacao_projetos', cleanP.id), cleanP, { merge: true });
      // Backup em settings caso regras customizadas estejam pendentes
      await setDoc(doc(db, 'settings', `pi_proj_${cleanP.id}`), { data: cleanP, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
    } catch (err) {
      console.warn('Erro na nuvem (mantido no armazenamento local):', err);
    }
  };

  const handleExcluirProjeto = async (id: string) => {
    if (!isAdmin) return;
    setProjetos((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      setLocalData(STORAGE_KEYS.PROJETOS, updated);
      return updated;
    });
    setEtapasMap((prev) => {
      const copy = { ...prev };
      delete copy[id];
      setLocalData(STORAGE_KEYS.ETAPAS, copy);
      return copy;
    });
    setAdocoes((prev) => {
      const updated = prev.filter((a) => a.projeto_id !== id);
      setLocalData(STORAGE_KEYS.ADOCAO, updated);
      return updated;
    });
    setValores((prev) => {
      const updated = prev.filter((v) => v.projeto_id !== id);
      setLocalData(STORAGE_KEYS.VALOR, updated);
      return updated;
    });
    try {
      await deleteDoc(doc(db, 'painel_inovacao_projetos', id));
      await deleteDoc(doc(db, 'painel_inovacao_etapas', id)).catch(() => {});
      await deleteDoc(doc(db, 'settings', `pi_proj_${id}`)).catch(() => {});
    } catch (err) {
      console.warn('Erro ao excluir no Firestore:', err);
    }
  };

  const handleSalvarEtapas = async (etapas: InovacaoEtapas, projetoAtualizado?: InovacaoProjeto) => {
    if (!isAdmin) return;
    const cleanEtapas = cleanFirestoreData(etapas);

    // 1. Atualização imediata no estado e no LocalStorage
    setEtapasMap((prev) => {
      const updated = {
        ...prev,
        [cleanEtapas.id]: cleanEtapas
      };
      setLocalData(STORAGE_KEYS.ETAPAS, updated);
      return updated;
    });

    // 2. Atualização otimista do projeto se houver alteração de título ou etapa
    if (projetoAtualizado) {
      const cleanProj = cleanFirestoreData(projetoAtualizado);
      setProjetos((prev) => {
        const updated = prev.map((p) => (p.id === cleanProj.id ? cleanProj : p));
        setLocalData(STORAGE_KEYS.PROJETOS, updated);
        return updated;
      });
      setDoc(doc(db, 'painel_inovacao_projetos', cleanProj.id), cleanProj, { merge: true }).catch(() => {});
    }

    // 3. Persistência em Firestore (coleção principal + backup em settings)
    try {
      await setDoc(doc(db, 'painel_inovacao_etapas', cleanEtapas.id), cleanEtapas, { merge: true });
      await setDoc(doc(db, 'settings', `pi_etapas_${cleanEtapas.id}`), { data: cleanEtapas, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
    } catch (err) {
      console.warn('Erro ao sincronizar com Firestore (mantido com segurança no armazenamento local):', err);
    }
  };

  const handleSalvarAdocao = async (item: InovacaoAdocao) => {
    if (!isAdmin) return;
    const cleanItem = cleanFirestoreData(item);
    setAdocoes((prev) => {
      const exists = prev.some((a) => a.id === cleanItem.id);
      const updated = exists ? prev.map((a) => (a.id === cleanItem.id ? cleanItem : a)) : [...prev, cleanItem];
      setLocalData(STORAGE_KEYS.ADOCAO, updated);
      return updated;
    });
    try {
      await setDoc(doc(db, 'painel_inovacao_adocao', cleanItem.id), cleanItem, { merge: true });
    } catch (err) {
      console.warn('Erro ao persistir adocao no Firestore:', err);
    }
  };

  const handleExcluirAdocao = async (id: string) => {
    if (!isAdmin) return;
    setAdocoes((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      setLocalData(STORAGE_KEYS.ADOCAO, updated);
      return updated;
    });
    try {
      await deleteDoc(doc(db, 'painel_inovacao_adocao', id));
    } catch (err) {
      console.warn('Erro ao excluir adocao no Firestore:', err);
    }
  };

  const handleSalvarValorQualidade = async (item: InovacaoValorQualidade) => {
    if (!isAdmin) return;
    const cleanItem = cleanFirestoreData(item);
    setValores((prev) => {
      const exists = prev.some((v) => v.id === cleanItem.id);
      const updated = exists ? prev.map((v) => (v.id === cleanItem.id ? cleanItem : v)) : [...prev, cleanItem];
      setLocalData(STORAGE_KEYS.VALOR, updated);
      return updated;
    });
    try {
      await setDoc(doc(db, 'painel_inovacao_valor_qualidade', cleanItem.id), cleanItem, { merge: true });
    } catch (err) {
      console.warn('Erro ao persistir valor_qualidade no Firestore:', err);
    }
  };

  const handleExcluirValorQualidade = async (id: string) => {
    if (!isAdmin) return;
    setValores((prev) => {
      const updated = prev.filter((v) => v.id !== id);
      setLocalData(STORAGE_KEYS.VALOR, updated);
      return updated;
    });
    try {
      await deleteDoc(doc(db, 'painel_inovacao_valor_qualidade', id));
    } catch (err) {
      console.warn('Erro ao excluir valor_qualidade no Firestore:', err);
    }
  };

  const handleSalvarMeta = async (meta: InovacaoMetaPE) => {
    if (!isAdmin) return;
    const cleanMeta = cleanFirestoreData(meta);
    setMetas((prev) => {
      const exists = prev.some((m) => m.id === cleanMeta.id);
      const updated = exists
        ? prev.map((m) => (m.id === cleanMeta.id ? cleanMeta : m))
        : [...prev, cleanMeta];
      updated.sort((a, b) => a.codigo.localeCompare(b.codigo, undefined, { numeric: true }));
      setLocalData(STORAGE_KEYS.METAS, updated);
      return updated;
    });
    try {
      await setDoc(doc(db, 'painel_inovacao_metas_pe', cleanMeta.id), cleanMeta, { merge: true });
    } catch (err) {
      console.warn('Erro ao persistir meta no Firestore:', err);
    }
  };

  const handleExcluirMeta = async (id: string) => {
    if (!isAdmin) return;
    setMetas((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      setLocalData(STORAGE_KEYS.METAS, updated);
      return updated;
    });
    try {
      await deleteDoc(doc(db, 'painel_inovacao_metas_pe', id));
    } catch (err) {
      console.warn('Erro ao excluir meta no Firestore:', err);
    }
  };

  const handleSalvarAnoApuracao = async (ano: number) => {
    if (!isAdmin) return;
    setConfigPE((prev) => {
      const updated = { ...prev, ano_apuracao: ano };
      setLocalData(STORAGE_KEYS.CONFIG, updated);
      return updated;
    });
    try {
      await setDoc(doc(db, 'painel_inovacao_metas_pe', 'config'), {
        id: 'config',
        ano_apuracao: ano,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn('Erro ao persistir config ano_apuracao no Firestore:', err);
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
      {/* ── Top Header Institucional removido a pedido do Filipi ──────── */}
      <div className="bg-white border-b border-gray-200/80 shadow-xs">
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
