import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Calendar, ExternalLink, Scale, FileText, CheckCircle2, 
  ChevronDown, ChevronUp, Edit2, Save, X, ArrowLeft, ArrowUp, ArrowDown, 
  Trash2, Plus, Bold, Code
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { db, auth } from '../../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { defaultClippingEdicao5Data } from './clippingEdicao5Data';

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

export default function ClippingEdicao5() {
  const [openSections, setOpenSections] = useState({
    jurisprudencia: true,
    legislacao: true,
    doutrinas: true,
    relatorios: true
  });

  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [clippingData, setClippingData] = useState<any>(defaultClippingEdicao5Data);
  
  // States for block-by-block editor
  const [tempData, setTempData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'jurisprudencia' | 'legislacao' | 'doutrinas' | 'relatorios' | 'json'>('jurisprudencia');
  const [rawJsonStr, setRawJsonStr] = useState("");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      if (u) {
        setIsAdmin(true); 
      } else {
        setIsAdmin(false);
        setIsEditing(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const docRef = doc(db, 'clippings', 'edicao-5');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setClippingData(docSnap.data().data);
      } else {
        setClippingData(defaultClippingEdicao5Data);
      }
    }, (error) => {
      console.error(error);
    });

    return () => unsubscribe();
  }, []);

  const toggleSection = (id: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleEditClick = () => {
    if (!isAdmin) return;
    setTempData(JSON.parse(JSON.stringify(clippingData))); // Deep copy
    setRawJsonStr(JSON.stringify(clippingData, null, 2));
    setActiveTab('jurisprudencia');
    setIsEditing(true);
  };

  const handleSaveAll = async () => {
    if (!isAdmin) return;
    try {
      let finalData = { ...tempData };
      if (activeTab === 'json') {
        finalData = JSON.parse(rawJsonStr);
      }
      await setDoc(doc(db, 'clippings', 'edicao-5'), { data: finalData });
      setClippingData(finalData);
      setIsEditing(false);
    } catch (e) {
      alert("Erro ao salvar: Verifique se o JSON é válido ou se você tem permissões suficientes.");
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
      newItem.pubDate = "31 de julho de 2026";
      newItem.title = "Nova Decisão Judicial";
      newItem.paragraphs = ["Comentário da decisão aqui. Use **negrito** para destacar."];
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

  return (
    <div className="bg-gray-50 flex-1 w-full min-h-screen pb-16 relative">
      
      {/* Block-by-Block Edit Modal */}
      {isEditing && tempData && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden animate-fadeIn">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-gray-200 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-lg font-bold text-brand-grafite">Editor do Clipping UN Corporate</h2>
                <p className="text-xs text-gray-500">5ª Edição — Julho 2026 (Pesquisa: 1 a 31 de julho de 2026)</p>
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
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-lg text-brand-grafite">Blocos de Jurisprudência ({tempData.jurisprudencia?.length || 0})</h3>
                      <button 
                        onClick={() => handleAddItem('jurisprudencia')}
                        className="bg-brand-grafite hover:bg-brand-grafite/90 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Plus size={14} /> Adicionar Decisão
                      </button>
                    </div>

                    <div className="space-y-4">
                      {tempData.jurisprudencia?.map((item: any, idx: number) => (
                        <div key={item.id} className="border border-gray-200 rounded-xl p-4 bg-slate-50/50 space-y-3 relative">
                          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                            <span className="text-xs font-bold text-brand-grafite">Decisão #{idx + 1}</span>
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => handleMoveItem('jurisprudencia', idx, 'up')}
                                disabled={idx === 0}
                                className="p-1 rounded hover:bg-gray-200 text-gray-500 disabled:opacity-30"
                              >
                                <ArrowUp size={16} />
                              </button>
                              <button 
                                onClick={() => handleMoveItem('jurisprudencia', idx, 'down')}
                                disabled={idx === (tempData.jurisprudencia.length - 1)}
                                className="p-1 rounded hover:bg-gray-200 text-gray-500 disabled:opacity-30"
                              >
                                <ArrowDown size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteItem('jurisprudencia', item.id)}
                                className="p-1 rounded hover:bg-red-50 text-red-500 ml-1"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-bold text-gray-500 uppercase">Processo / Identificador</label>
                              <input 
                                type="text"
                                value={item.subtitle || ""}
                                onChange={(e) => handleFieldChange('jurisprudencia', item.id, 'subtitle', e.target.value)}
                                className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-grafite"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-gray-500 uppercase">Data de Publicação</label>
                              <input 
                                type="text"
                                value={item.pubDate || ""}
                                onChange={(e) => handleFieldChange('jurisprudencia', item.id, 'pubDate', e.target.value)}
                                className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-grafite"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-gray-500 uppercase">Tribunal (Tag)</label>
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
                                className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-grafite bg-white"
                              >
                                <option value="blue">Azul (STJ/Padrão)</option>
                                <option value="rose">Rosa (TJMG)</option>
                                <option value="purple">Roxo (TJSP)</option>
                                <option value="indigo">Índigo (TJRJ)</option>
                                <option value="emerald">Verde</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-gray-500 uppercase">Link da Íntegra (URL)</label>
                              <input 
                                type="text"
                                value={item.link || ""}
                                onChange={(e) => handleFieldChange('jurisprudencia', item.id, 'link', e.target.value)}
                                className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-grafite"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase">Tema / Enunciado</label>
                            <input 
                              type="text"
                              value={item.title || ""}
                              onChange={(e) => handleFieldChange('jurisprudencia', item.id, 'title', e.target.value)}
                              className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-grafite"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase">Comentário (Quebre parágrafos por linha)</label>
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
                  </div>
                )}

                {/* Tab: LEGISLAÇÃO */}
                {activeTab === 'legislacao' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-lg text-brand-grafite">Blocos de Legislação ({tempData.legislacao?.length || 0})</h3>
                      <button 
                        onClick={() => handleAddItem('legislacao')}
                        className="bg-brand-grafite hover:bg-brand-grafite/90 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Plus size={14} /> Adicionar Legislação
                      </button>
                    </div>

                    <div className="space-y-4">
                      {tempData.legislacao?.map((item: any, idx: number) => (
                        <div key={item.id} className="border border-gray-200 rounded-xl p-4 bg-slate-50/50 space-y-3 relative">
                          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                            <span className="text-xs font-bold text-brand-grafite">Legislação #{idx + 1}</span>
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => handleMoveItem('legislacao', idx, 'up')}
                                disabled={idx === 0}
                                className="p-1 rounded hover:bg-gray-200 text-gray-500 disabled:opacity-30"
                              >
                                <ArrowUp size={16} />
                              </button>
                              <button 
                                onClick={() => handleMoveItem('legislacao', idx, 'down')}
                                disabled={idx === (tempData.legislacao.length - 1)}
                                className="p-1 rounded hover:bg-gray-200 text-gray-500 disabled:opacity-30"
                              >
                                <ArrowDown size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteItem('legislacao', item.id)}
                                className="p-1 rounded hover:bg-red-50 text-red-500 ml-1"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-bold text-gray-500 uppercase">Norma / Identificador</label>
                              <input 
                                type="text"
                                value={item.subtitle || ""}
                                onChange={(e) => handleFieldChange('legislacao', item.id, 'subtitle', e.target.value)}
                                className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-grafite"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-gray-500 uppercase">Publicação / Detalhe</label>
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
                              <label className="block text-[11px] font-bold text-gray-500 uppercase">Órgão Emissor (Tag)</label>
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
                  </div>
                )}

                {/* Tab: DOUTRINAS */}
                {activeTab === 'doutrinas' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-lg text-brand-grafite">Doutrinas Selecionadas ({tempData.doutrinas?.length || 0})</h3>
                      <button 
                        onClick={() => handleAddItem('doutrinas')}
                        className="bg-brand-grafite hover:bg-brand-grafite/90 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Plus size={14} /> Adicionar Doutrina
                      </button>
                    </div>

                    <div className="space-y-4">
                      {tempData.doutrinas?.map((item: any, idx: number) => (
                        <div key={item.id} className="border border-gray-200 rounded-xl p-4 bg-slate-50/50 space-y-3 relative">
                          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                            <span className="text-xs font-bold text-brand-grafite">Doutrina #{idx + 1}</span>
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => handleMoveItem('doutrinas', idx, 'up')}
                                disabled={idx === 0}
                                className="p-1 rounded hover:bg-gray-200 text-gray-500 disabled:opacity-30"
                              >
                                <ArrowUp size={16} />
                              </button>
                              <button 
                                onClick={() => handleMoveItem('doutrinas', idx, 'down')}
                                disabled={idx === (tempData.doutrinas.length - 1)}
                                className="p-1 rounded hover:bg-gray-200 text-gray-500 disabled:opacity-30"
                              >
                                <ArrowDown size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteItem('doutrinas', item.id)}
                                className="p-1 rounded hover:bg-red-50 text-red-500 ml-1"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-gray-500 uppercase">Título da Obra / Artigo</label>
                              <input 
                                type="text"
                                value={item.title || ""}
                                onChange={(e) => handleFieldChange('doutrinas', item.id, 'title', e.target.value)}
                                className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-grafite"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-gray-500 uppercase">Autor(es)</label>
                              <input 
                                type="text"
                                value={item.author || ""}
                                onChange={(e) => handleFieldChange('doutrinas', item.id, 'author', e.target.value)}
                                className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-grafite"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase">Link de Acesso (URL)</label>
                            <input 
                              type="text"
                              value={item.link || ""}
                              onChange={(e) => handleFieldChange('doutrinas', item.id, 'link', e.target.value)}
                              className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-grafite"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase">Resumo / Conteúdo</label>
                            <textarea 
                              rows={4}
                              value={item.content || ""}
                              onChange={(e) => handleFieldChange('doutrinas', item.id, 'content', e.target.value)}
                              className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:ring-1 focus:ring-brand-grafite font-sans"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab: JSON */}
                {activeTab === 'json' && (
                  <div className="flex-1 flex flex-col min-h-[400px]">
                    <div className="mb-4">
                      <h3 className="font-bold text-lg text-brand-grafite">Código JSON Bruto</h3>
                      <p className="text-xs text-gray-500">Edição direta da estrutura JSON do documento.</p>
                    </div>
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
                className="px-6 py-2 rounded-lg bg-brand-grafite hover:bg-brand-grafite/90 text-white font-semibold text-sm flex items-center gap-2 transition-colors shadow-sm"
              >
                <Save size={18} />
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
              <span>5ª Edição — Julho 2026 | Pesquisa: 1 a 31 de julho de 2026</span>
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
                        <span className={`${tagBg} text-xs font-bold px-2.5 py-1 rounded`}>{item.tag}</span>
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

      {/* Footer */}
      <footer className="mt-20 pt-8 pb-12 border-t border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="font-bold text-brand-grafite mb-2">Enviado por Madrona Advogados</p>
          <p className="text-sm text-brand-grafite max-w-lg mx-auto">
            Conteúdo para uso exclusivo interno do Madrona Advogados. Não redirecione para contatos externos.
          </p>
        </div>
      </footer>

    </div>
  );
}
