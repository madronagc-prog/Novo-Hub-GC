import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db, auth, signIn, logOut, handleFirestoreError, OperationType } from '../firebase.ts';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc, getDocs, writeBatch } from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { Search, ExternalLink, Filter, Plus, X, Edit2, Trash2, LogIn, LogOut, Database, BarChart3, ChevronLeft, ChevronRight, Share2, Check } from 'lucide-react';
import { Source, initialSources } from '../data/sources';
import { ADMIN_EMAILS } from '../constants';
import AuthErrorModal from '../components/AuthErrorModal';

const limparHTML = (texto: any) => {
  if (!texto) return '';
  if (typeof texto === 'object') return texto;
  return String(texto)
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
};

const getVal = (obj: any, possibleKeys: string[]) => {
  if (!obj) return null;
  const objKeys = Object.keys(obj);
  
  // 1. Try exact match (case-insensitive + trim)
  for (const pk of possibleKeys) {
    const foundKey = objKeys.find(k => k.toLowerCase().trim() === pk.toLowerCase().trim());
    if (foundKey && obj[foundKey] !== undefined && obj[foundKey] !== null) {
      const val = String(obj[foundKey]).trim();
      if (val !== '' && val !== '-') return val;
    }
  }
  
  // 2. Try aggressive match (remove all non-alphanumeric)
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const pk of possibleKeys) {
    const normalizedPk = normalize(pk);
    const foundKey = objKeys.find(k => normalize(k) === normalizedPk);
    if (foundKey && obj[foundKey] !== undefined && obj[foundKey] !== null) {
      const val = String(obj[foundKey]).trim();
      if (val !== '' && val !== '-') return val;
    }
  }
  
  return null;
};

export default function Explorador() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [firestoreCount, setFirestoreCount] = useState(0);
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [filterTema, setFilterTema] = useState(searchParams.get('tema') || '');
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  
  const ITEMS_PER_PAGE = 24;
  
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedProgress, setSeedProgress] = useState(0);
  const [editingSource, setEditingSource] = useState<Source | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showSyncBanner, setShowSyncBanner] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Source>>({
    nome: '',
    link: '',
    tema: '',
    statusInoreader: 'Acesso Direto',
    sigla: '',
    descricao: ''
  });

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        if (u.email && ADMIN_EMAILS.includes(u.email.toLowerCase())) {
          setIsAdmin(true);
          return;
        }
        try {
          const userDoc = await getDoc(doc(db, 'users', u.uid));
          if (userDoc.exists() && userDoc.data().role === 'admin') {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } catch (err) {
          console.error("Error checking admin role:", err);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    });

    const q = query(collection(db, 'fontesDeInformacao'), orderBy('nome', 'asc'));
    const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
      const sourcesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Source[];
      
      setFirestoreCount(sourcesData.length);
      
      setSources(sourcesData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'fontesDeInformacao');
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeFirestore();
    };
  }, []);

  const seedData = async () => {
    if (!isAdmin) return;
    setIsSeeding(true);
    setSeedProgress(0);
    
    try {
      const total = initialSources.length;
      let count = 0;
      
      // Seed in batches to avoid overwhelming the connection
      const batchSize = 20;
      for (let i = 0; i < initialSources.length; i += batchSize) {
        const batch = initialSources.slice(i, i + batchSize);
        await Promise.all(batch.map(async (source) => {
          const { id, ...data } = source;
          await setDoc(doc(db, 'fontesDeInformacao', id), {
            ...data,
            updatedAt: new Date().toISOString()
          });
          count++;
          setSeedProgress(Math.round((count / total) * 100));
        }));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'fontesDeInformacao');
    } finally {
      setIsSeeding(false);
      setSeedProgress(0);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      const dataToSave = {
        ...formData,
        updatedAt: new Date().toISOString()
      };

      if (editingSource) {
        await updateDoc(doc(db, 'fontesDeInformacao', editingSource.id), dataToSave);
      } else {
        await addDoc(collection(db, 'fontesDeInformacao'), dataToSave);
      }
      
      setShowAddModal(false);
      setEditingSource(null);
      setFormData({
        nome: '', link: '', tema: '', 
        statusInoreader: 'Acesso Direto', sigla: '', descricao: ''
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'fontesDeInformacao');
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'fontesDeInformacao', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'fontesDeInformacao');
    }
  };

  useEffect(() => {
    const params: Record<string, string> = {};
    if (searchTerm) params.q = searchTerm;
    if (filterTema) params.tema = filterTema;
    if (currentPage > 1) params.page = currentPage.toString();
    
    setSearchParams(params, { replace: true });
  }, [searchTerm, filterTema, currentPage, setSearchParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterTema]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const filteredSources = useMemo(() => {
    return sources
      .filter(source => {
        const matchesSearch = 
          source.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          source.tema.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (source.sigla && source.sigla.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesTema = filterTema ? source.tema === filterTema : true;

        return matchesSearch && matchesTema;
      })
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [sources, searchTerm, filterTema]);

  const uniqueTemas = Array.from(new Set(sources.map(s => s.tema))).filter(Boolean).sort();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowCopySuccess(true);
    setTimeout(() => setShowCopySuccess(false), 2000);
  };

  const handleLogin = async () => {
    try {
      setAuthError(null);
      await signIn();
    } catch (err: any) {
      setAuthError(err.message || String(err));
    }
  };

  const totalPages = Math.ceil(filteredSources.length / ITEMS_PER_PAGE);
  const paginatedSources = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredSources.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredSources, currentPage]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#0a1e3f] tracking-tight">Fontes de informação</h1>
            <p className="text-brand-grafite mt-1">
              Encontre as fontes de informação usadas para construir os clippings do Madrona Advogados.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => {
                  setEditingSource(null);
                  setFormData({
                    nome: '', link: '', tema: '', 
                    statusInoreader: 'Acesso Direto', sigla: '', descricao: ''
                  });
                  setShowAddModal(true);
                }}
                className="flex items-center gap-2 bg-brand-blue hover:bg-[#0099d9] text-white px-4 py-2.5 rounded-xl font-semibold shadow-sm transition-all"
              >
                <Plus size={18} />
                Nova Fonte
              </button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-brand-grafite/70" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-11 pr-4 py-3 border-gray-200 rounded-xl focus:ring-brand-grafite focus:border-brand-grafite bg-gray-50 text-brand-grafite placeholder-gray-500 sm:text-sm transition-colors"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="relative">
                <select
                  className="block w-full pl-4 pr-10 py-3 text-base border-gray-200 focus:outline-none focus:ring-brand-grafite focus:border-brand-grafite sm:text-sm rounded-xl bg-gray-50 appearance-none"
                  value={filterTema}
                  onChange={(e) => setFilterTema(e.target.value)}
                >
                  <option value="">Todos os Temas</option>
                  {uniqueTemas.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-brand-grafite">
                  <Filter size={16} />
                </div>
              </div>

            </div>

            <button
              onClick={handleCopyLink}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all border w-full lg:w-auto ${
                showCopySuccess 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                  : 'bg-white border-gray-200 text-brand-grafite hover:bg-gray-50'
              }`}
              title="Copiar link com filtros"
            >
              {showCopySuccess ? (
                <>
                  <Check size={18} />
                  Link Copiado!
                </>
              ) : (
                <>
                  <Share2 size={18} />
                  Compartilhar Filtro
                </>
              )}
            </button>
          </div>

          {(searchTerm || filterTema) && (
            <div className="w-full mt-4 pt-4 border-t border-gray-50 flex justify-end">
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setFilterTema('');
                }}
                className="text-sm font-bold text-brand-grafite hover:underline"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>

        {/* Results Info */}
        <div className="mb-6 px-2">
          <p className="text-sm text-brand-grafite font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-blue"></span>
            Exibindo <span className="text-[#0a1e3f] font-bold">{filteredSources.length}</span> {filteredSources.length === 1 ? 'fonte' : 'fontes'}
          </p>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
            <p className="mt-4 text-brand-grafite">Carregando fontes...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedSources.map((source) => (
                <div 
                  key={source.id} 
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full group relative"
                >
                  {isAdmin && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button
                        onClick={() => {
                          setEditingSource(source);
                          setFormData({ ...source });
                          setShowAddModal(true);
                        }}
                        className="p-1.5 bg-white rounded-lg shadow-sm border border-gray-100 text-brand-grafite hover:text-brand-grafite transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(source.id)}
                        className="p-1.5 bg-white rounded-lg shadow-sm border border-gray-100 text-brand-grafite hover:text-red-600 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}

                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-brand-grafite">
                        {source.tema}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        source.statusInoreader === 'Leitor de RSS' 
                          ? 'bg-green-50 text-green-700' 
                          : 'bg-gray-100 text-brand-grafite'
                      }`}>
                        {source.statusInoreader}
                      </span>
                    </div>
                    
                    <h3 className={`text-lg font-bold text-brand-grafite leading-tight group-hover:text-brand-grafite transition-colors ${source.sigla ? 'mb-1' : 'mb-2'}`}>
                      {source.sigla || source.nome}
                    </h3>
                    {source.sigla && (
                      <p className="text-sm text-brand-grafite mb-2 leading-tight line-clamp-2" title={source.nome}>
                        {source.nome}
                      </p>
                    )}
                    {source.descricao && (
                      <p className="text-sm text-brand-grafite mt-2">
                        {source.descricao}
                      </p>
                    )}
                    
                    {/* Hidden fields: tipo removed from display */}
                  </div>
                  
                  <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                    <a
                      href={source.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-brand-grafite hover:text-brand-grafite/80 flex items-center gap-1.5 transition-colors"
                    >
                      Acessar Fonte
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl border border-gray-200 bg-white text-brand-grafite hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 rounded-xl font-bold text-sm transition-all shadow-sm ${
                              currentPage === page
                                ? 'bg-brand-blue text-white'
                                : 'bg-white border border-gray-200 text-brand-grafite hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return <span key={page} className="text-brand-grafite/70">...</span>;
                      }
                      return null;
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl border border-gray-200 bg-white text-brand-grafite hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
                
                <p className="text-sm text-brand-grafite font-medium">
                  Página <span className="text-brand-grafite font-bold">{currentPage}</span> de <span className="text-brand-grafite font-bold">{totalPages}</span>
                </p>
              </div>
            )}
          </>
        )}
        
        {!loading && filteredSources.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 border-dashed">
            <Search className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-brand-grafite">Nenhuma fonte encontrada</h3>
            <p className="mt-1 text-brand-grafite mb-6">Tente ajustar seus filtros ou termo de busca.</p>
            
            {isAdmin && sources.length === 0 && (
              <button
                onClick={seedData}
                disabled={isSeeding}
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition-colors shadow-lg disabled:opacity-50"
              >
                <Database size={20} />
                {isSeeding ? 'Sincronizando...' : 'Carregar fontes iniciais'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Confirmar Exclusão</h3>
            <p className="text-brand-grafite mb-6">Tem certeza que deseja excluir esta fonte? Esta ação não pode ser desfeita.</p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-brand-grafite hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  handleDelete(showDeleteConfirm);
                  setShowDeleteConfirm(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Adicionar/Editar */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-bold text-brand-grafite">
                {editingSource ? 'Editar Fonte' : 'Nova Fonte'}
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-brand-grafite/70 hover:text-brand-grafite transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-brand-grafite mb-1">Nome da Fonte *</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-grafite focus:border-transparent outline-none transition-all"
                    value={formData.nome}
                    onChange={e => setFormData({...formData, nome: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-brand-grafite mb-1">Sigla</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-grafite focus:border-transparent outline-none transition-all"
                    value={formData.sigla}
                    onChange={e => setFormData({...formData, sigla: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-brand-grafite mb-1">Link (URL) *</label>
                  <input
                    required
                    type="url"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-grafite focus:border-transparent outline-none transition-all"
                    value={formData.link}
                    onChange={e => setFormData({...formData, link: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-brand-grafite mb-1">Tema *</label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-grafite focus:border-transparent outline-none transition-all"
                    value={formData.tema}
                    onChange={e => setFormData({...formData, tema: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-brand-grafite mb-1">Status Inoreader *</label>
                  <select
                    required
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-grafite focus:border-transparent outline-none transition-all bg-white"
                    value={formData.statusInoreader}
                    onChange={e => setFormData({...formData, statusInoreader: e.target.value as any})}
                  >
                    <option value="Acesso Direto">Acesso Direto</option>
                    <option value="Leitor de RSS">Leitor de RSS</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-brand-grafite mb-1">Descrição (até 200 palavras)</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-grafite focus:border-transparent outline-none transition-all resize-none"
                    value={formData.descricao || ''}
                    onChange={e => {
                      // Check word count constraint
                      const words = e.target.value.trim().split(/\s+/);
                      if (words.length <= 200 || e.target.value.trim() === '') {
                        setFormData({...formData, descricao: e.target.value});
                      }
                    }}
                    placeholder="Breve descrição sobre o site ou a fonte de informação..."
                  />
                  <div className="text-xs text-brand-grafite text-right mt-1">
                    {formData.descricao ? formData.descricao.trim().split(/\s+/).filter(Boolean).length : 0}/200 palavras
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2 border border-gray-200 rounded-xl text-sm font-medium text-brand-grafite hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-brand-blue text-white rounded-xl text-sm font-medium hover:bg-[#0099d9] transition-colors shadow-md"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AuthErrorModal 
        error={authError} 
        onClose={() => setAuthError(null)} 
      />
    </div>
  );
}
