import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, Calendar, ChevronRight, Search, ExternalLink, CheckCircle2, 
  Plus, X, Trash2, Loader2, Sparkles, AlertCircle 
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from '../firebase';
import { ADMIN_EMAILS } from '../constants';
import { defaultClippingData } from './clipping/clippingData';
import { defaultClippingMaioData } from './clipping/clippingMaioData';
import { defaultClippingJunhoData } from './clipping/clippingJunhoData';
import { defaultClippingJulhoData } from './clipping/clippingJulhoData';
import { defaultClippingEdicao5Data } from './clipping/clippingEdicao5Data';

export interface ClippingCardMeta {
  id: string;
  title: string;
  period: string;
  link: string;
  isCustom?: boolean;
  createdAt?: string;
}

const STATIC_EDITIONS: ClippingCardMeta[] = [
  {
    id: 'edicao-5',
    title: '5ª Edição — Agosto 2026',
    period: 'Pesquisa: 1 a 31 de julho de 2026',
    link: '/clipping-corporativo/agosto-2026',
  },
  {
    id: 'julho-2026',
    title: '4ª Edição - Julho 2026',
    period: 'Pesquisa: 1 a 30 de junho de 2026',
    link: '/clipping-corporativo/julho-2026',
  },
  {
    id: 'junho-2026',
    title: '3ª Edição - Junho 2026',
    period: 'Pesquisa: 1 a 31 de maio de 2026',
    link: '/clipping-corporativo/junho-2026',
  },
  {
    id: 'maio-2026',
    title: '2ª Edição - Maio 2026',
    period: 'Pesquisa: 1 a 30 de abril de 2026',
    link: '/clipping-corporativo/maio-2026',
  },
  {
    id: 'abril-2026',
    title: '1ª Edição - Abril 2026',
    period: 'Pesquisa: 1 a 31 de março de 2026',
    link: '/clipping-corporativo/abril-2026',
  }
];

export default function ClippingCorporativo() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [allClippings, setAllClippings] = useState<any>({
    'edicao-5': defaultClippingEdicao5Data,
    'julho-2026': defaultClippingJulhoData,
    'junho-2026': defaultClippingJunhoData,
    'maio-2026': defaultClippingMaioData,
    'abril-2026': defaultClippingData
  });
  const [customEditions, setCustomEditions] = useState<ClippingCardMeta[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal de Novo Cadastro
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPeriod, setNewPeriod] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [templateOption, setTemplateOption] = useState<'empty' | 'clone_5'>('clone_5');
  const [isCreating, setIsCreating] = useState(false);
  const [formError, setFormError] = useState('');

  const checkIsAdmin = (user: User | null): boolean => {
    if (!user?.email) return false;
    return ADMIN_EMAILS.includes(user.email.toLowerCase());
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setIsAdmin(checkIsAdmin(u));
    });
    return () => unsubscribeAuth();
  }, []);

  const fetchClippings = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'clippings'));
      const newClippings = { ...allClippings };
      const customList: ClippingCardMeta[] = [];

      querySnapshot.forEach((docSnap) => {
        const id = docSnap.id;
        if (id === 'marco-2026') return;
        const snapData = docSnap.data();

        if (snapData && snapData.data) {
          newClippings[id] = snapData.data;
        }

        // Se não for uma das edições estáticas principais, é uma edição criada dinamicamente
        const isStatic = STATIC_EDITIONS.some(e => e.id === id || (id === 'agosto-2026' && e.id === 'edicao-5'));
        if (!isStatic) {
          customList.push({
            id,
            title: snapData.title || `Edição ${id}`,
            period: snapData.period || 'Pesquisa e curadoria jurídica',
            link: `/clipping-corporativo/edicao/${id}`,
            isCustom: true,
            createdAt: snapData.createdAt
          });
        }
      });

      // Ordenar edições customizadas por data/id
      customList.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

      setAllClippings(newClippings);
      setCustomEditions(customList);
    } catch (err) {
      console.error("Error fetching clippings", err);
    }
  };

  useEffect(() => {
    fetchClippings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Gerador automático de identificador (slug)
  const handleTitleChange = (val: string) => {
    setNewTitle(val);
    if (!newSlug || newSlug.startsWith('edicao-')) {
      const generated = val
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      if (generated) {
        setNewSlug(generated);
      }
    }
  };

  const handleCreateClipping = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newTitle.trim()) {
      setFormError('Por favor, informe o título da edição.');
      return;
    }

    const cleanSlug = (newSlug.trim() || `edicao-${Date.now()}`)
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9-]/g, '-');

    // Validação de slug duplicado
    const isDuplicate = STATIC_EDITIONS.some(ed => ed.id === cleanSlug) || customEditions.some(ed => ed.id === cleanSlug);
    if (isDuplicate) {
      setFormError(`O identificador "${cleanSlug}" já está em uso. Por favor, escolha outro identificador.`);
      return;
    }

    setIsCreating(true);

    try {
      let initialData: any = {
        jurisprudencia: [],
        legislacao: [],
        doutrinas: [],
        relatorios: []
      };

      if (templateOption === 'clone_5') {
        initialData = JSON.parse(JSON.stringify(defaultClippingEdicao5Data));
      } else {
        // Modelo inicial com 1 item exemplo em cada para facilitar a edição
        initialData = {
          jurisprudencia: [
            {
              id: 'jur_1',
              tag: 'STJ',
              tagColor: 'blue',
              subtitle: 'Processo nº ...',
              pubDate: 'Publicação oficial',
              title: 'Primeira Decisão Comentada',
              paragraphs: ['Insira aqui o comentário da decisão. Use **negrito** para destacar trechos.'],
              link: ''
            }
          ],
          legislacao: [
            {
              id: 'leg_1',
              tag: 'CVM',
              tagColor: 'emerald',
              subtitle: 'Resolução CVM nº ...',
              pubDate: 'Publicação oficial',
              title: 'Primeira Norma Comentada',
              paragraphs: ['Insira aqui o comentário da norma regulatória.'],
              link: ''
            }
          ],
          doutrinas: [
            {
              id: 'dout_1',
              tag: 'Artigo Doutrinário',
              title: 'Primeiro Artigo Selecionado',
              author: 'Nome do Autor',
              content: 'Resumo analítico dos pontos centrais da obra ou artigo selecionado.',
              link: ''
            }
          ],
          relatorios: []
        };
      }

      const newClippingDoc = {
        title: newTitle.trim(),
        period: newPeriod.trim() || 'Pesquisa jurídica',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        data: initialData
      };

      await setDoc(doc(db, 'clippings', cleanSlug), newClippingDoc);

      // Atualiza o estado local
      setIsModalOpen(false);
      setNewTitle('');
      setNewPeriod('');
      setNewSlug('');
      
      // Redireciona imediatamente para a página do novo clipping
      navigate(`/clipping-corporativo/edicao/${cleanSlug}`);
    } catch (err: any) {
      console.error("Erro ao criar novo clipping:", err);
      setFormError('Erro ao salvar no banco de dados: ' + (err.message || 'Verifique suas permissões de administrador.'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCustom = async (e: React.MouseEvent, id: string, title: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm(`Tem certeza de que deseja excluir permanentemente a edição "${title}"?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'clippings', id));
      setCustomEditions(prev => prev.filter(item => item.id !== id));
      setAllClippings((prev: any) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    } catch (err) {
      alert("Erro ao excluir edição. Verifique suas permissões.");
    }
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const term = searchQuery.toLowerCase();
    const results: any[] = [];
    
    const getEditionName = (id: string) => {
      const custom = customEditions.find(c => c.id === id);
      if (custom) return custom.title;
      if (id === 'edicao-5' || id === 'julho-2026-ed5') return '5ª Edição - Agosto 2026';
      if (id === 'julho-2026') return '4ª Edição - Julho 2026';
      if (id === 'junho-2026') return '3ª Edição - Junho 2026';
      if (id === 'maio-2026') return '2ª Edição - Maio 2026';
      if (id === 'abril-2026') return '1ª Edição - Abril 2026';
      return id;
    };
    
    const getSectionName = (sec: string) => {
      if (sec === 'jurisprudencia') return 'Jurisprudência Comentada';
      if (sec === 'legislacao') return 'Legislação Comentada';
      if (sec === 'doutrinas') return 'Doutrinas Selecionadas';
      if (sec === 'relatorios') return 'Relatórios';
      if (sec === 'outrosNormativos') return 'Outros Normativos';
      return sec;
    };

    Object.keys(allClippings).forEach((editionId) => {
      const data = allClippings[editionId];
      if (!data) return;

      const sections = ['jurisprudencia', 'legislacao', 'doutrinas', 'relatorios', 'outrosNormativos'];
      sections.forEach(section => {
        if (Array.isArray(data[section])) {
          data[section].forEach((item: any) => {
            const searchableText = `${item.title || ''} ${item.subtitle || ''} ${item.content || ''} ${item.author || ''} ${item.description || ''} ${(item.paragraphs || []).join(' ')}`.toLowerCase();
            if (searchableText.includes(term)) {
              const customMatch = customEditions.find(c => c.id === editionId);
              const targetRoute = customMatch 
                ? `/clipping-corporativo/edicao/${editionId}` 
                : (editionId === 'edicao-5' ? '/clipping-corporativo/agosto-2026' : `/clipping-corporativo/${editionId}`);

              results.push({
                ...item,
                editionId,
                targetRoute,
                editionName: getEditionName(editionId),
                sectionName: getSectionName(section),
                sectionType: section
              });
            }
          });
        }
      });
    });
    
    return results;
  }, [allClippings, searchQuery, customEditions]);

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col min-h-screen">
      {/* Header com Título e Botão de Novo Cadastro para Admins */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-serif text-brand-grafite mb-1">Clipping UN Corporate</h1>
          <p className="text-sm text-gray-500">
            Acompanhamento mensal de jurisprudência, regulação societária e doutrinas especializadas.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-brand-grafite hover:bg-brand-grafite/90 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm hover:shadow"
          >
            <Plus size={18} />
            Novo Clipping
          </button>
        )}
      </div>

      {/* Modal de Criação de Novo Clipping */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-fadeIn">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="bg-brand-grafite/10 p-2 rounded-lg text-brand-grafite">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-brand-grafite text-base">Novo Clipping UN Corporate</h2>
                  <p className="text-xs text-gray-500">Cadastre uma nova edição para publicação e edição em bloco.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateClipping} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2 border border-red-200">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Título da Edição *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Ex: 6ª Edição — Setembro 2026"
                  className="w-full text-sm border border-gray-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-grafite focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Período da Pesquisa
                </label>
                <input
                  type="text"
                  value={newPeriod}
                  onChange={(e) => setNewPeriod(e.target.value)}
                  placeholder="Ex: Pesquisa: 1 a 31 de agosto de 2026"
                  className="w-full text-sm border border-gray-300 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-grafite focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Identificador na URL (Slug)
                </label>
                <div className="flex items-center rounded-xl border border-gray-300 overflow-hidden focus-within:ring-2 focus-within:ring-brand-grafite focus-within:border-transparent">
                  <span className="bg-gray-50 text-gray-400 text-xs px-3 py-2.5 border-r border-gray-200 select-none">
                    /clipping-corporativo/edicao/
                  </span>
                  <input
                    type="text"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    placeholder="setembro-2026"
                    className="w-full text-sm px-3 py-2.5 focus:outline-none bg-white font-mono text-xs"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Identificador amigável gerado automaticamente para a rota da edição.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Conteúdo Inicial
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setTemplateOption('clone_5')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      templateOption === 'clone_5' 
                        ? 'border-brand-grafite bg-slate-50 font-medium text-brand-grafite ring-1 ring-brand-grafite' 
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-500" />
                      Clonar 5ª Edição
                    </span>
                    <span className="text-[11px] text-gray-500 mt-1">
                      Preenche com blocos estruturados da última edição para editar.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTemplateOption('empty')}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      templateOption === 'empty' 
                        ? 'border-brand-grafite bg-slate-50 font-medium text-brand-grafite ring-1 ring-brand-grafite' 
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1.5">
                      <Plus size={14} />
                      Modelo Padrão
                    </span>
                    <span className="text-[11px] text-gray-500 mt-1">
                      Começa com 1 item em cada seção para você preencher do zero.
                    </span>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="bg-brand-grafite hover:bg-brand-grafite/90 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isCreating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Criar Edição
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-brand-grafite/70" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-grafite focus:bg-white sm:text-sm transition-all"
            placeholder="Buscar em todos os clippings (ex: CVM, M&A, STJ...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {searchQuery && (
          <div className="w-full mt-4 pt-4 border-t border-gray-50 flex justify-end">
            <button 
              onClick={() => setSearchQuery('')}
              className="text-sm font-bold text-brand-grafite hover:underline"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {!searchQuery.trim() ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Edições criadas dinamicamente via botão "Novo Clipping" */}
          {customEditions.map((edition) => (
            <div
              key={edition.id}
              className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-brand-grafite/30 p-6 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 p-2.5 rounded-xl text-brand-grafite group-hover:bg-brand-grafite group-hover:text-white transition-colors">
                      <BookOpen size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-brand-grafite leading-tight">{edition.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{edition.period}</p>
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={(e) => handleDeleteCustom(e, edition.id, edition.title)}
                      className="text-gray-300 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                      title="Excluir edição"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                <Link 
                  to={edition.link}
                  className="font-semibold text-brand-grafite group-hover:text-brand-grafite/80 flex items-center justify-between w-full"
                >
                  <span>Ler edição</span>
                  <ChevronRight size={18} className="text-brand-grafite/70 group-hover:text-brand-grafite transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          ))}

          {/* Edições padrão / anteriores */}
          {STATIC_EDITIONS.map((edition) => (
            <Link 
              key={edition.id}
              to={edition.link}
              className="group block bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all hover:border-brand-grafite/30"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gray-100 p-2.5 rounded-xl text-brand-grafite group-hover:bg-brand-grafite group-hover:text-white transition-colors">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-brand-grafite leading-tight">{edition.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{edition.period}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                <span className="font-semibold text-brand-grafite group-hover:text-brand-grafite/80">Ler edição</span>
                <ChevronRight size={18} className="text-brand-grafite/70 group-hover:text-brand-grafite transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}

        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-brand-grafite mb-4">
            Resultados da busca ({searchResults.length})
          </h2>
          {searchResults.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
              <p className="text-brand-grafite">Nenhum resultado encontrado para "{searchQuery}".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 max-w-4xl gap-6">
              {searchResults.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="bg-white rounded-xl shadow-sm border border-brand-grafite/20 p-6 sm:p-8 relative">
                  <Link 
                    to={item.targetRoute || `/clipping-corporativo/${item.editionId}`} 
                    className="absolute top-4 right-4 text-xs font-bold bg-slate-100 text-brand-grafite px-3 py-1 rounded-full hover:bg-brand-grafite hover:text-white transition-colors"
                  >
                    {item.editionName}
                  </Link>

                  <div className="flex flex-wrap items-center gap-3 mb-4 pr-32">
                    <span className="bg-slate-100 text-brand-grafite text-xs font-bold px-2.5 py-1 rounded">{item.sectionName}</span>
                    {item.tag && <span className={`bg-${item.tagColor || 'gray'}-100 text-${item.tagColor || 'gray'}-800 text-xs font-bold px-2.5 py-1 rounded`}>{item.tag}</span>}
                    {item.subtitle && <span className="text-sm font-bold font-serif text-brand-grafite">{item.subtitle}</span>}
                  </div>
                  
                  <h3 className="text-xl font-bold text-brand-grafite mb-4 leading-tight">{item.title}</h3>
                  {item.author && <p className="text-sm font-medium text-brand-grafite mb-4">{item.author}</p>}

                  {item.sectionType === 'outrosNormativos' ? (
                    <div className="mb-4">
                      <p className="text-sm text-brand-grafite">{item.description}</p>
                    </div>
                  ) : item.sectionType === 'doutrinas' ? (
                    <div className="mb-4">
                      <p className="text-sm text-brand-grafite">
                        <span className="font-bold">Resumo: </span>{item.content}
                      </p>
                    </div>
                  ) : (
                    <div className="prose prose-sm text-brand-grafite mb-6 space-y-4">
                      {item.paragraphs?.length ? (
                        item.paragraphs.map((p: string, i: number) => (
                          <p key={i}>
                            {(i === 0 && !item.hideCommentLabel && item.sectionType !== 'relatorios') && <span className="font-bold">Comentário: </span>}
                            {p}
                          </p>
                        ))
                      ) : (
                        item.content && <p><span className="font-bold">Comentário: </span>{item.content}</p>
                      )}
                    </div>
                  )}

                  {item.link && (
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-brand-grafite text-brand-grafite hover:text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm">
                      Acessar íntegra
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
