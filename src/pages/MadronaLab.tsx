import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Pencil, ChevronDown, X, Save, Loader2, CheckCircle2, AlertCircle, Plus, Trash2, Info,
} from 'lucide-react';
import { madronaLabData, MadronaLabItem } from '../data/madronaLabData';
import { db, auth } from '../firebase';
import { doc, getDoc, getDocs, collection, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { renderMarkdown } from '../utils/renderMarkdown';

type ServiceOverride = Pick<MadronaLabItem, 'name' | 'description' | 'accessInfo' | 'areas' | 'featureGroups'>;


// ──────────────────────────────────────────────────────────────────────────
// Emails com permissão de edição
// ──────────────────────────────────────────────────────────────────────────
const ADMIN_EMAILS = [
  'carnivalofdisgustblog@gmail.com',
  'gc.madronafialho@gmail.com',
  'andrezzasoares08@gmail.com',
  'amandacarvaleite@gmail.com',
  'madrona.gc@gmail.com',
];

function checkIsAdmin(user: User | null): boolean {
  return !!(user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()));
}

export default function MadronaLab() {
  const [user, setUser] = useState<User | null>(null);
  const isAdmin = checkIsAdmin(user);

  const [services, setServices] = useState<MadronaLabItem[]>(madronaLabData);
  const [loadingData, setLoadingData] = useState(true);

    const [expandedId, setExpandedId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ServiceOverride>>({});
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);


  const location = useLocation();

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    async function loadOverrides() {
      try {
        const querySnapshot = await getDocs(collection(db, 'madronaLab'));
        const overrides: Record<string, any> = {};
        querySnapshot.forEach(docSnap => {
          overrides[docSnap.id] = docSnap.data();
        });

        const merged = madronaLabData.map(svc => ({
          ...svc,
          ...(overrides[svc.id] ?? {})
        })).filter(svc => svc.id !== 'pesquisas-estrategicas');

        const baseIds = new Set(madronaLabData.map(s => s.id));
        querySnapshot.forEach(docSnap => {
          if (docSnap.id !== 'pesquisas-estrategicas' && !baseIds.has(docSnap.id)) {
            merged.push({ id: docSnap.id, ...docSnap.data() } as MadronaLabItem);
          }
        });

        setServices(merged);
      } catch (error) {
        console.warn('[MadronaLab] erro ao carregar do Firestore:', error);
      } finally {
        setLoadingData(false);
      }
    }
    loadOverrides();
  }, []);

  useEffect(() => {
    if (location.hash && !loadingData) {
      setTimeout(() => {
        const id = location.hash.substring(1);
        const el = document.getElementById(id);
        if (el) {
          const y = el.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({ top: y, behavior: 'smooth' });
          if (id.startsWith('svc-')) {
            const svcId = id.replace('svc-', '');
            setExpandedId(svcId);
          }
        }
      }, 100);
    }
  }, [loadingData, location.hash]);

  const openEdit = (service: MadronaLabItem | null) => {
    if (service) {
      setEditingId(service.id);
      setEditForm({
        name:          service.name,
        description:   service.description || '',
        accessInfo:    service.accessInfo || '',
        areas:         service.areas || '',
        featureGroups: service.featureGroups ? JSON.parse(JSON.stringify(service.featureGroups)) : [],
      });
    } else {
      setEditingId('new-' + Date.now());
      setEditForm({
        name: '',
        description: '',
        accessInfo: '',
        areas: '',
        featureGroups: [],
      });
    }
    setSaveStatus('idle');
  };

  const closeEdit = () => {
    if (saving) return;
    setEditingId(null);
    setEditForm({});
    setSaveStatus('idle');
    setShowConfirmDelete(false);
  };

    const handleDelete = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      await deleteDoc(doc(db, 'madronaLab', editingId));
      setServices(prev => prev.filter(s => s.id !== editingId));
      closeEdit();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      setSaveStatus('error');
      setSaving(false);
    }
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    setSaveStatus('idle');

    try {
      const dataToSave: any = {
        name: editForm.name,
        description: editForm.description,
        accessInfo: editForm.accessInfo,
        areas: editForm.areas,
        featureGroups: editForm.featureGroups || [],
      };

      await setDoc(
        doc(db, 'madronaLab', editingId),
        {
          ...dataToSave,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setServices(prev => {
        const exists = prev.find(p => p.id === editingId);
        if (exists) {
          return prev.map(p => p.id === editingId ? { ...p, ...dataToSave } : p);
        } else {
          return [...prev, { id: editingId, ...dataToSave } as MadronaLabItem];
        }
      });
      setSaveStatus('success');
      setTimeout(closeEdit, 1500);
    } catch (error) {
      console.error('Erro ao salvar no Firestore:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const PREFERRED_ORDER = [
    'madrona-lex-juris',
    'madrona-lab-coins',
    'academia-madrona',
    'madrona-research',
    'grupo-de-debates'
  ];

  const filteredServices = [...services].sort((a, b) => {
    const idxA = PREFERRED_ORDER.indexOf(a.id);
    const idxB = PREFERRED_ORDER.indexOf(b.id);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 flex flex-col w-full">
      <div className="max-w-7xl mx-auto w-full">
      <div className="flex flex-col gap-8 mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#0a1e3f] tracking-tight">Madrona Lab</h1>
            <p className="text-brand-grafite mt-1 max-w-3xl">
              Iniciativa de Gestão do Conhecimento, o Madrona Lab é o programa interno de desenvolvimento profissional, disseminação de conhecimento e padronização do escritório. Seus objetivos são capacitar os profissionais do escritório, incentivar a pesquisa jurídica e técnica, disseminar conhecimento entre as equipes e unidades de negócio, padronizar procedimentos e documentos internos e gerar oportunidades de negócios para os clientes do escritório, inclusive antecipando tendências.
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => openEdit(null)}
              className="inline-flex items-center gap-2 bg-brand-blue text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              Nova Iniciativa
            </button>
          )}
        </div>
        </div>
      <div className="min-h-[400px]">
        {loadingData && (
          <div className="flex items-center justify-center gap-2 text-brand-grafite text-base py-6">
            <Loader2 size={18} className="animate-spin" />
            Carregando informações atualizadas...
          </div>
        )}
        
        {!loadingData && filteredServices.length > 0 && (
          <div className="flex flex-col gap-4">
            {filteredServices.map(service => {
              const isOpen = expandedId === service.id;
              
              return (
                <div
                  key={service.id}
                  id={`svc-${service.id}`}
                  onClick={() => setExpandedId(isOpen ? null : service.id)}
                  className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer ${
                    isOpen ? 'border-brand-blue shadow-md' : 'border-gray-200 hover:border-brand-blue/50 hover:shadow-sm'
                  }`}
                >
                  <div className="p-5 flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-3">
                        <span className="font-bold text-brand-blue text-xl">
                          {service.name}
                        </span>
                      </div>
                      {!isOpen && service.description && (
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                          {service.description.replace(/\*\*/g, '')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isAdmin && (
                        <button
                          onClick={e => { e.stopPropagation(); openEdit(service); }}
                          className="p-2 rounded-xl text-gray-400 hover:text-brand-blue hover:bg-blue-50 transition-colors"
                          title="Editar informações"
                        >
                          <Pencil size={18} />
                        </button>
                      )}
                      <div className="p-2 text-gray-400">
                        <ChevronDown size={20} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="px-6 pb-6 border-t border-gray-100 animate-[fadeIn_0.15s_ease-out] cursor-default" onClick={e => e.stopPropagation()}>
                      {service.description && (
                        <div className="mt-5 mb-6">
                          <p className="text-sm text-brand-navy font-bold uppercase tracking-wider mb-2">O que é</p>
                          <p className="text-base text-brand-grafite leading-relaxed whitespace-pre-wrap">
                            {renderMarkdown(service.description)}
                          </p>
                        </div>
                      )}

                      {service.featureGroups && service.featureGroups.some(g => g.title.trim() || g.items.some(i => i.trim() !== '')) && (
                        <div className="mb-6">
                          <p className="text-sm text-brand-navy font-bold uppercase tracking-wider mb-3">Principais informações</p>
                          <div className="space-y-4">
                            {service.featureGroups.map((group, gi) => {
                              const validItems = group.items.filter(i => i.trim() !== '');
                              if (!group.title.trim() && validItems.length === 0) return null;
                              return (
                                <div key={gi}>
                                  {group.title.trim() && (
                                    <p className="text-base font-semibold text-brand-grafite mb-2">{group.title}</p>
                                  )}
                                  {validItems.length > 0 && (
                                    <ul className="space-y-2">
                                      {validItems.map((item, ii) => (
                                        <li key={ii} className="flex items-start gap-2.5 text-base text-gray-600 leading-relaxed">
                                          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-blue flex-shrink-0" />
                                          {renderMarkdown(item)}
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {(service.areas || service.accessInfo) && (
                        <div className={`grid gap-6 mt-2 pt-5 border-t border-gray-100 ${service.areas ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                          {service.areas && (
                            <div>
                              <p className="text-sm text-brand-navy font-bold uppercase tracking-wider mb-2">Áreas envolvidas</p>
                              <p className="text-base text-brand-grafite">{renderMarkdown(service.areas)}</p>
                            </div>
                          )}
                          {service.accessInfo && (
                            <div>
                              <p className="text-sm text-brand-navy font-bold uppercase tracking-wider mb-2">Como acessar</p>
                              <p className="text-base text-brand-grafite whitespace-pre-wrap">{renderMarkdown(service.accessInfo)}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editingId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-navy/60 backdrop-blur-sm transition-opacity" onClick={closeEdit} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl relative z-10 flex flex-col max-h-[90vh] animate-[scaleIn_0.2s_ease-out]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-[#0a1e3f] flex items-center gap-2">
                <Pencil size={18} className="text-brand-blue" />
                Editar Iniciativa
              </h2>
              <button onClick={closeEdit} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-brand-grafite uppercase tracking-widest mb-1.5">
                  Nome da Iniciativa
                </label>
                <input
                  type="text"
                  value={editForm.name ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-grafite uppercase tracking-widest mb-1.5">
                  Descrição (Suporta Markdown: **negrito** e links [texto](url))
                </label>
                <textarea
                  rows={4}
                  value={editForm.description ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue resize-y"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-grafite uppercase tracking-widest mb-1.5">
                  Como Acessar / Links
                </label>
                <textarea
                  rows={2}
                  value={editForm.accessInfo ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, accessInfo: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue resize-y"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-brand-grafite uppercase tracking-widest mb-1.5">
                  Áreas Envolvidas
                </label>
                <input
                  type="text"
                  value={editForm.areas ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, areas: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>
            </div>

            
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
              <div className="flex items-center gap-4">
                {editingId && !editingId.startsWith('new-') && !showConfirmDelete && (
                  <button
                    onClick={() => setShowConfirmDelete(true)}
                    disabled={saving}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                {showConfirmDelete && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-red-600 font-medium mr-2">Excluir?</span>
                    <button
                      onClick={() => setShowConfirmDelete(false)}
                      disabled={saving}
                      className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={saving}
                      className="px-3 py-1.5 text-sm font-medium bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
                    >
                      Confirmar
                    </button>
                  </div>
                )}
                <div className="text-sm min-h-[20px] ml-4">
                  {saveStatus === 'success' && <span className="flex items-center gap-1.5 text-green-600"><CheckCircle2 size={14} /> Salvo</span>}
                  {saveStatus === 'error' && <span className="flex items-center gap-1.5 text-red-600"><X size={14} /> Erro ao salvar</span>}
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={closeEdit} disabled={saving} className="px-4 py-2 text-sm rounded-lg text-gray-600 hover:bg-gray-200 transition-colors">Cancelar</button>
                <button onClick={saveEdit} disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-brand-blue text-white hover:opacity-90 flex items-center gap-1.5">
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
