import { renderMarkdown } from '../utils/renderMarkdown';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db, auth, signIn, logOut, handleFirestoreError, OperationType } from '../firebase.ts';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc, Timestamp, setDoc, getDoc, getDocs, writeBatch } from 'firebase/firestore';
import { Search, ExternalLink, Filter, FileText, Calendar, User, Building2, Tag, Scale, Plus, X, Edit2, Trash2, LogIn, LogOut, ChevronDown, ChevronUp, BarChart3, TrendingUp, ChevronLeft, ChevronRight, Share2, Check, Upload , Info} from 'lucide-react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { ProjetoDeLei, initialProjetosDeLei } from '../data/projetosDeLei';
import { ADMIN_EMAILS } from '../constants';
import AuthErrorModal from '../components/AuthErrorModal';
import * as XLSX from 'xlsx';

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

export default function ProjetosDeLei() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [projects, setProjects] = useState<ProjetoDeLei[]>([]);
  const [loading, setLoading] = useState(true);
  const [firestoreCount, setFirestoreCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [filterTema, setFilterTema] = useState(searchParams.get('tema') || '');
  const [filterUN, setFilterUN] = useState(searchParams.get('un') || '');
  const [filterLei, setFilterLei] = useState(searchParams.get('lei') || '');
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  
  const ITEMS_PER_PAGE = 20;
  
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjetoDeLei | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showSyncBanner, setShowSyncBanner] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedProgress, setSeedProgress] = useState(0);
  const [authError, setAuthError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<ProjetoDeLei>>({
    projeto: '',
    ementa: '',
    situacao: '',
    ultimoAndamento: '',
    comissao: '',
    local: '',
    unAn: '',
    tema: '',
    lei: '',
    link: '',
    pareceres: []
  });

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // Check if hardcoded admin
        if (u.email && ADMIN_EMAILS.includes(u.email.toLowerCase())) {
          setIsAdmin(true);
          return;
        }
        
        // Check Firestore for admin role
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

    const q = query(collection(db, 'projetosDeLei'), orderBy('updatedAt', 'desc'));
    const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ProjetoDeLei[];
      
      setFirestoreCount(projectsData.length);

      setProjects(projectsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'projetosDeLei');
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeFirestore();
    };
  }, []);

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const seedData = async () => {
    if (!isAdmin) return;
    setIsSeeding(true);
    setSeedProgress(0);
    
    try {
      const total = initialProjetosDeLei.length;
      let count = 0;
      
      // Seed in batches
      const batchSize = 20;
      for (let i = 0; i < initialProjetosDeLei.length; i += batchSize) {
        const batch = initialProjetosDeLei.slice(i, i + batchSize);
        await Promise.all(batch.map(async (pl) => {
          const { id, ...data } = pl;
          await setDoc(doc(db, 'projetosDeLei', id), {
            ...data,
            updatedAt: new Date().toISOString()
          });
          count++;
          setSeedProgress(Math.round((count / total) * 100));
        }));
      }
      // Success state instead of alert
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'projetosDeLei');
    } finally {
      setIsSeeding(false);
      setSeedProgress(0);
    }
  };

  const resetCollection = async () => {
    if (!isAdmin) return;
    setShowResetConfirm(false);
    setIsSeeding(true);
    setSeedProgress(0);
    
    try {
      const q = query(collection(db, 'projetosDeLei'));
      const snapshot = await getDocs(q);
      const docsToDelete = snapshot.docs;
      
      for (let i = 0; i < docsToDelete.length; i += 500) {
        const batchDelete = writeBatch(db);
        const currentBatch = docsToDelete.slice(i, i + 500);
        currentBatch.forEach((doc) => {
          batchDelete.delete(doc.ref);
        });
        await batchDelete.commit();
        setSeedProgress(Math.round(((i + currentBatch.length) / docsToDelete.length) * 100));
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'projetosDeLei');
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

      if (editingProject) {
        await updateDoc(doc(db, 'projetosDeLei', editingProject.id), dataToSave);
      } else {
        await addDoc(collection(db, 'projetosDeLei'), dataToSave);
      }
      
      setShowAddModal(false);
      setEditingProject(null);
      setFormData({
        projeto: '', ementa: '', situacao: '', ultimoAndamento: '',
        comissao: '', local: '', unAn: '', tema: '', lei: '', 
        link: '', pareceres: []
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'projetosDeLei');
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'projetosDeLei', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'projetosDeLei');
    }
  };

  const openEdit = (pl: ProjetoDeLei) => {
    setEditingProject(pl);
    setFormData({
      ...pl,
      pareceres: pl.pareceres || []
    });
    setShowAddModal(true);
  };

  // Helper to split semicolon separated strings
  const splitValues = (val: string) => val ? val.split(';').map(s => s.trim()).filter(Boolean) : [];

  useEffect(() => {
    const params: Record<string, string> = {};
    if (searchTerm) params.q = searchTerm;
    if (filterTema) params.tema = filterTema;
    if (filterUN) params.un = filterUN;
    if (filterLei) params.lei = filterLei;
    if (currentPage > 1) params.page = currentPage.toString();
    
    setSearchParams(params, { replace: true });
  }, [searchTerm, filterTema, filterUN, filterLei, currentPage, setSearchParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterTema, filterUN, filterLei]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const filteredPLs = useMemo(() => {
    const filtered = projects.filter(pl => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        pl.projeto.toLowerCase().includes(searchLower) ||
        pl.ementa.toLowerCase().includes(searchLower) ||
        pl.unAn.toLowerCase().includes(searchLower) ||
        pl.tema.toLowerCase().includes(searchLower) ||
        pl.lei.toLowerCase().includes(searchLower);
      
      const plTemas = splitValues(pl.tema);
      const plUNs = splitValues(pl.unAn);
      const plLeis = splitValues(pl.lei);

      const matchesTema = filterTema ? plTemas.includes(filterTema) : true;
      const matchesUN = filterUN ? plUNs.includes(filterUN) : true;
      const matchesLei = filterLei ? plLeis.includes(filterLei) : true;

      return matchesSearch && matchesTema && matchesUN && matchesLei;
    });

    // Sort by ultimoAndamento (DD/MM/YYYY)
    return filtered.sort((a, b) => {
      const parseDate = (dateStr: any, updatedAt?: string) => {
        if (typeof dateStr === 'number') return dateStr;

        if (!dateStr || (typeof dateStr === 'string' && dateStr.trim() === '')) {
          return updatedAt ? new Date(updatedAt).getTime() : 0;
        }
        
        if (typeof dateStr === 'string') {
          const trimmed = dateStr.trim();
          
          // Try YYYY-MM-DD (ISO-ish)
          const isoMatch = trimmed.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
          if (isoMatch) {
            const d = new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
            if (!isNaN(d.getTime())) return d.getTime();
          }

          // Try DD/MM/YYYY (BR)
          const brMatch = trimmed.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
          if (brMatch) {
            let day = parseInt(brMatch[1], 10);
            let month = parseInt(brMatch[2], 10);
            let year = parseInt(brMatch[3], 10);
            
            if (year < 100) year += 2000;
            
            const date = new Date(year, month - 1, day);
            if (!isNaN(date.getTime())) return date.getTime();
          }
        }
        
        const timestamp = Date.parse(dateStr);
        if (!isNaN(timestamp)) return timestamp;

        // Final fallback to updatedAt if the string isn't a date
        return updatedAt ? new Date(updatedAt).getTime() : 0;
      };

      const timeA = parseDate(a.ultimoAndamento, a.updatedAt);
      const timeB = parseDate(b.ultimoAndamento, b.updatedAt);

      if (timeA !== timeB) {
        return timeB - timeA;
      }

      // Secondary sort by updatedAt (most recent first)
      const updateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const updateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return updateB - updateA;
    });
  }, [projects, searchTerm, filterTema, filterUN, filterLei]);

  const uniqueTemas = Array.from(new Set(projects.flatMap(pl => splitValues(pl.tema)))).filter(Boolean).sort();
  const uniqueUNs = Array.from(new Set(projects.flatMap(pl => splitValues(pl.unAn)))).filter(Boolean).sort();
  const uniqueLeis = Array.from(new Set(projects.flatMap(pl => splitValues(pl.lei)))).filter(Boolean).sort();

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

  const totalPages = Math.ceil(filteredPLs.length / ITEMS_PER_PAGE);
  const paginatedPLs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPLs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPLs, currentPage]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#0a1e3f] tracking-tight">Acompanhamento legislativo</h1>
            <p className="text-brand-grafite mt-1 max-w-xl">Painel desenvolvido para oferecer uma visão clara e atualizada sobre proposições legislativas em tramitação, alterações normativas relevantes e tendências que possam impactar as áreas de atuação do escritório e os setores atendidos por nossos clientes.</p>
          </div>
          
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => {
                  setEditingProject(null);
                  setFormData({
                    projeto: '', ementa: '', situacao: '', ultimoAndamento: '',
                    comissao: '', local: '', unAn: '', tema: '', lei: '', 
                    link: ''
                  });
                  setShowAddModal(true);
                }}
                className="flex items-center gap-2 bg-brand-blue hover:bg-[#0099d9] text-white px-4 py-2.5 rounded-xl font-semibold shadow-sm transition-all"
              >
                <Plus size={18} />
                Novo Projeto
              </button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
            <div className="lg:col-span-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-grafite/70 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-gray-200 border rounded-xl focus:ring-2 focus:ring-brand-grafite focus:bg-white transition-all text-sm text-brand-grafite"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="lg:col-span-2">
              <div className="relative">
                <select 
                  className="block w-full pl-4 pr-10 py-2.5 text-sm border-gray-200 focus:outline-none focus:ring-brand-grafite focus:border-brand-grafite rounded-xl bg-gray-50 appearance-none text-brand-grafite font-medium"
                  value={filterUN}
                  onChange={(e) => setFilterUN(e.target.value)}
                >
                  <option value="">UNs impactadas</option>
                  {uniqueUNs.map(un => <option key={un} value={un}>{un}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-brand-grafite">
                  <Filter size={14} />
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-2">
              <div className="relative">
                <select 
                  className="block w-full pl-4 pr-10 py-2.5 text-sm border-gray-200 focus:outline-none focus:ring-brand-grafite focus:border-brand-grafite rounded-xl bg-gray-50 appearance-none text-brand-grafite font-medium"
                  value={filterTema}
                  onChange={(e) => setFilterTema(e.target.value)}
                >
                  <option value="">Temas</option>
                  {uniqueTemas.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-brand-grafite">
                  <Filter size={14} />
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="relative">
                <select 
                  className="block w-full pl-4 pr-10 py-2.5 text-sm border-gray-200 focus:outline-none focus:ring-brand-grafite focus:border-brand-grafite rounded-xl bg-gray-50 appearance-none text-brand-grafite font-medium"
                  value={filterLei}
                  onChange={(e) => setFilterLei(e.target.value)}
                >
                  <option value="">Leis alteradas</option>
                  {uniqueLeis.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-brand-grafite">
                  <Filter size={14} />
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <button
                onClick={handleCopyLink}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border ${
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
          </div>

            {(filterTema || filterUN || filterLei || searchTerm) && (
              <div className="w-full mt-4 pt-4 border-t border-gray-50 flex justify-end">
                <button 
                  onClick={() => {
                    setFilterTema(''); setFilterUN(''); setFilterLei(''); 
                    setSearchTerm('');
                  }}
                  className="text-sm font-bold text-brand-grafite hover:underline"
                >
                  Limpar filtros
                </button>
              </div>
            )}
        </div>

        {/* Results Count */}
        <div className="mb-6 px-2">
          <p className="text-sm text-brand-grafite font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-blue"></span>
            Exibindo <span className="text-[#0a1e3f] font-bold">{filteredPLs.length}</span> {filteredPLs.length === 1 ? 'projeto' : 'projetos'}
          </p>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {paginatedPLs.map((pl) => (
            <div 
              key={pl.id} 
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full group relative"
            >
              {isAdmin && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button
                    onClick={() => openEdit(pl)}
                    className="p-1.5 bg-white rounded-lg shadow-sm border border-gray-100 text-brand-grafite hover:text-brand-grafite transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(pl.id)}
                    className="p-1.5 bg-white rounded-lg shadow-sm border border-gray-100 text-brand-grafite hover:text-red-600 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}

              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4 gap-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    pl.local.includes('Câmara') ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}>
                    {pl.local}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-[#0a1e3f] leading-tight mb-2 group-hover:text-brand-grafite transition-colors">
                  {pl.projeto}
                </h3>
                
                <p className="text-sm text-brand-grafite mb-4 leading-relaxed italic" title={pl.ementa}>
                  {renderMarkdown(pl.ementa)}
                </p>

                <div className="space-y-3 mt-auto pt-4 border-t border-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-brand-grafite">
                      <Calendar size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-brand-grafite/70 uppercase tracking-wider">Último Andamento</p>
                      <p className="text-xs font-semibold text-brand-grafite">{pl.ultimoAndamento}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-brand-grafite">
                      <Scale size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-brand-grafite/70 uppercase tracking-wider">Situação</p>
                      <p className="text-xs font-semibold text-brand-grafite">{pl.situacao}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-brand-grafite">
                      <Building2 size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-brand-grafite/70 uppercase tracking-wider">Comissão</p>
                      <p className="text-xs font-semibold text-brand-grafite leading-tight">{pl.comissao}</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-[10px] font-bold text-brand-grafite/70 uppercase tracking-wider mb-2">Unidades Impactadas</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from(new Set(splitValues(pl.unAn))).map(un => (
                        <button 
                          key={un}
                          onClick={() => setFilterUN(un)}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-brand-grafite border border-blue-100 hover:bg-blue-100 transition-colors"
                        >
                          {un}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-[10px] font-bold text-brand-grafite/70 uppercase tracking-wider mb-2">Temas do projeto</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from(new Set(splitValues(pl.tema))).map(t => (
                        <button 
                          key={t} 
                          onClick={() => setFilterTema(t)}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-brand-grafite border border-blue-100 hover:bg-blue-100 transition-colors"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {pl.pareceres && pl.pareceres.length > 0 && (
                    <div className="pt-2">
                      <p className="text-[10px] font-bold text-brand-grafite/70 uppercase tracking-wider mb-2">Pareceres Aprovados</p>
                      <div className="flex flex-col gap-1.5">
                        {pl.pareceres.map((p, idx) => (
                          <a 
                            key={idx}
                            href={p.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs font-semibold text-brand-grafite hover:underline"
                          >
                            <FileText size={12} />
                            {p.titulo}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {pl.lei && (
                    <div className="pt-2">
                      <p className="text-[10px] font-bold text-brand-grafite/70 uppercase tracking-wider mb-2">Leis alteradas</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.from(new Set(splitValues(pl.lei))).map(l => (
                          <button 
                            key={l} 
                            onClick={() => setFilterLei(l)}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-brand-grafite border border-blue-100 hover:bg-blue-100 transition-colors"
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <a
                  href={pl.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 w-full flex items-center justify-center gap-2 bg-gray-50 border border-gray-100 py-2.5 rounded-xl text-xs font-bold text-brand-grafite hover:bg-gray-100 transition-all"
                >
                  Ver Tramitação
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
                  // Show current page, first, last, and neighbors
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

        {filteredPLs.length === 0 && (
          <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 border-dashed">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="h-10 w-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-brand-grafite">Nenhum projeto encontrado</h3>
            <p className="mt-2 text-brand-grafite max-w-xs mx-auto">Tente ajustar seus filtros ou termo de busca para encontrar o que procura.</p>
            <button 
              onClick={() => {
                setFilterTema(''); setFilterUN(''); setFilterLei(''); 
                setSearchTerm('');
              }}
              className="mt-6 text-brand-grafite font-bold hover:underline"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Confirmar Exclusão</h3>
            <p className="text-brand-grafite mb-6">Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita.</p>
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

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-brand-grafite">
                {editingProject ? 'Editar Projeto' : 'Novo Projeto de Lei'}
              </h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} className="text-brand-grafite" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 overflow-y-auto flex-1 space-y-6">

              <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100 flex gap-2 items-start mt-2">
                <Info size={16} className="text-brand-blue flex-shrink-0 mt-0.5" />
                <p className="text-xs text-brand-grafite leading-relaxed">
                  <strong>Dica de formatação:</strong> Você pode adicionar links personalizados usando o formato <code className="bg-white px-1 py-0.5 rounded text-brand-blue border border-blue-100">[Texto](https://...)</code> e deixar o texto em negrito usando <code className="bg-white px-1 py-0.5 rounded text-brand-blue border border-blue-100">**texto**</code>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-brand-grafite uppercase tracking-widest">Número do Projeto</label>
                  <input 
                    required
                    className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:ring-2 focus:ring-brand-grafite focus:bg-white transition-all"
                    value={formData.projeto}
                    onChange={e => setFormData({...formData, projeto: e.target.value})}
                    placeholder="Ex: PL 123/2024"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-brand-grafite uppercase tracking-widest">Local</label>
                  <select 
                    required
                    className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:ring-2 focus:ring-brand-grafite focus:bg-white transition-all"
                    value={formData.local}
                    onChange={e => setFormData({...formData, local: e.target.value})}
                  >
                    <option value="">Selecione...</option>
                    <option value="Câmara dos Deputados">Câmara dos Deputados</option>
                    <option value="Senado Federal">Senado Federal</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-brand-grafite uppercase tracking-widest">Ementa (Resumo)</label>
                <textarea 
                  required
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:ring-2 focus:ring-brand-grafite focus:bg-white transition-all resize-none"
                  value={formData.ementa}
                  onChange={e => setFormData({...formData, ementa: e.target.value})}
                  placeholder="Resumo do tema do projeto..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-brand-grafite uppercase tracking-widest">Situação</label>
                  <input 
                    required
                    className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:ring-2 focus:ring-brand-grafite focus:bg-white transition-all"
                    value={formData.situacao}
                    onChange={e => setFormData({...formData, situacao: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-brand-grafite uppercase tracking-widest">Último Andamento</label>
                  <input 
                    className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:ring-2 focus:ring-brand-grafite focus:bg-white transition-all"
                    value={formData.ultimoAndamento}
                    onChange={e => setFormData({...formData, ultimoAndamento: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-brand-grafite uppercase tracking-widest">Comissão</label>
                <input 
                  className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:ring-2 focus:ring-brand-grafite focus:bg-white transition-all"
                  value={formData.comissao}
                  onChange={e => setFormData({...formData, comissao: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-brand-grafite uppercase tracking-widest">UN/AN (separar por ;)</label>
                  <input 
                    className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:ring-2 focus:ring-brand-grafite focus:bg-white transition-all"
                    value={formData.unAn}
                    onChange={e => setFormData({...formData, unAn: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-brand-grafite uppercase tracking-widest">Tema (separar por ;)</label>
                  <input 
                    className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:ring-2 focus:ring-brand-grafite focus:bg-white transition-all"
                    value={formData.tema}
                    onChange={e => setFormData({...formData, tema: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-brand-grafite uppercase tracking-widest">Leis (separar por ;)</label>
                  <input 
                    className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:ring-2 focus:ring-brand-grafite focus:bg-white transition-all"
                    value={formData.lei}
                    onChange={e => setFormData({...formData, lei: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-brand-grafite uppercase tracking-widest">Link do Projeto</label>
                <input 
                  required
                  type="url"
                  className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:ring-2 focus:ring-brand-grafite focus:bg-white transition-all"
                  value={formData.link}
                  onChange={e => setFormData({...formData, link: e.target.value})}
                  placeholder="https://..."
                />
              </div>

              {/* Pareceres Section */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-brand-grafite uppercase tracking-widest">Pareceres Aprovados (Máx 10)</label>
                  {(formData.pareceres?.length || 0) < 10 && (
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        pareceres: [...(formData.pareceres || []), { titulo: '', link: '' }]
                      })}
                      className="text-xs font-bold text-brand-grafite hover:underline flex items-center gap-1"
                    >
                      <Plus size={14} />
                      Adicionar Parecer
                    </button>
                  )}
                </div>
                
                <div className="space-y-3">
                  {formData.pareceres?.map((p, idx) => (
                    <div key={idx} className="flex gap-3 items-start bg-gray-50 p-3 rounded-xl relative group">
                      <div className="flex-1 space-y-3">
                        <input 
                          required
                          className="w-full px-3 py-2 bg-white border-gray-100 border rounded-lg text-sm focus:ring-2 focus:ring-brand-grafite outline-none"
                          value={p.titulo}
                          onChange={e => {
                            const newPareceres = [...(formData.pareceres || [])];
                            newPareceres[idx].titulo = e.target.value;
                            setFormData({...formData, pareceres: newPareceres});
                          }}
                          placeholder="Título do parecer"
                        />
                        <input 
                          required
                          type="url"
                          className="w-full px-3 py-2 bg-white border-gray-100 border rounded-lg text-sm focus:ring-2 focus:ring-brand-grafite outline-none"
                          value={p.link}
                          onChange={e => {
                            const newPareceres = [...(formData.pareceres || [])];
                            newPareceres[idx].link = e.target.value;
                            setFormData({...formData, pareceres: newPareceres});
                          }}
                          placeholder="Link do parecer (https://...)"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newPareceres = formData.pareceres?.filter((_, i) => i !== idx);
                          setFormData({...formData, pareceres: newPareceres});
                        }}
                        className="p-1 text-brand-grafite/70 hover:text-red-500 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {(!formData.pareceres || formData.pareceres.length === 0) && (
                    <p className="text-xs text-brand-grafite/70 italic">Nenhum parecer adicionado.</p>
                  )}
                </div>
              </div>

              <div className="pt-6 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-bold text-brand-grafite hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-3 bg-brand-blue text-white rounded-xl font-bold hover:bg-[#0099d9] shadow-lg shadow-blue-200 transition-all"
                >
                  {editingProject ? 'Salvar Alterações' : 'Criar Projeto'}
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
