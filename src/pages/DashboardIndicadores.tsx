import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase';
import { getDashboardIndicadoresRole, DashboardIndicadoresRole } from '../constants';
import AcademiaMadronaView from '../components/dashboard/AcademiaMadronaView';
import BibAquisicoesView from '../components/dashboard/BibAquisicoesView';
import FerrAssinaturaView from '../components/dashboard/FerrAssinaturaView';
import ImpAtividadesView from '../components/dashboard/ImpAtividadesView';
import TsCtView from '../components/dashboard/TsCtView';
import PubCapitalView from '../components/dashboard/PubCapitalView';
import ImpClippingView from '../components/dashboard/ImpClippingView';
import EmailContribuicoesView from '../components/dashboard/EmailContribuicoesView';
import PubControleView from '../components/dashboard/PubControleView';
import FerrCopilotView from '../components/dashboard/FerrCopilotView';
import RedeEmbaixadoresView from '../components/dashboard/RedeEmbaixadoresView';
import GruposEstudosView from '../components/dashboard/GruposEstudosView';
import FerrImView from '../components/dashboard/FerrImView';
import LexJurisView from '../components/dashboard/LexJurisView';
import FerrLexterView from '../components/dashboard/FerrLexterView';
import EmailMailingView from '../components/dashboard/EmailMailingView';
import BibMbView from '../components/dashboard/BibMbView';
import RedeNewsLinkedinView from '../components/dashboard/RedeNewsLinkedinView';
import PesquisasView from '../components/dashboard/PesquisasView';
import FerrPortDataView from '../components/dashboard/FerrPortDataView';
import RedePostsPatrocinadosView from '../components/dashboard/RedePostsPatrocinadosView';
import BibProViewView from '../components/dashboard/BibProViewView';
import EmailRadarView from '../components/dashboard/EmailRadarView';
import RedeSociaisView from '../components/dashboard/RedeSociaisView';
import FerrSagaView from '../components/dashboard/FerrSagaView';
import ScoutsView from '../components/dashboard/ScoutsView';
import AcadTreinamentoImView from '../components/dashboard/AcadTreinamentoImView';
import PubUnsNumerosView from '../components/dashboard/PubUnsNumerosView';
import FerrUpMinerView from '../components/dashboard/FerrUpMinerView';
import TsGcView from '../components/dashboard/TsGcView';
import VisaoGeralView from '../components/dashboard/VisaoGeralView';
import PubResumoView from '../components/dashboard/PubResumoView';
import RedeResumoView from '../components/dashboard/RedeResumoView';
import EmailMktResumoView from '../components/dashboard/EmailMktResumoView';
import ImpResumoView from '../components/dashboard/ImpResumoView';
import AcademiaResumoView from '../components/dashboard/AcademiaResumoView';
import TsResumoView from '../components/dashboard/TsResumoView';
import { normalizarUN, normalizarPosicao, normalizarMes } from '../utils/padronizacao';
import {
  BarChart3,
  Calendar,
  Lock,
  ShieldCheck,
  Eye,
  ArrowLeft,
  Layers,
  FileText,
  FileCheck,
  Share2,
  Mail,
  Newspaper,
  GraduationCap,
  Users,
  Scale,
  Clock,
  Wrench,
  Coins,
  Library,
  Compass,
  Search,
  Sparkles,
  ChevronRight,
  Database,
  Info
} from 'lucide-react';

// ============================================================================
// Tipos e Definições de Navegação
// ============================================================================

export type MainTabId =
  | 'visao-geral'
  | 'publicacoes'
  | 'redes'
  | 'email-mkt'
  | 'imprensa'
  | 'academia-treinamentos'
  | 'grupos-estudos-rt'
  | 'lex-juris'
  | 'time-sheet'
  | 'ferramentas'
  | 'lab-coins'
  | 'bibliotecas'
  | 'scouts'
  | 'pesquisas';

export interface TabDefinition {
  id: MainTabId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  subTabs?: { id: string; label: string }[];
  description: string;
}

export const MAIN_TABS: TabDefinition[] = [
  {
    id: 'visao-geral',
    label: 'Visão Geral',
    icon: BarChart3,
    description: 'Indicadores consolidados de desempenho e métricas gerais integradas.',
    subTabs: [
      { id: 'gc', label: 'Gestão do Conhecimento' },
      { id: 'com', label: 'Comunicação' }
    ]
  },
  {
    id: 'publicacoes',
    label: 'Publicações',
    icon: FileText,
    description: 'Acompanhamento de artigos, newsletters, informes e métricas de UNs.',
    subTabs: [
      { id: 'resumo', label: 'Resumo' },
      { id: 'capital-aberto', label: 'Capital Aberto' },
      { id: 'controle-publicacoes', label: 'Controle de Publicações' },
      { id: 'uns-em-numeros', label: 'UNs em Números' }
    ]
  },
  {
    id: 'redes',
    label: 'Redes',
    icon: Share2,
    description: 'Alcance, engajamento e métricas de redes sociais e canais digitais.',
    subTabs: [
      { id: 'resumo', label: 'Resumo' },
      { id: 'embaixadores', label: 'Embaixadores' },
      { id: 'news-linkedin', label: 'News LinkedIn' },
      { id: 'posts-patrocinados-linkedin', label: 'Posts Patrocinados LinkedIn' },
      { id: 'redes-sociais', label: 'Redes Sociais' }
    ]
  },
  {
    id: 'email-mkt',
    label: 'E-mail MKT',
    icon: Mail,
    description: 'Disparos de campanhas, newsletters, taxas de abertura e mailing.',
    subTabs: [
      { id: 'resumo', label: 'Resumo' },
      { id: 'contribuicoes-jornal-bf', label: 'Contribuições Jornal B&F' },
      { id: 'mailing', label: 'Mailing' },
      { id: 'radar-tributario', label: 'Radar Tributário' }
    ]
  },
  {
    id: 'imprensa',
    label: 'Imprensa',
    icon: Newspaper,
    description: 'Exposição na mídia, clipagem institucional e ações com a assessoria.',
    subTabs: [
      { id: 'resumo', label: 'Resumo' },
      { id: 'atividades-imprensa', label: 'Atividades Imprensa' },
      { id: 'clipping-com', label: 'Clipping COM' }
    ]
  },
  {
    id: 'academia-treinamentos',
    label: 'Academia e Treinamentos',
    icon: GraduationCap,
    description: 'Cursos, treinamentos internos e capacitação continuada de colaboradores.',
    subTabs: [
      { id: 'resumo', label: 'Resumo' },
      { id: 'academia-madrona', label: 'Academia Madrona' },
      { id: 'treinamento-im', label: 'Treinamento iM' }
    ]
  },
  {
    id: 'grupos-estudos-rt',
    label: 'Grupos de Estudos e RT',
    icon: Users,
    description: 'Encontros técnicos, reuniões temáticas e debates multidisciplinares.'
  },
  {
    id: 'lex-juris',
    label: 'Lex & Juris',
    icon: Scale,
    description: 'Métricas de consulta jurídica, pesquisas de legislação e jurisprudência.'
  },
  {
    id: 'time-sheet',
    label: 'Time Sheet',
    icon: Clock,
    description: 'Horas dedicadas a projetos, atividades e suporte especializado.',
    subTabs: [
      { id: 'resumo', label: 'Resumo' },
      { id: 'ts-ct', label: 'TS CT' },
      { id: 'ts-gc', label: 'TS GC' }
    ]
  },
  {
    id: 'ferramentas',
    label: 'Ferramentas',
    icon: Wrench,
    description: 'Utilização e adoção de softwares, plataformas e soluções de tecnologia.',
    subTabs: [
      { id: 'assinatura-eletronica', label: 'Assinatura Eletrônica' },
      { id: 'copilot', label: 'Copilot' },
      { id: 'im', label: 'iM' },
      { id: 'lexter', label: 'Lexter' },
      { id: 'portdata', label: 'PortData' },
      { id: 'saga', label: 'Saga' },
      { id: 'upminer', label: 'upMiner' }
    ]
  },
  {
    id: 'lab-coins',
    label: 'Lab Coins',
    icon: Coins,
    description: 'Pontuação, engajamento e gamificação no programa de inovação.'
  },
  {
    id: 'bibliotecas',
    label: 'Bibliotecas',
    icon: Library,
    description: 'Gestão de acervo físico e digital, assinaturas e novos títulos.',
    subTabs: [
      { id: 'aquisicoes', label: 'Aquisições' },
      { id: 'mb', label: 'MB' },
      { id: 'proview', label: 'ProView' }
    ]
  },
  {
    id: 'scouts',
    label: 'Scouts',
    icon: Compass,
    description: 'Mapeamento de oportunidades, monitoramento setorial e prospecção técnica.'
  },
  {
    id: 'pesquisas',
    label: 'Pesquisas',
    icon: Search,
    description: 'Demandas de pesquisa aprofundada, memorandos e levantamentos de dados.'
  }
];

export const MAIN_TABS_ROW_1 = MAIN_TABS.slice(0, 7);
export const MAIN_TABS_ROW_2 = MAIN_TABS.slice(7, 14);

export const MONTHS = [
  'Todos os meses',
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];

export default function DashboardIndicadores() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Navegação
  const [activeMainTab, setActiveMainTab] = useState<MainTabId>('visao-geral');
  const [activeSubTab, setActiveSubTab] = useState<string>('gc');
  const [selectedMonth, setSelectedMonth] = useState<string>('Todos os meses');

  // Monitora usuário autenticado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const role: DashboardIndicadoresRole = useMemo(() => {
    return getDashboardIndicadoresRole(currentUser?.email);
  }, [currentUser]);

  // Ao trocar de aba principal, define a sub-aba padrão
  const handleSelectMainTab = (tabId: MainTabId) => {
    setActiveMainTab(tabId);
    const tabDef = MAIN_TABS.find((t) => t.id === tabId);
    if (tabDef?.subTabs && tabDef.subTabs.length > 0) {
      setActiveSubTab(tabDef.subTabs[0].id);
    } else {
      setActiveSubTab('');
    }
  };

  const currentTabDef = useMemo(() => {
    return MAIN_TABS.find((t) => t.id === activeMainTab) || MAIN_TABS[0];
  }, [activeMainTab]);

  const currentSubTabLabel = useMemo(() => {
    if (!currentTabDef.subTabs || currentTabDef.subTabs.length === 0) return null;
    const sub = currentTabDef.subTabs.find((s) => s.id === activeSubTab);
    return sub ? sub.label : currentTabDef.subTabs[0]?.label;
  }, [currentTabDef, activeSubTab]);

  // Carregamento de autenticação
  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-gray-500">
        <div className="w-8 h-8 border-3 border-brand-blue border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium text-gray-600">Verificando permissões de acesso...</p>
      </div>
    );
  }

  // Acesso negado para quem não está na lista autorizada
  if (!role) {
    return (
      <div className="min-h-[80vh] bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
            <Lock size={28} />
          </div>
          <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">
            Acesso Restrito
          </h2>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            Esta página é restrita a membros autorizados da equipe de{' '}
            <strong className="text-gray-800">Gestão do Conhecimento & Comunicação</strong>.
          </p>
          <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 mb-6 border border-gray-200">
            Usuário conectado:{' '}
            <span className="font-semibold text-gray-700">
              {currentUser?.email || 'Não autenticado'}
            </span>
          </div>
          <Link
            to="/servicos-gc"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-brand-blue hover:bg-[#009de0] text-white font-medium rounded-xl transition-all shadow-sm active:scale-98"
          >
            <ArrowLeft size={16} />
            Voltar para a Página Inicial
          </Link>
        </div>
      </div>
    );
  }

  // Página autorizada
  return (
    <div className="min-h-screen bg-gray-50/60 text-brand-grafite pb-24">
      {/* ==================================================================== */}
      {/* Top Banner / Header Institucional                                    */}
      {/* ==================================================================== */}
      <div className="bg-white border-b border-gray-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 tracking-tight">
                Dashboard de Indicadores
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Gestão do Conhecimento & Comunicação — Monitoramento estratégico de métricas, entregas e engajamento.
              </p>
            </div>
          </div>

        {/* ================================================================== */}
        {/* Nível 1: Navegação Principal em Duas Linhas Fixas (7 abas / linha) */}
        {/* ================================================================== */}
        <div className="border-t border-gray-200/70 bg-[#fafbfc]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 space-y-1.5">
            {/* Linha 1: Visão Geral | Publicações | Redes | E-mail MKT | Imprensa | Academia e Treinamentos | Grupos de Estudos e RT */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 w-full">
              {MAIN_TABS_ROW_1.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeMainTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleSelectMainTab(tab.id)}
                    className={`inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-xs font-medium transition-all text-center cursor-pointer w-full min-w-0 ${
                      isActive
                        ? 'bg-brand-blue text-white shadow-xs font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/90 bg-white/70 border border-gray-200/50'
                    }`}
                  >
                    <Icon size={15} className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Linha 2: Lex & Juris | Time Sheet | Ferramentas | Lab Coins | Bibliotecas | Scouts | Pesquisas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 w-full">
              {MAIN_TABS_ROW_2.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeMainTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleSelectMainTab(tab.id)}
                    className={`inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-xs font-medium transition-all text-center cursor-pointer w-full min-w-0 ${
                      isActive
                        ? 'bg-brand-blue text-white shadow-xs font-semibold'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/90 bg-white/70 border border-gray-200/50'
                    }`}
                  >
                    <Icon size={15} className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* Nível 2: Sub-navegação (quando houver sub-abas)                     */}
        {/* ================================================================== */}
        {currentTabDef.subTabs && currentTabDef.subTabs.length > 0 && (
          <div className="border-t border-gray-100 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1 mr-1 flex-shrink-0">
                  <Layers size={13} className="text-brand-blue" />
                  Sub-abas:
                </span>
                {currentTabDef.subTabs.map((sub) => {
                  const isSubActive = activeSubTab === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setActiveSubTab(sub.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 cursor-pointer ${
                        isSubActive
                          ? 'bg-brand-navy text-white shadow-xs font-semibold'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {sub.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* Área de Conteúdo da Página                                           */}
      {/* ==================================================================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Barra de Filtro de Mês e Contexto */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 shadow-xs mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Breadcrumb / Localização Atual */}
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 flex-wrap">
              <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                <currentTabDef.icon size={16} className="text-brand-blue" />
                {currentTabDef.label}
              </span>
              {currentSubTabLabel && (
                <>
                  <ChevronRight size={14} className="text-gray-400" />
                  <span className="font-semibold text-brand-navy bg-slate-100 px-2 py-0.5 rounded-md">
                    {currentSubTabLabel}
                  </span>
                </>
              )}
            </div>

            {/* Filtro de Mês ou Indicador de Contrato Vigente / Base Cadastral */}
            {activeMainTab === 'ferramentas' && activeSubTab === 'assinatura-eletronica' ? (
              <div className="flex items-center gap-2 bg-blue-50/80 border border-blue-200 px-3 py-1.5 rounded-xl text-xs text-brand-blue font-semibold shadow-2xs">
                <FileCheck size={14} className="text-brand-blue" />
                <span>Status de Contrato Vigente (Jan/2026 - Jan/2027)</span>
              </div>
            ) : activeMainTab === 'time-sheet' && activeSubTab === 'ts-ct' ? (
              <div className="flex items-center gap-2 bg-blue-50/80 border border-blue-200 px-3 py-1.5 rounded-xl text-xs text-brand-blue font-semibold shadow-2xs">
                <Users size={14} className="text-brand-blue" />
                <span>Base Cadastral Ativa (Headcount Geral)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <label
                  htmlFor="month-filter"
                  className="text-xs font-semibold text-gray-600 flex items-center gap-1.5 flex-shrink-0"
                >
                  <Calendar size={15} className="text-brand-blue" />
                  Filtrar por Mês:
                </label>
                <div className="relative">
                  <select
                    id="month-filter"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-gray-50 border border-gray-200 text-gray-800 text-xs sm:text-sm rounded-xl px-3 py-1.5 pr-8 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent font-medium cursor-pointer"
                  >
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================================================================== */}
        {/* Renderização de Conteúdo: Específico ou Container Vazio            */}
        {/* ================================================================== */}
        {activeMainTab === 'visao-geral' ? (
          <VisaoGeralView activeSubTab={activeSubTab} selectedMonth={selectedMonth} />
        ) : activeMainTab === 'publicacoes' && activeSubTab === 'resumo' ? (
          <PubResumoView selectedMonth={selectedMonth} />
        ) : activeMainTab === 'redes' && activeSubTab === 'resumo' ? (
          <RedeResumoView selectedMonth={selectedMonth} />
        ) : activeMainTab === 'email-mkt' && activeSubTab === 'resumo' ? (
          <EmailMktResumoView selectedMonth={selectedMonth} />
        ) : activeMainTab === 'imprensa' && activeSubTab === 'resumo' ? (
          <ImpResumoView selectedMonth={selectedMonth} />
        ) : activeMainTab === 'academia-treinamentos' && activeSubTab === 'resumo' ? (
          <AcademiaResumoView selectedMonth={selectedMonth} />
        ) : activeMainTab === 'time-sheet' && activeSubTab === 'resumo' ? (
          <TsResumoView selectedMonth={selectedMonth} />
        ) : activeMainTab === 'academia-treinamentos' && activeSubTab === 'academia-madrona' ? (
          <AcademiaMadronaView selectedMonth={selectedMonth} />
        ) : activeMainTab === 'academia-treinamentos' && activeSubTab === 'treinamento-im' ? (
          <AcadTreinamentoImView selectedMonth={selectedMonth} />
        ) : activeMainTab === 'bibliotecas' && activeSubTab === 'aquisicoes' ? (
          <BibAquisicoesView selectedMonth={selectedMonth} />
        ) : activeMainTab === 'bibliotecas' && activeSubTab === 'mb' ? (
          <BibMbView selectedMonth={selectedMonth} />
        ) : activeMainTab === 'bibliotecas' && activeSubTab === 'proview' ? (
          <BibProViewView selectedMonth={selectedMonth} />
        ) : activeMainTab === 'ferramentas' && activeSubTab === 'assinatura-eletronica' ? (
          <FerrAssinaturaView />
        ) : activeMainTab === 'ferramentas' && activeSubTab === 'copilot' ? (
          <FerrCopilotView selectedMonth={selectedMonth} />
        ) : activeMainTab === 'ferramentas' && activeSubTab === 'im' ? (
          <FerrImView selectedMonth={selectedMonth} />
        ) : activeMainTab === 'ferramentas' && activeSubTab === 'lexter' ? (
          <FerrLexterView selectedMonth={selectedMonth} />
        ) : activeMainTab === 'ferramentas' && activeSubTab === 'portdata' ? (
          <FerrPortDataView selectedMonth={selectedMonth} />
        ) : activeMainTab === 'ferramentas' && activeSubTab === 'saga' ? (
          <FerrSagaView />
        ) : activeMainTab === 'ferramentas' && activeSubTab === 'upminer' ? (
          <FerrUpMinerView selectedMonth={selectedMonth} />
        ) : activeMainTab === 'imprensa' && activeSubTab === 'atividades-imprensa' ? (
          <ImpAtividadesView selectedMonth={selectedMonth} />
        ) : activeMainTab === 'time-sheet' && activeSubTab === 'ts-ct' ? (
          <TsCtView selectedMonth={selectedMonth} />
        ) : activeMainTab === 'time-sheet' && activeSubTab === 'ts-gc' ? (
          <TsGcView selectedMonth={selectedMonth} />
        ) : activeMainTab === 'publicacoes' && activeSubTab === 'capital-aberto' ? (
          <PubCapitalView selectedMonth={selectedMonth} />
        ) : activeMainTab === 'publicacoes' && activeSubTab === 'controle-publicacoes' ? (
          <PubControleView selectedMonth={selectedMonth} />
        ) : activeMainTab === 'publicacoes' && activeSubTab === 'uns-em-numeros' ? (
          <PubUnsNumerosView />
        ) : activeMainTab === 'imprensa' && activeSubTab === 'clipping-com' ? (
          <ImpClippingView selectedMonth={selectedMonth} />
        ) : activeMainTab === 'email-mkt' && (activeSubTab === 'contribuicoes-jornal-bf' || activeSubTab === 'contribuicoes-bf') ? (
          <EmailContribuicoesView selectedMonth={selectedMonth} />
        ) : activeMainTab === 'email-mkt' && activeSubTab === 'mailing' ? (
          <EmailMailingView selectedMonth={selectedMonth} />
        ) : activeMainTab === 'email-mkt' && activeSubTab === 'radar-tributario' ? (
          <EmailRadarView selectedMonth={selectedMonth} />
        ) : activeMainTab === 'redes' && activeSubTab === 'embaixadores' ? (
          <RedeEmbaixadoresView selectedMonth={selectedMonth} />
        ) : activeMainTab === 'redes' && activeSubTab === 'news-linkedin' ? (
          <RedeNewsLinkedinView selectedMonth={selectedMonth} />
        ) : activeMainTab === 'redes' && activeSubTab === 'posts-patrocinados-linkedin' ? (
          <RedePostsPatrocinadosView selectedMonth={selectedMonth} />
        ) : activeMainTab === 'redes' && activeSubTab === 'redes-sociais' ? (
          <RedeSociaisView selectedMonth={selectedMonth} />
        ) : activeMainTab === 'grupos-estudos-rt' ? (
          <GruposEstudosView selectedMonth={selectedMonth} />
        ) : activeMainTab === 'lex-juris' ? (
          <LexJurisView selectedMonth={selectedMonth} />
        ) : activeMainTab === 'scouts' ? (
          <ScoutsView selectedMonth={selectedMonth} />
        ) : activeMainTab === 'pesquisas' ? (
          <PesquisasView selectedMonth={selectedMonth} />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
            {/* Header do Container */}
            <div className="p-6 border-b border-gray-100 bg-[#fafbfc]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                    <span>{currentTabDef.label}</span>
                    {currentSubTabLabel && (
                      <span className="text-brand-blue">/ {currentSubTabLabel}</span>
                    )}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {currentTabDef.description}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs bg-blue-50 text-brand-blue px-2.5 py-1 rounded-full border border-blue-100 font-medium">
                    Período: <strong>{selectedMonth}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Placeholder Principal de Dados a Carregar */}
            <div className="p-8 sm:p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-brand-blue flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-2xs">
                <Database size={28} className="animate-pulse" />
              </div>

              <h3 className="text-xl font-serif font-bold text-gray-800 mb-2">
                Dados a carregar
              </h3>
              <p className="text-sm text-gray-500 max-w-lg mx-auto mb-8 leading-relaxed">
                A estrutura da aba{' '}
                <strong className="text-gray-700">
                  {currentTabDef.label}
                  {currentSubTabLabel ? ` (${currentSubTabLabel})` : ''}
                </strong>{' '}
                está pronta. A integração de dados, métricas consolidadas e gráficos será configurada
                nas próximas etapas.
              </p>

              {/* Grid de Cards Mockup Simulando a Estrutura que Virá */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
                <div className="bg-gray-50/70 border border-dashed border-gray-300 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Indicador 1
                    </span>
                    <Sparkles size={14} className="text-gray-300" />
                  </div>
                  <div className="text-2xl font-bold text-gray-300 mb-1">--</div>
                  <div className="text-[11px] text-gray-400">Aguardando dados...</div>
                </div>

                <div className="bg-gray-50/70 border border-dashed border-gray-300 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Indicador 2
                    </span>
                    <Sparkles size={14} className="text-gray-300" />
                  </div>
                  <div className="text-2xl font-bold text-gray-300 mb-1">--</div>
                  <div className="text-[11px] text-gray-400">Aguardando dados...</div>
                </div>

                <div className="bg-gray-50/70 border border-dashed border-gray-300 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Indicador 3
                    </span>
                    <Sparkles size={14} className="text-gray-300" />
                  </div>
                  <div className="text-2xl font-bold text-gray-300 mb-1">--</div>
                  <div className="text-[11px] text-gray-400">Aguardando dados...</div>
                </div>

                <div className="bg-gray-50/70 border border-dashed border-gray-300 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      Indicador 4
                    </span>
                    <Sparkles size={14} className="text-gray-300" />
                  </div>
                  <div className="text-2xl font-bold text-gray-300 mb-1">--</div>
                  <div className="text-[11px] text-gray-400">Aguardando dados...</div>
                </div>
              </div>

              {/* Rodapé Informativo */}
              <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-400">
                <Info size={14} />
                <span>
                  Filtro ativo: <strong>{selectedMonth}</strong> | Permissão atual:{' '}
                  <strong className="text-gray-600">
                    {role === 'admin' ? 'Administrador' : 'Visualizador'}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
