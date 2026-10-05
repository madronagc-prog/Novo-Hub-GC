import { renderMarkdown } from '../utils/renderMarkdown';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Plus, X, Edit2, Trash2, LogIn, LogOut, FileText, Scale, ExternalLink, Upload, Info, ChevronLeft, ChevronRight, Share2, Check } from 'lucide-react';
import { auth, signIn, logOut } from '../firebase.ts';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { ADMIN_EMAILS } from '../constants';
import AuthErrorModal from '../components/AuthErrorModal';
import { getDoc, doc, collection, onSnapshot, writeBatch, deleteDoc, getDocs, addDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase.ts';
import * as XLSX from 'xlsx';

const limparHTML = (texto: any) => {
  if (!texto) return '';
  if (typeof texto === 'object') return texto;
  // Remove tags HTML como <p>, </p>, <br>, </br>, <br/>, etc.
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
  for (const pk of possibleKeys) {
    const foundKey = objKeys.find(k => k.toLowerCase().trim() === pk.toLowerCase().trim());
    if (foundKey && obj[foundKey] !== undefined && obj[foundKey] !== null) {
      const val = String(obj[foundKey]).trim();
      if (val !== '' && val !== '-') return val;
    }
  }
  return null;
};

const formatExcelDate = (val: any) => {
  if (val === null || val === undefined || val === '') return '';
  const strVal = String(val).trim();
  
  // Check if it's a number (Excel serial dates or JS timestamps)
  if (/^\d+(\.\d+)?$/.test(strVal)) {
    const num = parseFloat(strVal);
    
    // Excel serial dates (e.g., 44250 for 2021-02-24)
    // 10000 is 1927-05-18, 90000 is 2146-05-11
    if (num > 10000 && num < 90000) {
      const date = new Date(Math.round((num - 25569) * 86400 * 1000));
      const day = String(date.getUTCDate()).padStart(2, '0');
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const year = date.getUTCFullYear();
      return `${day}/${month}/${year}`;
    }
    
    // JS Timestamp (milliseconds)
    if (num > 1000000000000) {
      const date = new Date(num);
      const day = String(date.getUTCDate()).padStart(2, '0');
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const year = date.getUTCFullYear();
      return `${day}/${month}/${year}`;
    }
  }
  
  // Handle ISO strings
  if (/^\d{4}-\d{2}-\d{2}/.test(strVal)) {
    try {
      const d = new Date(strVal);
      if (!isNaN(d.getTime())) {
        // Use UTC to avoid timezone shifts if it's just a date string
        const day = String(d.getUTCDate()).padStart(2, '0');
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const year = d.getUTCFullYear();
        return `${day}/${month}/${year}`;
      }
    } catch (e) {}
  }
  
  return strVal;
};

export default function TemasRepetitivos() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>(() => {
    const filters: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (!['q', 'page'].includes(key)) {
        filters[key] = value;
      }
    });
    return filters;
  });

  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const params: Record<string, string> = {};
    if (searchTerm) params.q = searchTerm;
    if (currentPage > 1) params.page = currentPage.toString();
    
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value) params[key] = value;
    });
    
    setSearchParams(params, { replace: true });
  }, [searchTerm, activeFilters, currentPage, setSearchParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeFilters]);

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [temas, setTemas] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTema, setEditingTema] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({
    numeroTema: '',
    linkTema: '',
    ramoDireito: '',
    situacao: '',
    orgaoJulgador: '',
    questao: '',
    delimitacao: '',
    tese: '',
    anotacoesNugepnac: '',
    repercussaoGeral: '',
    comentariosEscritorio: '',
    processos: []
  });

  // Extract all unique keys from the data to use as filters
  const allKeys = Array.from(new Set(temas.flatMap(t => Object.keys(t)))).filter(k => k !== 'id' && k !== 'updatedAt');

  const handleFilterChange = (key: string, value: string) => {
    setActiveFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setActiveFilters({});
    setSearchTerm('');
  };

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

    const unsubscribeData = onSnapshot(collection(db, 'temasRepetitivos'), (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const docData = doc.data();
        const cleanedData: any = { id: doc.id };
        Object.keys(docData).forEach(key => {
          if (key === 'processos' || key === 'updatedAt' || key === 'id') {
            cleanedData[key] = docData[key];
          } else {
            cleanedData[key] = limparHTML(docData[key]);
          }
        });
        return cleanedData;
      });
      setTemas(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'temasRepetitivos');
    });

    return () => {
      unsubscribeAuth();
      unsubscribeData();
    };
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // ... upload logic ...
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSave = {
        ...formData,
        updatedAt: new Date().toISOString()
      };

      if (editingTema) {
        await updateDoc(doc(db, 'temasRepetitivos', editingTema.id), dataToSave);
      } else {
        await addDoc(collection(db, 'temasRepetitivos'), dataToSave);
      }
      setShowAddModal(false);
      setEditingTema(null);
    } catch (error) {
      console.error("Error saving tema:", error);
      alert("Erro ao salvar tema.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'temasRepetitivos', id));
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting tema:", error);
      alert("Erro ao excluir tema.");
    }
  };

  const openEdit = (tema: any) => {
    setEditingTema(tema);
    setFormData({
      numeroTema: tema.numeroTema || getVal(tema, ['Número', 'Numero', 'numero', 'Tema', 'tema']) || '',
      linkTema: tema.linkTema || getVal(tema, ['Link do Tema Repetitivo', 'Link tema', 'linkTema']) || '',
      ramoDireito: tema.ramoDireito || getVal(tema, ['Ramo do Direito', 'Ramo do direito', 'ramo do direito']) || '',
      situacao: tema.situacao || getVal(tema, ['Situação do Tema', 'Situação', 'Situacao', 'situação']) || '',
      orgaoJulgador: tema.orgaoJulgador || getVal(tema, ['Órgão Julgador', 'Orgao Julgador', 'órgão julgador']) || '',
      questao: tema.questao || getVal(tema, ['Questão submetida a julgamento', 'Questao submetida a julgamento', 'Questão']) || '',
      delimitacao: tema.delimitacao || getVal(tema, ['Delimitação do Julgado', 'Delimitacao do Julgado', 'Delimitação']) || '',
      tese: tema.tese || getVal(tema, ['Tese Firmada', 'Tese firmada', 'tese firmada', 'Tese']) || '',
      anotacoesNugepnac: tema.anotacoesNugepnac || getVal(tema, ['Anotações Nugepnac', 'Anotacoes Nugepnac', 'Anotações NUGEPNAC', 'Anotações']) || '',
      repercussaoGeral: tema.repercussaoGeral || getVal(tema, ['Repercussão Geral', 'Repercussao Geral', 'Repercussão']) || '',
      comentariosEscritorio: tema.comentariosEscritorio || getVal(tema, ['Comentários do Escritório', 'Comentários do escritório', 'comentariosEscritorio']) || '',
      processos: Array.isArray(tema.processos) ? [...tema.processos] : []
    });
    setShowAddModal(true);
  };

  const handleAddProcesso = () => {
    setFormData({
      ...formData,
      processos: [
        ...formData.processos,
        { processo: '', linkProcesso: '', numRegistro: '', tribunal: '', afetacao: '', julgadoEm: '', acordaoPub: '', transito: '' }
      ]
    });
  };

  const handleRemoveProcesso = (index: number) => {
    const newProcessos = [...formData.processos];
    newProcessos.splice(index, 1);
    setFormData({ ...formData, processos: newProcessos });
  };

  const handleProcessoChange = (index: number, field: string, value: string) => {
    const newProcessos = [...formData.processos];
    newProcessos[index] = { ...newProcessos[index], [field]: value };
    setFormData({ ...formData, processos: newProcessos });
  };

  const getLatestDate = (tema: any) => {
    let latest = 0;
    const now = new Date().getTime() + 86400000; // Current date + 1 day for timezone safety
    
    const parseDateStr = (str: string) => {
      if (!str) return;
      const parts = str.split(/(?:\r\n|\r|\n|;| \/ )/);
      parts.forEach(part => {
        const dParts = part.trim().split('/');
        if (dParts.length === 3) {
          const dateVal = new Date(`${dParts[2]}-${dParts[1]}-${dParts[0]}T00:00:00Z`).getTime();
          if (!isNaN(dateVal) && dateVal > latest && dateVal <= now) {
            latest = dateVal;
          }
        }
      });
    };

    if (Array.isArray(tema.processos)) {
      tema.processos.forEach((p: any) => {
        parseDateStr(p.afetacao);
        parseDateStr(p.julgadoEm);
        parseDateStr(p.acordaoPub);
        parseDateStr(p.transito);
      });
    }
    
    // Fallback if data is flat
    if (latest === 0) {
      parseDateStr(String(tema['Afetação'] || tema['Data de afetação'] || ''));
      parseDateStr(String(tema['Julgado em'] || tema['Julgado Em'] || ''));
      parseDateStr(String(tema['Acórdão publicado em'] || tema['Acórdão Publicado em'] || ''));
      parseDateStr(String(tema['Trânsito em Julgado'] || tema['Trânsito em julgado'] || ''));
    }
    
    return latest;
  };

  const filteredTemas = temas.filter(t => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = Object.values(t).some(val => 
      String(val).toLowerCase().includes(searchLower)
    );
    
    // Check all active filters
    const matchesFilters = Object.entries(activeFilters).every(([key, value]) => {
      if (!value) return true; // empty filter means "all"
      return String(t[key]) === value;
    });

    return matchesSearch && matchesFilters;
  });

  // Sort by most recent date among: afetacao, julgadoEm, acordaoPub, transito
  filteredTemas.sort((a, b) => {
    const dateA = getLatestDate(a);
    const dateB = getLatestDate(b);

    if (dateA !== dateB) {
      return dateB - dateA; // Descending (most recent first)
    }

    const getNum = (val: any) => {
      const match = String(val || '').match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    };

    const numA = getNum(a['Tema'] || a['Número'] || a['Numero'] || a['numero'] || a['tema']);
    const numB = getNum(b['Tema'] || b['Número'] || b['Numero'] || b['numero'] || b['tema']);
    return numB - numA;
  });

  const totalPages = Math.ceil(filteredTemas.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTemas = filteredTemas.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#0a1e3f] tracking-tight">Temas Repetitivos do STJ</h1>
          </div>
          
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => {
                  setEditingTema(null);
                  setFormData({
                    numeroTema: '',
                    linkTema: '',
                    ramoDireito: '',
                    situacao: '',
                    orgaoJulgador: '',
                    questao: '',
                    delimitacao: '',
                    tese: '',
                    anotacoesNugepnac: '',
                    repercussaoGeral: '',
                    comentariosEscritorio: '',
                    processos: []
                  });
                  setShowAddModal(true);
                }}
                className="flex items-center gap-2 bg-brand-blue text-white px-4 py-2.5 rounded-xl font-semibold shadow-sm hover:bg-[#0094d1] transition-all"
              >
                <Plus size={18} />
                Novo Tema
              </button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
            {/* Search */}
            <div className="lg:col-span-7">
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

            {/* Ramo do Direito Filter */}
            <div className="lg:col-span-3">
              {(() => {
                const ramoKey = allKeys.find(k => k.toLowerCase().includes('ramo do direito') || k.toLowerCase().includes('ramo')) || 'Ramo do Direito';
                const uniqueRamos = Array.from(new Set(temas.map(t => String(t[ramoKey] || '')).filter(Boolean))).sort();
                
                return (
                  <div className="relative">
                    <select 
                      className="block w-full pl-4 pr-10 py-2.5 text-sm border-gray-200 focus:outline-none focus:ring-brand-grafite focus:border-brand-grafite rounded-xl bg-gray-50 appearance-none text-brand-grafite font-medium"
                      value={activeFilters[ramoKey] || ''}
                      onChange={(e) => handleFilterChange(ramoKey, e.target.value)}
                    >
                      <option value="">Ramo do Direito (Todos)</option>
                      {uniqueRamos.map(val => <option key={val} value={val}>{val}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-brand-grafite">
                      <Filter size={14} />
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Share Button */}
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

          {(searchTerm || Object.values(activeFilters).some(v => v)) && (
            <div className="w-full mt-4 pt-4 border-t border-gray-50 flex justify-end">
              <button 
                onClick={clearFilters}
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
            Exibindo <span className="text-[#0a1e3f] font-bold">{filteredTemas.length}</span> {filteredTemas.length === 1 ? 'resultado' : 'resultados'}
          </p>
        </div>

        {/* Results Grid - Specific Layout */}
        <div className="grid grid-cols-1 gap-8">
          {paginatedTemas.map((tema) => {
            const tipo = tema.tipo || getVal(tema, ['Tipo', 'tipo']) || 'Tema Repetitivo';
            const numero = tema.numeroTema || getVal(tema, ['Número', 'Numero', 'numero', 'Tema', 'tema']) || '';
            const linkTema = tema.linkTema || getVal(tema, ['Link do Tema Repetitivo', 'Link tema', 'linkTema']);
            const ramoDireito = tema.ramoDireito || getVal(tema, ['Ramo do Direito', 'Ramo do direito', 'ramo do direito']);
            const orgaoJulgador = tema.orgaoJulgador || getVal(tema, ['Órgão Julgador', 'Orgao Julgador', 'órgão julgador']);
            const situacao = tema.situacao || getVal(tema, ['Situação', 'Situacao', 'situação']);
            const questao = tema.questao || getVal(tema, ['Questão submetida a julgamento', 'Questao submetida a julgamento', 'Questão']);
            const tese = tema.tese || getVal(tema, ['Tese Firmada', 'Tese firmada', 'tese firmada', 'Tese']);
            const delimitacao = tema.delimitacao || getVal(tema, ['Delimitação do Julgado', 'Delimitacao do Julgado', 'Delimitação']);
            const anotacoes = tema.anotacoesNugepnac || getVal(tema, ['Anotações Nugepnac', 'Anotacoes Nugepnac', 'Anotações NUGEPNAC', 'Anotações']);
            const repercussao = tema.repercussaoGeral || getVal(tema, ['Repercussão Geral', 'Repercussao Geral', 'Repercussão']);
            const comentariosEscritorio = tema.comentariosEscritorio || getVal(tema, ['Comentários do Escritório', 'Comentários do escritório', 'comentariosEscritorio']);
            
            let rawProcessos = tema.processos;
            if (!Array.isArray(rawProcessos) || rawProcessos.length === 0) {
              const processoStr = String(getVal(tema, ['Processo', 'processo']) || '');
              const numRegistroStr = String(getVal(tema, ['Número de Registro', 'Numero de Registro', 'Nº de Registro']) || '');
              const tribunalStr = String(getVal(tema, ['Tribunal de Origem', 'Tribunal de origem']) || '');
              const afetacaoStr = formatExcelDate(getVal(tema, ['Afetação', 'Afetacao', 'afetação', 'Data de afetação']));
              const julgadoEmStr = formatExcelDate(getVal(tema, ['Julgado em', 'Julgado Em']));
              const acordaoPubStr = formatExcelDate(getVal(tema, ['Acórdão publicado em', 'Acordao publicado em']));
              const transitoStr = formatExcelDate(getVal(tema, ['Trânsito em Julgado', 'Transito em Julgado']));
              
              if (processoStr || numRegistroStr || tribunalStr || afetacaoStr || julgadoEmStr || acordaoPubStr || transitoStr) {
                rawProcessos = [{ 
                  processo: processoStr, 
                  numRegistro: numRegistroStr,
                  tribunal: tribunalStr, 
                  afetacao: afetacaoStr, 
                  julgadoEm: julgadoEmStr, 
                  acordaoPub: acordaoPubStr, 
                  transito: transitoStr 
                }];
              } else {
                rawProcessos = [];
              }
            }

            let processos: any[] = [];
            rawProcessos.forEach((proc: any) => {
              const processoStr = String(proc.processo || '');
              let numRegistroStr = String(proc.numRegistro || '');
              const tribunalStr = String(proc.tribunal || '');
              const afetacaoStr = String(proc.afetacao || '');
              const julgadoEmStr = String(proc.julgadoEm || '');
              const acordaoPubStr = String(proc.acordaoPub || '');
              const transitoStr = String(proc.transito || '');

              // Fix Excel formatting error for Número de Registro
              if (numRegistroStr && !numRegistroStr.includes('/') && !numRegistroStr.includes('-')) {
                const numStr = numRegistroStr.replace(/\D/g, '');
                if (numStr.length === 11) {
                  numRegistroStr = `${numStr.slice(0, 4)}/${numStr.slice(4, 10)}-${numStr.slice(10)}`;
                } else if (numStr.length === 12) {
                  numRegistroStr = `${numStr.slice(0, 4)}/${numStr.slice(4, 11)}-${numStr.slice(11)}`;
                }
              }

              const splitValues = (str: string) => {
                if (!str) return [];
                // Split by newline (\r\n, \n, \r), semicolon (;), or " / "
                const parts = str.split(/(?:\r\n|\r|\n|;| \/ )/);
                return parts.map(s => s.trim()).filter(Boolean);
              };

              const hasMultiple = /(?:\r\n|\r|\n|;| \/ )/.test(processoStr) || 
                                  /(?:\r\n|\r|\n|;| \/ )/.test(numRegistroStr) || 
                                  /(?:\r\n|\r|\n|;| \/ )/.test(tribunalStr) || 
                                  /(?:\r\n|\r|\n|;| \/ )/.test(afetacaoStr) || 
                                  /(?:\r\n|\r|\n|;| \/ )/.test(julgadoEmStr) || 
                                  /(?:\r\n|\r|\n|;| \/ )/.test(acordaoPubStr) || 
                                  /(?:\r\n|\r|\n|;| \/ )/.test(transitoStr);

              if (hasMultiple) {
                const processosArr = splitValues(processoStr);
                const numRegistroArr = splitValues(numRegistroStr);
                const tribunalArr = splitValues(tribunalStr);
                const afetacaoArr = splitValues(afetacaoStr);
                const julgadoEmArr = splitValues(julgadoEmStr);
                const acordaoPubArr = splitValues(acordaoPubStr);
                const transitoArr = splitValues(transitoStr);
                
                const maxLen = Math.max(
                  processosArr.length, numRegistroArr.length, tribunalArr.length,
                  afetacaoArr.length, julgadoEmArr.length, acordaoPubArr.length, transitoArr.length
                );
                
                for (let i = 0; i < maxLen; i++) {
                  processos.push({
                    processo: processosArr[i] || processosArr[0] || '',
                    numRegistro: numRegistroArr[i] || numRegistroArr[0] || '',
                    tribunal: tribunalArr[i] || tribunalArr[0] || '',
                    afetacao: afetacaoArr[i] || afetacaoArr[0] || '',
                    julgadoEm: julgadoEmArr[i] || julgadoEmArr[0] || '',
                    acordaoPub: acordaoPubArr[i] || acordaoPubArr[0] || '',
                    transito: transitoArr[i] || transitoArr[0] || ''
                  });
                }
              } else {
                processos.push({ ...proc, numRegistro: numRegistroStr });
              }
            });
            
            const hasProcessos = processos.length > 0;

            return (
              <div 
                key={tema.id} 
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col p-6"
              >
                {/* Cabeçalho do card */}
                <div className="mb-6">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-2xl font-bold text-[#0a1e3f]">
                      {linkTema ? (
                        <a 
                          href={linkTema} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-brand-grafite transition-colors inline-flex items-center gap-2"
                        >
                          {tipo} {numero}
                          <ExternalLink size={20} className="inline text-brand-grafite/70" />
                        </a>
                      ) : (
                        `${tipo} ${numero}`
                      )}
                    </h2>
                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(tema)}
                          className="p-2 text-brand-grafite/70 hover:text-brand-grafite hover:bg-blue-50 rounded-lg transition-all"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(tema.id)}
                          className="p-2 text-brand-grafite/70 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {tipo && (
                      <span className="border border-gray-300 text-brand-grafite px-2.5 py-1 rounded text-xs font-medium">
                        {tipo}
                      </span>
                    )}
                    {ramoDireito && (
                      <span className="font-bold text-brand-grafite bg-gray-100 px-2.5 py-1 rounded text-xs">
                        {ramoDireito}
                      </span>
                    )}
                    {orgaoJulgador && (
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">
                        {orgaoJulgador}
                      </span>
                    )}
                    {situacao && (
                      <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                        String(situacao).toLowerCase().includes('julgado') 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {situacao}
                      </span>
                    )}
                  </div>
                </div>

                {/* Corpo do card — duas colunas */}
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Coluna esquerda (~60%) */}
                  <div className="w-full md:w-[60%] flex flex-col gap-6">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-brand-grafite uppercase mb-2">
                        <Info size={14} />
                        QUESTÃO SUBMETIDA A JULGAMENTO
                      </div>
                      <p className="text-brand-grafite text-sm leading-relaxed">
                        {questao ? renderMarkdown(questao) : '-'}
                      </p>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-brand-grafite uppercase mb-2">COMENTÁRIOS DO ESCRITÓRIO</div>
                      <p className="text-brand-grafite text-sm leading-relaxed">
                        {comentariosEscritorio ? renderMarkdown(comentariosEscritorio) : '-'}
                      </p>
                    </div>

                    <div className="bg-[#f0f9ff] border-l-4 border-brand-blue p-4 rounded-r-lg">
                      <h4 className="text-xs font-bold text-brand-grafite uppercase mb-2">TESE FIRMADA</h4>
                      <p className="font-bold text-sm text-brand-grafite leading-relaxed">
                        {tese ? renderMarkdown(tese) : '-'}
                      </p>
                    </div>
                  </div>

                  {/* Coluna direita (~40%) */}
                  <div className="w-full md:w-[40%] flex flex-col gap-5">
                    <div>
                      <div className="text-xs font-bold text-brand-grafite uppercase mb-1">DELIMITAÇÃO DO JULGADO</div>
                      <p className="text-sm text-brand-grafite">{delimitacao ? renderMarkdown(delimitacao) : '-'}</p>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-brand-grafite uppercase mb-1">ANOTAÇÕES NUGEPNAC</div>
                      <p className="text-sm text-brand-grafite">{anotacoes ? renderMarkdown(anotacoes) : '-'}</p>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-brand-grafite uppercase mb-1">REPERCUSSÃO GERAL</div>
                      <p className="text-sm text-brand-grafite">{repercussao ? renderMarkdown(repercussao) : '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Rodapé do card */}
                <hr className="my-6 border-gray-100" />
                <div>
                  <h4 className="text-sm font-bold text-brand-grafite mb-4">PROCESSOS AFETADOS</h4>
                  {hasProcessos ? (
                    <div className="flex flex-col gap-3">
                      {processos.map((proc: any, idx: number) => {
                        const parts = [];
                        if (proc.processo) {
                          if (proc.linkProcesso) {
                            parts.push(
                              <span key="proc">
                                Processo:{' '}
                                <a 
                                  href={proc.linkProcesso} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-brand-grafite hover:underline font-bold inline-flex items-center gap-1"
                                >
                                  {proc.processo}
                                  <ExternalLink size={10} className="inline" />
                                </a>
                              </span>
                            );
                          } else {
                            parts.push(
                              <span key="proc">
                                Processo: <span className="font-bold">{proc.processo}</span>
                              </span>
                            );
                          }
                        }
                        if (proc.tribunal) parts.push(<span key="trib">Tribunal de Origem: <span className="font-bold">{proc.tribunal}</span></span>);
                        
                        const afetacao = formatExcelDate(proc.afetacao);
                        if (afetacao) parts.push(<span key="afet">Data de afetação: <span className="font-bold">{afetacao}</span></span>);
                        
                        const julgadoEm = formatExcelDate(proc.julgadoEm);
                        if (julgadoEm) parts.push(<span key="julg">Julgado em: <span className="font-bold">{julgadoEm}</span></span>);
                        
                        const acordaoPub = formatExcelDate(proc.acordaoPub);
                        if (acordaoPub) parts.push(<span key="acord">Acórdão Publicado em: <span className="font-bold">{acordaoPub}</span></span>);
                        
                        const transito = formatExcelDate(proc.transito);
                        if (transito) parts.push(<span key="trans">Trânsito em Julgado: <span className="font-bold">{transito}</span></span>);

                        return (
                          <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm text-brand-grafite leading-relaxed">
                            {parts.map((part, i) => (
                              <span key={i}>
                                {part}
                                {i < parts.length - 1 && <span className="mx-2 text-brand-grafite/70 font-bold">/</span>}
                              </span>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-brand-grafite italic">Nenhum processo vinculado.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-brand-grafite bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
              Anterior
            </button>
            <span className="text-sm text-brand-grafite font-medium">
              Página <span className="font-bold text-brand-grafite">{currentPage}</span> de <span className="font-bold text-brand-grafite">{totalPages}</span>
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-brand-grafite bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Próxima
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Empty State */}
        {filteredTemas.length === 0 && (
          <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 border-dashed mt-8">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Scale className="h-10 w-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-brand-grafite">Nenhum tema encontrado</h3>
            <p className="mt-2 text-brand-grafite max-w-xs mx-auto">
              Tente ajustar seus filtros ou termo de busca para encontrar o que procura.
            </p>
          </div>
        )}

        {/* Modal Adicionar/Editar */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h2 className="text-xl font-bold text-[#0a1e3f]">
                  {editingTema ? 'Editar Tema Repetitivo' : 'Novo Tema Repetitivo'}
                </h2>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X size={20} className="text-brand-grafite" />
                </button>
              </div>

              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6">

              <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100 flex gap-2 items-start mt-2">
                <Info size={16} className="text-brand-blue flex-shrink-0 mt-0.5" />
                <p className="text-xs text-brand-grafite leading-relaxed">
                  <strong>Dica de formatação:</strong> Você pode adicionar links personalizados usando o formato <code className="bg-white px-1 py-0.5 rounded text-brand-blue border border-blue-100">[Texto](https://...)</code> e deixar o texto em negrito usando <code className="bg-white px-1 py-0.5 rounded text-brand-blue border border-blue-100">**texto**</code>.
                </p>
              </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-brand-grafite mb-1">Número do Tema Repetitivo</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-grafite focus:bg-white transition-all outline-none"
                        value={formData.numeroTema}
                        onChange={e => setFormData({...formData, numeroTema: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-brand-grafite mb-1">Link do Tema Repetitivo</label>
                      <input
                        type="url"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-grafite focus:bg-white transition-all outline-none"
                        value={formData.linkTema}
                        onChange={e => setFormData({...formData, linkTema: e.target.value})}
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-brand-grafite mb-1">Ramo do Direito</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-grafite focus:bg-white transition-all outline-none"
                        value={formData.ramoDireito}
                        onChange={e => setFormData({...formData, ramoDireito: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-brand-grafite mb-1">Situação do tema</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-grafite focus:bg-white transition-all outline-none"
                        value={formData.situacao}
                        onChange={e => setFormData({...formData, situacao: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-brand-grafite mb-1">Órgão Julgador</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-grafite focus:bg-white transition-all outline-none"
                        value={formData.orgaoJulgador}
                        onChange={e => setFormData({...formData, orgaoJulgador: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-brand-grafite mb-1">Questão submetida a julgamento</label>
                      <textarea
                        rows={3}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-grafite focus:bg-white transition-all outline-none resize-none"
                        value={formData.questao}
                        onChange={e => setFormData({...formData, questao: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-brand-grafite mb-1">Comentários do escritório</label>
                      <textarea
                        rows={3}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-grafite focus:bg-white transition-all outline-none resize-none"
                        value={formData.comentariosEscritorio}
                        onChange={e => setFormData({...formData, comentariosEscritorio: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-brand-grafite mb-1">Delimitação do julgado</label>
                      <textarea
                        rows={3}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-grafite focus:bg-white transition-all outline-none resize-none"
                        value={formData.delimitacao}
                        onChange={e => setFormData({...formData, delimitacao: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-brand-grafite mb-1">Tese firmada</label>
                      <textarea
                        rows={3}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-grafite focus:bg-white transition-all outline-none resize-none"
                        value={formData.tese}
                        onChange={e => setFormData({...formData, tese: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-brand-grafite mb-1">Anotações NUGEPNAC</label>
                      <textarea
                        rows={2}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-grafite focus:bg-white transition-all outline-none resize-none"
                        value={formData.anotacoesNugepnac}
                        onChange={e => setFormData({...formData, anotacoesNugepnac: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-brand-grafite mb-1">Repercussão Geral</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-grafite focus:bg-white transition-all outline-none"
                        value={formData.repercussaoGeral}
                        onChange={e => setFormData({...formData, repercussaoGeral: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 border-t border-gray-100 pt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-brand-grafite">Processos Afetados</h3>
                    <button
                      type="button"
                      onClick={handleAddProcesso}
                      className="flex items-center gap-2 text-sm font-bold text-brand-grafite hover:text-[#0094d1] transition-all"
                    >
                      <Plus size={16} />
                      Adicionar Processo
                    </button>
                  </div>

                  <div className="space-y-6">
                    {formData.processos.map((proc: any, index: number) => (
                      <div key={index} className="bg-gray-50 p-6 rounded-2xl border border-gray-200 relative">
                        <button
                          type="button"
                          onClick={() => handleRemoveProcesso(index)}
                          className="absolute top-4 right-4 p-1.5 text-brand-grafite/70 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <X size={16} />
                        </button>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-brand-grafite uppercase mb-1">Processo</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-grafite outline-none"
                              value={proc.processo}
                              onChange={e => handleProcessoChange(index, 'processo', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-brand-grafite uppercase mb-1">Link do processo</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-grafite outline-none"
                              value={proc.linkProcesso || ''}
                              onChange={e => handleProcessoChange(index, 'linkProcesso', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-brand-grafite uppercase mb-1">Tribunal de Origem</label>
                            <input
                              type="text"
                              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-grafite outline-none"
                              value={proc.tribunal}
                              onChange={e => handleProcessoChange(index, 'tribunal', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-brand-grafite uppercase mb-1">Data de afetação</label>
                            <input
                              type="text"
                              placeholder="DD/MM/YYYY"
                              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-grafite outline-none"
                              value={proc.afetacao}
                              onChange={e => handleProcessoChange(index, 'afetacao', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-brand-grafite uppercase mb-1">Julgado em</label>
                            <input
                              type="text"
                              placeholder="DD/MM/YYYY"
                              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-grafite outline-none"
                              value={proc.julgadoEm}
                              onChange={e => handleProcessoChange(index, 'julgadoEm', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-brand-grafite uppercase mb-1">Acórdão Publicado em</label>
                            <input
                              type="text"
                              placeholder="DD/MM/YYYY"
                              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-grafite outline-none"
                              value={proc.acordaoPub}
                              onChange={e => handleProcessoChange(index, 'acordaoPub', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-brand-grafite uppercase mb-1">Trânsito em Julgado</label>
                            <input
                              type="text"
                              placeholder="DD/MM/YYYY"
                              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-grafite outline-none"
                              value={proc.transito}
                              onChange={e => handleProcessoChange(index, 'transito', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {formData.processos.length === 0 && (
                      <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-2xl">
                        <p className="text-sm text-brand-grafite">Nenhum processo adicionado.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-6 py-2.5 rounded-xl font-bold text-brand-grafite hover:bg-gray-100 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-2.5 bg-brand-blue text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-[#0094d1] transition-all"
                  >
                    {editingTema ? 'Salvar Alterações' : 'Cadastrar Tema'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Confirmar Exclusão */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="text-red-500" size={32} />
              </div>
              <h3 className="text-xl font-bold text-center text-brand-grafite mb-2">Confirmar Exclusão</h3>
              <p className="text-brand-grafite text-center mb-8">
                Tem certeza que deseja excluir este tema? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold text-brand-grafite hover:bg-gray-100 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-100"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <AuthErrorModal 
        error={authError} 
        onClose={() => setAuthError(null)} 
      />
    </div>
  );
}
