import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Calendar, ExternalLink, Scale, FileText,
  ChevronDown, ChevronUp, Edit2, Save, X, ArrowLeft, ArrowUp, ArrowDown, 
  Trash2, Plus, Bold, Code, Loader2
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { db, auth } from '../../firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ADMIN_EMAILS } from '../../constants';

// Helper to render **bold text**
const renderFormattedText = (text: string) => {
  if (!text) return "";
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return <strong key={index} className="font-bold text-brand-grafite">{part}</strong>;
    }
    return part;
  });
};

type SectionKey = 'jurisprudencia' | 'legislacao' | 'doutrinas' | 'relatorios';

interface ClippingItemDynamic {
  id: string;
  tag?: string;
  tagColor?: string;
  subtitle?: string;
  pubDate?: string;
  title: string;
  paragraphs?: string[];
  content?: string;
  author?: string;
  link?: string;
  hideCommentLabel?: boolean;
}

interface DynamicClippingContent {
  jurisprudencia: ClippingItemDynamic[];
  legislacao: ClippingItemDynamic[];
  doutrinas: ClippingItemDynamic[];
  relatorios: ClippingItemDynamic[];
}

export default function ClippingViewDynamic() {
  const { editionId } = useParams<{ editionId: string }>();
  
  const [openSections, setOpenSections] = useState({
    jurisprudencia: true,
    legislacao: true,
    doutrinas: true,
    relatorios: true
  });

  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editionMeta, setEditionMeta] = useState<{
    title: string;
    period: string;
  }>({
    title: 'Clipping UN Corporate',
    period: ''
  });

  const [clippingData, setClippingData] = useState<DynamicClippingContent>({
    jurisprudencia: [],
    legislacao: [],
    doutrinas: [],
    relatorios: []
  });
  
  // States for block-by-block editor
  const [tempData, setTempData] = useState<any>(null);
  const [tempMeta, setTempMeta] = useState({ title: '', period: '' });
  const [activeTab, setActiveTab] = useState<'jurisprudencia' | 'legislacao' | 'doutrinas' | 'relatorios' | 'json'>('jurisprudencia');
  const [rawJsonStr, setRawJsonStr] = useState("");

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

  useEffect(() => {
    if (!editionId) return;
    setLoading(true);

    const docRef = doc(db, 'clippings', editionId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      setLoading(false);
      if (docSnap.exists()) {
        const snap = docSnap.data();
        setEditionMeta({
          title: snap.title || 'Edição Personalizada',
          period: snap.period || ''
        });
        setClippingData(snap.data || {
          jurisprudencia: [],
          legislacao: [],
          doutrinas: [],
          relatorios: []
        });
        setNotFound(false);
      } else {
        setNotFound(true);
      }
    }, (error) => {
      console.error("Erro ao carregar clipping dinâmico:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [editionId]);

  const toggleSection = (section: SectionKey) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleEditClick = () => {
    setTempData(JSON.parse(JSON.stringify(clippingData)));
    setTempMeta({ ...editionMeta });
    setRawJsonStr(JSON.stringify(clippingData, null, 2));
    setIsEditing(true);
  };

  const handleSaveAll = async () => {
    if (!editionId) return;
    setIsSaving(true);
    try {
      let finalData = tempData;
      if (activeTab === 'json') {
        finalData = JSON.parse(rawJsonStr);
      }
      
      await setDoc(doc(db, 'clippings', editionId), {
        title: tempMeta.title || editionMeta.title,
        period: tempMeta.period || editionMeta.period,
        data: finalData,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setClippingData(finalData);
      setEditionMeta({ ...tempMeta });
      setIsEditing(false);
    } catch (e) {
      alert("Erro ao salvar: Verifique se os dados são válidos ou se você tem permissão de administrador.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (section: string, itemId: string, field: string, value: any) => {
    setTempData((prev: any) => {
      const sectionItems = (prev[section] || []).map((item: any) => {
        if (item.id === itemId) {
          return { ...item, [field]: value };
        }
        return item;
      });
      return { ...prev, [section]: sectionItems };
    });
  };

  const handleParagraphsChange = (section: SectionKey, itemId: string, text: string) => {
    const paragraphs = text.split('\n');
    setTempData((prev: any) => {
      const sectionItems = (prev[section] || []).map((item: any) => {
        if (item.id === itemId) {
          return { ...item, paragraphs };
        }
        return item;
      });
      return { ...prev, [section]: sectionItems };
    });
  };

  const handleAddItem = (section: SectionKey) => {
    const newItem: any = { id: 'item_' + Date.now().toString() };
    if (section === 'jurisprudencia') {
      newItem.tag = "STJ";
      newItem.tagColor = "blue";
      newItem.subtitle = "Processo nº ...";
      newItem.pubDate = "Publicação oficial";
      newItem.title = "Nova Decisão Judicial";
      newItem.paragraphs = ["Comentário da decisão aqui. Use **negrito** para destacar termos importantes."];
      newItem.link = "";
    } else if (section === 'legislacao') {
      newItem.tag = "CVM";
      newItem.tagColor = "emerald";
      newItem.subtitle = "Normativo nº ...";
      newItem.pubDate = "Publicação oficial";
      newItem.title = "Nova Norma Regulatória";
      newItem.paragraphs = ["Comentário da legislação aqui. Use **negrito** para destacar."];
      newItem.link = "";
    } else if (section === 'doutrinas') {
      newItem.tag = "Artigo Doutrinário";
      newItem.title = "Novo Título de Doutrina";
      newItem.author = "Autor(es)";
      newItem.content = "Resumo analítico aqui. Use **negrito** para destacar.";
      newItem.link = "";
    }

    setTempData((prev: any) => ({
      ...prev,
      [section]: [...(prev[section] || []), newItem]
    }));
  };

  const handleDeleteItem = (section: string, itemId: string) => {
    if (window.confirm("Deseja realmente remover este bloco?")) {
      setTempData((prev: any) => ({
        ...prev,
        [section]: (prev[section] || []).filter((item: any) => item.id !== itemId)
      }));
    }
  };

  const handleMoveItem = (section: string, index: number, direction: 'up' | 'down') => {
    setTempData((prev: any) => {
      const items = [...(prev[section] || [])];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= items.length) return prev;

      const temp = items[index];
      items[index] = items[targetIndex];
      items[targetIndex] = temp;

      return { ...prev, [section]: items };
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] text-brand-grafite">
        <Loader2 className="animate-spin mb-3 text-brand-grafite" size={32} />
        <p className="text-sm font-medium">Carregando clipping...</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] text-brand-grafite px-4">
        <h2 className="text-2xl font-bold font-serif mb-2">Clipping não encontrado</h2>
        <p className="text-gray-500 mb-6 text-center max-w-md text-sm">
          A edição solicitada ({editionId}) ainda não foi cadastrada ou foi removida.
        </p>
        <Link 
          to="/clipping-corporativo"
          className="bg-brand-grafite text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-brand-grafite/90 transition-colors inline-flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Voltar para Clippings
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 flex-1 w-full min-h-screen pb-16 relative">
      
      {/* Block-by-Block Edit Modal */}
      {isEditing && tempData && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden animate-fadeIn">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-gray-200 flex justify-between items-center bg-slate-50">
              <div className="flex-1 pr-4">
                <h2 className="text-lg font-bold text-brand-grafite">Editor do Clipping UN Corporate</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  <input
                    type="text"
                    value={tempMeta.title}
                    onChange={(e) => setTempMeta({ ...tempMeta, title: e.target.value })}
                    placeholder="Título da Edição (ex: 6ª Edição — Setembro 2026)"
                    className="text-xs border border-gray-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-brand-grafite w-full bg-white font-medium"
                  />
                  <input
                    type="text"
                    value={tempMeta.period}
                    onChange={(e) => setTempMeta({ ...tempMeta, period: e.target.value })}
                    placeholder="Período da Pesquisa (ex: Pesquisa: 1 a 31 de agosto de 2026)"
                    className="text-xs border border-gray-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-brand-grafite w-full bg-white"
                  />
                </div>
              </div>
              <button 
                onClick={() => setIsEditing(false)} 
                className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-gray-100"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body: Sidebar and Editor Panel */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              
              {/* Sidebar tabs */}
              <div className="w-full md:w-64 bg-slate-50 border-r border-gray-200 p-4 flex flex-col gap-1 overflow-y-auto">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">Seções do Clipping</span>
                
                <button
                  onClick={() => setActiveTab('jurisprudencia')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'jurisprudencia' ? 'bg-brand-grafite text-white' : 'text-gray-700 hover:bg-gray-200'}`}
                >
                  <Scale size={18} />
                  Jurisprudência
                </button>

                <button
                  onClick={() => setActiveTab('legislacao')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'legislacao' ? 'bg-brand-grafite text-white' : 'text-gray-700 hover:bg-gray-200'}`}
                >
                  <FileText size={18} />
                  Legislação
                </button>

                <button
                  onClick={() => setActiveTab('doutrinas')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'doutrinas' ? 'bg-brand-grafite text-white' : 'text-gray-700 hover:bg-gray-200'}`}
                >
                  <BookOpen size={18} />
                  Doutrinas Selecionadas
                </button>

                <div className="border-t border-gray-200 my-4"></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">Avançado</span>

                <button
                  onClick={() => {
                    setActiveTab('json');
                    setRawJsonStr(JSON.stringify(tempData, null, 2));
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'json' ? 'bg-brand-grafite text-white' : 'text-gray-700 hover:bg-gray-200'}`}
                >
                  <Code size={18} />
                  Código JSON Bruto
                </button>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 p-6 overflow-y-auto bg-white flex flex-col">
                
                {activeTab !== 'json' && (
                  <div className="bg-slate-50 border-l-4 border-brand-grafite p-3 rounded-r-lg mb-6 flex items-start gap-2 text-xs text-brand-grafite">
                    <Bold size={16} className="text-brand-grafite mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Dica de Formatação:</strong> Use asteriscos duplos para negrito: <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px] font-mono">**seu texto aqui**</code>.
                    </div>
                  </div>
                )}

                {/* Tab: JURISPRUDÊNCIA */}
                {activeTab === 'jurisprudencia' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                      <h3 className="font-bold text-brand-grafite text-base flex items-center gap-2">
                        <Scale size={18} />
                        Jurisprudência Comentada ({(tempData.jurisprudencia || []).length} decisões)
                      </h3>
                      <button
                        onClick={() => handleAddItem('jurisprudencia')}
                        className="bg-brand-grafite hover:bg-brand-grafite/90 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        <Plus size={16} /> Adicionar Decisão
                      </button>
                    </div>

                    {(tempData.jurisprudencia || []).map((item: any, index: number) => (
                      <div key={item.id} className="bg-slate-50 border border-gray-200 rounded-xl p-4 sm:p-5 relative space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                          <span className="font-bold text-xs bg-brand-grafite text-white px-2.5 py-0.5 rounded-full">
                            #{index + 1} • {item.tag || "Decisão"}
                          </span>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => handleMoveItem('jurisprudencia', index, 'up')}
                              disabled={index === 0}
                              className="p-1 text-gray-400 hover:text-brand-grafite disabled:opacity-30"
                              title="Mover para cima"
                            >
                              <ArrowUp size={16} />
                            </button>
                            <button 
                              onClick={() => handleMoveItem('jurisprudencia', index, 'down')}
                              disabled={index === (tempData.jurisprudencia.length - 1)}
                              className="p-1 text-gray-400 hover:text-brand-grafite disabled:opacity-30"
                              title="Mover para baixo"
                            >
                              <ArrowDown size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteItem('jurisprudencia', item.id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors ml-2"
                              title="Excluir decisão"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase">Tribunal / Tag</label>
                            <input 
                              type="text"
                              value={item.tag || ""}
                              onChange={(e) => handleFieldChange('jurisprudencia', item.id, 'tag', e.target.value)}
                              className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-grafite"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase">Cor da Tag</label>
                            <select
                              value={item.tagColor || "blue"}
                              onChange={(e) => handleFieldChange('jurisprudencia', item.id, 'tagColor', e.target.value)}
                              className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-grafite"
                            >
                              <option value="blue">Azul (STJ)</option>
                              <option value="purple">Roxo (TJSP)</option>
                              <option value="rose">Rosa / Vinho (TJMG)</option>
                              <option value="emerald">Verde</option>
                              <option value="indigo">Índigo</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase">Data de Julgamento / Publicação</label>
                            <input 
                              type="text"
                              value={item.pubDate || ""}
                              onChange={(e) => handleFieldChange('jurisprudencia', item.id, 'pubDate', e.target.value)}
                              className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-grafite"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase">Número do Processo / Recurso</label>
                            <input 
                              type="text"
                              value={item.subtitle || ""}
                              onChange={(e) => handleFieldChange('jurisprudencia', item.id, 'subtitle', e.target.value)}
                              className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-grafite font-serif"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase">Link da Decisão (URL)</label>
                            <input 
                              type="text"
                              value={item.link || ""}
                              onChange={(e) => handleFieldChange('jurisprudencia', item.id, 'link', e.target.value)}
                              className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-grafite"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase">Tema / Tese Principal</label>
                          <input 
                            type="text"
                            value={item.title || ""}
                            onChange={(e) => handleFieldChange('jurisprudencia', item.id, 'title', e.target.value)}
                            className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-grafite"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase">Comentários (Quebre parágrafos pulando linha)</label>
                          <textarea 
                            rows={4}
                            value={item.paragraphs ? item.paragraphs.join('\n') : ""}
                            onChange={(e) => handleParagraphsChange('jurisprudencia', item.id, e.target.value)}
                            className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-grafite font-sans"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab: LEGISLAÇÃO */}
                {activeTab === 'legislacao' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                      <h3 className="font-bold text-brand-grafite text-base flex items-center gap-2">
                        <FileText size={18} />
                        Legislação Comentada ({(tempData.legislacao || []).length} normas)
                      </h3>
                      <button
                        onClick={() => handleAddItem('legislacao')}
                        className="bg-brand-grafite hover:bg-brand-grafite/90 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        <Plus size={16} /> Adicionar Legislação
                      </button>
                    </div>

                    {(tempData.legislacao || []).map((item: any, index: number) => (
                      <div key={item.id} className="bg-slate-50 border border-gray-200 rounded-xl p-4 sm:p-5 relative space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                          <span className="font-bold text-xs bg-emerald-800 text-white px-2.5 py-0.5 rounded-full">
                            #{index + 1} • {item.tag || "CVM"}
                          </span>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => handleMoveItem('legislacao', index, 'up')}
                              disabled={index === 0}
                              className="p-1 text-gray-400 hover:text-brand-grafite disabled:opacity-30"
                              title="Mover para cima"
                            >
                              <ArrowUp size={16} />
                            </button>
                            <button 
                              onClick={() => handleMoveItem('legislacao', index, 'down')}
                              disabled={index === (tempData.legislacao.length - 1)}
                              className="p-1 text-gray-400 hover:text-brand-grafite disabled:opacity-30"
                              title="Mover para baixo"
                            >
                              <ArrowDown size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteItem('legislacao', item.id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors ml-2"
                              title="Excluir normativo"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase">Órgão Regulador / Norma</label>
                            <input 
                              type="text"
                              value={item.subtitle || ""}
                              onChange={(e) => handleFieldChange('legislacao', item.id, 'subtitle', e.target.value)}
                              className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-grafite font-serif"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase">Data da Publicação</label>
                            <input 
                              type="text"
                              value={item.pubDate || ""}
                              onChange={(e) => handleFieldChange('legislacao', item.id, 'pubDate', e.target.value)}
                              className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-grafite"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase">Tag (ex: CVM)</label>
                            <input 
                              type="text"
                              value={item.tag || ""}
                              onChange={(e) => handleFieldChange('legislacao', item.id, 'tag', e.target.value)}
                              className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-grafite"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase">Link da Íntegra (URL)</label>
                            <input 
                              type="text"
                              value={item.link || ""}
                              onChange={(e) => handleFieldChange('legislacao', item.id, 'link', e.target.value)}
                              className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-grafite"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase">Tema</label>
                          <input 
                            type="text"
                            value={item.title || ""}
                            onChange={(e) => handleFieldChange('legislacao', item.id, 'title', e.target.value)}
                            className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-grafite"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase">Comentário (Quebre parágrafos por linha)</label>
                          <textarea 
                            rows={4}
                            value={item.paragraphs ? item.paragraphs.join('\n') : ""}
                            onChange={(e) => handleParagraphsChange('legislacao', item.id, e.target.value)}
                            className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-grafite font-sans"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab: DOUTRINAS */}
                {activeTab === 'doutrinas' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                      <h3 className="font-bold text-brand-grafite text-base flex items-center gap-2">
                        <BookOpen size={18} />
                        Doutrinas Selecionadas ({(tempData.doutrinas || []).length} artigos)
                      </h3>
                      <button
                        onClick={() => handleAddItem('doutrinas')}
                        className="bg-brand-grafite hover:bg-brand-grafite/90 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        <Plus size={16} /> Adicionar Doutrina
                      </button>
                    </div>

                    {(tempData.doutrinas || []).map((item: any, index: number) => (
                      <div key={item.id} className="bg-slate-50 border border-gray-200 rounded-xl p-4 sm:p-5 relative space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                          <span className="font-bold text-xs bg-emerald-700 text-white px-2.5 py-0.5 rounded-full">
                            #{index + 1} • {item.tag || "Doutrina"}
                          </span>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => handleMoveItem('doutrinas', index, 'up')}
                              disabled={index === 0}
                              className="p-1 text-gray-400 hover:text-brand-grafite disabled:opacity-30"
                              title="Mover para cima"
                            >
                              <ArrowUp size={16} />
                            </button>
                            <button 
                              onClick={() => handleMoveItem('doutrinas', index, 'down')}
                              disabled={index === (tempData.doutrinas.length - 1)}
                              className="p-1 text-gray-400 hover:text-brand-grafite disabled:opacity-30"
                              title="Mover para baixo"
                            >
                              <ArrowDown size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteItem('doutrinas', item.id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors ml-2"
                              title="Excluir doutrina"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase">Título da Obra / Artigo</label>
                          <input 
                            type="text"
                            value={item.title || ""}
                            onChange={(e) => handleFieldChange('doutrinas', item.id, 'title', e.target.value)}
                            className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-grafite"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase">Autor(es) / Publicação</label>
                            <input 
                              type="text"
                              value={item.author || ""}
                              onChange={(e) => handleFieldChange('doutrinas', item.id, 'author', e.target.value)}
                              className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-grafite"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase">Link do Artigo / Livro (URL)</label>
                            <input 
                              type="text"
                              value={item.link || ""}
                              onChange={(e) => handleFieldChange('doutrinas', item.id, 'link', e.target.value)}
                              className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-grafite"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-gray-500 uppercase">Resumo da Doutrina</label>
                          <textarea 
                            rows={3}
                            value={item.content || ""}
                            onChange={(e) => handleFieldChange('doutrinas', item.id, 'content', e.target.value)}
                            className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-grafite font-sans"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tab: JSON BRUTO */}
                {activeTab === 'json' && (
                  <div className="h-full flex flex-col space-y-2">
                    <p className="text-xs text-gray-500">
                      Você pode editar o código JSON diretamente abaixo. Certifique-se de que a sintaxe seja válida.
                    </p>
                    <textarea
                      value={rawJsonStr}
                      onChange={(e) => setRawJsonStr(e.target.value)}
                      className="w-full flex-1 border border-gray-300 rounded-lg p-4 font-mono text-xs focus:ring-brand-grafite focus:border-brand-grafite min-h-[350px] bg-slate-900 text-slate-100"
                    />
                  </div>
                )}

              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-slate-50">
              <button 
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-lg text-brand-grafite hover:bg-slate-200 font-medium text-sm transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveAll}
                disabled={isSaving}
                className="px-6 py-2 rounded-lg bg-brand-grafite hover:bg-brand-grafite/90 text-white font-semibold text-sm flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Salvar Alterações
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-brand-grafite text-white py-4 px-4 sm:px-6 lg:px-8 shadow-md">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <Link to="/clipping-corporativo" className="text-brand-cinza hover:text-white transition-colors inline-flex items-center gap-2 text-sm font-medium">
              <ArrowLeft size={16} />
              Retornar para todos os clippings
            </Link>
            {isAdmin && (
              <button 
                onClick={handleEditClick}
                className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
              >
                <Edit2 size={16} />
                Editar Clipping
              </button>
            )}
          </div>
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold font-serif mb-3">Clipping UN Corporate</h1>
            <div className="inline-flex items-center gap-2 bg-brand-grafite/80 px-4 py-2 rounded-full text-brand-cinza text-sm font-medium border border-slate-700">
              <Calendar size={16} />
              <span>{editionMeta.title} {editionMeta.period ? `| ${editionMeta.period}` : ''}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-20 z-10 shadow-sm overflow-x-auto">
        <div className="max-w-4xl mx-auto px-4 min-w-max sm:min-w-0">
          <div className="flex items-center gap-6 whitespace-nowrap py-4 justify-start sm:justify-center text-sm font-medium">
            <a href="#jurisprudencia" className="text-brand-grafite hover:text-brand-grafite/80 transition-colors">Jurisprudência Comentada</a>
            <a href="#legislacao" className="text-brand-grafite hover:text-brand-grafite/80 transition-colors">Legislação Comentada</a>
            <a href="#doutrinas" className="text-brand-grafite hover:text-brand-grafite/80 transition-colors">Doutrinas Selecionadas</a>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-12">
        
        {/* SEÇÃO 1: JURISPRUDÊNCIA COMENTADA */}
        {clippingData?.jurisprudencia && clippingData.jurisprudencia.length > 0 && (
          <section id="jurisprudencia" className="scroll-mt-40">
            <button 
              onClick={() => toggleSection('jurisprudencia')}
              className="w-full bg-brand-grafite text-white py-3 px-6 rounded-t-xl border-b-4 border-blue-500 flex items-center justify-between gap-3 transition-colors hover:bg-brand-grafite/90"
            >
              <div className="flex items-center gap-3">
                <Scale size={20} className="text-white" />
                <h2 className="text-xl font-bold uppercase tracking-wide">Jurisprudência Comentada</h2>
              </div>
              {openSections.jurisprudencia ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            
            {openSections.jurisprudencia && (
              <div className="pt-6 space-y-6 animate-fadeIn">
                {clippingData.jurisprudencia.map((item: any) => {
                  let tagBg = "bg-blue-100 text-blue-800";
                  if (item.tagColor === 'rose') tagBg = "bg-rose-100 text-rose-800";
                  if (item.tagColor === 'purple') tagBg = "bg-purple-100 text-purple-800";
                  if (item.tagColor === 'emerald') tagBg = "bg-emerald-100 text-emerald-800";
                  if (item.tagColor === 'indigo') tagBg = "bg-indigo-100 text-indigo-800";

                  return (
                    <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 hover:shadow-md transition-shadow">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <span className={`${tagBg} text-xs font-bold px-2.5 py-1 rounded`}>
                          {item.tag || "Decisão"}
                        </span>
                        <span className="text-sm font-bold font-serif text-brand-grafite">{item.subtitle}</span>
                        {item.pubDate && (
                          <span className="text-xs text-gray-500 font-medium">({item.pubDate})</span>
                        )}
                      </div>
                      
                      <h3 className="text-xl font-bold text-brand-grafite mb-4 leading-tight">{item.title}</h3>
                      
                      <div className="prose prose-sm text-brand-grafite mb-6 space-y-4">
                        {item.paragraphs?.map((p: string, i: number) => (
                          <p key={i} className="leading-relaxed">
                            {(i === 0 && !item.hideCommentLabel) && <span className="font-bold">Comentário: </span>}
                            {renderFormattedText(p)}
                          </p>
                        ))}
                      </div>

                      {item.link && (
                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-brand-grafite hover:bg-brand-grafite/90 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors text-sm w-full sm:w-auto">
                          Acesse a íntegra da decisão
                          <ExternalLink size={16} />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* SEÇÃO 2: LEGISLAÇÃO COMENTADA */}
        {clippingData?.legislacao && clippingData.legislacao.length > 0 && (
          <section id="legislacao" className="scroll-mt-40">
            <button 
              onClick={() => toggleSection('legislacao')}
              className="w-full bg-brand-grafite text-white py-3 px-6 rounded-t-xl border-b-4 border-amber-500 flex items-center justify-between gap-3 transition-colors hover:bg-brand-grafite/90"
            >
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-amber-500" />
                <h2 className="text-xl font-bold uppercase tracking-wide">Legislação Comentada</h2>
              </div>
              {openSections.legislacao ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            
            {openSections.legislacao && (
              <div className="pt-6 space-y-6">
                {clippingData.legislacao.map((item: any) => (
                  <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 hover:shadow-md transition-shadow">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded">{item.tag || "CVM"}</span>
                      <span className="text-sm font-bold font-serif text-brand-grafite">{item.subtitle}</span>
                      {item.pubDate && (
                        <span className="text-xs text-gray-500 font-medium">({item.pubDate})</span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-brand-grafite mb-4 leading-tight">{item.title}</h3>
                    <div className="prose prose-sm text-brand-grafite mb-6 space-y-4">
                      {item.paragraphs?.map((p: string, i: number) => (
                        <p key={i} className="leading-relaxed">
                          {(i === 0 && !item.hideCommentLabel) && <span className="font-bold">Comentário: </span>}
                          {renderFormattedText(p)}
                        </p>
                      ))}
                    </div>
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-brand-grafite hover:bg-brand-grafite/90 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors text-sm w-full sm:w-auto">
                        Acesse a íntegra do normativo
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* SEÇÃO 3: DOUTRINAS SELECIONADAS */}
        {clippingData?.doutrinas && clippingData.doutrinas.length > 0 && (
          <section id="doutrinas" className="scroll-mt-40">
            <button 
              onClick={() => toggleSection('doutrinas')}
              className="w-full bg-brand-grafite text-white py-3 px-6 rounded-t-xl border-b-4 border-emerald-500 flex items-center justify-between gap-3 transition-colors hover:bg-brand-grafite/90"
            >
              <div className="flex items-center gap-3">
                <BookOpen size={20} className="text-emerald-500" />
                <h2 className="text-xl font-bold uppercase tracking-wide">Doutrinas Selecionadas</h2>
              </div>
              {openSections.doutrinas ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            
            {openSections.doutrinas && (
              <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {clippingData.doutrinas.map((item: any) => (
                  <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col hover:shadow-md transition-shadow">
                    <div className="mb-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded">{item.tag || "Artigo Doutrinário"}</span>
                    </div>
                    <h3 className="text-lg font-bold text-brand-grafite mb-2 leading-tight">{item.title}</h3>
                    <p className="text-sm font-medium text-brand-grafite mb-4">{item.author}</p>
                    <p className="text-sm text-brand-grafite flex-1 mb-6 leading-relaxed">
                      <span className="font-bold">Resumo: </span>{renderFormattedText(item.content)}
                    </p>
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-brand-grafite hover:text-brand-grafite/80 text-sm font-bold transition-colors mt-auto">
                        Leia a íntegra do artigo
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

      </div>
    </div>
  );
}
