const fs = require('fs');

const content = `import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Pencil, ChevronDown, X, Save, Loader2, CheckCircle2, AlertCircle, Plus, Trash2, Info, Search,
} from 'lucide-react';
import { madronaLabData, MadronaLabItem } from '../data/madronaLabData';
import { db, auth } from '../firebase';
import { doc, getDoc, getDocs, collection, setDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { renderMarkdown } from '../utils/renderMarkdown';

type ServiceOverride = Pick<MadronaLabItem, 'name' | 'description' | 'accessInfo' | 'areas' | 'featureGroups'>;

export default function MadronaLab() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [services, setServices] = useState<MadronaLabItem[]>(madronaLabData);
  const [loadingData, setLoadingData] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ServiceOverride>>({});
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const location = useLocation();

  useEffect(() => {
    const checkAdmin = async (user: User | null) => {
      try {
        if (user?.email && ['madrona.gc@gmail.com'].includes(user.email.toLowerCase())) {
          setIsAdmin(true);
        } else if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          setIsAdmin(userDoc.exists() && userDoc.data().role === 'admin');
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        setIsAdmin(false);
      } finally {
        setLoadingAuth(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, checkAdmin);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function loadOverrides() {
      try {
        const querySnapshot = await getDocs(collection(db, 'madronaLab'));
        const overrides: Record<string, Partial<ServiceOverride>> = {};
        querySnapshot.forEach(docSnap => {
          overrides[docSnap.id] = docSnap.data() as Partial<ServiceOverride>;
        });

        const merged = madronaLabData.map(svc => ({
          ...svc,
          ...overrides[svc.id]
        }));
        setServices(merged);
      } catch (error) {
        console.error("Erro ao carregar madronaLab:", error);
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
    setEditingId(null);
    setEditForm({});
    setSaveStatus('idle');
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
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'madronaLab', editingId), dataToSave, { merge: true });

      setServices(prev => {
        const exists = prev.find(p => p.id === editingId);
        if (exists) {
          return prev.map(p => p.id === editingId ? { ...p, ...dataToSave } : p);
        } else {
          return [...prev, { id: editingId, category: '', ...dataToSave } as MadronaLabItem];
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

  const filteredServices = services
    .filter(s => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        s.name.toLowerCase().includes(term) ||
        (s.description && s.description.toLowerCase().includes(term)) ||
        (s.areas && s.areas.toLowerCase().includes(term))
      );
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex flex-col gap-8 mb-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-blue/10 text-brand-blue text-xs font-bold uppercase tracking-widest mb-3">
            Iniciativas
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0a1e3f] tracking-tight mb-4">
            Madrona Lab
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl leading-relaxed">
            Iniciativas e programas estruturados de Inovação e Gestão do Conhecimento.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar iniciativas por nome, área ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-brand-grafite shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/50 focus:border-brand-blue transition-all"
            />
          </div>
          {isAdmin && (
            <button
              onClick={() => openEdit(null)}
              className="flex items-center justify-center gap-2 bg-brand-blue text-white px-5 py-3.5 rounded-2xl font-bold hover:bg-opacity-90 transition-all shadow-sm flex-shrink-0"
            >
              <Plus size={20} />
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map(service => {
              const isOpen = expandedId === service.id;
              
              return (
                <div
                  key={service.id}
                  id={\`svc-\${service.id}\`}
                  onClick={() => setExpandedId(isOpen ? null : service.id)}
                  className={\`bg-white border rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer \${
                    isOpen ? 'border-brand-blue shadow-md' : 'border-gray-200 hover:border-brand-blue/50 hover:shadow-sm'
                  }\`}
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
                          {service.description.replace(/\\*\\*/g, '')}
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
                        <ChevronDown size={20} className={\`transition-transform duration-200 \${isOpen ? 'rotate-180' : ''}\`} />
                      </div>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="px-6 pb-6 border-t border-gray-100 animate-[fadeIn_0.15s_ease-out] cursor-default" onClick={e => e.stopPropagation()}>
                      <div className="mt-5 mb-6">
                        <p className="text-sm text-brand-navy font-bold uppercase tracking-wider mb-2">O que é</p>
                        <p className="text-base text-brand-grafite leading-relaxed whitespace-pre-wrap">
                          {renderMarkdown(service.description)}
                        </p>
                      </div>

                      {service.featureGroups && service.featureGroups.length > 0 && (
                        <div className="mb-6">
                          <p className="text-sm text-brand-navy font-bold uppercase tracking-wider mb-3">Principais informações</p>
                          <div className="space-y-4">
                            {service.featureGroups.map((group, gi) => (
                              <div key={gi}>
                                {group.title.trim() && (
                                  <p className="text-base font-semibold text-brand-grafite mb-2">{group.title}</p>
                                )}
                                {group.items.length > 0 && (
                                  <ul className="space-y-2">
                                    {group.items.map((item, ii) => (
                                      <li key={ii} className="flex items-start gap-2.5 text-base text-gray-600 leading-relaxed">
                                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-brand-blue flex-shrink-0" />
                                        {renderMarkdown(item)}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className={\`grid gap-6 mt-2 pt-5 border-t border-gray-100 \${service.areas ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}\`}>
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
              <div className="text-sm min-h-[20px]">
                {saveStatus === 'success' && <span className="flex items-center gap-1.5 text-green-600"><CheckCircle2 size={14} /> Salvo</span>}
                {saveStatus === 'error' && <span className="flex items-center gap-1.5 text-red-600"><AlertCircle size={14} /> Erro ao salvar</span>}
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
  );
}
`;

fs.writeFileSync('src/pages/MadronaLab.tsx', content);
console.log('MadronaLab replaced completely.');
