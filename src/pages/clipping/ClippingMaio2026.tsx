import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, ExternalLink, Scale, FileText, CheckCircle2, ChevronDown, ChevronUp, Edit2, Save, X, Plus, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db, auth, handleFirestoreError, OperationType } from '../../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { defaultClippingMaioData } from './clippingMaioData';

export default function ClippingMaio2026() {
  const [openSections, setOpenSections] = useState({
    jurisprudencia: true,
    legislacao: true,
    doutrinas: true,
    relatorios: true
  });

  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [clippingData, setClippingData] = useState<any>(defaultClippingMaioData);
  const [editDataStr, setEditDataStr] = useState("");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setIsAdmin(true); 
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const docRef = doc(db, 'clippings', 'maio-2026');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setClippingData(docSnap.data().data);
      } else {
        setClippingData(defaultClippingMaioData);
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
    setEditDataStr(JSON.stringify(clippingData, null, 2));
    setIsEditing(true);
  };

  const handleSaveDoc = async () => {
    try {
      let parsed = JSON.parse(editDataStr);
      await setDoc(doc(db, 'clippings', 'maio-2026'), { data: parsed });
      setIsEditing(false);
    } catch (e) {
      alert("JSON inválido ou erro de permissão.");
    }
  };

  return (
    <div className="flex-1 bg-gray-50 w-full min-h-screen pb-12 relative">
      {/* Edit Mode Overlay */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h2 className="text-lg font-bold text-brand-grafite">Editar Conteúdo (JSON)</h2>
              <button onClick={() => setIsEditing(false)} className="text-brand-grafite hover:text-red-500">
                <X size={24} />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-hidden flex flex-col">
              <p className="text-sm text-brand-grafite mb-2">Edite os links, títulos e textos diretamente no objeto JSON abaixo:</p>
              <textarea 
                value={editDataStr}
                onChange={(e) => setEditDataStr(e.target.value)}
                className="w-full flex-1 border border-gray-300 rounded-lg p-4 font-mono text-xs focus:ring-brand-grafite focus:border-brand-grafite"
              />
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
              <button 
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-lg text-brand-grafite hover:bg-slate-200 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveDoc}
                className="px-6 py-2 rounded-lg bg-brand-grafite hover:bg-brand-grafite/90 text-white font-medium flex items-center gap-2 transition-colors"
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
              <span>2ª Edição — Maio 2026</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-20 z-10 shadow-sm overflow-x-auto">
        <div className="max-w-4xl mx-auto px-4 min-w-max sm:min-w-0">
          <div className="flex items-center gap-6 whitespace-nowrap py-4 justify-start sm:justify-center text-sm font-medium">
            <a href="#jurisprudencia" className="text-brand-grafite hover:text-brand-grafite transition-colors">Jurisprudência Comentada</a>
            <a href="#legislacao" className="text-brand-grafite hover:text-brand-grafite transition-colors">Legislação Comentada</a>
            <a href="#doutrinas" className="text-brand-grafite hover:text-brand-grafite transition-colors">Doutrinas Selecionadas</a>
            <a href="#relatorios" className="text-brand-grafite hover:text-brand-grafite transition-colors">Relatórios</a>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 space-y-12">
        
        {/* SEÇÃO 1 */}
        {clippingData?.jurisprudencia && (
          <section id="jurisprudencia" className="scroll-mt-40">
            <button 
              onClick={() => toggleSection('jurisprudencia')}
              className="w-full bg-brand-grafite text-white py-3 px-6 rounded-t-xl border-b-4 border-brand-blue flex items-center justify-between gap-3 transition-colors hover:bg-brand-grafite/90"
            >
              <div className="flex items-center gap-3">
                <Scale size={20} className="text-brand-grafite" />
                <h2 className="text-xl font-bold uppercase tracking-wide">Jurisprudência Comentada</h2>
              </div>
              {openSections.jurisprudencia ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            
            {openSections.jurisprudencia && (
            <div className="pt-6 space-y-6">
              {clippingData.jurisprudencia.map((item: any) => (
                <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 hover:shadow-md transition-shadow">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className={`bg-${item.tagColor}-100 text-${item.tagColor}-800 text-xs font-bold px-2.5 py-1 rounded`}>{item.tag}</span>
                    <span className="text-sm font-bold font-serif text-brand-grafite">{item.subtitle}</span>
                  </div>
                  <h3 className="text-xl font-bold text-brand-grafite mb-4 leading-tight">{item.title}</h3>
                  <div className="prose prose-sm text-brand-grafite mb-6 space-y-4">
                    {item.paragraphs?.map((p: string, i: number) => (
                      <p key={i}>
                        {i === 0 && <span className="font-bold">Comentário: </span>}
                        {p}
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
              ))}
            </div>
            )}
          </section>
        )}

        {/* SEÇÃO 2 */}
        {clippingData?.legislacao && (
          <section id="legislacao" className="scroll-mt-40">
            <button 
              onClick={() => toggleSection('legislacao')}
              className="w-full bg-brand-grafite text-white py-3 px-6 rounded-t-xl border-b-4 border-brand-yellow flex items-center justify-between gap-3 transition-colors hover:bg-brand-grafite/90"
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
                    <span className={`bg-${item.tagColor}-100 text-${item.tagColor}-800 text-xs font-bold px-2.5 py-1 rounded`}>{item.tag}</span>
                    <span className="text-sm font-bold font-serif text-brand-grafite">{item.subtitle}</span>
                  </div>
                  <h3 className="text-xl font-bold text-brand-grafite mb-4 leading-tight">{item.title}</h3>
                  <div className="prose prose-sm text-brand-grafite mb-6 space-y-4">
                    {item.paragraphs?.map((p: string, i: number) => (
                      <p key={i}>
                        {i === 0 && <span className="font-bold">Comentário: </span>}
                        {p}
                      </p>
                    ))}
                  </div>
                  {item.link && (
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-brand-grafite hover:bg-brand-grafite/90 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors text-sm w-full sm:w-auto">
                      Acesse a íntegra do parecer
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              ))}

              {clippingData.outrosNormativos && clippingData.outrosNormativos.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-bold text-brand-grafite mb-6 pb-4 border-b border-gray-100">
                    Outros normativos publicados no período
                  </h3>
                  <ul className="space-y-4">
                    {clippingData.outrosNormativos.map((item: any) => (
                      <li key={item.id} className="flex gap-3">
                        <CheckCircle2 size={18} className="text-brand-grafite flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-brand-grafite">
                          <a href={item.link} target="_blank" rel="noopener noreferrer" className="font-bold hover:text-brand-grafite transition-colors">{item.title}</a> — {item.description}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            )}
          </section>
        )}

        {/* SEÇÃO 3 */}
        {clippingData?.doutrinas && (
          <section id="doutrinas" className="scroll-mt-40">
            <button 
              onClick={() => toggleSection('doutrinas')}
              className="w-full bg-brand-grafite text-white py-3 px-6 rounded-t-xl border-b-4 border-brand-green flex items-center justify-between gap-3 transition-colors hover:bg-brand-grafite/90"
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
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded">{item.tag}</span>
                  </div>
                  <h3 className="text-lg font-bold text-brand-grafite mb-2 leading-tight">{item.title}</h3>
                  <p className="text-sm font-medium text-brand-grafite mb-4">{item.author}</p>
                  <p className="text-sm text-brand-grafite flex-1 mb-6">
                    <span className="font-bold">Resumo: </span>{item.content}
                  </p>
                  {item.link && (
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-brand-grafite hover:text-brand-grafite/80 text-sm font-bold transition-colors">
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

        {/* SEÇÃO 4 */}
        {clippingData?.relatorios && (
          <section id="relatorios" className="scroll-mt-40">
            <button 
              onClick={() => toggleSection('relatorios')}
              className="w-full bg-brand-grafite text-white py-3 px-6 rounded-t-xl border-b-4 border-brand-red flex items-center justify-between gap-3 transition-colors hover:bg-brand-grafite/90"
            >
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-fuchsia-500" />
                <h2 className="text-xl font-bold uppercase tracking-wide">Relatórios</h2>
              </div>
              {openSections.relatorios ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            
            {openSections.relatorios && (
            <div className="pt-6 space-y-6">
              {clippingData.relatorios.map((item: any) => (
                <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 hover:shadow-md transition-shadow">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="text-sm font-bold text-fuchsia-600 bg-fuchsia-50 px-2.5 py-1 rounded">{item.tag}</span>
                  </div>
                  <h3 className="text-xl font-bold text-brand-grafite mb-4 leading-tight">{item.title}</h3>
                  <div className="prose prose-sm text-brand-grafite mb-6 space-y-4">
                    {item.paragraphs?.length ? (
                      item.paragraphs.map((p: string, i: number) => (
                        <p key={i}>
                          {i === 0 && <span className="font-bold">Comentário: </span>}
                          {p}
                        </p>
                      ))
                    ) : (
                      <p><span className="font-bold">Comentário: </span>{item.content}</p>
                    )}
                  </div>
                  {item.link && (
                    <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-brand-grafite hover:bg-brand-grafite/90 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors text-sm w-full sm:w-auto">
                      Leia a íntegra do relatório
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
              ))}
            </div>
            )}
          </section>
        )}

      </div>

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
