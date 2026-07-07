import { renderMarkdown } from '../utils/renderMarkdown';
import React, { useState, useEffect, useRef } from 'react';
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
  
  if (/^\d+(\.\d+)?$/.test(strVal)) {
    const num = parseFloat(strVal);
    if (num > 10000 && num < 90000) {
      const date = new Date(Math.round((num - 25569) * 86400 * 1000));
      const day = String(date.getUTCDate()).padStart(2, '0');
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const year = date.getUTCFullYear();
      return `${day}/${month}/${year}`;
    }
    if (num > 1000000000000) {
      const date = new Date(num);
      const day = String(date.getUTCDate()).padStart(2, '0');
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const year = date.getUTCFullYear();
      return `${day}/${month}/${year}`;
    }
  }
  
  if (/^\d{4}-\d{2}-\d{2}/.test(strVal)) {
    try {
      const d = new Date(strVal);
      if (!isNaN(d.getTime())) {
        const day = String(d.getUTCDate()).padStart(2, '0');
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const year = d.getUTCFullYear();
        return `${day}/${month}/${year}`;
      }
    } catch (e) {}
  }
  
  return strVal;
};

export default function RepercussaoGeralSTF() {
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTema, setEditingTema] = useState<any | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [temas, setTemas] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState<any>({
    numeroTema: '',
    ramoDireito: '',
    tituloTema: '',
    situacaoRG: '',
    situacaoAdmissibilidade: '',
    processo: '',
    relator: '',
    situacao: '',
    dataAutuacao: '',
    linkProcesso: '',
    descricaoTema: '',
    tese: '',
    processos: []
  });

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

    const unsubscribeData = onSnapshot(collection(db, 'repercussaoGeralSTF'), (snapshot) => {
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
      handleFirestoreError(error, OperationType.LIST, 'repercussaoGeralSTF');
    });

    return () => {
      unsubscribeAuth();
      unsubscribeData();
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    try {
      const dataToSave = {
        ...formData,
        updatedAt: new Date().toISOString()
      };

      if (editingTema) {
        await updateDoc(doc(db, 'repercussaoGeralSTF', editingTema.id), dataToSave);
      } else {
        await addDoc(collection(db, 'repercussaoGeralSTF'), dataToSave);
      }
      
      setShowAddModal(false);
      setEditingTema(null);
      setFormData({
        numeroTema: '',
        tituloTema: '',
        situacaoRG: '',
        situacaoAdmissibilidade: '',
        processo: '',
        relator: '',
        situacao: '',
        dataAutuacao: '',
        linkProcesso: '',
        descricaoTema: '',
        tese: '',
        processos: []
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'repercussaoGeralSTF');
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'repercussaoGeralSTF', id));
      setShowDeleteConfirm(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'repercussaoGeralSTF');
    }
  };

  const openEdit = (tema: any) => {
    setEditingTema(tema);
    setFormData({
      numeroTema: tema.numeroTema || getVal(tema, ['Número tema', 'Nº do Tema', 'Número do Tema', 'Tema']) || '',
      ramoDireito: tema.ramoDireito || getVal(tema, ['Ramo do Direito', 'Ramo do direito', 'ramo do direito']) || '',
      tituloTema: tema.tituloTema || getVal(tema, ['Título tema', 'Titulo tema', 'Título']) || '',
      situacaoRG: tema.situacaoRG || getVal(tema, ['Situação repercussão geral', 'Situacao repercussao geral', 'Situação']) || '',
      situacaoAdmissibilidade: tema.situacaoAdmissibilidade || getVal(tema, ['Situação admissibilidade tema', 'Situacao admissibilidade tema']) || '',
      processo: tema.processo || (tema.processos?.[0]?.processo) || getVal(tema, ['Processo paradigma', 'Processo', 'processo']) || '',
      relator: tema.relator || (tema.processos?.[0]?.relatorAtual) || getVal(tema, ['Relator atual', 'Relator Atual', 'Relator']) || '',
      situacao: tema.situacao || (tema.processos?.[0]?.situacaoProcessoParadigma) || getVal(tema, ['Situação Processo Paradigma', 'Situação Processo Paradigma']) || '',
      dataAutuacao: tema.dataAutuacao || (tema.processos?.[0]?.dataAutuacao) || formatExcelDate(getVal(tema, ['Data autuação', 'Data autuacao', 'Autuação'])) || '',
      linkProcesso: tema.linkProcesso || (tema.processos?.[0]?.linkProcesso) || getVal(tema, ['Link Processo', 'Link processo', 'link']) || '',
      descricaoTema: tema.descricaoTema || getVal(tema, ['Descrição tema', 'Descricao tema', 'Descrição']) || '',
      tese: tema.tese || '',
      processos: tema.processos || []
    });
    setShowAddModal(true);
  };

  const getLatestDate = (tema: any) => {
    let latest = 0;
    const now = new Date().getTime() + 86400000;
    
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
        parseDateStr(p.dataAutuacao);
        parseDateStr(p.dataAdmissibilidade);
        parseDateStr(p.dataJulgamento);
      });
    }
    
    if (latest === 0) {
      parseDateStr(String(tema['Data autuação'] || tema['Data autuacao'] || ''));
      parseDateStr(String(tema['Data admissibilidade RG'] || tema['Data admissibilidade'] || ''));
      parseDateStr(String(tema['Data julgamento tema'] || tema['Data julgamento'] || ''));
    }
    
    return latest;
  };

  const filteredTemas = temas.filter(t => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = Object.values(t).some(val => 
      String(val).toLowerCase().includes(searchLower)
    );
    
    const matchesFilters = Object.entries(activeFilters).every(([key, value]) => {
      if (!value) return true;
      return String(t[key]) === value;
    });

    return matchesSearch && matchesFilters;
  });

  filteredTemas.sort((a, b) => {
    const dateA = getLatestDate(a);
    const dateB = getLatestDate(b);

    if (dateA !== dateB) {
      return dateB - dateA;
    }

    const getNum = (val: any) => {
      const match = String(val || '').match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    };

    const numA = getNum(a['Tema'] || a['Número tema'] || a['Número do Tema']);
    const numB = getNum(b['Tema'] || b['Número tema'] || b['Número do Tema']);
    return numB - numA;
  });

  const totalPages = Math.ceil(filteredTemas.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTemas = filteredTemas.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#0a1e3f] tracking-tight">Repercussão Geral STF</h1>
          </div>
          
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => {
                  setEditingTema(null);
                  setFormData({
                    numeroTema: '',
                    ramoDireito: '',
                    tituloTema: '',
                    situacaoRG: '',
                    situacaoAdmissibilidade: '',
                    processo: '',
                    relator: '',
                    situacao: '',
                    dataAutuacao: '',
                    linkProcesso: '',
                    descricaoTema: '',
                    tese: '',
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

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
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

        <div className="mb-6 px-2">
          <p className="text-sm text-brand-grafite font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-blue"></span>
            Exibindo <span className="text-[#0a1e3f] font-bold">{filteredTemas.length}</span> {filteredTemas.length === 1 ? 'resultado' : 'resultados'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {paginatedTemas.map((tema) => {
            const numero = tema.numeroTema || getVal(tema, ['Número tema', 'Nº do Tema', 'Número do Tema', 'Tema']) || '';
            const ramoDireito = tema.ramoDireito || getVal(tema, ['Ramo do Direito', 'Ramo do direito', 'ramo do direito']);
            const titulo = tema.tituloTema || getVal(tema, ['Título tema', 'Titulo tema', 'Título']);
            const tese = tema.tese || getVal(tema, ['Tese']);
            const descricao = tema.descricaoTema || getVal(tema, ['Descrição tema', 'Descricao tema', 'Descrição']);
            const situacaoRG = tema.situacaoRG || getVal(tema, ['Situação repercussão geral', 'Situacao repercussao geral', 'Situação']);
            const situacaoAdmissibilidade = tema.situacaoAdmissibilidade || getVal(tema, ['Situação admissibilidade tema', 'Situacao admissibilidade tema']);
            const situacaoJulgamento = tema.situacaoJulgamento || getVal(tema, ['Situação julgamento tema', 'Situacao julgamento tema']);
            
            let rawProcessos = tema.processos;
            if (!Array.isArray(rawProcessos) || rawProcessos.length === 0) {
              const processoStr = tema.processo || String(getVal(tema, ['Processo paradigma', 'Processo', 'processo']) || '');
              const linkProcessoStr = tema.linkProcesso || String(getVal(tema, ['Link Processo', 'Link processo', 'link']) || '');
              const relatorAtualStr = tema.relator || String(getVal(tema, ['Relator atual', 'Relator Atual', 'Relator']) || '');
              const situacaoProcessoParadigmaStr = tema.situacao || String(getVal(tema, ['Situação Processo Paradigma', 'Situacao Processo Paradigma']) || '');
              const dataAutuacaoStr = tema.dataAutuacao || formatExcelDate(getVal(tema, ['Data autuação', 'Data autuacao', 'Autuação']));
              const dataAdmissibilidadeStr = formatExcelDate(getVal(tema, ['Data admissibilidade RG', 'Data admissibilidade', 'Admissibilidade']));
              const dataJulgamentoStr = formatExcelDate(getVal(tema, ['Data julgamento tema', 'Data julgamento', 'Julgamento']));
              
              if (processoStr || linkProcessoStr || relatorAtualStr || situacaoProcessoParadigmaStr || dataAutuacaoStr || dataAdmissibilidadeStr || dataJulgamentoStr) {
                rawProcessos = [{ 
                  processo: processoStr, 
                  linkProcesso: linkProcessoStr, 
                  relatorAtual: relatorAtualStr, 
                  situacaoProcessoParadigma: situacaoProcessoParadigmaStr, 
                  dataAutuacao: dataAutuacaoStr, 
                  dataAdmissibilidade: dataAdmissibilidadeStr, 
                  dataJulgamento: dataJulgamentoStr 
                }];
              } else {
                rawProcessos = [];
              }
            }

            let processos: any[] = [];
            rawProcessos.forEach((proc: any) => {
              const processoStr = String(proc.processo || '');
              const linkProcessoStr = String(proc.linkProcesso || '');
              const relatorAtualStr = String(proc.relatorAtual || '');
              const situacaoProcessoParadigmaStr = String(proc.situacaoProcessoParadigma || '');
              const dataAutuacaoStr = String(proc.dataAutuacao || '');
              const dataAdmissibilidadeStr = String(proc.dataAdmissibilidade || '');
              const dataJulgamentoStr = String(proc.dataJulgamento || '');

              const splitValues = (str: string) => {
                if (!str) return [];
                const parts = str.split(/(?:\r\n|\r|\n|;| \/ )/);
                return parts.map(s => s.trim()).filter(Boolean);
              };

              const hasMultiple = /(?:\r\n|\r|\n|;| \/ )/.test(processoStr) || 
                                  /(?:\r\n|\r|\n|;| \/ )/.test(linkProcessoStr) || 
                                  /(?:\r\n|\r|\n|;| \/ )/.test(relatorAtualStr) || 
                                  /(?:\r\n|\r|\n|;| \/ )/.test(situacaoProcessoParadigmaStr) || 
                                  /(?:\r\n|\r|\n|;| \/ )/.test(dataAutuacaoStr) || 
                                  /(?:\r\n|\r|\n|;| \/ )/.test(dataAdmissibilidadeStr) || 
                                  /(?:\r\n|\r|\n|;| \/ )/.test(dataJulgamentoStr);

              if (hasMultiple) {
                const processosArr = splitValues(processoStr);
                const linkProcessoArr = splitValues(linkProcessoStr);
                const relatorAtualArr = splitValues(relatorAtualStr);
                const situacaoProcessoParadigmaArr = splitValues(situacaoProcessoParadigmaStr);
                const dataAutuacaoArr = splitValues(dataAutuacaoStr);
                const dataAdmissibilidadeArr = splitValues(dataAdmissibilidadeStr);
                const dataJulgamentoArr = splitValues(dataJulgamentoStr);
                
                const maxLen = Math.max(
                  processosArr.length, linkProcessoArr.length, relatorAtualArr.length,
                  situacaoProcessoParadigmaArr.length, dataAutuacaoArr.length, dataAdmissibilidadeArr.length, dataJulgamentoArr.length
                );
                
                for (let i = 0; i < maxLen; i++) {
                  processos.push({
                    processo: processosArr[i] || processosArr[0] || '',
                    linkProcesso: linkProcessoArr[i] || linkProcessoArr[0] || '',
                    relatorAtual: relatorAtualArr[i] || relatorAtualArr[0] || '',
                    situacaoProcessoParadigma: situacaoProcessoParadigmaArr[i] || situacaoProcessoParadigmaArr[0] || '',
                    dataAutuacao: dataAutuacaoArr[i] || dataAutuacaoArr[0] || '',
                    dataAdmissibilidade: dataAdmissibilidadeArr[i] || dataAdmissibilidadeArr[0] || '',
                    dataJulgamento: dataJulgamentoArr[i] || dataJulgamentoArr[0] || ''
                  });
                }
              } else {
                processos.push(proc);
              }
            });
            
            const hasProcessos = processos.length > 0;

            return (
              <div 
                key={tema.id} 
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col p-6"
              >
                <div className="mb-6 flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-[#0a1e3f]">Tema {numero}</h2>
                    {titulo && (
                      <h3 className="text-lg font-semibold text-brand-grafite mt-2">
                        {rawProcessos[0]?.linkProcesso ? (
                          <a href={rawProcessos[0].linkProcesso} target="_blank" rel="noopener noreferrer" className="text-brand-grafite hover:underline flex items-center gap-1">
                            {titulo} <ExternalLink size={14} />
                          </a>
                        ) : (
                          titulo
                        )}
                      </h3>
                    )}
                    {ramoDireito && (
                      <div className="mt-4">
                        <span className="inline-flex max-w-max items-center px-3 py-1 bg-blue-50 text-brand-grafite rounded-full text-xs font-bold ring-1 ring-inset ring-blue-100 uppercase tracking-wider">
                          {ramoDireito}
                        </span>
                      </div>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openEdit(tema)}
                        className="p-2 text-brand-grafite/70 hover:text-brand-grafite transition-colors bg-gray-50 rounded-lg"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => setShowDeleteConfirm(tema.id)}
                        className="p-2 text-brand-grafite/70 hover:text-red-500 transition-colors bg-gray-50 rounded-lg"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-8">
                  {hasProcessos && (
                    <div className="w-full flex flex-col gap-3">
                      {processos.map((proc: any, idx: number) => {
                        const parts = [];
                        if (proc.processo) {
                          parts.push(
                            <div key="proc" className="flex flex-col">
                              <span className="text-xs text-brand-grafite uppercase font-bold mb-1">Processo</span>
                              {proc.linkProcesso ? (
                                <a 
                                  href={proc.linkProcesso} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-brand-grafite hover:underline font-bold inline-flex items-center gap-1 text-sm"
                                >
                                  {proc.processo}
                                  <ExternalLink size={10} className="inline" />
                                </a>
                              ) : (
                                <span className="font-bold text-brand-grafite text-sm">{proc.processo}</span>
                              )}
                            </div>
                          );
                        }
                        if (proc.relatorAtual) {
                          parts.push(
                            <div key="relator" className="flex flex-col">
                              <span className="text-xs text-brand-grafite uppercase font-bold mb-1">Relator Atual</span>
                              <span className="font-bold text-brand-grafite text-sm">{proc.relatorAtual}</span>
                            </div>
                          );
                        }
                        if (proc.situacaoProcessoParadigma) {
                          parts.push(
                            <div key="sitProc" className="flex flex-col">
                              <span className="text-xs text-brand-grafite uppercase font-bold mb-1">Situação</span>
                              <span className="font-bold text-brand-grafite text-sm">{proc.situacaoProcessoParadigma}</span>
                            </div>
                          );
                        }
                        
                        const dataAutuacao = formatExcelDate(proc.dataAutuacao);
                        if (dataAutuacao) {
                          parts.push(
                            <div key="autuacao" className="flex flex-col">
                              <span className="text-xs text-brand-grafite uppercase font-bold mb-1">Data Autuação</span>
                              <span className="font-bold text-brand-grafite text-sm">{dataAutuacao}</span>
                            </div>
                          );
                        }
                        
                        const dataAdmissibilidade = formatExcelDate(proc.dataAdmissibilidade);
                        if (dataAdmissibilidade) {
                          parts.push(
                            <div key="admissibilidade" className="flex flex-col">
                              <span className="text-xs text-brand-grafite uppercase font-bold mb-1">Data Admissibilidade RG</span>
                              <span className="font-bold text-brand-grafite text-sm">{dataAdmissibilidade}</span>
                            </div>
                          );
                        }
                        
                        const dataJulgamento = formatExcelDate(proc.dataJulgamento);
                        if (dataJulgamento) {
                          parts.push(
                            <div key="julgamento" className="flex flex-col">
                              <span className="text-xs text-brand-grafite uppercase font-bold mb-1">Data Julgamento</span>
                              <span className="font-bold text-brand-grafite text-sm">{dataJulgamento}</span>
                            </div>
                          );
                        }

                        return (
                          <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-6">
                            {parts}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="w-full flex flex-col gap-6">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-brand-grafite uppercase mb-2">
                        <Info size={14} />
                        DESCRIÇÃO DO TEMA
                      </div>
                      <p className="text-brand-grafite text-sm leading-relaxed">
                        {descricao ? renderMarkdown(descricao) : '-'}
                      </p>
                    </div>

                    <div className="bg-[#f0f9ff] border-l-4 border-brand-blue p-4 rounded-r-lg">
                      <h4 className="text-xs font-bold text-brand-grafite uppercase mb-2">TESE</h4>
                      <p className="font-bold text-sm text-brand-grafite leading-relaxed">
                        {tese ? renderMarkdown(tese) : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

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

        {/* Modal Adicionar/Editar */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h2 className="text-xl font-bold text-[#0a1e3f]">
                  {editingTema ? 'Editar Tema' : 'Novo Tema'}
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
                      <label className="block text-sm font-bold text-brand-grafite mb-1">Número do Tema</label>
                      <input
                        type="text"
                        required
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-grafite focus:bg-white transition-all outline-none"
                        value={formData.numeroTema}
                        onChange={e => setFormData({...formData, numeroTema: e.target.value})}
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
                      <label className="block text-sm font-bold text-brand-grafite mb-1">Título do Tema</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-grafite focus:bg-white transition-all outline-none"
                        value={formData.tituloTema}
                        onChange={e => setFormData({...formData, tituloTema: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-brand-grafite mb-1">Situação da Repercussão Geral</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-grafite focus:bg-white transition-all outline-none"
                        value={formData.situacaoRG}
                        onChange={e => setFormData({...formData, situacaoRG: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-brand-grafite mb-1">Situação da Admissibilidade do Tema</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-grafite focus:bg-white transition-all outline-none"
                        value={formData.situacaoAdmissibilidade}
                        onChange={e => setFormData({...formData, situacaoAdmissibilidade: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-brand-grafite mb-1">Tese</label>
                      <textarea
                        rows={3}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-grafite focus:bg-white transition-all outline-none resize-none"
                        value={formData.tese}
                        onChange={e => setFormData({...formData, tese: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-brand-grafite mb-1">Processo</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-grafite focus:bg-white transition-all outline-none"
                        value={formData.processo}
                        onChange={e => setFormData({...formData, processo: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-brand-grafite mb-1">Relator</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-grafite focus:bg-white transition-all outline-none"
                        value={formData.relator}
                        onChange={e => setFormData({...formData, relator: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-brand-grafite mb-1">Situação (Processo)</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-grafite focus:bg-white transition-all outline-none"
                        value={formData.situacao}
                        onChange={e => setFormData({...formData, situacao: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-brand-grafite mb-1">Data de Autuação</label>
                      <input
                        type="text"
                        placeholder="DD/MM/YYYY"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-grafite focus:bg-white transition-all outline-none"
                        value={formData.dataAutuacao}
                        onChange={e => setFormData({...formData, dataAutuacao: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-brand-grafite mb-1">Link do Processo</label>
                      <input
                        type="text"
                        placeholder="https://..."
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-grafite focus:bg-white transition-all outline-none"
                        value={formData.linkProcesso}
                        onChange={e => setFormData({...formData, linkProcesso: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-brand-grafite mb-1">Descrição do Tema</label>
                      <textarea
                        rows={3}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-grafite focus:bg-white transition-all outline-none resize-none"
                        value={formData.descricaoTema}
                        onChange={e => setFormData({...formData, descricaoTema: e.target.value})}
                      />
                    </div>
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
